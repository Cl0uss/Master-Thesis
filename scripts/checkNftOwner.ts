import fs from "node:fs";
import { Connection, PublicKey } from "@solana/web3.js";

function resolveRpcUrl(arg?: string): string {
    if (!arg) {
        const config = JSON.parse(
            fs.readFileSync("config/rpc-config.json", "utf8")
        );

        return config.rpcUrl;
    }

    if (arg.startsWith("http")) {
        return arg;
    }

    const config = JSON.parse(
        fs.readFileSync(arg, "utf8")
    );

    return config.rpcUrl;
}

async function withRetry<T>(
    label: string,
    fn: () => Promise<T>,
    attempts = 3
): Promise<T> {
    let lastError: unknown;

    for (let i = 1; i <= attempts; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (i < attempts) {
                const delayMs = i * 1000;

                console.error(
                    `${label} failed. Retrying in ${delayMs}ms...`
                );

                await new Promise((resolve) =>
                    setTimeout(resolve, delayMs)
                );
            }
        }
    }

    throw lastError;
}

export async function getNftOwner(
    mintAddress: string,
    rpcUrlArg?: string
): Promise<string> {
    const rpcUrl = resolveRpcUrl(rpcUrlArg);

    const connection = new Connection(
        rpcUrl,
        "confirmed"
    );

    const mint = new PublicKey(mintAddress);

    const largestAccounts = await withRetry(
        "getTokenLargestAccounts",
        () => connection.getTokenLargestAccounts(mint)
    );

    const largestAccount = largestAccounts.value.find(
        (account) => account.amount === "1"
    );

    if (!largestAccount) {
        throw new Error(
            "NFT owner not found."
        );
    }

    const accountInfo = await withRetry(
        "getParsedAccountInfo",
        () =>
            connection.getParsedAccountInfo(
                largestAccount.address
            )
    );

    const parsedData: any = accountInfo.value?.data;

    const owner =
        parsedData?.parsed?.info?.owner;

    if (!owner) {
        throw new Error(
            "Token account owner could not be parsed."
        );
    }

    return owner;
}

async function main(): Promise<void> {
    const mintAddress = process.argv[2];
    const rpcUrl = process.argv[3];

    if (!mintAddress) {
        console.error(
            "Usage: npx tsx scripts/checkNftOwner.ts <mintAddress> [rpcUrl|rpcConfigPath]"
        );

        process.exit(1);
    }

    console.log(
        "[Owner check] Using RPC:",
        resolveRpcUrl(rpcUrl)
    );

    console.log(
        "[Owner check] NFT mint:",
        mintAddress
    );

    const owner = await getNftOwner(
        mintAddress,
        rpcUrl
    );

    console.log("NFT found.");
    console.log("Mint:", mintAddress);
    console.log("Owner:", owner);
}

const isExecutedDirectly =
    process.argv[1] &&
    process.argv[1].endsWith("checkNftOwner.ts");

if (isExecutedDirectly) {
    main().catch((error) => {
        console.error("Owner check failed:");
        console.error(error);
        process.exit(1);
    });
}
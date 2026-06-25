import fs from "node:fs";
import { Connection, PublicKey } from "@solana/web3.js";

function resolveRpcUrl(arg?: string): string {
    if (!arg) {
        const config = JSON.parse(fs.readFileSync("config/app-config.json", "utf8"));
        return config.rpcUrl;
    }

    if (arg.startsWith("http")) {
        return arg;
    }

    const config = JSON.parse(fs.readFileSync(arg, "utf8"));
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
                console.error(`${label} failed. Retrying in ${delayMs}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }

    throw lastError;
}

async function main(): Promise<void> {
    const mintAddress = process.argv[2];
    const rpcUrl = resolveRpcUrl(process.argv[3]);

    if (!mintAddress) {
        console.error("Usage: npx tsx scripts/checkNftOwner.ts <mintAddress> [rpcUrl|configPath]");
        process.exit(1);
    }

    console.log("[Owner check] Using RPC:", rpcUrl);
    console.log("[Owner check] NFT mint:", mintAddress);

    const connection = new Connection(rpcUrl, "confirmed");
    const mint = new PublicKey(mintAddress);

    console.log("[Owner check] Getting largest token account...");

    const largestAccounts = await withRetry(
        "getTokenLargestAccounts",
        () => connection.getTokenLargestAccounts(mint)
    );

    const largestAccount = largestAccounts.value.find((account) => {
        return account.amount === "1";
    });

    if (!largestAccount) {
        console.log("NFT owner not found.");
        process.exit(1);
    }

    console.log("[Owner check] Reading token account owner...");

    const accountInfo = await withRetry(
        "getParsedAccountInfo",
        () => connection.getParsedAccountInfo(largestAccount.address)
    );

    const parsedData: any = accountInfo.value?.data;

    if (!parsedData?.parsed?.info?.owner) {
        console.log("Token account found, but owner could not be parsed.");
        console.log("Token account:", largestAccount.address.toBase58());
        process.exit(1);
    }

    const owner = parsedData.parsed.info.owner;

    console.log("NFT found.");
    console.log("Mint:", mintAddress);
    console.log("Owner:", owner);
    console.log("Token account:", largestAccount.address.toBase58());
    console.log("Amount:", largestAccount.amount);
}

main().catch((error) => {
    console.error("Owner check failed:");
    console.error(error);
    process.exit(1);
});
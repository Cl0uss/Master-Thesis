import fs from "node:fs";
import path from "node:path";

import { Uploader } from "@irys/upload";
import { Solana } from "@irys/upload-solana";

import { loadConfig, resolveConfigPath } from "./config.js";

// Reusable function that uploads a file and returns its gateway URI.
export async function uploadFile(
    filePath: string,
    walletPathOverride?: string
): Promise<string> {

    const config = loadConfig();

    const walletPath =
        walletPathOverride ??
        resolveConfigPath(config.walletPath);

    console.error(`[Irys] Reading wallet: ${walletPath}`);

    const wallet = JSON.parse(
        fs.readFileSync(walletPath, "utf8")
    );

    console.error(`[Irys] Reading file: ${filePath}`);

    const data = fs.readFileSync(filePath);

    console.error(
        `[Irys] File size: ${data.length} bytes`
    );

    console.error(
        "[Irys] Initializing Solana uploader..."
    );

    const irys = await Uploader(Solana)
        .withWallet(wallet);

    console.error(
        "[Irys] Requesting upload price..."
    );

    const price = await irys.getPrice(data.length);

    console.error(
        "[Irys] Checking Irys balance..."
    );

    const balance = await irys.getBalance();

    const buffer =
        irys.utils.toAtomic(
            config.irysFundingBufferSol
        );

    const requiredBalance =
        price.plus(buffer);

    console.error(
        "Upload price:",
        irys.utils.fromAtomic(price).toString(),
        "SOL"
    );

    console.error(
        "Irys balance:",
        irys.utils.fromAtomic(balance).toString(),
        "SOL"
    );

    console.error(
        "Required balance:",
        irys.utils
            .fromAtomic(requiredBalance)
            .toString(),
        "SOL"
    );

    if (balance.lt(requiredBalance)) {

        const fundAmount =
            requiredBalance.minus(balance);

        console.error(
            "Funding Irys balance with",
            irys.utils
                .fromAtomic(fundAmount)
                .toString(),
            "SOL..."
        );

        const fundResult =
            await irys.fund(fundAmount);

        console.error(
            "[Irys] Fund successful:"
        );

        console.error(fundResult);

    } else {

        console.error(
            "[Irys] Existing balance is sufficient. Funding skipped."
        );
    }

    console.error(
        "[Irys] Uploading data..."
    );

    const receipt =
        await irys.upload(data, {
            tags: [
                {
                    name: "Content-Type",
                    value: getContentType(filePath)
                },
                {
                    name: "App-Name",
                    value: config.appName
                },
                {
                    name: "Storage-Layer",
                    value: "Irys"
                }
            ]
        });

    console.error(
        "[Irys] Upload completed."
    );

    return `${config.irysGatewayUrl}/${receipt.id}`;
}

// Derives the Content-Type tag from the file extension.
function getContentType(
    filePath: string
): string {

    const ext =
        path.extname(filePath)
            .toLowerCase();

    switch (ext) {

        case ".mp3":
            return "audio/mpeg";

        case ".wav":
            return "audio/wav";

        case ".png":
            return "image/png";

        case ".jpg":
        case ".jpeg":
            return "image/jpeg";

        case ".webp":
            return "image/webp";

        case ".json":
            return "application/json";

        case ".pdf":
            return "application/pdf";

        default:
            return "application/octet-stream";
    }
}

// CLI wrapper.
async function main(): Promise<void> {

    const filePath =
        process.argv[2];

    const walletPath =
        process.argv[3];

    if (!filePath) {

        console.error(
            "Usage: npx tsx scripts/uploadToIrys.ts <filePath> [walletPath]"
        );

        process.exit(1);
    }

    const uri =
        await uploadFile(
            filePath,
            walletPath
        );

    console.log(uri);
}

const isExecutedDirectly =
    process.argv[1] &&
    path.resolve(process.argv[1]) ===
    path.resolve(new URL(import.meta.url).pathname);

if (isExecutedDirectly) {
    main().catch((error) => {
        console.error("Irys upload failed:");
        console.error(error);
        process.exit(1);
    });
}
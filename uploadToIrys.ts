import fs from "node:fs";
import path from "node:path";

import { Uploader } from "@irys/upload";
import { Solana } from "@irys/upload-solana";

async function main(): Promise<void> {
    const filePath = process.argv[2];
    const walletPath = process.argv[3];

    if (!filePath || !walletPath) {
        console.error(
            "Usage: npx tsx uploadToIrys.ts <filePath> <walletPath>"
        );
        process.exit(1);
    }

    const wallet = JSON.parse(fs.readFileSync(walletPath, "utf8"));
    const data = fs.readFileSync(filePath);

    const irys = await Uploader(Solana).withWallet(wallet);

    const receipt = await irys.upload(data, {
        tags: [
            {
                name: "Content-Type",
                value: getContentType(filePath)
            },
            {
                name: "App-Name",
                value: "Master-Thesis"
            },
            {
                name: "Storage-Layer",
                value: "Irys"
            }
        ]
    });

    console.log(`https://gateway.irys.xyz/${receipt.id}`);
}

function getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

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
        case ".json":
            return "application/json";
        case ".pdf":
            return "application/pdf";
        default:
            return "application/octet-stream";
    }
}

main().catch((error) => {
    console.error("Irys upload failed:");
    console.error(error);
    process.exit(1);
});
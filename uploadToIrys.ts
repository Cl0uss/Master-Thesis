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

    const wallet = JSON.parse(
        fs.readFileSync(walletPath, "utf8")
    );

    const data = fs.readFileSync(filePath);

    const irys = await Uploader(Solana).withWallet(wallet);

    const price = await irys.getPrice(data.length);
    const balance = await irys.getBalance();

    const buffer = irys.utils.toAtomic("0.00001");
    const requiredBalance = price.plus(buffer);

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
        irys.utils.fromAtomic(requiredBalance).toString(),
        "SOL"
    );

    if (balance.lt(requiredBalance)) {

        const fundAmount = requiredBalance.minus(balance);

        console.error(
            "Funding Irys balance with",
            irys.utils.fromAtomic(fundAmount).toString(),
            "SOL..."
        );

        const fundResult = await irys.fund(fundAmount);

        console.error("Fund successful:");
        console.error(fundResult);
    }

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
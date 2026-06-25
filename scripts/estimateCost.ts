import fs from "node:fs";
import path from "node:path";

import { Uploader } from "@irys/upload";
import { Solana } from "@irys/upload-solana";

import { loadConfig, resolveConfigPath } from "./config.js";

// Estimates asset, cover, metadata, and mint costs before running the pipeline.
const config = loadConfig();
const filePath = process.argv[2];
const walletPath = process.argv[3] ?? resolveConfigPath(config.walletPath);

if (!filePath) {
    console.error("Usage: npx tsx scripts/estimateCost.ts <filePath> [walletPath]");
    process.exit(1);
}

// Load wallet because Irys price utilities require an authenticated uploader.
const wallet = JSON.parse(fs.readFileSync(walletPath, "utf8"));
const irys = await Uploader(Solana).withWallet(wallet);

const assetSize = fs.statSync(filePath).size;
const assetPrice = await irys.getPrice(assetSize);

const ext = path.extname(filePath).toLowerCase();
const baseName = path.basename(filePath, ext);

let coverPrice = irys.utils.toAtomic("0");
let coverPath: string | null = null;

// Audio and document assets may include a cover upload in the total cost.
if (ext === ".mp3" || ext === ".wav" || ext === ".pdf") {
    const possibleCoverPath = path.join(
        config.coverDirectory,
        `${baseName}${config.coverExtension}`
    );

    if (fs.existsSync(possibleCoverPath)) {
        coverPath = possibleCoverPath;
        const coverSize = fs.statSync(possibleCoverPath).size;
        coverPrice = await irys.getPrice(coverSize);
    }
}

// Add configured estimates for generated metadata size and Solana mint cost.
const metadataPrice = await irys.getPrice(config.estimatedMetadataSizeBytes);
const estimatedMintCost = irys.utils.toAtomic(config.estimatedMintCostSol);

const total = assetPrice
    .plus(coverPrice)
    .plus(metadataPrice)
    .plus(estimatedMintCost);

console.log("----------------------------------");
console.log("Estimated cost before execution");
console.log("----------------------------------");
console.log("Asset file:", filePath);
console.log("Asset upload:", irys.utils.fromAtomic(assetPrice).toString(), "SOL");

if (coverPath) {
    console.log("Cover file:", coverPath);
    console.log("Cover upload:", irys.utils.fromAtomic(coverPrice).toString(), "SOL");
} else {
    console.log("Cover file: not used");
}

console.log("Metadata upload:", irys.utils.fromAtomic(metadataPrice).toString(), "SOL");
console.log("NFT mint estimate:", irys.utils.fromAtomic(estimatedMintCost).toString(), "SOL");
console.log("----------------------------------");
console.log("Estimated total:", irys.utils.fromAtomic(total).toString(), "SOL");
console.log("----------------------------------");

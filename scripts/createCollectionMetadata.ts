import fs from "node:fs";
import path from "node:path";

import { loadConfig } from "./config.js";
import { uploadFile } from "./uploadToIrys.js";

export async function createCollectionMetadata(): Promise<string> {
    const config = loadConfig();

    const coverFile = config.collectionCoverFile;

    console.log("[Collection Metadata] Uploading collection cover...");

    const coverUri = await uploadFile(coverFile);

    console.log("[Collection Metadata] Cover uploaded:");
    console.log(coverUri);

    const metadata = {
        name: config.collectionName,
        symbol: config.symbol,
        description: config.collectionDescription,
        image: coverUri,
        external_url: coverUri,
        seller_fee_basis_points: config.sellerFeePercent * 100,

        attributes: [
            {
                trait_type: "Content Type",
                value: "Collection"
            },
            {
                trait_type: "Hierarchy Level",
                value: "Core"
            },
            {
                trait_type: "Access Tier",
                value: "Holder"
            },
            {
                trait_type: "Edition Type",
                value: "Open"
            },
            {
                trait_type: "Collection Role",
                value: "Main Collection"
            },
            {
                trait_type: "Distribution Model",
                value: "Transmedia Digital Content"
            },
            {
                trait_type: "Storage Layer",
                value: "Irys"
            },
            {
                trait_type: "Blockchain Layer",
                value: "Solana"
            },
            {
                trait_type: "Asset Standard",
                value: "Collection NFT metadata"
            }
        ],

        properties: {
            category: "collection",
            content_type: "Collection",
            hierarchy_level: "Core",
            access_tier: "Holder",
            edition_type: "Open",
            collection_role: "Main Collection",
            distribution_model: "Transmedia Digital Content",
            storage_layer: "Irys",
            blockchain_layer: "Solana",
            files: [
                {
                    uri: coverUri,
                    type: inferMimeType(coverFile)
                }
            ],
            creators: [
                {
                    address: config.creatorWallet,
                    share: config.creatorRoyaltyShare
                },
                {
                    address: config.studentWallet,
                    share: config.studentRoyaltyShare
                }
            ]
        }
    };

    const metadataDirectory = config.metadataDirectory;

    fs.mkdirSync(metadataDirectory, {
        recursive: true
    });

    const metadataPath = path.join(
        metadataDirectory,
        "collection.json"
    );

    fs.writeFileSync(
        metadataPath,
        JSON.stringify(
            metadata,
            null,
            2
        )
    );

    console.log("[Collection Metadata] Metadata written:");
    console.log(metadataPath);

    console.log("[Collection Metadata] Uploading metadata...");

    const metadataUri = await uploadFile(metadataPath);

    console.log("[Collection Metadata] Metadata uploaded:");
    console.log(metadataUri);

    return metadataUri;
}

function inferMimeType(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();

    switch (extension) {
        case ".png":
            return "image/png";
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".webp":
            return "image/webp";
        case ".gif":
            return "image/gif";
        case ".svg":
            return "image/svg+xml";
        default:
            return "application/octet-stream";
    }
}
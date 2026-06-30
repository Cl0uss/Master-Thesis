import fs from "node:fs";
import path from "node:path";

import { loadConfig } from "./config.js";
import { uploadFile } from "./uploadToIrys.js";

export async function createCollectionMetadata(): Promise<string> {

    const config = loadConfig();

    const coverFile =
        config.collectionCoverFile;

    console.log(
        "[Collection Metadata] Uploading collection cover..."
    );

    const coverUri =
        await uploadFile(coverFile);

    console.log(
        "[Collection Metadata] Cover uploaded:"
    );

    console.log(coverUri);

    const metadata = {
        name: config.collectionName,
        symbol: config.symbol,
        description: config.collectionDescription,
        image: coverUri,
        seller_fee_basis_points:
            config.sellerFeePercent * 100,

        properties: {
            category: "collection",
            creators: [
                {
                    address: config.creatorWallet,
                    share: 100
                }
            ]
        }
    };

    const metadataDirectory =
        config.metadataDirectory;

    const metadataPath =
        path.join(
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

    console.log(
        "[Collection Metadata] Uploading metadata..."
    );

    const metadataUri =
        await uploadFile(metadataPath);

    console.log(
        "[Collection Metadata] Metadata uploaded:"
    );

    console.log(metadataUri);

    return metadataUri;
}
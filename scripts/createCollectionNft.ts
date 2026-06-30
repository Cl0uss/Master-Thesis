import fs from "node:fs";
import path from "node:path";
import bs58 from "bs58";

import { createCollectionMetadata } from "./createCollectionMetadata.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    createNft,
    mplTokenMetadata
} from "@metaplex-foundation/mpl-token-metadata";
import {
    createSignerFromKeypair,
    generateSigner,
    keypairIdentity,
    percentAmount
} from "@metaplex-foundation/umi";

import { loadConfig, loadRpcConfig, resolveConfigPath } from "./config.js";

async function main(): Promise<void> {
    const config = loadConfig();
    const rpcConfig = loadRpcConfig();

    const walletPath = process.argv[2] ?? resolveConfigPath(config.walletPath);

    console.log("[Collection] Using RPC:", rpcConfig.rpcUrl);
    console.log("[Collection] Using wallet:", walletPath);

    const umi = createUmi(rpcConfig.rpcUrl).use(mplTokenMetadata());

    const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf8"));

    const keypair = umi.eddsa.createKeypairFromSecretKey(
        new Uint8Array(secretKey)
    );

    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(keypairIdentity(signer));

    const collectionMint = generateSigner(umi);

    const collectionName = config.collectionName;
    const collectionSymbol = config.symbol;
    const collectionUri = await createCollectionMetadata();

    console.log("[Collection] Creating collection NFT...");

    const result = await createNft(umi, {
        mint: collectionMint,
        name: collectionName,
        symbol: collectionSymbol,
        uri: collectionUri,
        sellerFeeBasisPoints: percentAmount(config.sellerFeePercent),
        isCollection: true,
        isMutable: true
    }).sendAndConfirm(umi);

    const signature = bs58.encode(result.signature);
    const collectionMintAddress = collectionMint.publicKey.toString();

    const collectionConfigPath = path.join(
        process.cwd(),
        "config",
        "collection-config.json"
    );

    const collectionConfig = {
        collectionMintAddress,
        collectionName,
        collectionSymbol,
        collectionUri,
        transactionSignature: signature,
        createdAt: new Date().toISOString()
    };

    fs.writeFileSync(
        collectionConfigPath,
        JSON.stringify(collectionConfig, null, 2)
    );

    console.log("Collection NFT created successfully.");
    console.log("Collection mint address:", collectionMintAddress);
    console.log("Transaction:", signature);
    console.log(`Explorer: https://explorer.solana.com/address/${collectionMintAddress}`);
    console.log(`Collection config saved to: ${collectionConfigPath}`);
}

main().catch((error) => {
    console.error("Collection NFT creation failed:");
    console.error(error);
    process.exit(1);
});
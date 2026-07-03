import fs from "node:fs";
import path from "node:path";
import bs58 from "bs58";

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

import {
    getNetworkConfigDirectory,
    getNetworkFromArgs,
    loadAppConfig,
    loadCollectionConfig,
    loadRpcConfig,
    resolveConfigPath
} from "./config.js";

async function main(): Promise<void> {
    const network = getNetworkFromArgs(process.argv.slice(2), "devnet");
    const config = loadAppConfig(network);
    const rpcUrl = loadRpcConfig(network).rpcUrl;
    const walletPath = resolveConfigPath(config.walletPath);
    const existingCollectionConfig = loadCollectionConfig(network);

    const collectionName = config.collectionName;
    const collectionSymbol = config.symbol;
    const collectionUri = existingCollectionConfig.collectionUri;

    if (!collectionUri) {
        throw new Error(`Missing collection URI for ${network}.`);
    }

    console.log("[Collection] Network:", network);
    console.log("[Devnet Collection] Using RPC:", rpcUrl);
    console.log("[Devnet Collection] Using wallet:", walletPath);
    console.log("[Devnet Collection] Metadata URI:", collectionUri);

    const umi = createUmi(rpcUrl).use(mplTokenMetadata());

    const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf8"));

    const keypair = umi.eddsa.createKeypairFromSecretKey(
        new Uint8Array(secretKey)
    );

    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(keypairIdentity(signer));

    const collectionMint = generateSigner(umi);

    console.log("[Devnet Collection] Creating Collection NFT...");

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

    const outputPath = path.join(
        process.cwd(),
        getNetworkConfigDirectory(network),
        "collection-config.json"
    );

    const output = {
        network,
        collectionMintAddress,
        collectionName,
        collectionSymbol,
        collectionUri,
        transactionSignature: signature,
        createdAt: new Date().toISOString()
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log("[Devnet Collection] Created successfully.");
    console.log("Collection mint:", collectionMintAddress);
    console.log("Transaction:", signature);
    const clusterQuery = network === "devnet" ? "?cluster=devnet" : "";
    console.log(`Explorer: https://explorer.solana.com/address/${collectionMintAddress}${clusterQuery}`);
    console.log("Config saved:", outputPath);
}

main().catch((error) => {
    console.error("[Devnet Collection] Creation failed:");
    console.error(error);
    process.exit(1);
});

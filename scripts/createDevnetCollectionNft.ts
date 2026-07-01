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

import { loadConfig } from "./config.js";

async function main(): Promise<void> {
    const config = loadConfig();

    const rpcUrl = "https://api.devnet.solana.com";
    const walletPath = "/home/cl0us/Desktop/thesis-wallet/thesis-wallet-devnet.json";

    const mainnetCollectionConfig = JSON.parse(
        fs.readFileSync("config/collection-config.json", "utf8")
    );

    const collectionName = config.collectionName;
    const collectionSymbol = config.symbol;
    const collectionUri = mainnetCollectionConfig.collectionUri;

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
        "config",
        "collection-config.devnet.json"
    );

    const output = {
        network: "devnet",
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
    console.log(`Explorer: https://explorer.solana.com/address/${collectionMintAddress}?cluster=devnet`);
    console.log("Config saved:", outputPath);
}

main().catch((error) => {
    console.error("[Devnet Collection] Creation failed:");
    console.error(error);
    process.exit(1);
});
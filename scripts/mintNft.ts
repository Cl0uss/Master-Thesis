import fs from "node:fs";
import path from "node:path";
import bs58 from "bs58";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    createNft,
    findMasterEditionPda,
    findMetadataPda,
    mplTokenMetadata,
    verifySizedCollectionItem
} from "@metaplex-foundation/mpl-token-metadata";
import {
    createSignerFromKeypair,
    generateSigner,
    keypairIdentity,
    percentAmount,
    publicKey,
    some
} from "@metaplex-foundation/umi";

import { loadConfig, loadRpcConfig, resolveConfigPath } from "./config.js";

type CollectionConfig = {
    collectionMintAddress?: string;
};

function loadCollectionConfig(): CollectionConfig {
    const collectionConfigPath = path.join(
        process.cwd(),
        "config",
        "collection-config.json"
    );

    if (!fs.existsSync(collectionConfigPath)) {
        return {};
    }

    return JSON.parse(fs.readFileSync(collectionConfigPath, "utf8"));
}

async function main(): Promise<void> {
    const config = loadConfig();
    const rpcConfig = loadRpcConfig();
    const collectionConfig = loadCollectionConfig();

    const metadataUri = process.argv[2];
    const nftName = process.argv[3];
    const walletPath = process.argv[4] ?? resolveConfigPath(config.walletPath);
    const symbol = process.argv[5] ?? config.symbol;
    const rpcUrl = process.argv[6] ?? rpcConfig.rpcUrl;
    const sellerFeePercent = Number(process.argv[7] ?? config.sellerFeePercent);

    if (!metadataUri || !nftName) {
        console.error(
            "Usage: npx tsx scripts/mintNft.ts <metadataUri> <nftName> [walletPath] [symbol] [rpcUrl] [sellerFeePercent]"
        );
        process.exit(1);
    }

    console.error(`[Solana] RPC URL: ${rpcUrl}`);
    console.error(`[Solana] Reading wallet: ${walletPath}`);

    const umi = createUmi(rpcUrl).use(mplTokenMetadata());

    const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf8"));

    const keypair = umi.eddsa.createKeypairFromSecretKey(
        new Uint8Array(secretKey)
    );

    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(keypairIdentity(signer));

    const mint = generateSigner(umi);

    const collectionMintAddress = collectionConfig.collectionMintAddress;

    console.error(`[Solana] Creating NFT: ${nftName} (${symbol})`);
    console.error(`[Solana] Seller fee: ${sellerFeePercent}%`);
    console.error(`[Solana] Metadata URI: ${metadataUri}`);

    if (collectionMintAddress) {
        console.error(`[Solana] Collection: ${collectionMintAddress}`);
    } else {
        console.error("[Solana] No collection-config.json collection address found. Minting without collection.");
    }

    const createInput: Parameters<typeof createNft>[1] = {
        mint,
        name: nftName,
        symbol,
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(sellerFeePercent),
        isMutable: true
    };

    if (collectionMintAddress) {
        createInput.collection = some({
            key: publicKey(collectionMintAddress),
            verified: false
        });
    }

    const result = await createNft(umi, createInput).sendAndConfirm(umi);
    const signature = bs58.encode(result.signature);

    console.error("[Solana] Mint transaction confirmed.");
    console.log(`MINT_ADDRESS=${mint.publicKey}`);
    console.log(`TRANSACTION_SIGNATURE=${signature}`);

    let verificationSignature: string | null = null;

    if (collectionMintAddress) {
        console.error("[Solana] Verifying NFT collection...");

        const metadata = findMetadataPda(umi, {
            mint: mint.publicKey
        });

        const collectionMint = publicKey(collectionMintAddress);

        const collectionMetadata = findMetadataPda(umi, {
            mint: collectionMint
        });

        const collectionMasterEdition = findMasterEditionPda(umi, {
            mint: collectionMint
        });

        const verifyResult = await verifySizedCollectionItem(umi, {
            metadata,
            collectionAuthority: umi.identity,
            payer: umi.identity,
            collectionMint,
            collection: collectionMetadata,
            collectionMasterEditionAccount: collectionMasterEdition
        }).sendAndConfirm(umi);

        verificationSignature = bs58.encode(verifyResult.signature);

        console.error("[Solana] Collection verified.");
    }

    if (collectionMintAddress) {
        console.log(`COLLECTION_MINT_ADDRESS=${collectionMintAddress}`);
    }

    if (verificationSignature) {
        console.log(`COLLECTION_VERIFICATION_SIGNATURE=${verificationSignature}`);
    }
}

main().catch((error) => {
    console.error("NFT mint failed:");
    console.error(error);
    process.exit(1);
});
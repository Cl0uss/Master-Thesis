import fs from "node:fs";
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

import {
    getNetworkFromArgs,
    loadAppConfig,
    loadCollectionConfig,
    loadRpcConfig,
    removeNetworkArgs,
    resolveConfigPath
} from "./config.js";

function removeMintFlags(args: string[]): string[] {
    return args.filter((arg) =>
        arg !== "--allow-unverified-collection" &&
        arg !== "--skip-collection-verification"
    );
}

async function main(): Promise<void> {
    const cliArgs = process.argv.slice(2);

    const network = getNetworkFromArgs(cliArgs);
    const allowUnverifiedCollection = cliArgs.includes("--allow-unverified-collection");
    const skipCollectionVerification = cliArgs.includes("--skip-collection-verification");

    const argsWithoutMintFlags = removeMintFlags(cliArgs);
    const positionalArgs = removeNetworkArgs(argsWithoutMintFlags);

    const config = loadAppConfig(network);
    const rpcConfig = loadRpcConfig(network);
    const collectionConfig = loadCollectionConfig(network);

    const metadataUri = positionalArgs[0];
    const nftName = positionalArgs[1];
    const walletPath = positionalArgs[2] ?? resolveConfigPath(config.walletPath);
    const symbol = positionalArgs[3] ?? config.symbol;
    const rpcUrl = positionalArgs[4] ?? rpcConfig.rpcUrl;
    const sellerFeePercent = Number(positionalArgs[5] ?? config.sellerFeePercent);

    if (!metadataUri || !nftName) {
        console.error(
            "Usage:\n" +
            "  npx tsx scripts/mintNft.ts <metadataUri> <nftName> [walletPath] [symbol] [rpcUrl] [sellerFeePercent]\n" +
            "  npx tsx scripts/mintNft.ts <metadataUri> <nftName> --network devnet\n" +
            "  npx tsx scripts/mintNft.ts <metadataUri> <nftName> --network devnet --skip-collection-verification\n" +
            "  npx tsx scripts/mintNft.ts <metadataUri> <nftName> --network devnet --allow-unverified-collection"
        );
        process.exit(1);
    }

    if (skipCollectionVerification && allowUnverifiedCollection) {
        console.error(
            "[Solana] Both --skip-collection-verification and --allow-unverified-collection were provided."
        );
        console.error(
            "[Solana] Collection verification will be skipped completely."
        );
    }

    console.error(`[Solana] Network: ${network}`);
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
        console.error(`[Solana] No collection address found for ${network}. Minting without collection.`);
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
    let verificationFailed = false;
    let verificationSkipped = false;

    if (collectionMintAddress && skipCollectionVerification) {
        verificationSkipped = true;
        console.error("[Solana] Collection verification skipped by --skip-collection-verification.");
    }

    if (collectionMintAddress && !skipCollectionVerification) {
        console.error("[Solana] Verifying NFT collection...");

        try {
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
        } catch (error) {
            verificationFailed = true;

            if (!allowUnverifiedCollection) {
                throw error;
            }

            const message = error instanceof Error ? error.message : String(error);

            console.error(
                "[Solana] WARNING: NFT minted successfully, but collection verification failed."
            );
            console.error(`[Solana] Verification error: ${message}`);
        }
    }

    if (collectionMintAddress) {
        console.log(`COLLECTION_MINT_ADDRESS=${collectionMintAddress}`);
    }

    if (verificationSignature) {
        console.log(`COLLECTION_VERIFICATION_SIGNATURE=${verificationSignature}`);
        console.log("COLLECTION_VERIFICATION_STATUS=verified");
    }

    if (verificationFailed) {
        console.log("COLLECTION_VERIFICATION_STATUS=failed");
    }

    if (verificationSkipped) {
        console.log("COLLECTION_VERIFICATION_STATUS=skipped");
    }

    if (verificationFailed && allowUnverifiedCollection) {
        console.log("NFT_MINT_STATUS=success_with_unverified_collection");
    } else {
        console.log("NFT_MINT_STATUS=success");
    }
}

main().catch((error) => {
    console.error("NFT mint failed:");
    console.error(error);
    process.exit(1);
});
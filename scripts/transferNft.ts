import fs from "node:fs";
import bs58 from "bs58";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    fetchDigitalAsset,
    mplTokenMetadata,
    transferV1
} from "@metaplex-foundation/mpl-token-metadata";
import {
    createSignerFromKeypair,
    keypairIdentity,
    publicKey
} from "@metaplex-foundation/umi";

import { loadConfig, loadRpcConfig, resolveConfigPath } from "./config.js";

function logStep(message: string): void {
    console.log(`[Transfer] ${message}`);
}

// Transfers one existing NFT to another wallet.
async function main(): Promise<void> {
    const config = loadConfig();
    const rpcConfig = loadRpcConfig();
    const mintAddress = process.argv[2];
    const destinationWallet = process.argv[3];
    const walletPath = process.argv[4] ?? resolveConfigPath(config.walletPath);
    const rpcUrl = process.argv[5] ?? rpcConfig.rpcUrl;

    if (!mintAddress || !destinationWallet) {
        console.error(
            "Usage: npx tsx scripts/transferNft.ts <mintAddress> <destinationWallet> [walletPath] [rpcUrl]"
        );
        process.exit(1);
    }

    // Configure Umi and load the authority wallet that owns the NFT.
    logStep(`Using RPC: ${rpcUrl}`);
    logStep(`Reading owner wallet: ${walletPath}`);
    const umi = createUmi(rpcUrl).use(mplTokenMetadata());

    const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf8"));

    const keypair = umi.eddsa.createKeypairFromSecretKey(
        new Uint8Array(secretKey)
    );

    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(keypairIdentity(signer));
    logStep(`Owner wallet public key: ${umi.identity.publicKey}`);

    // Convert CLI string addresses into Umi public key values.
    logStep(`NFT mint: ${mintAddress}`);
    logStep(`Destination wallet: ${destinationWallet}`);
    const mint = publicKey(mintAddress);
    const destination = publicKey(destinationWallet);

    // Fetch metadata so the transfer uses the correct token standard.
    logStep("Fetching NFT metadata from Solana RPC...");
    const asset = await fetchDigitalAsset(umi, mint);
    logStep("NFT metadata fetched.");

    const tokenStandard = asset.metadata.tokenStandard;

    if (!("value" in tokenStandard)) {
        throw new Error("Unable to determine NFT token standard.");
    }

    logStep(`Token standard: ${tokenStandard.value}`);
    logStep("Sending transfer transaction and waiting for confirmation...");

    // Submit and confirm the transfer transaction.
    const result = await transferV1(umi, {
        mint,
        authority: umi.identity,
        tokenOwner: umi.identity.publicKey,
        destinationOwner: destination,
        tokenStandard: tokenStandard.value
    }).sendAndConfirm(umi);

    const signature = bs58.encode(result.signature);

    logStep("Transfer transaction confirmed.");

    console.log("NFT transferred successfully.");
    console.log("Mint address:", mintAddress);
    console.log("Previous owner:", umi.identity.publicKey.toString());
    console.log("New owner:", destinationWallet);
    console.log("Transaction:", signature);
    console.log(`Explorer: https://explorer.solana.com/tx/${signature}`);

    console.log("");
    console.log("Ownership transfer was confirmed by the Solana transaction.");
    console.log("Separate owner check is optional and may fail on public RPC because of rate limits.");
}

main().catch((error) => {
    console.error("NFT transfer failed:");
    console.error(error);
    process.exit(1);
});

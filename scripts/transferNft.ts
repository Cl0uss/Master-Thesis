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

import {
    getNetworkFromArgs,
    loadAppConfig,
    loadRpcConfig,
    removeNetworkArgs,
    resolveConfigPath
} from "./config.js";

function logStep(message: string): void {
    console.error(`[Transfer] ${message}`);
}

// Transfers one existing standard NFT to another wallet.
async function main(): Promise<void> {
    const cliArgs = process.argv.slice(2);
    const network = getNetworkFromArgs(cliArgs);
    const positionalArgs = removeNetworkArgs(cliArgs);

    const appConfig = loadAppConfig(network);
    const rpcConfig = loadRpcConfig(network);

    const mintAddress = positionalArgs[0];
    const destinationWallet = positionalArgs[1];
    const walletPath = positionalArgs[2] ?? resolveConfigPath(appConfig.walletPath);
    const rpcUrl = positionalArgs[3] ?? rpcConfig.rpcUrl;

    if (!mintAddress || !destinationWallet) {
        console.error(
            "Usage:\n" +
            "  npx tsx scripts/transferNft.ts <mintAddress> <destinationWallet> [walletPath] [rpcUrl]\n" +
            "  npx tsx scripts/transferNft.ts <mintAddress> <destinationWallet> --network devnet"
        );
        process.exit(1);
    }

    logStep(`Network: ${network}`);
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
    logStep(`NFT mint: ${mintAddress}`);
    logStep(`Destination wallet: ${destinationWallet}`);

    const mint = publicKey(mintAddress);
    const destination = publicKey(destinationWallet);

    logStep("Fetching NFT metadata from Solana RPC...");
    const asset = await fetchDigitalAsset(umi, mint);
    logStep("NFT metadata fetched.");

    const tokenStandard = asset.metadata.tokenStandard;

    if (!tokenStandard || !("value" in tokenStandard)) {
        throw new Error("Unable to determine NFT token standard.");
    }

    logStep(`Token standard: ${tokenStandard.value}`);
    logStep("Sending transfer transaction and waiting for confirmation...");

    const result = await transferV1(umi, {
        mint,
        authority: umi.identity,
        tokenOwner: umi.identity.publicKey,
        destinationOwner: destination,
        tokenStandard: tokenStandard.value
    }).sendAndConfirm(umi);

    const signature = bs58.encode(result.signature);
    const explorerUrl = `https://explorer.solana.com/tx/${signature}${
        network === "devnet" ? "?cluster=devnet" : ""
    }`;

    logStep("Transfer transaction confirmed.");

    console.log("TRANSFER_STATUS=success");
    console.log(`MINT_ADDRESS=${mintAddress}`);
    console.log(`PREVIOUS_OWNER=${umi.identity.publicKey}`);
    console.log(`NEW_OWNER=${destinationWallet}`);
    console.log(`TRANSACTION_SIGNATURE=${signature}`);
    console.log(`EXPLORER_URL=${explorerUrl}`);
}

main().catch((error) => {
    console.error("NFT transfer failed:");
    console.error(error);
    process.exit(1);
});
import fs from "node:fs";
import bs58 from "bs58";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    createSignerFromKeypair,
    keypairIdentity,
    none,
    publicKey,
    some
} from "@metaplex-foundation/umi";

import {
    mintToCollectionV1,
    mplBubblegum,
    TokenProgramVersion,
    TokenStandard
} from "@metaplex-foundation/mpl-bubblegum";

import {
    findMasterEditionPda,
    findMetadataPda
} from "@metaplex-foundation/mpl-token-metadata";
import {
    getNetworkFromArgs,
    loadAppConfig,
    loadCnftConfig,
    loadCollectionConfig,
    loadRpcConfig,
    removeNetworkArgs,
    resolveConfigPath
} from "./config.js";

async function main(): Promise<void> {
    const cliArgs = process.argv.slice(2);
    const network = getNetworkFromArgs(cliArgs, "devnet");
    const positionalArgs = removeNetworkArgs(cliArgs);
    const metadataUri = positionalArgs[0];
    const appConfig = loadAppConfig(network);
    const name = positionalArgs[1] ?? "Compressed NFT";
    const symbol = positionalArgs[2] ?? appConfig.symbol;

    if (!metadataUri) {
        console.error(
            "Usage: npx tsx scripts/mintCompressedNftToCollection.ts <metadataUri> [name] [symbol] [--network devnet|mainnet]"
        );
        process.exit(1);
    }

    const rpcUrl = loadRpcConfig(network).rpcUrl;
    const walletPath = resolveConfigPath(appConfig.walletPath);

    const cnftConfig = loadCnftConfig(network);
    const collectionConfig = loadCollectionConfig(network);

    if (!collectionConfig.collectionMintAddress) {
        throw new Error(`Missing collection mint address for ${network}.`);
    }

    console.log("[cNFT Collection] Network:", network);
    console.log("[cNFT Collection] Using RPC:", rpcUrl);
    console.log("[cNFT Collection] Using wallet:", walletPath);
    console.log("[cNFT Collection] Merkle Tree:", cnftConfig.merkleTree);
    console.log("[cNFT Collection] Collection:", collectionConfig.collectionMintAddress);
    console.log("[cNFT Collection] Metadata URI:", metadataUri);

    const umi = createUmi(rpcUrl).use(mplBubblegum());

    const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf8"));

    const keypair = umi.eddsa.createKeypairFromSecretKey(
        new Uint8Array(secretKey)
    );

    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(keypairIdentity(signer));

    const collectionMint = publicKey(collectionConfig.collectionMintAddress);

    const collectionMetadata = findMetadataPda(umi, {
        mint: collectionMint
    });

    const collectionEdition = findMasterEditionPda(umi, {
        mint: collectionMint
    });

    const result = await mintToCollectionV1(umi, {
        leafOwner: umi.identity.publicKey,
        leafDelegate: umi.identity.publicKey,
        merkleTree: publicKey(cnftConfig.merkleTree),
        payer: umi.identity,
        treeCreatorOrDelegate: umi.identity,

        collectionAuthority: umi.identity,
        collectionMint,
        collectionMetadata,
        collectionEdition,

        metadata: {
            name,
            symbol,
            uri: metadataUri,
            sellerFeeBasisPoints: appConfig.sellerFeePercent * 100,
            primarySaleHappened: false,
            isMutable: true,
            editionNonce: none(),
            tokenStandard: some(TokenStandard.NonFungible),
            collection: some({
                key: collectionMint,
                verified: true
            }),
            uses: none(),
            tokenProgramVersion: TokenProgramVersion.Original,
            creators: [
                {
                    address: umi.identity.publicKey,
                    verified: false,
                    share: 100
                }
            ]
        }
    }).sendAndConfirm(umi);

    const signature = bs58.encode(result.signature);

    console.log("[cNFT Collection] Mint completed.");
    console.log("Transaction:", signature);
    const clusterQuery = network === "devnet" ? "?cluster=devnet" : "";
    console.log(`Explorer: https://explorer.solana.com/tx/${signature}${clusterQuery}`);
}

main().catch((error) => {
    console.error("[cNFT Collection] Mint failed:");
    console.error(error);
    process.exit(1);
});

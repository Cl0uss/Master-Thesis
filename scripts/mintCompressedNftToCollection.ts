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

type CnftConfig = {
    network: string;
    merkleTree: string;
    createdAt: string;
};

type CollectionConfig = {
    network: string;
    collectionMintAddress: string;
};

function loadCnftConfig(): CnftConfig {
    return JSON.parse(
        fs.readFileSync("config/cnft-config.devnet.json", "utf8")
    );
}

function loadCollectionConfig(): CollectionConfig {
    return JSON.parse(
        fs.readFileSync("config/collection-config.devnet.json", "utf8")
    );
}

async function main(): Promise<void> {
    const metadataUri = process.argv[2];
    const name = process.argv[3] ?? "Compressed NFT";
    const symbol = process.argv[4] ?? "TMDC";

    if (!metadataUri) {
        console.error(
            "Usage: npx tsx scripts/mintCompressedNftToCollection.ts <metadataUri> [name] [symbol]"
        );
        process.exit(1);
    }

    const rpcUrl = "https://api.devnet.solana.com";
    const walletPath = "/home/cl0us/Desktop/thesis-wallet/thesis-wallet-devnet.json";

    const cnftConfig = loadCnftConfig();
    const collectionConfig = loadCollectionConfig();

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
            sellerFeeBasisPoints: 500,
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
    console.log(`Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
}

main().catch((error) => {
    console.error("[cNFT Collection] Mint failed:");
    console.error(error);
    process.exit(1);
});
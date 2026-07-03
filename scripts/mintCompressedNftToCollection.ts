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
    findLeafAssetIdPda,
    mintToCollectionV1,
    mplBubblegum,
    parseLeafFromMintV1Transaction,
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

type DasAsset = {
    id?: string;
    content?: {
        json_uri?: string;
        metadata?: {
            name?: string;
            symbol?: string;
        };
    };
    ownership?: {
        owner?: string;
    };
    compression?: {
        compressed?: boolean;
        tree?: string;
        leaf_id?: number;
    };
    grouping?: Array<{
        group_key?: string;
        group_value?: string;
    }>;
};

type DasAssetsByOwnerResponse = {
    result?: {
        items?: DasAsset[];
    };
    error?: {
        code: number;
        message: string;
    };
};

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAssetsByOwner(
    rpcUrl: string,
    ownerAddress: string
): Promise<DasAsset[]> {
    const response = await fetch(rpcUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "find-cnft-asset",
            method: "getAssetsByOwner",
            params: {
                ownerAddress,
                page: 1,
                limit: 100
            }
        })
    });

    if (!response.ok) {
        throw new Error(
            `Helius DAS getAssetsByOwner failed with HTTP ${response.status}: ${await response.text()}`
        );
    }

    const data = (await response.json()) as DasAssetsByOwnerResponse;

    if (data.error) {
        throw new Error(`Helius DAS error ${data.error.code}: ${data.error.message}`);
    }

    return data.result?.items ?? [];
}

async function findMintedAssetIdWithDas(params: {
    rpcUrl: string;
    ownerAddress: string;
    metadataUri: string;
    merkleTree: string;
    collectionMintAddress: string;
}): Promise<DasAsset | null> {
    for (let attempt = 1; attempt <= 8; attempt += 1) {
        console.log(`[cNFT Collection] DAS lookup attempt ${attempt}/8...`);

        const assets = await getAssetsByOwner(params.rpcUrl, params.ownerAddress);

        const matchingAssets = assets.filter((asset) => {
            const sameMetadata = asset.content?.json_uri === params.metadataUri;
            const sameTree = asset.compression?.tree === params.merkleTree;
            const isCompressed = asset.compression?.compressed === true;

            const sameCollection = asset.grouping?.some((group) => {
                return (
                    group.group_key === "collection" &&
                    group.group_value === params.collectionMintAddress
                );
            }) ?? false;

            return sameMetadata && sameTree && isCompressed && sameCollection;
        });

        if (matchingAssets[0]?.id) {
            return matchingAssets[0];
        }

        await sleep(2500);
    }

    return null;
}

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

    const merkleTree = publicKey(cnftConfig.merkleTree);

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
        merkleTree,
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

    console.log("[cNFT Collection] Mint transaction confirmed.");
    console.log("[cNFT Collection] Trying to parse minted leaf from transaction...");

    let assetId = "";
    let leafIndex = "";

    try {
        const leaf = await parseLeafFromMintV1Transaction(umi, result.signature);

        assetId = String(
            findLeafAssetIdPda(umi, {
                merkleTree,
                leafIndex: leaf.nonce
            })[0]
        );

        leafIndex = leaf.nonce.toString();

        console.log("[cNFT Collection] Leaf parsed from transaction.");
    } catch (error) {
        console.warn("[cNFT Collection] Could not parse leaf from transaction.");
        console.warn("[cNFT Collection] Falling back to Helius DAS getAssetsByOwner...");

        const dasAsset = await findMintedAssetIdWithDas({
            rpcUrl,
            ownerAddress: String(umi.identity.publicKey),
            metadataUri,
            merkleTree: String(merkleTree),
            collectionMintAddress: String(collectionMint)
        });

        if (!dasAsset?.id) {
            throw new Error(
                "cNFT mint transaction was confirmed, but asset id could not be found through transaction parsing or Helius DAS."
            );
        }

        assetId = dasAsset.id;
        leafIndex = dasAsset.compression?.leaf_id?.toString() ?? "";

        console.log("[cNFT Collection] Asset found through Helius DAS.");
    }

    console.log("[cNFT Collection] Mint completed.");
    console.log("Transaction:", signature);
    console.log("Asset ID:", assetId);

    const clusterQuery = network === "devnet" ? "?cluster=devnet" : "";

    console.log(`Explorer: https://explorer.solana.com/tx/${signature}${clusterQuery}`);
    console.log(`Asset Explorer: https://explorer.solana.com/address/${assetId}${clusterQuery}`);

    console.log(`CNFT_MINT_STATUS=success`);
    console.log(`ASSET_ID=${assetId}`);
    console.log(`MERKLE_TREE=${merkleTree}`);
    console.log(`LEAF_INDEX=${leafIndex}`);
    console.log(`OWNER=${umi.identity.publicKey}`);
    console.log(`COLLECTION_MINT_ADDRESS=${collectionMint}`);
    console.log(`TRANSACTION_SIGNATURE=${signature}`);
    console.log(`METADATA_URI=${metadataUri}`);
}

main().catch((error) => {
    console.error("[cNFT Collection] Mint failed:");
    console.error(error);
    process.exit(1);
});
import { getNetworkFromArgs, loadRpcConfig, removeNetworkArgs } from "./config.js";

type HeliusAssetResponse = {
    jsonrpc: string;
    id: string;
    result?: {
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
            delegate?: string | null;
            delegated?: boolean;
            frozen?: boolean;
        };
        grouping?: Array<{
            group_key?: string;
            group_value?: string;
        }>;
        compression?: {
            compressed?: boolean;
            eligible?: boolean;
            leaf_id?: number;
            tree?: string;
            seq?: number;
        };
    };
    error?: {
        code: number;
        message: string;
    };
};

function printUsage(): void {
    console.error(
        [
            "Usage:",
            "  npx tsx scripts/checkCompressedNftOwner.ts <assetId> <walletAddress> [rpcUrl] [--network devnet|mainnet]",
            "",
            "Examples:",
            "  npx tsx scripts/checkCompressedNftOwner.ts <cNFT_ASSET_ID> <WALLET_ADDRESS> --network devnet",
            "  npx tsx scripts/checkCompressedNftOwner.ts <cNFT_ASSET_ID> <WALLET_ADDRESS> https://devnet.helius-rpc.com/?api-key=... --network devnet"
        ].join("\n")
    );
}

function isProbablyPublicKey(value: string): boolean {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

async function heliusGetAsset(rpcUrl: string, assetId: string): Promise<HeliusAssetResponse> {
    const response = await fetch(rpcUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "check-cnft-owner",
            method: "getAsset",
            params: {
                id: assetId
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Helius DAS request failed with HTTP ${response.status}: ${await response.text()}`);
    }

    return (await response.json()) as HeliusAssetResponse;
}

async function main(): Promise<void> {
    const network = getNetworkFromArgs(process.argv.slice(2));
    const args = removeNetworkArgs(process.argv.slice(2));

    const assetId = args[0];
    const walletAddress = args[1];
    const explicitRpcUrl = args[2];

    if (!assetId || !walletAddress) {
        printUsage();
        process.exitCode = 1;
        return;
    }

    if (!isProbablyPublicKey(assetId)) {
        throw new Error(
            `Invalid cNFT asset id: ${assetId}. ` +
            "Use only the cNFT asset address, not a Solana Explorer URL."
        );
    }

    if (!isProbablyPublicKey(walletAddress)) {
        throw new Error(
            `Invalid wallet address: ${walletAddress}. ` +
            "Use only the wallet public key, not a Solana Explorer URL."
        );
    }

    const rpcUrl = explicitRpcUrl || loadRpcConfig(network).rpcUrl;

    console.error(`[cNFT Access] Network: ${network}`);
    console.error(`[cNFT Access] Using RPC: ${rpcUrl}`);
    console.error(`[cNFT Access] Asset ID: ${assetId}`);
    console.error(`[cNFT Access] Wallet Address: ${walletAddress}`);
    console.error("[cNFT Access] Fetching compressed NFT asset through Helius DAS...");

    const asset = await heliusGetAsset(rpcUrl, assetId);

    if (asset.error) {
        throw new Error(`Helius DAS error ${asset.error.code}: ${asset.error.message}`);
    }

    if (!asset.result) {
        throw new Error("Helius DAS returned no asset result.");
    }

    const owner = asset.result.ownership?.owner;
    const isCompressed = asset.result.compression?.compressed === true;
    const tree = asset.result.compression?.tree || "";
    const leafId = asset.result.compression?.leaf_id;
    const name = asset.result.content?.metadata?.name || "";
    const symbol = asset.result.content?.metadata?.symbol || "";
    const metadataUri = asset.result.content?.json_uri || "";

    if (!owner) {
        throw new Error("Could not determine cNFT owner from DAS response.");
    }

    const allowed = owner === walletAddress;

    console.error("[cNFT Access] Asset fetched successfully.");
    console.error(`[cNFT Access] Compressed: ${isCompressed}`);
    console.error(`[cNFT Access] Owner: ${owner}`);

    console.log(`CNFT_ACCESS_STATUS=${allowed ? "granted" : "denied"}`);
    console.log(`ASSET_ID=${assetId}`);
    console.log(`REQUESTED_WALLET=${walletAddress}`);
    console.log(`OWNER=${owner}`);
    console.log(`IS_COMPRESSED=${String(isCompressed)}`);
    console.log(`TREE=${tree}`);
    console.log(`LEAF_ID=${leafId ?? ""}`);
    console.log(`NAME=${name}`);
    console.log(`SYMBOL=${symbol}`);
    console.log(`METADATA_URI=${metadataUri}`);
    console.log(`ALLOWED=${String(allowed)}`);
}

main().catch((error) => {
    console.error("cNFT ownership check failed:");
    console.error(error);
    process.exitCode = 1;
});
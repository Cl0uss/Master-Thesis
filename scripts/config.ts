import fs from "node:fs";
import path from "node:path";

// Shape of config/app-config.json used by all TypeScript scripts.
export type AppConfig = {
    appName: string;
    creatorWallet: string;
    walletPath: string;
    secondWallet: string;
    symbol: string;
    sellerFeePercent: number;
    network: string;

    rawFilesDirectory: string;
    metadataDirectory: string;
    coverDirectory: string;
    coverExtension: string;

    nftNameTemplate: string;
    metadataDescription: string;

    irysGatewayUrl: string;
    irysFundingBufferSol: string;

    estimatedMetadataSizeBytes: number;
    estimatedMintCostSol: string;

    collectionName: string;
    collectionDescription: string;
    collectionCoverFile: string;
};

export type RpcConfig = {
    rpcUrl: string;
};

// Loads the shared non-secret app config from the project root.
export function loadConfig(configPath = path.join("config", "app-config.json")): AppConfig {
    return JSON.parse(fs.readFileSync(configPath, "utf8")) as AppConfig;
}

// Loads the private RPC config. Keep config/rpc-config.json out of git.
export function loadRpcConfig(configPath = path.join("config", "rpc-config.json")): RpcConfig {
    return JSON.parse(fs.readFileSync(configPath, "utf8")) as RpcConfig;
}

// Resolves config paths so both absolute and relative values work.
export function resolveConfigPath(configValue: string): string {
    return path.isAbsolute(configValue) ? configValue : path.resolve(configValue);
}

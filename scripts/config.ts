import fs from "node:fs";
import path from "node:path";

export type Network = "mainnet" | "devnet";

export type AppConfig = {
    appName: string;
    creatorWallet: string;
    studentWallet: string;
    walletPath: string;
    secondWallet: string;
    symbol: string;
    sellerFeePercent: number;
    creatorRoyaltyShare: number;
    studentRoyaltyShare: number;
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

export type CollectionConfig = {
    network?: string;
    collectionMintAddress?: string;
    collectionName?: string;
    collectionSymbol?: string;
    collectionUri?: string;
    transactionSignature?: string;
    createdAt?: string;
};

export type CnftConfig = {
    network: string;
    merkleTree: string;
    createdAt?: string;
};

export function resolveNetwork(input?: string): Network {
    const value = input?.trim().toLowerCase() || "mainnet";

    if (value === "mainnet" || value === "devnet") {
        return value;
    }

    throw new Error(
        `Invalid network: ${input}. Expected "mainnet" or "devnet".`
    );
}

export function parseNetworkArg(args: string[]): Network | undefined {
    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--network") {
            const value = args[index + 1];

            if (!value || value.startsWith("--")) {
                throw new Error(
                    'Missing value for --network. Expected "mainnet" or "devnet".'
                );
            }

            return resolveNetwork(value);
        }

        if (arg.startsWith("--network=")) {
            return resolveNetwork(arg.slice("--network=".length));
        }
    }

    return undefined;
}

export function removeNetworkArgs(args: string[]): string[] {
    const positionalArgs: string[] = [];

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--network") {
            index += 1;
            continue;
        }

        if (arg.startsWith("--network=")) {
            continue;
        }

        positionalArgs.push(arg);
    }

    return positionalArgs;
}

export function getNetworkFromArgs(
    args: string[],
    defaultNetwork: Network = "mainnet"
): Network {
    return resolveNetwork(
        parseNetworkArg(args) ?? process.env.NETWORK ?? defaultNetwork
    );
}

export function getNetworkConfigDirectory(network: Network): string {
    return path.join("config", network);
}

function loadJsonConfig<T>(network: Network, filename: string): T {
    const configPath = path.join(
        getNetworkConfigDirectory(network),
        filename
    );

    if (!fs.existsSync(configPath)) {
        throw new Error(`Missing ${network} config file: ${configPath}`);
    }

    return JSON.parse(fs.readFileSync(configPath, "utf8")) as T;
}

function selectedNetwork(network?: Network): Network {
    return network ?? getNetworkFromArgs(process.argv.slice(2));
}

export function loadAppConfig(network?: Network): AppConfig {
    return loadJsonConfig<AppConfig>(
        selectedNetwork(network),
        "app-config.json"
    );
}

// Shared alias retained for scripts that use the shorter loader name.
export function loadConfig(network?: Network): AppConfig {
    return loadAppConfig(network);
}

export function loadRpcConfig(network?: Network): RpcConfig {
    return loadJsonConfig<RpcConfig>(
        selectedNetwork(network),
        "rpc-config.json"
    );
}

export function loadCollectionConfig(network?: Network): CollectionConfig {
    return loadJsonConfig<CollectionConfig>(
        selectedNetwork(network),
        "collection-config.json"
    );
}

export function loadCnftConfig(network?: Network): CnftConfig {
    return loadJsonConfig<CnftConfig>(
        selectedNetwork(network),
        "cnft-config.json"
    );
}

export function resolveConfigPath(configValue: string): string {
    return path.isAbsolute(configValue) ? configValue : path.resolve(configValue);
}

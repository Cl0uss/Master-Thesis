import { Connection, PublicKey } from "@solana/web3.js";

import { loadConfig } from "./config.js";

// Finds the current owner token account for a given NFT mint.
const config = loadConfig();
const mintAddress = process.argv[2];
const secondArg = process.argv[3];
const thirdArg = process.argv[4];
const secondArgIsRpcUrl = secondArg?.startsWith("http://") || secondArg?.startsWith("https://");
const walletAddress = secondArg && !secondArgIsRpcUrl ? secondArg : undefined;
const rpcUrl = thirdArg ?? (secondArgIsRpcUrl ? secondArg : config.rpcUrl);

if (!mintAddress) {
    console.error("Usage: npx tsx scripts/checkNftOwner.ts <mintAddress> [walletAddress] [rpcUrl]");
    process.exit(1);
}

console.log("[Owner check] Using RPC:", rpcUrl);
console.log("[Owner check] NFT mint:", mintAddress);

const connection = new Connection(rpcUrl);
const mint = new PublicKey(mintAddress);

if (walletAddress) {
    console.log("[Owner check] Checking wallet:", walletAddress);
    const owner = new PublicKey(walletAddress);
    const accounts = await connection.getParsedTokenAccountsByOwner(owner, { mint });

    if (accounts.value.length === 0) {
        console.log("NFT not found in this wallet.");
    } else {
        for (const account of accounts.value) {
            const info = account.account.data.parsed.info;
            console.log("NFT found.");
            console.log("Owner:", walletAddress);
            console.log("Token account:", account.pubkey.toBase58());
            console.log("Amount:", info.tokenAmount.uiAmountString);
        }
    }

    process.exit(0);
}

console.log("[Owner check] Searching token account with amount 1...");
const largestAccounts = await connection.getTokenLargestAccounts(mint);
const activeAccount = largestAccounts.value.find((account) => account.uiAmount === 1);

if (!activeAccount) {
    console.log("NFT owner not found. No token account with amount 1 exists for this mint.");
    process.exit(0);
}

console.log("[Owner check] Reading active token account...");
const accountInfo = await connection.getParsedAccountInfo(activeAccount.address);
const parsedData = accountInfo.value?.data;

if (!parsedData || typeof parsedData === "string" || !("parsed" in parsedData)) {
    throw new Error("Unable to parse token account owner.");
}

const owner = parsedData.parsed.info.owner;
console.log("NFT found.");
console.log("Owner:", owner);
console.log("Token account:", activeAccount.address.toBase58());
console.log("Amount:", activeAccount.uiAmountString);

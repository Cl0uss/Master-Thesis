import { Connection, PublicKey } from "@solana/web3.js";

const mintAddress = process.argv[2];
const walletAddress = process.argv[3];

if (!mintAddress || !walletAddress) {
    console.error("Usage: npx tsx checkNftOwner.ts <mintAddress> <walletAddress>");
    process.exit(1);
}

const connection = new Connection("https://api.mainnet-beta.solana.com");

const mint = new PublicKey(mintAddress);
const owner = new PublicKey(walletAddress);

const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
    mint
});

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
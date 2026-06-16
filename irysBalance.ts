import fs from "node:fs";
import { Uploader } from "@irys/upload";
import { Solana } from "@irys/upload-solana";

const walletPath = process.argv[2];

if (!walletPath) {
    console.error("Usage: npx tsx irysBalance.ts <walletPath>");
    process.exit(1);
}

const wallet = JSON.parse(fs.readFileSync(walletPath, "utf8"));
const irys = await Uploader(Solana).withWallet(wallet);

const balance = await irys.getBalance();
console.log("Irys atomic balance:", balance.toString());
console.log("Irys SOL balance:", irys.utils.fromAtomic(balance).toString());
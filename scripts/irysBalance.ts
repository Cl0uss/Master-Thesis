import fs from "node:fs";
import { Uploader } from "@irys/upload";
import { Solana } from "@irys/upload-solana";

import { loadConfig, resolveConfigPath } from "./config.js";

// Prints the current Irys balance for the configured or provided wallet.
const config = loadConfig();
const walletPath = process.argv[2] ?? resolveConfigPath(config.walletPath);

// Load the wallet before asking Irys for its funded balance.
const wallet = JSON.parse(fs.readFileSync(walletPath, "utf8"));
const irys = await Uploader(Solana).withWallet(wallet);

const balance = await irys.getBalance();
console.log("Irys atomic balance:", balance.toString());
console.log("Irys SOL balance:", irys.utils.fromAtomic(balance).toString());

package functions;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;

// Bridges Java pipeline code to the TypeScript Solana mint script.
public class NftMinter {

    // Mints one NFT from an uploaded metadata URI and returns parsed mint details.
    public static MintResult mint(
            String metadataUri,
            Path walletPath,
            String nftName,
            String symbol,
            String rpcUrl,
            int sellerFeePercent
    ) throws Exception {

        ProcessBuilder processBuilder = new ProcessBuilder(
                "npx",
                "tsx",
                "scripts/mintNft.ts",
                metadataUri,
                nftName,
                walletPath.toString(),
                symbol,
                rpcUrl,
                String.valueOf(sellerFeePercent)
        );

        Process process = processBuilder.start();

        StringBuilder stdout = new StringBuilder();
        StringBuilder stderr = new StringBuilder();

        // Print TypeScript progress logs live while stdout remains machine-readable.
        Thread stderrThread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getErrorStream())
            )) {
                String line;

                while ((line = reader.readLine()) != null) {
                    stderr.append(line).append(System.lineSeparator());
                    System.out.println(line);
                }
            } catch (Exception exception) {
                stderr.append(exception.getMessage()).append(System.lineSeparator());
            }
        });

        stderrThread.start();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
        )) {
            String line;

            while ((line = reader.readLine()) != null) {
                stdout.append(line).append(System.lineSeparator());
            }
        }

        int exitCode = process.waitFor();
        stderrThread.join();

        if (exitCode != 0) {
            throw new RuntimeException("NFT mint failed:\n" + stderr);
        }

        String mintAddress = null;
        String transactionSignature = null;

        // Parse the structured result lines emitted by mintNft.ts.
        for (String line : stdout.toString().split("\\R")) {
            if (line.startsWith("MINT_ADDRESS=")) {
                mintAddress = line.substring("MINT_ADDRESS=".length());
            }

            if (line.startsWith("TRANSACTION_SIGNATURE=")) {
                transactionSignature = line.substring("TRANSACTION_SIGNATURE=".length());
            }
        }

        if (mintAddress == null || transactionSignature == null) {
            throw new RuntimeException("Unable to parse mint result:\n" + stdout);
        }

        return new MintResult(mintAddress, transactionSignature);
    }

    public record MintResult(String mintAddress, String transactionSignature) {
    }
}
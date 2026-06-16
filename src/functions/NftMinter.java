package functions;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;

public class NftMinter {

    public static MintResult mint(
            String metadataUri,
            Path walletPath,
            String nftName,
            String symbol
    ) throws Exception {

        ProcessBuilder processBuilder = new ProcessBuilder(
                "npx",
                "tsx",
                "mintNft.ts",
                metadataUri,
                walletPath.toString(),
                nftName,
                symbol
        );

        Process process = processBuilder.start();

        StringBuilder stdout = new StringBuilder();
        StringBuilder stderr = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
        )) {
            String line;

            while ((line = reader.readLine()) != null) {
                stdout.append(line).append(System.lineSeparator());
            }
        }

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getErrorStream())
        )) {
            String line;

            while ((line = reader.readLine()) != null) {
                stderr.append(line).append(System.lineSeparator());
            }
        }

        int exitCode = process.waitFor();

        if (exitCode != 0) {
            throw new RuntimeException("NFT mint failed:\n" + stderr);
        }

        String mintAddress = null;
        String transactionSignature = null;

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
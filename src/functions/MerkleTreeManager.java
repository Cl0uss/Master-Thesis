package functions;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Ensures the selected network has the Merkle Tree config required for cNFT minting.
public class MerkleTreeManager {

    public static void ensureMerkleTree(Path networkConfigDirectory, Path walletPath, String network) throws Exception {
        Path cnftConfigPath = networkConfigDirectory.resolve("cnft-config.json");

        if (Files.exists(cnftConfigPath)) {
            System.out.println("Compressed NFT Merkle Tree config found: " + cnftConfigPath);
            return;
        }

        System.out.println("Compressed NFT Merkle Tree config missing: " + cnftConfigPath);
        System.out.println("Creating Merkle Tree on " + network + " using wallet: " + walletPath);

        ProcessBuilder processBuilder = new ProcessBuilder(
                "npx",
                "tsx",
                "scripts/createMerkleTree.ts",
                walletPath.toString(),
                "--network",
                network
        );

        Process process = processBuilder.start();

        StringBuilder output = new StringBuilder();

        Thread stdoutThread = new Thread(() -> readStream(process.getInputStream(), output));
        Thread stderrThread = new Thread(() -> readStream(process.getErrorStream(), output));

        stdoutThread.start();
        stderrThread.start();

        int exitCode = process.waitFor();
        stdoutThread.join();
        stderrThread.join();

        if (exitCode != 0) {
            String readableError = readableInsufficientFundsError(output.toString());

            if (readableError != null) {
                throw new RuntimeException(readableError + "\n\nFull Merkle Tree creation log:\n" + output);
            }

            throw new RuntimeException("Merkle Tree creation failed:\n" + output);
        }

        if (!Files.exists(cnftConfigPath)) {
            throw new RuntimeException("Merkle Tree command completed, but config was not created: " + cnftConfigPath);
        }

        System.out.println("Merkle Tree config created: " + cnftConfigPath);
    }

    private static void readStream(java.io.InputStream stream, StringBuilder output) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream))) {
            String line;

            while ((line = reader.readLine()) != null) {
                output.append(line).append(System.lineSeparator());
                System.out.println(line);
            }
        } catch (Exception exception) {
            output.append(exception.getMessage()).append(System.lineSeparator());
        }
    }

    private static String readableInsufficientFundsError(String output) {
        Pattern pattern = Pattern.compile("insufficient lamports (\\d+), need (\\d+)");
        Matcher matcher = pattern.matcher(output);

        if (!matcher.find()) {
            return null;
        }

        long availableLamports = Long.parseLong(matcher.group(1));
        long requiredLamports = Long.parseLong(matcher.group(2));
        long missingLamports = Math.max(0, requiredLamports - availableLamports);

        return String.format(
                "Insufficient SOL to create the compressed NFT Merkle Tree. Available: %.9f SOL. Required: %.9f SOL. Missing: %.9f SOL. Fund the wallet with at least the missing amount plus a small transaction-fee buffer, then rerun the pipeline.",
                lamportsToSol(availableLamports),
                lamportsToSol(requiredLamports),
                lamportsToSol(missingLamports)
        );
    }

    private static double lamportsToSol(long lamports) {
        return lamports / 1_000_000_000.0;
    }
}

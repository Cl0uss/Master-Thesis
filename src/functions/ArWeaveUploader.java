package functions;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;

public class ArWeaveUploader {

    public static String upload(Path filePath, Path walletPath) throws Exception {

        ProcessBuilder processBuilder = new ProcessBuilder(
                "node",
                "upload-to-arweave.js",
                filePath.toString(),
                walletPath.toString()
        );

        processBuilder.redirectErrorStream(true);

        Process process = processBuilder.start();

        StringBuilder output = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
        )) {
            String line;

            while ((line = reader.readLine()) != null) {
                output.append(line).append(System.lineSeparator());
            }
        }

        int exitCode = process.waitFor();

        if (exitCode != 0) {
            throw new RuntimeException("Arweave upload failed:\n" + output);
        }

        return output.toString().trim();
    }
}
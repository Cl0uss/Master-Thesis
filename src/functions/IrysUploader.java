package functions;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;

public class IrysUploader {

    public static String upload(Path filePath, Path walletPath) throws Exception {

        ProcessBuilder processBuilder = new ProcessBuilder(
                "npx",
                "tsx",
                "uploadToIrys.ts",
                filePath.toString(),
                walletPath.toString()
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
            throw new RuntimeException("Irys upload failed:\n" + stderr);
        }

        return stdout.toString().trim();
    }
}
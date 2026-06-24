package functions;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;

// Bridges Java pipeline code to the TypeScript Irys upload script.
public class IrysUploader {

    // Uploads one file to Irys and returns only the final gateway URI from stdout.
    public static String upload(Path filePath, Path walletPath) throws Exception {

        ProcessBuilder processBuilder = new ProcessBuilder(
                "npx",
                "tsx",
                "scripts/uploadToIrys.ts",
                filePath.toString(),
                walletPath.toString()
        );

        Process process = processBuilder.start();

        StringBuilder stdout = new StringBuilder();
        StringBuilder stderr = new StringBuilder();

        // Print TypeScript progress logs live while keeping stdout reserved for the URI.
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

        // Capture stdout separately because uploadToIrys.ts prints the result URI there.
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
            throw new RuntimeException("Irys upload failed:\n" + stderr);
        }

        return stdout.toString().trim();
    }
}

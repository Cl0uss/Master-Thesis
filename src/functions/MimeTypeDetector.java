package functions;

import java.nio.file.Files;
import java.nio.file.Path;

// Detects MIME types and maps them to NFT metadata categories.
public class MimeTypeDetector {

    // Uses the operating system MIME detector with a safe fallback.
    public static String detect(Path filePath) throws Exception {

        String mimeType = Files.probeContentType(filePath);

        if (mimeType == null) {
            mimeType = "application/octet-stream";
        }

        return mimeType;
    }

    // Maps MIME type strings into broad NFT categories.
    public static String getCategory(String mimeType) {

        if (mimeType.startsWith("audio")) {
            return "audio";
        } else if (mimeType.startsWith("image")) {
            return "image";
        } else if (mimeType.equals("application/pdf")) {
            return "document";
        } else {
            return "unknown";
        }
    }

    // Chooses the suffix used in generated metadata file names.
    public static String getMetadataSuffix(String mimeType) {

        if (mimeType.startsWith("audio")) {
            return "Audio";
        } else if (mimeType.startsWith("image")) {
            return "Image";
        } else if (mimeType.equals("application/pdf")) {
            return "Document";
        } else {
            return "Asset";
        }
    }
}
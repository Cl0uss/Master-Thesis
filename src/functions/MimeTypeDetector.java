package functions;

import java.nio.file.Files;
import java.nio.file.Path;

public class MimeTypeDetector {

    public static String detect(Path filePath) throws Exception {

        String mimeType = Files.probeContentType(filePath);

        if (mimeType == null) {
            mimeType = "application/octet-stream";
        }

        return mimeType;
    }

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
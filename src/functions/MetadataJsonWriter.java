package functions;

import java.nio.file.Files;
import java.nio.file.Path;

public class MetadataJsonWriter {

    public static void write(
            Path outputPath,
            String fileName,
            String arweaveAssetUri,
            String category,
            String mimeType,
            long fileSize,
            String sha256,
            String creatorWallet
    ) throws Exception {

        String metadata = """
                {
                  "name": "%s",
                  "symbol": "TMDC",
                  "description": "Digital asset used as part of a blockchain-based transmedia digital content framework.",
                  "image": "%s",
                  "animation_url": "%s",
                  "seller_fee_basis_points": 500,
                  "attributes": [
                    {
                      "trait_type": "Content Type",
                      "value": "%s"
                    },
                    {
                      "trait_type": "Original Filename",
                      "value": "%s"
                    },
                    {
                      "trait_type": "MIME Type",
                      "value": "%s"
                    },
                    {
                      "trait_type": "File Size",
                      "value": "%d bytes"
                    },
                    {
                      "trait_type": "SHA-256",
                      "value": "%s"
                    }
                  ],
                  "properties": {
                    "files": [
                      {
                        "uri": "%s",
                        "type": "%s"
                      }
                    ],
                    "category": "%s",
                    "creators": [
                      {
                        "address": "%s",
                        "share": 100
                      }
                    ]
                  }
                }
                """.formatted(
                fileName, arweaveAssetUri, arweaveAssetUri,
                category, fileName, mimeType, fileSize, sha256,
                arweaveAssetUri, mimeType, category, creatorWallet
        );

        Files.writeString(outputPath, metadata);
    }
}

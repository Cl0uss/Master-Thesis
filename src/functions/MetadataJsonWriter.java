package functions;

import java.nio.file.Files;
import java.nio.file.Path;

// Writes Metaplex-compatible metadata JSON for uploaded assets.
public class MetadataJsonWriter {

    public static void write(
            Path outputPath,
            String fileName,
            String assetUri,
            String coverUri,
            String category,
            String mimeType,
            long fileSize,
            String sha256,
            String creatorWallet,
            String symbol,
            int sellerFeePercent,
            String description
    ) throws Exception {

        // Choose metadata media fields based on whether the asset needs a cover image.
        String mediaFields;

        if (category.equals("audio") || category.equals("document")) {
            mediaFields = """
                  "image": "%s",
                  "animation_url": "%s",
            """.formatted(coverUri, assetUri);
        } else {
            mediaFields = """
                  "image": "%s",
            """.formatted(assetUri);
        }

        // Build the final JSON document consumed by Metaplex during minting.
        String metadata = """
                {
                  "name": "%s",
                  "symbol": "%s",
                  "description": "%s",
                %s
                  "seller_fee_basis_points": %d,
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
                fileName,
                symbol,
                description,
                mediaFields,
                sellerFeePercent * 100,
                category,
                fileName,
                mimeType,
                fileSize,
                sha256,
                assetUri,
                mimeType,
                category,
                creatorWallet
        );

        // Persist metadata locally so it can be inspected and uploaded to Irys.
        Files.writeString(outputPath, metadata);
    }
}

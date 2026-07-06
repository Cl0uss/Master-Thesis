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

        String safeFileName = escapeJson(fileName);
        String safeAssetUri = escapeJson(assetUri);
        String safeCoverUri = escapeJson(coverUri);
        String safeCategory = escapeJson(category);
        String safeMimeType = escapeJson(mimeType);
        String safeSha256 = escapeJson(sha256);
        String safeCreatorWallet = escapeJson(creatorWallet);
        String safeSymbol = escapeJson(symbol);
        String safeDescription = escapeJson(description);

        String contentType = inferContentType(category, mimeType);
        String hierarchyLevel = inferHierarchyLevel(category);
        String accessTier = inferAccessTier(category);
        String editionType = "Open";
        String collectionRole = inferCollectionRole(category);
        String storageLayer = "Irys";
        String blockchainLayer = "Solana";
        String distributionModel = "Transmedia Digital Content";
        String assetStandard = "Standard NFT / cNFT compatible metadata";

        // Choose metadata media fields based on whether the asset needs a cover image.
        String mediaFields;

        if (category.equals("audio") || category.equals("document")) {
            mediaFields = """
                  "image": "%s",
                  "animation_url": "%s",
                  "external_url": "%s",
            """.formatted(safeCoverUri, safeAssetUri, safeAssetUri);
        } else {
            mediaFields = """
                  "image": "%s",
                  "external_url": "%s",
            """.formatted(safeAssetUri, safeAssetUri);
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
                      "trait_type": "Hierarchy Level",
                      "value": "%s"
                    },
                    {
                      "trait_type": "Access Tier",
                      "value": "%s"
                    },
                    {
                      "trait_type": "Edition Type",
                      "value": "%s"
                    },
                    {
                      "trait_type": "Collection Role",
                      "value": "%s"
                    },
                    {
                      "trait_type": "Distribution Model",
                      "value": "%s"
                    },
                    {
                      "trait_type": "Storage Layer",
                      "value": "%s"
                    },
                    {
                      "trait_type": "Blockchain Layer",
                      "value": "%s"
                    },
                    {
                      "trait_type": "Asset Standard",
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
                    "category": "%s",
                    "content_type": "%s",
                    "hierarchy_level": "%s",
                    "access_tier": "%s",
                    "edition_type": "%s",
                    "collection_role": "%s",
                    "distribution_model": "%s",
                    "storage_layer": "%s",
                    "blockchain_layer": "%s",
                    "files": [
                      {
                        "uri": "%s",
                        "type": "%s"
                      }
                    ],
                    "creators": [
                      {
                        "address": "%s",
                        "share": 100
                      }
                    ]
                  }
                }
                """.formatted(
                safeFileName,
                safeSymbol,
                safeDescription,
                mediaFields,
                sellerFeePercent * 100,

                escapeJson(contentType),
                escapeJson(hierarchyLevel),
                escapeJson(accessTier),
                escapeJson(editionType),
                escapeJson(collectionRole),
                escapeJson(distributionModel),
                escapeJson(storageLayer),
                escapeJson(blockchainLayer),
                escapeJson(assetStandard),
                safeFileName,
                safeMimeType,
                fileSize,
                safeSha256,

                safeCategory,
                escapeJson(contentType),
                escapeJson(hierarchyLevel),
                escapeJson(accessTier),
                escapeJson(editionType),
                escapeJson(collectionRole),
                escapeJson(distributionModel),
                escapeJson(storageLayer),
                escapeJson(blockchainLayer),
                safeAssetUri,
                safeMimeType,
                safeCreatorWallet
        );

        // Persist metadata locally so it can be inspected and uploaded to Irys.
        Files.writeString(outputPath, metadata);
    }

    private static String inferContentType(String category, String mimeType) {
        if (category == null) {
            return "Unknown";
        }

        return switch (category) {
            case "image" -> "Image";
            case "audio" -> "Audio";
            case "document" -> "Document";
            case "video" -> "Video";
            default -> {
                if (mimeType != null && mimeType.contains("/")) {
                    yield capitalize(mimeType.substring(0, mimeType.indexOf("/")));
                }

                yield capitalize(category);
            }
        };
    }

    private static String inferHierarchyLevel(String category) {
        if (category == null) {
            return "Atomic";
        }

        return switch (category) {
            case "collection" -> "Core";
            case "bundle" -> "Bundle";
            default -> "Atomic";
        };
    }

    private static String inferAccessTier(String category) {
        if (category == null) {
            return "Holder";
        }

        return switch (category) {
            case "preview" -> "Preview";
            case "premium" -> "Premium";
            default -> "Holder";
        };
    }

    private static String inferCollectionRole(String category) {
        if (category == null) {
            return "Item";
        }

        return switch (category) {
            case "collection" -> "Main Collection";
            case "bundle" -> "Bundle";
            default -> "Item";
        };
    }

    private static String capitalize(String value) {
        if (value == null || value.isBlank()) {
            return "Unknown";
        }

        return value.substring(0, 1).toUpperCase() + value.substring(1).toLowerCase();
    }

    private static String escapeJson(String value) {
        if (value == null) {
            return "";
        }

        StringBuilder escaped = new StringBuilder();

        for (int index = 0; index < value.length(); index++) {
            char character = value.charAt(index);

            switch (character) {
                case '"' -> escaped.append("\\\"");
                case '\\' -> escaped.append("\\\\");
                case '\b' -> escaped.append("\\b");
                case '\f' -> escaped.append("\\f");
                case '\n' -> escaped.append("\\n");
                case '\r' -> escaped.append("\\r");
                case '\t' -> escaped.append("\\t");
                default -> {
                    if (character < 0x20) {
                        escaped.append(String.format("\\u%04x", (int) character));
                    } else {
                        escaped.append(character);
                    }
                }
            }
        }

        return escaped.toString();
    }
}
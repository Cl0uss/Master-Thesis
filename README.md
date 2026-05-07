# Transmedia Digital Content Metadata Generator

This project is part of the master thesis:

> A Blockchain-Based Framework for the Distribution, Ownership, and Monetization of Transmedia Digital Content

## Requirements

- Java 17+ (recommended)
- Visual Studio Code
- Extension Pack for Java for VSCode

VSCode extension:

https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack

## Project Structure

```text
MASTER-THESIS/
├── metadata/
│   ├── bonkAudio.json
│   └── memeImage.json
│
├── rawFiles/
│   ├── bonk.mp3
│   └── meme.jpeg
│
├── src/
│   ├── functions/
│   │   ├── FileHashGenerator.java
│   │   ├── MetadataJsonWriter.java
│   │   └── MimeTypeDetector.java
│   │
│   └── Main.java
│
└── .vscode/
      └── launch.json
```

## Running the Project

The project is configured to run using VSCode launch configurations.

To run the project:

1. Open the project in VSCode
2. Open `Main.java`
3. Press `Run` or `F5`

## Selecting the File to Process

The file name is configured inside:

```text
.vscode/launch.json
```

Example:

```json
"args": "bonk.mp3"
```

If you want to process another file, replace:

```json
"bonk.mp3"
```

with the desired file name located inside:

```text
rawFiles/
```

Example:

```json
"args": "meme.jpeg"
```

## Current Features

- SHA-256 file hashing
- MIME type detection
- Automatic metadata JSON generation
- Support for audio and image assets
- Metaplex-compatible metadata structure
- Creator wallet integration

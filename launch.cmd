@echo off
setlocal

cd /d "%~dp0"

if "%~1"=="" (
    echo Usage: ./launch [file-name]
    echo Example: ./launch bonk.mp3
    exit /b 1
)

if not exist "out" mkdir "out"

javac -d "out" "src\Main.java" "src\functions\FileHashGenerator.java" "src\functions\MetadataJsonWriter.java" "src\functions\MimeTypeDetector.java"
if errorlevel 1 exit /b 1

java -cp "out" Main "%~1"

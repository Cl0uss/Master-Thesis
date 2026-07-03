import http from "node:http";
import path from "node:path";

export function sendJson(
    response: http.ServerResponse,
    data: unknown,
    status = 200
): void {
    response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8"
    });

    response.end(JSON.stringify(data));
}

export function readRequestBody(
    request: http.IncomingMessage
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        request.on("data", (chunk: Buffer) => chunks.push(chunk));
        request.on("end", () => resolve(Buffer.concat(chunks)));
        request.on("error", reject);
    });
}

export function sanitizeFilename(filename: string): string {
    return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
}
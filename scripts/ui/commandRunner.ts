import http from "node:http";
import { spawn } from "node:child_process";

export function runCommand(
    response: http.ServerResponse,
    args: string[],
    label: string,
    projectRoot: string
): void {
    response.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff"
    });

    response.write(`$ ${args.join(" ")}\n\n`);

    const child = spawn(args[0], args.slice(1), {
        cwd: projectRoot,
        env: process.env
    });

    child.stdout.on("data", (chunk: Buffer) => response.write(chunk));
    child.stderr.on("data", (chunk: Buffer) => response.write(chunk));

    child.on("close", (code) => {
        response.write(`\nProcess exited with code ${code}\n`);

        if (code !== 0) {
            response.write(`${label} failed. Check the log above for the first error message.\n`);
        }

        response.end();
    });

    child.on("error", (error) => {
        response.write(`\nFailed to start ${label.toLowerCase()}: ${error.message}\n`);
        response.end();
    });
}
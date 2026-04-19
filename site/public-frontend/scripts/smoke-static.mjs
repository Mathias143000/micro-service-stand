import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const routesToCheck = ["/", "/list", "/login", "/register", "/1", "/new-builds", "/city/mumbai"];

function getContentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

async function readResponseFile(urlPath) {
  const cleanPath = urlPath === "/" ? "/index.html" : urlPath;
  const candidatePath = path.join(distDir, cleanPath);

  try {
    const stats = await fs.stat(candidatePath);
    if (stats.isFile()) {
      return {
        body: await fs.readFile(candidatePath),
        type: getContentType(candidatePath),
      };
    }
  } catch {
    // Fall back to SPA shell.
  }

  const indexPath = path.join(distDir, "index.html");
  return {
    body: await fs.readFile(indexPath),
    type: "text/html; charset=utf-8",
  };
}

async function main() {
  await fs.access(path.join(distDir, "index.html"));

  const server = http.createServer(async (req, res) => {
    try {
      const target = new URL(req.url, "http://127.0.0.1").pathname;
      const responseFile = await readResponseFile(target);
      res.writeHead(200, { "Content-Type": responseFile.type });
      res.end(responseFile.body);
    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(String(error));
    }
  });

  await new Promise((resolve) => server.listen(4173, "127.0.0.1", resolve));

  try {
    for (const route of routesToCheck) {
      const response = await fetch(`http://127.0.0.1:4173${route}`);
      const html = await response.text();

      if (!response.ok) {
        throw new Error(`Route ${route} returned ${response.status}`);
      }
      if (!html.includes("<title>Real Estate App</title>")) {
        throw new Error(`Route ${route} did not return the app shell`);
      }
    }

    console.log(`Static smoke passed for ${routesToCheck.length} routes`);
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


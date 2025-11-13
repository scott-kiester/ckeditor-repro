import express from "express";
import fs from 'fs';
import { fileURLToPath } from "url";
import path from "path";
const app = express();
const DEFAULT_PORT = 8008;
function getDataDir() {
    const thisDir = path.dirname(fileURLToPath(import.meta.url));
    return path.join(thisDir, '..', 'data');
}
function getFilePath(file) {
    const dir = getDataDir();
    const filePath = path.resolve(getDataDir(), file);
    if (!filePath.startsWith(dir)) {
        throw new Error(`Invalid path: ${file}.`);
    }
    return filePath;
}
function getFile(req, res) {
    const file = req.query.file;
    if (!file || typeof file !== 'string') {
        throw new Error('File parameter missing or invalid.');
    }
    const filePath = getFilePath(file);
    const fileContents = fs.readFileSync(filePath);
    console.info(`Sending file to client: ${filePath}.`);
    res.setHeader('Content-Type', 'text/html');
    res.send(fileContents);
}
function serve() {
    app.get("/api", (req, res) => {
        try {
            getFile(req, res);
        }
        catch (err) {
            res.status(500).send(`Request failed: ${err.message ?? err}`);
        }
    });
    app.listen(DEFAULT_PORT, '127.0.0.1', () => {
        console.info(`Server listening on port ${DEFAULT_PORT}.`);
    });
}
serve();
//# sourceMappingURL=index.js.map
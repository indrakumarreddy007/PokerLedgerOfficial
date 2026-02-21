import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiDir = path.join(__dirname, 'api');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function migrateEndpoints() {
    walkDir(apiDir, function (filePath) {
        if (!filePath.endsWith('.ts') || filePath.includes('db.ts') || filePath.includes('tsconfig.json')) return;

        let content = fs.readFileSync(filePath, 'utf-8');

        // Remove vercel import
        content = content.replace(/import type \{ VercelRequest, VercelResponse \} from '@vercel\/node';/, "import type { Request, Response } from 'express';");

        // Change handler signature
        content = content.replace(/export default async function handler\(req: VercelRequest, res: VercelResponse\)/g, "export const handler = async (req: Request, res: Response)");
        content = content.replace(/export default function handler\(req: VercelRequest, res: VercelResponse\)/g, "export const handler = (req: Request, res: Response)");

        // Replace req.query destructuring for [id] parameters because Express uses req.params
        // The file name usually dictates the param. Like [id].ts or [userId].ts
        const match = filePath.match(/\[(.*?)\]\.ts$/);
        if (match) {
            const paramName = match[1];
            // If it uses req.query, we change it to req.params for the dynamic part
            // Or just merge req.params into req.query in the express server, so we don't even have to change it!
            // Yes, let's just merge params into query in Express, that way less code changes in handlers.
        }

        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Migrated', filePath);
    });
}

migrateEndpoints();

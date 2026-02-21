import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiDir = path.join(__dirname, 'api');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

walkDir(apiDir, function (filePath) {
    if (!filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf-8');

    // Fix missing arrow in async functions
    content = content.replace(/export const handler = async \(req: Request, res: Response\)\s*\{/g, 'export const handler = async (req: Request, res: Response) => {');
    // Fix missing arrow in sync functions  
    content = content.replace(/export const handler = \(req: Request, res: Response\)\s*\{/g, 'export const handler = (req: Request, res: Response) => {');

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Fixed', filePath);
});

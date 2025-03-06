import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
    server: {
        https: {
            key: fs.readFileSync('./config/cert.key'),
            cert: fs.readFileSync('./config/cert.crt'),
        },
    },
});
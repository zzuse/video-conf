import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
    server: {
        https: {
            // key: fs.readFileSync('/etc/letsencrypt/live/zzuseturn.duckdns.org/privkey.pem'),
            // cert: fs.readFileSync('/etc/letsencrypt/live/zzuseturn.duckdns.org/fullchain.pem'),
            key: fs.readFileSync('./config/cert.key'),
            cert: fs.readFileSync('./config/cert.crt'),
        },
    },
});
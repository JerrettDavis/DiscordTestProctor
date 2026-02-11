import path from "path"
import {defineConfig} from 'vite'
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react-swc'

import dotenv from 'dotenv';
import * as fs from "node:fs";

dotenv.config();
dotenv.config({path: `.env.local`});
dotenv.config({path: '.env.development'});
dotenv.config({path: '.env.development.local'});

const port = parseInt(process.env.VITE_PORT || '3000')
const cert = process.env.SSL_CRT_FILE;
const key = process.env.SSL_KEY_FILE;
const apiUrl = process.env.VITE_API_URL;
const baseUrl = process.env.VITE_BASE_URL;

// https://vite.dev/config/
export default defineConfig(({ command }) => {
    const isDevServer = command === "serve";

    if (isDevServer && (!cert || !key)) {
        throw new Error('SSL_CERT_FILE and SSL_KEY_FILE must be set in .env');
    }

    return {
        base: baseUrl,
        plugins: [
            tailwindcss(),
            react()
        ],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        server: isDevServer ? {
            port: port,
            https: {
                key: fs.readFileSync(key!),
                cert: fs.readFileSync(cert!)
            },
            proxy: {
                '/api': {
                    target: apiUrl,
                    changeOrigin: false,
                    secure: false,
                },
                '/hubs': {
                    target: apiUrl,
                    changeOrigin: false,
                    secure: false,
                    ws: true,
                },
                '/js': {
                    target: apiUrl,
                    changeOrigin: false,
                    secure: false,
                },
                '/lib': {
                    target: apiUrl,
                    changeOrigin: false,
                    secure: false,
                },
                '/Identity': {
                    target: apiUrl,
                    changeOrigin: false,
                    secure: false,
                },
                '/signin-discord': {
                    target: apiUrl,
                    changeOrigin: false,
                    secure: false,
                },
                'weatherforecast': {
                    target: apiUrl,
                    changeOrigin: false,
                    secure: false,
                },
                'WeatherForecast': {
                    target: apiUrl,
                    changeOrigin: false,
                    secure: false,
                }
            }
        } : undefined
    }
})

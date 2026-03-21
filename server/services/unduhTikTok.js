import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * UnduhTikTok API Downloader (Strict User Log Matching)
 */
export async function downloadFromUnduhTikTok(videoUrl) {
    const apiUrl = 'https://unduhtiktok.com/wp-content/plugins/app-snaptik/api/tiktok.php';
    const baseUrl = 'https://unduhtiktok.com/vi/douyin/';

    try {
        console.log(`[UnduhTikTok] 📥 Processing URL:`, videoUrl);

        // 1. Clean URL
        const cleanUrl = videoUrl.split('?')[0];

        // 2. Obtain session cookies
        console.log(`[UnduhTikTok] 🍪 Obtaining session cookies...`);
        const homeRes = await axios.get(baseUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            }
        });

        const cookies = homeRes.headers['set-cookie'];
        const cookieString = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';

        // 3. Send POST request with JSON body - NO TOKEN (to match content-length 58)
        console.log(`[UnduhTikTok] 🚀 Requesting API (Strict JSON)...`);

        const response = await axios({
            method: 'post',
            url: apiUrl,
            data: { url: cleanUrl }, // Exact payload for length 58
            headers: {
                'authority': 'unduhtiktok.com',
                'accept': '*/*',
                'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                'content-type': 'application/json',
                'cookie': cookieString,
                'origin': 'https://unduhtiktok.com',
                'referer': 'https://unduhtiktok.com/vi/douyin/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
                'x-requested-with': 'XMLHttpRequest'
            }
        });

        if (response.data && response.data.video) {
            console.log(`[UnduhTikTok] ✅ Success!`);
            return {
                title: response.data.desc ? response.data.desc.trim() : 'Untitled',
                author: 'Unknown',
                downloadUrl: response.data.video,
                thumbnail: response.data.dynamic_cover
            };
        } else {
            console.log(`[UnduhTikTok] ❌ API Content:`, response.data);
            throw new Error(response.data?.mess || 'Invalid response from API');
        }
    } catch (error) {
        if (error.response) {
            console.error(`[UnduhTikTok] ❌ HTTP ${error.response.status}:`, error.response.data);
        } else {
            console.error(`[UnduhTikTok] ❌ Client Error:`, error.message);
        }
        throw error;
    }
}

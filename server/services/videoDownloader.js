import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { downloadFromUnduhTikTok } from './unduhTikTok.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VERSION = '3.1-Rate-Limit-Aware';

// Helper to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Global lock or timestamp to ensure 1 request per second
let lastRequestTime = 0;
async function throttledTikWM(payload) {
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;
    if (timeSinceLast < 1500) { // Keep it safe at 1.5s
        const waitTime = 1500 - timeSinceLast;
        console.log(`[${VERSION}] 🛡️ Throttling: waiting ${waitTime}ms...`);
        await sleep(waitTime);
    }

    lastRequestTime = Date.now();
    return await axios.post('https://www.tikwm.com/api/', payload, {
        timeout: 15000,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
}

/**
 * Download video from TikTok or Douyin without watermark
 */
export async function downloadVideo(videoUrl, retryCount = 0) {
    try {
        if (retryCount > 3) throw new Error('Maximum retry attempts reached');

        console.log(`[${VERSION}] 📥 Processing URL (Attempt ${retryCount + 1}):`, videoUrl);

        // 1. Clean URL
        let cleanUrl = videoUrl.trim();
        const urlMatch = cleanUrl.match(/https?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/);
        if (urlMatch) {
            cleanUrl = urlMatch[0];
            cleanUrl = cleanUrl.replace(/[.,!?;:]+$/, '');
        }
        console.log(`[${VERSION}] 🔍 Sanitized URL:`, cleanUrl);

        // 2. Resolve Short Links
        if (cleanUrl.includes('v.douyin.com') || cleanUrl.includes('vt.tiktok.com') || cleanUrl.includes('vm.tiktok.com')) {
            console.log(`[${VERSION}] 🔄 Resolving shortened URL:`, cleanUrl);
            try {
                const redirectRes = await axios.get(cleanUrl, {
                    maxRedirects: 10,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
                    }
                });
                const finalUrl = redirectRes.request?.res?.responseUrl || redirectRes.config?.url;
                if (finalUrl) {
                    cleanUrl = finalUrl.split('?')[0];
                    console.log(`[${VERSION}] ✅ Resolved to:`, cleanUrl);
                }
            } catch (err) {
                const location = err.response?.headers?.location;
                if (location) {
                    cleanUrl = location.split('?')[0];
                    console.log(`[${VERSION}] 🔄 Resolved via Location header:`, cleanUrl);
                }
            }
        }

        // 3. Extract ID
        const douyinIdMatch = cleanUrl.match(/video\/(\d+)/);
        const videoId = douyinIdMatch ? douyinIdMatch[1] : cleanUrl.match(/\d{15,25}/)?.[0];

        // 4. Try Main Method (TikWM)
        console.log(`[${VERSION}] 🚀 Requesting TikWM...`);
        let response;
        try {
            response = await throttledTikWM({ url: cleanUrl, hd: 1 });
        } catch (e) {
            console.log(`[${VERSION}] ⚠️ TikWM request error:`, e.message);
        }

        // Handle Rate Limit or Error
        if (response?.data?.msg?.includes('Api Limit') || response?.data?.msg?.includes('1 request/second')) {
            console.log(`[${VERSION}] ⏳ API Rate Limit hit. Sleeping 3s before retry...`);
            await sleep(3000);
            return downloadVideo(videoUrl, retryCount + 1);
        }

        if (response?.data?.code === 0 && response?.data?.data) {
            return await saveVideoFromData(response.data.data, cleanUrl);
        }

        // 5. Fallback 1: Try with IesDouyin format if it's Douyin
        if (cleanUrl.includes('douyin.com') && videoId && !cleanUrl.includes('iesdouyin.com')) {
            console.log(`[${VERSION}] 🔄 Retrying with IesDouyin format...`);
            const iesUrl = `https://www.iesdouyin.com/share/video/${videoId}/`;
            const iesResponse = await throttledTikWM({ url: iesUrl, hd: 1 });

            if (iesResponse.data?.code === 0 && iesResponse.data?.data) {
                return await saveVideoFromData(iesResponse.data.data, cleanUrl);
            }
        }

        // 6. Fallback 2: LoveTik
        console.log(`[${VERSION}] ⚠️ TikWM failed, trying LoveTik Fallback...`);
        try {
            const loveTikResponse = await axios.post('https://lovetik.com/api/ajax/search',
                new URLSearchParams({ query: cleanUrl }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
            );

            if (loveTikResponse.data?.links) {
                const videoLink = loveTikResponse.data.links.find(l => l.t.includes('No Watermark')) || loveTikResponse.data.links[0];
                if (videoLink?.a) {
                    return await saveFromDirectUrl(videoLink.a, loveTikResponse.data.title || 'Untitled', cleanUrl);
                }
            }
        } catch (ltError) {
            console.log(`[${VERSION}] ⚠️ LoveTik failed:`, ltError.message);
        }

        // 6. Fallback 2: UnduhTikTok (New API)
        console.log(`[${VERSION}] ⚠️ LoveTik failed, trying UnduhTikTok Fallback...`);
        try {
            const unduhData = await downloadFromUnduhTikTok(cleanUrl);
            if (unduhData && unduhData.downloadUrl) {
                return await saveFromDirectUrl(unduhData.downloadUrl, unduhData.title, cleanUrl);
            }
        } catch (unduhErr) {
            console.log(`[${VERSION}] ⚠️ UnduhTikTok failed:`, unduhErr.message);
        }

        // 7. Final Fallback: ID Lookup
        if (videoId) {
            console.log(`[${VERSION}] 🚀 Final fallback: ID lookup (${videoId})...`);
            try {
                // TikWM ID lookup is a GET request
                await sleep(1500); // Be safe
                const finalLookup = await axios.get(`https://www.tikwm.com/api/?id=${videoId}`);
                if (finalLookup.data?.code === 0 && finalLookup.data?.data) {
                    return await saveVideoFromData(finalLookup.data.data, cleanUrl);
                }
            } catch (e) { }
        }

        const errorMsg = response?.data?.msg || "Unable to download video. The service might be temporarily unavailable.";
        throw new Error(errorMsg);

    } catch (error) {
        console.error(`[${VERSION}] ❌ Final error:`, error.message);
        throw error;
    }
}

async function saveFromDirectUrl(downloadUrl, title, originalUrl) {
    try {
        console.log(`[${VERSION}] 💾 Downloading from direct URL:`, downloadUrl);
        const res = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const filename = `video_${Date.now()}.mp4`;
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const videoPath = path.join(uploadDir, filename);
        fs.writeFileSync(videoPath, res.data);

        console.log(`[${VERSION}] ✅ Video saved to:`, videoPath);

        return {
            videoPath,
            videoInfo: {
                title: title || 'Untitled',
                author: 'Unknown',
                duration: 0,
                platform: originalUrl.includes('douyin') ? 'Douyin' : 'TikTok'
            }
        };
    } catch (error) {
        console.error(`[${VERSION}] ❌ saveFromDirectUrl error:`, error.message);
        throw new Error(`Failed to save video from direct URL: ${error.message}`);
    }
}

async function saveVideoFromData(videoData, originalUrl) {
    try {
        const downloadUrl = videoData.hdplay || videoData.play;
        if (!downloadUrl) {
            throw new Error('No download URL found in video data');
        }

        console.log(`[${VERSION}] 💾 Downloading file from TikWM...`);
        const videoResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const filename = `video_${Date.now()}.mp4`;
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const videoPath = path.join(uploadDir, filename);
        fs.writeFileSync(videoPath, videoResponse.data);

        console.log(`[${VERSION}] ✅ Video saved to:`, videoPath);

        return {
            videoPath,
            videoInfo: {
                title: videoData.title || 'Untitled',
                author: videoData.author?.unique_id || videoData.author?.nickname || 'Unknown',
                duration: videoData.duration || 0,
                platform: originalUrl.includes('douyin') ? 'Douyin' : 'TikTok'
            }
        };
    } catch (error) {
        console.error(`[${VERSION}] ❌ saveVideoFromData error:`, error.message);
        throw new Error(`Failed to save video from TikWM data: ${error.message}`);
    }
}

export async function downloadVideoAlternative(videoUrl) {
    return downloadVideo(videoUrl, 1);
}

import express from 'express';
import { downloadVideo, downloadVideoAlternative } from '../services/videoDownloader.js';

const router = express.Router();

/**
 * POST /api/download
 * Download TikTok/Douyin video without watermark
 */
router.post('/', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                error: 'Missing required parameter: url'
            });
        }

        // Validate URL
        if (!url.includes('tiktok.com') && !url.includes('douyin.com')) {
            return res.status(400).json({
                error: 'Invalid URL. Please provide a TikTok or Douyin video URL.'
            });
        }

        console.log('📥 Download request received:', url);

        // Try primary method
        let result;
        try {
            result = await downloadVideo(url);
        } catch (error) {
            console.log('⚠️ Primary download method failed, trying alternative...');
            result = await downloadVideoAlternative(url);
        }

        // Return video info and file path
        res.json({
            success: true,
            message: 'Video downloaded successfully',
            data: {
                videoPath: result.videoPath,
                videoInfo: result.videoInfo,
                filename: result.videoPath.split(/[\\/]/).pop()
            }
        });

    } catch (error) {
        console.error('❌ Download error stack:', error.stack || error);
        res.status(500).json({
            error: 'Failed to download video',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * GET /api/download/test
 * Test endpoint
 */
router.get('/test', (req, res) => {
    res.json({
        message: 'Download endpoint is working',
        supportedPlatforms: ['TikTok', 'Douyin']
    });
});

export default router;

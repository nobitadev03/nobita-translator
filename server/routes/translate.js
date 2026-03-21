import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { transcribeVideo } from '../services/speechToText.js';
import { translateLongText } from '../services/translator.js';
import { generateLongSpeech } from '../services/textToSpeech.js';
import { replaceAudio } from '../services/videoProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
let translationStatus = {
    steps: [
        { id: 'transcription', label: 'Transcribing Audio', status: 'pending' },
        { id: 'translation', label: 'Translating Content', status: 'pending' },
        { id: 'dubbing', label: 'AI Voice Dubbing', status: 'pending' },
        { id: 'merging', label: 'Merging Final Video', status: 'pending' }
    ]
};

const updateStatus = (stepId, status, message = '') => {
    translationStatus.steps = translationStatus.steps.map(step => {
        if (step.id === stepId) {
            return { ...step, status, message };
        }
        if (status === 'processing' && step.id !== stepId && step.status === 'processing') {
            return { ...step, status: 'completed' };
        }
        return step;
    });
};

const resetStatus = () => {
    translationStatus.steps = translationStatus.steps.map(step => ({
        ...step,
        status: 'pending',
        message: ''
    }));
};

/**
 * POST /api/translate
 * Translate video from one language to another
 * 
 * Request body:
 * - videoPath: path to video file (from download endpoint)
 * - sourceLang: source language code (vi, en, ja, ko, zh)
 * - targetLang: target language code
 * - voiceGender: 'male' or 'female' (optional, default: 'female')
 */
router.post('/', async (req, res) => {
    try {
        const { videoPath, sourceLang, targetLang, voiceGender = 'female' } = req.body;
        console.log(`📥 Translation request received. Source: ${sourceLang}, Target: ${targetLang}`);

        // Validation
        if (!videoPath || !sourceLang || !targetLang) {
            return res.status(400).json({
                error: 'Missing required parameters',
                required: ['videoPath', 'sourceLang', 'targetLang']
            });
        }

        const supportedLangs = ['vi', 'en', 'ja', 'ko', 'zh', 'auto', 'fr', 'es', 'de', 'th'];
        if (!supportedLangs.includes(sourceLang) || !supportedLangs.includes(targetLang)) {
            return res.status(400).json({
                error: 'Unsupported language',
                supportedLanguages: supportedLangs
            });
        }

        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({
                error: 'Video file not found',
                path: videoPath
            });
        }

        resetStatus();
        console.log(`🎯 Translation request: ${sourceLang} → ${targetLang}`);
        console.log(`📹 Video: ${path.basename(videoPath)}`);

        // Step 1: Transcribe video (speech-to-text)
        updateStatus('transcription', 'processing');
        console.log('\n📝 Step 1/4: Transcribing video...');
        const { text: originalText, detectedLanguage } = await transcribeVideo(videoPath, sourceLang);
        updateStatus('transcription', 'completed');

        if (!originalText || originalText.trim().length === 0) {
            updateStatus('transcription', 'error', 'No speech detected');
            return res.status(400).json({
                error: 'No speech detected in video',
                message: 'The video may not contain any speech or the audio quality is too low'
            });
        }

        console.log('Original text:', originalText);
        console.log('Detected language:', detectedLanguage);

        // Step 2: Translate text
        updateStatus('translation', 'processing');
        console.log('\n🌐 Step 2/4: Translating text...');
        const translatedText = await translateLongText(originalText, detectedLanguage, targetLang);
        console.log('Translated text:', translatedText);
        updateStatus('translation', 'completed');

        // Step 3: Generate speech from translated text
        updateStatus('dubbing', 'processing');
        console.log('\n🗣️ Step 3/4: Generating speech...');
        const newAudioPath = await generateLongSpeech(translatedText, targetLang, {
            gender: voiceGender
        });
        updateStatus('dubbing', 'completed');

        // Step 4: Replace video audio
        updateStatus('merging', 'processing');
        console.log('\n🎬 Step 4/4: Merging audio with video...');
        const outputVideoPath = await replaceAudio(videoPath, newAudioPath);
        updateStatus('merging', 'completed');

        // Clean up temporary audio file
        try {
            fs.unlinkSync(newAudioPath);
        } catch (e) {
            console.warn('Could not delete temp audio file:', e.message);
        }

        console.log('\n✅ Translation completed successfully!');

        // Return result
        const outputFilename = path.basename(outputVideoPath);
        const downloadUrl = `/output/${outputFilename}`;

        res.json({
            success: true,
            message: 'Video translated successfully',
            data: {
                originalText,
                translatedText,
                outputPath: outputVideoPath,
                downloadUrl,
                filename: outputFilename,
                sourceLang,
                targetLang
            }
        });

    } catch (error) {
        console.error('❌ Translation error:', error.message);
        console.error(error.stack);

        // Mark current processing step as error
        const activeStep = translationStatus.steps.find(s => s.status === 'processing');
        if (activeStep) {
            updateStatus(activeStep.id, 'error', error.message);
        }

        res.status(500).json({
            error: 'Translation failed',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * GET /api/translate/status
 * Get current translation status
 */
router.get('/status', (req, res) => {
    res.json(translationStatus);
});

/**
 * POST /api/translate/text-only
 * Translate text without video processing (for testing)
 */
router.post('/text-only', async (req, res) => {
    try {
        const { text, sourceLang, targetLang } = req.body;

        if (!text || !sourceLang || !targetLang) {
            return res.status(400).json({
                error: 'Missing required parameters',
                required: ['text', 'sourceLang', 'targetLang']
            });
        }

        const translatedText = await translateLongText(text, sourceLang, targetLang);

        res.json({
            success: true,
            data: {
                originalText: text,
                translatedText,
                sourceLang,
                targetLang
            }
        });

    } catch (error) {
        res.status(500).json({
            error: 'Translation failed',
            message: error.message
        });
    }
});

/**
 * GET /api/translate/languages
 * Get list of supported languages
 */
router.get('/languages', (req, res) => {
    res.json({
        languages: [
            { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
            { code: 'en', name: 'English', nativeName: 'English' },
            { code: 'ja', name: 'Japanese', nativeName: '日本語' },
            { code: 'ko', name: 'Korean', nativeName: '한국어' },
            { code: 'zh', name: 'Chinese', nativeName: '中文' }
        ]
    });
});

export default router;

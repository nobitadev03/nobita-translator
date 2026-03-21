import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Extract audio from video file
 * @param {string} videoPath - Path to video file
 * @returns {Promise<string>} - Path to extracted audio file
 */
export async function extractAudio(videoPath) {
    try {
        const audioPath = videoPath.replace('.mp4', '.wav');

        // Use FFmpeg to extract audio
        const command = `ffmpeg -i "${videoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}" -y`;

        console.log('🎵 Extracting audio from video...');
        await execPromise(command);

        console.log('✅ Audio extracted:', path.basename(audioPath));
        return audioPath;

    } catch (error) {
        console.error('❌ Error extracting audio:', error.message);
        throw new Error(`Failed to extract audio: ${error.message}`);
    }
}

/**
 * Transcribe audio to text using Google Gemini API
 * @param {string} audioPath - Path to audio file
 * @param {string} language - Language code (vi, en, ja, ko, zh)
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeWithGemini(audioPath, language = 'auto') {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('Gemini API key not configured');
        }

        console.log('🎤 Transcribing audio with Gemini...');

        // Read audio file and convert to base64
        const audioBuffer = fs.readFileSync(audioPath);
        const audioBase64 = audioBuffer.toString('base64');

        // Gemini API endpoint - 1.5-flash is the most economical and available in v1beta
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await axios.post(apiUrl, {
            contents: [{
                parts: [
                    {
                        text: language === 'auto'
                            ? "Detect the primary language in this audio and transcribe it to text. Only return the transcribed text, nothing else."
                            : `Transcribe this audio base64 to text. The language is ${language}. Only return the transcribed text, nothing else.`
                    },
                    {
                        inline_data: {
                            mime_type: 'audio/wav',
                            data: audioBase64
                        }
                    }
                ]
            }]
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const transcription = response.data.candidates[0].content.parts[0].text;
        console.log('✅ Transcription completed');

        return {
            text: transcription,
            language_code: language // Gemini doesn't always return the code easily without extra parsing, so we keep what was requested
        };

    } catch (error) {
        console.error('❌ Error transcribing with Gemini:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        throw error;
    }
}

/**
 * Transcribe audio using AssemblyAI (free tier alternative)
 * @param {string} audioPath - Path to audio file
 * @param {string} language - Language code
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeWithAssemblyAI(audioPath, language = 'en') {
    try {
        const apiKey = process.env.ASSEMBLYAI_API_KEY;

        if (!apiKey) {
            throw new Error('AssemblyAI API key not configured');
        }

        console.log('🎤 Transcribing audio with AssemblyAI...');

        // Upload audio file
        const audioData = fs.readFileSync(audioPath);
        const uploadResponse = await axios.post(
            'https://api.assemblyai.com/v2/upload',
            audioData,
            {
                headers: {
                    'authorization': apiKey,
                    'content-type': 'application/octet-stream'
                }
            }
        );

        const audioUrl = uploadResponse.data.upload_url;

        // Request transcription
        const transcriptResponse = await axios.post(
            'https://api.assemblyai.com/v2/transcript',
            {
                audio_url: audioUrl,
                language_code: language === 'auto' ? undefined : language,
                language_detection: language === 'auto'
            },
            {
                headers: {
                    'authorization': apiKey,
                    'content-type': 'application/json'
                }
            }
        );

        const transcriptId = transcriptResponse.data.id;

        // Poll for completion
        let transcript;
        while (true) {
            const pollingResponse = await axios.get(
                `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
                {
                    headers: {
                        'authorization': apiKey
                    }
                }
            );

            transcript = pollingResponse.data;

            if (transcript.status === 'completed') {
                break;
            } else if (transcript.status === 'error') {
                throw new Error('Transcription failed');
            }

            // Wait 3 seconds before polling again
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        console.log('✅ Transcription completed:', transcript.language_code);
        return {
            text: transcript.text,
            language_code: transcript.language_code
        };

    } catch (error) {
        console.error('❌ Error transcribing with AssemblyAI:', error.message);
        throw error;
    }
}

/**
 * Main transcription function with fallback
 * @param {string} videoPath - Path to video file
 * @param {string} language - Language code
 * @returns {Promise<{text: string, audioPath: string}>}
 */
export async function transcribeVideo(videoPath, language = 'auto') {
    try {
        // Extract audio first
        const audioPath = await extractAudio(videoPath);

        let transcription;
        let detectedLanguage = language;

        // 1. Try AssemblyAI FIRST
        if (process.env.ASSEMBLYAI_API_KEY) {
            try {
                const result = await transcribeWithAssemblyAI(audioPath, language);
                transcription = result.text;
                detectedLanguage = result.language_code;
            } catch (error) {
                console.log('⚠️ AssemblyAI failed, trying Gemini...');
            }
        }

        // 2. Try Gemini
        if (!transcription && process.env.GEMINI_API_KEY) {
            try {
                const result = await transcribeWithGemini(audioPath, language);
                transcription = result.text;
                detectedLanguage = result.language_code;
            } catch (error) {
                console.log('⚠️ Gemini transcription failed.');
            }
        }

        if (!transcription) {
            throw new Error('Speech-to-text failed. Please ensure ASSEMBLYAI_API_KEY or GEMINI_API_KEY is valid in server/.env');
        }

        return {
            text: transcription,
            detectedLanguage,
            audioPath
        };

    } catch (error) {
        console.error('❌ Error in transcription:', error.message);
        throw error;
    }
}

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Voice mapping for different languages
 */
const VOICES = {
    'vi': 'vi-VN-HoaiMyNeural',      // Vietnamese female
    'en': 'en-US-JennyNeural',        // English female
    'ja': 'ja-JP-NanamiNeural',       // Japanese female
    'ko': 'ko-KR-SunHiNeural',        // Korean female
    'zh': 'zh-CN-XiaoxiaoNeural'      // Chinese female
};

const VOICES_MALE = {
    'vi': 'vi-VN-NamMinhNeural',      // Vietnamese male
    'en': 'en-US-GuyNeural',          // English male
    'ja': 'ja-JP-KeitaNeural',        // Japanese male
    'ko': 'ko-KR-InJoonNeural',       // Korean male
    'zh': 'zh-CN-YunxiNeural'         // Chinese male
};

/**
 * Generate speech from text using Edge TTS (free)
 * @param {string} text - Text to convert to speech
 * @param {string} language - Language code (vi, en, ja, ko, zh)
 * @param {object} options - Additional options
 * @returns {Promise<string>} - Path to generated audio file
 */
export async function generateSpeech(text, language, options = {}) {
    try {
        console.log(`🗣️ Generating speech in ${language}...`);

        const voice = options.gender === 'male' ? VOICES_MALE[language] : VOICES[language];

        if (!voice) {
            throw new Error(`Unsupported language: ${language}`);
        }

        const tempDir = path.join(__dirname, '..', 'temp');
        const outputPath = path.join(tempDir, `tts_${Date.now()}.mp3`);

        // Use edge-tts command line tool
        const rate = options.rate || '+0%';
        const pitch = options.pitch || '+0Hz';

        const command = `edge-tts --voice "${voice}" --rate="${rate}" --pitch="${pitch}" --text "${text.replace(/"/g, '\\"')}" --write-media "${outputPath}"`;

        console.log('Executing TTS command...');
        await execPromise(command);

        if (!fs.existsSync(outputPath)) {
            throw new Error('Failed to generate speech file');
        }

        console.log('✅ Speech generated:', path.basename(outputPath));
        return outputPath;

    } catch (error) {
        console.error('❌ Error generating speech:', error.message);
        throw new Error(`Failed to generate speech: ${error.message}`);
    }
}

/**
 * Generate speech for long text by splitting into chunks
 * @param {string} text - Long text to convert
 * @param {string} language - Language code
 * @param {object} options - Additional options
 * @returns {Promise<string>} - Path to merged audio file
 */
export async function generateLongSpeech(text, language, options = {}) {
    try {
        // Edge TTS has a character limit, split into chunks
        const maxChunkSize = 3000;
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

        let chunks = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            if ((currentChunk + sentence).length > maxChunkSize) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                }
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        console.log(`🎵 Generating ${chunks.length} audio chunks...`);

        // Generate audio for each chunk
        const audioPaths = [];
        for (let i = 0; i < chunks.length; i++) {
            console.log(`Generating chunk ${i + 1}/${chunks.length}...`);
            const audioPath = await generateSpeech(chunks[i], language, options);
            audioPaths.push(audioPath);
        }

        // If only one chunk, return it directly
        if (audioPaths.length === 1) {
            return audioPaths[0];
        }

        // Merge all audio files
        console.log('🔗 Merging audio chunks...');
        const mergedPath = await mergeAudioFiles(audioPaths);

        // Clean up individual chunks
        audioPaths.forEach(p => {
            try {
                fs.unlinkSync(p);
            } catch (e) {
                console.warn('Could not delete temp file:', p);
            }
        });

        return mergedPath;

    } catch (error) {
        console.error('❌ Error generating long speech:', error.message);
        throw error;
    }
}

/**
 * Merge multiple audio files into one
 * @param {string[]} audioPaths - Array of audio file paths
 * @returns {Promise<string>} - Path to merged audio file
 */
async function mergeAudioFiles(audioPaths) {
    try {
        const tempDir = path.join(__dirname, '..', 'temp');
        const outputPath = path.join(tempDir, `merged_${Date.now()}.mp3`);

        // Create concat file for FFmpeg
        const concatFilePath = path.join(tempDir, `concat_${Date.now()}.txt`);
        const concatContent = audioPaths.map(p => `file '${p}'`).join('\n');
        fs.writeFileSync(concatFilePath, concatContent);

        // Use FFmpeg to concatenate
        const command = `ffmpeg -f concat -safe 0 -i "${concatFilePath}" -c copy "${outputPath}" -y`;
        await execPromise(command);

        // Clean up concat file
        fs.unlinkSync(concatFilePath);

        console.log('✅ Audio files merged');
        return outputPath;

    } catch (error) {
        throw new Error(`Failed to merge audio files: ${error.message}`);
    }
}

/**
 * Get available voices for a language
 */
export function getAvailableVoices(language) {
    return {
        female: VOICES[language],
        male: VOICES_MALE[language]
    };
}

/**
 * List all supported languages
 */
export function getSupportedLanguages() {
    return Object.keys(VOICES);
}

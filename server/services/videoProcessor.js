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
 * Get video duration in seconds
 * @param {string} videoPath - Path to video file
 * @returns {Promise<number>} - Duration in seconds
 */
export async function getVideoDuration(videoPath) {
    try {
        const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
        const { stdout } = await execPromise(command);
        return parseFloat(stdout.trim());
    } catch (error) {
        console.warn('Could not get video duration:', error.message);
        return 0;
    }
}

/**
 * Replace video audio with new audio track
 * @param {string} videoPath - Path to original video
 * @param {string} audioPath - Path to new audio
 * @param {string} outputPath - Path for output video (optional)
 * @returns {Promise<string>} - Path to output video
 */
export async function replaceAudio(videoPath, audioPath, outputPath = null) {
    try {
        console.log('🎬 Replacing video audio...');

        if (!outputPath) {
            const outputDir = path.join(__dirname, '..', 'output');
            outputPath = path.join(outputDir, `translated_${Date.now()}.mp4`);
        }

        // Get video and audio durations
        const videoDuration = await getVideoDuration(videoPath);
        const audioDuration = await getAudioDuration(audioPath);

        console.log(`Video duration: ${videoDuration}s, Audio duration: ${audioDuration}s`);

        // If audio is shorter, we'll use the video's original length
        // If audio is longer, we'll trim it to match video
        let command;

        if (audioDuration > videoDuration) {
            // Trim audio to match video length
            command = `ffmpeg -i "${videoPath}" -i "${audioPath}" -t ${videoDuration} -c:v copy -c:a aac -b:a 192k -map 0:v:0 -map 1:a:0 -shortest "${outputPath}" -y`;
        } else {
            // Use audio as-is, video will be longer
            command = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -map 0:v:0 -map 1:a:0 "${outputPath}" -y`;
        }

        console.log('Executing FFmpeg command...');
        await execPromise(command);

        if (!fs.existsSync(outputPath)) {
            throw new Error('Failed to create output video');
        }

        console.log('✅ Audio replaced successfully:', path.basename(outputPath));
        return outputPath;

    } catch (error) {
        console.error('❌ Error replacing audio:', error.message);
        throw new Error(`Failed to replace audio: ${error.message}`);
    }
}

/**
 * Get audio duration in seconds
 * @param {string} audioPath - Path to audio file
 * @returns {Promise<number>} - Duration in seconds
 */
async function getAudioDuration(audioPath) {
    try {
        const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`;
        const { stdout } = await execPromise(command);
        return parseFloat(stdout.trim());
    } catch (error) {
        console.warn('Could not get audio duration:', error.message);
        return 0;
    }
}

/**
 * Remove audio from video (create silent video)
 * @param {string} videoPath - Path to video file
 * @returns {Promise<string>} - Path to silent video
 */
export async function removeAudio(videoPath) {
    try {
        const outputPath = videoPath.replace('.mp4', '_silent.mp4');
        const command = `ffmpeg -i "${videoPath}" -c:v copy -an "${outputPath}" -y`;

        await execPromise(command);
        return outputPath;

    } catch (error) {
        throw new Error(`Failed to remove audio: ${error.message}`);
    }
}

/**
 * Adjust audio speed to match video duration
 * @param {string} audioPath - Path to audio file
 * @param {number} targetDuration - Target duration in seconds
 * @returns {Promise<string>} - Path to adjusted audio
 */
export async function adjustAudioSpeed(audioPath, targetDuration) {
    try {
        const currentDuration = await getAudioDuration(audioPath);
        const speedFactor = currentDuration / targetDuration;

        // Only adjust if difference is significant (more than 5%)
        if (Math.abs(speedFactor - 1.0) < 0.05) {
            return audioPath;
        }

        const outputPath = audioPath.replace('.mp3', '_adjusted.mp3');
        const command = `ffmpeg -i "${audioPath}" -filter:a "atempo=${speedFactor}" "${outputPath}" -y`;

        await execPromise(command);
        return outputPath;

    } catch (error) {
        console.warn('Could not adjust audio speed:', error.message);
        return audioPath; // Return original if adjustment fails
    }
}

/**
 * Convert audio format
 * @param {string} audioPath - Path to audio file
 * @param {string} format - Target format (mp3, wav, etc.)
 * @returns {Promise<string>} - Path to converted audio
 */
export async function convertAudioFormat(audioPath, format = 'mp3') {
    try {
        const outputPath = audioPath.replace(path.extname(audioPath), `.${format}`);
        const command = `ffmpeg -i "${audioPath}" "${outputPath}" -y`;

        await execPromise(command);
        return outputPath;

    } catch (error) {
        throw new Error(`Failed to convert audio format: ${error.message}`);
    }
}

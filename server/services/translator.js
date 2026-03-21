import { translate } from '@vitalets/google-translate-api';
import axios from 'axios';

/**
 * Language code mapping
 */
const LANGUAGE_NAMES = {
    'vi': 'Vietnamese',
    'en': 'English',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'fr': 'French',
    'es': 'Spanish',
    'de': 'German',
    'th': 'Thai'
};

/**
 * Translate text using Google Translate
 * This version uses the modern @vitalets/google-translate-api which is most reliable
 */
export async function translateText(text, sourceLang, targetLang) {
    try {
        if (!text || text.trim() === '') return '';

        console.log(`🌐 Translating from ${sourceLang} to ${targetLang}...`);

        // Check if Gemini is available first as it's more accurate for context
        if (process.env.GEMINI_API_KEY) {
            try {
                return await translateWithGemini(text, sourceLang, targetLang);
            } catch (err) {
                console.log(`⚠️ Gemini translation failed: ${err.message}. Trying Google Translate...`);
            }
        }

        const result = await translate(text, { from: sourceLang, to: targetLang });
        const translatedText = result.text;

        console.log('✅ Translation completed');
        return translatedText;

    } catch (error) {
        console.error('❌ Error translating text:', error.message);
        // Fallback to original text if translation completely fails to prevent breaking the flow
        return text;
    }
}

/**
 * Translate text using Google Gemini
 */
export async function translateWithGemini(text, sourceLang, targetLang) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('No Gemini API Key');

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const prompt = `Translate the following ${LANGUAGE_NAMES[sourceLang] || sourceLang} text to ${LANGUAGE_NAMES[targetLang] || targetLang}. Just provide the translation, no extra text:\n\n${text}`;

    const response = await axios.post(apiUrl, {
        contents: [{ parts: [{ text: prompt }] }]
    });

    return response.data.candidates[0].content.parts[0].text.trim();
}

/**
 * Translate long text by splitting into chunks
 * @param {string} text - Long text to translate
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {Promise<string>} - Translated text
 */
export async function translateLongText(text, sourceLang, targetLang) {
    try {
        // Google Translate can handle up to 5000 characters
        const maxChunkSize = 4000;

        if (text.length <= maxChunkSize) {
            return await translateText(text, sourceLang, targetLang);
        }

        // Split into sentences
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

        console.log(`📝 Translating ${chunks.length} chunks...`);

        // Translate each chunk
        const translatedChunks = [];
        for (let i = 0; i < chunks.length; i++) {
            console.log(`Translating chunk ${i + 1}/${chunks.length}...`);
            const translated = await translateText(chunks[i], sourceLang, targetLang);
            translatedChunks.push(translated);

            // Add delay to avoid rate limiting
            if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return translatedChunks.join(' ');

    } catch (error) {
        console.error('❌ Error translating long text:', error.message);
        throw error;
    }
}

/**
 * Get language name from code
 */
export function getLanguageName(code) {
    return LANGUAGE_NAMES[code] || code;
}

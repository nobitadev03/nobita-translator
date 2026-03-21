import axios from 'axios';
import type { DownloadResponse, TranslateResponse } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
    /**
     * Download video from TikTok or Douyin
     */
    downloadVideo: async (url: string): Promise<DownloadResponse> => {
        const response = await axios.post<DownloadResponse>(`${API_BASE_URL}/download`, {
            url
        });
        return response.data;
    },

    /**
     * Translate video
     */
    translateVideo: async (
        videoPath: string,
        sourceLang: string,
        targetLang: string,
        voiceGender: 'male' | 'female' = 'female'
    ): Promise<TranslateResponse> => {
        const response = await axios.post<TranslateResponse>(`${API_BASE_URL}/translate`, {
            videoPath,
            sourceLang,
            targetLang,
            voiceGender
        });
        return response.data;
    },

    /**
     * Get supported languages
     */
    getLanguages: async () => {
        const response = await axios.get(`${API_BASE_URL}/translate/languages`);
        return response.data.languages;
    },

    /**
     * Health check
     */
    healthCheck: async () => {
        const response = await axios.get(`${API_BASE_URL}/health`);
        return response.data;
    }
};

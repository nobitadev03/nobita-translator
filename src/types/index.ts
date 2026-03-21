export interface Language {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
}

export interface VideoInfo {
    title: string;
    author: string;
    duration: number;
    platform: 'TikTok' | 'Douyin' | 'TikTok/Douyin';
    videoPath: string;
    url: string;
}

export interface DownloadResponse {
    success: boolean;
    message: string;
    data: {
        videoPath: string;
        videoInfo: VideoInfo;
        filename: string;
    };
}

export interface TranslateResponse {
    success: boolean;
    message: string;
    data: {
        originalText: string;
        translatedText: string;
        outputPath: string;
        downloadUrl: string;
        filename: string;
        sourceLang: string;
        targetLang: string;
    };
}

export interface ProcessingStep {
    id: string;
    label: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    message?: string;
}

export type VoiceGender = 'male' | 'female';

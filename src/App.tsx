import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from './api/client';

import Header from './components/Header';
import VideoInput from './components/VideoInput';
import LanguageSelector from './components/LanguageSelector';
import ProcessingStatus from './components/ProcessingStatus';
import VideoPreview from './components/VideoPreview';
import type { VideoInfo, ProcessingStep } from './types';
import './App.css';

// Helper to format error message safely (avoids React Error #31)
const getErrorMessage = (err: any): string => {
    if (err.response?.data?.error) {
        const error = err.response.data.error;
        if (typeof error === 'string') return error;
        if (typeof error === 'object') {
            return error.message || error.code || JSON.stringify(error);
        }
    }
    return err.response?.data?.message || err.message || 'An unexpected error occurred.';
};

const App: React.FC = () => {
    // State
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('vi');
    const [isDownloading, setIsDownloading] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [steps, setSteps] = useState<ProcessingStep[]>([]);
    const [currentStep, setCurrentStep] = useState<string | undefined>();
    const [translatedVideoUrl, setTranslatedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [originalText, setOriginalText] = useState<string>('');
    const [translatedText, setTranslatedText] = useState<string>('');

    // Handle initial video download and analysis
    const handleVideoSubmit = async (url: string) => {
        try {
            setError(null);
            setIsDownloading(true);
            setVideoInfo(null);
            setTranslatedVideoUrl(null);
            setOriginalText('');
            setTranslatedText('');

            const response = await axios.post(`${API_BASE_URL}/download`, { url });
            const { videoInfo, videoPath, filename } = response.data.data;
            setVideoInfo({
                ...videoInfo,
                videoPath,
                url: `${API_BASE_URL.replace('/api', '')}/uploads/${filename}`
            });
        } catch (err: any) {
            console.error('Download error:', err);
            setError(getErrorMessage(err));
        } finally {
            setIsDownloading(false);
        }
    };

    // Handle translation process
    const handleTranslate = async () => {
        if (!videoInfo) return;

        try {
            setError(null);
            setIsTranslating(true);
            setSteps([]);
            setCurrentStep('transcription');
            setTranslatedVideoUrl(null);

            const response = await axios.post(`${API_BASE_URL}/translate`, {
                videoPath: videoInfo.videoPath,
                sourceLang,
                targetLang
            });

            const { downloadUrl, originalText, translatedText } = response.data.data;
            setTranslatedVideoUrl(downloadUrl.startsWith('http') ? downloadUrl : `${API_BASE_URL.replace('/api', '')}${downloadUrl}`);
            setOriginalText(originalText || '');
            setTranslatedText(translatedText || '');
        } catch (err: any) {
            console.error('Translation error:', err);
            setError(getErrorMessage(err));
        } finally {
            setIsTranslating(false);
        }
    };

    // Polling for processing status
    useEffect(() => {
        let interval: any;
        if (isTranslating) {
            interval = setInterval(async () => {
                try {
                    const response = await axios.get(`${API_BASE_URL}/translate/status`);
                    setSteps(response.data.steps);
                    const current = response.data.steps.find((s: any) => s.id !== 'completed' && s.status === 'processing');
                    if (current) setCurrentStep(current.id);
                } catch (err) {
                    console.error('Status check error:', err);
                }
            }, 1000);
        } else if (translatedVideoUrl) {
            // Once finished, set all to completed
            setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
            setCurrentStep(undefined);
        }
        return () => clearInterval(interval);
    }, [isTranslating, translatedVideoUrl]);

    const handleSwapLanguages = () => {
        if (sourceLang === 'auto') return;
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
    };

    const handleDownloadVideo = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const resetApp = () => {
        setVideoInfo(null);
        setTranslatedVideoUrl(null);
        setError(null);
        setSteps([]);
        setOriginalText('');
        setTranslatedText('');
    };

    return (
        <div className="app">
            <Header />

            <main className="main-content">
                <div className="container">
                    <AnimatePresence mode="wait">
                        {!videoInfo ? (
                            <motion.section
                                key="hero"
                                className="hero-section"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <div className="hero-content">
                                    <h2 className="hero-title gradient-text">Translate TikToks <br />Like Magic.</h2>
                                    <p className="hero-subtitle">
                                        Professional voice dubbing and translation for Douyin and TikTok videos.
                                        High-fidelity audio generation in seconds.
                                    </p>

                                    <div className="input-section-modern">
                                        <VideoInput onSubmit={handleVideoSubmit} isLoading={isDownloading} />
                                    </div>

                                    <div className="hero-features" style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '2rem',
                                        marginTop: '3rem',
                                        color: 'var(--text-muted)'
                                    }}>
                                        <div className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Sparkles size={18} />
                                            <span>AI Dubbing</span>
                                        </div>
                                        <div className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <ShieldCheck size={18} />
                                            <span>Premium Voices</span>
                                        </div>
                                        <div className="feature-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <RefreshCw size={18} />
                                            <span>Auto-Sync</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.section>
                        ) : (
                            <motion.section
                                key="processing"
                                className="translation-section"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className="videos-layout">
                                    <div className="column-source">
                                        <VideoPreview
                                            videoUrl={videoInfo.url}
                                            title={videoInfo.title}
                                            isTranslated={false}
                                            originalText={originalText}
                                            onDownload={() => handleDownloadVideo(videoInfo.url, `original_${Date.now()}.mp4`)}
                                        />
                                    </div>

                                    <div className="column-configs">
                                        <div className="glass-card controls-card">
                                            <LanguageSelector
                                                sourceLang={sourceLang}
                                                targetLang={targetLang}
                                                onSourceChange={setSourceLang}
                                                onTargetChange={setTargetLang}
                                                onSwap={handleSwapLanguages}
                                                disabled={isTranslating}
                                            />

                                            <div className="action-buttons">
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={resetApp}
                                                    disabled={isTranslating}
                                                >
                                                    Start New
                                                </button>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={handleTranslate}
                                                    disabled={isTranslating}
                                                >
                                                    {isTranslating ? 'Translating...' : 'Translate Now'}
                                                </button>
                                            </div>

                                            {sourceLang === targetLang && (
                                                <div className="warning-banner">
                                                    <AlertTriangle size={16} />
                                                    <span>Source and target languages are the same.</span>
                                                </div>
                                            )}
                                        </div>

                                        <ProcessingStatus steps={steps} currentStep={currentStep} />

                                        {translatedVideoUrl && (
                                            <motion.div
                                                className="result-card"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                style={{ marginTop: '2rem' }}
                                            >
                                                <VideoPreview
                                                    videoUrl={translatedVideoUrl}
                                                    title="Final Dubbed Version"
                                                    isTranslated={true}
                                                    originalText={originalText}
                                                    translatedText={translatedText}
                                                    onDownload={() => handleDownloadVideo(translatedVideoUrl, `translated_${Date.now()}.mp4`)}
                                                />
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>

                    {error && (
                        <motion.div
                            className="error-toast"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}
                        >
                            <AlertTriangle className="icon-error" size={24} />
                            <div>
                                <strong>Translation encountered an issue</strong>
                                <p>{error}</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>

            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="logo-small" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Sparkles size={16} color="var(--color-primary)" />
                            <span style={{ fontWeight: 700 }}>Nobita AI</span>
                        </div>
                        <p className="footer-text">© 2024 Nobita - Professional Video Dubbing. Powered by Gemini & Edge TTS.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default App;

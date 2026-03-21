import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clipboard, X, Download, AlertCircle, Smartphone, Music } from 'lucide-react';
import './VideoInput.css';

interface VideoInputProps {
    onSubmit: (url: string) => void;
    isLoading: boolean;
}

const VideoInput: React.FC<VideoInputProps> = ({ onSubmit, isLoading }) => {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');

    const validateUrl = (url: string): boolean => {
        const tiktokPattern = /tiktok\.com/i;
        const douyinPattern = /douyin\.com/i;
        return tiktokPattern.test(url) || douyinPattern.test(url);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!url.trim()) {
            setError('Please enter a video URL');
            return;
        }

        if (!validateUrl(url)) {
            setError('Please enter a valid TikTok or Douyin URL');
            return;
        }

        onSubmit(url);
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setUrl(text);
            setError('');
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    };

    const handleClear = () => {
        setUrl('');
        setError('');
    };

    return (
        <motion.div
            className="video-input-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="video-input-header">
                <h2>Start Translating</h2>
                <p>Paste a video link from TikTok or Douyin</p>
            </div>

            <form onSubmit={handleSubmit} className="video-input-form">
                <div className="input-group">
                    <div className="input-wrapper-refined">
                        <input
                            type="text"
                            className={`input-refined ${error ? 'input-error' : ''}`}
                            placeholder="https://www.tiktok.com/..."
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                setError('');
                            }}
                            disabled={isLoading}
                        />

                        <div className="input-actions-refined">
                            <AnimatePresence>
                                {url && (
                                    <motion.button
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        type="button"
                                        className="btn-icon-refined"
                                        onClick={handleClear}
                                        disabled={isLoading}
                                    >
                                        <X size={18} />
                                    </motion.button>
                                )}
                            </AnimatePresence>

                            <button
                                type="button"
                                className="btn-icon-refined"
                                onClick={handlePaste}
                                disabled={isLoading}
                                title="Paste"
                            >
                                <Clipboard size={18} />
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                className="error-hint"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <AlertCircle size={14} />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <motion.button
                    type="submit"
                    className="btn btn-primary btn-lg btn-full"
                    disabled={isLoading || !url}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isLoading ? (
                        <>
                            <span className="spinner"></span>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <Download size={20} />
                            <span>Download & Analyze</span>
                        </>
                    )}
                </motion.button>
            </form>

            <div className="supported-platforms-refined">
                <div className="platform-tag">
                    <Smartphone size={14} />
                    <span>TikTok</span>
                </div>
                <div className="platform-tag">
                    <Music size={14} />
                    <span>Douyin</span>
                </div>
            </div>
        </motion.div>
    );
};

export default VideoInput;

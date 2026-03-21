import React from 'react';
import { motion } from 'framer-motion';
import { Download, Video, Languages, Quote } from 'lucide-react';
import './VideoPreview.css';

interface VideoPreviewProps {
    videoUrl?: string;
    title?: string;
    subtitle?: string;
    onDownload?: () => void;
    isTranslated?: boolean;
    originalText?: string;
    translatedText?: string;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
    videoUrl,
    title,
    subtitle,
    onDownload,
    isTranslated = false,
    originalText,
    translatedText
}) => {
    if (!videoUrl) return null;

    return (
        <motion.div
            className="video-preview-refined glass-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <div className="preview-header-refined">
                <div className={`preview-badge ${isTranslated ? 'badge-translated' : 'badge-original'}`}>
                    {isTranslated ? <Languages size={14} /> : <Video size={14} />}
                    <span>{isTranslated ? 'Translated Version' : 'Original Source'}</span>
                </div>
                {onDownload && (
                    <motion.button
                        onClick={onDownload}
                        className="btn-download-quick"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Download size={18} />
                    </motion.button>
                )}
            </div>

            <div className="video-viewport">
                <video
                    src={videoUrl}
                    controls
                    className="video-player-refined"
                    preload="metadata"
                >
                    Your browser does not support the video tag.
                </video>
            </div>

            <div className="preview-meta">
                {title && <h4 className="preview-title">{title}</h4>}
                {subtitle && <p className="preview-subtitle">{subtitle}</p>}

                {(originalText || translatedText) && (
                    <div className="bilingual-card-refined">
                        {originalText && (
                            <div className="text-entry original">
                                <div className="entry-header">
                                    <Quote size={12} className="quote-icon" />
                                    <span>Original Transcription</span>
                                </div>
                                <p>{originalText}</p>
                            </div>
                        )}
                        {translatedText && (
                            <div className="text-entry translated">
                                <div className="entry-header">
                                    <Languages size={12} className="quote-icon" />
                                    <span>Translated Script</span>
                                </div>
                                <p>{translatedText}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default VideoPreview;

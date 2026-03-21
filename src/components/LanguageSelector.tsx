import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Languages } from 'lucide-react';
import type { Language } from '../types';
import './LanguageSelector.css';

interface LanguageSelectorProps {
    sourceLang: string;
    targetLang: string;
    onSourceChange: (lang: string) => void;
    onTargetChange: (lang: string) => void;
    onSwap: () => void;
    disabled?: boolean;
}

const LANGUAGES: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' }
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    sourceLang,
    targetLang,
    onSourceChange,
    onTargetChange,
    onSwap,
    disabled = false
}) => {
    return (
        <div className="language-selector-container-refined">
            <div className="section-header">
                <div className="header-icon-box">
                    <Languages size={18} />
                </div>
                <div>
                    <h3>Translation settings</h3>
                    <p>Customize your voice dubbing output</p>
                </div>
            </div>

            <div className="selector-grid">
                <div className="selector-block">
                    <label className="field-label">Source Language</label>
                    <div className="select-custom-wrapper">
                        <select
                            className="select-custom"
                            value={sourceLang}
                            onChange={(e) => onSourceChange(e.target.value)}
                            disabled={disabled}
                        >
                            <option value="auto">🔍 Auto Detect</option>
                            {LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.flag} {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="swap-wrapper">
                    <motion.button
                        type="button"
                        className="btn-swap-refined"
                        onClick={onSwap}
                        disabled={disabled || sourceLang === 'auto'}
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ArrowLeftRight size={20} />
                    </motion.button>
                </div>

                <div className="selector-block">
                    <label className="field-label">Target Language</label>
                    <div className="select-custom-wrapper">
                        <select
                            className="select-custom"
                            value={targetLang}
                            onChange={(e) => onTargetChange(e.target.value)}
                            disabled={disabled}
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.flag} {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LanguageSelector;

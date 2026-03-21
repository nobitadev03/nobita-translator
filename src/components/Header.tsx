import React from 'react';
import { motion } from 'framer-motion';
import { Github, Sparkles } from 'lucide-react';
import './Header.css';

const Header: React.FC = () => {
    return (
        <motion.header
            className="header"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="container">
                <div className="header-content">
                    <div className="logo">
                        <div className="logo-icon">
                            <Sparkles className="icon-sparkle" size={28} />
                        </div>
                        <div className="logo-text">
                            <h1 className="logo-title">Nobita</h1>
                            <p className="logo-subtitle">AI Video Dubbing</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <motion.a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm github-link"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Github size={18} />
                            <span>Star on GitHub</span>
                        </motion.a>
                    </div>
                </div>
            </div>
        </motion.header>
    );
};

export default Header;

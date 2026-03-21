import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, X, Circle } from 'lucide-react';
import type { ProcessingStep } from '../types';
import './ProcessingStatus.css';

interface ProcessingStatusProps {
    steps: ProcessingStep[];
    currentStep?: string;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ steps, currentStep }) => {
    if (steps.length === 0) return null;

    return (
        <motion.div
            className="processing-status-refined glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="processing-header-refined">
                <div>
                    <h3>AI Processing Engine</h3>
                    <p>Executing translation and dubbing pipeline</p>
                </div>
                {currentStep && (
                    <div className="status-badge-active">
                        <Loader2 className="spinner-engine" size={14} />
                        <span>Running</span>
                    </div>
                )}
            </div>

            <div className="steps-list-refined">
                {steps.map((step, index) => (
                    <motion.div
                        key={step.id}
                        className={`step-item-refined ${step.status} ${currentStep === step.id ? 'active' : ''}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="step-ui">
                            <div className="step-indicator-refined">
                                {step.status === 'completed' ? (
                                    <Check size={16} />
                                ) : step.status === 'processing' ? (
                                    <Loader2 className="spinner" size={16} />
                                ) : step.status === 'error' ? (
                                    <X size={16} />
                                ) : (
                                    <Circle size={10} fill="currentColor" />
                                )}
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`step-line ${step.status === 'completed' ? 'filled' : ''}`} />
                            )}
                        </div>

                        <div className="step-info-refined">
                            <span className="step-name">{step.label}</span>
                            <AnimatePresence>
                                {step.message && (
                                    <motion.span
                                        className="step-detail"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                    >
                                        {step.message}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default ProcessingStatus;

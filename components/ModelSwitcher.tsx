import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, Loader2 } from 'lucide-react';
import { isAIReady, getLoadingProgress, initializeAI } from '../services/localAI';
import { motion, AnimatePresence } from 'framer-motion';

const ModelSwitcher: React.FC = () => {
  const [aiReady, setAiReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const checkAIStatus = async () => {
      const ready = isAIReady();
      setAiReady(ready);
      
      if (!ready && !isInitializing) {
        setIsInitializing(true);
        try {
          await initializeAI((progress) => {
            setLoadingProgress(progress);
          });
          setAiReady(true);
        } catch (error) {
          console.error('Failed to initialize AI:', error);
        } finally {
          setIsInitializing(false);
        }
      }
    };

    checkAIStatus();
  }, [isInitializing]);

  return (
    <div className="flex items-center">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200">
        <Cpu size={16} className={aiReady ? 'text-emerald-600' : 'text-slate-400'} />
        <span className="truncate max-w-[120px]">
          {isInitializing ? (
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              AI Loading...
            </span>
          ) : aiReady ? (
            <span className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 size={14} />
              AI Ready
            </span>
          ) : (
            'AI Offline'
          )}
        </span>
      </div>

      {/* Progress indicator during initialization */}
      <AnimatePresence>
        {isInitializing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap"
          >
            Loading AI Model: {loadingProgress}%
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModelSwitcher;

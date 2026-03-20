import React, { useState, useEffect, useRef } from 'react';
import { Cpu, ChevronDown, CheckCircle2 } from 'lucide-react';
import { getAvailableModels, activeModel, setActiveModel } from '../services/localAI';
import { motion, AnimatePresence } from 'framer-motion';

const getModelLabel = (modelName: string) => {
  const lower = modelName.toLowerCase();
  if (lower.includes('llama3.2')) return '⚡ Fast';
  if (lower.includes('mistral')) return '⚖️ Balanced';
  if (lower.includes('deepseek-r1')) return '🧠 Best Quality';
  return '';
};

const ModelSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [current, setCurrent] = useState(activeModel);
  const [showToast, setShowToast] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchModels = async () => {
      const available = await getAvailableModels();
      setModels(available);
    };
    fetchModels();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (model: string) => {
    setActiveModel(model);
    setCurrent(model);
    setIsOpen(false);
    
    // Show confirmation
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="relative z-50 flex items-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium border border-slate-200 hover:border-slate-300 transition-all shadow-sm"
      >
        <Cpu size={16} className="text-indigo-600" />
        <span className="truncate max-w-[120px]">{current}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Confirmation Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -10, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -10, x: '-50%' }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap"
          >
            Switched to {current}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select AI Model</h3>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {models.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500 text-center">
                  No models found. Run: <br />
                  <code className="bg-slate-100 px-1 py-0.5 rounded text-xs mt-1 inline-block">ollama pull llama3.2</code>
                </div>
              ) : (
                models.map(model => (
                  <button
                    key={model}
                    onClick={() => handleSelect(model)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors
                      ${current === model ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'}
                    `}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm truncate max-w-[140px]">{model}</span>
                      {getModelLabel(model) && (
                        <span className="text-xs text-slate-500 mt-0.5">{getModelLabel(model)}</span>
                      )}
                    </div>
                    {current === model && <CheckCircle2 size={16} className="text-indigo-600 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModelSwitcher;

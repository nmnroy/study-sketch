import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Download, Calendar, CheckCircle, RefreshCcw, Filter } from 'lucide-react';
import { Flashcard } from '../types';
import { getCardRecord, updateCardAfterReview, getDueCards } from '../services/spacedRepetition';

interface FlashcardsProps {
  cards: Flashcard[];
  onExport: () => void;
}

const Flashcards: React.FC<FlashcardsProps> = ({ cards, onExport }) => {
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [showOnlyDue, setShowOnlyDue] = useState(false);
  const [stats, setStats] = useState({ due: 0, mastered: 0, inProgress: 0 });

  const calculateStats = () => {
    let due = 0;
    let mastered = 0;
    let inProgress = 0;
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    cards.forEach(card => {
      const record = getCardRecord(card.id);
      if (!record) {
        due++;
      } else {
        const reviewDate = new Date(record.nextReview);
        if (reviewDate <= today) {
          due++;
        }
        
        if (record.interval >= 21) {
          mastered++;
        } else {
          inProgress++;
        }
      }
    });

    setStats({ due, mastered, inProgress });
  };

  useEffect(() => {
    calculateStats();
  }, [cards]);

  const displayedCards = showOnlyDue ? getDueCards(cards) : cards;

  const toggleCardFlip = (id: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleReview = (e: React.MouseEvent, id: string, result: 'easy' | 'medium' | 'hard', question: string) => {
    e.stopPropagation();
    updateCardAfterReview(id, result, question);
    calculateStats();
    
    // Automatically flip back after review
    setFlippedCards(prev => ({ ...prev, [id]: false }));
  };

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            Study Cards ({cards.length})
          </h3>
          <div className="flex gap-4 mt-2 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5 text-amber-600"><Calendar size={14}/> {stats.due} due today</span>
            <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle size={14}/> {stats.mastered} mastered</span>
            <span className="flex items-center gap-1.5 text-indigo-600"><RefreshCcw size={14}/> {stats.inProgress} in progress</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setShowOnlyDue(!showOnlyDue)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors border ${
              showOnlyDue 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter size={14} /> Review Due Cards
          </button>
          
          <button 
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Download size={14} /> Export CSV (Anki)
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
        {displayedCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
            <CheckCircle size={48} className="mb-4 text-emerald-400" />
            <p className="font-medium text-slate-600 text-lg">All caught up!</p>
            <p className="text-sm">No cards due for review today.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
            {displayedCards.map((card) => (
              <motion.div 
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => toggleCardFlip(card.id)}
                className="relative h-64 w-full perspective-1000 cursor-pointer group"
              >
                <motion.div 
                  initial={false}
                  animate={{ rotateY: flippedCards[card.id] ? 180 : 0 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                  className="relative w-full h-full transform-style-3d"
                >
                  <div className="absolute inset-0 w-full h-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center backface-hidden group-hover:shadow-md transition-shadow">
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-4">Question</span>
                    <p className="text-center font-medium text-slate-800">{card.front}</p>
                    <div className="absolute bottom-4 text-slate-400"><RotateCw size={16} /></div>
                  </div>
                  <div className="absolute inset-0 w-full h-full bg-indigo-600 rounded-2xl shadow-md p-6 flex flex-col items-center justify-between backface-hidden rotate-y-180 text-white">
                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider mt-2">Answer</span>
                    <p className="text-center font-medium my-auto">{card.back}</p>
                    
                    <div className="w-full grid grid-cols-3 gap-2 mt-4" onClick={e => e.stopPropagation()}>
                       <button onClick={(e) => handleReview(e, card.id, 'hard', card.front)} className="flex flex-col items-center p-2 rounded-lg bg-indigo-700/50 hover:bg-indigo-800 transition-colors text-xs font-medium border border-indigo-500/30">
                         <span className="text-base mb-1">😓</span> Hard
                       </button>
                       <button onClick={(e) => handleReview(e, card.id, 'medium', card.front)} className="flex flex-col items-center p-2 rounded-lg bg-indigo-700/50 hover:bg-indigo-800 transition-colors text-xs font-medium border border-indigo-500/30">
                         <span className="text-base mb-1">🤔</span> Medium
                       </button>
                       <button onClick={(e) => handleReview(e, card.id, 'easy', card.front)} className="flex flex-col items-center p-2 rounded-lg bg-indigo-700/50 hover:bg-indigo-800 transition-colors text-xs font-medium border border-indigo-500/30">
                         <span className="text-base mb-1">😊</span> Easy
                       </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Flashcards;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Award, RefreshCcw } from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizModeProps {
  questions: QuizQuestion[];
  onRetry: () => void;
}

const QuizMode: React.FC<QuizModeProps> = ({ questions, onRetry }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Guard against empty array boundary conditions gracefully
  if (!questions || questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
        <p className="text-slate-500">No questions available. Try generating the quiz again.</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const hasAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === currentQ.correctIndex;

  const handleOptionClick = (index: number) => {
    if (hasAnswered) return;
    
    setSelectedAnswer(index);
    if (index === currentQ.correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setIsFinished(false);
  };

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    let message = "Keep studying!";
    let color = "text-red-500";
    if (percentage === 100) {
      message = "Perfect Score!";
      color = "text-emerald-500";
    } else if (percentage >= 70) {
      message = "Great Job!";
      color = "text-indigo-500";
    }

    return (
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
          <Award size={64} className={`mb-4 ${color}`} />
          <h2 className={`text-2xl font-bold mb-2 ${color}`}>{message}</h2>
          <p className="text-slate-600 font-medium text-lg mb-8">
            You scored <span className="font-bold text-slate-800">{score}</span> out of <span className="font-bold text-slate-800">{questions.length}</span> ({percentage}%)
          </p>

          <div className="w-full max-w-2xl space-y-6 mb-8">
            <h3 className="font-semibold text-slate-800 border-b pb-2">Review</h3>
            {questions.map((q, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="font-medium text-slate-800 mb-2">{i + 1}. {q.question}</p>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-700">{q.options[q.correctIndex]}</p>
                </div>
                <p className="text-xs text-slate-500 mt-2 italic bg-slate-100 p-2 rounded-lg">
                  {q.explanation}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetQuiz}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <RotateCcw size={18} /> Try Again
            </button>
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2"
            >
              <RefreshCcw size={18} /> Generate New Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl mx-auto w-full">
      {/* Progress Header */}
      <div className="p-6 bg-white border-b border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Score: {score}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <motion.div 
            className="h-full bg-indigo-500"
            initial={{ width: `${(currentIndex / questions.length) * 100}%` }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-8 leading-relaxed">
          {currentQ.question}
        </h2>

        <div className="space-y-3 mb-8">
          {currentQ.options.map((option, index) => {
            let buttonClass = "bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700";
            
            if (hasAnswered) {
              if (index === currentQ.correctIndex) {
                buttonClass = "bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500";
              } else if (index === selectedAnswer && !isCorrect) {
                buttonClass = "bg-red-50 border-red-500 text-red-800 ring-1 ring-red-500 opacity-80";
              } else {
                buttonClass = "bg-slate-50 border-slate-200 text-slate-400 opacity-50"; 
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={hasAnswered}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center ${buttonClass} ${!hasAnswered ? 'active:scale-[0.99] shadow-sm' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 shrink-0 transition-colors
                  ${hasAnswered && index === currentQ.correctIndex ? 'bg-emerald-500 text-white' : 
                    hasAnswered && index === selectedAnswer && !isCorrect ? 'bg-red-500 text-white' : 
                    'bg-slate-100 text-slate-500'}`}
                >
                  {['A', 'B', 'C', 'D'][index]}
                </div>
                <span className="font-medium text-lg leading-snug">{option.replace(/^[A-Z]\.\s*/, '')}</span>
              </button>
            )
          })}
        </div>

        {/* Explanation & Next Button */}
        <AnimatePresence>
          {hasAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-auto"
            >
              <div className={`p-4 rounded-xl mb-6 flex items-start gap-4 border ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                 <div className="shrink-0 mt-1">
                   {isCorrect ? <CheckCircle2 size={24} className="text-emerald-500" /> : <XCircle size={24} className="text-red-500" />}
                 </div>
                 <div>
                   <h4 className="font-bold text-lg mb-1">{isCorrect ? 'Correct!' : 'Incorrect'}</h4>
                   <p className="text-sm opacity-90 leading-relaxed">{currentQ.explanation}</p>
                 </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2 group"
                >
                  {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'} 
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuizMode;

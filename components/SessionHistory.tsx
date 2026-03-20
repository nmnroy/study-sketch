import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, Trash2, Play, FileText, File, Calendar, ChevronRight } from 'lucide-react';
import { StudySession, getAllSessions, deleteSession } from '../services/sessionHistory';

interface SessionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSession: (session: StudySession) => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ isOpen, onClose, onLoadSession }) => {
  const [sessions, setSessions] = React.useState<StudySession[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setSessions(getAllSessions());
    }
  }, [isOpen]);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteSession(id);
      setSessions(getAllSessions());
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="text-red-500" size={20} />;
    if (type.includes('image')) return <File className="text-emerald-500" size={20} />;
    return <FileText className="text-indigo-500" size={20} />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <History size={20} />
                </div>
                <h2 className="font-bold text-lg text-slate-800">Study History</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center px-8">
                  <History size={48} className="mb-4 opacity-20" />
                  <p className="font-medium text-slate-600">No saved sessions yet</p>
                  <p className="text-sm mt-1">Generate a mind map to save your first study session!</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          {getFileIcon(session.fileType)}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-semibold text-slate-800 truncate pr-8">{session.fileName}</h3>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Calendar size={10} /> {formatDate(session.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-4 italic">
                      "{session.summary.oneliner}"
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                          onClick={() => onLoadSession(session)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                        >
                          <Play size={14} fill="currentColor" /> Load Session
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-slate-100"
                          title="Delete Session"
                        >
                          <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="absolute top-4 right-4 text-slate-200 group-hover:text-indigo-100 transition-colors pointer-events-none">
                        <ChevronRight size={24} />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold text-center">
                    Latest 10 sessions saved locally
                </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SessionHistory;

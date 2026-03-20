import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  extractedText: string | null;
  onClearChat: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isLoading, extractedText, onClearChat }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const currentInput = input;
    setInput('');
    await onSendMessage(currentInput);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-slate-700">Study Assistant</h3>
          <p className="text-xs text-slate-500">Ask questions about your notes</p>
        </div>
        {messages.length > 0 && (
          <button 
            onClick={onClearChat}
            className="text-slate-400 hover:text-red-500 transition-colors bg-white border border-slate-200 p-1.5 rounded-md shadow-sm"
            title="Clear Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Bot size={40} className="mx-auto mb-3 opacity-20" />
            <p>No messages yet.</p>
            <p className="text-xs mt-1">Try asking: "Summarize the main point" or "Explain the first concept"</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`
                  max-w-[85%] rounded-2xl p-3 text-sm
                  ${msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-slate-100 text-slate-700 rounded-bl-none'
                  }
                `}
              >
                {msg.role === 'model' ? (
                   <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                     <ReactMarkdown 
                      components={{
                        p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />
                      }}
                     >
                       {msg.content}
                     </ReactMarkdown>
                   </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl rounded-bl-none p-3 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 bg-white">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={!extractedText ? "Upload a file to start chatting about it" : "Ask a question..."}
            disabled={isLoading || !extractedText}
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm disabled:opacity-60 disabled:bg-slate-100"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading || !extractedText}
            className="absolute right-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
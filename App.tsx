import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from './components/FileUpload';
import AudioRecorder from './components/AudioRecorder';
import MermaidDiagram from './components/MermaidDiagram';
import Flashcards from './components/Flashcards';
import ChatPanel from './components/ChatPanel';
import QuizMode from './components/QuizMode';
import SessionHistory from './components/SessionHistory';
import { generateDiagramAndSummary, askQuestionAboutContent, initializeAI, generateQuiz, getLoadingProgress, isAIReady } from './services/localAI';
import ModelSwitcher from './components/ModelSwitcher';
import { saveSession, StudySession } from './services/sessionHistory';
import { DiagramType, GeneratedContent, Message, ProcessingState, QuizQuestion } from './types';
import { 
  BrainCircuit, 
  Layout, 
  GitBranch, 
  Clock, 
  AlignLeft, 
  Sparkles,
  RefreshCcw,
  BookOpen,
  Users,
  CalendarRange,
  Info,
  X,
  Layers,
  Edit2,
  Save,
  RotateCw,
  Play,
  Copy,
  MessageSquare,
  Upload,
  Download,
  History as HistoryIcon,
  CheckCircle,
  Gamepad2
} from 'lucide-react';

// Updated README Content matching the user's description
const README_CONTENT = `
# 🎨  StudySketch AI

> **StudySketch AI transforms dense notes into interactive mind-maps, flowcharts, and flashcards — all offline on your device.**

![StudySketch Banner](https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=2574&auto=format&fit=crop)

Upload a PDF, DOCX, or image. The app runs smart OCR, extracts headings, bullets, tables, and key insights, then automatically builds a dynamic mind-map. Every node is **editable, mergeable, and customizable**, so you can reorganize ideas instantly.

**Generate flashcards with a single click** — the app produces smart Q&A cards ready for Anki or CSV export. Summaries, highlights, and diagrams are fully automated and interactive.

All of this runs **on-device** using Arm-optimized models, Core ML on Apple Silicon, and quantized transformer pipelines. Heavy computations are accelerated via NEON SIMD, CPU/GPU/NPU delegates, and hardware-optimized runtimes, delivering fast, smooth, and energy-efficient performance without sending data to the cloud.

Developers can rebuild or update models using included conversion scripts and native runtime modules, ensuring the AI always runs efficiently on Arm phones, tablets, and Apple devices.

**StudySketch AI makes unstructured notes visual, actionable, and easy to study, helping users understand and revise faster — instantly, securely, and efficiently on Arm devices.**

---

## 🏗️ System Architecture & Arm Optimization

StudySketch AI isn't just a wrapper; it's a deeply optimized edge-AI application designed to run efficiently on Armv8-A and Armv9-A architectures.

### 1. The Mobile Inference Stack 📱
This diagram shows how we bridge the high-level UI (Flutter/React) with low-level Arm hardware features.

\`\`\`mermaid
graph TD
    User["👤 User Input"] --> UI["📱 Flutter / React Native UI"]
    
    subgraph Application_Layer ["Application Layer"]
        UI --> Controller["Logic Controller"]
        Controller --> Bridge["Native Bridge (JNI / FFI)"]
    end
    
    subgraph Inference_Engine ["Inference Engine (Arm Optimized)"]
        Bridge --> Router{"Hardware Router"}
        Router -->|Android| TFLite["TensorFlow Lite (NNAPI)"]
        Router -->|iOS| CoreML["Core ML (ANE)"]
        Router -->|Fallback| CPU_Inf["ExecuTorch (Neon Optimized)"]
    end
    
    subgraph Arm_Hardware ["Arm Hardware"]
        TFLite --> NPU["⚡ Neural Processing Unit"]
        CoreML --> NPU
        CPU_Inf --> CPU["⚙️ Arm Cortex CPU"]
    end

    style NPU fill:#ff9,stroke:#333,stroke-width:2px
    style CPU fill:#bbf,stroke:#333,stroke-width:2px
\`\`\`

### 2. The Model Quantization Pipeline 🔄
We use a custom Python pipeline to shrink large Transformer models into mobile-ready formats without losing accuracy.

\`\`\`mermaid
flowchart LR
    Raw["PyTorch Model .pt"] -->|Trace| TorchScript
    TorchScript -->|Export| ONNX["ONNX Format"]
    
    subgraph Quantization ["Quantization & Conversion"]
        ONNX -->|Quantize Int8| Quant["Quantized Model"]
        Quant -->|Convert| TFLite["TF Lite .tflite"]
        Quant -->|Convert| CML["Core ML .mlmodel"]
    end
    
    TFLite --> Android["🤖 Android (Arm)"]
    CML --> iOS["🍎 iOS (Apple Silicon)"]
    
    style Quant fill:#f9f,stroke:#333
\`\`\`
`;

const App: React.FC = () => {
  // State
  const [inputText, setInputText] = useState('');
  const [extractedFileText, setExtractedFileText] = useState<string>('');
  const [selectedType, setSelectedType] = useState<DiagramType>(DiagramType.MINDMAP);
  
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  const [content, setContent] = useState<GeneratedContent | null>(null);
  
  // Editable Diagram State
  const [currentDiagramCode, setCurrentDiagramCode] = useState<string>('');
  const [isEditingDiagram, setIsEditingDiagram] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'upload' | 'diagram' | 'summary' | 'flashcards' | 'chat' | 'quiz'>('upload');
  const [summaryTab, setSummaryTab] = useState<'oneLiner'|'paragraph'|'keyPoints'>('oneLiner');
  const [showDocs, setShowDocs] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // AI Status
  const [aiReady, setAiReady] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  useEffect(() => {
    const initAI = async () => {
      // Check session flag first
      if ((window as any).__ra_initialized === true) {
        setAiReady(true);
        setLoadingProgress(100);
        return;
      }
      try {
        await initializeAI((p) => setLoadingProgress(p));
        setAiReady(true);
      } catch (error) {
        console.error('Failed to initialize AI:', error);
        setAiReady(false);
      }
    };
    initAI();
  }, []);

  useEffect(() => {
    if (content?.diagramCode) {
      setCurrentDiagramCode(content.diagramCode);
    }
  }, [content]);

  // Handlers
  const handleGenerate = async () => {
    const combinedText = [inputText, extractedFileText].filter(Boolean).join('\n\n');
    if (!combinedText.trim()) {
      alert("Please provide text or upload a file.");
      return;
    }

    setProcessingState({ status: 'processing', message: 'Analyzing content & generating visualization...' });
    setChatMessages([]); 
    setIsEditingDiagram(false);
    
    try {
      const result = await generateDiagramAndSummary(
        combinedText, 
        null, 
        selectedType, 
        (msg) => setProcessingState(prev => ({ ...prev, message: msg }))
      );
      setContent(result);
      setProcessingState({ status: 'completed' });
      setActiveTab('summary');
      setSummaryTab('oneLiner');

      // Auto-save to history
      const session: StudySession = {
        id: crypto.randomUUID(),
        fileName: currentFileName || 'Untitled Notes',
        fileType: currentFileName.split('.').pop() || 'text',
        createdAt: new Date().toISOString(),
        extractedText: combinedText,
        diagramCode: result.diagramCode,
        summary: {
          oneliner: result.summary.oneLiner,
          paragraph: result.summary.paragraph,
          bullets: result.summary.keyPoints.split('\n').map(s => s.trim().replace(/^\*\s*/, '')).filter(Boolean)
        },
        flashcards: result.flashcards.map(f => ({ question: f.front, answer: f.back }))
      };
      saveSession(session);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

    } catch (error: any) {
      const msg = error?.message || 'Unknown error';
      if (msg.includes('timed out') || msg.includes('Timed out')) {
        setProcessingState({ 
          status: 'error', 
          message: 'Generation timed out. Try with shorter text or reload the page.' 
        });
      } else {
        setProcessingState({ 
          status: 'error', 
          message: `Generation failed: ${msg}` 
        });
      }
      console.error('[StudySketch] Generation error:', error);
    }
  };
  
  const loadDemoData = () => {
    setProcessingState({ status: 'processing', message: 'Loading demo content...' });
    setTimeout(() => {
        setInputText("# Understanding Machine Learning\n\nMachine Learning (ML) is a subset of artificial intelligence that focuses on building systems that learn from data. Unlike traditional programming where rules are explicitly written, ML algorithms identify patterns in data to make decisions or predictions.\n\n## 1. Supervised Learning\nIn supervised learning, models are trained on labeled data. The algorithm learns mapping from inputs to outputs based on examples (like predicting house prices based on features).\n\n## 2. Unsupervised Learning\nUnsupervised learning uses unlabeled data. The goal is to find hidden patterns or groupings within the data. Clustering algorithms like K-Means organize data into distinct groups based on similarities.\n\n## 3. Reinforcement Learning\nReinforcement learning involves an agent learning to make decisions by performing actions in an environment to maximize cumulative reward.\n\n## 4. Deep Learning\nA specialized subset of ML based on artificial neural networks with multiple layers. It excels at processing unstructured data like images, audio, and text.");
        setContent({
            diagramCode: `mindmap
  root((Machine Learning))
    Supervised
      Labeled Data
      Predicts Outcomes
    Unsupervised
      Unlabeled Data
      Finds Patterns
    Reinforcement
      Reward System
      Decision Making
    Deep Learning
      Neural Networks
      Complex Data`,
            summary: {
              oneLiner: "Machine Learning is an AI subset that enables systems to learn from data through supervised, unsupervised, reinforcement, and deep learning techniques.",
              paragraph: "Machine Learning (ML) transforms how software operates by allowing systems to learn from data rather than relying on explicit programming. It encompasses several paradigms: supervised learning for labeled data, unsupervised learning for discovering hidden patterns, reinforcement learning for reward-based decision making, and deep learning for tackling complex unstructured data using neural networks.",
              keyPoints: "* ML allows systems to learn from data patterns\n* Supervised Learning uses labeled data for predictions\n* Unsupervised Learning finds hidden structures in unlabeled data\n* Reinforcement Learning optimizes actions via rewards\n* Deep Learning uses neural networks for complex tasks"
            },
            diagramType: DiagramType.MINDMAP,
            flashcards: [
                { id: 'demo1', front: "What is Machine Learning?", back: "A subset of AI that builds systems capable of learning from data to make decisions." },
                { id: 'demo2', front: "How does Supervised Learning work?", back: "It trains models on labeled data to learn the mapping from inputs to outputs." },
                { id: 'demo3', front: "What is the goal of Unsupervised Learning?", back: "To discover hidden patterns or groupings within unlabeled data." },
                { id: 'demo4', front: "What are Neural Networks used for in ML?", back: "They are the foundation of Deep Learning, used to process complex, unstructured data like images and text." }
            ]
        });
        setProcessingState({ status: 'completed' });
        setActiveTab('diagram');
    }, 1500);
  };
  
  const handleGenerateQuiz = async () => {
    const combinedText = [inputText, extractedFileText].filter(Boolean).join('\n\n');
    if (!combinedText.trim()) {
      alert("Please provide text or upload a file.");
      return;
    }

    setIsGeneratingQuiz(true);
    setProcessingState({ status: 'processing', message: 'Generating multiple choice questions...' });
    
    try {
      const quizData = await generateQuiz(combinedText);
      setContent(prev => {
        if (prev) {
          return { ...prev, quiz: quizData };
        }
        return {
          diagramCode: '',
          summary: { oneLiner: '', paragraph: '', keyPoints: '' },
          diagramType: selectedType,
          flashcards: [],
          quiz: quizData
        };
      });
      setProcessingState({ status: 'completed' });
      setActiveTab('quiz');
    } catch (error) {
      setProcessingState({ status: 'error', message: 'Quiz generation failed. Please try again.' });
      console.error(error);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setIsChatLoading(true);

    try {
      const combinedContext = [inputText, extractedFileText].filter(Boolean).join('\n\n');
      const answer = await askQuestionAboutContent(
        [...chatMessages, newMessage], 
        text, 
        combinedContext, 
        null
      );
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: answer,
        timestamp: Date.now()
      };
      
      setChatMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const msg = error?.message || 'Unknown error';
      let content = "Sorry, I encountered an error while processing your request.";
      if (msg.includes('Timed out')) {
        content = "The AI is still warming up. Please wait 30 seconds and try again.";
      }
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleLoadSession = (session: StudySession) => {
    setExtractedFileText(session.extractedText);
    setInputText('');
    setCurrentFileName(session.fileName);
    
    const result: GeneratedContent = {
        diagramCode: session.diagramCode,
        summary: {
            oneLiner: session.summary.oneliner,
            paragraph: session.summary.paragraph,
            keyPoints: session.summary.bullets.map(b => `* ${b}`).join('\n')
        },
        diagramType: session.diagramCode.startsWith('graph') ? DiagramType.FLOWCHART : DiagramType.MINDMAP,
        flashcards: session.flashcards.map((f, i) => ({ id: `${session.id}-${i}`, front: f.question, back: f.answer })),
        quiz: [] // Previous sessions before quiz feature won't have quizzes saved
    };
    
    setContent(result);
    setProcessingState({ status: 'completed' });
    setIsHistoryOpen(false);
    setActiveTab('diagram');
  };
  
  const exportFlashcards = () => {
    if (!content?.flashcards) return;
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + content.flashcards.map(card => `"${card.front.replace(/"/g, '""')}","${card.back.replace(/"/g, '""')}"`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "studysketch_flashcards.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const diagramTypes = [
    { id: DiagramType.MINDMAP, label: 'Mind Map', icon: BrainCircuit },
    { id: DiagramType.FLOWCHART, label: 'Flowchart', icon: GitBranch },
    { id: DiagramType.SEQUENCE, label: 'Sequence', icon: AlignLeft },
    { id: DiagramType.TIMELINE, label: 'Timeline', icon: Clock },
    { id: DiagramType.ORGCHART, label: 'Org Chart', icon: Users },
    { id: DiagramType.GANTT, label: 'Gantt Chart', icon: CalendarRange },
  ];

  const tabs = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'diagram', label: 'Diagram', icon: GitBranch },
    { id: 'summary', label: 'Summary', icon: BookOpen },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'quiz', label: 'Quiz Mode', icon: Gamepad2 },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ];

  const hasInput = Boolean(inputText || extractedFileText);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* AI Status Bar */}
      {!aiReady && loadingProgress > 0 && (
        <div className="bg-blue-500 text-white text-center text-sm font-medium py-1.5 flex justify-center items-center gap-2">
          🧠 Loading AI Model: {loadingProgress}%
        </div>
      )}
      {aiReady && (
        <div className="bg-emerald-500 text-white text-center text-sm font-medium py-1.5 flex justify-center items-center gap-2">
          🟢 AI Ready — 100% Private & Offline
        </div>
      )}

      {/* Navbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-900 tracking-tight">StudySketch AI</h1>
            <p className="text-xs text-slate-500 font-medium">Smart Visual Notes</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ModelSwitcher />
          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-sm">
             🔒 100% Private · Runs Offline
          </span>
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg text-sm font-medium border border-slate-200 hover:border-indigo-200 transition-all shadow-sm"
          >
            <HistoryIcon size={16} /> History
          </button>
          <button 
            onClick={() => setShowDocs(true)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            title="Documentation & Architecture"
          >
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 justify-center gap-2 pt-2">
        {tabs.map(t => {
           const isDisabled = t.id !== 'upload' && !hasInput;
           return (
             <button 
               key={t.id}
               onClick={() => {
                 if (!isDisabled) setActiveTab(t.id as any);
               }}
               disabled={isDisabled}
               className={`
                 px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors
                 ${activeTab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent'}
                 ${isDisabled ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-500 hover:text-slate-700 hover:border-slate-300'}
               `}
             >
               <t.icon size={16}/> {t.label}
             </button>
           )
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col p-4 md:p-8 max-w-6xl mx-auto w-full">
         {/* Upload Tab */}
         {activeTab === 'upload' && (
           <div className="flex-1 flex flex-col md:flex-row gap-8 overflow-y-auto">
             <div className="w-full md:w-1/2 flex flex-col gap-6">
                <button
                  onClick={loadDemoData}
                  className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-indigo-200"
                >
                   <Play size={16} fill="currentColor" /> Load Demo Data
                </button>
                <section>
                  <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Source Material
                  </h2>
                  <FileUpload 
                    onFileProcessed={(name, text) => {
                      setExtractedFileText(text);
                      setCurrentFileName(name);
                    }} 
                    onClear={() => {
                      setExtractedFileText('');
                      setCurrentFileName('');
                    }} 
                  />
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-slate-200"></div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">or record your notes</span>
                    <div className="flex-1 h-px bg-slate-200"></div>
                  </div>
                  <AudioRecorder 
                    onTranscription={(text) => setExtractedFileText(prev => prev ? prev + '\n\n' + text : text)} 
                  />
                </section>
                <section>
                  <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Notes / Paste Text
                  </h2>
                  <textarea 
                    className="w-full h-40 p-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none shadow-sm"
                    placeholder="Paste your lecture notes, summaries, or text here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                </section>
             </div>
             <div className="w-full md:w-1/2 flex flex-col gap-6">
                <section>
                  <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Visualization Style
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {diagramTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`
                          flex items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all
                          ${selectedType === type.id 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-600' 
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }
                        `}
                      >
                        <type.icon size={18} /> {type.label}
                      </button>
                    ))}
                  </div>
                </section>
                <button
                  onClick={handleGenerate}
                  disabled={processingState.status === 'processing'}
                  className={`
                    w-full py-4 rounded-xl font-semibold text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all mt-auto
                    ${processingState.status === 'processing' 
                      ? 'bg-indigo-400 cursor-wait' 
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]'
                    }
                  `}
                >
                  {processingState.status === 'processing' ? (
                    <>
                      <RefreshCcw className="animate-spin" size={20} />
                      Generating diagram locally...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      {content ? 'Regenerate Compilation' : 'Generate Compilation'}
                    </>
                  )}
                </button>
                {processingState.status === 'error' && (
                  <div className="text-red-600 text-sm font-medium bg-red-50 p-4 rounded-xl border border-red-200 text-center animate-in fade-in slide-in-from-bottom-2">
                    Generation failed. Please try again.
                  </div>
                )}
                <div className="flex items-center gap-4 my-2">
                    <div className="flex-1 h-px bg-slate-200"></div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">or test yourself</span>
                    <div className="flex-1 h-px bg-slate-200"></div>
                </div>
                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGeneratingQuiz || processingState.status === 'processing'}
                  className={`
                    w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
                    ${isGeneratingQuiz || processingState.status === 'processing'
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-wait' 
                      : 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 shadow-sm'
                    }
                  `}
                >
                  {isGeneratingQuiz ? (
                    <>
                      <RefreshCcw className="animate-spin" size={20} />
                      Generating quiz locally...
                    </>
                  ) : (
                    <>
                      <Gamepad2 size={20} />
                      Generate Quiz
                    </>
                  )}
                </button>
             </div>
           </div>
         )}

         {/* Shared Helper for empty AI generated states */}
         {activeTab !== 'upload' && activeTab !== 'chat' && !content && processingState.status !== 'processing' && (
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
             <div className="text-4xl mb-4">📄</div>
             <h2 className="text-lg font-bold text-slate-700 mb-2">Upload a file first to use this feature ↑</h2>
           </div>
         )}
         
         {activeTab !== 'upload' && processingState.status === 'processing' && (
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pulse">
             <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
             <h3 className="text-xl font-semibold text-slate-800 mb-2">Analyzing your content</h3>
             <p className="text-slate-500">{processingState.message}</p>
           </div>
         )}

         {/* Diagram Tab */}
         {activeTab === 'diagram' && content && (
           <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
              <div className="absolute top-4 left-4 z-10">
                <button 
                  onClick={() => setIsEditingDiagram(!isEditingDiagram)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shadow-sm border transition-all
                    ${isEditingDiagram ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}
                  `}
                >
                   {isEditingDiagram ? <><Save size={14}/> View</> : <><Edit2 size={14}/> Edit Code</>}
                </button>
              </div>
              
              {isEditingDiagram ? (
                <div className="w-full h-full p-4 pt-16">
                   <textarea
                     value={currentDiagramCode}
                     onChange={(e) => setCurrentDiagramCode(e.target.value)}
                     className="w-full h-full p-4 font-mono text-sm bg-slate-900 text-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   />
                </div>
              ) : (
                <div className="w-full h-full p-4">
                   <MermaidDiagram code={currentDiagramCode} />
                </div>
              )}
           </div>
         )}

         {/* Summary Tab */}
         {activeTab === 'summary' && content && (
           <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
               {['oneLiner', 'paragraph', 'keyPoints'].map((tab) => (
                 <button
                   key={tab}
                   onClick={() => setSummaryTab(tab as any)}
                   className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                     summaryTab === tab
                       ? 'bg-white shadow-sm border border-slate-200 text-indigo-700'
                       : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                   }`}
                 >
                   {tab === 'oneLiner' ? 'One-liner' : tab === 'paragraph' ? 'Paragraph' : 'Key Points'}
                 </button>
               ))}
             </div>
             <div className="flex-1 overflow-y-auto p-8 relative group">
               <button
                 onClick={() => copyToClipboard(content.summary[summaryTab])}
                 className="absolute top-6 right-6 p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                 title="Copy to clipboard"
               >
                 <Copy size={16} />
               </button>
               <article className="prose prose-slate prose-headings:text-indigo-900 prose-a:text-indigo-600 max-w-none">
                 <ReactMarkdown>{content.summary[summaryTab]}</ReactMarkdown>
               </article>
             </div>
           </div>
         )}

         {/* Flashcards Tab */}
         {activeTab === 'flashcards' && content && content.flashcards && (
            <Flashcards cards={content.flashcards} onExport={exportFlashcards} />
         )}

         {/* Quiz Tab */}
         {activeTab === 'quiz' && content && !content.quiz && processingState.status !== 'processing' && (
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200">
             <div className="text-4xl mb-4">🎮</div>
             <h2 className="text-xl font-bold text-slate-700 mb-4">Ready to test your knowledge?</h2>
             <button
                onClick={handleGenerateQuiz}
                disabled={isGeneratingQuiz}
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
             >
                Generate Quiz
             </button>
           </div>
         )}
         {activeTab === 'quiz' && content && content.quiz && (
            <QuizMode questions={content.quiz} onRetry={handleGenerateQuiz} />
         )}
         
         {/* Chat Tab */}
         {activeTab === 'chat' && (
           <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
             {!hasInput ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <div className="text-4xl mb-4">📄</div>
                  <h2 className="text-lg font-bold text-slate-700 mb-2">Upload a file first to use this feature ↑</h2>
                  <p className="text-sm">We need context material to chat about.</p>
                </div>
             ) : (
                <ChatPanel 
                  messages={chatMessages} 
                  onSendMessage={handleSendMessage}
                  isLoading={isChatLoading}
                  extractedText={extractedFileText || inputText || null}
                  onClearChat={() => setChatMessages([])}
                />
             )}
           </div>
         )}
      </div>

      {/* Docs Modal */}
      {showDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800">Project Documentation</h2>
              <button 
                onClick={() => setShowDocs(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <article className="prose prose-slate prose-sm max-w-none">
                <ReactMarkdown>{README_CONTENT}</ReactMarkdown>
              </article>
            </div>
          </div>
        </div>
      )}

      {/* Session History Drawer */}
      <SessionHistory 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        onLoadSession={handleLoadSession} 
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 border border-slate-800"
          >
            <div className="bg-emerald-500 rounded-full p-1">
              <CheckCircle size={14} />
            </div>
            <span className="text-sm font-medium">Session saved to history ✓</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;


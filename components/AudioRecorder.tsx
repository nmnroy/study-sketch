import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { loadWhisperModel, transcribeAudio } from '../services/whisper';

interface AudioRecorderProps {
  onTranscription: (text: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscription }) => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewText, setPreviewText] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const initWhisper = async () => {
    setIsModelLoading(true);
    try {
      await loadWhisperModel();
      setIsModelLoaded(true);
    } catch (error) {
      console.error('Failed to load Whisper model:', error);
      alert('Error loading Whisper model.');
    } finally {
      setIsModelLoading(false);
    }
  };

  const startRecording = async () => {
    // Only load whisper model right before recording starts
    if (!isModelLoaded) {
      setIsModelLoading(true);
      try {
        await loadWhisperModel();
        setIsModelLoaded(true);
      } catch (error) {
        console.error('Failed to load Whisper model:', error);
        alert('Error loading Whisper model.');
        setIsModelLoading(false);
        return; // Don't try recording if model failed to load
      } finally {
        setIsModelLoading(false);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        setIsTranscribing(true);
        try {
          const text = await transcribeAudio(audioBlob);
          setPreviewText(text);
          onTranscription(text);
        } catch (error) {
          console.error("Transcription failed:", error);
          alert("Voice input unavailable in this browser. Please use Chrome.");
        } finally {
          setIsTranscribing(false);
        }
        
        setRecordingTime(0);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setPreviewText(null);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access denied or error occurred.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      {/* Status indicator */}
      {!isModelLoaded && !isModelLoading && (
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          Loading speech model... (first time only, ~40MB)
        </p>
      )}
      {!isModelLoaded && isModelLoading && (
        <p className="text-xs text-indigo-500 font-medium flex items-center gap-1.5 animate-pulse">
          <Loader2 size={12} className="animate-spin" /> Downloading model...
        </p>
      )}
      {isModelLoaded && !isRecording && !isTranscribing && (
        <p className="text-xs text-emerald-600 font-medium">🎙️ Ready</p>
      )}
      {isTranscribing && (
        <p className="text-xs text-indigo-600 font-medium flex items-center gap-1.5 animate-pulse">
          <Loader2 size={12} className="animate-spin" /> Transcribing...
        </p>
      )}

      {/* Main button */}
      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={isModelLoading || isTranscribing}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-full font-semibold shadow-sm transition-all
            ${isModelLoading || isTranscribing 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:scale-105 active:scale-95'}
          `}
        >
          <Mic size={18} /> 🎙️ Record
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold shadow-sm bg-red-500 text-white transition-all shadow-red-500/30 animate-pulse hover:bg-red-600"
        >
          <Square size={18} fill="currentColor" /> ⏹ Stop Recording ({formatTime(recordingTime)})
        </button>
      )}

      {/* Transcription preview */}
      {previewText && (
        <div className="w-full mt-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg shadow-sm text-sm">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400 mb-1">
            Transcribed Notes
          </p>
          <p className="text-slate-700 italic">"{previewText}"</p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;

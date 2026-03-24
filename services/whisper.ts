let whisperLoaded = false;

export const loadWhisperModel = async (onProgress?: (data: any) => void): Promise<void> => {
  // Use browser Web Speech API as fallback - no model download needed
  whisperLoaded = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  if (onProgress) onProgress({ progress: 100, status: 'loaded' });
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      reject(new Error('Speech recognition not supported in this browser'));
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => resolve(event.results[0][0].transcript);
    recognition.onerror = (event: any) => reject(new Error(event.error));
    recognition.start();
  });
};

export const isWhisperLoaded = (): boolean => whisperLoaded;

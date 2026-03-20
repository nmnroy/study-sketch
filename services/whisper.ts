import { RunAnywhere } from '@runanywhere/web';
import { ONNX, STT, STTModelType } from '@runanywhere/web-onnx';

// Shared state
let whisperLoaded = false;

/**
 * Load Whisper model using RunAnywhere STT
 */
export const loadWhisperModel = async (onProgress?: (data: any) => void): Promise<void> => {
  if (whisperLoaded) return;
  
  try {
    // Initialize RunAnywhere if not already done
    await RunAnywhere.initialize();
    
    // Register ONNX backend
    await ONNX.register();
    
    // Load Whisper model using STT
    await STT.loadModel({
      modelId: 'whisper-tiny-en',
      type: STTModelType.Whisper,
      // Note: Model files would need to be provided separately
      // For now, we'll assume they're bundled with the SDK
      modelFiles: {
        encoder: '/models/whisper-tiny-en/encoder.onnx',
        decoder: '/models/whisper-tiny-en/decoder.onnx',
        tokens: '/models/whisper-tiny-en/tokens.txt',
      }
    });
    
    whisperLoaded = true;
    
    if (onProgress) {
      onProgress({
        progress: 100,
        status: 'loaded'
      });
    }
  } catch (error) {
    console.error('Failed to load Whisper model:', error);
    throw error;
  }
};

/**
 * Transcribe audio using RunAnywhere STT
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  if (!whisperLoaded) {
    await loadWhisperModel();
  }

  try {
    // Convert Blob to File for STT.transcribeFile
    const audioFile = new File([audioBlob], 'recording.webm', { type: audioBlob.type });
    
    // Use STT.transcribeFile for direct File processing
    const result = await STT.transcribeFile(audioFile);
    
    return result.text || '';
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

/**
 * Check if Whisper model is loaded
 */
export const isWhisperLoaded = (): boolean => whisperLoaded;

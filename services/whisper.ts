import { pipeline } from '@xenova/transformers';

let transcriber: any = null;

export const loadWhisperModel = async (onProgress?: (data: any) => void): Promise<void> => {
  if (!transcriber) {
    // Specify the task and model
    // The progressed callback allows tracking download progress for the ~40MB models
    transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
      progress_callback: onProgress
    });
  }
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  if (!transcriber) {
    await loadWhisperModel();
  }

  // Convert Blob to ArrayBuffer
  const arrayBuffer = await audioBlob.arrayBuffer();
  
  // Decoding the audio buffer to raw PCM data (Float32Array at 16kHz)
  // Whisper specifically requires 16000Hz mono audio
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: 16000,
  });
  
  const decodedAudio = await audioContext.decodeAudioData(arrayBuffer);
  const audioData = decodedAudio.getChannelData(0);

  // Pass properly formatted Float32Array to the loaded Whisper pipeline
  const result = await transcriber(audioData);
  
  return result.text || '';
};

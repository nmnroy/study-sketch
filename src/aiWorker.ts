import { RunAnywhere, SDKEnvironment, LLMFramework, ModelManager } from '@runanywhere/web';
import { LlamaCPP, TextGeneration } from '@runanywhere/web-llamacpp';

let ready = false;
const MODEL_ID = 'tinyllama-1.1b';
const MODEL_URL = 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';

self.onmessage = async (e) => {
  const { type, payload, id } = e.data;

  try {
    if (type === 'INIT') {
      if (ready) {
        self.postMessage({ type: 'INIT_DONE' });
        return;
      }

      await RunAnywhere.initialize({
        environment: SDKEnvironment.Development,
        apiKey: 'sk-Ik3KHBQXKTxEhklUKLXEyg',
        debug: false
      });
      
      await LlamaCPP.register();
      
      RunAnywhere.registerModels([{
        id: MODEL_ID,
        name: 'TinyLlama 1.1B',
        url: MODEL_URL,
        framework: LLMFramework.LlamaCpp,
        modality: 'LLM' as any,
      }]);

      const runAnywhereModels = RunAnywhere.availableModels();
      const managedModels = ModelManager.getModels();
      const model = runAnywhereModels.find((m: any) => m.id === MODEL_ID) || managedModels.find((m: any) => m.id === MODEL_ID);
      const statusStr = model?.status?.toString() || '';
      
      const alreadyDownloaded = model && (
        statusStr.includes('downloaded') ||
        statusStr.includes('loaded') ||
        statusStr.includes('Downloaded') ||
        statusStr.includes('Loaded') ||
        (model as any).isDownloaded ||
        (model as any).isLoaded ||
        ((model as any).downloadProgress !== undefined && (model as any).downloadProgress >= 1.0)
      );

      if (!alreadyDownloaded) {
        const unsub = ModelManager.onChange((models: any[]) => {
          const m = models.find((x: any) => x.id === MODEL_ID);
          if (m?.downloadProgress) {
            const raw = m.downloadProgress;
            const fraction = typeof raw === 'number' ? raw : (raw?.progress ?? raw?.fraction ?? 0);
            const p = Math.round(fraction * 80) + 10;
            self.postMessage({ type: 'PROGRESS', payload: p });
          }
        });
        await RunAnywhere.downloadModel(MODEL_ID);
        unsub();
      }

      self.postMessage({ type: 'PROGRESS', payload: 90 });
      await RunAnywhere.loadModel(MODEL_ID);
      
      if (!TextGeneration.isModelLoaded) throw new Error('Model not loaded');
      ready = true;
      self.postMessage({ type: 'INIT_DONE', payload: { success: true } });
      
    } else if (type === 'GENERATE') {
      if (!ready) throw new Error("Worker model not initialized");
      
      const { prompt, options } = payload;
      const generateParams = {
        maxTokens: options.maxTokens || 512,
        temperature: options.temperature || 0.7,
        systemPrompt: options.systemPrompt || 'You are a helpful study assistant. Be concise.'
      };
      
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timed out after 300s')), 300000)
      );
      
      const generateResult = await Promise.race([
        TextGeneration.generate(prompt, generateParams), 
        timeout
      ]);
      
      self.postMessage({ type: 'GENERATE_RESULT', id, payload: { text: generateResult.text } });
    }
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', id, payload: { message: error.message || String(error) } });
  }
};

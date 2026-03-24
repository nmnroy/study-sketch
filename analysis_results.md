# RunAnywhere SDK API Specification (Web)

Based on the inspection of `node_modules/@runanywhere/web` and `node_modules/@runanywhere/web-llamacpp` (version `0.1.0-beta.10`), here are the exact API methods and types to be used.

## 1. Setup & Registration

### SDK Initialization
Initialize the core TypeScript infrastructure (logging, OPFS storage).
```typescript
import { RunAnywhere } from '@runanywhere/web';

await RunAnywhere.initialize({ 
  environment: 'development', // or 'production'
  debug: true 
});
```

### Backend Registration
Register the LlamaCPP backend to load the WASM binary.
```typescript
import { LlamaCPP } from '@runanywhere/web-llamacpp';

await LlamaCPP.register();
```

---

## 2. Model Management

### Model Catalog Registration
Define models before downloading or loading.
```typescript
import { RunAnywhere } from '@runanywhere/web';

RunAnywhere.registerModels([
  {
    id: 'tinyllama-1.1b',
    name: 'TinyLlama 1.1B',
    repo: 'TinyLlama/TinyLlama-1.1B-Chat-v1.0-GGUF',
    files: ['tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf'],
    framework: 'llamacpp',
    modality: 'llm'
  }
]);
```

### Model Download with Progress
Listen for events on the shared event bus.
```typescript
import { RunAnywhere } from '@runanywhere/web';

// Subscribe to progress
RunAnywhere.events.on('model.downloadProgress', (data) => {
  console.log(`Download progress: ${data.progress * 100}%`);
  console.log(`Bytes: ${data.bytesDownloaded} / ${data.totalBytes}`);
});

// Start download
await RunAnywhere.downloadModel('tinyllama-1.1b');
```

### Model Loading
Prepare the model for inference.
```typescript
await RunAnywhere.loadModel('tinyllama-1.1b');
```

---

## 3. Text Generation

### Non-Streaming
```typescript
import { TextGeneration } from '@runanywhere/web-llamacpp';

const result = await TextGeneration.generate('Summarize this text...', {
  maxTokens: 500,
  temperature: 0.7,
  systemPrompt: 'You are a helpful assistant.'
});

console.log(result.text);
```

### Streaming
The `generateStream` method returns a promise that resolves to an object containing an `AsyncIterable`.
```typescript
import { TextGeneration } from '@runanywhere/web-llamacpp';

const result = await TextGeneration.generateStream('Write a poem about coding...');

for await (const token of result.tokens) {
  process.stdout.write(token);
}

// Access final results/metrics after stream completes
const finalResult = await result.finalResult;
console.log(`\nTokens used: ${finalResult.tokensUsed}`);
```

---

## 4. Key Types

- **`LLMGenerationOptions`**: `{ maxTokens?, temperature?, topP?, stopSequences?, systemPrompt?, ... }`
- **`LLMGenerationResult`**: `{ text, tokensUsed, latencyMs, performanceMetrics: { tokensPerSecond, ... }, ... }`
- **`DownloadProgress`**: `{ modelId, progress, bytesDownloaded, totalBytes, stage? }`
- **`ManagedModel`**: `{ id, name, status, downloadProgress, ... }`

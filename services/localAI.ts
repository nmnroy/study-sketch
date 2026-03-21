import { DiagramType, GeneratedContent, FileData, Message, Flashcard, QuizQuestion } from '../types';

let ready = false;
let progress = 0;
let llm: any = null;

export async function initializeAI(onProgress?: (p: number) => void): Promise<void> {
  console.log('[StudySketch] initializeAI called');

  // If already initialized in this browser session, skip entirely
  if ((window as any).__studysketch_ai_ready === true) {
    console.log('[StudySketch] AI already initialized, skipping...');
    ready = true;
    if (onProgress) onProgress(100);
    return;
  }

  // If initialization is already in progress, wait for it
  if ((window as any).__studysketch_ai_loading === true) {
    console.log('[StudySketch] AI initialization in progress, waiting...');
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if ((window as any).__studysketch_ai_ready === true) {
          clearInterval(interval);
          ready = true;
          if (onProgress) onProgress(100);
          resolve();
        }
      }, 500);
    });
    return;
  }

  (window as any).__studysketch_ai_loading = true;

  try {
    const { RunAnywhere, SDKEnvironment, LLMFramework, ModelCategory } = await import('@runanywhere/web');
    const { LlamaCPP } = await import('@runanywhere/web-llamacpp');

    console.log('[StudySketch] Step 1: initializing RunAnywhere...');
    await RunAnywhere.initialize({ environment: SDKEnvironment.Development, debug: true });
    console.log('[StudySketch] RunAnywhere initialized');

    console.log('[StudySketch] Step 2: registering LlamaCPP backend...');
    await LlamaCPP.register();
    console.log('[StudySketch] LlamaCPP registered');

    console.log('[StudySketch] Step 3: registering model catalog...');
    RunAnywhere.registerModels([
      {
        id: 'tinyllama-1.1b',
        name: 'TinyLlama 1.1B',
        repo: 'TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF',
        files: ['tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf'],
        framework: LLMFramework.LlamaCpp,
        modality: ModelCategory.Language
      }
    ]);
    console.log('[StudySketch] Model registered');

    console.log('[StudySketch] Step 4: subscribing to download progress...');
    RunAnywhere.events.on('model.downloadProgress', (data: any) => {
      if (data.modelId === 'tinyllama-1.1b') {
        const pct = Math.round(data.progress * 100);
        progress = pct;
        if (onProgress) onProgress(pct);
        console.log(`[StudySketch] Download progress: ${pct}%`);
      }
    });

    console.log('[StudySketch] Step 5: downloading model...');
    await RunAnywhere.downloadModel('tinyllama-1.1b');
    console.log('[StudySketch] Model downloaded');

    console.log('[StudySketch] Step 6: loading model...');
    await RunAnywhere.loadModel('tinyllama-1.1b');
    console.log('[StudySketch] Model loaded and ready!');

    ready = true;
    if (onProgress) onProgress(100);
    (window as any).__studysketch_ai_ready = true;
    (window as any).__studysketch_ai_loading = false;
  } catch (err) {
    console.error('[StudySketch] FULL ERROR:', err);
    console.error('[StudySketch] Message:', (err as any)?.message);
    console.error('[StudySketch] Stack:', (err as any)?.stack);
    ready = false;
    throw err;
  }
}

async function ensureModelReady(): Promise<void> {
  const { RunAnywhere, SDKEnvironment, LLMFramework, ModelCategory } = await import('@runanywhere/web');
  const { LlamaCPP } = await import('@runanywhere/web-llamacpp');

  // Step 1: initialize SDK
  try {
    await RunAnywhere.initialize({ environment: SDKEnvironment.Development, debug: false });
  } catch (e) {
    // already initialized, ignore
  }

  // Step 2: register backend
  try {
    await LlamaCPP.register();
  } catch (e) {
    // already registered, ignore
  }

  // Step 3: register model
  try {
    RunAnywhere.registerModels([
      {
        id: 'tinyllama-1.1b',
        name: 'TinyLlama 1.1B',
        repo: 'TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF',
        files: ['tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf'],
        framework: LLMFramework.LlamaCpp,
        modality: ModelCategory.Language
      }
    ]);
  } catch (e) {
    // already registered, ignore
  }

  // Step 4: download if needed
  try {
    await RunAnywhere.downloadModel('tinyllama-1.1b');
  } catch (e) {
    // already downloaded, ignore
  }

  // Step 5: load into memory - this is the critical step
  await RunAnywhere.loadModel('tinyllama-1.1b');
}

async function runPrompt(prompt: string): Promise<string> {
  await ensureModelReady();

  const { TextGeneration } = await import('@runanywhere/web-llamacpp');

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Generation timed out after 120s')), 120000)
  );
  const generatePromise = TextGeneration.generate(prompt, {
    maxTokens: 512,
    temperature: 0.7,
    systemPrompt: 'You are a helpful study assistant. Be concise.'
  });
  const result = await Promise.race([generatePromise, timeoutPromise]);
  return result.text;
}

async function runPromptShort(prompt: string): Promise<string> {
  await ensureModelReady();

  const { TextGeneration } = await import('@runanywhere/web-llamacpp');

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Generation timed out after 90s')), 90000)
  );
  const generatePromise = TextGeneration.generate(prompt, {
    maxTokens: 256,
    temperature: 0.3,
    systemPrompt: 'You are a diagram generator. Return only Mermaid syntax.'
  });
  const result = await Promise.race([generatePromise, timeoutPromise]);
  return result.text;
}

export function isAIReady(): boolean { 
  console.log('[StudySketch] isAIReady called, returning:', ready);
  return ready; 
}

export function getLoadingProgress(): number { return progress; }

/**
 * Generate a Mermaid diagram from input text using AI.
 */
export const generateDiagramAndSummary = async (
  input: string,
  _file: FileData | null,
  type: DiagramType,
  onProgress?: (message: string) => void
): Promise<GeneratedContent> => {
  const truncatedText = input.substring(0, 1500);
  if (onProgress) onProgress('Generating diagram locally...');
  const diagramPrompt = `Analyze the following text and generate a Mermaid.js diagram.
Return ONLY valid Mermaid syntax, no explanation, no markdown fences, no backticks.
Use mindmap or flowchart TD format. Max 20 nodes.
Text: ${truncatedText}`;

  const rawDiagram = await runPromptShort(diagramPrompt);
  
  // Sanitize common AI Mermaid mistakes
  let diagram = rawDiagram.trim();
  
  // Remove markdown code fences if present
  diagram = diagram.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '');
  
  // Fix arrow syntax: --> should be -->
  diagram = diagram.replace(/-->/g, '-->');
  
  // Fix arrow syntax: ==> should be ==>  
  diagram = diagram.replace(/==>/g, '==>');
  
  // Remove style lines that cause parse errors in strict mode
  diagram = diagram.replace(/^\s*style\s+.+$/gm, '');
  
  // Remove classDef lines if causing issues
  diagram = diagram.replace(/^\s*classDef\s+.+$/gm, '');
  
  const cleanDiagram = diagram.trim();

  if (onProgress) onProgress('Step 1 of 3: Generating one-liner...');
  const oneLinerPrompt = `Summarize this text in exactly one sentence. Return plain text only, no extra formatting.\nText: ${truncatedText}`;
  const oneLiner = await runPrompt(oneLinerPrompt);

  if (onProgress) onProgress('Step 2 of 3: Generating paragraph...');
  const paragraphPrompt = `Write a 4 to 5 sentence summary of this text. Return plain text only.\nText: ${truncatedText}`;
  const paragraph = await runPrompt(paragraphPrompt);

  if (onProgress) onProgress('Generating key points...');
  const keyPointsPrompt = `Extract 5 to 7 key points from this text as a bulleted list. Return plain text only.\nText: ${truncatedText}`;
  const keyPoints = await runPrompt(keyPointsPrompt);

  if (onProgress) onProgress('Step 3 of 3: Generating flashcards...');
  const flashcardsPrompt = `Generate exactly 8 separate question-answer flashcard pairs from this text. You MUST generate all 8 pairs.
Return ONLY a valid JSON array containing exactly 8 objects. No markdown formatting, no code blocks, no explanation:
[
  {"question": "Q1", "answer": "A1"},
  {"question": "Q2", "answer": "A2"},
  {"question": "Q3", "answer": "A3"},
  {"question": "Q4", "answer": "A4"},
  {"question": "Q5", "answer": "A5"},
  {"question": "Q6", "answer": "A6"},
  {"question": "Q7", "answer": "A7"},
  {"question": "Q8", "answer": "A8"}
]
Text: ${truncatedText}`;
  const rawFlashcards = await runPrompt(flashcardsPrompt);

  let flashcardsJson: any[] = [];
  try {
    flashcardsJson = JSON.parse(rawFlashcards);
  } catch {
    const match = rawFlashcards.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        flashcardsJson = JSON.parse(match[0]);
      } catch (err) {
        throw new Error('Failed to parse flashcards');
      }
    } else {
      throw new Error('Failed to parse flashcards');
    }
  }

  const flashcards: Flashcard[] = flashcardsJson.map((card: any, index: number) => ({
    id: `fc-${Date.now()}-${index}`,
    front: card.question || card.front || 'Question',
    back: card.answer || card.back || 'Answer',
  }));

  return {
    summary: { oneLiner, paragraph, keyPoints },
    diagramCode: cleanDiagram || `graph TD\n  A["Error"] --> B["Failed to generate valid Mermaid syntax"]`,
    diagramType: type,
    flashcards,
  };
};

/**
 * Ask a question about uploaded content using AI.
 */
export const askQuestionAboutContent = async (
  _history: Message[],
  currentQuestion: string,
  contextText: string | null,
  _contextFile: FileData | null
): Promise<string> => {
  const truncatedContext = contextText ? contextText.substring(0, 2000) : '';

  const prompt = `You are a helpful study assistant. Answer the question based ONLY on the provided text. Be concise and accurate.\n\nContext: ${truncatedContext}\nQuestion: ${currentQuestion}\nAnswer:`;

  return await runPrompt(prompt);
};

/**
 * Generate a 6-question multiple choice quiz from uploaded content using AI.
 */
export const generateQuiz = async (extractedText: string): Promise<QuizQuestion[]> => {
  const truncatedText = extractedText.substring(0, 3000);
  
  const prompt = `Generate exactly 6 multiple choice questions from the following text.
Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]
correctIndex is 0 for A, 1 for B, 2 for C, 3 for D.
Text: ${truncatedText}`;

  const rawQuiz = await runPrompt(prompt);
  
  let quizJson: any[] = [];
  try {
    quizJson = JSON.parse(rawQuiz);
  } catch {
    const match = rawQuiz.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        quizJson = JSON.parse(match[0]);
      } catch (err) {
        throw new Error('Failed to parse quiz response');
      }
    } else {
      throw new Error('Failed to parse quiz response');
    }
  }

  // Validate and map the JSON cleanly
  return quizJson.map((q: any) => ({
    question: q.question || 'Parsed question missing',
    options: Array.isArray(q.options) && q.options.length === 4 
             ? q.options 
             : ['A', 'B', 'C', 'D'],
    correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3 
                  ? q.correctIndex 
                  : 0,
    explanation: q.explanation || 'No explanation provided.'
  }));
};

// Legacy exports for backward compatibility - these are no longer needed but kept to avoid breaking imports
export const checkOllamaStatus = async (): Promise<boolean> => ready;
export const getAvailableModels = async (): Promise<string[]> => ['smollm2'];

// Mock activeModel for backward compatibility
export const activeModel = 'smollm2';
export const setActiveModel = (_model: string): void => {
  // No-op - we use fixed model
};

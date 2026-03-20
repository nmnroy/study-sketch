import { DiagramType, GeneratedContent, FileData, Message, Flashcard, QuizQuestion } from '../types';

let ready = false;
let progress = 0;
let llm: any = null;

export async function initializeAI(onProgress?: (p: number) => void): Promise<void> {
  console.log('[StudySketch] initializeAI called');
  try {
    // Log every step so we can see exactly where it fails
    console.log('[StudySketch] Step 1: importing RunAnywhere...');
    const { RunAnywhere } = await import('@runanywhere/web');
    
    console.log('[StudySketch] Step 2: calling RunAnywhere.initialize()...');
    console.log('[StudySketch] RunAnywhere object keys:', Object.keys(RunAnywhere));
    
    await RunAnywhere.initialize();
    console.log('[StudySketch] RunAnywhere initialized successfully');
    
    console.log('[StudySketch] Step 3: importing LlamaCPP...');
    const { LlamaCPP } = await import('@runanywhere/web-llamacpp');
    console.log('[StudySketch] LlamaCPP object keys:', Object.keys(LlamaCPP));
    
    console.log('[StudySketch] Step 4: registering LlamaCPP backend...');
    await LlamaCPP.register();
    console.log('[StudySketch] LlamaCPP registered successfully');
    
    console.log('[StudySketch] Step 5: importing TextGeneration...');
    const { TextGeneration } = await import('@runanywhere/web-llamacpp');
    console.log('[StudySketch] TextGeneration object keys:', Object.keys(TextGeneration));
    console.log('[StudySketch] TextGeneration type:', typeof TextGeneration);
    
    console.log('[StudySketch] Step 6: checking TextGeneration methods...');
    console.log('[StudySketch] TextGeneration methods:', Object.getOwnPropertyNames(TextGeneration));
    console.log('[StudySketch] TextGeneration prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(TextGeneration)));
    
    console.log('[StudySketch] Step 7: checking what RunAnywhere methods we can use...');
    console.log('[StudySketch] RunAnywhere methods:', Object.getOwnPropertyNames(RunAnywhere));
    console.log('[StudySketch] RunAnywhere prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(RunAnywhere)));
    
    // Try to use TextGeneration directly without model loading first
    // Maybe the SDK handles model loading internally
    console.log('[StudySketch] Step 8: trying TextGeneration without explicit model loading...');
    
    try {
      // Try a simple generation to see what happens
      const testResult = await TextGeneration.generate('Hello', { maxTokens: 10 });
      console.log('[StudySketch] Test generation successful:', testResult);
      ready = true;
      console.log('[StudySketch] AI ready! (TextGeneration works without explicit model loading)');
    } catch (testErr) {
      console.log('[StudySketch] Test generation failed:', (testErr as any)?.message);
      
      // If that fails, try to use RunAnywhere's model management
      console.log('[StudySketch] Step 9: trying RunAnywhere model management...');
      
      try {
        // Check if we can register models
        console.log('[StudySketch] Available models before:', RunAnywhere.availableModels());
        
        // Try to download/load a model using the basic approach
        await RunAnywhere.downloadModel('tinyllama-1.1b');
        console.log('[StudySketch] Model download completed');
        
        await RunAnywhere.loadModel('tinyllama-1.1b');
        console.log('[StudySketch] Model loaded successfully!');
        
        ready = true;
        console.log('[StudySketch] AI ready!');
      } catch (modelErr) {
        console.log('[StudySketch] Model loading also failed:', (modelErr as any)?.message);
        throw new Error('Both direct generation and model loading failed');
      }
    }
    
    if (onProgress) {
      onProgress(100);
    }
  } catch (err) {
    console.error('[StudySketch] FULL ERROR:', err);
    console.error('[StudySketch] Error message:', (err as any)?.message);
    console.error('[StudySketch] Error stack:', (err as any)?.stack);
    ready = false;
  }
}

async function runPrompt(prompt: string): Promise<string> {
  if (!ready) {
    throw new Error('AI not ready. Please wait for model to load.');
  }
  
  console.log('[StudySketch] runPrompt called, ready:', ready);
  
  // Try different generation methods
  try {
    console.log('[StudySketch] Step 1: importing TextGeneration...');
    const { TextGeneration } = await import('@runanywhere/web-llamacpp');
    
    console.log('[StudySketch] Step 2: attempting TextGeneration.generate()...');
    const result = await TextGeneration.generate(prompt, {
      maxTokens: 1024,
    });
    
    console.log('[StudySketch] Generation successful, result keys:', Object.keys(result));
    return result.text;
  } catch (err) {
    console.error('[StudySketch] Generation error:', err);
    throw err;
  }
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
  const truncatedText = input.substring(0, 3000);
  if (onProgress) onProgress('Generating diagram locally...');
  const diagramPrompt = `Analyze the following text and generate a Mermaid.js diagram.
Return ONLY valid Mermaid syntax, no explanation, no markdown fences, no backticks.
Use mindmap or flowchart TD format. Max 20 nodes.
Text: ${truncatedText}`;

  const rawDiagram = await runPrompt(diagramPrompt);
  
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
  const flashcardsPrompt = `Generate exactly 8 question-answer flashcard pairs from this text.
Return ONLY a valid JSON array, no markdown, no explanation, no extra text:
[{"question": "...", "answer": "..."}]
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

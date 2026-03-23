import { DiagramType, GeneratedContent, FileData, Message, Flashcard, QuizQuestion } from '../types';
import { RunAnywhere, SDKEnvironment, ModelCategory, LLMFramework, ModelManager, ModelStatus } from '@runanywhere/web';
import { LlamaCPP, TextGeneration } from '@runanywhere/web-llamacpp';

let ready = false;
let progress = 0;
const MODEL_ID = 'tinyllama-1.1b';
const MODEL_URL = 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';

export async function initializeAI(onProgress?: (p: number) => void): Promise<void> {
  console.log('[StudySketch] initializeAI called');
  try {
    await RunAnywhere.initialize({
      apiKey: 'sk-Ik3KHBQXKTxEhklUKLXEyg',
      environment: SDKEnvironment.Development,
    });
    console.log('[StudySketch] RunAnywhere initialized');

    await LlamaCPP.register();
    console.log('[StudySketch] LlamaCPP registered');
    onProgress?.(5);

    RunAnywhere.registerModels([{
      id: MODEL_ID,
      name: 'TinyLlama 1.1B',
      url: MODEL_URL,
      framework: LLMFramework.LlamaCpp,
      modality: 'LLM' as any,
    }]);

    // CHECK IF ALREADY DOWNLOADED — skip download if cached
    const runAnywhereModels = RunAnywhere.availableModels();
    const managedModels = ModelManager.getModels();
    
    console.log('[StudySketch] RunAnywhere models:', runAnywhereModels.length);
    console.log('[StudySketch] ModelManager models:', managedModels.length);
    
    const model = runAnywhereModels.find((m: any) => m.id === MODEL_ID) || 
                  managedModels.find((m: any) => m.id === MODEL_ID);
    
    const status = model?.status;
    const statusStr = status?.toString() || '';
    const alreadyDownloaded = model && (
      statusStr.includes('downloaded') ||
      statusStr.includes('loaded') ||
      statusStr.includes('Downloaded') ||
      statusStr.includes('Loaded') ||
      (model as any).isDownloaded ||
      (model as any).isLoaded ||
      ((model as any).downloadProgress !== undefined && (model as any).downloadProgress >= 1.0)
    );
    
    console.log('[StudySketch] Model found:', !!model, 'status:', status, 'already downloaded:', alreadyDownloaded);

    if (!alreadyDownloaded) {
      console.log('[StudySketch] Downloading model (first time)...');
      
      const unsub = ModelManager.onChange((models: any[]) => {
        const m = models.find((x: any) => x.id === MODEL_ID);
        if (m?.downloadProgress) {
          const raw = m.downloadProgress;
          const fraction = typeof raw === 'number' ? raw : (raw?.progress ?? raw?.fraction ?? 0);
          const p = Math.round(fraction * 80) + 10;
          progress = p;
          onProgress?.(p);
          console.log('[StudySketch] Download:', p + '%');
        }
      });

      await RunAnywhere.downloadModel(MODEL_ID);
      unsub();
      console.log('[StudySketch] Download complete');
    } else {
      console.log('[StudySketch] Model already cached, skipping download!');
    }

    onProgress?.(90);
    const success = await RunAnywhere.loadModel(MODEL_ID);
    console.log('[StudySketch] loadModel:', success, 'isModelLoaded:', TextGeneration.isModelLoaded);

    if (!TextGeneration.isModelLoaded) throw new Error('Model not loaded');

    ready = true;
    console.log('[StudySketch] AI READY!');
    onProgress?.(100);
  } catch (err) {
    console.error('[StudySketch] Init failed:', (err as any)?.message ?? err);
    ready = false;
  }
}

async function generate(prompt: string, maxTokens = 250): Promise<string> {
  if (!ready) throw new Error('AI not ready');
  // Use generate() directly — generateStream tokens property is unreliable
  const result = await TextGeneration.generate(prompt, { maxTokens });
  return result.text?.trim() ?? '';
}

export function isAIReady(): boolean { return ready; }
export function getLoadingProgress(): number { return progress; }

export const generateDiagramAndSummary = async (
  input: string,
  _file: FileData | null,
  type: DiagramType,
  onProgress?: (message: string) => void
): Promise<GeneratedContent> => {
  const text = input.substring(0, 800);
  
  if (onProgress) onProgress('Generating study materials...');

  // SINGLE PROMPT — generate everything at once to reduce lag
  const combinedPrompt = `Generate a complete study compilation from this text.

Text: ${text}

Return ONLY this exact JSON structure, no other text:
{
  "diagram": "mindmap\\n  root((topic))\\n    Point1\\n      Detail1\\n    Point2\\n      Detail2",
  "oneLiner": "One sentence summary",
  "paragraph": "Three sentence summary", 
  "keyPoints": "- Point 1\\n- Point 2\\n- Point 3",
  "flashcards": [
    {"question": "Q1", "answer": "A1"},
    {"question": "Q2", "answer": "A2"},
    {"question": "Q3", "answer": "A3"},
    {"question": "Q4", "answer": "A4"},
    {"question": "Q5", "answer": "A5"}
  ],
  "quiz": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    }
  ]
}

CRITICAL REQUIREMENTS:
- Diagram: MUST start with EXACTLY "mindmap" (no quotes, no extra text)
- Use simple indentation with 2 spaces per level
- NO backticks, NO explanations, NO extra text
- Keep responses concise and focused
- Use ONLY the JSON structure above`;

  const result = await generate(combinedPrompt, 500);
  
  // Parse JSON response
  let parsed: any = {};
  try {
    parsed = JSON.parse(result);
  } catch (e) {
    console.log('[StudySketch] JSON parse failed, using fallback:', e);
    // Fallback responses
    parsed = {
      diagram: `mindmap\n  root((${text.split(' ').slice(0, 3).join(' ')}))\n    Key Points\n      Details\n    Summary\n      Overview`,
      oneLiner: text.split('.')[0] + '.',
      paragraph: text.substring(0, 200) + '...',
      keyPoints: '- ' + text.split('.').slice(0, 3).join('.\n- ') + '.',
      flashcards: [
        { question: 'What is the main topic?', answer: text.split(' ').slice(0, 5).join(' ') },
        { question: 'Key concept?', answer: 'Important information from text' }
      ],
      quiz: [{
        question: 'What is this about?',
        options: ['Topic A', 'Topic B', 'Topic C', 'Topic D'],
        correctIndex: 0
      }]
    };
  }

  // Format diagram with strict validation
  let diagram = parsed.diagram || '';
  
  // Validate diagram starts with mindmap
  if (!diagram.trim().startsWith('mindmap')) {
    console.log('[StudySketch] Invalid diagram format, using fallback');
    diagram = `mindmap\n  root((${text.split(' ').slice(0, 3).join(' ')}))\n    Key Points\n      Important Details\n    Summary\n      Main Ideas`;
  }
  
  diagram = diagram.trim()
    .replace(/```mermaid\n?/g, '').replace(/```\n?/g, '')
    .replace(/["']/g, '')
    .replace(/^\s*style\s+.+$/gm, '').replace(/^\s*classDef\s+.+$/gm, '');

  // Format flashcards
  const flashcards: Flashcard[] = (parsed.flashcards || []).map((fc: any, i: number) => ({
    id: `fc-${Date.now()}-${i}`,
    front: fc.question || `Question ${i + 1}`,
    back: fc.answer || `Answer ${i + 1}`,
  }));

  // Format quiz
  const quiz: QuizQuestion[] = (parsed.quiz || []).map((q: any) => ({
    question: q.question || 'Question',
    options: q.options || ['A', 'B', 'C', 'D'],
    correctIndex: q.correctIndex || 0,
    explanation: q.explanation || '',
  }));

  return {
    summary: {
      oneLiner: parsed.oneLiner || 'Summary unavailable',
      paragraph: parsed.paragraph || 'Paragraph unavailable',
      keyPoints: parsed.keyPoints || '- Key points unavailable'
    },
    diagramCode: diagram,
    diagramType: type,
    flashcards,
  };
};

export const askQuestionAboutContent = async (
  _history: Message[],
  question: string,
  contextText: string | null,
  _file: FileData | null
): Promise<string> => {
  return await generate(
    `Answer this question based on the provided text. Be concise and direct.

Text: ${contextText?.substring(0, 1000)}
Question: ${question}`,
    200
  );
};

export const generateQuiz = async (text: string): Promise<QuizQuestion[]> => {
  const result = await generate(
    `Generate 3 multiple choice questions from this text. Return ONLY JSON array.

Text: ${text.substring(0, 800)}

Format:
[
  {
    "question": "Question here",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0
  }
]`,
    300
  );

  try {
    return JSON.parse(result);
  } catch {
    return [{
      question: 'What is the main topic?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
      explanation: '',
    }];
  }
};

export const checkOllamaStatus = async (): Promise<boolean> => ready;
export const getAvailableModels = async (): Promise<string[]> => [MODEL_ID];
export const activeModel = MODEL_ID;
export const setActiveModel = (_: string): void => {};

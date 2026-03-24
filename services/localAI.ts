import { DiagramType, GeneratedContent, FileData, Message, Flashcard, QuizQuestion } from '../types';
import { RunAnywhere, SDKEnvironment, ModelCategory, LLMFramework, ModelManager, ModelStatus } from '@runanywhere/web';
import { LlamaCPP, TextGeneration } from '@runanywhere/web-llamacpp';

let ready = false;
let progress = 0;
const MODEL_ID = 'tinyllama-1.1b';
const MODEL_URL = 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';

let worker: Worker | null = null;
let initPromise: Promise<void> | null = null;
let msgIdCounter = 0;

export async function initializeAI(onProgress?: (p: number) => void): Promise<void> {
  if (ready) {
    onProgress?.(100);
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = new Promise((resolve, reject) => {
    try {
      worker = new Worker(new URL('../src/aiWorker.ts', import.meta.url), {
        type: 'module'
      });

      worker.onmessage = (e) => {
        const { type, payload } = e.data;
        if (type === 'PROGRESS') {
          progress = payload;
          onProgress?.(payload);
        } else if (type === 'INIT_DONE') {
          ready = true;
          onProgress?.(100);
          resolve();
        } else if (type === 'ERROR') {
          console.error('[StudySketch] Worker Init Error:', payload.message);
          reject(new Error(payload.message));
        }
      };

      worker.postMessage({ type: 'INIT' });
    } catch (err) {
      console.error('[StudySketch] Init failed:', err);
      reject(err);
    }
  });

  return initPromise;
}

async function ensureModelReady(): Promise<void> {
  if (!ready) {
    await initializeAI();
  }
}

async function runPrompt(prompt: string): Promise<string> {
  await ensureModelReady();
  
  if (!worker) throw new Error("Worker not initialized");

  return new Promise((resolve, reject) => {
    const id = ++msgIdCounter;
    
    const handler = (e: MessageEvent) => {
      const { type, payload, id: msgId } = e.data;
      if (msgId === id) {
        if (type === 'GENERATE_RESULT') {
          worker?.removeEventListener('message', handler);
          resolve(payload.text);
        } else if (type === 'ERROR') {
          worker?.removeEventListener('message', handler);
          reject(new Error(payload.message));
        }
      }
    };
    
    worker.addEventListener('message', handler);
    worker.postMessage({
      type: 'GENERATE',
      id,
      payload: {
        prompt,
        options: {
          maxTokens: 512,
          temperature: 0.7,
          systemPrompt: 'You are a helpful study assistant. Be concise.'
        }
      }
    });
  });
}

async function runPromptShort(prompt: string): Promise<string> {
  await ensureModelReady();
  
  if (!worker) throw new Error("Worker not initialized");

  return new Promise((resolve, reject) => {
    const id = ++msgIdCounter;
    
    const handler = (e: MessageEvent) => {
      const { type, payload, id: msgId } = e.data;
      if (msgId === id) {
        if (type === 'GENERATE_RESULT') {
          worker?.removeEventListener('message', handler);
          resolve(payload.text);
        } else if (type === 'ERROR') {
          worker?.removeEventListener('message', handler);
          reject(new Error(payload.message));
        }
      }
    };
    
    worker.addEventListener('message', handler);
    worker.postMessage({
      type: 'GENERATE',
      id,
      payload: {
        prompt,
        options: {
          maxTokens: 256,
          temperature: 0.3,
          systemPrompt: 'You are a diagram generator. Return only valid Mermaid syntax.'
        }
      }
    });
  });
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

  const result = await runPrompt(combinedPrompt);
  
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
  return await runPrompt(
    `Answer this question based on the provided text. Be concise and direct.

Text: ${contextText?.substring(0, 1000)}
Question: ${question}`
  );
};

export const generateQuiz = async (text: string): Promise<QuizQuestion[]> => {
  const truncatedText = text.substring(0, 1000);
  const prompt = `Generate 6 multiple choice questions from this text.
Return ONLY this JSON array, no extra text:
[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correctIndex":0,"explanation":"..."}]
Text: ${truncatedText.substring(0, 1000)}`;

  await ensureModelReady();
  const { TextGeneration } = await import('@runanywhere/web-llamacpp');
   
  const quizTimeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Quiz generation timed out')), 180000)
  );
  const quizGenerate = TextGeneration.generate(prompt, {
    maxTokens: 1024,
    temperature: 0.5,
    systemPrompt: 'You are a quiz generator. Return only valid JSON arrays.'
  });
  const rawQuiz = (await Promise.race([quizGenerate, quizTimeout])).text;

  try {
    return JSON.parse(rawQuiz);
  } catch {
    return [{
      question: 'What is the main topic?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
      explanation: '',
    }];
  }
};


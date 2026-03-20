import { DiagramType, GeneratedContent, FileData, Message, Flashcard, QuizQuestion } from '../types';

const OLLAMA_BASE_URL = 'http://localhost:11434';
let activeModel = localStorage.getItem('studysketch_active_model') || 'llama3.2';

export const setActiveModel = (model: string): void => {
  activeModel = model;
  localStorage.setItem('studysketch_active_model', model);
};

export { activeModel };

export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.models ? data.models.map((m: any) => m.name) : [];
  } catch {
    return [];
  }
}

/**
 * Check if Ollama is running and reachable.
 */
export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Send a prompt to Ollama and return the response text.
 */
async function runPrompt(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: activeModel,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.response || '';
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error(
        'Cannot connect to Ollama. Make sure it is running:\n' +
        '  1. ollama serve\n' +
        '  2. ollama pull llama3.2'
      );
    }
    throw error;
  }
}

/**
 * Generate a Mermaid diagram from input text using Ollama.
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
  const cleanDiagram = rawDiagram.replace(/```mermaid|```/g, '').trim();

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
 * Ask a question about uploaded content using Ollama.
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
 * Generate a 6-question multiple choice quiz from uploaded content using Ollama.
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

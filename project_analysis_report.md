# Project Analysis Report: StudySketch AI

## 📌 Overview
StudySketch AI is a privacy-first, 100% offline study assistant designed to transform various document formats (PDF, DOCX, Images, Text) into structured learning materials such as mind maps, summaries, flashcards, and quizzes. It leverages local LLM inference directly in the browser via the RunAnywhere SDK and TinyLlama.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite |
| **Styling** | Tailwind CSS 4, Framer Motion (Animations) |
| **Local AI Engine** | RunAnywhere SDK (LlamaCPP/ONNX Backend) |
| **Primary Model** | TinyLlama 1.1B (GGUF via Hugging Face) |
| **OCR & Extraction** | Tesseract.js (Images), Mammoth (DOCX), PDF.js (PDF) |
| **Data Visualization** | Mermaid.js (Mind Maps) |
| **Icons & UI** | Lucide React, react-zoom-pan-pinch |

---

## 🏗️ Core Architecture & Services

### 1. [localAI.ts](file:///c:/Users/Lenovo/StudySketch-AI/services/localAI.ts) (The Brain)
- **Initialization**: Automatically pulls the `tinyllama-1.1b` model (approx. 660MB) on first run and caches it in the browser's OPFS.
- **Unified Prompting**: Uses a single structured JSON prompt to generate summaries, diagrams, and cards simultaneously, significantly reducing inference latency.
- **Robustness**: Implements fallback logic for JSON parsing and diagram formatting to ensure the UI remains functional even if the LLM output is imperfect.

### 2. [fileProcessor.ts](file:///c:/Users/Lenovo/StudySketch-AI/services/fileProcessor.ts) (Data Extraction)
- **Multi-Format Support**: Handles conversion of `.pdf`, `.docx`, `.png`, `.jpg`, and [.txt](file:///c:/Users/Lenovo/StudySketch-AI/test_sample.txt) directly in the browser.
- **Web Workers**: Uses PDF.js workers to ensure smooth text extraction without blocking the main UI thread.

### 3. [App.tsx](file:///c:/Users/Lenovo/StudySketch-AI/App.tsx) & Components
- **State Management**: React-based state for handling uploaded files and generated content.
- **Interactive UI**: Custom components for Mermaid diagram rendering with zoom/pan capabilities and interactive flashcard flipping.

---

## 🚀 Recent Updates (Fetched from GitHub)

Based on the latest commit (`bd5592c`):
- **CORS & Migration**: Optimized the `RunAnywhere` SDK integration to handle Cross-Origin Resource Sharing (CORS) better, ensuring smoother model downloads from Hugging Face.
- **SDK Optimization**: Refined model registration and loading logic to prevent redundant downloads by checking browser cache status.
- **Status Reporting**: Improved initialization progress tracking for a better user experience during the first-time setup.

---

## 🔍 Key Observations
- **Offline Reliability**: The project is heavily optimized for zero-latency local execution once the model is downloaded.
- **Security**: Zero data leaves the browser, making it ideal for sensitive or private study materials.
- **Developer Experience**: Uses modern tools (Vite, Tailwind 4) and a clean service-based architecture for AI logic.

> [!NOTE]
> Ensure Ollama is running if you wish to use it as a fallback, although the current implementation prioritizes the internal `RunAnywhere` WASM execution.

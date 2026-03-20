# StudySketch AI 🧠✨
**Turn notes into mind maps, flashcards, and summaries — 100% offline.**

StudySketch AI is a powerful, privacy-first study companion that uses local LLMs to help you understand your learning material better. No data leaves your device.

---

## 🌟 Key Features

- **📂 Multi-Format Upload**: Support for PDF, DOCX, TXT, Markdown, and images (PNG/JPG).
- **🗺️ Mind Maps**: Automatically generate interactive Mermaid.js diagrams from your notes.
- **📝 Intelligent Summaries**: Get summaries in three formats:
  - **One-liner**: For quick context.
  - **Paragraph**: For a detailed overview.
  - **Key Points**: For structured learning.
- **🗂️ Smart Flashcards**: AI-generated flashcards with support for Anki CSV export.
- **💬 AI Chat**: Context-aware Q&A based on your uploaded documents.
- **🎮 Quiz Mode**: Test your knowledge with AI-generated multiple-choice questions.
- **🎙️ Voice Support**: Transcribe audio and interact via voice commands.
- **🔒 Fully Offline**: Powered by Ollama and Transformers.js — zero internet required after initial setup.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Ollama**: [Download Ollama](https://ollama.com/download)
- **Models**:
  ```bash
  ollama pull llama3.2
  ollama serve
  ```

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/nmnroy/study-sketch.git

# Navigate to the project
cd study-sketch

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion
- **AI Engine**: [Ollama](https://ollama.com/) (Local Inference)
- **ML Utilities**: [Transformers.js](https://huggingface.co/docs/transformers.js/) (Local browser-based ML)
- **Visuals**: [Mermaid.js](https://mermaid.js.org/) (Diagramming)
- **Text Extraction**: Tesseract.js (OCR), Mammoth (DOCX), PDF.js (PDF)

---

## 📂 Project Structure

- `components/`: UI components (FileUpload, Flashcards, MermaidDiagram, etc.)
- `services/`: AI and business logic (localAI.ts, fileProcessor.ts)
- `App.tsx`: Main application entry and layout
- `types.ts`: Global type definitions

---

## 📄 License
MIT License. See `LICENSE` for details.

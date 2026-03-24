# StudySketch AI 🧠✨
**Turn notes into mind maps, flashcards, quizzes, and summaries — 100% offline.**

StudySketch AI is a privacy-first study companion powered by local LLMs. It transforms any document or audio into interactive study material — no cloud, no data leaks, no internet required after setup.

---

## 🌟 Features

| Feature | Details |
|---|---|
| 📂 **Multi-Format Upload** | PDF, DOCX, TXT, Markdown, PNG/JPG (OCR) |
| 🗺️ **Mind Maps** | Auto-generated interactive Mermaid.js diagrams |
| 📝 **Intelligent Summaries** | One-liner, paragraph, or key-points format |
| 🗂️ **Smart Flashcards** | AI-generated cards with Anki CSV export |
| 🔁 **Spaced Repetition** | SM-2 algorithm tracks card difficulty & review schedule |
| 🎮 **Quiz Mode** | Multiple-choice questions generated from your content |
| 💬 **AI Chat** | Context-aware Q&A grounded in your uploaded documents |
| 🎙️ **Voice Support** | Whisper-powered transcription + voice commands |
| 🕓 **Session History** | Last 10 study sessions saved locally; resume any time |
| 🔀 **Model Switcher** | Swap between Ollama models for speed vs. quality |
| 🔒 **Fully Offline** | Powered by Transformers.js & RunAnywhere SDK |

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/nmnroy/study-sketch.git
cd study-sketch

# Install dependencies
npm install

# Start development server
npm run dev
```

> **Note:** The local AI model is downloaded on first run. Subsequent reloads skip initialization thanks to browser session guards.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion
- **AI Engine**: RunAnywhere SDK (local LLM inference)
- **Speech**: Transformers.js — Whisper (in-browser, offline)
- **Diagrams**: Mermaid.js
- **Text Extraction**: PDF.js · Mammoth (DOCX) · Tesseract.js (OCR)
- **Storage**: localStorage (sessions, spaced-repetition records)

---

## 📂 Project Structure

```
studysketch-ai/
├── components/
│   ├── AudioRecorder.tsx     # Voice recording & Whisper transcription
│   ├── ChatPanel.tsx         # Context-aware AI chat
│   ├── FileUpload.tsx        # Multi-format file ingestion
│   ├── Flashcards.tsx        # Flashcard viewer + Anki export
│   ├── MermaidDiagram.tsx    # Interactive mind map renderer
│   ├── ModelSwitcher.tsx     # Ollama model selector
│   ├── QuizMode.tsx          # Multiple-choice quiz engine
│   └── SessionHistory.tsx    # Past sessions browser
├── services/
│   ├── fileProcessor.ts      # Text extraction pipeline
│   ├── localAI.ts            # LLM orchestration & session guards
│   ├── sessionHistory.ts     # localStorage session CRUD
│   ├── spacedRepetition.ts   # SM-2 spaced repetition engine
│   └── whisper.ts            # Whisper inference wrapper
├── App.tsx                   # Root layout & routing logic
├── types.ts                  # Global TypeScript types
└── index.html
```

---

## 🔁 Spaced Repetition

Flashcard reviews use a custom **SM-2** algorithm:
- Cards rated **Easy / Medium / Hard** after each review.
- Review intervals grow automatically for well-known cards.
- Due cards surface on the correct day — no extra effort needed.
- All data is stored in `localStorage` — fully private.

---

## 🕓 Session History

Every completed study session (diagram + summary + flashcards) is auto-saved. You can:
- Browse your last **10 sessions** from the sidebar.
- Re-open any session to continue studying.
- Delete sessions you no longer need.

---

## 📄 License
MIT License. See [`LICENSE`](LICENSE) for details.

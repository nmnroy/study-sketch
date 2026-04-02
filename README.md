# StudySketch AI 🧠✨

**The Edge-AI Educational Engine: Turn notes into mind maps, flashcards, quizzes, and summaries — 100% offline.**

StudySketch AI is a privacy-first, localized study companion powered by local LLMs. It instantly transforms passive study materials—like lecture recordings, PDFs, handwritten notes, and documents—into an interactive, multimodal learning ecosystem. 

By leveraging modern inference engines and the sheer computing power of local devices, StudySketch AI brings the full capabilities of an AI tutor directly into the user's browser. **Zero cloud, zero data harvesting, and zero latency.**

---

## 🌟 Groundbreaking Features

| Feature | Details |
|---|---|
| 📂 **Omni-Format Ingestion** | Seamlessly ingests PDF, DOCX, TXT, Markdown, and PNG/JPG (In-browser OCR). |
| 🗺️ **Generative Mind Maps** | Autonomously synthesizes complex texts into interactive Mermaid.js diagrams to map conceptual relationships. |
| 📝 **Intelligent Summaries** | Zero-latency context extraction into one-liner, paragraph, or key-points format. |
| 🗂️ **Automated Active Recall** | Instantly generates intelligent flashcards with Anki CSV export capabilities. |
| 🔁 **Algorithmic Spaced Repetition** | Local SM-2 algorithm tracks performance and adaptively schedules flashcard reviews to optimize memory retention. |
| 🎮 **Dynamic Quiz Mode** | Automated multiple-choice test generation grounded strictly in your uploaded content. |
| 💬 **Contextual Edge-Chat** | Converse with your offline lecture materials securely using local generative AI. |
| 🎙️ **Voice Integration** | On-device Whisper-powered speech-to-text transcription and voice commands. |
| 🕓 **Session History** | Localized knowledge-base automatically saves your past 10 sessions for offline resumption. |
| 🔀 **Dynamic Model Switcher** | Swap between Ollama models on the fly to balance inference speed vs. reasoning quality. |
| 🔒 **"Zero-Trust" Architecture** | Powered entirely locally by Transformers.js & RunAnywhere SDK. Your data never leaves your machine. |

---

## 🚀 Getting Started

Experience decentralised learning at zero marginal infrastructure cost.

```bash
# Clone the repository
git clone https://github.com/nmnroy/study-sketch.git
cd study-sketch

# Install dependencies
npm install

# Start development server
npm run dev
```

> **Note:** The local AI model is downloaded natively on your first run. Subsequent reloads skip network initialization entirely thanks to browser session guards, giving you instant, offline boot times.

---

## 🛠️ Edge-Native Technology Stack

- **Frontend Ecosystem**: React 19, Vite, Tailwind CSS, Framer Motion
- **Edge Inference Engine**: RunAnywhere SDK (Local LLM orchestration & session guards)
- **Speech-to-Text**: Transformers.js — Whisper (In-browser, offline transcription)
- **Visual Synthesis**: Mermaid.js for real-time relational mapping
- **Data Ingestion**: PDF.js · Mammoth (DOCX) · Tesseract.js (WebAssembly OCR)
- **Secure Persistence**: Browser `localStorage` (Session tracking & algorithmic spacing)

---

## 📂 Project Architecture

```
studysketch-ai/
├── components/
│   ├── AudioRecorder.tsx     # Voice ingestion & Edge-Whisper pipeline
│   ├── ChatPanel.tsx         # Context-aware offline AI chat interface
│   ├── FileUpload.tsx        # Multi-modal file ingestion & parsing
│   ├── Flashcards.tsx        # Active recall viewer + Anki integration
│   ├── MermaidDiagram.tsx    # Interactive mind map rendering engine
│   ├── ModelSwitcher.tsx     # Local AI model selector
│   ├── QuizMode.tsx          # Dynamic multiple-choice testing
│   └── SessionHistory.tsx    # localized state browser
├── services/
│   ├── fileProcessor.ts      # Unstructured data extraction pipeline
│   ├── localAI.ts            # LLM orchestration & memory management
│   ├── sessionHistory.ts     # LocalStorage state management CRUD
│   ├── spacedRepetition.ts   # On-device SM-2 tracking algorithm
│   └── whisper.ts            # Local Transformers.js voice wrapper
├── App.tsx                   # Root layout & routing logic
├── types.ts                  # Global TypeScript type definitions
└── index.html
```

---

## 🔁 Algorithmic Spaced Repetition

Active recall reviews utilize a robust **SM-2** algorithm embedded in the browser:
- Cards are rated **Easy / Medium / Hard** based on cognitive load.
- Review intervals automatically scale iteratively for cemented concepts.
- Due cards surface precisely when forgetting curves predict memory decay.
- **100% Data Sovereignty:** All diagnostic data is stored securely in `localStorage`.

---

## 🕓 Knowledge Persistence

Every completed study synthesis (mind maps + summaries + active recall sets) is auto-saved natively:
- Browse your localized history of the last **10 sessions** from the dashboard sidebar.
- Re-hydrate any session instantly to resume studying off-the-grid.
- Delete sessions securely with zero cloud-sync residue.

---

## 📄 License
MIT License. See [`LICENSE`](LICENSE) for details.

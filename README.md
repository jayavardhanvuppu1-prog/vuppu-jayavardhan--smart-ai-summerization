# Smart Study AI

An AI-powered study assistant built with React, Tailwind CSS, Express, and the Google Gemini API (`@google/genai`). It turns PDF and TXT study notes (or pasted text) into plain-English summaries, multiple-choice quizzes (5, 10, or 20 questions), and interactive flashcards.

## Features

- **Study Notes & Upload**: Drag-and-drop `.pdf` and `.txt` upload, manual paste/edit editor, and built-in sample notes.
- **AI Notes Summarizer**: Generates structured overviews, important takeaways, simple English explanations for difficult topics, and key terms.
- **AI Quiz Generator & Interactive Quiz**: Creates 5, 10, or 20 four-option multiple-choice questions, steps through one question at a time, scores your submission, and shows correct/incorrect answers with explanations.
- **Flashcard Studio**: Automatically builds Q&A flashcards with memory hints, 3D flip animations, shuffle, previous/next navigation, and mastery tracking.
- **Study Dashboard**: Tracks total quizzes completed, latest quiz score, average accuracy, and overall study progress.

## Prerequisites

- Node.js 22+
- A Google Gemini API key (`GEMINI_API_KEY`)

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables by creating a `.env` file (see `.env.example`):
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   ```

3. Start the development server (runs Express API + Vite on port 3000):
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

## Building & Deploying

1. Build the frontend bundle:
   ```bash
   npm run build
   ```

2. Start the production server (serves `dist/` and all `/api/*` Gemini routes):
   ```bash
   NODE_ENV=production npm start
   ```

Set `GEMINI_API_KEY` as an environment secret in your hosting platform (e.g., Cloud Run, Render, Railway, or AI Studio Secrets) so the API key stays strictly on the server.

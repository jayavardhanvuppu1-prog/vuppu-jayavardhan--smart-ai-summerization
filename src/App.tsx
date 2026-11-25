import { useEffect, useState } from "react";
import { FileUp, Menu } from "lucide-react";
import { DashboardView } from "./components/DashboardView";
import { FlashcardsView } from "./components/FlashcardsView";
import { NotesView } from "./components/NotesView";
import { QuizView } from "./components/QuizView";
import { Sidebar } from "./components/Sidebar";
import { SummaryView } from "./components/SummaryView";
import { SAMPLE_NOTES } from "./data/sampleNotes";
import type {
  ActiveTab,
  FlashcardDeck,
  GeneratedQuiz,
  QuizAttempt,
  StudySummary,
} from "./types/study";

const STORAGE_KEY = "smart_study_ai_state_v1";

interface PersistedState {
  notesTitle: string;
  notesText: string;
  summary: StudySummary | null;
  quiz: GeneratedQuiz | null;
  quizHistory: QuizAttempt[];
  flashcardDeck: FlashcardDeck | null;
}

const TAB_LABELS: Record<ActiveTab, string> = {
  dashboard: "Study Dashboard",
  notes: "Study Notes",
  summary: "AI Summarizer",
  quiz: "Interactive Quiz",
  flashcards: "Flashcards",
};

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as PersistedState;
    }
  } catch {
    // Ignore storage read errors
  }
  return {
    notesTitle: "",
    notesText: "",
    summary: null,
    quiz: null,
    quizHistory: [],
    flashcardDeck: null,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [state, setState] = useState<PersistedState>(() => loadInitialState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const notesWordCount = state.notesText.trim()
    ? state.notesText.trim().split(/\s+/).length
    : 0;

  function handleChangeNotes(title: string, text: string) {
    setState((prev) => ({
      ...prev,
      notesTitle: title,
      notesText: text,
    }));
  }

  function handleClearNotes() {
    setState((prev) => ({
      ...prev,
      notesTitle: "",
      notesText: "",
      summary: null,
      quiz: null,
      flashcardDeck: null,
    }));
  }

  function handleLoadQuickSample() {
    const sample = SAMPLE_NOTES[0];
    setState((prev) => ({
      ...prev,
      notesTitle: sample.title,
      notesText: sample.content,
    }));
    setActiveTab("notes");
  }

  function handleSummaryGenerated(summary: StudySummary) {
    setState((prev) => ({ ...prev, summary }));
  }

  function handleQuizGenerated(quiz: GeneratedQuiz) {
    setState((prev) => ({ ...prev, quiz }));
  }

  function handleQuizCompleted(attempt: QuizAttempt) {
    setState((prev) => ({
      ...prev,
      quizHistory: [attempt, ...prev.quizHistory].slice(0, 30),
    }));
  }

  function handleDeckGenerated(flashcardDeck: FlashcardDeck) {
    setState((prev) => ({ ...prev, flashcardDeck }));
  }

  function handleToggleMastered(cardId: string) {
    setState((prev) => {
      if (!prev.flashcardDeck) return prev;
      const exists = prev.flashcardDeck.masteredIds.includes(cardId);
      const nextMastered = exists
        ? prev.flashcardDeck.masteredIds.filter((id) => id !== cardId)
        : [...prev.flashcardDeck.masteredIds, cardId];
      return {
        ...prev,
        flashcardDeck: {
          ...prev.flashcardDeck,
          masteredIds: nextMastered,
        },
      };
    });
  }

  function handleShuffleDeck() {
    setState((prev) => {
      if (!prev.flashcardDeck) return prev;
      const shuffled = [...prev.flashcardDeck.cards];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return {
        ...prev,
        flashcardDeck: {
          ...prev.flashcardDeck,
          cards: shuffled,
        },
      };
    });
  }

  return (
    <div className="flex min-h-screen bg-[#F5F9FF] text-slate-900">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        notesWordCount={notesWordCount}
        notesTitle={state.notesTitle}
        quizCount={state.quizHistory.length}
        flashcardCount={state.flashcardDeck?.cards.length ?? 0}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Workspace Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-sky-100 bg-white/95 px-4 backdrop-blur-xs sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-sky-50 hover:text-slate-900 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden text-slate-400 sm:inline">Smart Study AI</span>
              <span className="hidden text-slate-300 sm:inline" aria-hidden="true">/</span>
              <span className="font-display font-semibold text-slate-900 truncate">
                {TAB_LABELS[activeTab]}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileUp className="h-3.5 w-3.5" />
            <span>Upload Notes</span>
          </button>
        </header>

        {/* Main Viewport */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {activeTab === "dashboard" && (
            <DashboardView
              notesTitle={state.notesTitle}
              notesWordCount={notesWordCount}
              summary={state.summary}
              quizHistory={state.quizHistory}
              flashcardDeck={state.flashcardDeck}
              onNavigate={setActiveTab}
              onLoadQuickSample={handleLoadQuickSample}
            />
          )}

          {activeTab === "notes" && (
            <NotesView
              notesTitle={state.notesTitle}
              notesText={state.notesText}
              onChangeNotes={handleChangeNotes}
              onClearNotes={handleClearNotes}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "summary" && (
            <SummaryView
              notesText={state.notesText}
              summary={state.summary}
              onSummaryGenerated={handleSummaryGenerated}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "quiz" && (
            <QuizView
              notesText={state.notesText}
              quiz={state.quiz}
              onQuizGenerated={handleQuizGenerated}
              onQuizCompleted={handleQuizCompleted}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "flashcards" && (
            <FlashcardsView
              notesText={state.notesText}
              deck={state.flashcardDeck}
              onDeckGenerated={handleDeckGenerated}
              onToggleMastered={handleToggleMastered}
              onShuffleDeck={handleShuffleDeck}
              onNavigate={setActiveTab}
            />
          )}
        </main>
      </div>
    </div>
  );
}

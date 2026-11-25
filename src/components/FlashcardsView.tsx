import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  FileText,
  Layers,
  Loader2,
  RotateCw,
  Shuffle,
} from "lucide-react";
import { motion } from "motion/react";
import { generateFlashcards } from "../services/studyApi";
import type { ActiveTab, FlashcardDeck } from "../types/study";

interface FlashcardsViewProps {
  notesText: string;
  deck: FlashcardDeck | null;
  onDeckGenerated: (deck: FlashcardDeck) => void;
  onToggleMastered: (cardId: string) => void;
  onShuffleDeck: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

const DECK_SIZES = [8, 12, 16];

export function FlashcardsView({
  notesText,
  deck,
  onDeckGenerated,
  onToggleMastered,
  onShuffleDeck,
  onNavigate,
}: FlashcardsViewProps) {
  const [deckSize, setDeckSize] = useState(10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasEnoughNotes = notesText.trim().length >= 30;
  const totalCards = deck?.cards.length ?? 0;
  const currentCard = deck?.cards[currentIndex];
  const isMastered = currentCard ? deck?.masteredIds.includes(currentCard.id) ?? false : false;

  useEffect(() => {
    if (currentIndex >= totalCards && totalCards > 0) {
      setCurrentIndex(0);
    }
  }, [totalCards, currentIndex]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (!deck || deck.cards.length === 0) return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.code === "ArrowRight") {
        setCurrentIndex((i) => Math.min(deck.cards.length - 1, i + 1));
        setIsFlipped(false);
        setShowHint(false);
      } else if (e.code === "ArrowLeft") {
        setCurrentIndex((i) => Math.max(0, i - 1));
        setIsFlipped(false);
        setShowHint(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deck]);

  async function handleGenerateDeck() {
    if (!hasEnoughNotes) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateFlashcards(notesText, deckSize);
      onDeckGenerated({
        topic: data.topic,
        cards: data.cards,
        masteredIds: [],
        generatedAt: new Date().toISOString(),
      });
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowHint(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate flashcards.");
    } finally {
      setIsLoading(false);
    }
  }

  function goToCard(nextIdx: number) {
    setCurrentIndex(nextIdx);
    setIsFlipped(false);
    setShowHint(false);
  }

  if (!hasEnoughNotes) {
    return (
      <div className="rounded-2xl border border-sky-100 bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <FileText className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-xl font-bold text-slate-900">
          Add study notes to create flashcards
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Upload a PDF or TXT file, paste your notes, or load sample notes to generate question-and-answer flashcards automatically.
        </p>
        <button
          type="button"
          onClick={() => onNavigate("notes")}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 cursor-pointer"
        >
          <span>Go to Study Notes</span>
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header & Deck Controls */}
      <section className="rounded-2xl border border-sky-100 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Flashcard Studio
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Click a card or press Space to flip between questions and answers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex items-center gap-1 rounded-xl border border-sky-100 bg-sky-50/80 p-1"
              role="group"
              aria-label="Flashcard deck size"
            >
              {DECK_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setDeckSize(size)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors tabular-nums whitespace-nowrap shrink-0 cursor-pointer ${
                    deckSize === size
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {size} Cards
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => void handleGenerateDeck()}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Deck...</span>
                </>
              ) : (
                <>
                  <Layers className="h-3.5 w-3.5" />
                  <span>{deck ? "Regenerate Deck" : "Generate Flashcards"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Loading */}
      {isLoading && (
        <section className="rounded-2xl border border-sky-100 bg-white p-10 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-sky-600" />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            Creating {deckSize} active-recall flashcards from your notes...
          </p>
        </section>
      )}

      {/* Empty State */}
      {!isLoading && !deck && (
        <section className="rounded-2xl border border-dashed border-sky-200 bg-white p-10 text-center">
          <Layers className="mx-auto h-9 w-9 text-sky-500" />
          <h2 className="mt-3 font-display text-lg font-semibold text-slate-900">
            Ready to build your flashcard deck
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Generate question-and-answer flashcards from your notes to drill key terms and concepts.
          </p>
          <button
            type="button"
            onClick={() => void handleGenerateDeck()}
            className="mt-5 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 cursor-pointer"
          >
            Generate {deckSize} Flashcards
          </button>
        </section>
      )}

      {/* Interactive Flashcard Stage */}
      {!isLoading && deck && currentCard && (
        <section className="mx-auto max-w-3xl space-y-5">
          {/* Deck Meta Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{deck.topic}</span>
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span className="tabular-nums">
                {deck.masteredIds.length} of {totalCards} mastered
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onShuffleDeck();
                  goToCard(0);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Shuffle className="h-3.5 w-3.5" />
                <span>Shuffle</span>
              </button>
              <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                {currentIndex + 1} / {totalCards}
              </span>
            </div>
          </div>

          {/* 3D Flip Card */}
          <div className="flashcard-perspective h-80 sm:h-96">
            <div
              role="button"
              tabIndex={0}
              aria-label={isFlipped ? "Flashcard answer side, click to show question" : "Flashcard question side, click to reveal answer"}
              onClick={() => setIsFlipped((f) => !f)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setIsFlipped((f) => !f);
                }
              }}
              className={`flashcard-inner cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                isFlipped ? "is-flipped" : ""
              }`}
            >
              {/* Front Face (Question) */}
              <div className="flashcard-face flashcard-face-front flex flex-col justify-between rounded-2xl border border-sky-200 bg-white p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-sky-700">
                    Question
                  </span>
                  {isMastered && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mastered</span>
                    </span>
                  )}
                </div>

                <div className="my-auto py-4 text-center">
                  <p className="font-display text-xl font-semibold leading-snug text-slate-900 sm:text-2xl text-balance">
                    {currentCard.front}
                  </p>
                  {showHint && currentCard.hint && (
                    <p className="mt-4 text-xs font-medium text-sky-800">
                      Hint: {currentCard.hint}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  {currentCard.hint ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint((h) => !h);
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-800 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{showHint ? "Hide Hint" : "Show Hint"}</span>
                    </button>
                  ) : (
                    <span />
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Click card to flip</span>
                  </span>
                </div>
              </div>

              {/* Back Face (Answer) */}
              <div className="flashcard-face flashcard-face-back flex flex-col justify-between rounded-2xl border border-sky-300 bg-[#EFF7FF] p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-sky-800">
                    Answer
                  </span>
                  {isMastered && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mastered</span>
                    </span>
                  )}
                </div>

                <div className="my-auto py-4 text-center">
                  <p className="text-base font-medium leading-relaxed text-slate-900 sm:text-lg">
                    {currentCard.back}
                  </p>
                </div>

                <div className="flex items-center justify-end text-xs text-sky-800">
                  <span className="inline-flex items-center gap-1.5">
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Click card to see question</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation & Mastery Footer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-white p-4">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => goToCard(Math.max(0, currentIndex - 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsFlipped((f) => !f)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-800 transition-colors hover:bg-sky-100 cursor-pointer"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Flip Card</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleMastered(currentCard.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  isMastered
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{isMastered ? "Mastered" : "Mark Mastered"}</span>
              </button>
            </div>

            <button
              type="button"
              disabled={currentIndex >= totalCards - 1}
              onClick={() => goToCard(Math.min(totalCards - 1, currentIndex + 1))}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}
    </motion.div>
  );
}

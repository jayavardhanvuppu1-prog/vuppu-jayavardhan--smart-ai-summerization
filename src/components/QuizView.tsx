import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  HelpCircle,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { generateStudyQuiz } from "../services/studyApi";
import type {
  ActiveTab,
  GeneratedQuiz,
  QuizAttempt,
  QuizCount,
  QuizDifficulty,
} from "../types/study";

interface QuizViewProps {
  notesText: string;
  quiz: GeneratedQuiz | null;
  onQuizGenerated: (quiz: GeneratedQuiz) => void;
  onQuizCompleted: (attempt: QuizAttempt) => void;
  onNavigate: (tab: ActiveTab) => void;
}

const QUESTION_COUNTS: QuizCount[] = [5, 10, 20];
const DIFFICULTIES: Array<{ id: QuizDifficulty; label: string }> = [
  { id: "foundational", label: "Foundational" },
  { id: "balanced", label: "Balanced" },
  { id: "challenge", label: "Challenge" },
];
const OPTION_LETTERS = ["A", "B", "C", "D"];

export function QuizView({
  notesText,
  quiz,
  onQuizGenerated,
  onQuizCompleted,
  onNavigate,
}: QuizViewProps) {
  const [questionCount, setQuestionCount] = useState<QuizCount>(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("balanced");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active quiz session state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"all" | "incorrect">("all");

  const hasEnoughNotes = notesText.trim().length >= 30;

  async function handleGenerateQuiz() {
    if (!hasEnoughNotes) return;
    setIsGenerating(true);
    setError(null);

    try {
      const data = await generateStudyQuiz(notesText, questionCount, difficulty);
      const nextQuiz: GeneratedQuiz = {
        topic: data.topic,
        questions: data.questions,
        difficulty,
        generatedAt: new Date().toISOString(),
      };
      onQuizGenerated(nextQuiz);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setReviewFilter("all");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate quiz.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSelectOption(questionId: string, optionIndex: number) {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  function handleSubmitQuiz() {
    if (!quiz) return;
    const total = quiz.questions.length;
    const correctCount = quiz.questions.reduce((acc, q) => {
      return acc + (selectedAnswers[q.id] === q.correctIndex ? 1 : 0);
    }, 0);
    const percentage = Math.round((correctCount / total) * 100);

    setIsSubmitted(true);
    setReviewFilter("all");

    onQuizCompleted({
      id: `attempt-${Date.now()}`,
      topic: quiz.topic,
      score: correctCount,
      total,
      percentage,
      difficulty: quiz.difficulty,
      completedAt: new Date().toISOString(),
    });
  }

  function handleRetakeSameQuiz() {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setReviewFilter("all");
  }

  if (!hasEnoughNotes) {
    return (
      <div className="rounded-2xl border border-sky-100 bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <FileText className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-xl font-bold text-slate-900">
          Add study notes to create a quiz
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Upload a PDF or TXT file, paste your notes, or load sample notes to generate 5, 10, or 20 multiple-choice practice questions.
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

  const totalQuestions = quiz?.questions.length ?? 0;
  const currentQuestion = quiz?.questions[currentIndex];
  const answeredCount = quiz
    ? quiz.questions.filter((q) => selectedAnswers[q.id] !== undefined).length
    : 0;

  const finalCorrectCount =
    quiz && isSubmitted
      ? quiz.questions.reduce(
          (acc, q) => acc + (selectedAnswers[q.id] === q.correctIndex ? 1 : 0),
          0
        )
      : 0;
  const finalPercentage =
    quiz && isSubmitted && totalQuestions > 0
      ? Math.round((finalCorrectCount / totalQuestions) * 100)
      : 0;

  const reviewQuestions =
    quiz && isSubmitted
      ? quiz.questions.filter((q) =>
          reviewFilter === "incorrect" ? selectedAnswers[q.id] !== q.correctIndex : true
        )
      : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Quiz Generator Configuration Bar */}
      <section className="rounded-2xl border border-sky-100 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              AI Quiz Generator
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Choose 5, 10, or 20 questions and test your knowledge one question at a time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Question Count Segmented Control */}
            <div
              className="flex items-center gap-1 rounded-xl border border-sky-100 bg-sky-50/80 p-1"
              role="group"
              aria-label="Number of questions"
            >
              {QUESTION_COUNTS.map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors tabular-nums whitespace-nowrap shrink-0 cursor-pointer ${
                    questionCount === cnt
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {cnt} Qs
                </button>
              ))}
            </div>

            {/* Difficulty Segmented Control */}
            <div
              className="flex items-center gap-1 rounded-xl border border-sky-100 bg-sky-50/80 p-1"
              role="group"
              aria-label="Quiz difficulty"
            >
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    difficulty === d.id
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={isGenerating}
              onClick={() => void handleGenerateQuiz()}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Quiz...</span>
                </>
              ) : (
                <>
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>{quiz ? "Generate New Quiz" : "Generate Quiz"}</span>
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

      {/* Loading State */}
      {isGenerating && (
        <section className="rounded-2xl border border-sky-100 bg-white p-8">
          <div className="flex items-center gap-3 text-sky-700">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-sm font-semibold">
              Generating {questionCount} {difficulty} multiple-choice questions from your notes...
            </p>
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-5 w-3/4 animate-pulse rounded bg-sky-100" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-sky-50" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-sky-50" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-sky-50" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-sky-50" />
          </div>
        </section>
      )}

      {/* Empty State */}
      {!isGenerating && !quiz && (
        <section className="rounded-2xl border border-dashed border-sky-200 bg-white p-10 text-center">
          <HelpCircle className="mx-auto h-9 w-9 text-sky-500" />
          <h2 className="mt-3 font-display text-lg font-semibold text-slate-900">
            Ready to test your understanding
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Select 5, 10, or 20 questions above and click Generate Quiz to start an interactive practice test.
          </p>
          <button
            type="button"
            onClick={() => void handleGenerateQuiz()}
            className="mt-5 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 cursor-pointer"
          >
            Generate {questionCount}-Question Quiz
          </button>
        </section>
      )}

      {/* Active One-Question-at-a-Time Quiz */}
      {!isGenerating && quiz && !isSubmitted && currentQuestion && (
        <section className="rounded-2xl border border-sky-100 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-sky-700">
              {quiz.topic}
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span className="capitalize">{quiz.difficulty}</span>
            </p>
            <p className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
              Question {currentIndex + 1} of {totalQuestions}
              <span className="mx-1.5 text-slate-300" aria-hidden="true">·</span>
              <span className="text-slate-500">{answeredCount} answered</span>
            </p>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sky-100">
            <div
              className="h-full rounded-full bg-sky-600 transition-all duration-200"
              style={{ width: `${Math.round(((currentIndex + 1) / totalQuestions) * 100)}%` }}
            />
          </div>

          <div className="mt-7">
            <h2 className="font-display text-lg font-semibold leading-snug text-slate-900 sm:text-xl">
              {currentQuestion.question}
            </h2>

            <div className="mt-5 space-y-3" role="radiogroup" aria-label="Answer options">
              {currentQuestion.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentQuestion.id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                    className={`flex w-full items-center gap-3.5 rounded-xl border p-4 text-left text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                      isSelected
                        ? "border-sky-600 bg-sky-50 text-slate-900 font-medium"
                        : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-[#F8FBFF]"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                        isSelected
                          ? "bg-sky-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {OPTION_LETTERS[optIdx]}
                    </span>
                    <span className="leading-relaxed">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Stepper & Submit */}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2.5">
              {currentIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700 cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={answeredCount === 0}
                  onClick={handleSubmitQuiz}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {answeredCount < totalQuestions
                      ? `Submit Quiz (${answeredCount}/${totalQuestions} answered)`
                      : "Submit Quiz"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Quiz Results & Answer Review */}
      {!isGenerating && quiz && isSubmitted && (
        <div className="space-y-6">
          {/* Score Summary Card */}
          <section className="rounded-2xl border border-sky-100 bg-white p-6 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-sky-700">
                  Quiz Completed · {quiz.topic}
                </p>
                <h2 className="mt-1 font-display text-3xl font-bold text-slate-900 tabular-nums">
                  {finalCorrectCount} / {totalQuestions} Correct ({finalPercentage}%)
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {finalPercentage >= 80
                    ? "Strong mastery of this material. Review any missed explanations below."
                    : finalPercentage >= 60
                      ? "Solid progress. Check the explanations below and try flashcards for tricky terms."
                      : "Good practice run. Review the explanations below and revisit the AI Summary."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleRetakeSameQuiz}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Retake Quiz</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleGenerateQuiz()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>New Questions</span>
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600 tabular-nums">
              <div className="flex items-center gap-5">
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {finalCorrectCount} Correct
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-red-700">
                  <XCircle className="h-4 w-4" />
                  {totalQuestions - finalCorrectCount} Incorrect
                </span>
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setReviewFilter("all")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                    reviewFilter === "all"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({totalQuestions})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter("incorrect")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                    reviewFilter === "incorrect"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Incorrect ({totalQuestions - finalCorrectCount})
                </button>
              </div>
            </div>
          </section>

          {/* Answer Review List */}
          <div className="space-y-4">
            {reviewQuestions.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-sm font-medium text-emerald-800">
                Perfect score! You answered every question correctly.
              </div>
            ) : (
              reviewQuestions.map((q) => {
                const originalNum = quiz.questions.findIndex((item) => item.id === q.id) + 1;
                const userPick = selectedAnswers[q.id];
                const isCorrect = userPick === q.correctIndex;

                return (
                  <article
                    key={q.id}
                    className="rounded-2xl border border-sky-100 bg-white p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-display text-base font-semibold text-slate-900">
                        <span className="mr-2 font-mono text-xs text-slate-400 tabular-nums">
                          {originalNum}.
                        </span>
                        {q.question}
                      </h3>

                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap shrink-0 ${
                          isCorrect ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Correct</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            <span>Incorrect</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {q.options.map((opt, idx) => {
                        const isRightOpt = idx === q.correctIndex;
                        const isUserOpt = idx === userPick;

                        let styleClass = "border-slate-200 bg-white text-slate-700";
                        let suffix = "";
                        if (isRightOpt) {
                          styleClass = "border-emerald-300 bg-emerald-50 text-emerald-900 font-medium";
                          suffix = "Correct answer";
                        } else if (isUserOpt && !isRightOpt) {
                          styleClass = "border-red-300 bg-red-50 text-red-900";
                          suffix = "Your answer";
                        }

                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm ${styleClass}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-xs font-bold">
                                {OPTION_LETTERS[idx]}.
                              </span>
                              <span>{opt}</span>
                            </div>
                            {suffix && (
                              <span className="text-xs font-semibold whitespace-nowrap shrink-0">
                                {suffix}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 rounded-xl bg-[#F4F9FF] p-3.5 text-xs leading-relaxed text-slate-700 border border-sky-100">
                      <span className="font-semibold text-slate-900">Explanation: </span>
                      {q.explanation}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

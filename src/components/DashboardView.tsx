import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  Layers,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import type { ActiveTab, FlashcardDeck, QuizAttempt, StudySummary } from "../types/study";

interface DashboardViewProps {
  notesTitle: string;
  notesWordCount: number;
  summary: StudySummary | null;
  quizHistory: QuizAttempt[];
  flashcardDeck: FlashcardDeck | null;
  onNavigate: (tab: ActiveTab) => void;
  onLoadQuickSample: () => void;
}

export function DashboardView({
  notesTitle,
  notesWordCount,
  summary,
  quizHistory,
  flashcardDeck,
  onNavigate,
  onLoadQuickSample,
}: DashboardViewProps) {
  const totalQuizzes = quizHistory.length;
  const latestQuiz = totalQuizzes > 0 ? quizHistory[0] : null;
  const averageScore =
    totalQuizzes > 0
      ? Math.round(quizHistory.reduce((acc, q) => acc + q.percentage, 0) / totalQuizzes)
      : 0;

  const totalFlashcards = flashcardDeck?.cards.length ?? 0;
  const masteredFlashcards = flashcardDeck?.masteredIds.length ?? 0;

  // Overall study progress across the 4 core milestones for the current session
  const milestones = [
    { label: "Study notes loaded", done: notesWordCount >= 20, tab: "notes" as ActiveTab },
    { label: "AI summary generated", done: Boolean(summary), tab: "summary" as ActiveTab },
    { label: "At least one quiz completed", done: totalQuizzes > 0, tab: "quiz" as ActiveTab },
    {
      label: "Flashcard deck reviewed",
      done: totalFlashcards > 0 && masteredFlashcards > 0,
      tab: "flashcards" as ActiveTab,
    },
  ];
  const completedMilestones = milestones.filter((m) => m.done).length;
  const overallProgress = Math.round((completedMilestones / milestones.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Welcome & Study Readiness Strip */}
      <section className="rounded-2xl border border-sky-100 bg-white p-6 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-medium text-sky-700">
              Study Workspace · Active Recall &amp; Guided Review
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl text-balance">
              Turn your study notes into clear summaries, quizzes, and flashcards
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
              {notesWordCount > 0
                ? `Currently studying "${notesTitle || "Untitled Notes"}" (${notesWordCount.toLocaleString()} words). Choose a study mode below to continue.`
                : "Upload a PDF or TXT file, paste lecture notes, or load a sample topic to start generating AI study materials."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {notesWordCount === 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate("notes")}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  <span>Upload Study Notes</span>
                </button>
                <button
                  type="button"
                  onClick={onLoadQuickSample}
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-800 transition-colors hover:bg-sky-100 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Try Sample Notes</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate("quiz")}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Start Practice Quiz</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("summary")}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>View Summary</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4-Column KPI Metric Strip */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-sky-100 bg-white p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-sm font-medium">Quizzes Completed</span>
            <CheckCircle2 className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-slate-900 tabular-nums">
            {totalQuizzes}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {totalQuizzes === 0
              ? "Complete your first quiz to track progress"
              : `${quizHistory.reduce((acc, q) => acc + q.total, 0)} total questions answered`}
          </p>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-white p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-sm font-medium">Latest Quiz Score</span>
            <Award className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-slate-900 tabular-nums">
            {latestQuiz ? `${latestQuiz.percentage}%` : "—"}
          </p>
          <p className="mt-1 truncate text-xs text-slate-500 tabular-nums">
            {latestQuiz
              ? `${latestQuiz.score}/${latestQuiz.total} correct · ${latestQuiz.topic}`
              : "No quiz attempts recorded yet"}
          </p>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-white p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-sm font-medium">Average Accuracy</span>
            <TrendingUp className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-slate-900 tabular-nums">
            {totalQuizzes > 0 ? `${averageScore}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {totalQuizzes > 0
              ? `Across ${totalQuizzes} completed ${totalQuizzes === 1 ? "session" : "sessions"}`
              : "Builds automatically after quizzes"}
          </p>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-white p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-sm font-medium">Study Progress</span>
            <Layers className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-slate-900 tabular-nums">
            {overallProgress}%
          </p>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-sky-100">
            <div
              className="h-full rounded-full bg-sky-600 transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </section>

      {/* Main Content Split: Study Progress & Quiz History */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Study Checklist & Quick Actions */}
        <section className="rounded-2xl border border-sky-100 bg-white p-6 lg:col-span-5">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Study Workflow Progress
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Follow these four steps to reinforce retention from your notes.
          </p>

          <ul className="mt-5 divide-y divide-slate-100">
            {milestones.map((step, index) => (
              <li key={step.label} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                      step.done
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-sky-50 text-sky-700"
                    }`}
                  >
                    {step.done ? "✓" : index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${step.done ? "text-slate-900" : "text-slate-700"}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {step.done ? "Completed" : "Pending"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate(step.tab)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{step.done ? "Open" : "Start"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>

          {totalFlashcards > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between text-xs text-slate-600 tabular-nums">
                <span>Flashcards mastered</span>
                <span className="font-semibold text-slate-900">
                  {masteredFlashcards} / {totalFlashcards}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sky-100">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${Math.round((masteredFlashcards / totalFlashcards) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Recent Quiz History */}
        <section className="rounded-2xl border border-sky-100 bg-white p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Recent Quiz Results
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Scores and accuracy from your practice sessions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("quiz")}
              className="rounded-xl bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              New Quiz
            </button>
          </div>

          {quizHistory.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-sky-200 bg-[#F8FBFF] px-6 py-10 text-center">
              <HelpCircle className="h-8 w-8 text-sky-400" />
              <p className="mt-3 text-sm font-semibold text-slate-900">
                No quizzes completed yet
              </p>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Load your study notes and generate a 5, 10, or 20 question multiple-choice quiz to test your understanding.
              </p>
              <button
                type="button"
                onClick={() => onNavigate(notesWordCount > 0 ? "quiz" : "notes")}
                className="mt-4 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 cursor-pointer"
              >
                {notesWordCount > 0 ? "Generate Your First Quiz" : "Add Study Notes First"}
              </button>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium text-slate-500">
                    <th className="pb-3 pr-4">Topic</th>
                    <th className="pb-3 pr-4">Difficulty</th>
                    <th className="pb-3 pr-4 text-right">Score</th>
                    <th className="pb-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quizHistory.slice(0, 6).map((attempt) => {
                    const isStrong = attempt.percentage >= 70;
                    return (
                      <tr key={attempt.id} className="hover:bg-[#F8FBFF]">
                        <td className="py-3 pr-4 font-medium text-slate-900 max-w-[200px] truncate">
                          {attempt.topic}
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-600 capitalize">
                          {attempt.difficulty}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-xs tabular-nums">
                          <span
                            className={`font-semibold ${
                              isStrong ? "text-emerald-700" : "text-amber-700"
                            }`}
                          >
                            {attempt.score}/{attempt.total} ({attempt.percentage}%)
                          </span>
                        </td>
                        <td className="py-3 text-right text-xs text-slate-500 tabular-nums whitespace-nowrap">
                          {new Date(attempt.completedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}

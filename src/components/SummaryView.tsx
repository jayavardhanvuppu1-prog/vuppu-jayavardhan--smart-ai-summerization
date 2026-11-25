import { useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  Copy,
  FileText,
  Lightbulb,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { generateStudySummary } from "../services/studyApi";
import type { ActiveTab, StudySummary, SummaryDepth } from "../types/study";

interface SummaryViewProps {
  notesText: string;
  summary: StudySummary | null;
  onSummaryGenerated: (summary: StudySummary) => void;
  onNavigate: (tab: ActiveTab) => void;
}

const DEPTH_OPTIONS: Array<{ id: SummaryDepth; label: string }> = [
  { id: "standard", label: "Standard" },
  { id: "simple", label: "Simple English" },
  { id: "exam", label: "Exam Prep" },
];

export function SummaryView({
  notesText,
  summary,
  onSummaryGenerated,
  onNavigate,
}: SummaryViewProps) {
  const [depth, setDepth] = useState<SummaryDepth>(summary?.depth ?? "standard");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasEnoughNotes = notesText.trim().length >= 30;

  async function handleGenerate(selectedDepth: SummaryDepth = depth) {
    if (!hasEnoughNotes) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateStudySummary(notesText, selectedDepth);
      onSummaryGenerated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate summary.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!summary) return;
    const formatted = [
      summary.title,
      "",
      "Overview:",
      summary.overview,
      "",
      "Important Points:",
      ...summary.keyPoints.map((p) => `- ${p}`),
      "",
      "Difficult Concepts Explained Simply:",
      ...summary.simpleExplanations.map(
        (item) => `${item.concept}: ${item.explanation} (Example: ${item.analogy})`
      ),
      "",
      "Key Terms:",
      ...summary.keyTerms.map((t) => `${t.term}: ${t.definition}`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard permission denials silently
    }
  }

  if (!hasEnoughNotes) {
    return (
      <div className="rounded-2xl border border-sky-100 bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <FileText className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-xl font-bold text-slate-900">
          Add study notes to generate a summary
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Upload a PDF or TXT file, paste your notes, or load sample notes to get an easy-to-understand summary and plain-English explanations.
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
      {/* Controls Bar */}
      <section className="rounded-2xl border border-sky-100 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              AI Notes Summarizer
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Converts your notes into a structured summary, key takeaways, and simple English explanations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex items-center gap-1 rounded-xl bg-sky-50/80 p-1 border border-sky-100"
              role="group"
              aria-label="Summary style"
            >
              {DEPTH_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDepth(opt.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    depth === opt.id
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => void handleGenerate(depth)}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Summarizing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{summary ? "Regenerate Summary" : "Generate Summary"}</span>
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
      {isLoading && (
        <section className="rounded-2xl border border-sky-100 bg-white p-8">
          <div className="flex items-center gap-3 text-sky-700">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-sm font-semibold">
              Reading your notes and simplifying key concepts...
            </p>
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-sky-100" />
            <div className="h-4 w-full animate-pulse rounded bg-sky-50" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-sky-50" />
          </div>
        </section>
      )}

      {/* Empty Summary CTA */}
      {!isLoading && !summary && (
        <section className="rounded-2xl border border-dashed border-sky-200 bg-white p-10 text-center">
          <BookOpen className="mx-auto h-9 w-9 text-sky-500" />
          <h2 className="mt-3 font-display text-lg font-semibold text-slate-900">
            Ready to summarize your notes
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Choose your preferred explanation style above and click Generate Summary to get started.
          </p>
          <button
            type="button"
            onClick={() => void handleGenerate(depth)}
            className="mt-5 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 cursor-pointer"
          >
            Generate Summary Now
          </button>
        </section>
      )}

      {/* Populated Summary Output */}
      {!isLoading && summary && (
        <div className="space-y-6">
          {/* Overview + Key Points */}
          <section className="rounded-2xl border border-sky-100 bg-white p-6 sm:p-7">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-sky-700 capitalize">
                  {summary.depth === "simple" ? "Simple English" : summary.depth === "exam" ? "Exam Prep" : "Standard"} Summary
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>
                    {new Date(summary.generatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-slate-900">
                  {summary.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => void handleCopy()}
                className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-5 space-y-6">
              <div>
                <h3 className="font-display text-sm font-semibold text-slate-900">
                  Overview
                </h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700 sm:text-[15px]">
                  {summary.overview}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h3 className="font-display text-sm font-semibold text-slate-900">
                  Important Points to Remember
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {summary.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sky-50 font-mono text-xs font-semibold text-sky-700 tabular-nums">
                        {idx + 1}
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Difficult Concepts in Simple English */}
          {summary.simpleExplanations.length > 0 && (
            <section className="rounded-2xl border border-sky-100 bg-white p-6 sm:p-7">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-sky-600" />
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  Difficult Topics Explained Simply
                </h3>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Plain-English breakdowns and everyday comparisons for trickier ideas.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                {summary.simpleExplanations.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-sky-100 bg-[#F8FBFF] p-4"
                  >
                    <h4 className="font-display text-sm font-bold text-slate-900">
                      {item.concept}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      {item.explanation}
                    </p>
                    {item.analogy && (
                      <p className="mt-3 border-t border-sky-100 pt-2.5 text-xs leading-relaxed text-sky-900">
                        <span className="font-semibold">Everyday example: </span>
                        {item.analogy}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Key Terms Glossary */}
          {summary.keyTerms.length > 0 && (
            <section className="rounded-2xl border border-sky-100 bg-white p-6 sm:p-7">
              <h3 className="font-display text-lg font-semibold text-slate-900">
                Key Terms &amp; Definitions
              </h3>
              <dl className="mt-4 divide-y divide-slate-100">
                {summary.keyTerms.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-1.5 py-3 first:pt-0 last:pb-0 sm:grid-cols-3 sm:gap-4"
                  >
                    <dt className="text-sm font-semibold text-slate-900">{item.term}</dt>
                    <dd className="text-sm leading-relaxed text-slate-600 sm:col-span-2">
                      {item.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      )}
    </motion.div>
  );
}

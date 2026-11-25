import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  BookOpen,
  FileText,
  FileUp,
  HelpCircle,
  Layers,
  Loader2,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { SAMPLE_NOTES, type SampleNoteSet } from "../data/sampleNotes";
import { extractPdfNotes } from "../services/studyApi";
import type { ActiveTab } from "../types/study";

interface NotesViewProps {
  notesTitle: string;
  notesText: string;
  onChangeNotes: (title: string, text: string) => void;
  onClearNotes: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

export function NotesView({
  notesTitle,
  notesText,
  onChangeNotes,
  onClearNotes,
  onNavigate,
}: NotesViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const wordCount = notesText.trim() ? notesText.trim().split(/\s+/).length : 0;
  const charCount = notesText.length;

  async function processFile(file: File) {
    setUploadError(null);
    setUploadStatus(null);

    const lowerName = file.name.toLowerCase();
    const isTxt = lowerName.endsWith(".txt") || file.type === "text/plain";
    const isPdf = lowerName.endsWith(".pdf") || file.type === "application/pdf";

    if (!isTxt && !isPdf) {
      setUploadError("Unsupported file format. Please upload a .pdf or .txt file.");
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setUploadError("File size exceeds 12 MB. Please upload a smaller document.");
      return;
    }

    const baseTitle = file.name.replace(/\.(pdf|txt)$/i, "");

    if (isTxt) {
      try {
        const text = await file.text();
        if (!text.trim()) {
          setUploadError("The uploaded text file appears to be empty.");
          return;
        }
        onChangeNotes(baseTitle, text);
        setUploadStatus(`Loaded "${file.name}" successfully.`);
      } catch {
        setUploadError("Unable to read the selected text file.");
      }
      return;
    }

    // PDF extraction via backend Gemini endpoint
    setIsExtracting(true);
    try {
      const result = await extractPdfNotes(file);
      onChangeNotes(baseTitle, result.text);
      setUploadStatus(`Extracted study notes from "${result.fileName}".`);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to extract text from PDF."
      );
    } finally {
      setIsExtracting(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  }

  function handleSelectSample(sample: SampleNoteSet) {
    setUploadError(null);
    setUploadStatus(`Loaded sample notes: "${sample.title}".`);
    onChangeNotes(sample.title, sample.content);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Upload &amp; Manage Study Notes
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Upload a PDF or TXT file, paste your notes below, or pick a sample topic for instant testing.
          </p>
        </div>

        {notesText.trim().length > 0 && (
          <button
            type="button"
            onClick={() => {
              onClearNotes();
              setUploadStatus(null);
              setUploadError(null);
            }}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-red-600 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Notes</span>
          </button>
        )}
      </div>

      {/* Upload Dropzone & Sample Picker */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-sky-100 bg-white p-6 lg:col-span-7">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Upload Document (.pdf or .txt)
          </h2>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
              isDragging
                ? "border-sky-500 bg-sky-50"
                : "border-sky-200 bg-[#F8FBFF] hover:border-sky-300"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />

            {isExtracting ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  Extracting text from PDF...
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Reading headings, paragraphs, and formulas from your document.
                </p>
              </>
            ) : (
              <>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <FileUp className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  Drag and drop your PDF or TXT file here
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Maximum file size 12 MB · Text is extracted directly into your study editor
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700 cursor-pointer"
                >
                  Browse Files
                </button>
              </>
            )}
          </div>

          {uploadStatus && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
              {uploadStatus}
            </div>
          )}

          {uploadError && (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
            >
              {uploadError}
            </div>
          )}
        </section>

        {/* Sample Notes Selector */}
        <section className="rounded-2xl border border-sky-100 bg-white p-6 lg:col-span-5">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Sample Study Notes
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Load a ready-made topic to test summaries, quizzes, and flashcards immediately.
          </p>

          <div className="mt-4 space-y-2.5">
            {SAMPLE_NOTES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="flex w-full items-start justify-between gap-3 rounded-xl border border-slate-200 bg-[#FBFDFF] p-3.5 text-left transition-colors hover:border-sky-300 hover:bg-sky-50/50 cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {sample.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {sample.subject} · {sample.readingTime}
                  </p>
                </div>
                <span className="text-xs font-semibold text-sky-700 whitespace-nowrap shrink-0">
                  Load
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Note Title & Paste Area */}
      <section className="rounded-2xl border border-sky-100 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <label htmlFor="study-note-title" className="block text-xs font-medium text-slate-500">
              Study Set Title
            </label>
            <input
              id="study-note-title"
              type="text"
              value={notesTitle}
              onChange={(e) => onChangeNotes(e.target.value, notesText)}
              placeholder="e.g., Biology Chapter 7: Cellular Respiration"
              className="mt-1.5 w-full max-w-lg rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="text-xs text-slate-500 tabular-nums shrink-0">
            <span>{wordCount.toLocaleString()} words</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>{charCount.toLocaleString()} characters</span>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="study-notes-textarea" className="block text-xs font-medium text-slate-500">
            Study Notes Content
          </label>
          <textarea
            id="study-notes-textarea"
            rows={12}
            value={notesText}
            onChange={(e) => onChangeNotes(notesTitle, e.target.value)}
            placeholder="Paste your lecture notes, textbook excerpts, or outline here (minimum 30 characters)..."
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#FBFDFF] p-4 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        {/* Action Launcher Bar */}
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {notesText.trim().length >= 30
              ? "Your notes are ready. Launch an AI study tool:"
              : "Add at least 30 characters of notes to unlock AI tools."}
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={notesText.trim().length < 30}
              onClick={() => onNavigate("summary")}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Summarize Notes</span>
            </button>
            <button
              type="button"
              disabled={notesText.trim().length < 30}
              onClick={() => onNavigate("quiz")}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-800 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Generate Quiz</span>
            </button>
            <button
              type="button"
              disabled={notesText.trim().length < 30}
              onClick={() => onNavigate("flashcards")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Create Flashcards</span>
            </button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

import {
  BookOpen,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Layers,
  X,
} from "lucide-react";
import type { ActiveTab } from "../types/study";

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
  notesWordCount: number;
  notesTitle: string;
  quizCount: number;
  flashcardCount: number;
}

const NAV_ITEMS: Array<{
  id: ActiveTab;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "notes", label: "Study Notes", icon: FileText },
  { id: "summary", label: "AI Summarizer", icon: BookOpen },
  { id: "quiz", label: "Interactive Quiz", icon: HelpCircle },
  { id: "flashcards", label: "Flashcards", icon: Layers },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  notesWordCount,
  notesTitle,
  quizCount,
  flashcardCount,
}: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sky-100 bg-white transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Primary navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-sky-100 px-5">
          <button
            type="button"
            onClick={() => {
              onSelectTab("dashboard");
              onClose();
            }}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              Smart Study AI
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-sky-50 hover:text-slate-900 lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  isActive
                    ? "bg-sky-50 text-sky-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 ${
                      isActive ? "text-sky-600" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </span>
                {item.id === "quiz" && quizCount > 0 && (
                  <span className="font-mono text-xs text-slate-400 tabular-nums">
                    {quizCount}
                  </span>
                )}
                {item.id === "flashcards" && flashcardCount > 0 && (
                  <span className="font-mono text-xs text-slate-400 tabular-nums">
                    {flashcardCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-sky-100 p-4">
          <div className="rounded-xl bg-[#F4F9FF] p-3.5 border border-sky-100">
            <p className="text-xs font-medium text-slate-500">Active Study Material</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900">
              {notesWordCount > 0 ? notesTitle || "Untitled Study Notes" : "No notes loaded"}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {notesWordCount > 0
                ? `${notesWordCount.toLocaleString()} words ready`
                : "Upload a PDF, TXT, or paste notes"}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

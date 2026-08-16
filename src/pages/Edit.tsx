//ciertamente has cuidado bien
"use client";

import {
  Trash,
  Plus,
  Search,
  Replace,
  ReplaceAll,
  ChevronDown,
  ChevronUp,
  X,
  CaseSensitive,
  CheckCircle2,
} from "lucide-react";
import { restoreDialogsToASS, triggerFileDownload } from "../utils/ass";
import { useParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "success" | "danger" | "warning" | "secondary";
  type?: "button" | "submit" | "reset";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Button = ({
  onClick,
  children,
  variant = "primary",
  type = "button",
  className = "",
  size = "md",
}: ButtonProps) => {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base font-medium",
    lg: "px-6 py-3 text-base font-bold",
  };

  const baseStyles =
    "rounded-lg text-white transition-all duration-200 ease-in-out shadow-md hover:shadow-lg border-2 border-opacity-50 border-white transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";

  const variantStyles = {
    primary: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-400",
    success: "bg-green-600 hover:bg-green-700 focus:ring-green-400",
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-400",
    warning: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-400",
    secondary: "bg-gray-600 hover:bg-gray-700 focus:ring-gray-400",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function Edit() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("common.edit")} – SubTranslator`;
  }, [t]);

  const param = useParams();
  const subFile = useLiveQuery(
    () => db.subtitles.get(param.id ?? ""),
    [param.id],
  );

  const [translatedList, setTranslatedList] = useState<string[]>([]);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  // Find & Replace state
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (subFile && subFile.id !== loadedId) {
      setTranslatedList(subFile.splitTranslated || []);
      setLoadedId(subFile.id);
    }
  }, [subFile, loadedId]);

  // Compute matches across translated lines
  const matchingRows = useMemo(() => {
    if (!searchQuery) return [];
    const matches: { index: number; count: number }[] = [];

    translatedList.forEach((text, index) => {
      if (!text) return;
      let count = 0;
      if (matchCase) {
        let pos = 0;
        while ((pos = text.indexOf(searchQuery, pos)) !== -1) {
          count++;
          pos += searchQuery.length;
        }
      } else {
        const lowerText = text.toLowerCase();
        const lowerQuery = searchQuery.toLowerCase();
        let pos = 0;
        while ((pos = lowerText.indexOf(lowerQuery, pos)) !== -1) {
          count++;
          pos += lowerQuery.length;
        }
      }
      if (count > 0) {
        matches.push({ index, count });
      }
    });
    return matches;
  }, [translatedList, searchQuery, matchCase]);

  const totalMatches = useMemo(() => {
    return matchingRows.reduce((acc, row) => acc + row.count, 0);
  }, [matchingRows]);

  // Reset or adjust activeMatchIndex when matches change
  useEffect(() => {
    if (activeMatchIndex >= matchingRows.length) {
      setActiveMatchIndex(Math.max(0, matchingRows.length - 1));
    }
  }, [matchingRows.length, activeMatchIndex]);

  // Global Keyboard Shortcuts (Ctrl+F / Ctrl+H / Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F" || e.key === "h" || e.key === "H")) {
        e.preventDefault();
        
        // If user has a selected text in window or active element, prefill search
        const selectedText = window.getSelection()?.toString().trim();
        if (selectedText) {
          setSearchQuery(selectedText);
        }

        setIsFindOpen(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 50);
      } else if (e.key === "Escape" && isFindOpen) {
        setIsFindOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFindOpen]);

  const scrollToMatchedRow = (matchIdx: number) => {
    if (matchingRows[matchIdx]) {
      const rowIndex = matchingRows[matchIdx].index;
      const targetElement = rowRefs.current[rowIndex];
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handleNextMatch = () => {
    if (matchingRows.length === 0) return;
    const nextIdx = (activeMatchIndex + 1) % matchingRows.length;
    setActiveMatchIndex(nextIdx);
    scrollToMatchedRow(nextIdx);
  };

  const handlePrevMatch = () => {
    if (matchingRows.length === 0) return;
    const prevIdx =
      (activeMatchIndex - 1 + matchingRows.length) % matchingRows.length;
    setActiveMatchIndex(prevIdx);
    scrollToMatchedRow(prevIdx);
  };

  const handleReplaceSingle = () => {
    if (!searchQuery || matchingRows.length === 0) return;
    const targetMatch = matchingRows[activeMatchIndex];
    if (!targetMatch) return;

    const rowIndex = targetMatch.index;
    const currentText = translatedList[rowIndex] || "";

    const regex = new RegExp(
      escapeRegExp(searchQuery),
      matchCase ? "" : "i",
    );
    const newText = currentText.replace(regex, replaceQuery);

    const newTranslated = [...translatedList];
    newTranslated[rowIndex] = newText;
    setTranslatedList(newTranslated);

    if (subFile) {
      db.subtitles
        .where("id")
        .equals(subFile.id)
        .modify({ splitTranslated: newTranslated });
    }

    // Scroll to next match if available
    setTimeout(() => {
      handleNextMatch();
    }, 50);
  };

  const handleReplaceAll = async () => {
    if (!searchQuery || totalMatches === 0) return;

    const regex = new RegExp(
      escapeRegExp(searchQuery),
      matchCase ? "g" : "gi",
    );

    let replacedCount = 0;
    let modifiedRowsCount = 0;

    const newTranslated = translatedList.map((text) => {
      if (!text) return text;
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        replacedCount += matches.length;
        modifiedRowsCount++;
        return text.replace(regex, replaceQuery);
      }
      return text;
    });

    setTranslatedList(newTranslated);

    if (subFile) {
      await db.subtitles
        .where("id")
        .equals(subFile.id)
        .modify({ splitTranslated: newTranslated });
    }

    setFeedbackMessage(
      t("edit.findAndReplace.replacedSummary", {
        count: replacedCount,
        rows: modifiedRowsCount,
      }),
    );
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  const download = async () => {
    const filename = `${subFile?.filename.replaceAll(".ass", "")}_es.ass`;
    const restored = restoreDialogsToASS(
      subFile?.original ?? "",
      translatedList,
    );
    triggerFileDownload(filename, restored);
  };

  const addRow = async (index: number) => {
    if (subFile) {
      const newTranslated = [...translatedList];
      newTranslated.splice(index + 1, 0, "");
      setTranslatedList(newTranslated);

      await db.subtitles
        .where("id")
        .equals(subFile.id)
        .modify({ splitTranslated: newTranslated });
    }
  };

  const removeRow = async (index: number) => {
    if (subFile) {
      const newTranslated = [...translatedList];
      newTranslated.splice(index, 1);
      setTranslatedList(newTranslated);

      await db.subtitles
        .where("id")
        .equals(subFile.id)
        .modify({ splitTranslated: newTranslated });
    }
  };

  const handleTranslatedChange = (index: number, value: string) => {
    const newTranslated = [...translatedList];
    newTranslated[index] = value;
    setTranslatedList(newTranslated);

    if (subFile) {
      db.subtitles
        .where("id")
        .equals(subFile.id)
        .modify({ splitTranslated: newTranslated });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-start gap-6 py-8">
      {/* Header Info */}
      <div className="w-full max-w-5xl px-4">
        <div className="text-center">
          <h4 className="text-2xl font-bold mb-4">{subFile?.filename}</h4>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 mb-2">
          <div className="bg-gray-100 dark:bg-gray-800 px-6 py-2 rounded-xl border border-gray-700/40 shadow-inner">
            <h4 className="text-lg font-semibold text-gray-200">
              {subFile?.split.length}/{translatedList.length}
            </h4>
          </div>

          <button
            onClick={() => {
              setIsFindOpen((prev) => !prev);
              if (!isFindOpen) {
                setTimeout(() => {
                  searchInputRef.current?.focus();
                  searchInputRef.current?.select();
                }, 50);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              isFindOpen
                ? "bg-blue-600/30 text-blue-300 border-blue-500/50 shadow-md shadow-blue-500/10"
                : "bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 border-gray-700 hover:border-gray-600"
            }`}
            title={t("edit.findAndReplace.shortcutHint")}
          >
            <Search size={16} />
            <span>{t("edit.findAndReplace.toggle")}</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono bg-gray-900/60 px-1.5 py-0.5 rounded border border-gray-700 text-gray-400">
              Ctrl+F
            </kbd>
          </button>
        </div>
      </div>

      {/* Floating Sticky Find & Replace Bar */}
      {isFindOpen && (
        <div className="sticky top-4 z-40 w-full max-w-5xl px-4 transition-all animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700/80 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Search size={18} className="text-blue-400" />
                <span className="font-semibold text-sm text-gray-200">
                  {t("edit.findAndReplace.toggle")}
                </span>
                {searchQuery && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      totalMatches > 0
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {totalMatches === 0
                      ? t("edit.findAndReplace.noMatches")
                      : totalMatches === 1
                        ? t("edit.findAndReplace.oneMatchSummary")
                        : t("edit.findAndReplace.matchesSummary", {
                            count: totalMatches,
                            rows: matchingRows.length,
                          })}
                    {matchingRows.length > 0 &&
                      ` (${activeMatchIndex + 1}/${matchingRows.length})`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMatchCase((prev) => !prev)}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                    matchCase
                      ? "bg-blue-600 text-white border-blue-400"
                      : "bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-200"
                  }`}
                  title={t("edit.findAndReplace.matchCase")}
                >
                  <CaseSensitive size={16} />
                  <span className="hidden sm:inline">Aa</span>
                </button>
                <button
                  onClick={() => setIsFindOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title={t("edit.findAndReplace.close")}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Find Input */}
              <div className="relative flex items-center">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setActiveMatchIndex(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (e.shiftKey) {
                        handlePrevMatch();
                      } else {
                        handleNextMatch();
                      }
                    }
                  }}
                  placeholder={t("edit.findAndReplace.findPlaceholder")}
                  className="w-full bg-gray-950/70 border border-gray-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all pr-20"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    onClick={handlePrevMatch}
                    disabled={matchingRows.length === 0}
                    className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                    title={t("edit.findAndReplace.previous")}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={handleNextMatch}
                    disabled={matchingRows.length === 0}
                    className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                    title={t("edit.findAndReplace.next")}
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>

              {/* Replace Input */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (e.ctrlKey || e.altKey) {
                        handleReplaceAll();
                      } else {
                        handleReplaceSingle();
                      }
                    }
                  }}
                  placeholder={t("edit.findAndReplace.replacePlaceholder")}
                  className="w-full bg-gray-950/70 border border-gray-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="text-xs text-gray-400 flex items-center gap-2">
                {feedbackMessage ? (
                  <span className="text-green-400 font-medium flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 size={14} />
                    {feedbackMessage}
                  </span>
                ) : (
                  <span>{t("edit.findAndReplace.shortcutHint")}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReplaceSingle}
                  disabled={!searchQuery || totalMatches === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-gray-800 text-gray-200 rounded-lg text-xs font-medium border border-gray-700 transition-all"
                >
                  <Replace size={14} />
                  <span>{t("edit.findAndReplace.replace")}</span>
                </button>
                <button
                  onClick={handleReplaceAll}
                  disabled={!searchQuery || totalMatches === 0}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
                >
                  <ReplaceAll size={14} />
                  <span>{t("edit.findAndReplace.replaceAll")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Subtitle Grid */}
      <main className="w-full max-w-7xl px-4 flex flex-col items-center justify-start gap-8">
        <div className="w-full">
          {Array.from({
            length: Math.max(
              (subFile?.split || []).length,
              translatedList.length,
            ),
          }).map((_, index) => {
            const originalDialog = subFile?.split[index] || "";
            const translatedDialog = translatedList[index] || "";
            const hasError = translatedDialog.includes("[[error]]");

            // Check if current row matches search query
            const isMatchingRow =
              isFindOpen &&
              Boolean(searchQuery) &&
              matchingRows.some((m) => m.index === index);

            const isActiveMatchRow =
              isMatchingRow &&
              matchingRows[activeMatchIndex]?.index === index;

            return (
              <div
                key={index}
                ref={(el) => {
                  rowRefs.current[index] = el;
                }}
                className={`grid grid-cols-[auto_1fr_1fr_auto] gap-4 mb-4 w-full items-stretch p-3 rounded-xl border transition-all ${
                  isActiveMatchRow
                    ? "bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10"
                    : isMatchingRow
                      ? "bg-gray-900/70 border-yellow-500/50 shadow-md"
                      : "bg-gray-900/40 border-gray-800/50 hover:border-gray-700/50"
                }`}
              >
                <div className="flex items-start justify-center pt-1 w-12">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm shadow-inner transition-colors ${
                      isActiveMatchRow
                        ? "bg-blue-600 text-white"
                        : isMatchingRow
                          ? "bg-yellow-600/30 text-yellow-300 border border-yellow-500/40"
                          : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {index + 1}
                  </div>
                </div>

                <div className="w-full h-full flex flex-col">
                  <textarea
                    className="w-full flex-grow resize-y rounded-lg border border-gray-700/50 bg-gray-800/30 p-3 text-gray-400 text-sm focus:outline-none"
                    value={originalDialog}
                    disabled
                    rows={Math.max(1, originalDialog.split("\n").length)}
                    placeholder={t("edit.originalPlaceholder")}
                  ></textarea>
                </div>

                <div className="w-full h-full flex flex-col">
                  <textarea
                    className={`w-full flex-grow resize-y rounded-lg border p-3 text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all ${
                      hasError
                        ? "border-red-500/80 bg-red-950/20 focus:ring-red-500/50"
                        : isActiveMatchRow
                          ? "border-blue-400 bg-gray-800/90"
                          : isMatchingRow
                            ? "border-yellow-500/50 bg-gray-800/90"
                            : "border-gray-600 bg-gray-800"
                    }`}
                    value={translatedDialog}
                    rows={Math.max(1, translatedDialog.split("\n").length)}
                    onChange={(e) =>
                      handleTranslatedChange(index, e.target.value)
                    }
                    placeholder={t("edit.translationPlaceholder")}
                  ></textarea>
                  {hasError && (
                    <div className="text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      {t("edit.errorContains")}
                    </div>
                  )}
                </div>

                <div className="flex flex-row gap-2 items-start justify-start pt-1">
                  <button
                    onClick={() => addRow(index)}
                    className="p-2 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all border border-blue-500/20 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20"
                    aria-label={t("edit.addRow")}
                    title={t("edit.addRow")}
                  >
                    <Plus size={18} />
                  </button>
                  <button
                    onClick={() => removeRow(index)}
                    className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all border border-red-500/20 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20"
                    aria-label={t("edit.deleteRow")}
                    title={t("edit.deleteRow")}
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center w-full pt-4">
          <Button variant="primary" size="lg" onClick={download}>
            {t("common.download")}
          </Button>
        </div>
      </main>
    </div>
  );
}


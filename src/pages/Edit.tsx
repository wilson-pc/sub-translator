//ciertamente has cuidado bien
"use client";

import { Trash, Plus } from "lucide-react";
import { restoreDialogsToASS, triggerFileDownload } from "../utils/ass";
import { useParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
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

export default function Edit() {
  const { t } = useTranslation();
  const param = useParams();
  console.log(param.id);
  const subFile = useLiveQuery(
    () => db.subtitles.get(param.id ?? ""),
    [param.id],
  );
  const download = async () => {
    const filename = `${subFile?.filename.replaceAll(".ass", "")}_es.ass`;
    const restored = restoreDialogsToASS(
      subFile?.original ?? "",
      subFile?.splitTranslated ?? [],
    );
    triggerFileDownload(filename, restored);
  };

  const addRow = async (index: number) => {
    if (subFile) {
      const newTranslated = [...(subFile.splitTranslated || [])];
      newTranslated.splice(index + 1, 0, "");

      await db.subtitles
        .where("id")
        .aboveOrEqual(subFile.id)
        .modify({ splitTranslated: newTranslated });
    }
  };

  const removeRow = async (index: number) => {
    if (subFile && subFile.splitTranslated) {
      const newTranslated = [...subFile.splitTranslated];
      newTranslated.splice(index, 1);

      await db.subtitles
        .where("id")
        .aboveOrEqual(subFile.id)
        .modify({ splitTranslated: newTranslated });
    }
  };
  const handleTranslatedChange = async (index: number, value: string) => {
    if (subFile) {
      const newTranslated = [...(subFile.splitTranslated || [])];
      newTranslated[index] = value;

      await db.subtitles
        .where("id")
        .aboveOrEqual(subFile.id)
        .modify({ splitTranslated: newTranslated });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-start gap-8 py-8">
      <div className="w-full max-w-4xl px-4">
        <div className="text-center">
          <h4 className="text-2xl font-bold mb-4">{subFile?.filename}</h4>
        </div>
        <div className="flex justify-center w-full mb-6">
          <div className="bg-gray-100 dark:bg-gray-800 px-6 py-3 rounded-lg">
            <h4 className="text-lg font-semibold">
              {subFile?.split.length}/{subFile?.splitTranslated?.length}
            </h4>
          </div>
        </div>
      </div>
      <main className="w-full max-w-7xl px-4 flex flex-col items-center justify-start gap-8">
        <div className="w-full">
          {/* Create rows based on the maximum length of either array */}
          {Array.from({
            length: Math.max(
              (subFile?.split || []).length,
              (subFile?.splitTranslated || []).length,
            ),
          }).map((_, index) => {
            const originalDialog = subFile?.split[index] || "";
            const translatedDialog = subFile?.splitTranslated?.[index] || "";
            const hasError = translatedDialog.includes("[[error]]");

            return (
              <div
                key={index}
                className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 mb-4 w-full items-stretch bg-gray-900/40 p-3 rounded-xl border border-gray-800/50 hover:border-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-center pt-1 w-12">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-800 text-gray-400 rounded-full font-semibold text-sm shadow-inner">
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
                    className={`w-full flex-grow resize-y rounded-lg border border-gray-600 bg-gray-800 p-3 text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all ${
                      hasError
                        ? "border-red-500/80 bg-red-950/20 focus:ring-red-500/50"
                        : ""
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

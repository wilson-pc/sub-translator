/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

//ciertamente has cuidado bien
"use client";
import { db } from "../db/db";
import type { SubFile } from "../models";

import { restoreDialogsToASS, triggerFileDownload } from "../utils/ass";
import { GoogleGenAI } from "@google/genai";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";

import { useState, useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import {
  deduplicateDialogsGemini,
  filterDrawingCommands,
  restoreDialogsGemini,
  restoreDrawingCommands,
} from "../utils/removeDuplicate";
import { Link } from "react-router";
import {
  DEFAULT_TARGET_LANGUAGE_CODE,
  GEMINI_TRANSLATION_LANGUAGES,
  getTranslationLanguageByCode,
  isTranslationLanguageCodeSupported,
} from "../utils/translationLanguages";

function getStoredTargetLanguageCode() {
  if (typeof window === "undefined") {
    return DEFAULT_TARGET_LANGUAGE_CODE;
  }

  const storedLanguageCode = localStorage.getItem("targetLanguageCode");

  return isTranslationLanguageCodeSupported(storedLanguageCode)
    ? storedLanguageCode
    : DEFAULT_TARGET_LANGUAGE_CODE;
}

function buildTranslationPrompt(
  text: string,
  targetLanguagePromptName: string,
) {
  return `You are a translation assistant. Translate the following dialogues into **${targetLanguagePromptName}**.

The input text comes from an SRT subtitle file.
Each dialogue is separated by the token \`|||\`.

---

### RULES (Follow STRICTLY):
1. ⚠️ **NEVER** remove, merge, or split dialogues.
   - The number of "|||" separators in the output MUST be **exactly the same** as in the input.
   - Each dialogue in the input corresponds to **exactly one** dialogue in the output, in the same order.
2. Do NOT translate or remove the separators (\`|||\`).
3. If a dialogue is empty, strange, cut off, or unreadable, **copy it as-is**.
4. Preserve punctuation, symbols, and line breaks inside each dialogue.
5. Do NOT add comments, explanations, or extra text.
6. Return ONLY the translated dialogues with separators, nothing else.
7. Ignore drawing commands {{index}}.
8. Ignore drawing commands and return them exactly as they appear, including [[id:index]].
9. Do not add underscores (_) in the dialogues.

Remember, you're translating movies or TV episodes, so don't try to change or minimize insults or bad words, as they are important to the plot.

---

Now translate the text below following ALL the rules above:

${text}`;
}

async function translateSub(text: string, targetLanguagePromptName: string) {
  console.log("Translating with Gemini...");
  const key = await db.apiKeys.where("isDefault").equals(1).first();

  const genAI = new GoogleGenAI({ apiKey: key?.apiKey ?? "" });

  const response = await genAI.models.generateContent({
    model: key?.model ?? "grtegt",
    contents: buildTranslationPrompt(text, targetLanguagePromptName),
  });
  return response.text ?? "";
}

async function postTranslateWithFetch(payload: {
  content: string;
  family: string;
  model: string;
  key: string;
  targetLanguagePromptName: string;
}): Promise<string> {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error en traduccion: ${response.status}`);
  }

  return response.text();
}

const readFileContents = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };

    reader.onerror = (e) => {
      reject(e);
    };

    reader.readAsText(file);
  });
};

function quitarNumerosYTiempos(texto: string): string[] {
  const lineas = texto.split("\n");
  const bloques: string[] = [];
  let i = 0;

  while (i < lineas.length) {
    i++; // número
    i++; // tiempo

    const bloque: string[] = [];

    while (i < lineas.length && lineas[i].trim() !== "") {
      bloque.push(lineas[i].trim());
      i++;
    }

    bloques.push(bloque.join("\n"));

    // Saltar línea vacía
    if (i < lineas.length && lineas[i].trim() === "") {
      i++;
    }
  }

  return bloques;
}
function restaurarNumerosYTiempos(
  textoProcesado: string[],
  textoOriginal: string,
): string {
  const lineasOriginales = textoOriginal.split("\n");
  const resultado: string[] = [];

  let i = 0; // índice en líneas originales
  let j = 0; // índice en texto traducido

  while (i < lineasOriginales.length) {
    // Línea del número
    resultado.push(lineasOriginales[i++].trim());

    // Línea del tiempo
    if (i < lineasOriginales.length) {
      resultado.push(lineasOriginales[i++].trim());
    }

    // Saltar líneas de texto original
    while (i < lineasOriginales.length && lineasOriginales[i].trim() !== "") {
      i++;
    }

    // Agregar texto traducido si existe
    const bloqueTraducido = textoProcesado[j++] ?? "";
    const lineasTraducidas = bloqueTraducido.split("\n");
    resultado.push(...lineasTraducidas.map((l) => l.trim()));

    // Línea vacía si corresponde
    if (i < lineasOriginales.length && lineasOriginales[i].trim() === "") {
      resultado.push("");
      i++;
    }
  }

  return resultado.join("\n");
}

/////////////////////////

function extractDialogsFromASS(subtitleContent: string) {
  const dialogs: string[] = [];
  const lines = subtitleContent.split("\n");

  for (const line of lines) {
    if (line.startsWith("Dialogue:")) {
      const match = line.match(
        /Dialogue:[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,(.*)/,
      );

      if (match && match[1]) {
        const dialogText = match[1]
          .replace(/\{[^}]*\}/g, "") // Eliminar etiquetas ASS como {\fad(...)} o {\pos(...)}
          .replace(/\\N/g, "\n") // Convertir saltos de línea
          .trim();

        // Ignorar líneas con datos vectoriales (\p1)
        if (!dialogText.includes("\\p1")) {
          dialogs.push(dialogText);
        }
      } else {
        console.warn(`No se pudo extraer diálogo de: ${line}`);
      }
    }
  }

  return dialogs;
}

export default function Home() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "SubTranslator – Free AI Subtitle Translator";
  }, []);

  const [dragActive, setDragActive] = useState(false);
  const [targetLanguageCode, setTargetLanguageCode] = useState(
    getStoredTargetLanguageCode,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedTargetLanguage =
    getTranslationLanguageByCode(targetLanguageCode);

  const countKeys = useLiveQuery(() => db.apiKeys.count());
  const files = useLiveQuery(() => db.subtitles.toArray());

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (files) {
      await db.subtitles.clear();
      const lfiles: SubFile[] = [];
      for (const element of files) {
        const text = await readFileContents(element);
        const id = nanoid();
        if (element.name.endsWith(".srt")) {
          await db.subtitles.add({
            id: id,
            filename: element.name,
            original: text,
            state: "PENDING",
            split: quitarNumerosYTiempos(text),
          });
        } else {
          await db.subtitles.add({
            id: id,
            filename: element.name,
            original: text,
            state: "PENDING",
            split: extractDialogsFromASS(text),
          });
        }
      }
      console.log(lfiles);
      //setFiles(lfiles);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDropFiles = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles) {
      await db.subtitles.clear();

      for (const element of droppedFiles) {
        const text = await readFileContents(element);
        const id = nanoid();
        if (element.name.endsWith(".srt")) {
          await db.subtitles.add({
            id: id,
            filename: element.name,
            original: text,
            state: "PENDING",
            split: quitarNumerosYTiempos(text),
          });
        } else {
          await db.subtitles.add({
            id: id,
            filename: element.name,
            original: text,
            state: "PENDING",
            split: extractDialogsFromASS(text),
          });
        }
      }
    }
  };

  const handleDragAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleTargetLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextLanguageCode = event.target.value;

    setTargetLanguageCode(nextLanguageCode);
    localStorage.setItem("targetLanguageCode", nextLanguageCode);
  };

  const translate = async () => {
    const filesDb = await db.subtitles.toArray();
    console.log(filesDb);
    for (const element of filesDb ?? []) {
      try {
        await translateSingle(element, targetLanguageCode);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const translateSingle = async (
    file: SubFile,
    forcedTargetLanguageCode?: string,
  ) => {
    const activeTargetLanguageCode =
      forcedTargetLanguageCode ?? file.targetLanguageCode ?? targetLanguageCode;
    const activeTargetLanguage = getTranslationLanguageByCode(
      activeTargetLanguageCode,
    );

    try {
      await db.subtitles.where("id").equals(file.id).modify({
        state: "PROCESSING",
        targetLanguageCode: activeTargetLanguageCode,
      });
      if (file.filename.endsWith(".srt")) {
        const parsetString = file.split?.join(" ||| ");
        let data = "";
        const currentKey = await db.apiKeys
          .where("isDefault")
          .equals(1)
          .first();
        if (currentKey?.family !== "gemini") {
          data = await postTranslateWithFetch({
            content: parsetString,
            family: currentKey?.family ?? "deepseek",
            model: currentKey?.model ?? "deepseek-chat",
            key: currentKey?.apiKey ?? "",
            targetLanguagePromptName: activeTargetLanguage.promptName,
          });
        } else {
          data = await translateSub(
            parsetString ?? "",
            activeTargetLanguage.promptName,
          );
        }

        const restored = data
          .split(/\s*\|\|\|\s*/)
          .map((parte: any) => parte.trim());
        await db.subtitles.where("id").equals(file.id).modify({
          state: "DONE",
          splitTranslated: restored,
          targetLanguageCode: activeTargetLanguageCode,
        });
      } else {
        const {
          deduplicatedStructure, // El "esqueleto" del archivo con los IDs
          linesToTranslate, // Array tipo ["@@DUP:1@@ Hola", "@@DUP:2@@ Mundo"]
          patternToOriginalMap, // Mapa de respaldo
        } = deduplicateDialogsGemini(file.split);
        const cleaned = filterDrawingCommands(linesToTranslate);
        const parsetString = cleaned.join(" ||| "); // filterDrawingCommands(uniqueDialogs)?.join(" ||| ");

        let data = "";
        const currentKey = await db.apiKeys
          .where("isDefault")
          .equals(1)
          .first();
        if (currentKey?.family !== "gemini") {
          data = await postTranslateWithFetch({
            content: parsetString,
            family: currentKey?.family ?? "deepseek",
            model: currentKey?.model ?? "deepseek-chat",
            key: currentKey?.apiKey ?? "",
            targetLanguagePromptName: activeTargetLanguage.promptName,
          });
        } else {
          data = await translateSub(
            parsetString ?? "",
            activeTargetLanguage.promptName,
          );
        }

        const restoredTranslated = data
          .split(/\s*\|\|\|\s*/)
          .map((parte: any) => parte.trim());
        const translatedClean = restoreDrawingCommands(
          restoredTranslated,
          cleaned,
        );
        const restored = restoreDialogsGemini(
          deduplicatedStructure,
          translatedClean,
          patternToOriginalMap,
        );
        await db.subtitles.where("id").equals(file.id).modify({
          state: "DONE",
          splitTranslated: restored.items,
          targetLanguageCode: activeTargetLanguageCode,
        });
        // const textoModificado2 = restaurarASS(text, textoModificado)
        // console.log(textoModificado2)
      }
    } catch (error) {
      console.log(error);
      await db.subtitles.where("id").equals(file.id).modify({
        state: "ERROR",
        targetLanguageCode: activeTargetLanguageCode,
      });
    }
  };

  const download = async (_file: SubFile) => {
    const file = await db.subtitles.get(_file.id);

    if (!file) return;
    if (!file) {
      return;
    }

    const downloadLanguage = getTranslationLanguageByCode(
      file.targetLanguageCode,
    );

    if (file.filename.endsWith(".srt")) {
      const filename = `${file.filename.replaceAll(".srt", "")}_${downloadLanguage.fileSuffix}.srt`;
      const restored = restaurarNumerosYTiempos(
        file.splitTranslated ?? [],
        file.original,
      );
      triggerFileDownload(filename, restored);
    } else {
      const filename = `${file.filename.replaceAll(".ass", "")}_${downloadLanguage.fileSuffix}.ass`;
      const restored = restoreDialogsToASS(
        file.original,
        file.splitTranslated ?? [],
      );
      triggerFileDownload(filename, restored);
    }
  };
  return (
    <div className="flex min-h-screen w-full flex-col items-center gap-8">
      {countKeys && countKeys > 0 && (
        <div className="w-full flex justify-center">
          <div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDropFiles}
              onClick={handleDragAreaClick}
              className={`w-full max-w-lg p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-gray-400 bg-gray-800"
                  : "border-gray-600 hover:border-gray-500"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <p className="text-gray-300">{t("home.dropzone")}</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              id="file"
              name="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      )}
      <main className="mx-auto flex w-full flex-col items-center justify-start gap-8">
        {countKeys && countKeys > 0 && (
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-4">
            <br />
            <br />

            <div className="mb-6 flex w-full max-w-lg flex-col gap-2 rounded-lg border border-gray-700 bg-gray-800/60 p-4">
              <label
                htmlFor="targetLanguage"
                className="text-sm font-medium text-gray-200"
              >
                {t("home.targetLanguageLabel")}
              </label>
              <select
                id="targetLanguage"
                name="targetLanguage"
                value={targetLanguageCode}
                onChange={handleTargetLanguageChange}
                className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none transition-colors focus:border-blue-500"
              >
                {GEMINI_TRANSLATION_LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400">
                {t("home.targetLanguageHelp")}
              </p>
            </div>

            <button
              disabled={files?.length === 0}
              onClick={translate}
              className="rounded-lg bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("common.translate")}
            </button>

            <ul className="mx-auto w-full max-w-2xl self-center divide-y divide-gray-700">
              {files?.map((file, index) => {
                return (
                  <li className="pb-3 sm:pb-4" key={index}>
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className="shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-gray-100">
                          {file.filename}
                        </p>
                        {file.targetLanguageCode && (
                          <p className="truncate text-xs text-gray-400">
                            {t("home.fileTarget", {
                              language: getTranslationLanguageByCode(
                                file.targetLanguageCode,
                              ).label,
                            })}
                          </p>
                        )}
                      </div>
                      {file.state === "PENDING" && (
                        <div className="text-sm text-gray-400">
                          {t("home.status.pending")}
                        </div>
                      )}
                      {file.state === "PROCESSING" && (
                        <div className="flex items-center justify-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-gray-300"></div>
                        </div>
                      )}
                      {file.state === "ERROR" && (
                        <div className="flex items-center justify-center">
                          <button
                            className="rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
                            onClick={() => {
                              translateSingle(
                                file,
                                file.targetLanguageCode ??
                                  selectedTargetLanguage.code,
                              );
                            }}
                          >
                            {t("common.retry")}
                          </button>
                        </div>
                      )}
                      {file.state === "DONE" && (
                        <div className="flex items-center justify-center">
                          {!file.splitTranslated?.some((line) =>
                            String(line || "").includes("[[error]]"),
                          ) ? (
                            <button
                              className="rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
                              onClick={() => {
                                download(file);
                              }}
                            >
                              {t("common.download")}
                            </button>
                          ) : (
                            <button
                              className="group relative rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-500"
                              onClick={() => {
                                download(file);
                              }}
                            >
                              {t("common.download")}
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-800 rounded-lg">
                                {t("home.unresolvedTooltip")}
                              </span>
                            </button>
                          )}

                          <Link
                            target="_blank"
                            to={`/edit/${file.id}`}
                            className="rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
                          >
                            {t("common.view")}
                          </Link>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {countKeys === 0 && (
          <div>
            <div>
              <div
                className="mb-4 rounded-lg border border-gray-700 bg-gray-800 p-4 text-sm text-gray-200"
                role="alert"
              >
                <span className="font-medium">{t("home.noApiKeyTitle")}</span>{" "}
                <Link to={"/keys"}>{t("home.noApiKeyLink")}</Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

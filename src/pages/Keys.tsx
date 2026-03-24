//ciertamente has cuidado bien
"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { nanoid } from "nanoid";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "success" | "danger" | "warning" | "secondary";
  type?: "button" | "submit" | "reset";
  className?: string;
}

const Button = ({
  onClick,
  children,
  variant = "primary",
  type = "button",
  className = "",
}: ButtonProps) => {
  const baseStyles =
    "px-6 py-3 rounded-lg font-bold text-base text-white transition-all duration-200 ease-in-out shadow-md hover:shadow-lg border-2 border-opacity-50 border-white transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap";

  const variantStyles = {
    primary:
      "bg-blue-600 hover:bg-blue-700 focus:ring-blue-400 border-blue-400",
    success:
      "bg-green-600 hover:bg-green-700 focus:ring-green-400 border-green-400",
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-400 border-red-400",
    warning:
      "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-400 border-yellow-400",
    secondary:
      "bg-gray-600 hover:bg-gray-700 focus:ring-gray-400 border-gray-400",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

interface FormComponentProps {
  isEditing: boolean;
  editData: { family: string; model: string; apiKey: string };
  setEditData: (data: {
    family: string;
    model: string;
    apiKey: string;
  }) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSaveEdit: () => void;
  onCancel: () => void;
}

const FormComponent = ({
  isEditing,
  editData,
  setEditData,
  onSubmit,
  onSaveEdit,
  onCancel,
}: FormComponentProps) => {
  const { t } = useTranslation();

  return (
    <form
      className="space-y-6 p-8 bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md w-full max-w-md"
      onSubmit={isEditing ? undefined : onSubmit}
    >
      <div>
        <label
          htmlFor="family"
          className="block text-sm font-medium text-gray-700"
        >
          {t("common.family")}
        </label>
        {isEditing ? (
          <select
            value={editData.family}
            onChange={(e) =>
              setEditData({ ...editData, family: e.target.value })
            }
            className="mt-1 block w-full p-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-blue-500"
          >
            <option value="openai">Open AI</option>
            <option value="gemini">Gemini</option>
            <option value="deepseek">deepseek</option>
            <option value="kimi">kimi</option>
            <option value="anthropic">Anthropic</option>
          </select>
        ) : (
          <select
            id="family"
            name="family"
            required
            defaultValue="gemini"
            className="mt-1 block w-full p-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-blue-500"
          >
            <option value="">{t("common.selectOption")}</option>
            <option value="open-ai">Open AI</option>
            <option value="gemini">Gemini</option>
            <option value="deepseek">deepseek</option>
            <option value="kimi">kimi</option>
            <option value="anthropic">Anthropic</option>
          </select>
        )}
      </div>
      <div>
        <label
          htmlFor="model"
          className="block text-sm font-medium text-gray-700"
        >
          {t("common.model")}
        </label>
        <input
          type="text"
          id="model"
          name="model"
          value={isEditing ? editData.model : undefined}
          onChange={
            isEditing
              ? (e) => setEditData({ ...editData, model: e.target.value })
              : undefined
          }
          required
          className="mt-1 block w-full p-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>
      <div>
        <label
          htmlFor="apiKey"
          className="block text-sm font-medium text-gray-700"
        >
          {t("common.apiKey")}
        </label>
        <input
          type="text"
          id="apiKey"
          name="apiKey"
          value={isEditing ? editData.apiKey : undefined}
          onChange={
            isEditing
              ? (e) => setEditData({ ...editData, apiKey: e.target.value })
              : undefined
          }
          required
          className="mt-1 block w-full p-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex justify-center gap-4 w-full pt-4">
        {isEditing ? (
          <>
            <Button variant="success" type="button" onClick={onSaveEdit}>
              {`✓ ${t("common.save")}`}
            </Button>
            <Button variant="secondary" type="button" onClick={onCancel}>
              {`✕ ${t("common.cancel")}`}
            </Button>
          </>
        ) : (
          <Button variant="primary" type="submit">
            {`+ ${t("common.save")}`}
          </Button>
        )}
      </div>
    </form>
  );
};

export default function Keys() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("keys.title")} – SubTranslator`;
  }, [t]);

  const apiKeys = useLiveQuery(() => db.apiKeys.toArray());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    family: "",
    model: "",
    apiKey: "",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      family: formData.get("family"),
      model: formData.get("model"),
      apiKey: formData.get("apiKey"),
    };
    const id = nanoid();
    await db.apiKeys.add({
      id,
      model: data.model?.toString() ?? "",
      apiKey: data.apiKey?.toString() ?? "",
      family: data.family?.toString() ?? "",
      isDefault: false,
    });
    (event.target as HTMLFormElement).reset();
  };

  const handleEdit = (file: any) => {
    setEditingId(file.id);
    setEditData({
      family: file.family,
      model: file.model,
      apiKey: file.apiKey,
    });
  };

  const handleSaveEdit = async () => {
    if (editingId) {
      await db.apiKeys.update(editingId, {
        family: editData.family,
        model: editData.model,
        apiKey: editData.apiKey,
      });
      setEditingId(null);
      setEditData({ family: "", model: "", apiKey: "" });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({ family: "", model: "", apiKey: "" });
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div>
        <div>{t("keys.title")}</div>
      </div>
      <main className="flex flex-col gap-8 row-start-2 items-center w-full">
        <div className="flex justify-center w-full">
          <div className="form">
            <FormComponent
              isEditing={!!editingId}
              editData={editData}
              setEditData={setEditData}
              onSubmit={handleSubmit}
              onSaveEdit={handleSaveEdit}
              onCancel={handleCancel}
            />
          </div>
        </div>

        <ul className="divide-y divide-gray-200 dark:divide-gray-700 w-full max-w-2xl">
          {apiKeys?.map((file, index) => {
            const isEditing = editingId === file.id;
            return (
              <li className="pb-3 sm:pb-4" key={index}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <div className="shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {file.model}
                      </p>
                      <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                        {file.family}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 rtl:space-x-reverse pt-2">
                    {file.isDefault === true && (
                      <div className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                        {`⭐ ${t("common.default")}`}
                      </div>
                    )}
                    {file.isDefault === false && (
                      <Button
                        variant="warning"
                        className="flex items-center gap-3 bg-[#007acc] hover:bg-[#0062a3] text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
                        onClick={() => {
                          const oldDefault = apiKeys?.find(
                            (apiKey) => apiKey.isDefault === true,
                          );
                          if (oldDefault) {
                            db.apiKeys.update(oldDefault.id, {
                              isDefault: false,
                            });
                          }
                          db.apiKeys.update(file.id, {
                            isDefault: true,
                          });
                          localStorage.setItem("apiKey", file.apiKey ?? "");
                          localStorage.setItem("model", file.model ?? "");
                        }}
                      >
                        {`⭐ ${t("common.default")}`}
                      </Button>
                    )}

                    {!isEditing && (
                      <>
                        <Button
                          variant="primary"
                          onClick={() => handleEdit(file)}
                        >
                          {`✎ ${t("common.edit")}`}
                        </Button>
                        {deleteConfirm === file.id ? (
                          <div className="flex gap-2">
                            <Button
                              className="flex items-center gap-3 bg-[#007acc] hover:bg-[#0062a3] text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
                              variant="danger"
                              onClick={() => {
                                db.apiKeys.delete(file.id);
                                setDeleteConfirm(null);
                              }}
                            >
                              {t("common.confirm")}
                            </Button>
                            <Button
                              className="flex items-center gap-3 bg-[#007acc] hover:bg-[#0062a3] text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
                              variant="secondary"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              {t("common.cancel")}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className="flex items-center gap-3 bg-[#007acc] hover:bg-[#0062a3] text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
                            variant="danger"
                            onClick={() => setDeleteConfirm(file.id)}
                          >
                            {`🗑 ${t("common.delete")}`}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}

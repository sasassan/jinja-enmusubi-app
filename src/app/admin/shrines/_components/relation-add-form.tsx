"use client";

import { useState } from "react";

type ActionResult = { success: boolean; error?: string };

type RelationAddFormProps = {
  action: (formData: FormData) => Promise<ActionResult | void>;
  existingKeys: string[];
  keyFieldName: string;
  confirmMessage: string;
  duplicateMessage: string;
  children: React.ReactNode;
};

export default function RelationAddForm({
  action,
  existingKeys,
  keyFieldName,
  confirmMessage,
  duplicateMessage,
  children,
}: RelationAddFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const key = String(formData.get(keyFieldName) ?? "").trim();
    if (!key) return;

    if (existingKeys.includes(key)) {
      setError(duplicateMessage);
      return;
    }

    if (!window.confirm(confirmMessage)) return;

    setPending(true);
    try {
      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-relation-form">
      {children}
      <button type="submit" className="admin-button" disabled={pending} aria-busy={pending}>
        追加
      </button>
      {error && (
        <span className="admin-error" style={{ flexBasis: "100%" }}>
          {error}
        </span>
      )}
    </form>
  );
}

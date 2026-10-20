"use client";

import { useState } from "react";

type DeleteButtonProps = {
  action: () => Promise<{ success: boolean; error?: string } | void>;
  itemName?: string;
  label?: string;
};

export function DeleteButton({ action, itemName, label = "削除する" }: DeleteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await action();
      if (result && !result.success) {
        setError(result.error ?? "削除に失敗しました。");
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました。");
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="admin-button danger"
        disabled={isLoading}
        aria-busy={isLoading}
        onClick={() => {
          const message = itemName
            ? `「${itemName}」を削除します。よろしいですか？この操作は元に戻せません。`
            : "削除します。よろしいですか？この操作は元に戻せません。";
          if (window.confirm(message)) {
            void handleDelete();
          }
        }}
      >
        {isLoading ? "削除中…" : label}
      </button>
      {error && (
        <p className="admin-error" style={{ marginTop: "var(--sp-2)" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

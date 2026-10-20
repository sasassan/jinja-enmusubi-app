"use client";

import { useActionState } from "react";

type ActionResult = { success: boolean; error?: string };

type DeleteButtonProps = {
  action: (formData: FormData) => Promise<ActionResult | void>;
  itemName: string;
};

export default function DeleteButton({ action, itemName }: DeleteButtonProps) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => {
      const result = await action(formData);
      return result ?? null;
    },
    null
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(`「${itemName}」を削除します。よろしいですか？`)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="admin-button danger" disabled={pending} aria-busy={pending}>
        削除する
      </button>
      {state?.error && (
        <p className="admin-error" style={{ marginTop: "var(--sp-2)" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}

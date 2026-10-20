"use client";

import { useActionState } from "react";

type ActionResult = { success: boolean; error?: string };

type AdminFormProps = {
  action: (formData: FormData) => Promise<ActionResult | void>;
  submitLabel: string;
  children: React.ReactNode;
};

export default function AdminForm({ action, submitLabel, children }: AdminFormProps) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => {
      const result = await action(formData);
      return result ?? null;
    },
    null
  );

  return (
    <form action={formAction} className="admin-form">
      {state?.error && (
        <div className="admin-error" role="alert">
          {state.error}
        </div>
      )}
      {children}
      <div className="admin-form-actions">
        <button type="submit" className="admin-button" disabled={pending} aria-busy={pending}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

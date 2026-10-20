"use client";

import type { ReactNode } from "react";

type DeleteButtonProps = {
  children?: ReactNode;
  confirmMessage?: string;
};

export default function DeleteButton({
  children = "削除",
  confirmMessage = "本当に削除しますか？この操作は元に戻せません。",
}: DeleteButtonProps) {
  return (
    <button
      type="submit"
      className="admin-button danger"
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}

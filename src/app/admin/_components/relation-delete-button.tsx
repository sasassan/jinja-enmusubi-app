"use client";

type RelationDeleteButtonProps = {
  action: (formData: FormData) => Promise<void>;
};

export default function RelationDeleteButton({ action }: RelationDeleteButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("この関連を削除しますか？")) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="admin-button danger">削除</button>
    </form>
  );
}

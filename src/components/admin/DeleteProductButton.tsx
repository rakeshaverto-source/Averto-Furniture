"use client";

import { deleteProduct } from "@/app/admin/actions";

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteProduct}
      onSubmit={(e) => {
        if (!window.confirm(`Delete "${name}" and all its photos? Past orders keep their details. This can't be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm text-red-700 hover:text-red-800 underline underline-offset-4 cursor-pointer">
        Delete product
      </button>
    </form>
  );
}

import { useState } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { Trash2, X } from "lucide-react";

import { db } from "../../lib/firebase";
import { useToast } from "../ui/ToastProvider";

export default function DeleteMemberModal({ open, member, onClose }) {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);

  if (!open || !member) {
    return null;
  }

  const handleClose = () => {
    if (deleting) {
      return;
    }

    onClose();
  };

  const handleDelete = async () => {
    if (deleting) {
      return;
    }

    setDeleting(true);

    try {
      await deleteDoc(doc(db, "members", member.id));

      const nickname = member.nickname;

      onClose();

      toast.success(
        "Member deleted",
        `${nickname} has been removed from the member database.`,
      );
    } catch (deleteError) {
      console.error("Failed to delete member:", deleteError);

      toast.error("Delete failed", "The member could not be deleted.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center sm:p-4">
      <div className="w-full bg-white shadow-xl sm:max-w-md sm:rounded-xl">
        <div className="flex items-start justify-between px-5 pt-5">
          <div className="flex size-10 items-center justify-center rounded-full bg-red-50">
            <Trash2 className="size-5 text-red-600" />
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={deleting}
            className="flex size-9 items-center justify-center rounded-lg text-content-muted transition hover:bg-surface-100 hover:text-content-strong disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-5 pb-5 pt-4">
          <h2 className="text-base font-semibold text-content-strong">
            Delete member?
          </h2>

          <p className="mt-2 text-sm leading-6 text-content-muted">
            <span className="font-medium text-content-strong">
              {member.nickname}
            </span>{" "}
            will be permanently removed from the member database.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-line px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={deleting}
            className="h-10 rounded-lg border border-line-strong bg-white px-4 text-sm font-medium text-content transition hover:bg-surface-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="h-10 min-w-28 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete member"}
          </button>
        </div>
      </div>
    </div>
  );
}

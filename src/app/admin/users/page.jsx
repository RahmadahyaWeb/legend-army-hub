"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import { formatDate } from "@/utils/formatters";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import { useToast } from "@/components/ui/ToastProvider";

/**
 * Admin Users Management
 *
 * Why this exists:
 * Manages authorized administrator accounts who have permission to edit rosters,
 * update tactical configurations, and push broadcasts.
 */
export default function AdminUsersPage() {
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to load admin users:", err);
      toastError("Load Error", "Failed to retrieve registered admin users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          displayName: displayName.trim() || "Admin",
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create admin user.");
      }

      setEmail("");
      setDisplayName("");
      setPassword("");
      setModalOpen(false);
      success("Admin registered", `New administrator "${email}" created.`);
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, userEmail) => {
    if (!confirm(`Are you sure you want to remove admin user "${userEmail}"?`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        success("Admin removed", `User "${userEmail}" has been deleted.`);
        loadUsers();
      }
    } catch (err) {
      console.error("Delete error:", err);
      toastError("Delete failed", err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between border-b-2 border-zinc-200 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-pixel text-xl sm:text-2xl font-bold text-zinc-950 tracking-wide">
              Admin Accounts
            </h1>
            <span className="border-2 border-zinc-950 px-2 py-0.5 text-xs font-mono font-bold bg-zinc-100 text-zinc-950 shadow-[1px_1px_0px_#09090b]">
              {users.length} Active
            </span>
          </div>
          <p className="mt-1 text-xs font-mono text-zinc-600">
            Authorized administrator credentials for Legend Army Hub
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={UserPlus}
          onClick={() => setModalOpen(true)}
        >
          Add Admin
        </Button>
      </div>

      {/* ADMIN USERS LIST */}
      <div className="border-2 border-zinc-950 bg-white shadow-[4px_4px_0px_#09090b] overflow-hidden">
        <div className="border-b-2 border-zinc-950 bg-zinc-50 px-4 sm:px-6 py-3">
          <h3 className="font-pixel text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">
            Registered Administrators ({users.length})
          </h3>
        </div>

        <div className="divide-y-2 divide-zinc-100">
          {loading ? (
            <Loading message="Loading admins..." />
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-zinc-500">
              No administrator accounts registered yet.
            </div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-4 sm:px-6 hover:bg-zinc-50 transition-colors gap-3"
              >
                <div className="min-w-0">
                  <div className="font-bold text-sm text-zinc-950 truncate font-mono">
                    {u.displayName || "Admin"}
                  </div>
                  <div className="text-xs font-mono text-zinc-600 flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="truncate">{u.email}</span>
                    <span className="text-zinc-400">•</span>
                    <span className="shrink-0 text-zinc-500">Created {formatDate(u.createdAt)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(u.id, u.email)}
                  className="flex size-7.5 shrink-0 items-center justify-center border border-zinc-950 bg-white text-zinc-700 hover:bg-red-50 hover:text-red-700 shadow-[1px_1px_0px_#09090b] active:translate-x-[1px] active:translate-y-[1px] transition"
                  title="Remove admin"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADD ADMIN MODAL */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Admin User"
        description="Create login credentials for guild leadership."
        icon={UserPlus}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={saving}
              icon={UserPlus}
              onClick={handleCreate}
            >
              Create Admin
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Admin Display Name"
            placeholder="e.g. Lead Officer / Vice Guild Leader"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="admin@legendarmy.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            required
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Stored with SHA-256 cryptographic verification."
          />

          {error && (
            <div className="border-2 border-red-600 bg-red-50 p-3 text-xs font-mono font-bold text-red-700 shadow-[2px_2px_0px_#b91c1c]">
              {error}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

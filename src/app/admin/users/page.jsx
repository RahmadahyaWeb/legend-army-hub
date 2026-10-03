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
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              Admin Accounts
            </h1>
            <Badge variant="brand" size="sm">
              {users.length} Active
            </Badge>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Manage administrative credentials with access to Guild Hub dashboard & controls
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={UserPlus}
          onClick={() => setModalOpen(true)}
        >
          Add Admin User
        </Button>
      </div>

      {/* ADMIN USERS LIST */}
      <Card className="overflow-hidden">
        <div className="border-b border-zinc-100 bg-zinc-50/75 px-4 sm:px-6 py-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Registered Administrators ({users.length})
          </h3>
        </div>

        <div className="divide-y divide-zinc-100">
          {loading ? (
            <div className="animate-pulse divide-y divide-zinc-100">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-center justify-between p-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-zinc-200" />
                    <div className="space-y-1">
                      <div className="h-4 w-32 rounded bg-zinc-200" />
                      <div className="h-3 w-44 rounded bg-zinc-100" />
                    </div>
                  </div>
                  <div className="h-7 w-20 rounded-lg bg-zinc-100" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No custom admin accounts registered yet. Default admin credentials active.
            </div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-4 sm:px-6 hover:bg-zinc-50/70 transition gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-zinc-900 truncate">
                      {u.displayName || "Admin"}
                    </div>
                    <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-none">
                        <Mail className="size-3 text-zinc-400 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </span>
                      <span>•</span>
                      <span className="shrink-0">Added {formatDate(u.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(u.id, u.email)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                  title="Remove admin"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

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
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 animate-in fade-in duration-150">
              {error}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

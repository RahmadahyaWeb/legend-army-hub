"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Plus,
  Save,
  ScrollText,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { fetchStrategies, saveStrategy, deleteStrategy } from "@/lib/api";
import { sendStrategyToDiscord } from "@/services/strategy/strategyDiscordService";
import { formatDate } from "@/utils/formatters";
import { PageLoading } from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";

export default function StrategyPage() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [mapName, setMapName] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingDiscord, setSendingDiscord] = useState(false);
  const [error, setError] = useState("");

  // Toast feedback state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const selectStrategy = (strat) => {
    setSelectedId(strat.id);
    setTitle(strat.title || "");
    setCategory(strat.category || "General");
    setMapName(strat.mapName || "");
    setContent(strat.content || "");
  };

  const handleNew = () => {
    setSelectedId(null);
    setTitle("");
    setCategory("General");
    setMapName("");
    setContent("");
  };

  const loadStrategies = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await fetchStrategies(silent);
      setStrategies(data);
      if (data.length > 0 && !selectedId) {
        selectStrategy(data[0]);
      }
      setError("");
    } catch (err) {
      console.error("Strategy load error:", err);
      setError("Failed to load strategies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStrategies(false);
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      showToast("Judul strategi wajib diisi.", "error");
      return null;
    }

    setSaving(true);
    try {
      const res = await saveStrategy({
        id: selectedId || undefined,
        title: title.trim(),
        category,
        mapName,
        content,
      });

      await loadStrategies(true);
      if (res.strategy) selectStrategy(res.strategy);
      showToast("Strategi berhasil disimpan!");
      return res.strategy;
    } catch (err) {
      console.error("Save strategy error:", err);
      showToast("Gagal menyimpan: " + err.message, "error");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSendDiscord = async (stratToSend = null) => {
    const targetTitle = stratToSend ? stratToSend.title : title;
    const targetContent = stratToSend ? stratToSend.content : content;
    const targetCategory = stratToSend ? stratToSend.category : category;
    const targetMapName = stratToSend ? stratToSend.mapName : mapName;

    if (!targetTitle?.trim()) {
      showToast("Judul strategi wajib diisi sebelum mengirim ke Discord.", "error");
      return;
    }

    if (!targetContent?.trim()) {
      showToast("Konten strategi wajib diisi sebelum mengirim ke Discord.", "error");
      return;
    }

    setSendingDiscord(true);
    try {
      await sendStrategyToDiscord({
        title: targetTitle.trim(),
        category: targetCategory,
        mapName: targetMapName,
        content: targetContent.trim(),
      });
      showToast(`Strategi "${targetTitle.trim()}" berhasil dikirim ke Discord!`);
    } catch (err) {
      console.error("Discord strategy send error:", err);
      showToast("Gagal mengirim ke Discord: " + err.message, "error");
    } finally {
      setSendingDiscord(false);
    }
  };

  const handleDelete = async (id, titleText) => {
    if (!confirm(`Delete strategy "${titleText}"?`)) return;

    // Optimistic removal
    setStrategies((prev) => prev.filter((s) => s.id !== id));
    handleNew();

    try {
      await deleteStrategy(id);
      loadStrategies(true);
      showToast(`Strategi "${titleText}" berhasil dihapus.`);
    } catch (err) {
      console.error("Delete strategy error:", err);
      showToast("Failed to delete: " + err.message, "error");
      loadStrategies(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Guild Strategies & Tactical Notes
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Document match tactics, lane compositions, callouts, and guides
          </p>
        </div>

        <button
          type="button"
          onClick={handleNew}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-red-600 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-500"
        >
          <Plus className="size-3.5" />
          <span>New Strategy</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {/* 2-COLUMN LAYOUT: LIST + EDITOR */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* STRATEGIES SIDEBAR */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Saved Documents ({strategies.length})
          </h3>

          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {loading && strategies.length === 0 ? (
              <div className="space-y-2.5 animate-pulse">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-2"
                  >
                    <div className="h-4 w-16 rounded bg-zinc-100" />
                    <div className="h-5 w-4/5 rounded bg-zinc-200" />
                    <div className="h-3 w-1/2 rounded bg-zinc-100" />
                  </div>
                ))}
              </div>
            ) : strategies.length === 0 ? (
              <EmptyState
                icon={ScrollText}
                title="No strategies saved"
                description="Click 'New Strategy' to write match tactics."
              />
            ) : (
              strategies.map((s) => (
                <div
                  key={s.id}
                  onClick={() => selectStrategy(s)}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    selectedId === s.id
                      ? "border-red-600 bg-red-50/40 shadow-sm"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                        {s.category || "General"}
                      </span>
                      <h4 className="mt-1.5 truncate text-sm font-bold text-zinc-900">
                        {s.title}
                      </h4>
                      {s.mapName && (
                        <p className="text-[11px] text-zinc-500">
                          Map: {s.mapName}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        title="Send to Discord"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendDiscord(s);
                        }}
                        disabled={sendingDiscord}
                        className="p-1 rounded-lg text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                      >
                        <Send className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        title="Delete Strategy"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(s.id, s.title);
                        }}
                        className="p-1 rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* EDITOR AREA */}
        <div className="lg:col-span-8">
          <form
            onSubmit={handleSave}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-4">
              <h3 className="text-base font-bold text-zinc-900">
                {selectedId ? "Edit Strategy Document" : "Create New Strategy"}
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={sendingDiscord || (!title.trim() && !content.trim())}
                  onClick={() => handleSendDiscord()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500 disabled:opacity-50 transition"
                >
                  <Send className="size-3.5" />
                  <span>{sendingDiscord ? "Sending..." : "Push to Discord"}</span>
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-500 disabled:opacity-50 transition"
                >
                  <Save className="size-3.5" />
                  <span>{saving ? "Saving..." : "Save Document"}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700">
                Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 10v10 Node Tactic - Mid Rush & Flank"
                className="mt-1 h-10 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-300 bg-white px-3 text-xs text-zinc-900"
                >
                  <option value="General">General</option>
                  <option value="Guild League">Guild League</option>
                  <option value="Node War">Node War</option>
                  <option value="Siege">Siege</option>
                  <option value="Class Guide">Class Guide</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700">
                  Target Map / Arena
                </label>
                <input
                  type="text"
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  placeholder="e.g. Arena of Solare / Valencia"
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-300 bg-white px-3 text-xs text-zinc-900 focus:border-red-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700">
                Strategy Content (Markdown / Guide)
              </label>
              <textarea
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write tactics, key callouts, buff rotations, positioning guidelines..."
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-3 font-mono text-xs text-zinc-900 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
          </form>
        </div>
      </div>

      {/* FLOATING TOAST FEEDBACK */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-zinc-900/10 bg-zinc-900 px-4 py-3 text-xs font-semibold text-white shadow-xl backdrop-blur-sm animate-in slide-in-from-bottom-5 duration-200">
          {toast.type === "error" ? (
            <AlertCircle className="size-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 rounded-lg p-0.5 text-zinc-400 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

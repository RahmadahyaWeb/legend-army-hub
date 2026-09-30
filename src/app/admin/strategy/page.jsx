"use client";

import { useEffect, useState } from "react";
import {
  Bold,
  Code,
  FileText,
  Heading1,
  Heading2,
  Italic,
  List,
  Pencil,
  Plus,
  Save,
  ScrollText,
  Trash2,
  X,
} from "lucide-react";
import { fetchStrategies, saveStrategy, deleteStrategy } from "@/lib/api";

function formatDate(timestamp) {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

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
  const [error, setError] = useState("");

  const loadStrategies = async () => {
    try {
      setLoading(true);
      const data = await fetchStrategies();
      setStrategies(data);
      if (data.length > 0 && !selectedId) {
        selectStrategy(data[0]);
      }
      setError("");
    } catch (err) {
      console.error("Strategy load error:", err);
      setError(err.message || "Failed to load strategies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStrategies();
  }, []);

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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Title is required");
      return;
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

      await loadStrategies();
      if (res.strategy) selectStrategy(res.strategy);
    } catch (err) {
      console.error("Save strategy error:", err);
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, titleText) => {
    if (!confirm(`Delete strategy "${titleText}"?`)) return;

    try {
      await deleteStrategy(id);
      handleNew();
      loadStrategies();
    } catch (err) {
      console.error("Delete strategy error:", err);
      alert("Failed to delete: " + err.message);
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
            {loading ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-xs text-zinc-500">
                Loading strategies...
              </div>
            ) : strategies.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-xs text-zinc-500">
                No strategy documents found. Click "New Strategy" to create one.
              </div>
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
                        <p className="text-[11px] text-zinc-500">Map: {s.mapName}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(s.id, s.title);
                      }}
                      className="text-zinc-400 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
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
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <h3 className="text-base font-bold text-zinc-900">
                {selectedId ? "Edit Strategy Document" : "Create New Strategy"}
              </h3>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-500 disabled:opacity-50"
              >
                <Save className="size-3.5" />
                <span>{saving ? "Saving..." : "Save Document"}</span>
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700">Title</label>
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
                <label className="text-xs font-semibold text-zinc-700">Category</label>
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
    </div>
  );
}

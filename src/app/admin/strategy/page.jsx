"use client";

import { useEffect, useState } from "react";
import { fetchStrategies, saveStrategy, deleteStrategy } from "@/lib/api";
import { sendStrategyToDiscord } from "@/services/strategy/strategyDiscordService";
import Loading from "@/components/ui/Loading";
import { useToast } from "@/components/ui/ToastProvider";
import StrategyList from "@/components/strategy/StrategyList";
import StrategyEditor from "@/components/strategy/StrategyEditor";

/**
 * Strategy Management Hub
 *
 * Why this exists:
 * Officers document battle tactics, role duties, MVP spawn timers, and lane guides,
 * and directly broadcast them to Discord voice/chat channels.
 */
export default function StrategyPage() {
  const { success, error: toastError } = useToast();

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
    } catch (err) {
      console.error("Strategy load error:", err);
      toastError("Failed to load strategies", err.message);
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
      toastError("Validation Error", "Strategy title is required.");
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

      success("Playbook saved", `"${title.trim()}" has been saved.`);
      await loadStrategies(true);
      if (res?.strategy?.id) {
        setSelectedId(res.strategy.id);
      }
    } catch (err) {
      console.error("Save strategy error:", err);
      toastError("Failed to save playbook", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm(`Are you sure you want to delete playbook "${title}"?`)) return;

    try {
      await deleteStrategy(selectedId);
      success("Playbook deleted", `"${title}" has been removed.`);
      handleNew();
      loadStrategies(true);
    } catch (err) {
      console.error("Delete strategy error:", err);
      toastError("Failed to delete", err.message);
    }
  };

  const handleSendDiscord = async () => {
    if (!title.trim() || !content.trim()) {
      toastError("Incomplete document", "Both title and content are required to broadcast.");
      return;
    }

    setSendingDiscord(true);
    try {
      await sendStrategyToDiscord({
        title,
        category,
        mapName,
        content,
      });
      success("Discord broadcast sent", "Tactical strategy dispatched to Discord.");
    } catch (err) {
      console.error("Send discord error:", err);
      toastError("Discord push failed", err.message);
    } finally {
      setSendingDiscord(false);
    }
  };

  if (loading) {
    return <Loading message="Loading playbooks..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
          Tactical Strategies
        </h1>
        <p className="mt-0.5 text-xs text-zinc-500">
          Create, edit, and broadcast strategic guidelines and rotations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 sm:gap-6">
        <StrategyList
          strategies={strategies}
          selectedId={selectedId}
          onSelect={selectStrategy}
          onNew={handleNew}
        />

        <StrategyEditor
          selectedId={selectedId}
          title={title}
          category={category}
          mapName={mapName}
          content={content}
          saving={saving}
          sendingDiscord={sendingDiscord}
          onSave={handleSave}
          onSendDiscord={handleSendDiscord}
          onDelete={handleDelete}
          setTitle={setTitle}
          setCategory={setCategory}
          setMapName={setMapName}
          setContent={setContent}
        />
      </div>
    </div>
  );
}

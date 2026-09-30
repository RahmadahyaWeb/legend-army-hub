import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  Bold,
  Check,
  ChevronDown,
  Code,
  Eye,
  Hash,
  Heading1,
  Heading2,
  Italic,
  List,
  MessageSquareQuote,
  Pencil,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";

import { db } from "../lib/firebase";
import { useToast } from "../components/ui/ToastProvider";

const EMPTY_FORM = {
  title: "",
  content: "",
};

function formatDate(timestamp) {
  if (!timestamp?.toDate) {
    return "—";
  }

  return timestamp.toDate().toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function insertMarkdown(
  textarea,
  content,
  setContent,
  before,
  after = "",
  fallback = "",
) {
  if (!textarea) {
    return;
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const selectedText = content.substring(start, end);
  const text = selectedText || fallback;

  const nextContent =
    content.substring(0, start) +
    before +
    text +
    after +
    content.substring(end);

  setContent(nextContent);

  requestAnimationFrame(() => {
    textarea.focus();

    const cursorStart = start + before.length;
    const cursorEnd = cursorStart + text.length;

    textarea.setSelectionRange(cursorStart, cursorEnd);
  });
}

function DiscordPreview({ title, content }) {
  const lines = String(content || "").split("\n");

  const renderInline = (text, keyPrefix) => {
    const parts = [];
    const regex =
      /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|https?:\/\/[^\s]+)/g;

    let lastIndex = 0;
    let match;
    let index = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`${keyPrefix}-text-${index}`}>
            {text.slice(lastIndex, match.index)}
          </span>,
        );
      }

      const token = match[0];

      if (token.startsWith("**") && token.endsWith("**")) {
        parts.push(
          <strong key={`${keyPrefix}-bold-${index}`}>
            {token.slice(2, -2)}
          </strong>,
        );
      } else if (token.startsWith("__") && token.endsWith("__")) {
        parts.push(
          <u key={`${keyPrefix}-underline-${index}`}>{token.slice(2, -2)}</u>,
        );
      } else if (
        (token.startsWith("*") && token.endsWith("*")) ||
        (token.startsWith("_") && token.endsWith("_"))
      ) {
        parts.push(
          <em key={`${keyPrefix}-italic-${index}`}>{token.slice(1, -1)}</em>,
        );
      } else if (token.startsWith("`") && token.endsWith("`")) {
        parts.push(
          <code
            key={`${keyPrefix}-code-${index}`}
            className="rounded bg-zinc-950 px-1 py-0.5 font-mono text-[13px] text-zinc-200"
          >
            {token.slice(1, -1)}
          </code>,
        );
      } else if (token.startsWith("http")) {
        parts.push(
          <span key={`${keyPrefix}-url-${index}`} className="text-[#00a8fc]">
            {token}
          </span>,
        );
      }

      lastIndex = regex.lastIndex;
      index += 1;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={`${keyPrefix}-end`}>{text.slice(lastIndex)}</span>);
    }

    return parts;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-700 bg-[#313338]">
      <div className="border-b border-zinc-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            X
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">XKGBOT</span>

              <span className="rounded bg-[#5865f2] px-1 py-0.5 text-[9px] font-bold uppercase leading-none text-white">
                APP
              </span>
            </div>

            <div className="text-[10px] text-zinc-400">Today at 20:00</div>
          </div>
        </div>
      </div>

      <div className="min-h-72 px-4 py-4">
        {title ? (
          <div className="mb-3 text-base font-semibold text-white">{title}</div>
        ) : null}

        {!content.trim() ? (
          <div className="text-sm text-zinc-500">
            Discord preview will appear here.
          </div>
        ) : (
          <div className="space-y-1 text-sm leading-[1.375rem] text-zinc-200">
            {lines.map((line, index) => {
              const key = `line-${index}`;

              if (!line) {
                return <div key={key} className="h-2" />;
              }

              if (line.startsWith("### ")) {
                return (
                  <div
                    key={key}
                    className="pt-1 text-base font-bold text-white"
                  >
                    {renderInline(line.slice(4), key)}
                  </div>
                );
              }

              if (line.startsWith("## ")) {
                return (
                  <div key={key} className="pt-2 text-lg font-bold text-white">
                    {renderInline(line.slice(3), key)}
                  </div>
                );
              }

              if (line.startsWith("# ")) {
                return (
                  <div key={key} className="pt-2 text-xl font-bold text-white">
                    {renderInline(line.slice(2), key)}
                  </div>
                );
              }

              if (line.startsWith("> ")) {
                return (
                  <div
                    key={key}
                    className="border-l-4 border-zinc-500 pl-3 text-zinc-300"
                  >
                    {renderInline(line.slice(2), key)}
                  </div>
                );
              }

              if (line.startsWith("- ") || line.startsWith("* ")) {
                return (
                  <div key={key} className="flex gap-2 pl-1">
                    <span>•</span>

                    <span>{renderInline(line.slice(2), key)}</span>
                  </div>
                );
              }

              return <div key={key}>{renderInline(line, key)}</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Strategy() {
  const toast = useToast();

  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showPreview, setShowPreview] = useState(true);

  const textareaId = "strategy-content";

  useEffect(() => {
    const strategiesQuery = query(
      collection(db, "strategies"),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      strategiesQuery,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setStrategies(data);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load strategies:", error);

        toast.error("Load failed", "Failed to load strategy data.");

        setLoading(false);
      },
    );

    return unsubscribe;
  }, [toast]);

  const selectedStrategy = useMemo(
    () => strategies.find((strategy) => strategy.id === selectedId) ?? null,
    [strategies, selectedId],
  );

  const handleNew = () => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
  };

  const handleSelect = (strategy) => {
    setSelectedId(strategy.id);

    setForm({
      title: strategy.title || "",
      content: strategy.content || "",
    });
  };

  const handleSave = async () => {
    const title = form.title.trim();
    const content = form.content.trim();

    if (!title) {
      toast.error("Title required", "Strategy title is required.");

      return;
    }

    if (!content) {
      toast.error("Message required", "Strategy message is required.");

      return;
    }

    setSaving(true);

    try {
      if (selectedId) {
        await updateDoc(doc(db, "strategies", selectedId), {
          title,
          content,
          status: selectedStrategy?.status || "draft",
          updatedAt: serverTimestamp(),
        });

        toast.success("Strategy saved", "Strategy has been updated.");
      } else {
        const reference = await addDoc(collection(db, "strategies"), {
          title,
          content,
          status: "draft",
          sentToDiscordAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setSelectedId(reference.id);

        toast.success("Strategy saved", "Strategy has been created.");
      }
    } catch (error) {
      console.error("Failed to save strategy:", error);

      toast.error("Save failed", "Strategy could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || deleting) {
      return;
    }

    const confirmed = window.confirm("Delete this strategy?");

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await deleteDoc(doc(db, "strategies", selectedId));

      setSelectedId(null);
      setForm(EMPTY_FORM);

      toast.success("Strategy deleted", "Strategy has been deleted.");
    } catch (error) {
      console.error("Failed to delete strategy:", error);

      toast.error("Delete failed", "Strategy could not be deleted.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSendDiscord = async () => {
    if (sending) {
      return;
    }

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title || !content) {
      toast.error("Strategy incomplete", "Title and message are required.");

      return;
    }

    setSending(true);

    try {
      const response = await fetch(
        "https://legend-army-discord.legendarmy.workers.dev/strategy",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            title,
            content,
          }),
        },
      );

      const responseType = response.headers.get("content-type") || "";

      let data = null;

      if (responseType.includes("application/json")) {
        data = await response.json().catch(() => null);
      } else {
        const responseText = await response.text().catch(() => "");

        data = responseText
          ? {
              message: responseText,
            }
          : null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Worker returned HTTP ${response.status}.`,
        );
      }

      if (selectedId) {
        await updateDoc(doc(db, "strategies", selectedId), {
          status: "published",
          sentToDiscordAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const reference = await addDoc(collection(db, "strategies"), {
          title,
          content,
          status: "published",
          sentToDiscordAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setSelectedId(reference.id);
      }

      toast.success(
        "Sent to Discord",
        "Strategy has been published to Discord.",
      );
    } catch (error) {
      console.error("Failed to send strategy to Discord:", error);

      toast.error(
        "Discord failed",
        error?.message || "Strategy could not be sent to Discord.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleMarkdown = (before, after = "", fallback = "") => {
    const textarea = document.getElementById(textareaId);

    insertMarkdown(
      textarea,
      form.content,
      (content) =>
        setForm((current) => ({
          ...current,
          content,
        })),
      before,
      after,
      fallback,
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Legend Army</p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-content-strong sm:text-3xl">
            Strategy
          </h1>

          <p className="mt-1 text-sm text-content-muted">
            Create and publish Discord-formatted guild strategies.
          </p>
        </div>

        <button
          type="button"
          onClick={handleNew}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-4 text-sm font-medium text-content transition hover:bg-surface-100"
        >
          <Plus className="size-4" />
          New Strategy
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside>
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold text-content-strong">
                Strategies
              </h2>
            </div>

            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="size-5 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
              </div>
            ) : strategies.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-content-muted">
                No strategies yet.
              </div>
            ) : (
              <div className="divide-y divide-line">
                {strategies.map((strategy) => (
                  <button
                    key={strategy.id}
                    type="button"
                    onClick={() => handleSelect(strategy)}
                    className={[
                      "w-full px-4 py-3 text-left transition",
                      selectedId === strategy.id
                        ? "bg-brand-50"
                        : "hover:bg-surface-100",
                    ].join(" ")}
                  >
                    <div className="truncate text-sm font-medium text-content-strong">
                      {strategy.title}
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span
                        className={[
                          "text-[10px] font-semibold uppercase tracking-wider",
                          strategy.status === "published"
                            ? "text-emerald-600"
                            : "text-amber-600",
                        ].join(" ")}
                      >
                        {strategy.status || "draft"}
                      </span>

                      <span className="truncate text-[10px] text-content-subtle">
                        {formatDate(strategy.updatedAt)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-content-strong">
                    {selectedId ? "Edit Strategy" : "New Strategy"}
                  </h2>

                  <p className="mt-1 text-xs text-content-muted">
                    Discord Markdown is supported.
                  </p>
                </div>

                {selectedStrategy && (
                  <div
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                      selectedStrategy.status === "published"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700",
                    ].join(" ")}
                  >
                    {selectedStrategy.status === "published" ? (
                      <Check className="size-3" />
                    ) : (
                      <Pencil className="size-3" />
                    )}

                    {selectedStrategy.status || "draft"}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label
                  htmlFor="strategy-title"
                  className="mb-2 block text-sm font-medium text-content-strong"
                >
                  Title
                </label>

                <input
                  id="strategy-title"
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Guild League Strategy"
                  className="h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-content-strong outline-none transition placeholder:text-content-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor={textareaId}
                    className="text-sm font-medium text-content-strong"
                  >
                    Message
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowPreview((current) => !current)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-content-muted transition hover:text-content-strong"
                  >
                    <Eye className="size-3.5" />
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </button>
                </div>

                <div className="overflow-hidden rounded-lg border border-line-strong">
                  <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface-100 p-2">
                    <button
                      type="button"
                      title="Heading 1"
                      onClick={() => handleMarkdown("# ", "", "Heading")}
                      className="flex size-8 items-center justify-center rounded text-content-muted transition hover:bg-white hover:text-content-strong"
                    >
                      <Heading1 className="size-4" />
                    </button>

                    <button
                      type="button"
                      title="Heading 2"
                      onClick={() => handleMarkdown("## ", "", "Heading")}
                      className="flex size-8 items-center justify-center rounded text-content-muted transition hover:bg-white hover:text-content-strong"
                    >
                      <Heading2 className="size-4" />
                    </button>

                    <div className="mx-1 h-5 w-px bg-line" />

                    <button
                      type="button"
                      title="Bold"
                      onClick={() => handleMarkdown("**", "**", "bold text")}
                      className="flex size-8 items-center justify-center rounded text-content-muted transition hover:bg-white hover:text-content-strong"
                    >
                      <Bold className="size-4" />
                    </button>

                    <button
                      type="button"
                      title="Italic"
                      onClick={() => handleMarkdown("*", "*", "italic text")}
                      className="flex size-8 items-center justify-center rounded text-content-muted transition hover:bg-white hover:text-content-strong"
                    >
                      <Italic className="size-4" />
                    </button>

                    <button
                      type="button"
                      title="Inline code"
                      onClick={() => handleMarkdown("`", "`", "code")}
                      className="flex size-8 items-center justify-center rounded text-content-muted transition hover:bg-white hover:text-content-strong"
                    >
                      <Code className="size-4" />
                    </button>

                    <div className="mx-1 h-5 w-px bg-line" />

                    <button
                      type="button"
                      title="Bullet List"
                      onClick={() => handleMarkdown("- ", "", "List item")}
                      className="flex size-8 items-center justify-center rounded text-content-muted transition hover:bg-white hover:text-content-strong"
                    >
                      <List className="size-4" />
                    </button>

                    <button
                      type="button"
                      title="Quote"
                      onClick={() =>
                        handleMarkdown("> ", "", "Important information")
                      }
                      className="flex size-8 items-center justify-center rounded text-content-muted transition hover:bg-white hover:text-content-strong"
                    >
                      <MessageSquareQuote className="size-4" />
                    </button>

                    <button
                      type="button"
                      title="Mention Everyone"
                      onClick={() => handleMarkdown("", "", "@everyone")}
                      className="flex size-8 items-center justify-center rounded text-content-muted transition hover:bg-white hover:text-content-strong"
                    >
                      <Hash className="size-4" />
                    </button>
                  </div>

                  <textarea
                    id={textareaId}
                    value={form.content}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        content: event.target.value,
                      }))
                    }
                    placeholder={`# ⚔️ GUILD LEAGUE STRATEGY

## 🔴 MID TEAM
**Main Objective:** Push Mid Crystal

- Team 1 → Push Mid
- Team 2 → Support Mid

## ⚠️ IMPORTANT
> Follow the Raid Leader command.

@everyone`}
                    className="min-h-[420px] w-full resize-y bg-white p-4 font-mono text-sm leading-6 text-content-strong outline-none placeholder:text-content-subtle"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {selectedId && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting || saving || sending}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {deleting ? (
                      <span className="size-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    Delete
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || sending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-4 text-sm font-medium text-content transition hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={handleSendDiscord}
                  disabled={sending || saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Send to Discord
                </button>
              </div>
            </div>
          </section>

          {showPreview && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-content-strong">
                    Discord Preview
                  </h2>

                  <p className="mt-1 text-xs text-content-muted">
                    Preview of the strategy message.
                  </p>
                </div>

                <ChevronDown className="size-4 text-content-subtle" />
              </div>

              <DiscordPreview title={form.title} content={form.content} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

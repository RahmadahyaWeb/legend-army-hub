"use client";

import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { importMembers } from "@/lib/api";

export default function ImportMembersModal({ open, onClose, onSuccess }) {
  const inputRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [step, setStep] = useState("upload");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const normalizedMembers = useMemo(() => {
    return rows.map((row, index) => {
      // Find key matching ignoring case
      const getVal = (keys) => {
        for (const k of keys) {
          const matched = Object.keys(row).find(
            (rk) => rk.toLowerCase().trim() === k.toLowerCase().trim()
          );
          if (matched && row[matched] !== undefined) return String(row[matched]).trim();
        }
        return "";
      };

      const nickname = getVal(["nickname", "player", "name", "character"]);
      const className = getVal(["class", "className", "job", "class_name"]);
      const rawLevel = getVal(["level", "lv", "lv."]);
      const rawGearScore = getVal(["gearscore", "gear score", "gr", "gear_score", "gs"]);
      const role = getVal(["role", "position", "rank"]) || "Member";

      const level = rawLevel && !Number.isNaN(Number(rawLevel)) ? Number(rawLevel) : 0;
      const cleanGs = rawGearScore.replace(/,/g, "");
      const gearScore = cleanGs && !Number.isNaN(Number(cleanGs)) ? Number(cleanGs) : 0;

      const errors = [];
      if (!nickname) errors.push("Nickname / Player name required");
      if (!className) errors.push("Class required");

      return {
        rowNumber: index + 2,
        nickname,
        className,
        level,
        gearScore,
        role,
        isActive: true,
        errors,
        isValid: errors.length === 0,
      };
    });
  }, [rows]);

  const validMembers = useMemo(() => {
    return normalizedMembers.filter((m) => m.isValid);
  }, [normalizedMembers]);

  const invalidMembers = useMemo(() => {
    return normalizedMembers.filter((m) => !m.isValid);
  }, [normalizedMembers]);

  if (!open) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setError("No valid rows found in the CSV file.");
          return;
        }
        setRows(results.data);
        setStep("preview");
      },
      error: (parseError) => {
        console.error("CSV parse error:", parseError);
        setError("Failed to parse CSV file: " + parseError.message);
      },
    });
  };

  const handleImport = async () => {
    if (validMembers.length === 0) return;

    setImporting(true);
    setError("");

    try {
      const payload = validMembers.map((m) => ({
        nickname: m.nickname,
        className: m.className,
        level: m.level,
        gearScore: m.gearScore,
        role: m.role,
        isActive: true,
      }));

      const res = await importMembers(payload);
      setImportResult(res);
      setStep("success");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Import error:", err);
      setError(err.message || "Failed to import members.");
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFileName("");
    setRows([]);
    setError("");
    setStep("upload");
    setImportResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* MODAL HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-red-700">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Import Members from CSV
              </h3>
              <p className="text-xs text-zinc-500">
                Batch upload and update guild roster data
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "upload" && (
            <div className="space-y-4">
              <div
                onClick={() => inputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 p-10 text-center transition hover:border-red-500 hover:bg-red-50/20"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-700">
                  <Upload className="size-6" />
                </div>
                <h4 className="mt-4 text-sm font-bold text-zinc-900">
                  Click to select CSV file
                </h4>
                <p className="mt-1 text-xs text-zinc-500">
                  File should contain columns like Player, Class, Level, Gear Score
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </div>
              )}
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-900">
                    {fileName}
                  </span>
                  <p className="text-xs text-zinc-500">
                    Found {rows.length} total rows ({validMembers.length} valid,{" "}
                    {invalidMembers.length} errors)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Choose other file</span>
                </button>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* PREVIEW TABLE */}
              <div className="max-h-64 overflow-y-auto rounded-xl border border-zinc-200">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-zinc-100 text-zinc-700">
                    <tr>
                      <th className="p-2.5">Player</th>
                      <th className="p-2.5">Class</th>
                      <th className="p-2.5">Level</th>
                      <th className="p-2.5">Gear Score</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {normalizedMembers.slice(0, 50).map((m, i) => (
                      <tr key={i} className={m.isValid ? "" : "bg-red-50/50"}>
                        <td className="p-2.5 font-semibold text-zinc-900">
                          {m.nickname || "—"}
                        </td>
                        <td className="p-2.5 text-zinc-600">{m.className || "—"}</td>
                        <td className="p-2.5 text-zinc-600">{m.level || "—"}</td>
                        <td className="p-2.5 text-zinc-600">{m.gearScore || "—"}</td>
                        <td className="p-2.5">
                          {m.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <CheckCircle2 className="size-3.5" /> Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700 font-semibold">
                              <XCircle className="size-3.5" /> {m.errors.join(", ")}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-8 text-center space-y-3">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-7" />
              </div>
              <h4 className="text-base font-bold text-zinc-900">
                Members Imported Successfully!
              </h4>
              <p className="text-xs text-zinc-500">
                {validMembers.length} member profiles have been saved to the guild roster.
              </p>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-4">
          {step === "preview" && (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={importing}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || validMembers.length === 0}
                className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-red-500 disabled:opacity-50"
              >
                {importing ? "Importing..." : `Import ${validMembers.length} Members`}
              </button>
            </>
          )}

          {step === "upload" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
          )}

          {step === "success" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white shadow hover:bg-zinc-800"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

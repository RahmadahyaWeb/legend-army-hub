"use client";

import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { importMembers } from "@/lib/api";
import Button from "@/components/ui/Button";

/**
 * Modal component for bulk CSV/spreadsheet import of guild members.
 * Why this exists:
 * Parses member CSV rosters client-side, normalizes player attributes (nickname, class,
 * level, gear score), shows a retro tactical preview table, and batch inserts records.
 *
 * @param {object} props
 * @param {boolean} props.open - Modal visibility state
 * @param {Function} props.onClose - Modal close handler
 * @param {Function} [props.onSuccess] - Callback when import finishes successfully
 */
export default function ImportMembersModal({ open, onClose, onSuccess }) {
  const inputRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [step, setStep] = useState("upload");
  const [importing, setImporting] = useState(false);
  const [_importResult, setImportResult] = useState(null);

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
      if (!nickname) errors.push("Nickname required");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden border-2 border-zinc-950 bg-white shadow-[6px_6px_0px_#09090b]">
        {/* MODAL HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b-2 border-zinc-950 bg-zinc-50 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center border-2 border-zinc-950 bg-white text-zinc-950 shadow-[1px_1px_0px_#09090b]">
              <FileSpreadsheet className="size-4.5" />
            </div>
            <div>
              <h3 className="font-pixel text-lg font-bold text-zinc-950">
                Import Members from CSV
              </h3>
              <p className="text-[11px] font-mono text-zinc-600">
                Batch upload and update guild roster data
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center border-2 border-zinc-950 bg-white text-zinc-950 hover:bg-zinc-100 shadow-[1px_1px_0px_#09090b] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {step === "upload" && (
            <div className="space-y-4">
              <div
                onClick={() => inputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-zinc-950 bg-zinc-50 p-10 text-center transition hover:bg-zinc-100"
              >
                <div className="flex size-11 items-center justify-center border-2 border-zinc-950 bg-white text-zinc-950 shadow-[2px_2px_0px_#09090b]">
                  <Upload className="size-5" />
                </div>
                <h4 className="mt-3 font-pixel text-base font-bold text-zinc-950">
                  Select CSV File to Upload
                </h4>
                <p className="mt-1 text-xs font-mono text-zinc-600">
                  Columns: Player, Class, Level, Gear Score, Role
                </p>
                <span className="mt-3 inline-block border-2 border-zinc-950 bg-white px-3 py-1 text-xs font-mono font-bold text-zinc-950 shadow-[2px_2px_0px_#09090b]">
                  Browse File
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {error && (
                <div className="border-2 border-red-600 bg-red-50 p-3 text-xs font-mono font-bold text-red-700 shadow-[2px_2px_0px_#b91c1c]">
                  {error}
                </div>
              )}
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
                <div>
                  <span className="text-xs font-mono font-bold text-zinc-950">
                    {fileName}
                  </span>
                  <p className="text-xs font-mono text-zinc-600">
                    Found {rows.length} total rows ({validMembers.length} valid,{" "}
                    {invalidMembers.length} errors)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 border border-zinc-950 bg-white px-2 py-1 text-xs font-mono font-bold text-zinc-950 hover:bg-zinc-100 shadow-[1px_1px_0px_#09090b]"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Choose other file</span>
                </button>
              </div>

              {error && (
                <div className="border-2 border-red-600 bg-red-50 p-3 text-xs font-mono font-bold text-red-700 shadow-[2px_2px_0px_#b91c1c]">
                  {error}
                </div>
              )}

              {/* PREVIEW TABLE */}
              <div className="max-h-64 overflow-y-auto border-2 border-zinc-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="sticky top-0 border-b-2 border-zinc-950 bg-zinc-100 text-zinc-900 font-bold uppercase">
                    <tr>
                      <th className="p-2.5">Player</th>
                      <th className="p-2.5">Class</th>
                      <th className="p-2.5">Level</th>
                      <th className="p-2.5">Gear Score</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-zinc-200 bg-white">
                    {normalizedMembers.slice(0, 50).map((m, i) => (
                      <tr key={i} className={m.isValid ? "hover:bg-zinc-50" : "bg-red-50"}>
                        <td className="p-2.5 font-bold text-zinc-950">
                          {m.nickname || "—"}
                        </td>
                        <td className="p-2.5 text-zinc-700">{m.className || "—"}</td>
                        <td className="p-2.5 text-zinc-700">{m.level || "—"}</td>
                        <td className="p-2.5 text-zinc-700 font-bold">{m.gearScore || "—"}</td>
                        <td className="p-2.5">
                          {m.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-800 font-bold">
                              <CheckCircle2 className="size-3.5" /> Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700 font-bold">
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
              <div className="mx-auto flex size-12 items-center justify-center border-2 border-emerald-900 bg-emerald-100 text-emerald-900 shadow-[2px_2px_0px_#064e3b]">
                <CheckCircle2 className="size-7" />
              </div>
              <h4 className="font-pixel text-lg font-bold text-zinc-950">
                Members Imported Successfully!
              </h4>
              <p className="text-xs font-mono text-zinc-600">
                {validMembers.length} member profiles have been saved to the guild roster.
              </p>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex justify-end gap-2.5 border-t-2 border-zinc-950 bg-zinc-50 px-5 py-3.5">
          {step === "preview" && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                disabled={importing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleImport}
                loading={importing}
                disabled={validMembers.length === 0}
              >
                {importing ? "Importing..." : `Import ${validMembers.length} Members`}
              </Button>
            </>
          )}

          {step === "upload" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
          )}

          {step === "success" && (
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
            >
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

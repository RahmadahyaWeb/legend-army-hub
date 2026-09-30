import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  Upload,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";

import { db } from "../../lib/firebase";
import { useToast } from "../ui/ToastProvider";

export default function ImportMembersModal({ open, onClose }) {
  const inputRef = useRef(null);
  const toast = useToast();

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [step, setStep] = useState("upload");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [checking, setChecking] = useState(false);
  const [importPlan, setImportPlan] = useState(null);

  const normalizedMembers = useMemo(() => {
    return rows.map((row, index) => {
      const nickname = String(row.player ?? "").trim();

      const className = String(row.class ?? "").trim();

      const title = String(row.title ?? "").trim();

      const gender = String(row.gender ?? "")
        .trim()
        .toUpperCase();

      const position = String(row.position ?? "").trim();

      const rawLevel = String(row["lv."] ?? row.lv ?? "").trim();

      const rawGearScore = String(
        row.gr ?? row["gear score"] ?? row.gearscore ?? "",
      ).trim();

      const sourceId = String(row.id ?? "").trim();

      const level =
        rawLevel !== "" && !Number.isNaN(Number(rawLevel))
          ? Number(rawLevel)
          : null;

      const normalizedGearScore = rawGearScore.replace(/,/g, "");

      const gearScore =
        normalizedGearScore !== "" && !Number.isNaN(Number(normalizedGearScore))
          ? Number(normalizedGearScore)
          : null;

      const nicknameNormalized = nickname.toLowerCase();

      const errors = [];

      if (!nickname) {
        errors.push("Player is required");
      }

      if (!className) {
        errors.push("Class is required");
      }

      if (level === null) {
        errors.push("Invalid level");
      }

      if (gearScore === null) {
        errors.push("Invalid gear score");
      }

      if (gender && gender !== "M" && gender !== "F") {
        errors.push("Invalid gender");
      }

      return {
        rowNumber: index + 2,
        sourceId,
        nickname,
        nicknameNormalized,
        level,
        gearScore,
        className,
        title,
        gender,
        position,
        isValid: errors.length === 0,
        errors,
      };
    });
  }, [rows]);

  const duplicateRows = useMemo(() => {
    const sourceIds = new Map();
    const nicknames = new Map();
    const duplicates = new Set();

    normalizedMembers.forEach((member, index) => {
      if (member.sourceId) {
        const key = member.sourceId.toLowerCase();

        if (sourceIds.has(key)) {
          duplicates.add(index);
          duplicates.add(sourceIds.get(key));
        } else {
          sourceIds.set(key, index);
        }
      }

      if (member.nicknameNormalized) {
        const key = member.nicknameNormalized;

        if (nicknames.has(key)) {
          duplicates.add(index);
          duplicates.add(nicknames.get(key));
        } else {
          nicknames.set(key, index);
        }
      }
    });

    return duplicates;
  }, [normalizedMembers]);

  const validatedMembers = useMemo(() => {
    return normalizedMembers.map((member, index) => {
      if (!duplicateRows.has(index)) {
        return member;
      }

      return {
        ...member,
        isValid: false,
        errors: [...member.errors, "Duplicate member in CSV"],
      };
    });
  }, [normalizedMembers, duplicateRows]);

  const validMembers = useMemo(
    () => validatedMembers.filter((member) => member.isValid),
    [validatedMembers],
  );

  const invalidMembers = useMemo(
    () => validatedMembers.filter((member) => !member.isValid),
    [validatedMembers],
  );

  if (!open) {
    return null;
  }

  const reset = () => {
    setFileName("");
    setRows([]);
    setError("");
    setImportError("");
    setImporting(false);
    setChecking(false);
    setImportPlan(null);
    setStep("upload");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (importing || checking) {
      return;
    }

    reset();
    onClose();
  };

  const handleFile = (file) => {
    setError("");
    setImportError("");
    setRows([]);
    setImportPlan(null);
    setStep("upload");

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file.");
      return;
    }

    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",

      transformHeader: (header) =>
        header
          .replace(/^\uFEFF/, "")
          .trim()
          .toLowerCase(),

      complete: (result) => {
        const validRows = result.data.filter((row) =>
          Object.values(row).some((value) => String(value ?? "").trim() !== ""),
        );

        if (validRows.length === 0) {
          setError("No valid data found in the CSV file.");
          return;
        }

        if (result.errors.length > 0) {
          console.warn("CSV parsing warnings:", result.errors);
        }

        setRows(validRows);
      },

      error: (parseError) => {
        console.error("CSV parsing error:", parseError);

        setError("Failed to read the CSV file.");
      },
    });
  };

  const buildImportPlan = async () => {
    setChecking(true);
    setImportError("");
    setImportPlan(null);

    try {
      const snapshot = await getDocs(collection(db, "members"));

      const existingMembers = snapshot.docs.map((memberDocument) => ({
        id: memberDocument.id,
        ...memberDocument.data(),
      }));

      const bySourceId = new Map();
      const byNickname = new Map();

      existingMembers.forEach((member) => {
        const sourceId = String(member.sourceId ?? "")
          .trim()
          .toLowerCase();

        const nicknameNormalized = String(
          member.nicknameNormalized ?? member.nickname ?? "",
        )
          .trim()
          .toLowerCase();

        if (sourceId) {
          bySourceId.set(sourceId, member);
        }

        if (nicknameNormalized) {
          byNickname.set(nicknameNormalized, member);
        }
      });

      const creates = [];
      const updates = [];

      validMembers.forEach((member) => {
        let existingMember = null;

        if (member.sourceId) {
          existingMember =
            bySourceId.get(member.sourceId.toLowerCase()) ?? null;
        }

        if (!existingMember) {
          existingMember = byNickname.get(member.nicknameNormalized) ?? null;
        }

        if (existingMember) {
          updates.push({
            member,
            documentId: existingMember.id,
          });
        } else {
          creates.push({
            member,
          });
        }
      });

      const plan = {
        creates,
        updates,
      };

      setImportPlan(plan);

      return plan;
    } catch (planError) {
      console.error("Failed to check existing members:", planError);

      setImportError("Failed to check existing members.");

      toast.error(
        "Unable to prepare import",
        "Existing member data could not be checked.",
      );

      return null;
    } finally {
      setChecking(false);
    }
  };

  const handleContinue = async () => {
    if (rows.length === 0) {
      return;
    }

    setImportError("");
    setStep("validation");

    if (invalidMembers.length === 0) {
      await buildImportPlan();
    }
  };

  const handleImport = async () => {
    if (
      validMembers.length === 0 ||
      invalidMembers.length > 0 ||
      importing ||
      checking
    ) {
      return;
    }

    setImporting(true);
    setImportError("");

    try {
      const plan = importPlan ?? (await buildImportPlan());

      if (!plan) {
        return;
      }

      const batch = writeBatch(db);

      plan.creates.forEach(({ member }) => {
        const memberRef = doc(collection(db, "members"));

        batch.set(memberRef, {
          sourceId: member.sourceId,
          nickname: member.nickname,
          nicknameNormalized: member.nicknameNormalized,
          level: member.level,
          gearScore: member.gearScore,
          className: member.className,
          title: member.title,
          gender: member.gender,
          position: member.position,
          guild: "Legend Army",
          discordId: "",
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      plan.updates.forEach(({ member, documentId }) => {
        const memberRef = doc(db, "members", documentId);

        batch.update(memberRef, {
          sourceId: member.sourceId,
          nickname: member.nickname,
          nicknameNormalized: member.nicknameNormalized,
          level: member.level,
          gearScore: member.gearScore,
          className: member.className,
          title: member.title,
          gender: member.gender,
          position: member.position,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      const newCount = plan.creates.length;

      const updatedCount = plan.updates.length;

      const totalCount = newCount + updatedCount;

      reset();
      onClose();

      toast.success(
        "Members imported successfully",
        `${totalCount} members processed · ${newCount} new · ${updatedCount} updated`,
      );
    } catch (importException) {
      console.error("Failed to import members:", importException);

      setImportError("Failed to import members. Please try again.");

      toast.error(
        "Import failed",
        "Member data could not be updated. Please try again.",
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden bg-white shadow-xl sm:max-w-5xl sm:rounded-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            {step === "validation" && (
              <button
                type="button"
                onClick={() => setStep("upload")}
                disabled={importing || checking}
                className="flex size-9 items-center justify-center rounded-lg text-content-muted transition hover:bg-surface-200 hover:text-content-strong disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Back"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}

            <div>
              <h2 className="text-base font-semibold text-content-strong">
                {step === "upload" ? "Import members" : "Review import"}
              </h2>

              <p className="mt-0.5 text-sm text-content-muted">
                {step === "upload"
                  ? "Upload member data from a CSV file."
                  : "Review changes before updating your member database."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={importing || checking}
            className="flex size-9 items-center justify-center rounded-lg text-content-muted transition hover:bg-surface-200 hover:text-content-strong disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />

          {step === "upload" && (
            <>
              {!fileName ? (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex min-h-52 w-full flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface-100 px-6 text-center transition hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <div className="flex size-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-line">
                    <Upload className="size-5 text-content-muted" />
                  </div>

                  <p className="mt-4 text-sm font-medium text-content-strong">
                    Choose a CSV file
                  </p>

                  <p className="mt-1 text-xs text-content-muted">
                    Select a file from your device.
                  </p>
                </button>
              ) : (
                <div>
                  <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-100 p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-line">
                      <FileSpreadsheet className="size-5 text-brand-600" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-content-strong">
                        {fileName}
                      </p>

                      <p className="mt-0.5 text-xs text-content-muted">
                        {rows.length} rows detected
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={reset}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      Change
                    </button>
                  </div>

                  {rows.length > 0 && (
                    <div className="mt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-medium text-content-strong">
                          CSV preview
                        </h3>

                        <span className="text-xs text-content-muted">
                          First 5 rows
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-line">
                        <table className="min-w-full text-left text-sm">
                          <thead className="border-b border-line bg-surface-100">
                            <tr>
                              {Object.keys(rows[0]).map((column) => (
                                <th
                                  key={column}
                                  className="whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-content-muted"
                                >
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-line">
                            {rows.slice(0, 5).map((row, index) => (
                              <tr key={index}>
                                {Object.keys(rows[0]).map((column) => (
                                  <td
                                    key={column}
                                    className="whitespace-nowrap px-4 py-3 text-content"
                                  >
                                    {row[column] || "—"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </>
          )}

          {step === "validation" && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-line">
                <div className="p-4">
                  <div className="text-xl font-semibold text-content-strong">
                    {validatedMembers.length}
                  </div>

                  <div className="mt-1 text-xs text-content-muted">
                    Total rows
                  </div>
                </div>

                <div className="border-x border-line p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />

                    <div className="text-xl font-semibold text-emerald-600">
                      {validMembers.length}
                    </div>
                  </div>

                  <div className="mt-1 text-xs text-content-muted">Valid</div>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle
                      className={`size-4 ${
                        invalidMembers.length > 0
                          ? "text-red-600"
                          : "text-content-subtle"
                      }`}
                    />

                    <div
                      className={`text-xl font-semibold ${
                        invalidMembers.length > 0
                          ? "text-red-600"
                          : "text-content-strong"
                      }`}
                    >
                      {invalidMembers.length}
                    </div>
                  </div>

                  <div className="mt-1 text-xs text-content-muted">Invalid</div>
                </div>
              </div>

              {invalidMembers.length === 0 && (
                <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line">
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <UserPlus className="size-4 text-emerald-600" />

                      <div className="text-xl font-semibold text-content-strong">
                        {checking
                          ? "—"
                          : importPlan
                            ? importPlan.creates.length
                            : "—"}
                      </div>
                    </div>

                    <div className="mt-1 text-xs text-content-muted">
                      New members
                    </div>
                  </div>

                  <div className="border-l border-line p-4">
                    <div className="flex items-center gap-2">
                      <RefreshCw
                        className={`size-4 text-brand-600 ${
                          checking ? "animate-spin" : ""
                        }`}
                      />

                      <div className="text-xl font-semibold text-content-strong">
                        {checking
                          ? "—"
                          : importPlan
                            ? importPlan.updates.length
                            : "—"}
                      </div>
                    </div>

                    <div className="mt-1 text-xs text-content-muted">
                      Existing members to update
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-line bg-surface-100 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-content-muted">
                  Field mapping
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "PLAYER → Nickname",
                    "LV. → Level",
                    "GR → Gear Score",
                    "CLASS → Class",
                    "TITLE → Title",
                    "GENDER → Gender",
                    "POSITION → Position",
                  ].map((mapping) => (
                    <span
                      key={mapping}
                      className="rounded-md border border-line bg-white px-2.5 py-1.5 text-xs text-content"
                    >
                      {mapping}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-content-strong">
                    Members
                  </h3>

                  <span className="text-xs text-content-muted">
                    {validatedMembers.length} rows
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-line">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-line bg-surface-100">
                      <tr>
                        <th className="whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-content-muted">
                          Status
                        </th>

                        <th className="whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-content-muted">
                          Player
                        </th>

                        <th className="whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-content-muted">
                          Lv.
                        </th>

                        <th className="whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-content-muted">
                          Gear Score
                        </th>

                        <th className="whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-content-muted">
                          Class
                        </th>

                        <th className="whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-content-muted">
                          Title
                        </th>

                        <th className="whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-content-muted">
                          Gender
                        </th>

                        <th className="whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-content-muted">
                          Position
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-line">
                      {validatedMembers.map((member) => (
                        <tr
                          key={`${member.rowNumber}-${member.nickname}`}
                          className={member.isValid ? "" : "bg-red-50/60"}
                        >
                          <td className="whitespace-nowrap px-4 py-3">
                            {member.isValid ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                <CheckCircle2 className="size-4" />
                                Valid
                              </span>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
                                  <XCircle className="size-4" />
                                  Invalid
                                </span>

                                <p className="mt-1 max-w-56 whitespace-normal text-xs text-red-600">
                                  {member.errors.join(", ")}
                                </p>
                              </div>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 font-medium text-content-strong">
                            {member.nickname || "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-content">
                            {member.level ?? "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-content-strong">
                            {member.gearScore !== null
                              ? member.gearScore.toLocaleString()
                              : "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-content">
                            {member.className || "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-content">
                            {member.title || "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-content">
                            {member.gender || "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-content">
                            {member.position || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {importError && (
          <div className="shrink-0 border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
            {importError}
          </div>
        )}

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-5 py-4">
          {step === "validation" ? (
            <>
              <button
                type="button"
                onClick={() => setStep("upload")}
                disabled={importing || checking}
                className="h-10 rounded-lg border border-line-strong bg-white px-4 text-sm font-medium text-content transition hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleImport}
                disabled={
                  validMembers.length === 0 ||
                  invalidMembers.length > 0 ||
                  importing ||
                  checking ||
                  !importPlan
                }
                className="h-10 min-w-40 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {checking
                  ? "Checking..."
                  : importing
                    ? "Importing..."
                    : importPlan
                      ? `Apply ${validMembers.length} members`
                      : "Preparing..."}
              </button>
            </>
          ) : (
            <>
              <div />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-10 rounded-lg border border-line-strong bg-white px-4 text-sm font-medium text-content transition hover:bg-surface-100"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={rows.length === 0}
                  className="h-10 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

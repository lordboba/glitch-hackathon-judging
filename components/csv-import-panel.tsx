"use client";

import { useState } from "react";

import type { CsvMappingTarget, CsvPreview } from "@/lib/server/types";

const TARGET_OPTIONS: Array<{ value: CsvMappingTarget; label: string }> = [
  { value: "ignore", label: "Ignore" },
  { value: "project_name", label: "Project name" },
  { value: "team_name", label: "Team name" },
  { value: "description", label: "Description" },
  { value: "video_url", label: "Demo URL" },
  { value: "repo_url", label: "Repo URL" },
  { value: "submission_url", label: "Submission URL" },
  { value: "track", label: "Track" },
  { value: "score", label: "Screening score" },
];

type Props = {
  eventId: string;
};

export default function CsvImportPanel({ eventId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [mapping, setMapping] = useState<Partial<Record<CsvMappingTarget, string>>>({});
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  async function previewFile() {
    if (!file) {
      setMessage("Choose a CSV file first.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/imports/preview", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as CsvPreview | { error: string };

    if (!response.ok || "error" in payload) {
      setPreview(null);
      setMessage("error" in payload ? payload.error : "Unable to preview file.");
      setIsLoading(false);
      return;
    }

    const initialMapping: Partial<Record<CsvMappingTarget, string>> = { ...payload.suggestedMapping };

    for (const header of payload.headers) {
      if (Object.values(initialMapping).includes(header)) {
        continue;
      }

      initialMapping.ignore = header;
    }

    setPreview(payload);
    setMapping(initialMapping);
    setMessage("Preview ready. Map the fields and run import.");
    setIsLoading(false);
  }

  async function executeImport() {
    if (!file) {
      setMessage("Choose a CSV file first.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("eventId", eventId);
    formData.append("file", file);
    formData.append("mapping", JSON.stringify(mapping));

    const response = await fetch("/api/imports/execute", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as
      | { createdCount: number; updatedCount: number; rowCount: number }
      | { error: string };

    if (!response.ok || "error" in payload) {
      setMessage("error" in payload ? payload.error : "Import failed.");
      setIsLoading(false);
      return;
    }

    setMessage(
      `Import complete. ${payload.rowCount} rows processed, ${payload.createdCount} created, ${payload.updatedCount} updated.`,
    );
    setIsLoading(false);
    window.location.reload();
  }

  return (
    <div className="card admin-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">CSV import</p>
          <h3>Preview and map project data</h3>
        </div>
      </div>

      <div className="stack-form">
        <label>
          <span>CSV file</span>
          <input
            accept=".csv,text/csv"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>
      </div>

      <div className="cta-row">
        <button className="button button-secondary" disabled={isLoading} onClick={previewFile} type="button">
          Preview CSV
        </button>
        <button className="button button-primary" disabled={isLoading || !preview} onClick={executeImport} type="button">
          Run import
        </button>
      </div>

      {message ? <p className="inline-note">{message}</p> : null}

      {preview ? (
        <div className="admin-grid-two">
          <div className="list-panel">
            <h4>Header mapping</h4>
            <div className="stack-form">
              {TARGET_OPTIONS.filter((option) => option.value !== "ignore").map((option) => (
                <label key={option.value}>
                  <span>{option.label}</span>
                  <select
                    onChange={(event) =>
                      setMapping((current) => ({
                        ...current,
                        [option.value]: event.target.value,
                      }))
                    }
                    value={mapping[option.value] ?? ""}
                  >
                    <option value="">Not mapped</option>
                    {preview.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="list-panel">
            <h4>Sample rows</h4>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {preview.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sampleRows.map((row, index) => (
                    <tr key={`${index}-${Object.values(row).join("-")}`}>
                      {preview.headers.map((header) => (
                        <td key={`${index}-${header}`}>{row[header]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

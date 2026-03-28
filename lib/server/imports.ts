import { ImportStatus, LinkType, ProjectStatus } from "@prisma/client";
import { parse } from "csv-parse/sync";

import { slugify } from "@/lib/server/crypto";
import { prisma } from "@/lib/server/db";
import type { CsvMappingTarget, CsvPreview } from "@/lib/server/types";

const REQUIRED_TARGETS: CsvMappingTarget[] = ["project_name", "team_name"];

type Mapping = Partial<Record<CsvMappingTarget, string>>;

type ParsedRow = Record<string, string>;

function parseCsv(buffer: Buffer) {
  return parse(buffer, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as ParsedRow[];
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function buildSuggestedMapping(headers: string[]): Partial<Record<CsvMappingTarget, string>> {
  const map: Partial<Record<CsvMappingTarget, string>> = {};
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  const matchers: Array<[CsvMappingTarget, string[]]> = [
    ["project_name", ["project_name", "submission_title", "title", "project"]],
    ["team_name", ["team_name", "team", "team_title"]],
    ["description", ["description", "summary"]],
    ["video_url", ["video_url", "demo_url", "demo"]],
    ["repo_url", ["repo_url", "repo", "github_url"]],
    ["submission_url", ["submission_url", "submission"]],
    ["track", ["track", "category"]],
    ["score", ["score", "screening_score", "pre_score"]],
  ];

  for (const [target, candidates] of matchers) {
    const match = normalizedHeaders.find((header) => candidates.includes(header.normalized));

    if (match) {
      map[target] = match.original;
    }
  }

  return map;
}

function validateMapping(mapping: Mapping) {
  const missing = REQUIRED_TARGETS.filter((target) => !mapping[target]);

  if (missing.length > 0) {
    throw new Error(`Missing required mappings: ${missing.join(", ")}`);
  }
}

function rowValue(row: ParsedRow, mapping: Mapping, target: CsvMappingTarget) {
  const column = mapping[target];
  return column ? String(row[column] ?? "").trim() : "";
}

function statusFromRow(row: ParsedRow, mapping: Mapping) {
  const demoUrl = rowValue(row, mapping, "video_url");

  if (!demoUrl) {
    return ProjectStatus.MISSING_VIDEO;
  }

  return ProjectStatus.READY;
}

export async function previewCsvImport(fileBuffer: Buffer): Promise<CsvPreview> {
  const rows = parseCsv(fileBuffer);
  const headers = Object.keys(rows[0] ?? {});

  return {
    headers,
    sampleRows: rows.slice(0, 5),
    suggestedMapping: buildSuggestedMapping(headers),
    requiredTargets: REQUIRED_TARGETS,
  };
}

export async function executeCsvImport(params: {
  eventId: string;
  uploadedByUserId: string;
  fileBuffer: Buffer;
  mapping: Mapping;
}) {
  validateMapping(params.mapping);

  const rows = parseCsv(params.fileBuffer);

  const importBatch = await prisma.importBatch.create({
    data: {
      eventId: params.eventId,
      uploadedByUserId: params.uploadedByUserId,
      sourceType: "csv",
      status: ImportStatus.PREVIEWED,
      mappingConfig: params.mapping,
      summary: {
        rowCount: rows.length,
      },
    },
  });

  let createdCount = 0;
  let updatedCount = 0;

  for (const row of rows) {
    const projectName = rowValue(row, params.mapping, "project_name");
    const teamName = rowValue(row, params.mapping, "team_name");

    if (!projectName || !teamName) {
      continue;
    }

    const payload = {
      slug: slugify(projectName),
      projectName,
      teamName,
      track: rowValue(row, params.mapping, "track") || null,
      description: rowValue(row, params.mapping, "description"),
      screeningScore: rowValue(row, params.mapping, "score")
        ? Number(rowValue(row, params.mapping, "score"))
        : null,
      status: statusFromRow(row, params.mapping),
    };

    const existing = await prisma.project.findUnique({
      where: {
        eventId_projectName_teamName: {
          eventId: params.eventId,
          projectName,
          teamName,
        },
      },
    });

    const project = existing
      ? await prisma.project.update({
          where: { id: existing.id },
          data: {
            ...payload,
            importBatchId: importBatch.id,
          },
        })
      : await prisma.project.create({
          data: {
            eventId: params.eventId,
            importBatchId: importBatch.id,
            ...payload,
          },
        });

    if (existing) {
      updatedCount += 1;
    } else {
      createdCount += 1;
    }

    const links = [
      { type: LinkType.REPO, value: rowValue(row, params.mapping, "repo_url") },
      { type: LinkType.DEMO, value: rowValue(row, params.mapping, "video_url") },
      { type: LinkType.SUBMISSION, value: rowValue(row, params.mapping, "submission_url") },
    ].filter((link) => link.value);

    for (const link of links) {
      await prisma.projectLink.upsert({
        where: {
          projectId_type: {
            projectId: project.id,
            type: link.type,
          },
        },
        update: { url: link.value },
        create: {
          projectId: project.id,
          type: link.type,
          url: link.value,
        },
      });
    }
  }

  await prisma.importBatch.update({
    where: { id: importBatch.id },
    data: {
      status: ImportStatus.IMPORTED,
      summary: {
        rowCount: rows.length,
        createdCount,
        updatedCount,
      },
    },
  });

  return {
    importBatchId: importBatch.id,
    rowCount: rows.length,
    createdCount,
    updatedCount,
  };
}

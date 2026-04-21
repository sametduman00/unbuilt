/**
 * app/lib/validate.ts — Central input validation for all API routes.
 */

export const MAX_PAYLOAD_BYTES = 64 * 1024;

export const ALLOWED_BUDGETS   = ["bootstrap","growing","funded","scale"] as const;
export const ALLOWED_TECH      = ["nocode","lowcode","developer"] as const;
export const ALLOWED_PLATFORMS = ["web","mobile","both"] as const;
export const ALLOWED_TOOLS     = ["gap-analysis","stack-advisor"] as const;

export type Budget    = typeof ALLOWED_BUDGETS[number];
export type TechLevel = typeof ALLOWED_TECH[number];
export type Platform  = typeof ALLOWED_PLATFORMS[number];
export type ToolType  = typeof ALLOWED_TOOLS[number];

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

export function validationError(msg: string, status = 400): ValidationResult<never> {
  return { ok: false, error: msg, status };
}
export function validationOk<T>(data: T): ValidationResult<T> {
  return { ok: true, data };
}
export function errorResponse(r: ValidationResult<never>): Response {
  return new Response(JSON.stringify({ error: r.ok ? "" : r.error }), {
    status: r.ok ? 400 : r.status, headers: { "Content-Type": "application/json" },
  });
}

export function checkPayloadSize(req: Request, maxBytes = MAX_PAYLOAD_BYTES): boolean {
  const cl = req.headers.get("content-length");
  return !cl || parseInt(cl, 10) <= maxBytes;
}

function reqString(val: unknown, field: string, min=1, max=500): ValidationResult<string> {
  if (typeof val !== "string") return validationError(`"${field}" must be a string.`);
  const v = val.trim();
  if (v.length < min) return validationError(`"${field}" must be at least ${min} character(s).`);
  if (v.length > max) return validationError(`"${field}" must not exceed ${max} characters.`);
  return validationOk(v);
}
function reqEnum<T extends string>(val: unknown, field: string, allowed: readonly T[]): ValidationResult<T> {
  if (typeof val !== "string" || !allowed.includes(val as T))
    return validationError(`"${field}" must be one of: ${allowed.join(", ")}.`);
  return validationOk(val as T);
}
function unknownFields(body: Record<string,unknown>, allowed: string[]): ValidationResult<never>|null {
  const bad = Object.keys(body).filter(k => !allowed.includes(k));
  return bad.length ? validationError(`Unknown field(s): ${bad.join(", ")}.`) : null;
}

// ── /api/analyze ─────────────────────────────────────────────────────────────
export interface AnalyzeBody { idea: string; tool?: ToolType }
export function validateAnalyzeBody(raw: unknown): ValidationResult<AnalyzeBody> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return validationError("Body must be a JSON object.");
  const body = raw as Record<string,unknown>;
  const uf = unknownFields(body, ["idea","tool","nocache"]); if (uf) return uf;
  const idea = reqString(body.idea,"idea",3,500); if (!idea.ok) return idea;
  let tool: ToolType|undefined;
  if (body.tool !== undefined) { const t=reqEnum(body.tool,"tool",ALLOWED_TOOLS); if(!t.ok) return t; tool=t.data; }
  return validationOk({ idea: idea.data, tool });
}

// ── /api/stack ───────────────────────────────────────────────────────────────
export interface StackBody { idea: string; budget: Budget; techLevel: TechLevel; platform: Platform }
export function validateStackBody(raw: unknown): ValidationResult<StackBody> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return validationError("Body must be a JSON object.");
  const body = raw as Record<string,unknown>;
  const uf = unknownFields(body, ["idea","budget","techLevel","platform","tool","nocache"]); if (uf) return uf;
  const idea=reqString(body.idea,"idea",3,600); if(!idea.ok) return idea;
  const budget=reqEnum(body.budget,"budget",ALLOWED_BUDGETS); if(!budget.ok) return budget;
  const tech=reqEnum(body.techLevel,"techLevel",ALLOWED_TECH); if(!tech.ok) return tech;
  const plat=reqEnum(body.platform??"web","platform",ALLOWED_PLATFORMS); if(!plat.ok) return plat;
  return validationOk({ idea:idea.data, budget:budget.data, techLevel:tech.data, platform:plat.data });
}

// ── /api/radar ───────────────────────────────────────────────────────────────
export interface RadarBody { idea: string }
export function validateRadarBody(raw: unknown): ValidationResult<RadarBody> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return validationError("Body must be a JSON object.");
  const body = raw as Record<string,unknown>;
  const uf = unknownFields(body, ["idea"]); if (uf) return uf;
  const idea=reqString(body.idea,"idea",3,600); if(!idea.ok) return idea;
  return validationOk({ idea: idea.data });
}

// ── /api/trends ──────────────────────────────────────────────────────────────
export interface TrendsBody { idea: string }
export function validateTrendsBody(raw: unknown): ValidationResult<TrendsBody> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return validationError("Body must be a JSON object.");
  const body = raw as Record<string,unknown>;
  const uf = unknownFields(body, ["idea"]); if (uf) return uf;
  const idea=reqString(body.idea,"idea",3,500); if(!idea.ok) return idea;
  return validationOk({ idea: idea.data });
}

// ── /api/pulse PATCH ─────────────────────────────────────────────────────────
export interface PulseUpdate { name: string; claudeGap: string }
export interface PulsePatchBody { updates: PulseUpdate[] }
export function validatePulsePatchBody(raw: unknown): ValidationResult<PulsePatchBody> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return validationError("Body must be a JSON object.");
  const body = raw as Record<string,unknown>;
  const uf = unknownFields(body, ["updates"]); if (uf) return uf;
  if (!Array.isArray(body.updates)) return validationError('"updates" must be an array.');
  if (body.updates.length === 0) return validationError('"updates" must not be empty.');
  if (body.updates.length > 50) return validationError('"updates" must not exceed 50 items.');
  for (let i=0; i<body.updates.length; i++) {
    const u = body.updates[i] as Record<string,unknown>;
    if (typeof u.name !== "string" || !u.name.trim()) return validationError(`updates[${i}].name must be a non-empty string.`);
    if (typeof u.claudeGap !== "string") return validationError(`updates[${i}].claudeGap must be a string.`);
    if (u.claudeGap.length > 10_000) return validationError(`updates[${i}].claudeGap must not exceed 10,000 characters.`);
  }
  return validationOk({ updates: body.updates as PulseUpdate[] });
}

// ── /api/reports DELETE ───────────────────────────────────────────────────────
export interface ReportsDeleteBody { id: string }
export function validateReportsDeleteBody(raw: unknown): ValidationResult<ReportsDeleteBody> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return validationError("Body must be a JSON object.");
  const body = raw as Record<string,unknown>;
  const uf = unknownFields(body, ["id"]); if (uf) return uf;
  const id=reqString(body.id,"id",1,100); if(!id.ok) return id;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.data))
    return validationError('"id" must be a valid UUID.');
  return validationOk({ id: id.data });
}

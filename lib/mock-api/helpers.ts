import type { ApiError, ApiResult, Page, PageQuery } from "@/lib/contracts/v1";
import type { AdminIssue, AdminProject } from "@/lib/domain/admin";
import type { Issue, Project } from "@/lib/domain/types";
export function ok<T>(data: T): ApiResult<T> { return { ok: true, data: structuredClone(data) }; }
export function fail<T = never>(code: ApiError["code"], message: string): ApiResult<T> { return { ok: false, error: { code, message } }; }
export function paginate<T>(rows: T[], query: PageQuery = {}): Page<T> {
  const pageSize = Math.min(100, Math.max(1, Math.floor(query.pageSize ?? 20)));
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const start = (page - 1) * pageSize;
  return { items: structuredClone(rows.slice(start, start + pageSize)), page, pageSize, total: rows.length };
}
export function matchesText(query: string | undefined, ...values: Array<string | undefined>): boolean {
  if (!query?.trim()) return true;
  const needle = query.trim().toLocaleLowerCase();
  return values.some((value) => value?.toLocaleLowerCase().includes(needle));
}
/** Explicit public read models: never spread internal/admin fixture columns into public DTOs. */
export function toPublicIssue(row: AdminIssue): Issue {
  return { id: row.id, title: row.title, description: row.description, category: row.category, location: row.location, latitude: row.latitude, longitude: row.longitude, observedAt: row.observedAt, createdAt: row.createdAt, verificationCount: row.verificationCount, reviewStatus: row.reviewStatus, urgent: row.urgent, source: row.source };
}
export function toPublicProject(row: AdminProject): Project {
  return { id: row.id, slug: row.slug, title: row.title, description: row.description, department: row.department, contractor: row.contractor, location: row.location, latitude: row.latitude, longitude: row.longitude, startDate: row.startDate, expectedEndDate: row.expectedEndDate, status: row.status, budget: row.budget, updatedAt: row.updatedAt };
}

import { AuditReport, OrchestratedPlan, PreflightReport } from "@/lib/runtime/types";

const LADDER = ["openai:gpt-4o-mini", "openai:gpt-4o", "openai:gpt-5"] as const;

interface ModelPickerInput {
  plan: OrchestratedPlan;
  preflight: PreflightReport;
  audits?: AuditReport[];
  preferredModel?: string;
}

export function pickModel({ plan, preflight, audits = [], preferredModel }: ModelPickerInput): string {
  if (preferredModel && LADDER.includes(preferredModel as (typeof LADDER)[number])) {
    return preferredModel;
  }

  if (!preflight.approve) {
    return LADDER[0];
  }

  const hasAuditFail = audits.some((audit) => audit.status === "fail");
  const hasRiskWarning = audits.some((audit) => audit.audit_type === "risk" && audit.status !== "pass");

  if (plan.normalized_task.risk_level === "high" || hasRiskWarning) {
    return LADDER[2];
  }

  if (plan.normalized_task.risk_level === "medium" || hasAuditFail || preflight.p95_cost_usd > 1) {
    return LADDER[1];
  }

  return LADDER[0];
}

export const MODEL_LADDER = [...LADDER];

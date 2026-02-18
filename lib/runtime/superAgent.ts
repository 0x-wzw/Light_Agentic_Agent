import { OrchestratedPlan, TaskSpec } from "@/lib/runtime/types";

export interface SkillAssignment {
  skill_id: string;
  reason: string;
  tools_allowed: string[];
  prompt: string;
}

export interface SuperAgentBotDraft {
  bot_id: string;
  bot_name: string;
  purpose: string;
  preferred_model: "openai:gpt-4o-mini" | "openai:gpt-4o" | "openai:gpt-5";
  assigned_skills: SkillAssignment[];
}

export interface SuperAgentOutput {
  run_id: string;
  selected_bot_id: string;
  bot_drafts: SuperAgentBotDraft[];
  normalized_task: TaskSpec;
}

const MODEL_BY_RISK: Record<TaskSpec["risk_level"], SuperAgentBotDraft["preferred_model"]> = {
  low: "openai:gpt-4o-mini",
  medium: "openai:gpt-4o",
  high: "openai:gpt-5"
};

function intersectTools(task: TaskSpec): string[] {
  const allowed = new Set(task.tools.mcp.allow);
  return [...allowed];
}

function chooseDefaultSkills(task: TaskSpec): SkillAssignment[] {
  const baseTools = intersectTools(task);

  if (task.skills.length > 0) {
    return task.skills.map((skill) => ({
      ...skill,
      reason: "Provided by task specification."
    }));
  }

  return [
    {
      skill_id: "general-planner",
      reason: "Auto-assigned fallback skill because no explicit skills were provided.",
      tools_allowed: baseTools,
      prompt: "Plan, execute, and validate output against acceptance criteria."
    }
  ];
}

export function runSuperAgent(plan: OrchestratedPlan): SuperAgentOutput {
  const assignedSkills = chooseDefaultSkills(plan.normalized_task);
  const preferredModel = MODEL_BY_RISK[plan.normalized_task.risk_level];

  const draft: SuperAgentBotDraft = {
    bot_id: `${plan.run_id}-primary-bot`,
    bot_name: "primary-execution-bot",
    purpose: `Complete task ${plan.normalized_task.task_id} with assigned skills and strict tool boundaries.`,
    preferred_model: preferredModel,
    assigned_skills: assignedSkills
  };

  return {
    run_id: plan.run_id,
    selected_bot_id: draft.bot_id,
    bot_drafts: [draft],
    normalized_task: {
      ...plan.normalized_task,
      skills: assignedSkills.map(({ skill_id, prompt, tools_allowed }) => ({
        skill_id,
        prompt,
        tools_allowed
      }))
    }
  };
}

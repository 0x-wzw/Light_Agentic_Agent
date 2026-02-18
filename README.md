# Light Agentic Agent

Minimal-but-production-shaped **Agentic Bot Factory** built with **Next.js App Router + TypeScript**.

## Overview

`POST /api/run` executes a server-only pipeline:

1. Orchestrator
2. Budget Gate (`$5` hard cap)
3. Super Agent (assigns skills + drafts bot candidates)
4. Model Picker (auto-escalation ladder)
5. Bot Builder
6. Worker (with tool router)
7. Independent Auditors (spec/quality/risk/budget)
8. Release Gate

All run outputs are written to artifacts under `./artifacts/<run_id>/`.

---

## Key Guarantees

- **Budget policy**: hard cap of `$5` per run.
- **Model ladder**: `openai:gpt-4o-mini` → `openai:gpt-4o` → `openai:gpt-5`.
- **Strict tool scoping**: tool calls are validated against the intersection of:
  - `task_spec.tools.mcp.allow`
  - `bot_package.tools.mcp_scope.allow`
  - per-skill `tools_allowed`
- **Schema validation**: Ajv + Draft 2020-12 schemas for input and critical artifacts.
- **Secret safety**: MCP auth is referenced by `auth_ref` only; tokens are resolved from env and not written to prompts/artifacts.

---

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables (example `.env.local`):

   ```bash
   OPENAI_API_KEY=sk-...

   # MCP auth refs (used indirectly by auth_ref only)
   MCP_TOKEN_LOCAL_FS=...
   MCP_TOKEN_REMOTE_DEFAULT=...
   ```

3. Run locally:

   ```bash
   npm run dev
   ```

---

## API

### Endpoint

`POST /api/run`

### Request body

Must match: `lib/schemas/task_spec.schema.json`.

### Minimal example

```bash
curl -X POST http://localhost:3000/api/run \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "task-001",
    "title": "Generate incident summary",
    "description": "Create a concise incident summary and action plan from provided context.",
    "objective": "Produce a structured summary with immediate actions.",
    "context": "Service latency spike in us-east between 10:00 and 10:15 UTC.",
    "acceptance_criteria": [
      "Include incident timeline",
      "Include root cause hypothesis",
      "Include next action owners"
    ],
    "risk_level": "medium",
    "budget": {
      "max_usd": 3,
      "max_input_tokens": 4000,
      "max_output_tokens": 1200
    },
    "tools": {
      "mcp": {
        "allow": ["search.docs", "kb.lookup"]
      }
    },
    "skills": [
      {
        "skill_id": "incident-analyst",
        "prompt": "Summarize incidents with clear sections.",
        "tools_allowed": ["search.docs", "kb.lookup"]
      }
    ]
  }'
```

### Response shape (compact)

```json
{
  "run_id": "<uuid>",
  "status": "pass|fail",
  "final_artifact_ref": "artifacts/<run_id>/final_release.json",
  "audit_refs": ["artifacts/<run_id>/audit_reports.json"],
  "model_used": "openai:gpt-4o|openai:gpt-5|openai:gpt-4o-mini",
  "estimated_cost_usd": 0.123456,
  "artifact_refs": {
    "task_spec": "artifacts/<run_id>/task_spec.json",
    "super_agent": "artifacts/<run_id>/super_agent.json",
    "preflight": "artifacts/<run_id>/preflight_report.json",
    "bot_package": "artifacts/<run_id>/bot_package.json",
    "worker_output": "artifacts/<run_id>/worker_output.json"
  }
}
```

---

## Artifacts

Each run writes:

- `task_spec.json`
- `super_agent.json`
- `preflight_report.json`
- `bot_package.json`
- `worker_output.json`
- `audit_reports.json`
- `final_release.json`
- `tool_traces.jsonl` (when tools are called)

Location:

```text
artifacts/<run_id>/
```

---

## MCP Configuration (Local + Remote)

Registry: `lib/mcp/registry.ts`

Supports both:

- **Local stdio transport** (example: filesystem MCP server)
- **Remote HTTPS transport**

Each server entry includes:

- `server_id`
- `transport` (`stdio` or `https`)
- `endpoint` (for https) **or** `stdio.command` + `stdio.args`
- `auth_ref` (name of env var used for auth token resolution)

Auth resolution: `lib/mcp/auth.ts`

> `auth_ref` is resolved at runtime using environment variables. Raw secrets should never be included in prompts or artifacts.

---

## Notes

- If `OPENAI_API_KEY` is not configured, LLM responses are simulated in `lib/runtime/llm.ts` to keep the pipeline operable for local scaffolding.
- MCP tool execution is structured and currently stubbed in `lib/mcp/client.ts`, while preserving transport-specific shape and safety boundaries.

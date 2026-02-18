# Light Agentic Agent

Minimal-but-production-shaped **Agentic Bot Factory** built with **Next.js App Router + TypeScript**.

## What this implements

`POST /api/run` executes the server-only pipeline:

1. Orchestrator
2. Budget Gate (`$5` hard cap)
3. Super Agent (assigns skills + drafts bot candidates)
4. Model Picker (auto-escalation ladder)
5. Bot Builder
6. Worker (with tool router)
7. Independent Auditors (spec/quality/risk/budget)
8. Release Gate

Artifacts are written to `./artifacts/<run_id>/`.

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

## Example request

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

## Artifact outputs

Each run writes:

- `task_spec.json`
- `super_agent.json`
- `preflight_report.json`
- `bot_package.json`
- `worker_output.json`
- `audit_reports.json`
- `final_release.json`
- `tool_traces.jsonl` (when tools are called)

under:

```text
artifacts/<run_id>/
```

## MCP server configuration (local + remote)

MCP registry lives in `lib/mcp/registry.ts` and includes examples for:

- **Local stdio transport** (e.g., filesystem MCP server)
- **Remote HTTPS transport**

Each server entry uses:

- `server_id`
- `transport` (`stdio` or `https`)
- `endpoint` (for https) OR `stdio.command`+`stdio.args`
- `auth_ref` (maps to environment variable name)

Authentication is resolved in `lib/mcp/auth.ts` by env variable name only; tokens are never embedded into prompts or artifacts.

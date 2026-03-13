# Iteration 2 - Execution Plan

## Scope decision

- `/tools` UX polish is deferred to final stage.
- Active focus moves to core plan streams:
  - Capability registry and permission hardening
  - Enterprise MCP connectivity reliability
  - Arbitration/probability governance gates
  - AzureEvidenceAdapter + sync pipelines

## Agent 1 (Calling Tools) - Active backlog

- P0: capability registry v1 as source of truth (`capability_id`, risk, policy, audit fields).
- P0: unify permission checks through one policy engine (`allow/deny/ask`).
- P0: harden persistent grants (`always allow/deny`) with scoped keys + revocation.
- P0: explicit high-risk policy gate for embedded shell execution paths.
- P1: structured decision audit for every tool permission event.
- P1: deny-by-default for unknown/unclassified capabilities.

Acceptance highlights:

- 100% tool coverage in capability registry.
- No bypass path outside policy engine.
- Unknown capability cannot run without explicit policy path.

## Agent 2 (Architecture/Microservices) - F1->F2 sequence

1. Freeze F1 contracts and error taxonomy.
2. Add full observability before reliability controls.
3. Enable retries/timeouts/circuit breakers in shadow mode.
4. Canary rollout (5% -> 20% -> 50%) gated by SLOs.
5. Promote F2 default after stable windows.
6. Remove temporary F1 bypasses.

Reliability boundaries:

- Caller service
- MCP gateway/adapter
- Downstream MCP providers
- Persistence boundary

## Agent 3 (AI governance) - mandatory gates

- Arbitration checkpoint per milestone M1..M5.
- Required artifacts per gate:
  - Conflict Matrix
  - Probability Table
  - Top-3 Convergence Nodes
  - Repro Gate Status
- Confidence rule: dominant hypothesis must be `>=70`.
- If `<70`, one focused re-iteration on top 2 nodes only.

## Agent 4 (Azure) - implementation blueprint

Core endpoints:

- `POST /v1/azure/evidence/bootstrap`
- `POST /v1/azure/evidence/incremental`
- `POST /v1/azure/evidence/reconcile`
- `GET /v1/azure/evidence/jobs/{job_id}`
- `POST /v1/azure/evidence/jobs/{job_id}/cancel`

Reliability model:

- Request idempotency keys
- Data-level upsert dedupe keys
- Retry with backoff+jitter
- Deferred queue for per-record failures
- Checkpoint commit only after durable writes

Validation matrix:

- V1..V8 covering happy path, crash resume, 429 storms, partial failures, replay idempotency, reconcile drift, link mismatch, auth failure.

## Immediate execution order

1. Implement capability registry schema + policy engine unification.
2. Add permission audit and scoped persistent grants.
3. Stabilize enterprise MCP connectivity contracts and health checks.
4. Build AzureEvidenceAdapter endpoint surface and idempotent sync core.
5. Run governance gates (M1..M5) with arbitration artifacts.

## Deferred stream (final stage)

- `/tools` UX final polish and MCP help coverage matrix remain deferred until core streams above are stable.

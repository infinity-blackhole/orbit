# orbit

GitOps-style source build publish, reconciled by Temporal. Desired build
specs are declared in git; a Temporal workflow reconciles desired state to
published artifacts — Flux, but for builds.

## Architecture

```mermaid
flowchart LR
    A[spec in git] --> B[reconcile]
    B --> C[build]
    C --> D[publish]
    D --> E[status commit]
    E --> A
```

Status: PoC. Only the scaffold exists — the reconcile workflow, build/publish
activities, and spec schema land in subsequent units (issues #2–#6).

## Dev loop

```bash
pnpm install
pnpm dev        # starts the Temporal dev server + the worker
```

Exercise the demo workflow (second terminal):

```bash
temporal workflow start --type demo --task-queue orbit --workflow-id demo-cli
temporal workflow signal --workflow-id demo-cli --name healthcheck
temporal workflow show --workflow-id demo-cli   # reaches Completed, result "pong"
```

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test       # SDK test environment, no server needed
```

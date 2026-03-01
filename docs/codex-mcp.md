# Codex MCP Setup

## Scope

Project-level documentation of the MCP servers used while working on `matbett`.

This file is the visible reference for the repository. The actual Codex activation
still lives in the user's global Codex config, not inside the repository.

## Configured MCP Servers

### `chrome-devtools`

- Purpose: real browser testing of the frontend in Chrome.
- Main use cases:
  - validate end-to-end UI flows
  - inspect console errors
  - inspect network requests and responses
  - verify calculations and rendered state in the running app
- Expected local targets:
  - frontend dev: `http://localhost:3000`
  - backend dev: `http://localhost:3001`
- Current global Codex shape:

```toml
[mcp_servers.chrome-devtools]
command = "cmd"
args = ["/c", "npx", "-y", "chrome-devtools-mcp@latest", "--executablePath=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "--isolated", "--viewport=1440x900", "--no-usage-statistics"]
startup_timeout_ms = 20000
```

### `context7`

- Purpose: fetch current third-party library documentation while coding.
- Main use cases:
  - current framework and library APIs
  - setup and configuration steps
  - exact usage patterns for repository dependencies
- Preferred libraries in this repository:
  - Next.js
  - React
  - React Hook Form
  - Zod
  - Prisma
  - tRPC
  - TanStack Query
  - shadcn/ui
- Current global Codex shape:

```toml
[mcp_servers.context7]
url = "https://mcp.context7.com/mcp"
http_headers = { "CONTEXT7_API_KEY" = "<set locally, never commit real key>" }
```

## Usage Rules

- Use `Context7` for external library knowledge, not for MatBett business rules.
- Use repository code and `docs/bet-registration-implementation-plan.md` as the
  source of truth for product behavior.
- When the target library is known, prefer direct library IDs instead of broad
  searches.
- Use `chrome-devtools` for any browser validation that depends on actual runtime
  behavior.

## Secret Handling

- Never commit real MCP secrets or API keys to the repository.
- Keep sensitive values only in the local global Codex config.

## Operational Note

- Codex currently reads MCP activation from the user's global config.
- This file exists so the project keeps an explicit, reviewable record of which
  MCPs are expected for day-to-day work.

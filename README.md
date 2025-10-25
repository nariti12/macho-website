**MCP Bridge and Serena Setup**
- Suppress noisy MCP probe errors by setting `MCP_SILENT=1`.
- To connect directly to Serena MCP, set `MCP_BASE_URL` (or `SERENA_MCP_URL`) and optional `MCPR_TOKEN`.

Examples
- Windows PowerShell:
  - `$env:MCP_SILENT = '1'`
  - `$env:MCP_BASE_URL = 'http://127.0.0.1:6333/mcp'`  # replace with your Serena MCP URL
  - `$env:MCPR_TOKEN = '<your_token_if_required>'`

- Bash:
  - `export MCP_SILENT=1`
  - `export MCP_BASE_URL=http://127.0.0.1:6333/mcp`  # replace with your Serena MCP URL
  - `export MCPR_TOKEN=<your_token_if_required>`

Notes
- If `MCP_BASE_URL`/`SERENA_MCP_URL` is not set, the bridge tries common localhost endpoints for `mcp-router`.
- When no server is reachable, the bridge now stays quiet (if `MCP_SILENT=1`) and serves empty capabilities instead of error-spamming.

# FlowPilot

FlowPilot is a SaaS MVP for business workflow documentation, sharing, and Claude-driven workflow operations via MCP.

## Local development

1. Install dependencies:
   npm install
2. Start backend:
   npm run start --workspace backend
3. Start frontend:
   npm run dev --workspace frontend
4. Start MCP server:
   npm run start --workspace mcp

## Default login

- Email: demo@flowpilot.app
- Password: FlowPilot123!

## MCP endpoint

- HTTP endpoint: http://localhost:4001/mcp
- Claude can connect to this Streamable HTTP server to call FlowPilot tools.

## Core workflows

- create_workflow
- list_workflows
- get_workflow
- update_workflow
- add_workflow_step
- update_workflow_step
- delete_workflow_step
- duplicate_workflow
- archive_workflow

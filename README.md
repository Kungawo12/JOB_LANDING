# Job Landing

A full-stack AI-powered job search system combining a backend pipeline engine with a Next.js dashboard UI.

## Structure

```
job_landing/
├── career-ops/       # AI job search pipeline (Node.js + Playwright)
└── job-search-ui/    # Dashboard UI (Next.js)
```

## career-ops

CLI-agnostic job search automation built for any AI coding assistant (Claude Code, Gemini CLI, Codex, OpenCode).

**What it does:**
- Evaluates job offers with a structured scoring framework
- Generates tailored CVs as HTML/PDF or LaTeX
- Scans 45+ company portals for new openings (zero LLM cost)
- Tracks applications, follow-ups, and pipeline status
- Supports batch processing and multi-language modes (EN, DE, FR, JA)

See [`career-ops/README.md`](career-ops/README.md) for full setup and usage.

## job-search-ui

Next.js dashboard for visualizing and interacting with the job search pipeline.

See [`job-search-ui/README.md`](job-search-ui/README.md) for dev setup.

## Quick Start

```bash
# Backend pipeline
cd career-ops
npm install

# Frontend dashboard
cd job-search-ui
npm install
npm run dev
```

## License

MIT

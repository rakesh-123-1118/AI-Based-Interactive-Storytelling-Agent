# StoryVerse – AI-Based Interactive Storytelling Agent

StoryVerse is a cinematic, agent-driven storytelling application built with a FastAPI backend and a React + Tailwind frontend. It lets users create imaginative stories, generate chapters, track characters, and branch the narrative through meaningful decisions while maintaining persistent story memory.

## Features

- Story creation with genre, tone, theme, and setting
- Branching decision system after each chapter
- Persistent SQLite story storage
- Character memory and relationship tracking
- Story history and memory explorer
- Multi-screen dashboard for story creation, reading, and progress tracking
- Agentic orchestration built around a LangGraph workflow

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion, Lucide
- Backend: Python, FastAPI
- Agent orchestration: LangGraph
- Storage: SQLite

## Local Setup

### 1. Backend

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Open http://localhost:5173 in the browser.

## API Overview

- `GET /api/health` — health check
- `GET /api/stories` — list all stories
- `POST /api/stories` — create a new story
- `GET /api/stories/{story_id}` — retrieve a story and its chapter history
- `POST /api/stories/{story_id}/decisions` — submit a user decision and generate the next chapter
- `GET /api/stories/{story_id}/memory` — view story memory and decision history

## Notes

This project is intentionally built as a strong local demo foundation for an agentic storytelling system. It demonstrates the architecture, workflow, and UI patterns expected for a genuine storytelling product, while remaining fully runnable in a local development environment.

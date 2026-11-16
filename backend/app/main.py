import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.database.db import init_db
from app.services.story_service import story_service


app = FastAPI(title="StoryVerse API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StoryCreateRequest(BaseModel):
    title: Optional[str] = None
    theme: str
    genre: str = "Fantasy"
    setting: str = "A forgotten kingdom"
    character_preferences: str = ""
    tone: str = "Epic"


class DecisionRequest(BaseModel):
    selected_option: str
    custom_input: str = ""


@app.on_event("startup")
async def startup_event():
    init_db()


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "StoryVerse API"}


@app.get("/api/stories")
async def list_stories():
    return {"stories": story_service.list_stories()}


@app.post("/api/stories")
async def create_story(payload: StoryCreateRequest):
    story = story_service.create_story(payload.model_dump())
    return {"story": story}


@app.get("/api/stories/{story_id}")
async def get_story(story_id: str):
    try:
        return {"story": story_service.get_story(story_id)}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/api/stories/{story_id}/save")
async def save_story(story_id: str):
    try:
        return {"story": story_service.save_story(story_id)}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/api/stories/{story_id}/decisions")
async def submit_decision(story_id: str, payload: DecisionRequest):
    try:
        result = story_service.submit_decision(story_id, payload.selected_option, payload.custom_input)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/stories/{story_id}/memory")
async def get_memory(story_id: str):
    try:
        return story_service.get_memory(story_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)

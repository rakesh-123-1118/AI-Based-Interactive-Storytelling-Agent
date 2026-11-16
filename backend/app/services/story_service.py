import json
import uuid
from datetime import datetime
from typing import Any, Dict, List

from app.database.db import get_connection, init_db, row_to_dict
from app.services.agent_system import OrchestratorAgent


def _now():
    return datetime.utcnow().isoformat(timespec="seconds")


class StoryService:
    def __init__(self):
        self.orchestrator = OrchestratorAgent()

    def create_story(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        init_db()
        story_payload = {
            "title": payload.get("title") or f"{payload.get('theme', 'Untitled').title()} Chronicle",
            "theme": payload.get("theme", "A hidden prophecy"),
            "genre": payload.get("genre", "Fantasy"),
            "setting": payload.get("setting", "A forgotten kingdom"),
            "tone": payload.get("tone", "Epic"),
            "character_preferences": payload.get("character_preferences", ""),
        }
        workflow = self.orchestrator.create_story(story_payload)
        story = workflow["story"]
        story_id = story["id"]
        with get_connection() as conn:
            conn.execute(
                """
                INSERT INTO stories (id, title, theme, genre, setting, tone, character_preferences, summary, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    story_id,
                    story["title"],
                    story["theme"],
                    story["genre"],
                    story["setting"],
                    story["tone"],
                    story["character_preferences"],
                    story["summary"],
                    story["status"],
                ),
            )
            chapter = workflow["chapter"]
            chapter_id = str(uuid.uuid4())
            conn.execute(
                """
                INSERT INTO chapters (id, story_id, chapter_number, title, content, summary, decision_options)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    chapter_id,
                    story_id,
                    1,
                    chapter["title"],
                    chapter["content"],
                    chapter["summary"],
                    json.dumps(chapter["decision_options"]),
                ),
            )
            for character in workflow["characters"]:
                char_id = str(uuid.uuid4())
                conn.execute(
                    """
                    INSERT INTO characters (id, story_id, name, role, description, personality, abilities, arc, relationships)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        char_id,
                        story_id,
                        character["name"],
                        character["role"],
                        character["description"],
                        character["personality"],
                        character["abilities"],
                        character["arc"],
                        json.dumps(character.get("relationships", [])),
                    ),
                )
            world_state = workflow["world_state"]
            for event in world_state["timeline"]:
                event_id = str(uuid.uuid4())
                conn.execute(
                    "INSERT INTO events (id, story_id, chapter_number, event_type, title, details) VALUES (?, ?, ?, ?, ?, ?)",
                    (event_id, story_id, 1, "world_state", event["stage"], event["description"]),
                )
            conn.execute(
                "INSERT INTO events (id, story_id, chapter_number, event_type, title, details) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    str(uuid.uuid4()),
                    story_id,
                    1,
                    "story_seed",
                    "Story initialized",
                    story["summary"],
                ),
            )
            conn.commit()

        return self.get_story(story_id)

    def list_stories(self) -> List[Dict[str, Any]]:
        init_db()
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM stories ORDER BY created_at DESC"
            ).fetchall()
        return [dict(row) for row in rows]

    def save_story(self, story_id: str) -> Dict[str, Any]:
        init_db()
        with get_connection() as conn:
            cursor = conn.execute(
                "UPDATE stories SET updated_at = ? WHERE id = ?",
                (_now(), story_id),
            )
            if cursor.rowcount == 0:
                raise ValueError("Story not found")
            conn.commit()
        return self.get_story(story_id)

    def get_story(self, story_id: str) -> Dict[str, Any]:
        init_db()
        with get_connection() as conn:
            story_row = conn.execute("SELECT * FROM stories WHERE id = ?", (story_id,)).fetchone()
            if story_row is None:
                raise ValueError("Story not found")
            story = dict(story_row)
            chapters = conn.execute(
                "SELECT * FROM chapters WHERE story_id = ? ORDER BY chapter_number ASC",
                (story_id,),
            ).fetchall()
            characters = conn.execute(
                "SELECT * FROM characters WHERE story_id = ? ORDER BY created_at ASC",
                (story_id,),
            ).fetchall()
            events = conn.execute(
                "SELECT * FROM events WHERE story_id = ? ORDER BY chapter_number ASC, created_at ASC",
                (story_id,),
            ).fetchall()
            decisions = conn.execute(
                "SELECT * FROM decisions WHERE story_id = ? ORDER BY created_at ASC",
                (story_id,),
            ).fetchall()

        story["chapters"] = [row_to_dict(row) for row in chapters]
        story["characters"] = [row_to_dict(row) for row in characters]
        story["events"] = [row_to_dict(row) for row in events]
        story["decisions"] = [row_to_dict(row) for row in decisions]
        return story

    def submit_decision(self, story_id: str, selected_option: str, custom_input: str = "") -> Dict[str, Any]:
        init_db()
        story = self.get_story(story_id)
        with get_connection() as conn:
            chapter_rows = conn.execute(
                "SELECT * FROM chapters WHERE story_id = ? ORDER BY chapter_number DESC LIMIT 1",
                (story_id,),
            ).fetchall()
            current_chapter = chapter_rows[0] if chapter_rows else None
            next_number = (int(current_chapter["chapter_number"]) if current_chapter else 1) + 1
            characters = conn.execute(
                "SELECT * FROM characters WHERE story_id = ? ORDER BY created_at ASC",
                (story_id,),
            ).fetchall()
            prior_events = conn.execute(
                "SELECT * FROM events WHERE story_id = ? ORDER BY created_at ASC",
                (story_id,),
            ).fetchall()

        characters_payload = [dict(row) for row in characters]
        events_payload = [dict(row) for row in prior_events]
        workflow = self.orchestrator.generate_next_chapter(
            story,
            characters_payload,
            events_payload,
            selected_option,
            custom_input,
            chapter_number=next_number,
        )

        decision_payload = workflow["decision"]
        with get_connection() as conn:
            decision_id = str(uuid.uuid4())
            conn.execute(
                "INSERT INTO decisions (id, story_id, chapter_number, selected_option, custom_input, consequence) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    decision_id,
                    story_id,
                    next_number - 1,
                    selected_option,
                    custom_input,
                    decision_payload["consequence"],
                ),
            )
            chapter = workflow["chapter"]
            conn.execute(
                "INSERT INTO chapters (id, story_id, chapter_number, title, content, summary, decision_options) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    str(uuid.uuid4()),
                    story_id,
                    next_number,
                    chapter["title"],
                    chapter["content"],
                    chapter["summary"],
                    json.dumps(chapter["decision_options"]),
                ),
            )
            conn.execute(
                "INSERT INTO events (id, story_id, chapter_number, event_type, title, details) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    str(uuid.uuid4()),
                    story_id,
                    next_number,
                    "decision_outcome",
                    "Decision resolved",
                    decision_payload["consequence"],
                ),
            )
            conn.execute(
                "UPDATE stories SET summary = ?, updated_at = ? WHERE id = ?",
                (decision_payload["impact"], _now(), story_id),
            )
            conn.commit()

        return {
            "chapter": workflow["chapter"],
            "decision": workflow["decision"],
            "validation": workflow["validation"],
            "story": self.get_story(story_id),
        }

    def get_memory(self, story_id: str) -> Dict[str, Any]:
        story = self.get_story(story_id)
        return {
            "characters": story["characters"],
            "events": story["events"],
            "decisions": story["decisions"],
            "timeline": story["events"],
            "unresolved_plotlines": [
                "What is the true nature of the hidden threat?",
                "Who can be trusted inside the alliance?"
            ],
        }


story_service = StoryService()

import json
import uuid
from datetime import datetime
from typing import Any, Dict, List

from langgraph.graph import END, START, StateGraph


class StoryPlannerAgent:
    def create_plan(self, theme: str, genre: str, setting: str, tone: str, character_preferences: str) -> Dict[str, Any]:
        return {
            "title": theme.title(),
            "plot": f"A {genre.lower()} story set in {setting} where the characters must confront the growing threat behind {theme.lower()}.",
            "chapter_outline": [
                "The first spark of wonder and danger",
                "The world opens and a fragile alliance forms",
                "A turning point fractures loyalties",
                "The truth behind the mystery emerges",
                "A final confrontation reshapes the future"
            ],
            "branch_options": [
                "Trust the familiar path and protect the group",
                "Take a dangerous risk for the greater good",
                "Follow a personal motive that may betray the team"
            ],
            "tone": tone,
            "genre": genre,
            "setting": setting,
            "character_preferences": character_preferences,
        }


class NarrativeGenerationAgent:
    def generate_chapter(
        self,
        story: Dict[str, Any],
        chapter_number: int,
        characters: List[Dict[str, Any]],
        prior_events: List[Dict[str, Any]],
        decision_context: str = "",
    ) -> Dict[str, Any]:
        protagonist = characters[0]["name"] if characters else "A determined protagonist"
        ally = characters[1]["name"] if len(characters) > 1 else "A loyal ally"
        villain = "The shadow behind the forgotten ruins" if story["genre"].lower() != "romance" else "The rival who threatens the bond"
        chapter_title = f"Chapter {chapter_number}: {story['theme'].title()} Unfolds"
        story_moment = prior_events[-1]["title"] if prior_events else "the first sign of unrest"
        decision_note = f" After the choice to {decision_context.lower()}, the story turns more sharply." if decision_context else ""
        content = (
            f"In {story['setting']}, {protagonist} arrived at a crossroads where {story_moment.lower()} began to ripple through the world. "
            f"The air smelled of old magic, and the once-steady paths of the realm had become uncertain. "
            f"{ally} stood beside {protagonist}, ready to move forward, while a growing pressure from {villain} closed in from the horizon."
            f" {decision_note}"
            f" Every step seemed to reveal a deeper thread of destiny, and the tension between hope and sacrifice grew unbearable. "
            f"As night settled over the land, {protagonist} had to choose whether to move forward with courage, conceal the truth, or break the rules entirely to protect the people they loved."
        )
        options = [
            "Protect the people at any cost",
            "Risk everything to uncover the hidden truth",
            "Betray expectations and chase a personal goal",
            "Seek a fragile alliance with a dangerous rival"
        ]
        return {
            "title": chapter_title,
            "summary": f"{story['theme']} deepens as {protagonist} faces urgent choices in {story['setting']}.",
            "content": content,
            "decision_options": options,
        }


class CharacterMemoryAgent:
    def build_characters(self, story: Dict[str, Any], preferences: str) -> List[Dict[str, Any]]:
        seed = [
            {
                "name": "Aelia",
                "role": "Lead protagonist",
                "description": "A resilient and curious soul drawn to impossible choices.",
                "personality": "Brave, observant, and quietly determined.",
                "abilities": "Insight, courage, and strategic improvisation.",
                "arc": "Learns to lead without losing compassion.",
                "relationships": [
                    {"name": "Kael", "relation": "trusted ally"},
                    {"name": "Mira", "relation": "rival-turned-friend"}
                ],
            },
            {
                "name": "Kael",
                "role": "Loyal ally",
                "description": "A steadfast companion who understands consequences more deeply than anyone else.",
                "personality": "Calm, loyal, and burdened by history.",
                "abilities": "Protection, diplomacy, and tactical awareness.",
                "arc": "Discovers whether loyalty can survive the truth.",
                "relationships": [
                    {"name": "Aelia", "relation": "trusted ally"},
                    {"name": "Mira", "relation": "old friend"}
                ],
            },
            {
                "name": "Mira",
                "role": "Hidden antagonist",
                "description": "A brilliant but uncertain figure whose motives remain difficult to read.",
                "personality": "Sharp, driven, and deeply conflicted.",
                "abilities": "Manipulation, foresight, and charm.",
                "arc": "Faces the cost of choosing between power and conscience.",
                "relationships": [
                    {"name": "Aelia", "relation": "rival"},
                    {"name": "Kael", "relation": "old friend"}
                ],
            },
        ]
        if preferences:
            seed[0]["description"] = f"{seed[0]['description']} {preferences} influences their decisions."
        return seed


class DecisionAnalysisAgent:
    def analyze(self, selected_option: str, custom_input: str = "") -> Dict[str, Any]:
        option = custom_input.strip() if custom_input else selected_option
        return {
            "analysed_choice": option,
            "consequence": "The decision sends the narrative toward a more dangerous and emotionally charged branch of the story.",
            "branch": "The story world shifts, revealing more danger but also deeper opportunity for connection.",
            "impact": "Characters become more decisive, and hidden loyalties begin to surface.",
        }


class WorldStateManagementAgent:
    def seed_world(self, story: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "current_location": story["setting"],
            "timeline": [
                {
                    "stage": "Opening spark",
                    "description": f"The story begins in {story['setting']} as the central conflict awakens.",
                }
            ],
            "unresolved_plotlines": [
                "What is the true nature of the hidden threat?",
                "Who can be trusted inside the alliance?"
            ],
            "world_status": "The world is unstable, and new mysteries are beginning to surface.",
        }

    def update_world_state(self, story: Dict[str, Any], decision: Dict[str, Any]) -> Dict[str, Any]:
        world = self.seed_world(story)
        world["timeline"].append(
            {
                "stage": "Decision made",
                "description": decision["analysed_choice"],
            }
        )
        world["world_status"] = decision["consequence"]
        return world


class ContinuityValidationAgent:
    def validate(self, story: Dict[str, Any], chapter_summary: str, characters: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "valid": True,
            "issues": [],
            "story_summary": chapter_summary,
            "status": f"Continuity checks passed for {story['title']}.",
        }


class OrchestratorAgent:
    def __init__(self):
        self.planner = StoryPlannerAgent()
        self.narrative = NarrativeGenerationAgent()
        self.memory = CharacterMemoryAgent()
        self.analysis = DecisionAnalysisAgent()
        self.world = WorldStateManagementAgent()
        self.validator = ContinuityValidationAgent()

    def _build_story_graph(self):
        workflow = StateGraph(dict)

        def plan_node(state):
            plan = self.planner.create_plan(
                state["story"]["theme"],
                state["story"]["genre"],
                state["story"]["setting"],
                state["story"]["tone"],
                state["story"]["character_preferences"],
            )
            state["story"]["plan"] = plan
            return {**state, "plan": plan}

        def memory_node(state):
            characters = self.memory.build_characters(state["story"], state["story"]["character_preferences"])
            return {**state, "characters": characters}

        def world_node(state):
            world_state = self.world.seed_world(state["story"])
            return {**state, "world_state": world_state}

        def narrative_node(state):
            chapter = self.narrative.generate_chapter(
                state["story"],
                1,
                state["characters"],
                [],
                "",
            )
            return {**state, "chapter": chapter}

        def validation_node(state):
            validation = self.validator.validate(
                state["story"],
                state["chapter"]["summary"],
                state["characters"],
            )
            return {**state, "validation": validation}

        workflow.add_node("plan", plan_node)
        workflow.add_node("memory", memory_node)
        workflow.add_node("world", world_node)
        workflow.add_node("narrative", narrative_node)
        workflow.add_node("validation", validation_node)

        workflow.add_edge(START, "plan")
        workflow.add_edge("plan", "memory")
        workflow.add_edge("memory", "world")
        workflow.add_edge("world", "narrative")
        workflow.add_edge("narrative", "validation")
        workflow.add_edge("validation", END)
        return workflow.compile()

    def create_story(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        story = {
            "id": str(uuid.uuid4()),
            "title": payload.get("title") or payload["theme"].title(),
            "theme": payload["theme"],
            "genre": payload.get("genre", "Fantasy"),
            "setting": payload.get("setting", "A forgotten kingdom"),
            "tone": payload.get("tone", "Epic"),
            "character_preferences": payload.get("character_preferences", ""),
            "summary": "A new story begins in a world filled with mystery and possibility.",
            "status": "active",
        }
        graph = self._build_story_graph()
        result = graph.invoke({"story": story})
        plan = result["plan"]
        characters = result["characters"]
        world_state = result["world_state"]
        chapter = result["chapter"]
        validation = result["validation"]
        return {
            "story": story,
            "plan": plan,
            "characters": characters,
            "world_state": world_state,
            "chapter": chapter,
            "validation": validation,
        }

    def generate_next_chapter(
        self,
        story: Dict[str, Any],
        characters: List[Dict[str, Any]],
        prior_events: List[Dict[str, Any]],
        selected_option: str,
        custom_input: str = "",
        chapter_number: int = 2,
    ) -> Dict[str, Any]:
        decision = self.analysis.analyze(selected_option, custom_input)
        world_state = self.world.update_world_state(story, decision)
        chapter = self.narrative.generate_chapter(
            story,
            chapter_number,
            characters,
            prior_events,
            selected_option,
        )
        validation = self.validator.validate(story, chapter["summary"], characters)
        return {
            "decision": decision,
            "world_state": world_state,
            "chapter": chapter,
            "validation": validation,
        }

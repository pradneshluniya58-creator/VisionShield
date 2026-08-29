import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "VisionShield Backend is running"
    }


class AnalyzeRequest(BaseModel):
    sanitized_dom: list
    privacy_manifest: dict
    task: str
class Action(BaseModel):
    type: str
    safety: str
    selector: str | None = None
    direction: str | None = None

class Metrics(BaseModel):
    processing_time_ms: float
    allowed_actions: int
    confirmation_required: int

class AnalyzeResponse(BaseModel):
    actions: list[Action]
    metrics: Metrics


ALLOWED_ACTIONS = {
    "scroll",
    "highlight",
    "focus"
}

CONFIRMATION_ACTIONS = {
    "submit",
    "pay",
    "delete"
}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    start_time = time.perf_counter()
    if request.privacy_manifest.get("raw_pii_uploaded", False):
        return {
            "actions": [],
            "error": "Raw PII upload is not allowed"
        }

    # Mock reasoning for now
    task = request.task.lower()

    actions = []

    if "scroll" in task:
        actions.append({
            "type": "scroll",
            "direction": "down"
        })

    if "education" in task or "highlight" in task:
        actions.append({
            "type": "highlight",
            "selector": "#education"
        })

    if "submit" in task:
        actions.append({
            "type": "submit",
            "selector": "#submit-button"
        })
    if "pay" in task:
        actions.append({
            "type": "pay",
            "selector": "#pay-button"
        })

    if "delete" in task:
        actions.append({
            "type": "delete",
            "selector": "#delete-button"
        })

    # Safety validation
    validated_actions = []

    for action in actions:

        action_type = action.get("type")

        if action_type in ALLOWED_ACTIONS:

            action["safety"] = "allowed"
            validated_actions.append(action)

        elif action_type in CONFIRMATION_ACTIONS:

            action["safety"] = "requires_confirmation"
            validated_actions.append(action)

        else:

            # Unknown actions are rejected
            continue
    processing_time_ms = (time.perf_counter() - start_time) * 1000
    allowed_count = sum(
        1 for action in validated_actions
        if action["safety"] == "allowed"
    )

    confirmation_count = sum(
        1 for action in validated_actions
        if action["safety"] == "requires_confirmation"
    )
    return {
        "actions": validated_actions,
        "metrics": {
            "processing_time_ms": round(processing_time_ms, 2),
            "allowed_actions": allowed_count,
            "confirmation_required": confirmation_count
        }
    }
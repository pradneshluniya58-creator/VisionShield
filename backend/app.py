from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "VisionShield backend running"
    })


import re


def contains_raw_pii(data):
    """
    Check whether recognizable raw PII appears
    in the received sanitized DOM.

    The image is intentionally excluded because
    Base64 image data can randomly match text patterns.
    """

    sanitized_dom = data.get("sanitized_dom", [])

    text = str(sanitized_dom)

    patterns = {
        "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",

        "phone": r"\b(?:\+91[\s-]?)?[6-9]\d{9}\b",

        "pan": r"\b[A-Z]{5}[0-9]{4}[A-Z]\b"
    }

    detected = []

    for pii_type, pattern in patterns.items():

        if re.search(pattern, text, re.IGNORECASE):
            detected.append(pii_type)

    return detected
    """
    Check whether recognizable raw PII appears
    anywhere inside the received JSON data.
    """

def contains_raw_pii(data):
    # Only inspect textual/sanitized data.
    # Do NOT scan the Base64 image.
    sanitized_dom = data.get("sanitized_dom", [])

    text = str(sanitized_dom)

    patterns = {
        "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",

        "phone": r"\b(?:\+91[\s-]?)?[6-9]\d{9}\b",

        "pan": r"\b[A-Z]{5}[0-9]{4}[A-Z]\b"
    }

    detected = []

    for pii_type, pattern in patterns.items():

        if re.search(pattern, text, re.IGNORECASE):
            detected.append(pii_type)

    return detected


@app.route("/receive-sanitized", methods=["POST"])
def receive_sanitized():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "error": "No JSON data received"
        }), 400

    sanitized_dom = data.get("sanitized_dom")
    sanitized_image = data.get("sanitized_image")

    # Check the actual received payload
    raw_pii_types = contains_raw_pii(data)

    privacy_verified = len(raw_pii_types) == 0

    print("\n==============================")
    print("VisionShield: Data Received")
    print("==============================")

    print(
        "Sanitized DOM:",
        bool(sanitized_dom)
    )

    print(
        "Sanitized Image:",
        bool(sanitized_image)
    )

    print(
        "Raw PII detected:",
        raw_pii_types if raw_pii_types else "NONE"
    )

    print(
        "Raw PII received:",
        0 if privacy_verified else len(raw_pii_types)
    )

    print(
        "Privacy verification:",
        "PASSED" if privacy_verified else "FAILED"
    )

    return jsonify({

        "success": privacy_verified,

        "rawPIIReceived":
            0 if privacy_verified
            else len(raw_pii_types),

        "rawPIITypes":
            raw_pii_types,

        "privacyVerified":
            privacy_verified
    })

@app.route("/agent", methods=["POST"])
def agent():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "error": "No agent data received"
        }), 400

    task = data.get("task", "")
    sanitized_dom = data.get("sanitized_dom", [])

    print("\n==============================")
    print("VisionShield: Agent Request")
    print("==============================")

    print("Task:", task)
    print("Sanitized DOM received:", bool(sanitized_dom))

    # -------------------------------------------------
    # TEMPORARY AGENT DECISION
    # -------------------------------------------------
    # We will replace this with an actual
    # LLM/VLM reasoning model later.

    action = {
        "type": "CLICK",
        "target": "submit",
        "reason": "Submit button detected in the sanitized page."
    }

    print("Agent decision:", action)

    return jsonify({
        "success": True,
        "action": action
    })


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
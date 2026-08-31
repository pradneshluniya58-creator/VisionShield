function redactElement(element, type) {

    if (!element) {
        return;
    }

    const rect = element.getBoundingClientRect();

    let overlay = element._visionShieldOverlay;

    // Create overlay if it doesn't exist
    if (!overlay) {

        overlay = document.createElement("div");

        overlay.className =
            "VisionShield-redaction-overlay";

        overlay.style.position = "fixed";
        overlay.style.backgroundColor = "#000";
        overlay.style.zIndex = "2147483647";
        overlay.style.pointerEvents = "none";

        overlay._visionShieldElement = element;

        document.body.appendChild(overlay);

        element._visionShieldOverlay = overlay;
    }

    // Set initial position and size
    overlay.style.left =
        `${rect.left}px`;

    overlay.style.top =
        `${rect.top}px`;

    overlay.style.width =
        `${rect.width}px`;

    overlay.style.height =
        `${rect.height}px`;

    overlay.dataset.type = type;

    element.dataset.visionShieldRedacted =
        "true";

    // Start tracking
    startRedactionTracking();
}


/* =========================================================
   UPDATE REDACTION POSITIONS
   ========================================================= */

function updateRedactionPositions() {

    document
        .querySelectorAll(
            ".VisionShield-redaction-overlay"
        )
        .forEach(overlay => {

            const element =
                overlay._visionShieldElement;

            if (!element) {
                return;
            }

            const rect =
                element.getBoundingClientRect();

            overlay.style.left =
                `${rect.left}px`;

            overlay.style.top =
                `${rect.top}px`;

            overlay.style.width =
                `${rect.width}px`;

            overlay.style.height =
                `${rect.height}px`;
        });
}


/* =========================================================
   CONTINUOUS REDACTION TRACKING
   ========================================================= */

var redactionAnimationFrame = null;

function trackRedactions() {

    updateRedactionPositions();

    redactionAnimationFrame =
        requestAnimationFrame(trackRedactions);
}


function startRedactionTracking() {

    if (redactionAnimationFrame !== null) {
        return;
    }

    trackRedactions();
}


function stopRedactionTracking() {

    if (redactionAnimationFrame !== null) {

        cancelAnimationFrame(
            redactionAnimationFrame
        );

        redactionAnimationFrame = null;
    }
}


/* =========================================================
   CLEAR ALL REDACTIONS
   ========================================================= */

function clearRedactions() {

    // Stop animation loop
    stopRedactionTracking();

    // Remove overlays
    document
        .querySelectorAll(
            ".VisionShield-redaction-overlay"
        )
        .forEach(overlay => {

            overlay.remove();

        });

    // Remove redaction state
    document
        .querySelectorAll(
            '[data-vision-shield-redacted="true"]'
        )
        .forEach(element => {

            delete element.dataset
                .visionShieldRedacted;

            delete element
                ._visionShieldOverlay;

        });
}
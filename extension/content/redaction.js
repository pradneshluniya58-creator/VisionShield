function redactElement(element, type) {

    if (!element) {
        return;
    }

    let overlay = element._visionShieldOverlay;

    // Create overlay if it doesn't exist
    if (!overlay) {

        overlay = document.createElement("div");

        overlay.className =
            "VisionShield-redaction-overlay";

        // IMPORTANT:
        // getBoundingClientRect() uses viewport coordinates,
        // so the overlay must also use fixed positioning.
        overlay.style.position = "fixed";

        overlay.style.backgroundColor = "#000";
        overlay.style.zIndex = "2147483647";
        overlay.style.pointerEvents = "none";

        overlay._visionShieldElement = element;

        document.body.appendChild(overlay);

        element._visionShieldOverlay = overlay;
    }

    updateOverlayPosition(overlay, element);

    overlay.dataset.type = type;

    element.dataset.visionShieldRedacted = "true";

    startRedactionTracking();
}


/* =========================================================
   UPDATE ONE OVERLAY
   ========================================================= */

function updateOverlayPosition(overlay, element) {

    if (!overlay || !element) {
        return;
    }

    const rect = element.getBoundingClientRect();

    overlay.style.left = `${rect.left}px`;
    overlay.style.top = `${rect.top}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
}


/* =========================================================
   UPDATE ALL REDACTION POSITIONS
   ========================================================= */

function updateRedactionPositions() {

    document
        .querySelectorAll(".VisionShield-redaction-overlay")
        .forEach(overlay => {

            const element =
                overlay._visionShieldElement;

            if (!element) {
                return;
            }

            updateOverlayPosition(
                overlay,
                element
            );
        });
}


/* =========================================================
   SCROLL / RESIZE TRACKING
   ========================================================= */

var redactionUpdateScheduled = false;

function scheduleRedactionUpdate() {

    if (redactionUpdateScheduled) {
        return;
    }

    redactionUpdateScheduled = true;

    requestAnimationFrame(() => {

        updateRedactionPositions();

        redactionUpdateScheduled = false;

    });
}


function startRedactionTracking() {

    if (window._visionShieldTrackingStarted) {
        return;
    }

    window._visionShieldTrackingStarted = true;

    window.addEventListener(
        "scroll",
        scheduleRedactionUpdate,
        true
    );

    window.addEventListener(
        "resize",
        scheduleRedactionUpdate
    );
}


/* =========================================================
   STOP TRACKING
   ========================================================= */

function stopRedactionTracking() {

    if (!window._visionShieldTrackingStarted) {
        return;
    }

    window.removeEventListener(
        "scroll",
        scheduleRedactionUpdate,
        true
    );

    window.removeEventListener(
        "resize",
        scheduleRedactionUpdate
    );

    window._visionShieldTrackingStarted = false;

    redactionUpdateScheduled = false;
}


/* =========================================================
   CLEAR ALL REDACTIONS
   ========================================================= */

function clearRedactions() {

    // Stop all redaction tracking
    stopRedactionTracking();
    stopImageRedactionTracking();
    stopVisionRedactionTracking();

    // Remove DOM PII redaction overlays
    document
        .querySelectorAll(
            ".VisionShield-redaction-overlay"
        )
        .forEach(overlay => {
            overlay.remove();
        });

    // Remove image redaction overlays
    document
        .querySelectorAll(
            ".VisionShield-image-overlay"
        )
        .forEach(overlay => {
            overlay.remove();
        });

    // Remove vision/object redaction overlays
    document
        .querySelectorAll(
            ".VisionShield-vision-overlay"
        )
        .forEach(overlay => {
            overlay.remove();
        });

    // Restore elements that were marked as redacted
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

// ============================================================
// IMAGE REDACTION
// ============================================================

function redactImage(img) {
    if (!img) return null;

    const rect = img.getBoundingClientRect();

    if (
        rect.width < 50 ||
        rect.height < 50 ||
        rect.bottom < 0 ||
        rect.top > window.innerHeight ||
        rect.right < 0 ||
        rect.left > window.innerWidth
    ) {
        return null;
    }

    const overlay = document.createElement("div");

    overlay.className = "VisionShield-image-overlay";

    overlay.style.position = "fixed";
    overlay.style.background = "#000000";
    overlay.style.opacity = "1";
    overlay.style.filter = "none";
    overlay.style.zIndex = "2147483647";
    overlay.style.pointerEvents = "none";
    overlay.style.boxSizing = "border-box";

    document.body.appendChild(overlay);

    function updatePosition() {
        const currentRect = img.getBoundingClientRect();

        overlay.style.left = `${currentRect.left}px`;
        overlay.style.top = `${currentRect.top}px`;
        overlay.style.width = `${currentRect.width}px`;
        overlay.style.height = `${currentRect.height}px`;
    }

    updatePosition();

    overlay._visionShieldImage = img;

    return overlay;
}


function redactSensitiveImages() {
    document
        .querySelectorAll(".VisionShield-image-overlay")
        .forEach(overlay => overlay.remove());

    const images = document.querySelectorAll("img");

    let imageCount = 0;

    images.forEach((img, index) => {
        const overlay = redactImage(img);

        if (overlay) {
            imageCount++;

            console.log(
                `VisionShield: Image ${index + 1} protected`
            );
        }
    });

    console.log(
        "VisionShield: Total protected images:",
        imageCount
    );

    startImageRedactionTracking();

    return imageCount;
}

// ============================================================
// VISION DETECTION REDACTION
// ============================================================

const allowedVisualLabels = [
    "person",
    "face",
    "document",
    "cat"
];

var visionTrackingStarted = false;

function redactVisionDetections(
    detections,
    screenshotWidth,
    screenshotHeight
) {
    document
        .querySelectorAll(".VisionShield-vision-overlay")
        .forEach(overlay => overlay.remove());

    stopVisionRedactionTracking();

    if (
        !screenshotWidth ||
        !screenshotHeight
    ) {
        return 0;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const scaleX =
        viewportWidth / screenshotWidth;

    const scaleY =
        viewportHeight / screenshotHeight;

    // Remember the scroll position when the screenshot
    // was captured.
    const captureScrollX = window.scrollX;
    const captureScrollY = window.scrollY;

    let redactedCount = 0;

    detections.forEach((detection, index) => {

        const box = detection.box;

        if (!box) {
            return;
        }

        if (!allowedVisualLabels.includes(detection.label)) {
            return;
        }

        const overlay = document.createElement("div");

        overlay.className =
            "VisionShield-vision-overlay";

        overlay.dataset.detectionIndex = index;

        overlay.style.position = "fixed";
        overlay.style.background = "#000000";
        overlay.style.opacity = "1";
        overlay.style.filter = "none";
        overlay.style.zIndex = "2147483647";
        overlay.style.pointerEvents = "none";
        overlay.style.boxSizing = "border-box";

        // Store everything needed to keep the box aligned
        // while the page scrolls.
        overlay._visionShieldBox = box;
        overlay._visionShieldScaleX = scaleX;
        overlay._visionShieldScaleY = scaleY;
        overlay._visionShieldCaptureScrollX = captureScrollX;
        overlay._visionShieldCaptureScrollY = captureScrollY;

        document.body.appendChild(overlay);

        updateVisionOverlayPosition(overlay);

        redactedCount++;
    });

    if (redactedCount > 0) {
        startVisionRedactionTracking();
    }

    return redactedCount;
}


function updateVisionOverlayPosition(overlay) {

    const box =
        overlay._visionShieldBox;

    if (!box) {
        return;
    }

    const scaleX =
        overlay._visionShieldScaleX;

    const scaleY =
        overlay._visionShieldScaleY;

    const captureScrollX =
        overlay._visionShieldCaptureScrollX;

    const captureScrollY =
        overlay._visionShieldCaptureScrollY;

    // Original position inside the screenshot viewport.
    const originalLeft =
        box.xmin * scaleX;

    const originalTop =
        box.ymin * scaleY;

    const width =
        (box.xmax - box.xmin) * scaleX;

    const height =
        (box.ymax - box.ymin) * scaleY;

    // Move the overlay along with the page.
    const scrollDeltaX =
        window.scrollX - captureScrollX;

    const scrollDeltaY =
        window.scrollY - captureScrollY;

    overlay.style.left =
        `${originalLeft - scrollDeltaX}px`;

    overlay.style.top =
        `${originalTop - scrollDeltaY}px`;

    overlay.style.width =
        `${width}px`;

    overlay.style.height =
        `${height}px`;
}


function updateVisionRedactionPositions() {

    document
        .querySelectorAll(".VisionShield-vision-overlay")
        .forEach(updateVisionOverlayPosition);
}


function startVisionRedactionTracking() {

    if (visionTrackingStarted) {
        return;
    }

    visionTrackingStarted = true;

    window.addEventListener(
        "scroll",
        updateVisionRedactionPositions,
        true
    );

    window.addEventListener(
        "resize",
        updateVisionRedactionPositions
    );
}


function stopVisionRedactionTracking() {

    if (!visionTrackingStarted) {
        return;
    }

    window.removeEventListener(
        "scroll",
        updateVisionRedactionPositions,
        true
    );

    window.removeEventListener(
        "resize",
        updateVisionRedactionPositions
    );

    visionTrackingStarted = false;
}


// ============================================================
// IMAGE REDACTION POSITION TRACKING
// ============================================================

var imageTrackingStarted = false;
var imageUpdateScheduled = false;

function updateImageRedactionPositions() {
    document
        .querySelectorAll(".VisionShield-image-overlay")
        .forEach(overlay => {
            const img = overlay._visionShieldImage;

            if (!img || !document.contains(img)) {
                return;
            }

            const rect = img.getBoundingClientRect();

            overlay.style.left = `${rect.left}px`;
            overlay.style.top = `${rect.top}px`;
            overlay.style.width = `${rect.width}px`;
            overlay.style.height = `${rect.height}px`;
        });
}

function scheduleImageRedactionUpdate() {
    if (imageUpdateScheduled) {
        return;
    }

    imageUpdateScheduled = true;

    requestAnimationFrame(() => {
        updateImageRedactionPositions();
        imageUpdateScheduled = false;
    });
}

function startImageRedactionTracking() {
    if (imageTrackingStarted) {
        return;
    }

    imageTrackingStarted = true;

    window.addEventListener(
        "scroll",
        scheduleImageRedactionUpdate,
        true
    );

    window.addEventListener(
        "resize",
        scheduleImageRedactionUpdate
    );

    // Initial synchronization
    scheduleImageRedactionUpdate();
}

function stopImageRedactionTracking() {
    if (!imageTrackingStarted) {
        return;
    }

    window.removeEventListener(
        "scroll",
        scheduleImageRedactionUpdate,
        true
    );

    window.removeEventListener(
        "resize",
        scheduleImageRedactionUpdate
    );

    imageTrackingStarted = false;
    imageUpdateScheduled = false;
}
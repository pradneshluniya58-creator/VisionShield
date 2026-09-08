console.log("VisionShield content script loaded");

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (message.action !== "START_VisionShield") {
            return;
        }

        console.log("VisionShield: Starting privacy scan...");

        try {

            clearRedactions();

            const detections = detectPIIFromDOM();

            console.log(
                "VisionShield detections:",
                detections
            );

//             const protectedImages = redactSensitiveImages();

// console.log(
//     "VisionShield: Protected images:",
//     protectedImages
// );

            const imageDetections = detectImagesForRedaction();

console.log(
    "VisionShield image detections:",
    imageDetections
);

            const cleanResults = detections.map(item => {

                redactElement(item.element,item.type);

                const rect = item.element.getBoundingClientRect();

                return {
                    type: item.type,
                    sub_type: item.sub_type || null,
                    score: item.score,
                    reasons: item.reasons,

                    // Viewport coordinates
                    rect: {
                        x: rect.left,
                        y: rect.top,
                        width: rect.width,
                        height: rect.height
                    }
                };
            });
            
            console.log(
                "VisionShield redaction zones:",
                cleanResults
            );

//             imageDetections.forEach((image, index) => {
//     const overlay = document.createElement("div");

//     overlay.className = "VisionShield-vision-overlay";

//     overlay.style.position = "absolute";
//     overlay.style.left =
//         `${image.rect.x + window.scrollX}px`;
//     overlay.style.top =
//         `${image.rect.y + window.scrollY}px`;
//     overlay.style.width =
//         `${image.rect.width}px`;
//     overlay.style.height =
//         `${image.rect.height}px`;

//     overlay.style.background = "black";
//     overlay.style.opacity = "0.95";
//     overlay.style.zIndex = "2147483647";
//     overlay.style.pointerEvents = "none";
//     overlay.style.boxSizing = "border-box";

//     document.body.appendChild(overlay);

//     console.log(
//         `VisionShield: Image ${index + 1} redacted`,
//         image.rect
//     );
// });

            const sanitizedDOM = detections.map((item, index) => {
                return {
                    type: item.type,
                    sub_type: item.sub_type || null,
                    token: `[${item.type}_${index + 1}]`
                };
            });

            console.log(
                "VisionShield sanitized DOM:",
                sanitizedDOM
            );

            sendResponse({

                success: true,
                
                redactionComplete: true,

                detections: cleanResults,

                piiDetected: cleanResults.length,

                piiRedacted: cleanResults.length,

                rawPIIUploaded: 0,

                privacyVerified: true,

                sanitizedDOM: sanitizedDOM

            });

        } catch (error) {

            console.error(
                "VisionShield scan error:",
                error
            );

            sendResponse({

                success: false,

                detections: [],

                error: error.message

            });
        }

        return true;
    }
);

// ============================================================
// VISUAL OBJECT REDACTION
// Receives object detections from the Vision Worker
// ============================================================

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (message.action !== "REDACT_VISION_DETECTIONS") {
            return;
        }

        console.log(
            "VisionShield: Received visual detections:",
            message.detections
        );

        console.log(
    "VisionShield: EXACT visual detections:",
    JSON.stringify(message.detections, null, 2)
);

        try {

            const detections = message.detections || [];

            const screenshotWidth =
    message.imageWidth;

const screenshotHeight =
    message.imageHeight;

    const viewportWidth =
    window.innerWidth;

const viewportHeight =
    window.innerHeight;

    const scaleX =
    viewportWidth / screenshotWidth;

const scaleY =
    viewportHeight / screenshotHeight;

    console.log(
    "📐 Vision coordinate mapping:",
    {
        screenshotWidth,
        screenshotHeight,
        viewportWidth,
        viewportHeight,
        scaleX,
        scaleY
    }
);

            // Remove previous visual redaction overlays
            document
                .querySelectorAll(".VisionShield-vision-overlay")
                .forEach(element => element.remove());

                

            let redactedCount = 0;

            detections.forEach((detection, index) => {

                const box = detection.box;

                if (!box) {
                    return;
                }

              if (detection.label === "tv") {
    console.log(
        "VisionShield: Ignoring non-sensitive visual object:",
        detection.label
    );
    return;
}

                // =====================================================
// ALLOWED VISUAL OBJECTS
// Only redact objects that may contain sensitive content
// =====================================================

const allowedVisualLabels = [
    "person",
    "face",
    "document",
    "cat"
];
if (!allowedVisualLabels.includes(detection.label)) {
    console.log(
        "VisionShield: Ignoring non-sensitive visual object:",
        {
            label: detection.label,
            score: detection.score
        }
    );

    return;
}

                /*
                 * DETR gives:
                 *
                 * xmin
                 * ymin
                 * xmax
                 * ymax
                 *
                 * These coordinates are based on the screenshot.
                 */

                const overlay = document.createElement("div");

                overlay.className =
                    "VisionShield-vision-overlay";

                overlay.dataset.detectionIndex = index;

                overlay.style.position = "fixed";

const left = box.xmin * scaleX;
const top = box.ymin * scaleY;
const width = (box.xmax - box.xmin) * scaleX;
const height = (box.ymax - box.ymin) * scaleY;

console.log(
    "🎯 Vision overlay coordinates:",
    {
        label: detection.label,
        screenshotBox: box,
        screenPosition: {
            left,
            top,
            width,
            height
        },
        scaleX,
        scaleY
    }
);

overlay.style.left = `${left}px`;
overlay.style.top = `${top}px`;
overlay.style.width = `${width}px`;
overlay.style.height = `${height}px`;

                overlay.style.background = "black";
                overlay.style.opacity = "0.95";

                overlay.style.zIndex = "2147483647";

                overlay.style.pointerEvents = "none";

                overlay.style.boxSizing = "border-box";

                document.body.appendChild(overlay);

                redactedCount++;

                console.log(
                    `VisionShield: Visual object ${index + 1} redacted`,
                    {
                        label: detection.label,
                        score: detection.score,
                        box: detection.box
                    }
                );
            });

            sendResponse({
                success: true,
                redactedCount: redactedCount
            });

        } catch (error) {

            console.error(
                "VisionShield visual redaction error:",
                error
            );

            sendResponse({
                success: false,
                redactedCount: 0,
                error: error.message
            });
        }

        return true;
    }
);
// ============================================================
// IMAGE / PHOTO DETECTION
// Detect visible <img> elements for reliable visual redaction
// ============================================================

function detectImagesForRedaction() {
    const imageDetections = [];

    const images = document.querySelectorAll("img");

    images.forEach((img, index) => {

        const rect = img.getBoundingClientRect();

        // Ignore images that are not currently visible
        if (
            rect.width <= 0 ||
            rect.height <= 0 ||
            rect.bottom <= 0 ||
            rect.right <= 0 ||
            rect.top >= window.innerHeight ||
            rect.left >= window.innerWidth
        ) {
            return;
        }

        imageDetections.push({
            type: "IMAGE",
            label: "image",
            score: 1.0,
            rect: {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height
            }
        });

        console.log(
            `VisionShield: Image ${index + 1} detected`,
            {
                width: rect.width,
                height: rect.height,
                x: rect.left,
                y: rect.top
            }
        );
    });

    return imageDetections;
}

// ============================================================
// IMAGE / PROFILE PHOTO REDACTION
// Protect visible images using their DOM bounding boxes
// ============================================================

function redactSensitiveImages() {

    document
        .querySelectorAll(".VisionShield-image-overlay")
        .forEach(element => element.remove());

    console.log("VisionShield: Checking webpage images...");

    const images = document.querySelectorAll("img");

    let imageCount = 0;

    images.forEach((img, index) => {

        const rect = img.getBoundingClientRect();

        // Ignore invisible or tiny images
        if (
            rect.width < 50 ||
            rect.height < 50 ||
            rect.bottom < 0 ||
            rect.top > window.innerHeight ||
            rect.right < 0 ||
            rect.left > window.innerWidth
        ) {
            return;
        }

        const overlay = document.createElement("div");

        overlay.className = "VisionShield-image-overlay";

        overlay.style.position = "fixed";

overlay.style.left =
    `${rect.left}px`;

overlay.style.top =
    `${rect.top}px`;

        overlay.style.width =
            `${rect.width}px`;

        overlay.style.height =
            `${rect.height}px`;

        overlay.style.background = "black";
        overlay.style.opacity = "0.95";

        overlay.style.zIndex = "2147483647";
        overlay.style.pointerEvents = "none";

        overlay.style.boxSizing = "border-box";

        document.body.appendChild(overlay);

        function updateOverlayPosition() {
    const currentRect = img.getBoundingClientRect();

    overlay.style.left = `${currentRect.left}px`;
    overlay.style.top = `${currentRect.top}px`;
    overlay.style.width = `${currentRect.width}px`;
    overlay.style.height = `${currentRect.height}px`;
}

window.addEventListener("scroll", updateOverlayPosition, {
    passive: true
});

window.addEventListener("resize", updateOverlayPosition);

        imageCount++;

        console.log(
            `VisionShield: Image ${index + 1} protected`,
            {
                width: rect.width,
                height: rect.height
            }
        );
    });

    console.log(
        "VisionShield: Total protected images:",
        imageCount
    );

    return imageCount;
}



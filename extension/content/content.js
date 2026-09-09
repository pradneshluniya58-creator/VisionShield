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

        try {

            const redactedCount = redactVisionDetections(
                message.detections || [],
                message.imageWidth,
                message.imageHeight
            );

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


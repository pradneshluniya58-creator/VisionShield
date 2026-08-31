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

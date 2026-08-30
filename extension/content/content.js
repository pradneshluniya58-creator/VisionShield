console.log("VisionShield content script loaded");


chrome.runtime.onMessage.addListener(
    async (message, sender, sendResponse) => {

        if (message.action !== "START_VisionShield") {

            return;
        }


        console.log(
            "VisionShield: Starting privacy scan..."
        );


        try {

            // STEP 1
            // Scan DOM

            const detections =
                detectPIIFromDOM();


            console.log(
                "VisionShield detections:",
                detections
            );


            // STEP 2
            // Highlight sensitive fields

            detections.forEach(item => {

                const element =
                    document.querySelector(
                        item.selector
                    );


                if (element) {

                    redactElement(
                        element,
                        item.type
                    );

                }

            });


            // STEP 3
            // Return safe result to popup

            const cleanResults =
                detections.map(item => ({
                    type: item.type,
                    selector: item.selector,
                    valuePresent: item.valuePresent
                }));


            console.log(
                `PII detected: ${cleanResults.length}`
            );


            console.log(
                `PII redacted: ${cleanResults.length}`
            );
const backendResponse = await fetch(
    "http://127.0.0.1:8000/analyze",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            sanitized_dom: cleanResults.map(item => ({
                type: item.type,
                selector: item.selector,
                valuePresent: item.valuePresent
            })),

            privacy_manifest: {
                raw_pii_uploaded: false,
                redaction_enabled: true
            },

            task: "scan page for sensitive information"
        })
    }
);

const backendData = await backendResponse.json();

console.log(
    "VisionShield backend response:",
    backendData
);
// STEP 4
// Execute safe actions returned by backend

const actions = backendData.actions || [];

actions.forEach(action => {

    if (action.safety === "allowed") {

        if (action.type === "scroll") {

            if (action.direction === "down") {
                window.scrollBy({
                    top: 500,
                    behavior: "smooth"
                });
            }

            if (action.direction === "up") {
                window.scrollBy({
                    top: -500,
                    behavior: "smooth"
                });
            }
        }

        else if (action.type === "highlight") {

            const element =
                document.querySelector(action.selector);

            if (element) {

                element.style.outline = "3px solid red";
                element.style.outlineOffset = "2px";
            }
        }

        else if (action.type === "focus") {

            const element =
                document.querySelector(action.selector);

            if (element) {
                element.focus();
            }
        }
    }

    else if (action.safety === "requires_confirmation") {

        console.log(
            "VisionShield: User confirmation required for:",
            action.type
        );

    }

});


            sendResponse({

                success: true,

                detections: cleanResults,

                piiDetected:
                    cleanResults.length,

                piiRedacted:
                    cleanResults.length,

                rawPIIUploaded: 0,

                privacyVerified: true

            });

        }

        catch (error) {

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
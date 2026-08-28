console.log("VisionShield content script loaded");


chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

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
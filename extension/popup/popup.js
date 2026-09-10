// =====================================================
// Screenshot preview elements
// =====================================================

const screenshotPreview =
    document.getElementById("screenshotPreview");

const screenshotStatus =
    document.getElementById("screenshotStatus");


// =====================================================
// VISION WORKER
// =====================================================

// =====================================================
// VISION WORKER
// =====================================================

const visionWorker =
    new Worker(
        chrome.runtime.getURL(
            "vision/worker.bundle.js"
        ),
        {
            type: "module"
        }
    );

let lastSanitizedDOM = [];

const scanView = document.getElementById("scanView");
const scanSteps = document.getElementById("scanSteps");
const resultArea = document.getElementById("resultArea");

const scanCircle = document.querySelector(".scan-circle");
const scanTitle = document.querySelector(".scan-title");
const scanDescription = document.querySelector(".scan-description");

const stepPII = document.getElementById("stepPII");
const stepVisual = document.getElementById("stepVisual");
const stepProtect = document.getElementById("stepProtect");
const stepVerify = document.getElementById("stepVerify");

const scanAgainBtn = document.getElementById("scanAgainBtn");


function updateScanStep(activeStep) {

    const steps = [
        stepPII,
        stepVisual,
        stepProtect,
        stepVerify
    ];

    steps.forEach((step, index) => {

        step.classList.remove("active");
        step.classList.remove("done");

        if (index < activeStep) {
            step.classList.add("done");
        }

        if (index === activeStep) {
            step.classList.add("active");
        }

    });
}

// Preload the vision model in the background


console.log(
    "VisionShield: Vision worker created"
);

console.log(
    "Vision worker URL:",
    chrome.runtime.getURL(
        "vision/worker.bundle.js"
    )
);


visionWorker.addEventListener(
    "message",
    async (event) => {

        console.log(
            "✅ [Vision Worker MESSAGE]",
            event.data
        );

        // =================================================
        // VISION DETECTION RESULT
        // =================================================

        if (event.data.type === "RESULT") {

            const visualDetections =
                event.data.output || [];

            const imageWidth =
                event.data.imageWidth;

            const imageHeight =
                event.data.imageHeight;


            console.log(
                "📐 Vision screenshot dimensions:",
                imageWidth,
                "x",
                imageHeight
            );


            console.log(
                "🔍 Vision detections:",
                JSON.stringify(
                    visualDetections,
                    null,
                    2
                )
            );


            // ---------------------------------------------
            // Get the active tab
            // ---------------------------------------------

            const [tab] =
                await chrome.tabs.query({
                    active: true,
                    currentWindow: true
                });


            if (!tab || !tab.id) {

                console.error(
                    "❌ No active tab for visual redaction"
                );

                return;
            }


            // ---------------------------------------------
            // Send visual detections to content script
            // ---------------------------------------------

            try {
                updateScanStep(2);
                const redactionResponse =
                    await chrome.tabs.sendMessage(
                        tab.id,
                        {
                            action:
                                "REDACT_VISION_DETECTIONS",

                            detections:
                                visualDetections,

                            imageWidth:
                                imageWidth,

                            imageHeight:
                                imageHeight
                        }
                    );


                console.log(
                    "🛡️ Visual redaction response:",
                    redactionResponse
                );


                console.log(
                    "🛡️ VISUAL REDACTION RESPONSE EXACT:",
                    JSON.stringify(
                        redactionResponse,
                        null,
                        2
                    )
                );


                if (
                    !redactionResponse ||
                    !redactionResponse.success
                ) {

                    console.warn(
                        "⚠️ Visual redaction did not complete"
                    );

                    privacyStatus.textContent =
                        "ERROR";

                    return;
                }


                console.log(
                    "✅ Visual regions redacted successfully"
                );


                // =================================================
                // FINAL SANITIZED SCREENSHOT
                // Capture AFTER visual redaction
                // =================================================

                startBtn.textContent =
                    "⏳  Capturing final protected page...";

                privacyStatus.textContent =
                    "PROTECTING";

                screenshotStatus.textContent =
                    "Capturing final sanitized screenshot...";


                console.log(
                    "VisionShield: Capturing FINAL screenshot AFTER visual redaction..."
                );


                const finalScreenshotResponse =
                    await chrome.runtime.sendMessage({

                        action:
                            "CAPTURE_SCREENSHOT",

                        windowId:
                            tab.windowId

                    });


                console.log(
                    "FINAL SCREENSHOT RESPONSE:",
                    finalScreenshotResponse
                );


                // ---------------------------------------------
                // Check final screenshot
                // ---------------------------------------------

                if (
                    !finalScreenshotResponse ||
                    !finalScreenshotResponse.success
                ) {

                    throw new Error(
                        finalScreenshotResponse?.error ||
                        "Unable to capture final sanitized screenshot"
                    );
                }


                // ---------------------------------------------
                // Display final sanitized screenshot
                // ---------------------------------------------

                screenshotPreview.src =
                    finalScreenshotResponse.dataUrl;


                screenshotPreview.classList.remove(
                    "hidden"
                );


                screenshotStatus.textContent =
                    "Final sanitized screenshot captured";


                console.log(
                    "VisionShield: FINAL sanitized screenshot captured."
                );
                updateScanStep(3);


                // ---------------------------------------------
                // Create FINAL sanitized payload
                // ---------------------------------------------

                const finalSanitizedPayload = {

                    sanitized_image:
                        finalScreenshotResponse.dataUrl,

                    sanitized_dom:
                        lastSanitizedDOM,

                    visual_redactions:
                        redactionResponse.redactedCount,

                    rawPIIUploaded:
                        0

                };

                // =====================================================
                // SEND FINAL SANITIZED DATA TO BACKEND
                // =====================================================

                console.log(
                    "VisionShield: Sending FINAL sanitized data to backend..."
                );

                const privacyResponse = await fetch(
                    "http://127.0.0.1:5000/receive-sanitized",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify(
                            finalSanitizedPayload
                        )
                    }
                );

                if (!privacyResponse.ok) {
                    throw new Error(
                        "Backend rejected final sanitized data"
                    );
                }

                const privacyResult =
                    await privacyResponse.json();

                console.log(
                    "VisionShield privacy verification:",
                    privacyResult
                );

                const agentResponse = await fetch(
                    "http://127.0.0.1:5000/agent",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            task: "Review this application and submit it.",
                            sanitized_dom: lastSanitizedDOM,
                            sanitized_image: finalScreenshotResponse.dataUrl,
                            visual_redactions: redactionResponse.redactedCount
                        })
                    }
                );

                const agentResult = await agentResponse.json();

                console.log(
                    "VisionShield agent decision:",
                    agentResult
                );

                const agentExecution = await chrome.tabs.sendMessage(
                    tab.id,
                    {
                        action: "EXECUTE_AGENT_ACTION",
                        agentAction: agentResult.action
                    }
                );

                console.log(
                    "VisionShield agent execution:",
                    agentExecution
                );


                console.log(
                    "VisionShield: FINAL sanitized payload created:",
                    JSON.stringify(
                        finalSanitizedPayload,
                        null,
                        2
                    )
                );


                privacyStatus.textContent =
                    "VERIFIED";

                updateScanStep(4);

                setTimeout(() => {
                    scanView.style.display = "none";
                    resultArea.style.display = "block";
                }, 400);


                console.log(
                    "🛡️ VisionShield: Privacy protection VERIFIED"
                );

            } catch (error) {

                console.error(
                    "❌ Vision visual redaction/final screenshot error:",
                    error
                );

                privacyStatus.textContent =
                    "ERROR";

                screenshotStatus.textContent =
                    "Final sanitization failed";

            }

        }




        // =================================================
        // VISION WORKER ERROR
        // =================================================

        if (event.data.type === "ERROR") {

            console.error(
                "❌ Vision inference failed:",
                event.data.message
            );

            privacyStatus.textContent =
                "ERROR";

        }

    }
);


visionWorker.addEventListener(
    "error",
    (event) => {

        console.error(
            "❌ [Vision Worker ERROR]",
            event
        );

    }
);


visionWorker.addEventListener(
    "messageerror",
    (event) => {

        console.error(
            "❌ [Vision Worker MESSAGE ERROR]",
            event
        );

    }
);


// =====================================================
// START BUTTON
// =====================================================

async function startScan() {

    // Restore scan screen for a new scan
    scanView.style.display = "block";
    resultArea.style.display = "none";

    startBtn.textContent =
        "⏳  Scanning page...";

    startBtn.classList.add("scanning");

    privacyStatus.textContent =
        "SCANNING";

    scanCircle.style.display = "none";
    scanTitle.style.display = "none";
    scanDescription.style.display = "none";

    scanSteps.style.display = "block";
    resultArea.style.display = "none";

    updateScanStep(0);


    try {

        // =====================================================
        // GET ACTIVE TAB
        // =====================================================

        const [tab] =
            await chrome.tabs.query({
                active: true,
                currentWindow: true
            });


        if (!tab || !tab.id) {
            throw new Error("No active tab found");
        }


        // =====================================================
        // STEP 1: INJECT PII DETECTOR + REDACTION + CONTENT
        // =====================================================

        console.log(
            "VisionShield: Injecting privacy modules..."
        );


        // =====================================================
        // STEP 2: RUN DOM PII DETECTION + REDACTION
        // =====================================================

        console.log(
            "VisionShield: Starting DOM scan..."
        );


        const response =
            await chrome.tabs.sendMessage(
                tab.id,
                {
                    action: "START_VisionShield"
                }
            );

        lastSanitizedDOM =
            response.sanitizedDOM || [];


        console.log(
            "PII RESPONSE:",
            JSON.stringify(response, null, 2)
        );


        if (!response || !response.success) {

            throw new Error(
                response?.error ||
                "PII detection failed"
            );

        }


        console.log(
            "VisionShield: DOM redaction completed."
        );
        updateScanStep(1);

        // =====================================================
        // STEP 3: DISPLAY DETECTION RESULTS
        // =====================================================

        displayResults(response);


        // =====================================================
        // STEP 4: CAPTURE SCREENSHOT
        // IMPORTANT:
        // THIS HAPPENS AFTER REDACTION
        // =====================================================

        startBtn.textContent =
            "⏳  Capturing sanitized page...";

        privacyStatus.textContent =
            "PROTECTING";


        screenshotStatus.textContent =
            "Capturing sanitized screenshot...";


        console.log(
            "VisionShield: Capturing screenshot AFTER redaction..."
        );


        const screenshotResponse =
            await chrome.runtime.sendMessage({

                action: "CAPTURE_SCREENSHOT",

                windowId: tab.windowId

            });


        console.log(
            "SCREENSHOT RESPONSE:",
            screenshotResponse
        );


        // =====================================================
        // CHECK SCREENSHOT
        // =====================================================

        if (
            !screenshotResponse ||
            !screenshotResponse.success
        ) {

            throw new Error(
                screenshotResponse?.error ||
                "Unable to capture screenshot"
            );

        }




        // =====================================================
        // STEP 5: DISPLAY DOM-SANITIZED SCREENSHOT
        // =====================================================

        screenshotPreview.src =
            screenshotResponse.dataUrl;


        screenshotPreview.classList.remove(
            "hidden"
        );


        screenshotStatus.textContent =
            "DOM-Sanitized screenshot captured";


        console.log(
            "VisionShield: DOM-Sanitized screenshot captured."
        );


        // =====================================================
        // STEP 6: SEND DOM-SANITIZED SCREENSHOT
        // TO LOCAL VISION WORKER
        // =====================================================

        console.log(
            "VisionShield: Sending DOM-sanitized screenshot to local vision worker..."
        );


        const imageResponse =
            await fetch(
                screenshotResponse.dataUrl
            );


        const imageBlob =
            await imageResponse.blob();


        const imageBuffer =
            await imageBlob.arrayBuffer();


        updateScanStep(1);
        stepVisual.querySelector(".step-icon").textContent = "●";

        visionWorker.postMessage(
            {
                type: "RUN_INFERENCE",

                imageBuffer:
                    imageBuffer,

                mimeType:
                    imageBlob.type ||
                    "image/png"
            },
            [
                imageBuffer
            ]
        );


        console.log(
            "VisionShield: DOM-Sanitized screenshot sent to vision worker."
        );



    } catch (error) {

        console.error(
            "VisionShield error:",
            error
        );


        privacyStatus.textContent =
            "ERROR";


        screenshotStatus.textContent =
            "Screenshot failed";


        results.innerHTML = `

            <div class="detection">

                <div class="detection-left">

                    <div class="detection-icon">
                        ⚠️
                    </div>

                    <div class="detection-name">
                        Unable to scan this page
                    </div>

                </div>

                <div class="detection-status">
                    ERROR
                </div>

            </div>

        `;

    }


    // =====================================================
    // RESET BUTTON
    // =====================================================

    startBtn.textContent =
        "🔄  Scan Again";

    startBtn.classList.remove(
        "scanning"
    );

}

startBtn.addEventListener("click", startScan);

scanAgainBtn.addEventListener("click", startScan);


// =====================================================
// DISPLAY RESULTS
// =====================================================

function displayResults(data) {

    if (
        !data ||
        !data.detections
    ) {
        return;
    }


    const detections =
        data.detections;


    detectedCount.textContent =
        detections.length;


    redactedCount.textContent =
        detections.length;


    results.innerHTML = "";


    if (detections.length === 0) {

        results.innerHTML = `

            <div class="detection">

                <div class="detection-left">

                    <div class="detection-icon">
                        ✅
                    </div>

                    <div class="detection-name">
                        No sensitive information found
                    </div>

                </div>

                <div class="detection-status">
                    SAFE
                </div>

            </div>

        `;

        return;
    }


    detections.forEach(item => {

        const row =
            document.createElement("div");


        row.className =
            "detection";


        row.innerHTML = `

            <div class="detection-left">

                <div class="detection-icon">
                    ${getIcon(item.type)}
                </div>

                <div class="detection-name">
                    ${item.type}
                </div>

            </div>

            <div class="detection-status">
                DETECTED
            </div>

        `;


        results.appendChild(row);

    });

}


// =====================================================
// ICONS
// =====================================================

function getIcon(type) {

    switch (type) {

        case "EMAIL":
            return "✉️";

        case "PHONE":
            return "📱";

        case "PASSWORD":
            return "🔑";

        case "ID":
        case "GOV_ID":
            return "🪪";

        case "ADDRESS":
            return "📍";

        case "NAME":
            return "👤";

        default:
            return "🔒";
    }
}
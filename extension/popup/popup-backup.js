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
    (event) => {

        console.log(
            "✅ [Vision Worker MESSAGE]",
            event.data
        );

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

startBtn.addEventListener("click", async () => {

    startBtn.textContent =
        "⏳  Scanning page...";

    startBtn.classList.add("scanning");

    privacyStatus.textContent =
        "SCANNING";


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


        await chrome.scripting.executeScript({

            target: {
                tabId: tab.id
            },

            files: [
                "content/piiDetector.js",
                "content/redaction.js",
                "content/content.js"
            ]

        });


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
        // STEP 5A: CREATE SANITIZED PAYLOAD
        // =====================================================

        const sanitizedPayload = {
            sanitized_image:
            screenshotResponse.dataUrl,

            sanitized_dom:
            response.sanitizedDOM

        };

        console.log(
            "VisionShield: Sanitized payload created:",
            JSON.stringify(sanitizedPayload, null, 2)
        );


        // =====================================================
        // STEP 5: DISPLAY SANITIZED SCREENSHOT
        // =====================================================

        screenshotPreview.src =
            screenshotResponse.dataUrl;


        screenshotPreview.classList.remove(
            "hidden"
        );


        screenshotStatus.textContent =
            "Sanitized screenshot captured";


        console.log(
            "VisionShield: Sanitized screenshot captured."
        );


        // =====================================================
        // STEP 6: SEND SANITIZED SCREENSHOT
        // TO LOCAL VISION WORKER
        // =====================================================

        console.log(
            "VisionShield: Sending sanitized screenshot to local vision worker..."
        );


        const imageResponse =
            await fetch(
                screenshotResponse.dataUrl
            );


        const imageBlob =
            await imageResponse.blob();


        const imageBuffer =
            await imageBlob.arrayBuffer();


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
            "VisionShield: Sanitized screenshot sent to vision worker."
        );


        // =====================================================
        // STEP 7: FINAL STATUS
        // =====================================================

        privacyStatus.textContent =
            "VERIFIED";


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

});


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
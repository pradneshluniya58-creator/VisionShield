

// Screenshot preview elements
const screenshotPreview =
    document.getElementById("screenshotPreview");

const screenshotStatus =
    document.getElementById("screenshotStatus");
    const visionWorker =
    new Worker(
        chrome.runtime.getURL(
            "vision/worker.bundle.js"
        ),
        {
            type: "module"
        }
    );


visionWorker.addEventListener(
    "message",
    (event) => {

        console.log(
            "[Vision Worker]",
            event.data
        );

    }
);
startBtn.addEventListener("click", async () => {

    startBtn.textContent = "⏳  Capturing page...";
    startBtn.classList.add("scanning");

    privacyStatus.textContent = "CAPTURING";


    try {

        // Get active browser tab
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });


        if (!tab || !tab.id) {
            throw new Error("No active tab found");
        }


        // =====================================================
        // STEP 1: CAPTURE SCREENSHOT
        // =====================================================

        screenshotStatus.textContent =
            "Capturing screenshot...";


        const screenshotResponse =
            await chrome.runtime.sendMessage({
                action: "CAPTURE_SCREENSHOT",
                windowId: tab.windowId
            });
            console.log("STEP B: screenshot response received", screenshotResponse);


        // Check screenshot response
        if (!screenshotResponse ||
            !screenshotResponse.success) {

            throw new Error(
                screenshotResponse?.error ||
                "Unable to capture screenshot"
            );

        }


        // Display screenshot
        screenshotPreview.src =
            screenshotResponse.dataUrl;
            // Send screenshot to background vision engine
// Send screenshot to background vision engine

            console.log("STEP C: screenshot displayed");
            // ---------------------------------------------------------
// Point 5: local vision worker
// ---------------------------------------------------------

console.log(
    "Sending screenshot to local vision worker..."
);

const visionWorker = new Worker(
    chrome.runtime.getURL(
        "vision/worker.bundle.js"
    ),
    {
        type: "module"
    }
);

visionWorker.addEventListener(
    "message",
    (event) => {

        console.log(
            "[Vision Worker]",
            event.data
        );

    }
);


            // Send screenshot to local vision worker
console.log(
    "Sending screenshot to local vision worker..."
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
        imageBuffer: imageBuffer,
        mimeType:
            imageBlob.type ||
            "image/png"
    },
    [
        imageBuffer
    ]
);

            // ---------------------------------------------------------
// Send Point 4 screenshot to local vision worker
// ---------------------------------------------------------
console.log("STEP: About to convert screenshot");
// Send Point 4 screenshot to local vision worker
// ---------------------------------------------------------




        screenshotPreview.classList.remove("hidden");

        screenshotStatus.textContent =
            "Screenshot captured";

            console.log("STEP A: screenshot capture started");


        // =====================================================
        // STEP 2: RUN EXISTING PII DETECTION
        // =====================================================

        startBtn.textContent =
            "⏳  Scanning page...";

        privacyStatus.textContent =
            "SCANNING";


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


        // Send request to content script
        const response =
            await chrome.tabs.sendMessage(
                tab.id,
                {
                    action: "START_VisionShield"
                }
            );


        // Display PII results
console.log("PII RESPONSE:", JSON.stringify(response, null, 2));
// Display PII results
displayResults(response);


    } catch (error) {

        console.error(error);

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


    startBtn.textContent =
        "🔄  Scan Again";

    startBtn.classList.remove("scanning");

});


function displayResults(data) {

    if (!data || !data.detections) {
        return;
    }

    const detections = data.detections;

    detectedCount.textContent = detections.length;

    redactedCount.textContent = detections.length;

    privacyStatus.textContent = "VERIFIED";

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

        const row = document.createElement("div");

        row.className = "detection";

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


function getIcon(type) {

    switch (type) {

        case "EMAIL":
            return "✉️";

        case "PHONE":
            return "📱";

        case "PASSWORD":
            return "🔑";

        case "ID":
            return "🪪";

        case "ADDRESS":
            return "📍";

        case "NAME":
            return "👤";

        default:
            return "🔒";
    }
}
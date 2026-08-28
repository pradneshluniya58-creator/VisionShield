const startBtn = document.getElementById("startBtn");

const detectedCount = document.getElementById("detectedCount");
const redactedCount = document.getElementById("redactedCount");
const privacyStatus = document.getElementById("privacyStatus");
const results = document.getElementById("results");

startBtn.addEventListener("click", async () => {

    startBtn.textContent = "⏳  Scanning page...";
    startBtn.classList.add("scanning");

    privacyStatus.textContent = "SCANNING";

    try {

        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        if (!tab || !tab.id) {
            throw new Error("No active tab found");
        }

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

        const response = await chrome.tabs.sendMessage(
            tab.id,
            {
                action: "START_VisionShield"
            }
        );

        displayResults(response);

    } catch (error) {

        console.error(error);

        privacyStatus.textContent = "ERROR";

        results.innerHTML = `
            <div class="detection">
                <div class="detection-left">
                    <div class="detection-icon">⚠️</div>
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

    startBtn.textContent = "🔄  Scan Again";
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
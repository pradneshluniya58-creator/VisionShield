console.log(
    "VisionShield background service worker started"
);


// Extension installed
chrome.runtime.onInstalled.addListener(() => {

    console.log(
        "VisionShield extension installed successfully."
    );

});


// Listen for screenshot requests
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (message.action !== "CAPTURE_SCREENSHOT") {
            return;
        }

        const windowId =
            message.windowId ?? sender.tab?.windowId;

        chrome.tabs.captureVisibleTab(
            windowId,
            {
                format: "png"
            },
            (dataUrl) => {

                if (chrome.runtime.lastError) {

                    console.error(
                        "Screenshot capture failed:",
                        chrome.runtime.lastError.message
                    );

                    sendResponse({
                        success: false,
                        error:
                            chrome.runtime.lastError.message
                    });

                    return;
                }

                sendResponse({
                    success: true,
                    dataUrl: dataUrl
                });

            }
        );

        return true;

    }
);
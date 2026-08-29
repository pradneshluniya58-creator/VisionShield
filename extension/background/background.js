console.log("VisionShield background service worker started");


// Extension installed
chrome.runtime.onInstalled.addListener(() => {

    console.log(
        "VisionShield extension installed successfully."
    );

});


// Listen for screenshot requests
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        // Check whether popup/content script is asking for screenshot
        if (message.action !== "CAPTURE_SCREENSHOT") {
            return;
        }


        // Get the current browser window
        const windowId =
            message.windowId ?? sender.tab?.windowId;


        // Capture the currently visible tab
        chrome.tabs.captureVisibleTab(
            windowId,
            {
                format: "png"
            },
            (dataUrl) => {

                // Check for Chrome API errors
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


                // Send screenshot back
                sendResponse({
                    success: true,
                    dataUrl: dataUrl
                });

            }
        );


        // Tell Chrome we will respond asynchronously
        return true;

    }
);
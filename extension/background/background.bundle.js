var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// extension/background/background.js
var require_background = __commonJS({
  "extension/background/background.js"() {
    console.log(
      "VisionShield background service worker started"
    );
    chrome.runtime.onInstalled.addListener(() => {
      console.log(
        "VisionShield extension installed successfully."
      );
    });
    chrome.runtime.onMessage.addListener(
      (message, sender, sendResponse) => {
        if (message.action !== "CAPTURE_SCREENSHOT") {
          return;
        }
        const windowId = message.windowId ?? sender.tab?.windowId;
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
                error: chrome.runtime.lastError.message
              });
              return;
            }
            sendResponse({
              success: true,
              dataUrl
            });
          }
        );
        return true;
      }
    );
  }
});
export default require_background();

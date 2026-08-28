console.log("VisionShield background service worker started");


chrome.runtime.onInstalled.addListener(() => {

    console.log(
        "VisionShield extension installed successfully."
    );

});
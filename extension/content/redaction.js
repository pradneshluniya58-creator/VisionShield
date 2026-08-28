function redactElement(element, type) {

    if (!element) {
        return;
    }

    element.dataset.VisionShieldRedacted = "true";

    element.style.border = "2px solid #ff4d6d";

    element.style.boxShadow =
        "0 0 0 4px rgba(255,77,109,0.15)";

    element.style.backgroundColor =
        "rgba(255,77,109,0.08)";

    element.style.transition =
        "all 0.3s ease";


    // Add privacy badge

    const badge = document.createElement("span");

    badge.className =
        "VisionShield-security-badge";

    badge.innerText =
        `🔒 ${type} PROTECTED`;


    badge.style.position = "absolute";
    badge.style.zIndex = "999999";
    badge.style.background = "#ff4d6d";
    badge.style.color = "white";
    badge.style.padding = "4px 8px";
    badge.style.borderRadius = "6px";
    badge.style.fontSize = "10px";
    badge.style.fontFamily = "Arial, sans-serif";
    badge.style.fontWeight = "bold";
    badge.style.pointerEvents = "none";


    const rect = element.getBoundingClientRect();


    badge.style.left =
        `${window.scrollX + rect.left}px`;

    badge.style.top =
        `${window.scrollY + rect.bottom + 5}px`;


    document.body.appendChild(badge);
}


function clearRedactions() {

    document
        .querySelectorAll(
            '[data-VisionShield-redacted="true"]'
        )
        .forEach(element => {

            element.style.border = "";
            element.style.boxShadow = "";
            element.style.backgroundColor = "";

            delete element.dataset.VisionShieldRedacted;
        });


    document
        .querySelectorAll(
            ".VisionShield-security-badge"
        )
        .forEach(badge => badge.remove());
}
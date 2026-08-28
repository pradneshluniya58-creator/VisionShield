function detectPIIFromDOM() {

    const elements = document.querySelectorAll(
        "input, textarea, select"
    );

    const detections = [];

    elements.forEach((element, index) => {

        const type = (
            element.getAttribute("type") || "text"
        ).toLowerCase();

        const name = (
            element.getAttribute("name") || ""
        ).toLowerCase();

        const id = (
            element.getAttribute("id") || ""
        ).toLowerCase();

        const placeholder = (
            element.getAttribute("placeholder") || ""
        ).toLowerCase();

        const value = element.value || "";

        const nearbyText = getNearbyLabel(element).toLowerCase();

        const combinedText =
            `${name} ${id} ${placeholder} ${nearbyText}`;


        let piiType = null;


        // PASSWORD

        if (
            type === "password" ||
            combinedText.includes("password")
        ) {
            piiType = "PASSWORD";
        }


        // EMAIL

        else if (
            type === "email" ||
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(value) ||
            combinedText.includes("email")
        ) {
            piiType = "EMAIL";
        }


        // PHONE

        else if (
            type === "tel" ||
            /\b\d{10}\b/.test(value) ||
            combinedText.includes("phone") ||
            combinedText.includes("mobile")
        ) {
            piiType = "PHONE";
        }


        // ID

        else if (
            combinedText.includes("aadhaar") ||
            combinedText.includes("aadhar") ||
            combinedText.includes("pan") ||
            combinedText.includes("dummy id") ||
            combinedText.includes("government id")
        ) {
            piiType = "ID";
        }


        // ADDRESS

        else if (
            combinedText.includes("address") ||
            combinedText.includes("location")
        ) {
            piiType = "ADDRESS";
        }


        // NAME

        else if (
            combinedText.includes("full name") ||
            combinedText.includes("name")
        ) {
            piiType = "NAME";
        }


        if (piiType) {

            detections.push({

                type: piiType,

                selector: createSelector(element),

                index: index,

                tag: element.tagName,

                valuePresent: Boolean(value),

                element: element

            });

        }

    });


    return detections;
}


function getNearbyLabel(element) {

    // Direct label

    if (element.id) {

        const label = document.querySelector(
            `label[for="${CSS.escape(element.id)}"]`
        );

        if (label) {
            return label.innerText;
        }
    }


    // Parent label

    const parentLabel = element.closest("label");

    if (parentLabel) {
        return parentLabel.innerText;
    }


    // Previous text element

    let previous = element.previousElementSibling;

    if (previous) {
        return previous.innerText || "";
    }


    return "";
}


function createSelector(element) {

    if (element.id) {
        return `#${CSS.escape(element.id)}`;
    }

    if (element.name) {

        return `${element.tagName.toLowerCase()}[name="${CSS.escape(element.name)}"]`;
    }

    return `${element.tagName.toLowerCase()}:nth-of-type(${Array.from(
        element.parentElement.children
    ).indexOf(element) + 1})`;
}
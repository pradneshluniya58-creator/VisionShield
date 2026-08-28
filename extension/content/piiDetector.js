const PII_THRESHOLD = 60;

function getFieldContext(element) {

     let labelText = "";

    if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) {
            labelText = normalizeText(label.textContent);
        }
    }
    if (!labelText && element.previousElementSibling?.tagName === "LABEL") {
        labelText = normalizeText(element.previousElementSibling.textContent);
    }
    return {
        type: normalizeText(element.type),
        name: normalizeText(element.name),
        id: normalizeText(element.id),
        placeholder: normalizeText(element.placeholder),
        ariaLabel: normalizeText(element.getAttribute("aria-label")),
        autocomplete: normalizeText(element.getAttribute("autocomplete")),
        label: labelText
    };
}

function normalizeText(text) {
    return (text || "").trim().toLowerCase();
}

function getPasswordScore(element){
    const context = getFieldContext(element);

    let score = 0;
    const reasons = [];

    if (context.type === "password") {
        score += 100;
        reasons.push("input type=password");
    }
    if (context.name.includes("password")) {
        score += 60;
        reasons.push("name contains password");
    }
    if (context.id.includes("password")) {
        score += 60;
        reasons.push("id contains password");
    }
    if (context.placeholder.includes("password")) {
        score += 40;
        reasons.push("placeholder contains password");
    }
    if(context.ariaLabel.includes("password")){
        score += 40;
        reasons.push("aria-label contains password");
    }
    if(context.label.includes("password")){
        score += 40;
        reasons.push("label contains password");
    }
    if(context.autocomplete === "current-password" ||
       context.autocomplete === "new-password"){
        score += 80;
        reasons.push("autocomplete=password");
    }

    return {
        score: score,
        reasons: reasons
    };

}

function getEmailScore(element){
    const context = getFieldContext(element)
    const value = normalizeText(element.value);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let score = 0;
    const reasons = [];

     if (context.type === "email") {
        score += 100;
        reasons.push("input type=email");
    }

    if (context.name.includes("email")) {
        score += 60;
        reasons.push("name contains email");
    }

    if (context.id.includes("email")) {
        score += 60;
        reasons.push("id contains email");
    }

    if (context.placeholder.includes("email")) {
        score += 40;
        reasons.push("placeholder contains email");
    }

    if (emailPattern.test(value)) {
        score += 30;
        reasons.push("value matches email pattern");
    }
    if(context.label.includes("email")){
        score += 60;
        reasons.push("Label contains email")
    }
    if (context.ariaLabel.includes("email")) {
    score += 40;
    reasons.push("aria-label contains email");
    }
    if (context.autocomplete === "email") {
    score += 80;
    reasons.push("autocomplete=email");
    }

    return {
        score: score,
        reasons: reasons
    };

}

function getPhoneScore(element){
    const context = getFieldContext(element);

    const value = normalizeText(element.value);

    let score = 0;
    const reasons = [];

     if (context.type === "tel") {
        score += 100;
        reasons.push("input type=tel");
    }

    if (context.name.includes("phone") || context.name.includes("mobile")) {
        score += 60;
        reasons.push("name contains phone/mobile");
    }

    if (context.id.includes("phone") || context.id.includes("mobile")) {
        score += 60;
        reasons.push("id contains phone/mobile");
    }

    if (context.placeholder.includes("phone") || context.placeholder.includes("mobile")) {
        score += 40;
        reasons.push("placeholder contains phone/mobile");
    }
    if (
        context.ariaLabel.includes("phone") ||
        context.ariaLabel.includes("mobile")
    ) {
        score += 40;
        reasons.push("aria-label contains phone/mobile");
    }
     if (
        context.label.includes("phone") ||
        context.label.includes("mobile")
    ) {
        score += 40;
        reasons.push("label contains phone/mobile");
    }
    if (context.autocomplete === "tel" ||
        context.autocomplete === "tel-national" ||
        context.autocomplete === "tel-local") 
        {
        score += 80;
        reasons.push("autocomplete indicates phone");
    }

    if (/^\+?[0-9\s().-]{10,15}$/.test(value)) {
    score += 30;
    reasons.push("value matches phone number format");
    }

    return {
        score: score,
        reasons: reasons
    };

}


const GOV_ID_RULES = [
    {
        type: "PAN",
        pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
        keywords: ["pan", "pancard", "pan number", "pan_number"]
    },
    {
        type: "AADHAAR",
        pattern: /^\d{12}$/,
        keywords: ["aadhaar", "aadhar", "uid", "uidai"]
    },
    {
        type: "PASSPORT",
        pattern: /^[A-Z][0-9]{7}$/,
        keywords: ["passport", "passport number"]
    },
    {
        type: "VOTER_ID",
        pattern: /^[A-Z]{3}[0-9]{7}$/,
        keywords: ["voter", "voter id", "epic"]
    },
    {
        type: "DRIVING_LICENSE",
        pattern: /^[A-Z]{2}[0-9]{2}[0-9]{4,11}$/,
        keywords: ["driving license", "driver license", "driving licence", "dl number", "license"]
    }

];

function getGovIdScore(element) {
    const context = getFieldContext(element);
    const value = element.value.trim().toUpperCase();

    let bestMatch = null;

    for (const rule of GOV_ID_RULES) {
        let score = 0;
        const reasons = [];

        if (rule.keywords.some(keyword => context.name.includes(keyword))) {
            score += 60;
            reasons.push("name contains government ID keyword");
        }
        if (rule.keywords.some(keyword => context.id.includes(keyword))) {
            score += 60;
            reasons.push("id contains government ID keyword");
        }
        if (rule.keywords.some(keyword =>context.placeholder.includes(keyword))) {
            score += 40;
            reasons.push("placeholder contains government ID keyword");
        }
        if (rule.keywords.some(keyword => context.label.includes(keyword))) {
            score += 60;
            reasons.push("label contains government ID keyword");
        }
        if(rule.keywords.some(keyword => context.ariaLabel.includes(keyword))){
            score +=40;
            reasons.push("aria-label contains government ID keyword")
        }
        if (rule.pattern.test(value)) {
            score += 30;
            reasons.push(`${rule.type} pattern matched`);
        }
        if (!bestMatch || score > bestMatch.score) {
            bestMatch = {
                type: rule.type,
                score: score,
                reasons: reasons
            };
        }
    }
    return bestMatch;
}

function getNameScore(element) {
    const context = getFieldContext(element);

    let score = 0;
    const reasons = [];

    if (context.name.includes("name")) {
        score += 60;
        reasons.push("name contains name");
    }

    if (context.id.includes("name")) {
        score += 60;
        reasons.push("id contains name");
    }

    if (context.placeholder.includes("name")) {
        score += 40;
        reasons.push("placeholder contains name");
    }

    if (context.label.includes("name")) {
        score += 60;
        reasons.push("label contains name");
    }

    if (context.ariaLabel.includes("name")) {
        score += 40;
        reasons.push("aria-label contains name");
    }

    if (
        context.autocomplete === "name" ||
        context.autocomplete === "given-name" ||
        context.autocomplete === "family-name"
    ) {
        score += 80;
        reasons.push("autocomplete indicates name");
    }

    return {
        score: score,
        reasons: reasons
    };
}

function getAddressScore(element) {
    const context = getFieldContext(element);

    let score = 0;
    const reasons = [];

    const addressKeywords = [
        "address",
        "street",
        "street address",
        "home address",
        "residential address",
        "postal address",
        "mailing address",
        "billing address",
        "shipping address",
        "city",
        "state",
        "province",
        "pincode",
        "pin code",
        "postal code",
        "zip",
        "zipcode"
    ];

    if (addressKeywords.some(keyword => context.name.includes(keyword))) {
        score += 60;
        reasons.push("name contains address keyword");
    }

    if (addressKeywords.some(keyword => context.id.includes(keyword))) {
        score += 60;
        reasons.push("id contains address keyword");
    }

    if (addressKeywords.some(keyword => context.placeholder.includes(keyword))) {
        score += 40;
        reasons.push("placeholder contains address keyword");
    }

    if (addressKeywords.some(keyword => context.label.includes(keyword))) {
        score += 60;
        reasons.push("label contains address keyword");
    }

    if (addressKeywords.some(keyword => context.ariaLabel.includes(keyword))) {
        score += 40;
        reasons.push("aria-label contains address keyword");
    }

    if (
        context.autocomplete === "street-address" ||
        context.autocomplete === "address-line1" ||
        context.autocomplete === "address-line2" ||
        context.autocomplete === "postal-code" ||
        context.autocomplete === "address-level1" ||
        context.autocomplete === "address-level2"
    ) {
        score += 80;
        reasons.push("autocomplete indicates address");
    }

    return {
        score: score,
        reasons: reasons
    };
}

function detectPIIFromDOM(){
    const detections = [];
    document.querySelectorAll("input").forEach(element=>{
        const emailresult = getEmailScore(element);
        const passwordresult = getPasswordScore(element);
        const phoneresult = getPhoneScore(element);
        const govIdresult = getGovIdScore(element);
        const nameresult = getNameScore(element);
        const addressresult = getAddressScore(element);

        console.log(element.name , getFieldContext(element))

        console.log(
            element.name,
            "EMAIL",emailresult,
            "PASSWORD",passwordresult,
            "PHONE" ,phoneresult,
            "GOV_ID",govIdresult,
            "NAME",nameresult,
            "ADDRESS" ,addressresult
        );


        if(emailresult.score >= PII_THRESHOLD){
            detections.push({
                type: "EMAIL",
                element: element,
                score: emailresult.score,
                reasons: emailresult.reasons
            })
        }

        if(passwordresult.score >= PII_THRESHOLD){
            detections.push({
                type: "PASSWORD",
                element: element,
                score: passwordresult.score,
                reasons: passwordresult.reasons
            })
        }

        if(phoneresult.score >= PII_THRESHOLD){
            detections.push({
                type: "PHONE",
                element: element,
                score: phoneresult.score,
                reasons: phoneresult.reasons
            })
        }

        if(govIdresult.score >=PII_THRESHOLD){
            detections.push({
                type: "GOV_ID",
                sub_type: govIdresult.type,
                element: element,
                score: govIdresult.score,
                reasons: govIdresult.reasons
            })
        }

        if(nameresult.score >=PII_THRESHOLD){
            detections.push({
                type: "NAME",
                element: element,
                score: nameresult.score,
                reasons: nameresult.reasons
            })
        }
        if (addressresult.score >= PII_THRESHOLD) {
        detections.push({
        type: "ADDRESS",
        element: element,
        score: addressresult.score,
        reasons: addressresult.reasons
        });
        }

    });

    return detections;
}

function highlightPII(detections) {
    detections.forEach(detection => {
        const element = detection.element;
        element.style.border = "3px solid red";
        element.style.backgroundColor = "yellow";
    });
}

const detections = detectPIIFromDOM();

console.log(detections);

highlightPII(detections);


//It is pii detector code

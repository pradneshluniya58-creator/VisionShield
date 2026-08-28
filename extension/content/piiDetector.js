const PII_THRESHOLD = 60;

function normalizeText(text) {
    return (text || "").trim().toLowerCase();
}

function getPasswordScore(element){
    const type = normalizeText(element.type);
    const name = normalizeText(element.name);
    const id = normalizeText(element.id);
    const placeholder = normalizeText(element.placeholder);

    let score = 0;
    const reasons = [];

     if (type === "password") {
        score += 100;
        reasons.push("input type=password");
    }

    if (name.includes("password")) {
        score += 60;
        reasons.push("name contains password");
    }

    if (id.includes("password")) {
        score += 60;
        reasons.push("id contains password");
    }

    if (placeholder.includes("password")) {
        score += 40;
        reasons.push("placeholder contains password");
    }

    return {
        score: score,
        reasons: reasons
    };

}

function getEmailScore(element){
    const type = normalizeText(element.type);
    const name = normalizeText(element.name);
    const id = normalizeText(element.id);
    const placeholder = normalizeText(element.placeholder);
    const value = normalizeText(element.value);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let score = 0;
    const reasons = [];

     if (type === "email") {
        score += 100;
        reasons.push("input type=email");
    }

    if (name.includes("email")) {
        score += 60;
        reasons.push("name contains email");
    }

    if (id.includes("email")) {
        score += 60;
        reasons.push("id contains email");
    }

    if (placeholder.includes("email")) {
        score += 40;
        reasons.push("placeholder contains email");
    }

    if (emailPattern.test(value)) {
        score += 30;
        reasons.push("value matches email pattern");
    }

    return {
        score: score,
        reasons: reasons
    };

}

function getPhoneScore(element){
    const type = normalizeText(element.type);
    const name = normalizeText(element.name);
    const id = normalizeText(element.id);
    const placeholder = normalizeText(element.placeholder);
    const value = normalizeText(element.value);

    

    let score = 0;
    const reasons = [];

     if (type === "tel") {
        score += 100;
        reasons.push("input type=tel");
    }

    if (name.includes("phone") || name.includes("mobile")) {
        score += 60;
        reasons.push("name contains phone/mobile");
    }

    if (id.includes("phone") || id.includes("mobile")) {
        score += 60;
        reasons.push("id contains phone/mobile");
    }

    if (placeholder.includes("phone") || placeholder.includes("mobile")) {
        score += 40;
        reasons.push("placeholder contains phone/mobile");
    }

    const digits = value.replace(/\D/g, "");

    if(digits.length === 10){
        score += 30;
        reasons.push("value contains 10 digits");
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
        const phoneresult = getPhoneScore(element)
        console.log(
            element.name,
            "EMAIL",emailresult,
            "PASSWORD",passwordresult,
            "PHONE" ,phoneresult
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

        
    });

    return detections;
}

console.log(detectPIIFromDOM());
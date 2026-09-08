import { pipeline } from "@huggingface/transformers";


// ======================================================
// VisionShield - Object Detection Standalone Test
// ======================================================

let detector = null;


// ======================================================
// Test image
// ======================================================

const TEST_IMAGE_URL =
    "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/cats.jpg";


// ======================================================
// Update status on webpage
// ======================================================

function updateStatus(message) {

    const status = document.getElementById("status");

    if (status) {
        status.textContent = message;
    }

    console.log("[VisionShield]", message);
}


// ======================================================
// Load object detection model
// ======================================================

async function loadDetector() {

    if (detector) {
        return detector;
    }

    updateStatus("Loading object detection model...");

    try {

        detector = await pipeline(
            "object-detection",
            "Xenova/detr-resnet-50"
        );

        updateStatus(
            "Object detection model loaded successfully."
        );

        return detector;

    } catch (error) {

        console.error(
            "MODEL LOADING ERROR:",
            error
        );

        updateStatus(
            "Model loading failed: " + error.message
        );

        throw error;
    }
}


// ======================================================
// Run object detection
// ======================================================

async function testDetection() {

    try {

        updateStatus(
            "Starting object detection..."
        );

        // Load the model
        const model = await loadDetector();

        updateStatus(
            "Running object detection on test image..."
        );

        // IMPORTANT:
        // We pass the IMAGE URL string to Transformers.js.
        // We do NOT pass the HTMLImageElement.
        const results = await model(
            TEST_IMAGE_URL,
            {
                threshold: 0.5
            }
        );

        console.log(
            "========================================"
        );

        drawDetections(results);

        console.log(
            "OBJECT DETECTION RESULTS:"
        );

        console.log(results);

        console.log(
            "========================================"
        );


        // Display results on webpage

        const resultsElement =
            document.getElementById("results");

        if (resultsElement) {

            resultsElement.textContent =
                JSON.stringify(
                    results,
                    null,
                    2
                );
        }


        // Count detections

        if (results && results.length > 0) {

            updateStatus(
                `Detection successful! Found ${results.length} object(s).`
            );

        } else {

            updateStatus(
                "Detection completed, but no objects were found."
            );
        }


        // Print each detection clearly

        if (results) {

            results.forEach(
                (detection, index) => {

                    console.log(
                        `Object ${index + 1}:`
                    );

                    console.log(
                        "Label:",
                        detection.label
                    );

                    console.log(
                        "Score:",
                        detection.score
                    );

                    console.log(
                        "Bounding box:",
                        detection.box
                    );
                }
            );
        }


    } catch (error) {

        console.error(
            "OBJECT DETECTION ERROR:",
            error
        );

        updateStatus(
            "Object detection failed: " +
            error.message
        );

        const resultsElement =
            document.getElementById("results");

        if (resultsElement) {

            resultsElement.textContent =
                error.stack ||
                error.message;
        }
    }
}


// ======================================================
// Start test
// ======================================================

console.log(
    "VisionShield object detection test starting..."
);

testDetection();
// ======================================================
// Draw detection bounding boxes
// ======================================================

function drawDetections(results) {

    const image =
        document.getElementById("testImage");

    const canvas =
        document.getElementById("detectionCanvas");

    const ctx =
        canvas.getContext("2d");


    // Match canvas to original image dimensions

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;


    // Draw every detected object

    results.forEach((detection) => {

        const box = detection.box;


        const x = box.xmin;

        const y = box.ymin;

        const width =
            box.xmax - box.xmin;

        const height =
            box.ymax - box.ymin;


        // Draw bounding box

        ctx.lineWidth = 4;

        ctx.strokeRect(
            x,
            y,
            width,
            height
        );


        // Create label

        const label =
            `${detection.label} ${(detection.score * 100).toFixed(1)}%`;


        // Draw label

        ctx.font = "18px Arial";

        ctx.fillText(
            label,
            x,
            Math.max(20, y - 5)
        );

    });

}
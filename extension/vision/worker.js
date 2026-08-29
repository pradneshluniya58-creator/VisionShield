import { pipeline } from "@huggingface/transformers";


// Keep the model loaded in memory
let classifier = null;


// ---------------------------------------------------------
// Load the local vision model
// ---------------------------------------------------------

async function loadModel() {

    // If model is already loaded, reuse it
    if (classifier) {
        return classifier;
    }


    // Tell popup that model loading has started
    self.postMessage({
        type: "STATUS",
        message: "Loading local vision model..."
    });


    // Load MobileNet vision model
    classifier = await pipeline(
    "image-classification",
    "onnx-community/mobilenetv4_conv_small.e2400_r224_in1k"
);


    // Tell popup that model is ready
    self.postMessage({
        type: "STATUS",
        message: "Local vision model loaded."
    });


    return classifier;
}


// ---------------------------------------------------------
// Receive messages from popup.js
// ---------------------------------------------------------

self.addEventListener(
    "message",
    async (event) => {

        const data = event.data;


        // Ignore unrelated messages
        if (data.type !== "RUN_VISION") {
            return;
        }


        try {

            // Load the model
            const model =
                await loadModel();


            // Tell popup inference has started
            self.postMessage({
                type: "STATUS",
                message: "Running local vision inference..."
            });


            // Convert screenshot bytes into an image Blob
            const imageBlob =
                new Blob(
                    [data.imageBuffer],
                    {
                        type:
                            data.mimeType ||
                            "image/png"
                    }
                );


            // Run image classification
            const output =
                await model(imageBlob);


            // Print result for debugging
            console.log(
                "Vision model result:",
                output
            );


            // Send prediction back
            self.postMessage({
                type: "RESULT",
                output: output
            });


        } catch (error) {

            console.error(
                "Vision worker error:",
                error
            );


            self.postMessage({
                type: "ERROR",
                message:
                    error?.message ||
                    String(error)
            });

        }

    }
);

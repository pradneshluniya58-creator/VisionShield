import {
    pipeline
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";


// ---------------------------------------------------------
// Vision model worker
// ---------------------------------------------------------

let classifier = null;


// ---------------------------------------------------------
// Load the model
// ---------------------------------------------------------

async function loadModel() {

    if (classifier) {
        return classifier;
    }


    self.postMessage({
        type: "STATUS",
        message: "Loading local vision model..."
    });


    classifier = await pipeline(
        "image-classification",
        "onnx-community/mobilenetv4_conv_small.e2400_r224_in1k",
        {
            device: "webgpu"
        }
    );


    self.postMessage({
        type: "STATUS",
        message: "Vision model loaded successfully."
    });


    return classifier;
}


// ---------------------------------------------------------
// Receive messages from vision-test.html
// ---------------------------------------------------------

self.addEventListener("message", async (event) => {

    const data = event.data;


    // ---------------------------------------------
    // Load model only
    // ---------------------------------------------

    if (data.type === "LOAD_MODEL") {

        try {

            await loadModel();

        } catch (error) {

            self.postMessage({
                type: "ERROR",
                message: error.message
            });

        }

        return;
    }


    // ---------------------------------------------
    // Run inference
    // ---------------------------------------------

    if (data.type === "RUN_INFERENCE") {

        try {

            const model =
                await loadModel();


            self.postMessage({
                type: "STATUS",
                message: "Running vision inference..."
            });


            // Convert received data back into a Blob
            const blob = new Blob(
                [data.imageBuffer],
                {
                    type: data.mimeType || "image/jpeg"
                }
            );


            // Run model
            const output =
                await model(blob);


            console.log(
                "Worker model output:",
                output
            );


            // Send result back to webpage
            self.postMessage({
                type: "RESULT",
                output: output
            });

        } catch (error) {

            console.error(
                "Worker inference error:",
                error
            );


            self.postMessage({
                type: "ERROR",
                message: error.message
            });

        }

    }

});

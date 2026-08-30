import {
    pipeline,
    env
} from "@huggingface/transformers";


// ---------------------------------------------------------
// Local ONNX Runtime configuration
// ---------------------------------------------------------

env.backends.onnx.wasm.wasmPaths =
    new URL(
        "../wasm/",
        self.location.href
    ).href;

env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;


// ---------------------------------------------------------
// Vision model
// ---------------------------------------------------------

let classifier = null;


// ---------------------------------------------------------
// Load model
// ---------------------------------------------------------

async function loadModel() {

    if (classifier) {
        return classifier;
    }

    self.postMessage({
        type: "STATUS",
        message:
            "Loading local vision model..."
    });

    classifier = await pipeline(
        "image-classification",
        "onnx-community/mobilenetv4_conv_small.e2400_r224_in1k"
    );

    self.postMessage({
        type: "STATUS",
        message:
            "Vision model loaded successfully."
    });

    return classifier;
}


// ---------------------------------------------------------
// Worker messages
// ---------------------------------------------------------

self.addEventListener(
    "message",
    async (event) => {

        const data = event.data;


        // Load model
        if (data.type === "LOAD_MODEL") {

            try {

                await loadModel();

            } catch (error) {

                self.postMessage({
                    type: "ERROR",
                    message:
                        error?.message ||
                        String(error)
                });

            }

            return;
        }


        // Run inference
        if (data.type === "RUN_INFERENCE") {

            try {

                const model =
                    await loadModel();

                self.postMessage({
                    type: "STATUS",
                    message:
                        "Running vision inference..."
                });


                const blob =
                    new Blob(
                        [data.imageBuffer],
                        {
                            type:
                                data.mimeType ||
                                "image/png"
                        }
                    );


                const output =
                    await model(blob);


                console.log(
    "Worker model output:",
    JSON.stringify(output, null, 2)
);

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
                    message:
                        error?.message ||
                        String(error)
                });

            }

        }

    }
);
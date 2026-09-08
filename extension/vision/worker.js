import {
    pipeline,
    env
} from "@huggingface/transformers";


// =========================================================
// LOCAL ONNX RUNTIME CONFIGURATION
// =========================================================

env.backends.onnx.wasm.wasmPaths =
    new URL(
        "../wasm/",
        self.location.href
    ).href;

env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;


// =========================================================
// OBJECT DETECTION MODEL
// =========================================================

let detector = null;
let detectorPromise = null;


// =========================================================
// LOAD OBJECT DETECTOR
// =========================================================

async function loadModel() {

    // Model is already completely loaded
    if (detector) {
        return detector;
    }

    // Model is currently loading
    // Reuse the same loading operation
    if (detectorPromise) {
        return detectorPromise;
    }

    detectorPromise = (async () => {

        self.postMessage({
            type: "STATUS",
            message: "Loading local object detection model..."
        });

        console.log(
            "[Vision Worker] Loading object detection model..."
        );

        const model = await pipeline(
            "object-detection",
            "Xenova/detr-resnet-50"
        );

        detector = model;

        self.postMessage({
            type: "STATUS",
            message: "Object detection model loaded successfully."
        });

        console.log(
            "[Vision Worker] Object detection model loaded."
        );

        return detector;

    })();

    return detectorPromise;
}


// =========================================================
// WORKER MESSAGE HANDLER
// =========================================================

self.addEventListener(
    "message",
    async (event) => {

        const data = event.data;


        // =================================================
        // LOAD MODEL
        // =================================================

        if (
            data.type === "LOAD_MODEL"
        ) {

            try {

                await loadModel();

            } catch (error) {

                console.error(
                    "[Vision Worker] Model loading error:",
                    error
                );


                self.postMessage({
                    type: "ERROR",
                    message:
                        error?.message ||
                        String(error)
                });

            }

            return;
        }


        // =================================================
        // RUN OBJECT DETECTION
        // =================================================

        if (
            data.type === "RUN_INFERENCE"
        ) {

            try {

                const model =
                    await loadModel();


                self.postMessage({
                    type: "STATUS",
                    message:
                        "Running object detection..."
                });


                console.log(
                    "[Vision Worker] Starting object detection..."
                );


                // ---------------------------------------------
                // Convert ArrayBuffer → Blob
                // ---------------------------------------------

                const blob =
                    new Blob(
                        [
                            data.imageBuffer
                        ],
                        {
                            type:
                                data.mimeType ||
                                "image/png"
                        }
                    );


                    const imageBitmap =
    await createImageBitmap(blob);

const imageWidth =
    imageBitmap.width;

const imageHeight =
    imageBitmap.height;

imageBitmap.close();

console.log(
    "[Vision Worker] Screenshot dimensions:",
    imageWidth,
    "x",
    imageHeight
);


                // ---------------------------------------------
                // Run DETR
                // ---------------------------------------------

                const output = await model(
    blob,
    {
        threshold: 0.2
    }
);

console.log(
    "[Vision Worker] Object detection complete:",
    JSON.stringify(output, null, 2)
);




self.postMessage({
    type: "RESULT",
    output,
    imageWidth,
    imageHeight
});

            } catch (error) {

                console.error(
                    "[Vision Worker] Inference error:",
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
// =====================================================
// PRELOAD MODEL
// Start loading the AI model as soon as the worker starts
// =====================================================

console.log(
    "[Vision Worker] Preloading object detection model..."
);

loadModel().catch((error) => {

    console.error(
        "[Vision Worker] Preload error:",
        error
    );

    self.postMessage({
        type: "ERROR",
        message:
            error?.message ||
            String(error)
    });

});
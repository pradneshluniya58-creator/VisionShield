import { pipeline } from "@huggingface/transformers";

let detector = null;

console.log("[Object Worker] Worker started.");

async function loadDetector() {

    if (detector) {
        return detector;
    }

    console.log("[Object Worker] Loading object detection model...");

    detector = await pipeline(
        "object-detection",
        "Xenova/detr-resnet-50"
    );

    console.log("[Object Worker] Model loaded.");

    return detector;
}


self.onmessage = async (event) => {

    try {

        const data = event.data;

        console.log("[Object Worker] Message received:", data);


        if (data.type === "DETECT") {

            const image = data.image;

            console.log("[Object Worker] Starting detection...");


            const model = await loadDetector();


            const results = await model(
                image,
                {
                    threshold: 0.5
                }
            );


            console.log(
                "[Object Worker] Detection complete:",
                results
            );


            self.postMessage({

                type: "RESULT",

                results: results

            });

        }

    } catch (error) {

        console.error(
            "[Object Worker] ERROR:",
            error
        );


        self.postMessage({

            type: "ERROR",

            error: error.message || String(error)

        });

    }

};
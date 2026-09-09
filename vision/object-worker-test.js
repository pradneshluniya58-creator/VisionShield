const TEST_IMAGE_URL =
    "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/cats.jpg";


const worker = new Worker(
    "./object-worker.bundle.js",
    {
        type: "module"
    }
);


const status = document.getElementById("status");

const resultsElement =
    document.getElementById("results");


worker.onmessage = (event) => {

    console.log(
        "[Main Page] Worker message:",
        event.data
    );


    const data = event.data;


    if (data.type === "RESULT") {

        status.textContent =
            "Worker detection successful! Found " +
            data.results.length +
            " object(s).";


        resultsElement.textContent =
            JSON.stringify(
                data.results,
                null,
                2
            );

    }


    if (data.type === "ERROR") {

        status.textContent =
            "Worker error: " +
            data.error;


        resultsElement.textContent =
            data.error;

    }

};


worker.onerror = (error) => {

    console.error(
        "[Main Page] Worker error:",
        error
    );


    status.textContent =
        "Worker failed. Check console.";

};


const image =
    document.getElementById("testImage");


image.addEventListener(
    "load",
    () => {

        console.log(
            "[Main Page] Image loaded."
        );


        status.textContent =
            "Image loaded. Sending image to worker...";


        worker.postMessage({

            type: "DETECT",

            image: TEST_IMAGE_URL

        });

    }
);
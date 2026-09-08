var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// vision/object-worker-test.js
var require_object_worker_test = __commonJS({
  "vision/object-worker-test.js"() {
    var TEST_IMAGE_URL = "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/cats.jpg";
    var worker = new Worker(
      "./object-worker.bundle.js",
      {
        type: "module"
      }
    );
    var status = document.getElementById("status");
    var resultsElement = document.getElementById("results");
    worker.onmessage = (event) => {
      console.log(
        "[Main Page] Worker message:",
        event.data
      );
      const data = event.data;
      if (data.type === "RESULT") {
        status.textContent = "Worker detection successful! Found " + data.results.length + " object(s).";
        resultsElement.textContent = JSON.stringify(
          data.results,
          null,
          2
        );
      }
      if (data.type === "ERROR") {
        status.textContent = "Worker error: " + data.error;
        resultsElement.textContent = data.error;
      }
    };
    worker.onerror = (error) => {
      console.error(
        "[Main Page] Worker error:",
        error
      );
      status.textContent = "Worker failed. Check console.";
    };
    var image = document.getElementById("testImage");
    image.addEventListener(
      "load",
      () => {
        console.log(
          "[Main Page] Image loaded."
        );
        status.textContent = "Image loaded. Sending image to worker...";
        worker.postMessage({
          type: "DETECT",
          image: TEST_IMAGE_URL
        });
      }
    );
  }
});
export default require_object_worker_test();

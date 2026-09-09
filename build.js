const esbuild = require("esbuild");


// ======================================================
// 1. Build VisionShield extension vision worker
// ======================================================

esbuild.build({
    entryPoints: [
        "extension/vision/worker.js"
    ],

    bundle: true,

    outfile: "extension/vision/worker.bundle.js",

    format: "esm",

    platform: "browser",

    target: "es2022",

    sourcemap: false,

    minify: false

})
.then(() => {

    console.log(
        "VisionShield vision worker built successfully."
    );

})


// ======================================================
// 2. Build standalone object detection test
// ======================================================

.then(() => {

    return esbuild.build({

        entryPoints: [
            "vision/object-test.js"
        ],

        bundle: true,

        outfile: "vision/object-test.bundle.js",

        format: "esm",

        platform: "browser",

        target: "es2022",

        sourcemap: false,

        minify: false

    });

})

.then(() => {

    console.log(
        "VisionShield object detection test built successfully."
    );

})

.catch((error) => {

    console.error(error);

    process.exit(1);

});
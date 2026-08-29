const esbuild = require("esbuild");

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
.catch((error) => {

    console.error(error);

    process.exit(1);

});

/* eslint-disable @typescript-eslint/no-require-imports -- This isolated Node fixture registers a CommonJS TypeScript loader. */
// Render the actual Next.js component with React's JSX runtime. Playwright's
// component-test JSX runtime creates descriptors rather than React elements.
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const appRoot = path.resolve(__dirname, "../..");
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request.startsWith("@/")) request = path.join(appRoot, "src", request.slice(2));
  return resolveFilename.call(this, request, ...args);
};
for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = (module, filename) => {
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
      fileName: filename,
    });
    module._compile(outputText, filename);
  };
}
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { ImageConfigContext } = require("next/dist/shared/lib/image-config-context.shared-runtime");
const { imageConfigDefault } = require("next/dist/shared/lib/image-config");
const { default: nextConfig } = require("../../next.config.ts");
const { SupplementsTopPage } = require("../../src/components/supplements-top-page.tsx");
const props = JSON.parse(fs.readFileSync(0, "utf8"));
process.stdout.write(renderToStaticMarkup(createElement(ImageConfigContext.Provider,
  { value: { ...imageConfigDefault, ...nextConfig.images } }, createElement(SupplementsTopPage, props))));

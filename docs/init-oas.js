// docs/init-oas.js
import expressOasGenerator, { SPEC_OUTPUT_FILE_BEHAVIOR } from "express-oas-generator";

export function initApiDocs(app, {
  title = "Moveinn API",
  version = "1.0.0",
  serverUrl = `http://localhost:${process.env.PORT || 5000}`,
  outputFile = "./docs/openapi_v3.json",
  uiPath = "docs",
  tags = ["auth", "onboarding", "payment", "payout", "webhook"],
  skipInEnvs = ["production"],
} = {}) {
  expressOasGenerator.init(
    app,
    (spec) => {
      spec.openapi = "3.0.0";
      spec.info = { title, version, description: "Moveinn rental platform" };
      spec.servers = [{ url: serverUrl }];
      spec.components ||= {};
      spec.components.securitySchemes = {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      };
      spec.security = [{ bearerAuth: [] }];
      return spec;
    },
    outputFile,                // 3
    60_000,                    // 4
    uiPath,                    // 5
    undefined,                 // 6  <-- mongooseModels placeholder!
    tags,                      // 7
    skipInEnvs,                // 8
    true,                      // 9 always serve docs
    SPEC_OUTPUT_FILE_BEHAVIOR.RECREATE // 10
  );
}

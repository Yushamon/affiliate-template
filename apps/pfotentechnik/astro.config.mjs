import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { fileURLToPath } from "node:url";

export default defineConfig({
  site: "https://pfotentechnik.de",

  output: "static",

  outDir: "./dist",

  integrations: [sitemap()],

  vite: {
    resolve: {
      alias: {
        "@affiliate-core": fileURLToPath(
          new URL("../../packages/affiliate-core/src", import.meta.url)
        ),
        "@app": fileURLToPath(new URL("./src", import.meta.url))
      }
    }
  }
});
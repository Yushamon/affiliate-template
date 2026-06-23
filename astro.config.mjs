import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://balkonspeicher-ratgeber.de",
  integrations: [sitemap()]
});
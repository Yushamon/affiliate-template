import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://pfotentechnik.de",
  integrations: [],
  project: {
    name: "pfotentechnik",
    title: "Pfotentechnik",
    description: "Alles rund um die Technik für Ihre Vierbeiner",
    url: "https://pfotentechnik.de",
    author: {
      name: "Pfotentechnik Team",
      url: "https://pfotentechnik.de/about"
    },
    navigation: [
      {
        label: "Startseite",
        href: "/"
      },
      {
        label: "Ratgeber",
        href: "/wissen/"
      },
      {
        label: "Produkte",
        href: "/produkte/"
      },
      {
        label: "Hersteller",
        href: "/hersteller/"
      },
      {
        label: "Kontakt",
        href: "/kontakt/"
      }
    ],
    footer: {
      categories: [
        {
          title: "Ratgeber",
          links: [
            {
              label: "Wissen",
              href: "/wissen/"
            },
            {
              label: "Tipps & Tricks",
              href: "/wissen/tipps-tricks/"
            }
          ]
        },
        {
          title: "Service",
          links: [
            {
              label: "Kontakt",
              href: "/kontakt/"
            },
            {
              label: "Impressum",
              href: "/impressum/"
            },
            {
              label: "Datenschutz",
              href: "/datenschutz/"
            }
          ]
        }
      ]
    }
  }
});

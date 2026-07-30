import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const projectRoot = path.join(appRoot, "apps", "pfotentechnik");
const strict = process.argv.includes("--strict");

const stages = [
  {
    name: "Ratgeber",
    collection: "pages",
    outputPrefix: "",
    isForward: (href) => href.startsWith("/vergleiche/")
  },
  {
    name: "Vergleiche",
    collection: "comparisons",
    outputPrefix: "vergleiche",
    isForward: (href) => href.startsWith("/produkt/")
  },
  {
    name: "Produktseiten",
    collection: "products",
    outputPrefix: "produkt",
    isForward: (href) => href.startsWith("/hersteller/")
  },
  {
    name: "Hersteller",
    collection: "manufacturers",
    outputPrefix: "hersteller",
    isForward: (href) =>
      href.startsWith("/") &&
      !href.startsWith("/vergleiche/") &&
      !href.startsWith("/produkt/") &&
      !href.startsWith("/hersteller/")
  }
];

const readSlugs = (collection) => {
  const directory = path.join(projectRoot, "src", "content", collection);
  return fs.readdirSync(directory)
    .filter((name) => /\.(?:md|mdx)$/i.test(name))
    .flatMap((name) => {
      const source = fs.readFileSync(path.join(directory, name), "utf8");
      const slug = source.match(
        /^slug:\s*["']?([^"'\n]+)["']?\s*$/m
      )?.[1];
      return slug ? [slug.trim()] : [];
    });
};

const readJourneyLinks = (html) => {
  const section = html.match(
    /<section[^>]*class="pt-next-steps"[\s\S]*?<\/section>/
  )?.[0];
  if (!section) return [];
  return [...section.matchAll(/<a[^>]*href="([^"]+)"/g)]
    .map((match) => match[1]);
};

const outputForRoute = (route) => path.join(
  projectRoot,
  "dist",
  ...route.split(/[?#]/, 1)[0].split("/").filter(Boolean),
  "index.html"
);

const targetContainsLink = (targetRoute, expectedHref) => {
  const outputFile = outputForRoute(targetRoute);
  if (!fs.existsSync(outputFile)) return false;
  return fs.readFileSync(outputFile, "utf8")
    .includes(`href="${expectedHref}"`);
};

const findings = [];
const results = stages.map((stage) => {
  let built = 0;
  let withJourney = 0;
  let withForwardStep = 0;

  for (const slug of readSlugs(stage.collection)) {
    const outputFile = path.join(
      projectRoot,
      "dist",
      stage.outputPrefix,
      slug,
      "index.html"
    );
    if (!fs.existsSync(outputFile)) {
      findings.push(`${stage.name}: Build-Ausgabe für ${slug} fehlt.`);
      continue;
    }

    built += 1;
    const html = fs.readFileSync(outputFile, "utf8");
    const links = readJourneyLinks(html);
    const currentRoute = `/${[
      stage.outputPrefix,
      slug
    ].filter(Boolean).join("/")}/`;
    if (links.length > 0) withJourney += 1;
    if (links.some(stage.isForward)) {
      withForwardStep += 1;
    } else {
      findings.push(
        `${stage.name}: ${slug} besitzt keinen passenden nächsten Funnel-Schritt.`
      );
    }
    if (html.includes("data-effective-auto-link")) {
      findings.push(
        `${stage.name}: ${slug} enthält einen Keyword-Autolink.`
      );
    }
    for (const link of links.filter((href) => href.startsWith("/"))) {
      if (!fs.existsSync(outputForRoute(link))) {
        findings.push(
          `${stage.name}: ${slug} verweist auf das fehlende Ziel ${link}.`
        );
      }
      if (link.split(/[?#]/, 1)[0] === currentRoute) {
        findings.push(
          `${stage.name}: ${slug} enthält einen Selbstlink im Journey-Modul.`
        );
      }
    }

    const comparisonLink = links.find((href) =>
      href.startsWith("/vergleiche/")
    );
    const productLink = links.find((href) =>
      href.startsWith("/produkt/")
    );
    const manufacturerLink = links.find((href) =>
      href.startsWith("/hersteller/")
    );
    const currentProductHref = `/produkt/${slug}/`;

    if (
      stage.collection === "pages" &&
      comparisonLink &&
      productLink &&
      !targetContainsLink(comparisonLink, productLink)
    ) {
      findings.push(
        `${stage.name}: ${slug} empfiehlt ein Produkt außerhalb des verlinkten Vergleichs.`
      );
    }
    if (
      stage.collection === "products" &&
      comparisonLink &&
      !targetContainsLink(comparisonLink, currentProductHref)
    ) {
      findings.push(
        `${stage.name}: ${slug} ist im verlinkten Vergleich nicht enthalten.`
      );
    }
    if (
      stage.collection === "comparisons" &&
      productLink &&
      manufacturerLink &&
      !targetContainsLink(productLink, manufacturerLink)
    ) {
      findings.push(
        `${stage.name}: ${slug} verbindet Produkt und Hersteller nicht konsistent.`
      );
    }
  }

  return {
    stage: stage.name,
    built,
    withJourney,
    withForwardStep
  };
});

console.log("Funnel Journey Audit");
for (const result of results) {
  console.log(
    `${result.stage}: ${result.withForwardStep}/${result.built} mit passendem nächsten Schritt`
  );
}
console.log(`Befunde: ${findings.length}`);
for (const finding of findings) console.log(`- ${finding}`);

if (strict && findings.length > 0) process.exitCode = 1;

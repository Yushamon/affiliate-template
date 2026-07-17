#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const write = (relativePath, content) => {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`✓ ${relativePath}`);
};

const replaceOnce = (content, search, replacement, file) => {
  if (!content.includes(search)) {
    throw new Error(
      `Patch-Muster in ${file} nicht gefunden:\n${search.slice(0, 180)}`
    );
  }
  return content.replace(search, replacement);
};

const packageRoot = path.dirname(new URL(import.meta.url).pathname);
const sourceInternalLinks = fs.readFileSync(
  path.join(packageRoot, "apps/pfotentechnik/src/domain/content/internalLinks.ts"),
  "utf8"
);
write("apps/pfotentechnik/src/domain/content/internalLinks.ts", sourceInternalLinks);

{
  const file = "apps/pfotentechnik/src/pages/[slug].astro";
  let content = read(file);

  content = replaceOnce(
    content,
    'import { getPageInternalLinkDefinitions } from "../domain/content/internalLinks";',
    'import {\n  getInternalLinkDefinitions,\n  getSourceContexts\n} from "../domain/content/internalLinks";',
    file
  );

  content = replaceOnce(
    content,
    'const pages = await getCollection("pages");\nconst internalLinkDefinitions = getPageInternalLinkDefinitions(pages);\nconst sourceContexts = Array.from(\n  new Set(\n    [page.data.linkContext, page.data.category].filter(\n      (context): context is string => Boolean(context),\n    ),\n  ),\n);',
    'const [pages, comparisons, manufacturers] = await Promise.all([\n  getCollection("pages"),\n  getCollection("comparisons"),\n  getCollection("manufacturers")\n]);',
    file
  );

  content = replaceOnce(
    content,
    'const products = await getCollection("products");',
    'const products = await getCollection("products");\nconst internalLinkDefinitions = getInternalLinkDefinitions({\n  pages,\n  products,\n  comparisons,\n  manufacturers\n});\nconst sourceContexts = getSourceContexts(page.data);',
    file
  );

  content = replaceOnce(
    content,
    '    <PremiumRenderer\n      blocks={page.data.premiumBlocks as any}\n      project={projectKey}\n      products={premiumProducts}\n    />',
    '    <AutoLinkContent\n      definitions={internalLinkDefinitions}\n      sourcePath={`/${page.data.slug}/`}\n      sourceGroup="knowledge"\n      sourceContexts={sourceContexts}\n      maxLinksPerPage={3}\n    >\n      <PremiumRenderer\n        blocks={page.data.premiumBlocks as any}\n        project={projectKey}\n        products={premiumProducts}\n      />\n    </AutoLinkContent>',
    file
  );

  content = replaceOnce(
    content,
    '      sourceContexts={sourceContexts}\n    >\n      <Content />',
    '      sourceContexts={sourceContexts}\n      maxLinksPerPage={7}\n    >\n      <Content />',
    file
  );

  write(file, content);
}

{
  const file = "apps/pfotentechnik/src/pages/vergleiche/[comparison].astro";
  let content = read(file);

  content = replaceOnce(
    content,
    'import ComparisonShell from "@affiliate-core/components/comparison/ComparisonShell.astro";',
    'import ComparisonShell from "@affiliate-core/components/comparison/ComparisonShell.astro";\nimport AutoLinkContent from "@affiliate-core/components/AutoLinkContent.astro";',
    file
  );

  content = replaceOnce(
    content,
    '} from "@app/domain/content";',
    '} from "@app/domain/content";\nimport {\n  getInternalLinkDefinitions,\n  getSourceContexts\n} from "../../domain/content/internalLinks";',
    file
  );

  content = replaceOnce(
    content,
    'const [products, manufacturers] = await Promise.all([\n  getCollection("products"),\n  getCollection("manufacturers")\n]);',
    'const [products, manufacturers, pages, comparisons] = await Promise.all([\n  getCollection("products"),\n  getCollection("manufacturers"),\n  getCollection("pages"),\n  getCollection("comparisons")\n]);\n\nconst internalLinkDefinitions = getInternalLinkDefinitions({\n  pages,\n  products,\n  comparisons,\n  manufacturers\n});\nconst sourceContexts = getSourceContexts(comparison);',
    file
  );

  content = replaceOnce(
    content,
    '    <article class="comparison-content">\n      <Content />\n    </article>',
    '    <article class="comparison-content">\n      <AutoLinkContent\n        definitions={internalLinkDefinitions}\n        sourcePath={`/vergleiche/${comparison.slug}/`}\n        sourceGroup="comparison"\n        sourceContexts={sourceContexts}\n        maxLinksPerPage={6}\n      >\n        <Content />\n      </AutoLinkContent>\n    </article>',
    file
  );

  write(file, content);
}

{
  const file = "apps/pfotentechnik/src/pages/produkt/[product].astro";
  let content = read(file);

  content = replaceOnce(
    content,
    'import ProductReview from "@affiliate-core/components/product/ProductReview.astro";',
    'import ProductReview from "@affiliate-core/components/product/ProductReview.astro";\nimport AutoLinkContent from "@affiliate-core/components/AutoLinkContent.astro";',
    file
  );

  content = replaceOnce(
    content,
    '} from "@app/domain/content";',
    '} from "@app/domain/content";\nimport {\n  getInternalLinkDefinitions,\n  getSourceContexts\n} from "../../domain/content/internalLinks";',
    file
  );

  content = replaceOnce(
    content,
    'const allProducts =\n  await getCollection("products");',
    'const [allProducts, pages, comparisons, manufacturers] =\n  await Promise.all([\n    getCollection("products"),\n    getCollection("pages"),\n    getCollection("comparisons"),\n    getCollection("manufacturers")\n  ]);\n\nconst internalLinkDefinitions = getInternalLinkDefinitions({\n  pages,\n  products: allProducts,\n  comparisons,\n  manufacturers\n});\nconst sourceContexts = getSourceContexts(contentProduct);',
    file
  );

  content = replaceOnce(
    content,
    '    <ProductReview\n      product={\n        reviewProduct\n      }\n      alternativeRecommendations={\n        alternativeRecommendations\n      }\n    />',
    '    <AutoLinkContent\n      definitions={internalLinkDefinitions}\n      sourcePath={canonical}\n      sourceGroup="product"\n      sourceContexts={sourceContexts}\n      maxLinksPerPage={5}\n    >\n      <ProductReview\n        product={\n          reviewProduct\n        }\n        alternativeRecommendations={\n          alternativeRecommendations\n        }\n      />\n    </AutoLinkContent>',
    file
  );

  write(file, content);
}

console.log("\nInterne Verlinkung V2 installiert.");
console.log("Jetzt ausführen: npm run build:pfotentechnik");

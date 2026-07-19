import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { mapProductToAdvisor } from "../../domain/advisor";

export const GET: APIRoute = async () => {
  const products = (await getCollection("products"))
    .filter(
      (entry) =>
        entry.data.category.key === "futterautomat"
    )
    .map(mapProductToAdvisor);

  return new Response(
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      products
    }),
    {
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        "Cache-Control":
          "public, max-age=3600"
      }
    }
  );
};

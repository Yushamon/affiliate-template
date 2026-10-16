import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { mapProductToAdvisor, isFeederAdvisorProduct } from "../../domain/advisor";

export const GET: APIRoute = async () => {
  const products = (await getCollection("products"))
    .filter(isFeederAdvisorProduct)
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

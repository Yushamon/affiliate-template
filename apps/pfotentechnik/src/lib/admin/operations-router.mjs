import {
  checkAllProductPrices,
  checkProductPrice,
  priceAudit,
  setManualProductPrice,
  updateProductOperationsState
} from "../price-intelligence/service.mjs";
import {
  evaluateOpportunityOutcome,
  getOpportunityState,
  markOpportunityOptimized,
  reopenOpportunity
} from "../seo/opportunity-state.mjs";
import {
  approveMediaJob,
  buildMediaJob,
  createMediaJob,
  getMediaJob,
  mediaAudit,
  readJobFile,
  reviewMediaCandidate,
  selectMediaVariant,
  uploadMediaVariant
} from "../media-center/service.mjs";

const errorStatus = (error) =>
  /nicht gefunden|fehlt/i.test(error?.message || "")
    ? 404
    : /nicht erlaubt|HTTPS|öffentlich|groesser|größer|unbekannt|ungültig/i.test(error?.message || "")
      ? 400
      : /läuft bereits|gleichzeitig|Konflikt/i.test(error?.message || "")
        ? 409
        : 422;

export async function handleOperationsRoute({ request, response, requestUrl, origin, json, assertJsonRequest, readJsonBody }) {
  const pathname = requestUrl.pathname;
  try {
    if (request.method === "GET" && pathname === "/api/admin/prices") {
      json(response, 200, await priceAudit(), origin);
      return true;
    }
    if (request.method === "POST" && pathname === "/api/admin/prices/check") {
      assertJsonRequest(request);
      const body = await readJsonBody(request, 32_768);
      json(response, 200, await checkProductPrice(String(body.slug || "")), origin);
      return true;
    }
    if (request.method === "POST" && pathname === "/api/admin/prices/check-all") {
      assertJsonRequest(request);
      const body = await readJsonBody(request, 32_768);
      json(response, 200, await checkAllProductPrices({
        limit: body.limit,
        includeInactive: Boolean(body.includeInactive)
      }), origin);
      return true;
    }
    if (request.method === "POST" && pathname === "/api/admin/prices/manual") {
      assertJsonRequest(request);
      const body = await readJsonBody(request, 32_768);
      json(response, 200, await setManualProductPrice(body), origin);
      return true;
    }
    if (request.method === "POST" && pathname === "/api/admin/products/operations") {
      assertJsonRequest(request);
      const body = await readJsonBody(request, 32_768);
      json(response, 200, await updateProductOperationsState(body), origin);
      return true;
    }

    if (request.method === "GET" && pathname === "/api/admin/seo/opportunities/state") {
      json(response, 200, await getOpportunityState(), origin);
      return true;
    }
    if (request.method === "POST" && pathname === "/api/admin/seo/opportunities/mark") {
      assertJsonRequest(request);
      const body = await readJsonBody(request, 32_768);
      json(response, 200, await markOpportunityOptimized(body), origin);
      return true;
    }
    if (request.method === "POST" && pathname === "/api/admin/seo/opportunities/reopen") {
      assertJsonRequest(request);
      const body = await readJsonBody(request, 32_768);
      json(response, 200, await reopenOpportunity(body), origin);
      return true;
    }
    if (request.method === "POST" && pathname === "/api/admin/seo/opportunities/evaluate") {
      assertJsonRequest(request);
      const body = await readJsonBody(request, 32_768);
      json(response, 200, await evaluateOpportunityOutcome(body), origin);
      return true;
    }

    if (request.method === "GET" && pathname === "/api/admin/media/audit") {
      json(response, 200, await mediaAudit(), origin);
      return true;
    }
    if (request.method === "POST" && pathname === "/api/admin/media/jobs") {
      assertJsonRequest(request);
      const body = await readJsonBody(request, 65_536);
      json(response, 201, await createMediaJob({ url: body.url, slug: body.slug }), origin);
      return true;
    }

    const match = pathname.match(/^\/api\/admin\/media\/jobs\/([0-9a-f-]+)(?:\/(upload|review|select|build|approve|file))?$/i);
    if (match) {
      const [, id, action] = match;
      if (request.method === "GET" && !action) {
        json(response, 200, await getMediaJob(id), origin);
        return true;
      }
      if (request.method === "GET" && action === "file") {
        const file = await readJobFile(id, requestUrl.searchParams.get("name") || "");
        response.writeHead(200, {
          "content-type": file.contentType,
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          ...(origin ? { "access-control-allow-origin": origin, vary: "Origin" } : {})
        });
        response.end(file.buffer);
        return true;
      }
      if (request.method === "POST") {
        assertJsonRequest(request);
        const body = await readJsonBody(request, 22_000_000);
        if (action === "upload") json(response, 200, await uploadMediaVariant(id, body), origin);
        else if (action === "review") json(response, 200, await reviewMediaCandidate(id, body), origin);
        else if (action === "select") json(response, 200, await selectMediaVariant(id, body), origin);
        else if (action === "build") json(response, 200, await buildMediaJob(id), origin);
        else if (action === "approve") json(response, 200, await approveMediaJob(id), origin);
        else return false;
        return true;
      }
    }
    return false;
  } catch (error) {
    json(response, errorStatus(error), {
      error: {
        code: "OPERATIONS_ACTION_FAILED",
        message: error instanceof Error ? error.message : String(error)
      }
    }, origin);
    return true;
  }
}

import { SearchError } from "./errors.mjs";
import { googleSearchProvider } from "./providers/google/provider.mjs";
import { bingSearchProvider } from "./providers/bing/provider.mjs";

const providers = new Map([[googleSearchProvider.id, googleSearchProvider], [bingSearchProvider.id, bingSearchProvider]]);

export function getSearchProvider(id) {
  const provider = providers.get(id);
  if (!provider) throw new SearchError("SEARCH_ACTION_NOT_ALLOWED", { message: `Unbekannter Search-Provider: ${id}` });
  return provider;
}

export function listSearchProviders() { return [...providers.values()]; }

// Product schema revision 35.7: retain decisionFacts; publication is gated separately.
// Astro hashes this entry file, so imported schema changes need a revision here
// to invalidate previously parsed collection records on incremental builds.
import {
  comparisonsCollection
} from "./content/schema/comparison";

import {
  manufacturersCollection
} from "./content/schema/manufacturer";

import {
  pagesCollection
} from "./content/schema/page";

import {
  productsCollection
} from "./content/schema/product";

export const collections = {
  pages:
    pagesCollection,

  products:
    productsCollection,

  manufacturers:
    manufacturersCollection,

  comparisons:
    comparisonsCollection
};

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
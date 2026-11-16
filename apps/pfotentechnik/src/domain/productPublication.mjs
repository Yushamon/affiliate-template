// Drafts remain available through astro:content for the existing SEO Cockpit.
export const isPublishedProduct = data => data?.publicationStatus !== 'draft' && !(data?.publicationBlockers?.length);

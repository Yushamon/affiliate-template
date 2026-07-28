import {
  createInternalLinkHtml,
  type LinkEngineOptions
} from "./linkEngine";

import type { InternalLinkDefinition } from "./types";

export interface HtmlLinkerOptions extends LinkEngineOptions {
  ignoredTags?: string[];
}

const defaultIgnoredTags = [
  "a",
  "button",
  "code",
  "pre",
  "script",
  "style",
  "textarea",
  "select",
  "option",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6"
];

const getTagName = (token: string) => {
  const match = token.match(/^<\/?\s*([a-z0-9-]+)/i);

  return match?.[1]?.toLowerCase();
};

const isClosingTag = (token: string) =>
  /^<\//.test(token);

const isSelfClosingTag = (token: string) =>
  /\/>$/.test(token) ||
  /^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/i.test(
    token
  );

const isHtmlTag = (token: string) =>
  /^<[^>]+>$/.test(token);

export const createInternalLinkedHtml = (
  html: string,
  definitions: InternalLinkDefinition[],
  options: HtmlLinkerOptions = {}
) => {
  if (!html || definitions.length === 0) {
    return html;
  }

  const ignoredTags = new Set(
    [...defaultIgnoredTags, ...(options.ignoredTags ?? [])].map((tag) =>
      tag.toLowerCase()
    )
  );

  const openIgnoredTags: string[] = [];
  const tokens = html.split(/(<[^>]+>)/g);
  let remainingLinks = options.maxLinksPerPage ?? 12;
  let availableDefinitions = [...definitions];

  return tokens
    .map((token) => {
      if (!token) {
        return token;
      }

      if (!isHtmlTag(token)) {
        if (openIgnoredTags.length > 0 || !token.trim()) {
          return token;
        }

        if (remainingLinks <= 0 || availableDefinitions.length === 0) {
          return token;
        }

        const linkedToken = createInternalLinkHtml(
          token,
          availableDefinitions,
          {
            ...options,
            maxLinksPerPage: remainingLinks
          }
        );

        const linkedHrefs = Array.from(
          linkedToken.matchAll(/<a href="([^"]+)"/g),
          (match) => match[1]
        );

        if (linkedHrefs.length > 0) {
          const usedHrefs = new Set(linkedHrefs);
          remainingLinks -= linkedHrefs.length;
          availableDefinitions = availableDefinitions.filter(
            (definition) => !usedHrefs.has(definition.href)
          );
        }

        return linkedToken;
      }

      const tagName = getTagName(token);

      if (!tagName || !ignoredTags.has(tagName)) {
        return token;
      }

      if (isClosingTag(token)) {
        const lastIndex = openIgnoredTags.lastIndexOf(tagName);

        if (lastIndex >= 0) {
          openIgnoredTags.splice(lastIndex, 1);
        }

        return token;
      }

      if (!isSelfClosingTag(token)) {
        openIgnoredTags.push(tagName);
      }

      return token;
    })
    .join("");
};

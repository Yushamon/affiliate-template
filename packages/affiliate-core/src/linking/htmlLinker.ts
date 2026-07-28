import {
  findInternalLinkMatches,
  selectInternalLinkMatches,
  type LinkBudgetState,
  type LinkEngineOptions,
  type LinkMatch
} from "./linkEngine.ts";
import type { InternalLinkDefinition } from "./types.ts";

export interface HtmlLinkerOptions extends LinkEngineOptions {
  ignoredTags?: string[];
}

const defaultIgnoredTags = [
  "a", "button", "code", "pre", "script", "style", "textarea", "select", "option",
  "input", "label", "h1", "h2", "h3", "h4", "h5", "h6", "svg", "template"
];

const voidTags = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
  "param", "source", "track", "wbr"
]);

type HtmlToken = {
  value: string;
  isTag: boolean;
  eligible: boolean;
  placementScore: number;
  documentOffset: number;
};

type StackEntry = {
  tag: string;
  ignored: boolean;
  placementScore: number;
};

const getTagName = (token: string) =>
  token.match(/^<\/?\s*([a-z0-9-]+)/i)?.[1]?.toLowerCase();

const isClosingTag = (token: string) => /^<\//.test(token);
const isCommentOrDoctype = (token: string) => /^<!(?:--|doctype)|^<\?/i.test(token);
const isSelfClosingTag = (token: string, tag?: string) =>
  /\/>\s*$/.test(token) || Boolean(tag && voidTags.has(tag));

const getClassNames = (token: string) => {
  const match = token.match(/\bclass\s*=\s*(["'])(.*?)\1/i);
  return match?.[2]?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
};

const placementForTag = (tag: string, classes: string[]) => {
  let score = 0;
  if (tag === "p") score += 35;
  if (tag === "article" || tag === "section" || tag === "main") score += 8;
  if (tag === "li") score -= 8;
  if (tag === "th" || tag === "thead") score -= 35;
  if (tag === "td" || tag === "table") score -= 15;
  if (tag === "nav" || tag === "aside" || tag === "footer") score -= 30;
  if (classes.some((name) => /(?:badge|chip|label|eyebrow|meta|button|cta|short|quick|fact|stat)/.test(name))) {
    score -= 45;
  }
  return score;
};

const tokenizeHtml = (html: string, ignoredTags: Set<string>): HtmlToken[] => {
  const rawTokens = html.split(/(<[^>]+>)/g).filter(Boolean);
  const stack: StackEntry[] = [];
  let documentOffset = 0;

  return rawTokens.map((value) => {
    const isTag = /^<[^>]+>$/.test(value);
    if (!isTag) {
      const ignored = stack.some((entry) => entry.ignored);
      const placementScore = stack.reduce((sum, entry) => sum + entry.placementScore, 0) +
        (value.trim().length < 32 ? -25 : 0);
      const token = {
        value,
        isTag: false,
        eligible: !ignored && Boolean(value.trim()),
        placementScore,
        documentOffset
      };
      documentOffset += value.length;
      return token;
    }

    const tag = getTagName(value);
    if (tag && !isCommentOrDoctype(value)) {
      if (isClosingTag(value)) {
        const index = stack.map((entry) => entry.tag).lastIndexOf(tag);
        if (index >= 0) stack.splice(index);
      } else if (!isSelfClosingTag(value, tag)) {
        const classes = getClassNames(value);
        stack.push({
          tag,
          ignored: ignoredTags.has(tag) || classes.some((name) => /(?:no-auto-link|autolink-ignore)/.test(name)),
          placementScore: placementForTag(tag, classes)
        });
      }
    }

    return { value, isTag: true, eligible: false, placementScore: 0, documentOffset };
  });
};

const applyMatches = (text: string, matches: LinkMatch[]) => {
  if (matches.length === 0) return text;
  let result = text;
  for (const match of [...matches].sort((a, b) => b.index - a.index)) {
    const title = match.definition.title
      ? ` title="${match.definition.title.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`
      : "";
    const anchor = text.slice(match.index, match.index + match.length);
    result = `${result.slice(0, match.index)}<a href="${match.definition.href}"${title}>${anchor}</a>${result.slice(match.index + match.length)}`;
  }
  return result;
};

export const createInternalLinkedHtml = (
  html: string,
  definitions: InternalLinkDefinition[],
  options: HtmlLinkerOptions = {}
) => {
  if (!html || definitions.length === 0) return html;

  const ignoredTags = new Set(
    [...defaultIgnoredTags, ...(options.ignoredTags ?? [])].map((tag) => tag.toLowerCase())
  );
  const tokens = tokenizeHtml(html, ignoredTags);
  const allMatches = tokens.flatMap((token, nodeIndex) =>
    token.eligible
      ? findInternalLinkMatches(
          token.value,
          definitions,
          options,
          token.documentOffset,
          nodeIndex,
          token.placementScore
        )
      : []
  );
  const selected = selectInternalLinkMatches(allMatches, options);
  const byNode = new Map<number, LinkMatch[]>();
  for (const match of selected) {
    const node = match.nodeIndex ?? 0;
    const list = byNode.get(node) ?? [];
    list.push(match);
    byNode.set(node, list);
  }

  return tokens
    .map((token, index) => token.isTag ? token.value : applyMatches(token.value, byNode.get(index) ?? []))
    .join("");
};

export type { LinkBudgetState };

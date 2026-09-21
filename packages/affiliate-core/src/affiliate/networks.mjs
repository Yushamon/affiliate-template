// Network-specific parameters live here, never in UI or evidence renderers.
export const AFFILIATE_REL = 'sponsored nofollow noopener';
export function httpsDestination(value, hosts = []) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || (hosts.length && !hosts.includes(url.hostname))) return null;
    return url.href;
  } catch { return null; }
}
export function buildNetworkLink(program, destination, context = {}) {
  const url = httpsDestination(destination, program?.hosts ?? []);
  if (!url || !program?.enabled) return null;
  const reference = [context.product, context.placement, context.pageType]
    .map(value => String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '-')).join('_').slice(0, 250);
  if (program.network === 'awin' && /^\d+$/.test(program.merchantId) && /^\d+$/.test(program.publisherId)) {
    const link = new URL('https://www.awin1.com/cread.php');
    link.searchParams.set('awinmid', program.merchantId);
    link.searchParams.set('awinaffid', program.publisherId);
    link.searchParams.set('ued', url);
    if (reference) link.searchParams.set('clickref', reference);
    return link.href;
  }
  // ADCELL: use only a supplied, verified program template, never guessed IDs or parameters.
  if (program.network === 'adcell' && program.verifiedTemplate && program.linkTemplate?.includes('{destination}')) {
    const link = program.linkTemplate.replaceAll('{destination}', encodeURIComponent(url)).replaceAll('{context}', encodeURIComponent(reference));
    return httpsDestination(link, ['www.adcell.de', 'adcell.de']);
  }
  return null;
}

// Shared server/client markup for the existing Product Operations page.
const escape = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function commerceCockpitMarkup(offers = [], slug = '') {
  if (!offers.length) return '<p>Keine Händlerquelle hinterlegt.</p>';
  return `<details><summary>Händlerangebote (${offers.length})</summary><div class="ops-offers">${offers.map(offer=>`
    <section class="ops-offer" data-offer-id="${escape(offer.id)}">
      <strong>${escape(offer.label)} · ${escape(offer.network)}</strong>
      <span>${escape(offer.formattedPrice || 'Kein aktueller Preis')} · ${escape(offer.availability)} · ${escape(offer.status)}</span>
      <small>Preisquelle: ${escape(offer.commerceDataProvider)} · letzte Preisprüfung: ${escape(offer.price?.checkedAt || 'nie')} · letzter Versuch: ${escape(offer.lastAttemptAt || 'nie')}</small>
      <small>Affiliate: ${offer.affiliateReady ? 'bereit' : 'nicht bereit'} · Zuordnung: ${escape(offer.mappingStatus)}</small>
      ${offer.destination ? `<a href="${escape(offer.destination)}" target="_blank" rel="noopener noreferrer">Offizielle Produkt-URL: ${escape(offer.destination)}</a>` : '<span>Offizielle Produkt-URL: unresolved</span>'}
      ${offer.error ? `<p role="status">${escape(offer.error)}</p>` : ''}
      ${offer.identityNote ? `<small>${escape(offer.identityNote)}</small>` : ''}
      ${offer.legacy ? '' : `<form data-offer-editor data-slug="${escape(slug)}" data-id="${escape(offer.id)}" data-program="${escape(offer.program)}">
        <label>Offizielle Produkt-URL<input name="officialProductUrl" type="url" value="${escape(offer.officialProductUrl)}" /></label>
        <label>Varianten-ID<input name="variantId" value="${escape(offer.variantId)}" /></label>
        <label>SKU<input name="expectedSku" value="${escape(offer.expectedSku)}" /></label>
        <label><input type="checkbox" name="confirmIdentity" /> Modell/Generation und Variante anhand Herstellerquelle geprüft</label>
        <button type="submit">Zuordnung speichern</button><small data-offer-save-status aria-live="polite"></small>
      </form>`}
    </section>`).join('')}</div></details>`;
}

// Shared server/client markup for the existing Product Operations page.
import {formatPrice, AVAILABILITY_LABELS} from '../product-operations/policy.mjs';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function commerceCockpitMarkup(offers = [], slug = '') {
  if (!offers.length) return '<p>Keine Händlerquelle hinterlegt.</p>';
  return `<details${offers.some(offer=>!offer.legacy) ? ' open' : ''}><summary>Händlerangebote (${offers.length}) — Preise unabhängig pflegen</summary><div class="ops-offers">${offers.map(offer=>`
    <section class="ops-offer" data-offer-id="${escape(offer.id)}">
      <strong>${escape(offer.label)} · ${escape(offer.network)}</strong>
      <strong data-stored-price>${escape(formatPrice(offer.price?.current,offer.price?.currency) || 'Kein Preis hinterlegt')}</strong>
      <span>${offer.current != null ? 'Aktueller Preisstand' : 'Kein öffentlich verwendbarer aktueller Preis'} · ${escape(AVAILABILITY_LABELS[offer.availability] || offer.availability)}</span>
      <small>${escape(offer.status)} · ${offer.canLink ? 'Kaufziel aktiv' : 'Kaufziel öffentlich nicht aktiv'}</small>
      <small>Preisquelle: ${escape(offer.commerceDataProvider)} · letzte Preisprüfung: ${escape(offer.price?.checkedAt || 'nie')} · letzter Versuch: ${escape(offer.lastAttemptAt || 'nie')}</small>
      <small>Affiliate: ${offer.affiliateReady ? 'bereit' : 'nicht bereit'} · Zuordnung: ${escape(offer.mappingStatus)}</small>
      ${offer.destination ? `<a href="${escape(offer.destination)}" target="_blank" rel="noopener noreferrer">Offizielle Produkt-URL: ${escape(offer.destination)}</a>` : '<span>Offizielle Produkt-URL: unresolved</span>'}
      ${offer.error ? `<p role="status">${escape(offer.error)}</p>` : ''}
      ${offer.identityNote ? `<small>${escape(offer.identityNote)}</small>` : ''}
      <form data-commerce-price-editor data-slug="${escape(slug)}" data-id="${escape(offer.id)}">
        <label>Preis bei ${escape(offer.label)}<input name="current" inputmode="decimal" value="${escape(offer.price?.current ?? '')}" placeholder="Preis unbekannt" /></label>
        <label>Währung<select name="currency">${['EUR','CHF','USD','GBP'].map(currency=>`<option${currency===(offer.price?.currency || 'EUR')?' selected':''}>${currency}</option>`).join('')}</select></label>
        <label>Verfügbarkeit<select name="availability">${Object.entries(AVAILABILITY_LABELS).map(([value,label])=>`<option value="${value}"${value===offer.availability?' selected':''}>${label}</option>`).join('')}</select></label>
        <button type="submit">Preis bei ${escape(offer.label)} speichern</button>
        <small>Leeres Preisfeld: Preis unbekannt. Speichern bestätigt den heutigen Preisstand nur für diesen Händler.</small>
        <small data-price-save-status aria-live="polite"></small>
      </form>
      ${offer.legacy ? '' : `<details><summary>Produktzuordnung bearbeiten</summary><form data-offer-editor data-slug="${escape(slug)}" data-id="${escape(offer.id)}" data-program="${escape(offer.program)}">
        <label>Offizielle Produkt-URL<input name="officialProductUrl" type="url" value="${escape(offer.officialProductUrl)}" /></label>
        <label>Varianten-ID<input name="variantId" value="${escape(offer.variantId)}" /></label>
        <label>SKU<input name="expectedSku" value="${escape(offer.expectedSku)}" /></label>
        <label><input type="checkbox" name="confirmIdentity" /> Modell/Generation und Variante anhand Herstellerquelle geprüft</label>
        <button type="submit">Zuordnung speichern</button><small data-offer-save-status aria-live="polite"></small>
      </form></details>`}
    </section>`).join('')}</div></details>`;
}

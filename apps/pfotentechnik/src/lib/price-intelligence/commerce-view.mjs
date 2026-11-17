// Shared server/client markup for the existing Product Operations page.
import {formatPrice, AVAILABILITY_LABELS} from '../product-operations/display.mjs';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function commerceCockpitMarkup(offers = [], slug = '', sourceHash = '') {
  return `${linkForm(null,slug,sourceHash)}${offers.some(offer => offer.canLink) ? '' : '<p role="status">Keine aktive Händleroption.</p>'}<details${offers.some(offer=>!offer.legacy) ? ' open' : ''}><summary>Händlerangebote (${offers.length}) — Preise unabhängig pflegen</summary><div class="ops-offers">${offers.map(offer=>`
    <section class="ops-offer" data-offer-id="${escape(offer.id)}">
      <strong>${escape(offer.label)} · ${escape(offer.network)}</strong>
      <strong data-stored-price>${escape(formatPrice(offer.price?.current,offer.price?.currency) || 'Kein Preis hinterlegt')}</strong>
      <span>${offer.current != null ? 'Aktueller Preisstand' : 'Kein öffentlich verwendbarer aktueller Preis'} · ${escape(AVAILABILITY_LABELS[offer.availability] || offer.availability)}</span>
      <small>${escape(offer.status)} · ${offer.purchasable ? 'Kaufbarkeit bestätigt' : offer.canLink ? 'Prüflink aktiv · Kaufbarkeit unbestätigt' : 'Kaufziel öffentlich nicht aktiv'}</small>
      <small>Preisquelle: ${escape(offer.commerceDataProvider)} · letzte Preisprüfung: ${escape(offer.price?.checkedAt || 'nie')} · letzter Versuch: ${escape(offer.lastAttemptAt || 'nie')}</small>
      <small>Letzte bestätigte Verfügbarkeitsprüfung: ${escape(offer.availabilityUpdated || 'nie')}</small>
      ${offer.amazonLink ? `<small data-amazon-link-status>Amazon: ${escape(offer.amazonLink.error || (offer.amazonLink.missingSourceTag ? 'Tag fehlte im Original; zentral ergänzt' : 'Affiliate-Ziel geprüft'))} · CTA: ${offer.canLink ? 'aktiv' : 'unterdrückt'}</small>` : ''}
      <small>Affiliate: ${offer.affiliateReady ? 'bereit' : 'nicht bereit'} · Zuordnung: ${escape(offer.mappingStatus)}</small>
      ${offer.destination ? `<a href="${escape(offer.destination)}" target="_blank" rel="noopener noreferrer">Offizielle Produkt-URL: ${escape(offer.destination)}</a>` : '<span>Offizielle Produkt-URL: unresolved</span>'}
      ${offer.error ? `<p role="status">${escape(offer.error)}</p>` : ''}
      ${offer.identityNote ? `<small>${escape(offer.identityNote)}</small>` : ''}
      ${offer.legacy?'':linkForm(offer,slug,sourceHash)}
      <button type="button" disabled data-remove-offer="${escape(offer.id)}" data-slug="${escape(slug)}" data-source-hash="${escape(sourceHash)}">${offer.legacy?'Bisherigen Hauptlink':'Händlerlink'} entfernen</button>
      <form data-commerce-price-editor data-slug="${escape(slug)}" data-id="${escape(offer.id)}">
        <label>Preis bei ${escape(offer.label)}<input name="current" inputmode="decimal" value="${escape(offer.price?.current ?? '')}" placeholder="Preis unbekannt" /></label>
        <label>Währung<select name="currency">${['EUR','CHF','USD','GBP'].map(currency=>`<option${currency===(offer.price?.currency || 'EUR')?' selected':''}>${currency}</option>`).join('')}</select></label>
        <label>Verfügbarkeit<select name="availability">${Object.entries(AVAILABILITY_LABELS).map(([value,label])=>`<option value="${value}"${value===offer.availability?' selected':''}>${label}</option>`).join('')}</select></label>
        <button disabled type="submit">Preis bei ${escape(offer.label)} speichern</button>
        <small>Leeres Preisfeld: Preis unbekannt. Speichern bestätigt den heutigen Preisstand nur für diesen Händler.</small>
        <small data-price-save-status aria-live="polite"></small>
      </form>
      ${offer.legacy ? '' : `<details><summary>Produktzuordnung bearbeiten</summary><form data-offer-editor data-slug="${escape(slug)}" data-id="${escape(offer.id)}" data-program="${escape(offer.program)}">
        <label>Offizielle Produkt-URL<input name="officialProductUrl" type="url" value="${escape(offer.officialProductUrl)}" /></label>
        <label>Varianten-ID<input name="variantId" value="${escape(offer.variantId)}" /></label>
        <label>SKU<input name="expectedSku" value="${escape(offer.expectedSku)}" /></label>
        <label><input type="checkbox" name="confirmIdentity" /> Modell/Generation und Variante anhand Herstellerquelle geprüft</label>
        <button disabled type="submit">Zuordnung speichern</button><small data-offer-save-status aria-live="polite"></small>
      </form></details>`}
    </section>`).join('')}</div></details>`;
}

function linkForm(offer,slug,sourceHash){
 const field=(name,label,value,type='text')=>`<label>${label}<input name="${name}" type="${type}" ${name==='merchant'?'list="ops-providers"':''} value="${escape(value)}" ${['id','merchant','officialProductUrl'].includes(name)?'required':''}/></label>`;
 return `<details class="ops-link-editor"><summary>${offer?'Händlerlink bearbeiten':'Händlerlink hinzufügen'}</summary><form data-link-editor data-slug="${escape(slug)}" data-source-hash="${escape(sourceHash)}" data-action="${offer?'edit':'add'}">
 ${field('id','Eindeutige Händlerkennung',offer?.id)}${field('merchant','Anbieter (bestehend oder neu)',offer?.merchant)}
 <label>Netzwerk<select name="network">${['partnernet','awin','adcell','none'].map(n=>`<option value="${n}"${(offer?.network??'none')===n?' selected':''}>${{partnernet:'Amazon PartnerNet',awin:'Awin',adcell:'ADCELL',none:'Direkter Anbieter'}[n]}</option>`).join('')}</select></label>
 <label>Konfiguriertes Programm (optional)<select name="program"><option value="">Eigener Händlerlink</option><option value="petlibro-de"${offer?.program==='petlibro-de'?' selected':''}>PETLIBRO / Awin</option><option value="tractive-de"${offer?.program==='tractive-de'?' selected':''}>Tractive / ADCELL (Zugang unvollständig)</option></select></label>
 ${field('officialProductUrl','Direkte Produkt-URL',offer?.officialProductUrl,'url')}${field('affiliateUrl','Affiliate-URL (bei Direktlink optional)',offer?.affiliate?.url,'url')}${field('variantId','ASIN / Variantenkennung (falls vorhanden)',offer?.variantId)}
 <label><input name="confirmIdentity" type="checkbox" required/> Produkt und Variante anhand der Produktseite geprüft</label>
 <p>Ein Händlerlink bestätigt weder Preis noch Lieferbarkeit. Preisquellen und Zugangsdaten werden nicht erfunden.</p>
 <button disabled type="submit">Händlerlink speichern</button><small data-link-status role="status"></small></form></details>`;
}

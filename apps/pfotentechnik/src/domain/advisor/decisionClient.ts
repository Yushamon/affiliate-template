import { recommendAdvisorProducts, decisionResultState } from './recommendProducts';
import { createAdvisorSession, decisionSummary, advisorComparisonLink } from './decisionSession';
import { parseDecisionAnswers, serializeDecisionAnswers } from './urlState';
import { decisionQuestions } from './decisionQuestions';
import type { AdvisorCategory, AdvisorProduct, DecisionAnswers } from './types';
const escape = (value: unknown) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
export const initDecisionAdvisor = () => {
  const root = document.querySelector<HTMLElement>('[data-decision-advisor]');
  if (!root) return;
  const hub = document.querySelector<HTMLElement>('[data-advice-hub]');
  const products: AdvisorProduct[] = JSON.parse(root.dataset.products ?? '[]');
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  let world: AdvisorCategory = 'gps', current = 0;
  const form = () => get<HTMLFormElement>(`[data-world-form="${world}"]`);
  const results = get('[data-decision-results]');
  const steps = () => [...form().querySelectorAll<HTMLElement>('[data-question]')];
  const update = (focus = true) => {
    steps().forEach((step, index) => { step.hidden = index !== current; });
    get('[data-progress-label]').textContent = `Frage ${current + 1} von 4`;
    get<HTMLProgressElement>('[data-progress]').value = current + 1;
    form().querySelector<HTMLButtonElement>('[data-back]')!.disabled = current === 0;
    form().querySelector('[data-next]')!.textContent = current === 3 ? 'Ergebnisse ansehen' : 'Weiter';
    form().querySelector<HTMLElement>('[data-error]')!.hidden = true;
    if (focus) { const legend = steps()[current].querySelector('legend')!; legend.tabIndex = -1; legend.focus(); }
  };
  const start = (category: AdvisorCategory) => {
    world = category; current = 0;
    root.hidden = false;
    if (hub) hub.hidden = true;
    root.querySelectorAll<HTMLFormElement>('[data-world-form]').forEach(f => { f.hidden = f.dataset.worldForm !== world; });
    get('[data-world-title]').textContent = world === 'gps' ? 'Ich möchte wissen, wo mein Tier draußen ist' : 'Ich möchte die Wasserversorgung meines Tieres verbessern';
    results.hidden = true; get('[data-question-status]').hidden = false; update(false);
  };
  const edit = (index: number) => {
    current = index; results.hidden = true; form().hidden = false; get('[data-question-status]').hidden = false; update();
  };
  const answers = (): DecisionAnswers | null => {
    const data = new FormData(form()), params = new URLSearchParams({ world, pet: String(data.get('pet') ?? ''), features: data.getAll('priorities').join(',') });
    for (const key of ['weight','subscription','material','cordless']) if (data.has(key)) params.set(key, String(data.get(key)));
    return parseDecisionAnswers(params);
  };
  const restore = (a: DecisionAnswers) => {
    form().reset();
    form().querySelectorAll<HTMLInputElement>('input').forEach(input => {
      if (input.name === 'weight') input.value = String(a.weight);
      else input.checked = input.name === 'priorities' ? a.priorities.includes(input.value) : a[input.name as keyof DecisionAnswers] === input.value;
    });
  };
  const render = (a: DecisionAnswers, push = true) => {
    if (push) history.pushState(null, '', `${location.pathname}?${serializeDecisionAnswers(a)}`);
    const state = decisionResultState(recommendAdvisorProducts(products, createAdvisorSession(a)));
    form().hidden = true; get('[data-question-status]').hidden = true; results.hidden = false;
    get('[data-result-title]').textContent = world === 'gps' ? 'Diese GPS-Tracker passen zu deinen Anforderungen' : 'Diese Trinkbrunnen passen besonders gut';
    get('[data-answer-summary]').textContent = decisionSummary(a);
    get('[data-compare]').setAttribute('href', advisorComparisonLink(a));
    get('[data-compare]').textContent = world === 'gps' ? 'Mit passenden Trackern vergleichen' : 'Mit passenden Trinkbrunnen vergleichen';
    get('[data-edit-steps]').innerHTML = decisionQuestions[world].map((q, index) => `<button type="button" data-edit-step="${index}">${escape(q.title)}</button>`).join('');
    get('[data-fallback]').innerHTML = state.message ? `<p>${escape(state.message)}</p><p>${state.visible.length ? 'Offene entscheidende Angaben:' : 'Dokumentierte Konflikte mit deiner Auswahl:'}</p><ul>${state.constraints.map(r => `<li>${escape(r.label)} <button type="button" class="pt-button" data-edit-step="${r.step}">Diese Auswahl ändern</button></li>`).join('')}</ul>` : '';
    const list = get('[data-matches]');
    const more = get<HTMLButtonElement>('[data-more]');
    const draw = (all = false) => {
      list.innerHTML = (all ? state.visible : state.visible.slice(0, 3)).map(m => `<article class="decision-match">
        <span class="match-status match-status--${m.status}">${m.status === 'pass' ? 'Anforderungen erfüllt' : 'Mögliche Passung — Angaben offen'}</span>
        <h3>${escape(m.product.title)}</h3>
        ${m.product.image ? `<img src="${escape(m.product.image.src)}" alt="${escape(m.product.image.alt)}" width="80" height="80" loading="lazy">` : ''}
        ${m.reasons.length ? `<ul>${m.reasons.slice(0, 5).map(r => `<li>✓ ${escape(r)}</li>`).join('')}</ul>` : '<p>Eine eindeutige Passung lässt sich anhand der vorhandenen Daten noch nicht belegen.</p>'}
        ${m.unknowns.length ? `<div class="match-unknowns"><strong>Offene Angaben</strong><ul>${m.unknowns.map(r => `<li>${escape(r)}</li>`).join('')}</ul></div>` : ''}
        ${m.cautions.length ? `<div class="match-cautions"><strong>Hinweise</strong><ul>${m.cautions.map(r => `<li>${escape(r)}</li>`).join('')}</ul></div>` : ''}
        <a class="pt-button pt-button-primary" href="${escape(m.product.route)}">Produkt ansehen</a>
      </article>`).join('');
      more.hidden = all || state.visible.length <= 3;
    };
    draw(); more.onclick = () => draw(true);
    results.focus();
  };
  root.addEventListener('click', e => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-edit-step], [data-edit], [data-back]');
    if (target?.hasAttribute('data-edit-step')) edit(Number(target.dataset.editStep));
    else if (target?.hasAttribute('data-edit')) edit(0);
    else if (target?.hasAttribute('data-back')) { current = Math.max(0, current - 1); update(); }
  });
  root.querySelectorAll<HTMLFormElement>('form').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const inputs = [...steps()[current].querySelectorAll<HTMLInputElement>('input')];
    const valid = inputs.every(i => !i.required || i.checkValidity());
    if (!valid) { f.querySelector<HTMLElement>('[data-error]')!.hidden = false; inputs[0]?.focus(); return; }
    if (current < 3) { current++; update(); }
    else { const a = answers(); if (a) render(a); else { current = 0; update(); } }
  }));
  const fromUrl = () => {
    const params = new URLSearchParams(location.search), category = params.get('world');
    if (category !== 'gps' && category !== 'fountain') { root.hidden = true; if (hub) hub.hidden = false; return; }
    start(category);
    const a = parseDecisionAnswers(params);
    if (a) { restore(a); render(a, false); }
  };
  window.addEventListener('popstate', fromUrl);
  fromUrl();
};

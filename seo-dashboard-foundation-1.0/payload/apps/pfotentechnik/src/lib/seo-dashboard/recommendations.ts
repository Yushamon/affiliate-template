import type { SeoPageRow, SeoRecommendation } from "./types";
export function buildRecommendations(pages:SeoPageRow[]):SeoRecommendation[] {
  const out:SeoRecommendation[]=[];
  for (const page of pages) {
    if (page.indexed === false) {
      out.push({id:`index-${page.url}`,priority:"high",title:page.title,url:page.url,reason:"Die Seite ist laut importierten Daten nicht indexiert.",actions:["Canonical, Robots und Sitemap prüfen","Interne Links ergänzen","Danach erneut bei Google und Bing einreichen"]});
    } else if (page.position !== undefined && page.position >= 8 && page.position <= 20 && page.ctr !== undefined && page.ctr < 2) {
      out.push({id:`ctr-${page.url}`,priority:"high",title:page.title,url:page.url,reason:`Position ${page.position.toFixed(1)} bei nur ${page.ctr.toFixed(1)} % CTR.`,actions:["Title und Description auf Suchintention ausrichten","Konkrete Auswahlhilfe ergänzen","Interne Links aus Cornerstones verstärken"],potential:"Schneller CTR- und Ranking-Hebel"});
    } else if ((page.impressions ?? 0) >= 500 && (page.clicks ?? 0) < 5) {
      out.push({id:`visibility-${page.url}`,priority:"medium",title:page.title,url:page.url,reason:"Viele Impressionen, aber bislang nur wenige Klicks.",actions:["Suchanfragen und Snippet prüfen","Einleitung präzisieren","Passende interne Links ergänzen"]});
    }
  }
  return out.slice(0,12);
}

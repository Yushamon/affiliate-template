export const ERROR_DEFINITIONS = {
  SEARCH_CONFIG_MISSING: ["Search-Konfiguration fehlt.", "Führe zuerst npm run gsc:setup aus."],
  SEARCH_CLIENT_CREDENTIALS_MISSING: ["Google OAuth-Client-ID oder Client-Secret fehlen.", "Setze GOOGLE_SEARCH_CLIENT_ID und GOOGLE_SEARCH_CLIENT_SECRET oder hinterlege eine lokale Client-Datei."],
  SEARCH_TOKEN_MISSING: ["Google Search Console ist noch nicht verbunden.", "Starte npm run gsc:setup oder verwende lokal „Google verbinden“."],
  SEARCH_TOKEN_REFRESH_FAILED: ["Das Google-Zugriffstoken konnte nicht erneuert werden.", "Verbinde Google Search Console erneut."],
  SEARCH_OAUTH_REQUIRED: ["Google Search Console benötigt eine Anmeldung.", "Starte den OAuth-Setup erneut."],
  SEARCH_OAUTH_STATE_INVALID: ["Die OAuth-Antwort konnte nicht sicher validiert werden.", "Starte den Verbindungsaufbau erneut."],
  SEARCH_PROPERTY_NOT_FOUND: ["Keine passende Search-Console-Property wurde gefunden.", "Prüfe den Property-Zugriff des verbundenen Google-Kontos."],
  SEARCH_PROPERTY_ACCESS_DENIED: ["Der Zugriff auf die Search-Console-Property wurde verweigert.", "Prüfe die Berechtigung für sc-domain:pfotentechnik.de."],
  SEARCH_API_UNAVAILABLE: ["Die Search-Console-API ist derzeit nicht erreichbar.", "Versuche die Aktion später erneut."],
  SEARCH_RATE_LIMITED: ["Das API-Limit wurde vorübergehend erreicht.", "Warte kurz und starte die Aktion erneut."],
  SEARCH_NO_DATA: ["Für den Zeitraum wurden keine Search-Daten geliefert.", "Prüfe Zeitraum und Property; vorhandene Dashboarddaten bleiben erhalten."],
  SEARCH_SYNC_ALREADY_RUNNING: ["Eine identische Search-Aktion läuft bereits.", "Warte auf den Abschluss der laufenden Aktion."],
  SEARCH_ADMIN_SERVICE_UNAVAILABLE: ["Der lokale Admin-Service ist nicht erreichbar.", "Starte npm run seo:admin."],
  SEARCH_ACTION_NOT_ALLOWED: ["Diese Admin-Aktion ist nicht erlaubt.", "Verwende eine der im Dashboard angebotenen Aktionen."],
  SEARCH_ACTION_TIMEOUT: ["Die Search-Aktion hat das Zeitlimit überschritten.", "Prüfe Verbindung und Logs und starte sie erneut."],
  SEARCH_WRITE_FAILED: ["Search-Daten konnten nicht sicher gespeichert werden.", "Prüfe Schreibrechte und freien Speicherplatz."],
  SEARCH_INVALID_DATA: ["Die Search-Daten sind ungültig.", "Die vorhandenen Dashboarddaten wurden nicht verändert."],
  BING_CONFIG_MISSING: ["Bing Webmaster Tools ist noch nicht konfiguriert.", "Setze BING_WEBMASTER_API_KEY und BING_WEBMASTER_SITE_URL in apps/pfotentechnik/.env."],
  BING_API_KEY_MISSING: ["Der Bing-Webmaster-API-Key fehlt.", "Trage BING_WEBMASTER_API_KEY in apps/pfotentechnik/.env ein."],
  BING_SITE_URL_MISSING: ["Die Bing-Website-URL fehlt.", "Setze BING_WEBMASTER_SITE_URL=https://pfotentechnik.de."],
  BING_AUTH_FAILED: ["Der Bing-Webmaster-API-Key wurde abgelehnt.", "Erzeuge oder rotiere den API-Key in Bing Webmaster Tools."],
  BING_SITE_NOT_FOUND: ["Die konfigurierte Website wurde im Bing-Webmaster-Konto nicht gefunden.", "Prüfe, ob die Website im selben Bing-Konto hinterlegt ist."],
  BING_SITE_NOT_VERIFIED: ["Die konfigurierte Website ist bei Bing nicht verifiziert.", "Verifiziere die Website in Bing Webmaster Tools."],
  BING_ACCESS_DENIED: ["Der Bing-Zugriff auf die Website wurde verweigert.", "Prüfe API-Key und Website-Berechtigung."],
  BING_API_UNAVAILABLE: ["Die Bing-Webmaster-API ist derzeit nicht erreichbar.", "Versuche die Aktion später erneut."],
  BING_RATE_LIMITED: ["Das Bing-API-Limit wurde vorübergehend erreicht.", "Warte kurz und starte die Aktion erneut."],
  BING_TIMEOUT: ["Die Bing-Webmaster-API hat nicht rechtzeitig geantwortet.", "Versuche die Aktion erneut."],
  BING_INVALID_RESPONSE: ["Bing hat eine ungültige API-Antwort geliefert.", "Versuche es erneut und aktiviere bei Bedarf SEARCH_DEBUG=1."],
  BING_NO_DATA: ["Bing hat keine Statistikdaten geliefert.", "Die Verbindung ist gültig; prüfe Datenalter und Sichtbarkeit im Bing-Portal."],
  BING_SYNC_FAILED: ["Die Bing-Synchronisierung ist fehlgeschlagen.", "Vorhandene Bing-Daten wurden beibehalten; prüfe den Provider-Status."],
};

export function redactSecrets(value) {
  let text = typeof value === "string" ? value : value instanceof Error ? value.message : String(value ?? "");
  text = text
    .replace(/((?:access|refresh|id)[_-]?token|client[_-]?secret|authorization[_-]?code|api[_-]?key|apikey)(\s*[=:]\s*)[^\s,;}]+/gi, "$1$2[REDACTED]")
    .replace(/(authorization\s*:\s*bearer\s+)[^\s]+/gi, "$1[REDACTED]")
    .replace(/([?&](?:apikey|code|state|token)=)[^&\s]+/gi, "$1[REDACTED]");
  return text.slice(0, 1600);
}

export class SearchError extends Error {
  constructor(code, options = {}) {
    const definition = ERROR_DEFINITIONS[code] ?? ["Unbekannter Search-Fehler.", "Prüfe die lokale Search-Konfiguration."];
    super(options.message || definition[0], { cause: options.cause });
    this.name = "SearchError";
    this.code = code;
    this.nextAction = options.nextAction || definition[1];
    this.retryable = Boolean(options.retryable);
  }
}

export function toPublicError(error, fallbackCode = "SEARCH_API_UNAVAILABLE") {
  const normalized = error instanceof SearchError ? error : new SearchError(fallbackCode, { cause: error });
  return {
    code: normalized.code,
    message: redactSecrets(normalized.message),
    nextAction: normalized.nextAction,
    retryable: normalized.retryable,
  };
}

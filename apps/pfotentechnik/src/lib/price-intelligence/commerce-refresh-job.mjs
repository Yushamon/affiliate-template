import {randomUUID} from 'node:crypto';

// Own the queue in the admin process. A browser reload/disconnect cannot cancel it.
export function createCommerceRefreshJob({listDocuments, check}) {
  let latest = null;
  const snapshot = () => latest ? structuredClone(latest) : null;
  async function run(job) {
    try {
      const documents = await listDocuments();
      job.total = documents.length;
      for (const document of documents) {
        job.currentSlug = document.slug;
        job.currentTitle = document.data?.title ?? document.slug;
        let result;
        try { result = {slug: document.slug, ok: true, ...await check(document.slug)}; }
        catch (error) { result = {slug: document.slug, ok: false, error: error instanceof Error ? error.message : String(error)}; }
        job.results.push(result);
        job.completed++;
        if (result.ok) job.succeeded++; else job.failed++;
      }
      job.status = 'completed';
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
    } finally {
      job.currentSlug = null;
      job.currentTitle = null;
      job.finishedAt = new Date().toISOString();
    }
  }
  return {
    get: snapshot,
    start() {
      if (latest?.status === 'running') return snapshot();
      latest = {id: randomUUID(), status: 'running', startedAt: new Date().toISOString(), finishedAt: null,
        total: null, completed: 0, succeeded: 0, failed: 0, currentSlug: null, currentTitle: null, results: []};
      void run(latest);
      return snapshot();
    }
  };
}

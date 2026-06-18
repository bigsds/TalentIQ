const N8N_BASE_URL = process.env.N8N_BASE_URL || ''

async function callWebhook(path: string, payload: unknown) {
  if (!N8N_BASE_URL) {
    console.warn(`[N8n] N8N_BASE_URL not configured — skipping webhook ${path}`)
    return { ok: false, skipped: true }
  }

  try {
    const res = await fetch(`${N8N_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    })
    return { ok: res.ok, status: res.status }
  } catch (err) {
    console.error(`[N8n] Webhook ${path} failed:`, err)
    return { ok: false, error: err }
  }
}

export const n8n = {
  nouveauMandat: (payload: unknown) =>
    callWebhook(process.env.N8N_WEBHOOK_NOUVEAU_MANDAT || '/webhook/hg-nouveau-mandat', payload),
  recherche: (payload: unknown) =>
    callWebhook(process.env.N8N_WEBHOOK_RECHERCHE || '/webhook/hg-recherche', payload),
  importCvsBatch: (payload: { mandat_id: number; file_ids: string[] }) =>
    callWebhook(process.env.N8N_WEBHOOK_IMPORT_BATCH || '/webhook/hg-import-cvs-batch', payload),
}

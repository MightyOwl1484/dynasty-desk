/**
 * Adapter from the SPFx SPHttpClient surface to the host-neutral list client.
 * The SPFx package is intentionally not imported here; the web part supplies
 * its configured client and `SPHttpClient.configurations.v1` at construction.
 */
export function createSpfxListClient({ spHttpClient, configuration, webAbsoluteUrl }) {
  if (!spHttpClient || typeof spHttpClient.fetch !== 'function') {
    throw new TypeError('An SPFx SPHttpClient instance is required.');
  }
  if (!webAbsoluteUrl) throw new TypeError('webAbsoluteUrl is required.');

  const listUrl = (list, suffix = '') => `${webAbsoluteUrl}/_api/web/lists/getbytitle('${String(list).replaceAll("'", "''")}')${suffix}`;
  const headers = { Accept: 'application/json;odata=nometadata' };

  return {
    async query(list, filters = {}) {
      const where = Object.entries(filters).map(([key, value]) => `${key} eq '${String(value).replaceAll("'", "''")}'`).join(' and ');
      const query = where ? `?$filter=${encodeURIComponent(where)}` : '';
      const response = await spHttpClient.fetch(listUrl(list, `/items${query}`), configuration, { headers });
      if (!response.ok) throw new Error(`SharePoint query failed (${response.status}).`);
      return (await response.json()).value ?? [];
    },
    async update(list, itemId, payload, { etag }) {
      if (!etag) throw new TypeError('An ETag is required for SPFx updates.');
      const response = await spHttpClient.fetch(listUrl(list, `/items(${encodeURIComponent(itemId)})`), configuration, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json;odata=nometadata', 'IF-MATCH': etag, 'X-HTTP-Method': 'MERGE' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`SharePoint update failed (${response.status}).`);
      return response.status === 204 ? null : response.json();
    }
  };
}

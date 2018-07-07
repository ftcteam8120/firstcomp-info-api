import fetch from 'node-fetch';

// TODO: Replace this hack with a real solution
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

/**
 * A utility function to perform an ElasticSearch query
 * @param url The ElasticSearch server
 * @param query A JSON query
 * @param size (optional) The number or results to return
 */
export async function elasticQuery(url: string, query: any, size?: number): Promise<any> {
  // Return a fetch promise with the result of the query
  return fetch(url + '?source=' +
    encodeURIComponent(JSON.stringify(query)) + (size ? '&size=' + size : ''))
    // Extract the JSON data
    .then(res => res.json())
    // Extract the hits
    .then((json) => {
      const rawHits = json.hits.hits;
      const hits = [];
      rawHits.forEach((hit) => {
        hits.push(hit._source);
      });
      return hits;
    });
}

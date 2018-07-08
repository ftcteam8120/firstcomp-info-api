import fetch from 'node-fetch';
import { Service } from 'typedi';

// TODO: Replace this hack with a real solution
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

@Service()
export class ElasticSearch {

  /**
   * Execute an ElasticSearch query
   * @param url The ElasticSearch server
   * @param query A JSON query
   * @param size (optional) The number or results to return
   */
  public async query(url: string, query: any, size?: number): Promise<any> {
    // Return a fetch promise with the result of the query
    return fetch(url + '?source=' +
      encodeURIComponent(JSON.stringify(query)) + (size ? '&size=' + size : ''))
      // Extract the JSON data
      .then(res => res.json())
      // Extract the hits
      .then((json) => {
        // Return an empty array if there are no hits
        if (!json.hits) return [];
        const rawHits = json.hits.hits;
        const hits = [];
        rawHits.forEach((hit) => {
          hits.push(hit._source);
        });
        return hits;
      });
  }

}

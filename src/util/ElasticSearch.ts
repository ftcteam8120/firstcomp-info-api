import fetch from 'node-fetch';
import { Service } from 'typedi';

// TODO: Replace this hack with a real solution
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

export interface ElasticResult {
  hits: any[];
  totalCount: number;
}

@Service()
export class ElasticSearch {

  /**
   * Execute an ElasticSearch query
   * @param url The ElasticSearch server
   * @param query A JSON query
   * @param size (optional) The number or results to return
   */
  public async query(url: string, query: any, size?: number):
    Promise<ElasticResult> {
    // Return a fetch promise with the result of the query
    return fetch(url + '?source=' +
      encodeURIComponent(JSON.stringify(query)) + (size ? '&size=' + size : ''))
      // Extract the JSON data
      .then(res => res.json())
      // Extract the hits
      .then((json) => {
        // Return an empty array if there are no hits
        if (!json.hits) return { hits: [], totalCount: 0 };
        const rawHits = json.hits.hits;
        const hits = [];
        rawHits.forEach((hit) => {
          hits.push(hit._source);
        });
        return {
          hits,
          totalCount: json.hits.total
        };
      });
  }

  public buildQuery(values: any): any {
    let string = '';
    let count = 0;
    if (values) {
      if (Object.keys(values).length > 0) {
        for (let i = 0; i < Object.keys(values).length; i += 1) {
          // Prevent undefined and null values
          if (values[Object.keys(values)[i]]) {
            string += Object.keys(values)[i] + ': ' + values[Object.keys(values)[i]];
            count += 1;
          }
          // Join values with AND statement
          if (i !== Object.keys(values).length - 1 && values[Object.keys(values)[i + 1]]) {
            string += ' AND ';
          }
        }
        if (count !== 0) {
          return {
            query_string: {
              query: string
            }
          };
        }
      }
    }
    return undefined;
  }

  public buildSort(dict: any, values: string[]): any {
    let split: string[];
    const sort = {};
    for (let i = 0; i < values.length; i += 1) {
      // Split the order into its parts
      split = values[i].split('_');
      // Use the dictionary to convert the name into the raw database value name
      // Set the key in the sort object
      sort[dict[split[0]]] = {
        order: split[1].toLowerCase()
      };
    }
    return sort;
  }

}

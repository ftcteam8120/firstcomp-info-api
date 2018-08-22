import fetch from 'node-fetch';
import { Service } from 'typedi';
import { MAPS_API_KEY } from '..';
import { Event } from '../entity/Event';
import { URL, URLSearchParams } from 'url';
import { RedisCache } from '../util/RedisCache';

@Service()
export class GoogleMaps {

  constructor(
    private redisCache: RedisCache
  ) { }

  private request(url: string, params: any): Promise<any> {
    // Add the search params to the URL
    const urlData = new URL(url);
    const searchParams = new URLSearchParams(params);
    // Append the API Key
    searchParams.append('key', MAPS_API_KEY);
    urlData.search = searchParams.toString();
    return fetch(urlData.toString())
      // Extract the JSON data
      .then(res => res.json());
  }

  public async getEventPlaceId(event: Event): Promise<string> {
    const cached = await this.redisCache.get<string>(event.id + '-placeid');
    if (cached) return cached;
    return this.request('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
      input:
        event.venue + ' ' +
        event.address + ' ' +
        event.city + ' ' +
        event.stateProv,
      inputtype: 'textquery'
    }).then((res) => {
      if (res.candidates.length > 0) {
        return this.redisCache.setKey(
          event.id + '-placeid',
          res.candidates[0].place_id,
          null
        ).then(() => {
          return res.candidates[0].place_id;
        });
      }
      return null;
    });
  }

  public getPlaceDetails(placeId: string): Promise<any> {
    return this.request('https://maps.googleapis.com/maps/api/place/details/json', {
      placeid: placeId
    }).then((res) => {
      return res.result;
    });
  }

  public async getEventPhotoUrl(
    event: Event,
    maxWidth: number = 600,
    index: number = 0
  ): Promise<string> {
    let i = index;
    const cached = await this.redisCache.get<string>(event.id + '-photourl-' + index.toString());
    if (cached) return cached;
    const placeId = await this.getEventPlaceId(event);
    if (!placeId) return null;
    const details = await this.getPlaceDetails(placeId);
    if (!details) return null;
    if (!details.photos) return null;
    if (details.photos.length > 0) {
      if (!details.photos[index]) i = 0;
      const photoUrl = new URL('https://maps.googleapis.com/maps/api/place/photo');
      const searchParams = new URLSearchParams({
        key: MAPS_API_KEY,
        photoreference: details.photos[i].photo_reference,
        maxwidth: maxWidth.toString()
      });
      photoUrl.search = searchParams.toString();
      return this.redisCache.setKey(
        event.id + '-photourl-' + index.toString(),
        photoUrl.toString(), null
      ).then(() => {
        return photoUrl.toString();
      });
    }
    return null;
  }

}

import type {MetadataRoute} from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/events', '/results', '/membership'].map(path => ({
    url: `https://nwnitro.co.uk${path}`,
  }));
}

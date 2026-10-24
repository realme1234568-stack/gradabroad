import type { MetadataRoute } from 'next';
import { sitemapPrograms } from '@/lib/publicCatalogue';
import { cataloguePath, siteUrl } from '@/lib/seo';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const programs = await sitemapPrograms();
  const paths = ['/', '/contact', '/privacy', '/terms'];
  for (const level of ['master', 'bachelor'] as const) {
    const pages = Math.max(1, Math.ceil(programs.filter(program => program.level === level).length / 24));
    for (let page = 1; page <= pages; page++) paths.push(cataloguePath({ level, page, query: '', band: 'all' }));
  }
  // No fabricated modification dates, unpublished records or private user routes.
  return [...paths.map(path => ({ url: new URL(path, siteUrl).href })), ...programs.map(program => ({ url: `${siteUrl}/programs/${program.id}` }))];
}

export function sitemapXml(entries: MetadataRoute.Sitemap): string {
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries.map(entry => `<url><loc>${escape(entry.url)}</loc></url>`).join('\n') + '\n</urlset>';
}

import sitemap, { sitemapXml } from '@/lib/sitemap';
export const revalidate = 3600;
export async function GET() {
  return new Response(sitemapXml(await sitemap()), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

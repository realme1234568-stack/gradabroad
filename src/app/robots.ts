import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';
export default function robots(): MetadataRoute.Robots {
  return {
    // Private/account URLs use noindex headers and metadata. Blocking them here
    // would prevent a crawler from seeing those instructions; auth still protects data.
    rules: { userAgent: '*', ...(process.env.VERCEL_ENV === 'preview' ? { disallow: '/' } : { allow: '/', disallow: '/api/' }) },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

import HomePage from './HomePage';
import { jsonLd, publicMetadata, siteDescription, siteUrl } from '@/lib/seo';
export const metadata = publicMetadata('Study in Germany: Programs & Application Planner | GradAbroad', siteDescription, '/');
export default function Page() {
  const data = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'GradAbroad', url: siteUrl, logo: `${siteUrl}/brand/apple-touch-icon.png`, email: 'gradabroad.online@gmail.com' },
    { '@type': 'WebSite', '@id': `${siteUrl}/#website`, name: 'GradAbroad', url: siteUrl, description: siteDescription, publisher: { '@id': `${siteUrl}/#organization` }, inLanguage: 'en' },
  ] };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} /><HomePage /></>;
}

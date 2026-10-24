import { expect, test, vi } from 'vitest';
import { catalogueFilters, cataloguePath, jsonLd, publicMetadata } from '@/lib/seo';
import robots from '@/app/robots';
import nextConfig from '../next.config';
test('catalogue URLs normalize defaults and retain a self-canonical for every pagination page',()=>{
 expect(catalogueFilters({page:'-1',level:'private',band:'invalid',q:['ignored']})).toEqual({level:'master',page:1,query:'',band:'all'});
 expect(cataloguePath(catalogueFilters({level:'master',page:'1',q:'  '}))).toBe('/browse-programs');
 expect(cataloguePath(catalogueFilters({level:'bachelor',page:'2'}))).toBe('/browse-programs?level=bachelor&page=2');
 expect(catalogueFilters({page:'10002',q:'a'.repeat(121)}).page).toBe(1);
 expect(catalogueFilters({q:'a'.repeat(121)}).query).toHaveLength(120);
 const meta=publicMetadata('Title','Description','/browse-programs?page=2');expect(meta.alternates?.canonical).toBe('https://www.gradabroad.online/browse-programs?page=2');
});
test('JSON-LD cannot break out of its script element',()=>{
 expect(jsonLd({name:'</script><script>alert(1)</script>'})).not.toContain('<');
 expect(JSON.parse(jsonLd({name:'</script>'}))).toEqual({name:'</script>'});
});
test('robots advertises the public sitemap and permits crawlers to read private-page noindex rules',()=>{
 vi.stubEnv('VERCEL_ENV','production');const result=robots();expect(result.sitemap).toBe('https://www.gradabroad.online/sitemap.xml');expect(result.rules).toEqual({userAgent:'*',allow:'/',disallow:'/api/'});vi.unstubAllEnvs();
});
test('preview deployments discourage indexing across the whole site',async()=>{
 vi.stubEnv('VERCEL_ENV','preview');expect(robots().rules).toEqual({userAgent:'*',disallow:'/'});
 const rules=await nextConfig.headers!();expect(rules.some(rule=>rule.source==='/:path*'&&rule.headers.some(header=>header.key==='X-Robots-Tag'&&header.value.includes('noindex')))).toBe(true);vi.unstubAllEnvs();
});
test('all account, auth, API and administration paths carry noindex response headers',async()=>{
 const rules=await nextConfig.headers!();for(const path of ['dashboard','application-tracker','my-profile','settings','auth','admin','api','dev','legal'])expect(rules).toContainEqual({source:`/${path}/:path*`,headers:[{key:'X-Robots-Tag',value:'noindex, nofollow, nosnippet'}]});
 expect(rules.some(rule=>rule.source==='/programs/:path*')).toBe(false);
});

// Build the portable MagnaNest storefront for the existing Cloudflare Pages project.
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ['index.html','styles.css','app.js','checkout-config.js','shipping-and-returns.html','privacy.html','404.html','favicon.svg','assets']) {
  await cp(resolve(root,name),resolve(output,name),{recursive:true});
}
await writeFile(resolve(output,'_headers'),'/checkout-config.js\n  Cache-Control: no-store\n');
const origin = new URL(process.env.CF_PAGES_URL || 'https://magnanest.pages.dev').origin;
await writeFile(resolve(output,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n');
const urls=['/','/shipping-and-returns.html','/privacy.html'].map(path=>'<url><loc>'+origin+path+'</loc></url>').join('');
await writeFile(resolve(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls+'</urlset>\n');
console.log('Built MagnaNest for Cloudflare Pages with portable images and existing Stripe checkout.');

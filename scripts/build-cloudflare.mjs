import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const output=resolve(root,'dist');
const paymentLinks={};
for(const quantity of [1,2,3]){
  const value=process.env['STRIPE_PAYMENT_LINK_'+quantity]||'';
  if(value){
    const url=new URL(value);
    if(url.protocol!=='https:'||url.hostname!=='buy.stripe.com'||url.port||url.username||url.password||url.pathname.length<2){
      throw new Error('Invalid Stripe Payment Link for bundle '+quantity);
    }
    paymentLinks[quantity]=url.href;
  }
}
if(Object.keys(paymentLinks).length>0&&Object.keys(paymentLinks).length!==3){
  throw new Error('Configure all three bundle Payment Links together.');
}
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
for(const file of ['index.html','styles.css','app.js','404.html','favicon.svg','assets']){
  await cp(resolve(root,file),resolve(output,file),{recursive:true});
}
await writeFile(resolve(output,'checkout-config.json'),JSON.stringify({paymentLinks},null,2)+'\n');
await writeFile(resolve(output,'_headers'),'/checkout-config.json\n  Cache-Control: no-store\n');
const siteUrl=process.env.CF_PAGES_URL;
if(siteUrl){
  const origin=new URL(siteUrl).origin;
  await writeFile(resolve(output,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n');
  await writeFile(resolve(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+origin+'/</loc></url></urlset>\n');
}else{
  for(const file of ['robots.txt','sitemap.xml'])await cp(resolve(root,file),resolve(output,file));
}
console.log('Cloudflare Pages build ready. Checkout '+(Object.keys(paymentLinks).length?'configured':'disabled until Stripe setup is complete')+'.');

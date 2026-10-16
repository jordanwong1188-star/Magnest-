import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root=process.cwd(), origin='https://magnanest.pages.dev';
await mkdir(path.join(root,'review'),{recursive:true});
const files=['index.html','styles.css','app.js','checkout-config.js','assets/editorial-kitchen-720.jpg'];
const hash=body=>createHash('sha256').update(body).digest('hex');
const result={checkedAt:new Date().toISOString(),origin,commit:process.env.GITHUB_SHA||null,files:[],matchesBuild:false};
for(const name of files){
 try{
  const response=await fetch(origin+'/'+(name==='index.html'?'':name),{signal:AbortSignal.timeout(20000),headers:{'Cache-Control':'no-cache'}});
  const body=Buffer.from(await response.arrayBuffer()), expected=await readFile(path.join(root,'dist',name));
  const record={file:name,status:response.status,url:response.url,bytes:body.length,matches:response.ok&&hash(body)===hash(expected)};
  if(name==='index.html'){const text=body.toString('utf8');record.title=text.match(/<title>([^<]*)<\/title>/i)?.[1]||null;record.hasRebuiltHero=text.includes('Your counter.');record.hasNewImagery=text.includes('editorial-kitchen-720.jpg');await writeFile(path.join(root,'review','cloudflare-live.html'),body);}
  result.files.push(record);
 }catch(error){result.files.push({file:name,error:String(error),matches:false});}
}
result.matchesBuild=result.files.every(file=>file.matches);
await writeFile(path.join(root,'review','cloudflare-status.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));

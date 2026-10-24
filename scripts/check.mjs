import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {weekState,pairsFor} from '../src/rotation.mjs';
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(dir,x.name)):path.join(dir,x.name));
const html=walk('dist').filter(p=>p.endsWith('.html'));
for(const file of html){const text=fs.readFileSync(file,'utf8');assert(!text.includes('myanimelist.net'),file+': anime link omitted');for(const [,href] of text.matchAll(/(?:href|src)="(\/[^"#]*)"/g)){if(href.startsWith('//'))continue;const target=path.join('dist',href,href.endsWith('/')?'index.html':'');assert(fs.existsSync(target),file+': missing '+href);}}
for(const file of html){const ids=[...fs.readFileSync(file,'utf8').matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,file+': duplicate element ID');}
const postFiles=fs.readdirSync('content/posts').filter(f=>f.endsWith('.md'));assert.equal(fs.readdirSync('dist/blog').filter(f=>fs.statSync('dist/blog/'+f).isDirectory()).length,postFiles.length);
assert.equal(weekState(new Date('2026-10-28T01:00:00Z')).next.toISOString(),'2026-10-29T02:00:00.000Z');
const before=weekState(new Date('2026-10-29T01:59:59Z')),after=weekState(new Date('2026-10-29T02:00:00Z'));assert.equal(after.week,before.week+1);
assert.equal(weekState(new Date('2026-11-01T10:30:00Z')).next.toISOString(),'2026-11-05T03:00:00.000Z');
assert.equal(weekState(new Date('2026-03-08T10:30:00Z')).next.toISOString(),'2026-03-12T02:00:00.000Z');
const {members}=JSON.parse(fs.readFileSync('content/prayer-partners.json','utf8'));for(let w=0;w<240;w++){const pairs=pairsFor(members,w);assert.equal(pairs.length,11);assert.deepEqual([...pairs.flat()].sort(),[...members].sort());assert.equal(pairs.filter(p=>p.length===3).length,1);}
assert.deepEqual(pairsFor(members,83)[0],['Dillon','Everett']);
const legacy=JSON.parse(fs.readFileSync('dist/legacy-posts.json','utf8'));assert.equal(legacy['1674201600'],'/blog/performance-reviews/');
console.log(`Verified ${html.length} HTML files, internal links, all ${postFiles.length} posts, retained legacy URLs, complete rosters, and Pacific DST boundaries.`);

// The game must work under a nested route, including GitHub project Pages URLs.
const gameDir='dist/lantern_lane';
const gameHtml=fs.readFileSync(path.join(gameDir,'index.html'),'utf8');
assert(gameHtml.includes('<title>Hetherau Crossing · Lantern Lane</title>'));
for(const file of html.filter(f=>!f.startsWith(gameDir+'/'))){
 const text=fs.readFileSync(file,'utf8');
 assert(/<a href="\/lantern_lane\/"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/.test(text),file+': game opens in its own tab');
}
for(const prefix of ['/lantern_lane/','/androo-site-2/lantern_lane/']){
 for(const [,asset] of gameHtml.matchAll(/(?:href|src)="([^"#]+)"/g)){
  if(asset==='../'||asset.startsWith('https:'))continue;
  const url=new URL(asset,'https://example.com'+prefix);
  assert(url.pathname.startsWith(prefix),asset+': escaped game subdirectory');
  assert(fs.existsSync(path.join(gameDir,url.pathname.slice(prefix.length))),asset+': missing game asset');
 }
}
const manifest=JSON.parse(fs.readFileSync(path.join(gameDir,'assets/characters/manifest.json'),'utf8'));
for(const entry of Object.values(manifest)){
 if(!entry)continue;
 assert(!entry.url.startsWith('/'),'Model URLs must be relative to the game.');
 assert(fs.existsSync(path.join(gameDir,entry.url)),entry.url+': missing character model');
}
assert(!fs.existsSync(path.join(gameDir,'src')),'Only compiled game files are published.');
console.log('Verified game navigation, isolated publish output, and assets under both domain and repository subpaths.');

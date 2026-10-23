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

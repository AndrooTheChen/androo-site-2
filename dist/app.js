import {weekState, pairsFor, fromPacificWall, weekMs, anchor} from './rotation.mjs';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
$$('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
// Retain the old site's hash links, including /post/:id, after migration.
async function resolveLegacy(){const h=location.hash;if(!h.startsWith('#/'))return;let target=h.slice(1);if(target.startsWith('/post/')){try{const res=await fetch('/legacy-posts.json');if(!res.ok)throw Error();const map=await res.json();target=map[target.split('/')[2]]||'/404/';}catch{return;}}else if(target!=='/')target=target.replace(/\/$/,'')+'/';location.replace(target);}
resolveLegacy();
// One persistent SVG keeps the pit box and crew anchored through every state.
const intro=$('#intro'),replay=$('[data-replay]'),skip=$('.skip-intro');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let animationFrame;
function finishIntro(){
 if(!intro?.classList.contains('playing'))return;
 cancelAnimationFrame(animationFrame);
 const restoreFocus=document.activeElement===skip;
 intro.classList.remove('playing','is-pitted');intro.dataset.phase='andrew';
 $('#intro-car').setAttribute('hidden','');
 $$('.pit-mechanic',intro).forEach(el=>el.removeAttribute('transform'));
 const copy=$('.landing-greeting');copy.style.visibility='visible';copy.removeAttribute('aria-hidden');
 $('.greeting').innerHTML='I’m Andrew<span class="papaya-dot">.</span>';
 skip.hidden=true;replay.hidden=false;
 if(restoreFocus)replay.focus({preventScroll:true});
}
function startIntro(){
 if(!intro||reduced.matches)return;
 cancelAnimationFrame(animationFrame);
 intro.classList.add('playing');
 const car=$('#intro-car'),copy=$('.landing-greeting'),crew=$$('.pit-mechanic',intro),started=performance.now();
 car.removeAttribute('hidden');car.setAttribute('transform','translate(-700 310)');
 crew.forEach(el=>el.removeAttribute('transform'));
 copy.style.visibility='visible';copy.removeAttribute('aria-hidden');
 $('.greeting').innerHTML='hello<span class="papaya-dot">.</span>';
 const restoreFocus=document.activeElement===replay;
 replay.hidden=true;skip.hidden=false;
 if(restoreFocus)skip.focus({preventScroll:true});
 const clamp=v=>Math.min(1,Math.max(0,v));
 const ease=v=>v*v*(3-2*v);
 let greetingSwapped=false;
 function frame(now){
  const t=(now-started)/1000;
  const enter=clamp((t-.5)/1.5),leave=clamp((t-4)/1.6);
  const x=t<2?-700+1300*(1-Math.pow(1-enter,3)):600+1300*Math.pow(leave,3);
  car.setAttribute('transform',`translate(${x.toFixed(2)} 310)`);
  const move=t<2?ease(clamp((t-1.1)/.9)):1-ease(clamp((t-3.65)/.8));
  crew.forEach(el=>{
   if(el.classList.contains('front-jack')){
    // Step out of the car's path, then return after the car has fully left.
    const stepAside=ease(clamp((t-3.15)/.65))*(1-ease(clamp((t-5.6)/.7)));
    el.setAttribute('transform',`translate(${(220*stepAside).toFixed(2)} ${(move*96*(1-stepAside)).toFixed(2)})`);
   }else{
    el.setAttribute('transform',`translate(0 ${(move*(el.classList.contains('chief')?12:96)).toFixed(2)})`);
   }
  });
  intro.classList.toggle('is-pitted',t>=2&&t<4);
  intro.dataset.phase=t<.5?'hello':t<2?'arriving':t<4?'pitted':t<6.4?'leaving':'andrew';
  // Swap once while the stationary car covers the greeting.
  if(t>=2.4&&!greetingSwapped){$('.greeting').innerHTML='I’m Andrew<span class="papaya-dot">.</span>';greetingSwapped=true;}
  if(t>=7.6){finishIntro();return;}
  animationFrame=requestAnimationFrame(frame);
 }
 animationFrame=requestAnimationFrame(frame);
}
skip?.addEventListener('click',finishIntro);
replay?.addEventListener('click',startIntro);
$$('.site-header a, .skip-content').forEach(link=>link.addEventListener('click',finishIntro));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&intro?.classList.contains('playing')){e.preventDefault();finishIntro();}});
if(intro&&!location.hash.startsWith('#/'))startIntro();
reduced.addEventListener('change',e=>{if(e.matches)finishIntro();});
// Blog search and category filtering work together, with a visible empty state.
const search=$('.search'),rows=$$('.blog-row');let category='All';
function filterPosts(){const query=search.value.trim().toLowerCase();let count=0;rows.forEach(row=>{const visible=(category==='All'||row.dataset.category===category)&&row.dataset.search.includes(query);row.hidden=!visible;if(visible)count++;});$('[data-post-count]').textContent=count; $('[data-note-label]').textContent=count===1?'note':'notes';$('.empty-state').hidden=count>0;}
if(search){search.addEventListener('input',filterPosts);$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;$$('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});filterPosts();}));}
// Pairings retain the existing round-robin order. All boundaries use Pacific wall time.
function pairCards(pairs){return pairs.map((names,i)=>{const card=document.createElement('div');card.className='partner-pair';const title=document.createElement('h3');title.textContent='Group '+(i+1);const list=document.createElement('ul');names.forEach(name=>{const li=document.createElement('li');li.textContent=name;list.append(li);});card.append(title,list);return card;});}
async function prayer(){try{const res=await fetch('/prayer-partners.json');if(!res.ok)throw Error('Unable to load members');const config=await res.json();let currentWeek=-1,currentPairs=[];
 const update=()=>{const now=new Date(),{week,next}=weekState(now);const remaining=Math.max(0,next-now),days=Math.floor(remaining/86400000),hours=Math.floor(remaining%86400000/3600000),minutes=Math.floor(remaining%3600000/60000);$('#rotation-countdown').textContent=`${days}d ${hours}h ${minutes}m until next rotation`;$('#week-number').textContent=`WEEK ${week+1}`;if(currentWeek!==week){currentWeek=week;currentPairs=pairsFor(config.members,week);$('#current-partners').replaceChildren(...pairCards(currentPairs));$('#full-schedule').replaceChildren();for(let i=week;i<week+22;i++){const article=document.createElement('article'),title=document.createElement('h3'),dates=document.createElement('p'),grid=document.createElement('div');title.textContent=`Week ${i+1}${i===week?' · Current week':''}`;const start=fromPacificWall(anchor+i*weekMs),end=fromPacificWall(anchor+(i+1)*weekMs);const format=d=>d.toLocaleDateString('en-US',{timeZone:config.timezone,month:'short',day:'numeric',year:'numeric'});dates.textContent=`${format(start)} – ${format(end)} · Wednesday, 7 PM Pacific`;grid.className='partners-grid';grid.append(...pairCards(pairsFor(config.members,i)));article.append(title,dates,grid);$('#full-schedule').append(article);}}};
 update();setInterval(update,30000);
 $('#copy-partners').addEventListener('click',async()=>{const text=currentPairs.map((names,i)=>`Group ${i+1}: ${names.join(', ')}`).join('\n');try{await navigator.clipboard.writeText(text);$('#copy-status').textContent='Partners copied to clipboard.';$('#copy-fallback').hidden=true;}catch{const box=$('#copy-fallback');box.hidden=false;box.value=text;box.focus();box.select();$('#copy-status').textContent='Select and copy the partners below.';}});
 const details=$('.schedule'),summary=$('summary',details);details.addEventListener('toggle',()=>{summary.textContent=details.open?'Hide full schedule':'Show full schedule — next 22 weeks';});
 }catch{$('#rotation-countdown').textContent='Couldn’t load the rotation.';$('#copy-status').textContent='Please refresh the page to try again.';}}
if($('#prayer-app'))prayer();

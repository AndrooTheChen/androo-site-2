import {weekState, pairsFor, fromPacificWall, weekMs, anchor} from './rotation.mjs';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const safeSession={get(k){try{return sessionStorage.getItem(k)}catch{return null}},set(k,v){try{sessionStorage.setItem(k,v)}catch{}}};
$$('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
const menu=$('.menu-button'),nav=$('#main-nav');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav.classList.toggle('open',open);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');menu.focus();}});
// Retain the old site's hash links, including /post/:id, after migration.
async function resolveLegacy(){const h=location.hash;if(!h.startsWith('#/'))return;let target=h.slice(1);if(target.startsWith('/post/')){try{const res=await fetch('/legacy-posts.json');if(!res.ok)throw Error();const map=await res.json();target=map[target.split('/')[2]]||'/404/';}catch{return;}}else if(target!=='/')target=target.replace(/\/$/,'')+'/';location.replace(target);}
resolveLegacy();
const intro=$('#intro'),content=$('#site-content');let timers=[],previousFocus=null,closeTimer,animationFrame;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function finishIntro(){cancelAnimationFrame(animationFrame);if(intro.hidden||intro.classList.contains('leaving'))return;timers.forEach(clearTimeout);timers=[];safeSession.set('andrew-pitbox-intro-seen','1');intro.classList.add('leaving');content.inert=false;document.body.classList.remove('intro-open');(previousFocus||$('#main')).focus({preventScroll:true});closeTimer=setTimeout(()=>{intro.hidden=true;intro.classList.remove('running');},550);}
function startIntro(manual=false){clearTimeout(closeTimer);cancelAnimationFrame(animationFrame);if(reduced.matches){if(manual){$('#main').focus({preventScroll:true});}return;}
 previousFocus=manual?document.activeElement:null;timers.forEach(clearTimeout);timers=[];
 intro.hidden=false;intro.classList.remove('leaving','running','text-hidden','is-pitted');$('.intro-copy').classList.remove('swap');$('.greeting').innerHTML='hello<span class="papaya-dot">.</span>';
 content.inert=true;document.body.classList.add('intro-open');$('.skip-intro').focus({preventScroll:true});
 const progress=$('.intro-track');progress.style.animation='none';void progress.offsetWidth;progress.style.animation='';
 const car=$('#intro-car'),copy=$('.intro-copy'),crew=$$('.pit-mechanic',intro),started=performance.now();
 const clamp=v=>Math.min(1,Math.max(0,v));
 const ease=v=>v*v*(3-2*v);
 copy.style.visibility='visible';
 function frame(now){
  const t=(now-started)/1000;
  const enter=clamp((t-.5)/1.5),leave=clamp((t-4)/1.6);
  const x=t<2?-700+1300*(1-Math.pow(1-enter,3)):600+1300*Math.pow(leave,3);
  car.setAttribute('transform',`translate(${x.toFixed(2)} 310)`);
  const move=t<2?ease(clamp((t-1.1)/.9)):1-ease(clamp((t-3.65)/.8));
  crew.forEach(el=>{
   if(el.classList.contains('front-jack')){
    // Local X points down the screen because this mechanic faces left.
    // Clear the full car width by 3.8s, before the car accelerates at 4s.
    const stepAside=ease(clamp((t-3.15)/.65));
    el.setAttribute('transform',`translate(${(220*stepAside).toFixed(2)} ${(move*96*(1-stepAside)).toFixed(2)})`);
   }else{
    el.setAttribute('transform',`translate(0 ${(move*(el.classList.contains('chief')?12:96)).toFixed(2)})`);
   }
  });
  const textVisible=t<1.45||t>=5.9;
  copy.style.visibility=textVisible?'visible':'hidden';
  copy.setAttribute('aria-hidden',String(!textVisible));
  intro.classList.toggle('is-pitted',t>=2&&t<4);
  intro.dataset.phase=t<.5?'hello':t<2?'arriving':t<4?'pitted':t<5.9?'leaving':'andrew';
  if(t>=5.9&&!copy.classList.contains('swap')){copy.classList.add('swap');$('.greeting').innerHTML='I’m Andrew<span class="papaya-dot">.</span>';}
  if(t>=7.6){finishIntro();return;}
  animationFrame=requestAnimationFrame(frame);
 }
 animationFrame=requestAnimationFrame(frame);
}
$('.skip-intro')?.addEventListener('click',finishIntro);
$$('[data-replay]').forEach(b=>b.addEventListener('click',()=>startIntro(true)));
document.addEventListener('keydown',e=>{if(!intro.hidden&&!intro.classList.contains('leaving')){if(e.key==='Escape'){e.preventDefault();finishIntro();}if(e.key==='Tab'){e.preventDefault();$('.skip-intro').focus();}}});
if(document.body.dataset.home&&!location.hash.startsWith('#/')&&!safeSession.get('andrew-pitbox-intro-seen')&&!reduced.matches)startIntro();
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

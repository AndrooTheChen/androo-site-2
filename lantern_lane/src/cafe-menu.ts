import {CAFE_DRINKS,type CafeDrinkId} from './content';
import type {GameState} from './state';

export function cafeMenuHTML(s:GameState){
  const date=s.quests.mintDate==='cafe';
  const sponsored=date&&!s.mintDateOrder;
  return `<button class="close" aria-label="Close dialog">×</button><div class="cafe-menu-header"><span class="eyebrow">A LITTLE TIME FOR YOURSELF</span><h2 id="modal-title">morrow café</h2><p>Something warm. Something sweet.<br>Stay as long as you like.</p><span class="cafe-open">OPEN ALL DAY · EVERY DAY</span></div>
  <div class="cafe-order-note">${sponsored?'♡ A table for two. Mint is treating you both—choose a drink to share.':s.mintDateOrder?`♡ Two ${CAFE_DRINKS[s.mintDateOrder].name.toLowerCase()}s are waiting at the window table. Talk to Mint to share them.`:`✦ ${s.coins.toLocaleString()} coins · Freshly made, one cup at a time.`}</div>
  ${s.cafeDrink?`<div class="cafe-held"><div><small>YOUR CUP</small><strong>${CAFE_DRINKS[s.cafeDrink].name}</strong></div><button class="secondary" id="cafe-sip">Enjoy your drink</button></div>`:''}
  <div class="cafe-menu-grid">${(Object.keys(CAFE_DRINKS) as CafeDrinkId[]).map(id=>{
    const d=CAFE_DRINKS[id],disabled=sponsored?false:!!s.cafeDrink||s.coins<d.price;
    return `<article class="cafe-drink"><div class="cafe-cup" style="--drink:${d.color}" aria-hidden="true"><svg viewBox="0 0 100 82"><ellipse cx="47" cy="69" rx="35" ry="6" fill="#e1d1b5"/><path d="M71 29h7c20 0 12 27-7 27" fill="none" stroke="#b39b7a" stroke-width="6"/><path d="M20 26h53l-5 32q-2 10-22 10T25 58Z" fill="#f7ebd2" stroke="#b39b7a" stroke-width="2"/><ellipse cx="46.5" cy="27" rx="26.5" ry="7" fill="var(--drink)"/><path d="M38 17c-8-8 8-8 0-16M53 17c-8-8 8-8 0-16" fill="none" stroke="#c7b998" stroke-width="2" stroke-linecap="round"/></svg></div><h3>${d.name}</h3><p>${d.note}</p><button class="buy" data-cafe-drink="${id}" ${disabled?'disabled':''}><strong>${sponsored?'Mint’s treat':`✦ ${d.price}`}</strong><span>${sponsored?'Order for two':s.cafeDrink?'Finish your cup':s.coins<d.price?'Need more coins':'Order a cup'}${disabled?'':' +'}</span></button></article>`;
  }).join('')}</div><p class="cafe-menu-footer">${s.mintDateOrder?'Your date drinks are set aside. Any extra cup above is a regular purchase.':'Take your cup to a quiet corner, or carry it with you in your bag.'}</p>`;
}

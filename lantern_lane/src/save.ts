import {clone,validateSave,type GameState} from './state';
const DB='lantern-lane-v1';let database:Promise<IDBDatabase>|null=null;
function db(){return database??=new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('saves');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function loadSave():Promise<{state:GameState|null; recovered:boolean}> {
  const d=await db();const read=(key:string)=>new Promise<unknown>((resolve,reject)=>{const r=d.transaction('saves').objectStore('saves').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  const current=await read('current');if(current){try{return {state:validateSave(current),recovered:false};}catch{const prev=await read('backup');if(prev)return {state:validateSave(prev),recovered:true};throw Error('Your save could not be read. Import an exported save to recover it.');}}
  return {state:null,recovered:false};
}
let queue=Promise.resolve();
export function saveState(s:GameState):Promise<void>{const snapshot=clone(s);const next=queue.catch(()=>{}).then(async()=>{
  validateSave(snapshot);const d=await db();await new Promise<void>((resolve,reject)=>{const tx=d.transaction('saves','readwrite');const store=tx.objectStore('saves');const r=store.get('current');r.onsuccess=()=>{if(r.result){try{store.put(validateSave(r.result),'backup');}catch{}}store.put(snapshot,'current');};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});
});queue=next;return next;}

/* 나의 말씀노트 서비스워커 (이 앱 캐시 mynote- 만 지워요)
   v33: 이 앱 주소(/SK-notebook/)에서만 설치 · 다른 앱 화면이 올라오면 저장해 둔 화면으로 · 정리는 이 앱 주소만
   CORE: 앱 화면·아이콘 (새 버전마다 새로 받음)
   STATIC: 성경·글꼴 (내용이 바뀌지 않으면 다시 받지 않음 · 글꼴은 파일 이름에 내용 표시가 붙어 있음) */
const CORE='mynote-core-v33-ab383659',STATIC='mynote-static-1f5f3545';
const COREF=["./", "index.html", "manifest.webmanifest", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "maskable-512.png"],STATICF=["NotoSerifKR-500.f7bd1622.woff2", "NotoSerifKR-700.08911847.woff2", "pret-Regular.89f1d362.woff2", "pret-SemiBold.7a08d4b0.woff2"];
const MINE=/\/sk-notebook\/$/i.test(new URL(self.registration.scope).pathname),ID='content="sk-notebook"';
self.addEventListener('install',e=>{e.waitUntil((async()=>{
  if(!MINE)throw new Error('not sk-notebook scope');
  const c=await caches.open(CORE);await c.addAll(COREF.map(f=>new Request(f,{cache:'reload'})));
  const st=await caches.open(STATIC);
  await Promise.all(STATICF.map(async f=>{if(await st.match(f))return;const old=await caches.match(f,{ignoreSearch:true});if(old){await st.put(f,old);return}const r=await fetch(f,{cache:'reload'});if(r.ok)await st.put(f,r)}));
  await self.skipWaiting()})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const ks=await caches.keys();await Promise.all(ks.filter(k=>k.indexOf('mynote-')===0&&k!==CORE&&k!==STATIC).map(k=>caches.delete(k)));
  const st=await caches.open(STATIC);const want=new Set(STATICF.map(f=>new URL(f,self.registration.scope).href));for(const r of await st.keys())if(r.url.indexOf(self.registration.scope)===0&&!want.has(r.url))await st.delete(r);
  await self.clients.claim()})())});
self.addEventListener('fetch',e=>{if(!MINE)return;const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  if(/version\.json$/.test(new URL(r.url).pathname))return;
  if(r.mode==='navigate'){e.respondWith(new Promise(res=>{let done=false;const fb=()=>{if(done)return;done=true;caches.match('index.html').then(m=>res(m||fetch(r)))};const t=setTimeout(fb,3000);
    fetch(r,{cache:'no-store'}).then(n=>{if(done)return;clearTimeout(t);
      /* 서버가 멈추거나(중지 안내·오류·다른 곳으로 넘김) 하면, 받아 둔 앱으로 열어요 */
      if(n&&n.ok&&n.type==='basic'&&!n.redirected){n.text().then(tx=>{
        /* 받은 화면이 이 앱 것인지 맨 앞부분으로 확인 — 다른 앱 파일이 잘못 올라오면 저장해 둔 화면으로 열고 저장하지 않아요 */
        const mk=()=>new Response(tx,{headers:{'Content-Type':'text/html; charset=utf-8'}});
        if(tx.slice(0,1500).indexOf(ID)>=0){caches.open(CORE).then(ca=>ca.put('index.html',mk()));done=true;res(mk())}
        else caches.match('index.html').then(m=>{done=true;res(m||mk())})}).catch(()=>{fb()})}else{caches.match('index.html').then(m=>{done=true;res(m||n)})}}).catch(()=>{clearTimeout(t);fb()})}));return}
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>m||fetch(r).catch(()=>Response.error())))});

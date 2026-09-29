(()=>{
'use strict';
const P=window.PHRASES||[];
const STORAGE='idiom1000.study.v1';
const ACCENT_KEY='idiom1000.lastAccent';
const accents=['#8b5cf6','#3b82f6','#06b6d4','#10b981','#84cc16','#eab308','#f97316','#ef4444','#ec4899','#d946ef','#14b8a6','#6366f1'];
const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const localDate=(d=new Date())=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
const modeLabel=m=>m==='en-ja'?'英 → 日':'日 → 英';
const modeShort=m=>m==='en-ja'?'英→日':'日→英';

function freshState(){return {theme:'dark',mode:'en-ja',range:{start:1,end:1000},plans:{},progress:{'en-ja':{},'ja-en':{}},daily:{},total:{'en-ja':{answers:0,correct:0},'ja-en':{answers:0,correct:0}}};}
let state=freshState();
try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'null');if(saved)state=mergeState(saved)}catch(e){}
function mergeState(s){const f=freshState();return {...f,...s,range:{...f.range,...(s.range||{})},plans:s.plans||{},progress:{'en-ja':s.progress?.['en-ja']||{},'ja-en':s.progress?.['ja-en']||{}},daily:s.daily||{},total:{'en-ja':{...f.total['en-ja'],...(s.total?.['en-ja']||{})},'ja-en':{...f.total['ja-en'],...(s.total?.['ja-en']||{})}}};}
function save(){localStorage.setItem(STORAGE,JSON.stringify(state));}

function setAccent(randomize=true){let last=Number(localStorage.getItem(ACCENT_KEY));let idx=Number.isInteger(last)?last:-1;if(randomize){const options=accents.map((_,i)=>i).filter(i=>i!==idx);idx=options[Math.floor(Math.random()*options.length)]??0;}idx=clamp(idx,0,accents.length-1);document.documentElement.style.setProperty('--accent',accents[idx]);document.documentElement.style.setProperty('--accentSoft',hexToRgba(accents[idx],.15));$('themeMeta').setAttribute('content',state.theme==='light'?'#f5f6f9':'#0c0f16');localStorage.setItem(ACCENT_KEY,String(idx));}
function hexToRgba(hex,a){const h=hex.replace('#','');const n=parseInt(h,16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`}
function applyTheme(){document.body.classList.toggle('light',state.theme==='light');setAccent(false)}

const rangeEntries=()=>P.filter(e=>e.id>=state.range.start&&e.id<=state.range.end);
const promptVars=(e,m=state.mode)=>m==='en-ja'?e.en:e.ja;
const answerVars=(e,m=state.mode)=>m==='en-ja'?e.ja:e.en;
const required=(e,m=state.mode)=>Math.max(3,promptVars(e,m).length);
function progress(e,m=state.mode){const box=state.progress[m];if(!box[e.id])box[e.id]={hits:0,covered:[],wrong:0};return box[e.id]}
function isClear(e,m=state.mode){const p=progress(e,m),need=required(e,m);return p.hits>=need&&new Set(p.covered||[]).size>=promptVars(e,m).length}
function courseStats(){let total=0,earned=0,clear=0;for(const e of rangeEntries()){const need=required(e),p=progress(e);total+=need;earned+=Math.min(need,p.hits||0);if(isClear(e))clear++;}return {total,earned,remaining:Math.max(0,total-earned),clear,count:rangeEntries().length}}
function dayRecord(date=localDate(),mode=state.mode){state.daily[date]??={};state.daily[date][mode]??={hits:0,answers:0,correct:0};return state.daily[date][mode]}
function totalDayHits(date){const x=state.daily[date]||{};return (x['en-ja']?.hits||0)+(x['ja-en']?.hits||0)}
function streak(){let n=0,d=new Date();while(true){const k=localDate(d);if(totalDayHits(k)>0){n++;d.setDate(d.getDate()-1)}else break;}return n}
function planKey(){return `${state.mode}:${state.range.start}-${state.range.end}`}
function plan(){const k=planKey();state.plans[k]??={targetDate:'',quota:60};return state.plans[k]}

function populatePresets(){const s=$('rangePreset');s.innerHTML='<option value="custom">カスタム</option><option value="1-1000">全範囲 1–1000</option>';for(let a=1;a<=1000;a+=100){let b=Math.min(1000,a+99);s.insertAdjacentHTML('beforeend',`<option value="${a}-${b}">${a}–${b}</option>`)}syncPreset()}
function syncPreset(){const v=`${state.range.start}-${state.range.end}`;$('rangePreset').value=[...$('rangePreset').options].some(o=>o.value===v)?v:'custom'}
function updatePlanInputs(){const p=plan();$('targetDate').value=p.targetDate||'';$('dailyQuota').value=p.quota||60}
function savePlanInputs(){const p=plan();p.targetDate=$('targetDate').value;p.quota=clamp(parseInt($('dailyQuota').value)||1,1,9999);save();updateHome()}

function updateHome(){
  const st=courseStats(),dr=dayRecord(),p=plan(),pct=st.total?Math.round(st.earned/st.total*100):100;
  $('overallPct').textContent=pct;$('ringPct').textContent=pct+'%';$('progressRing').style.setProperty('--pct',(pct*3.6)+'deg');$('earnedHits').textContent=st.earned;$('totalHits').textContent=st.total;$('remainingHits').textContent=st.remaining;$('clearedGroups').textContent=st.clear;$('rangeGroups').textContent=st.count;$('streakCount').textContent=streak();$('heroRange').textContent=`${state.range.start}–${state.range.end}`;$('heroModeLabel').textContent=state.mode==='en-ja'?'EN → JA':'JA → EN';
  $('rangeStart').value=state.range.start;$('rangeEnd').value=state.range.end;$('rangeEntryCount').textContent=st.count;$('rangeTotalHits').textContent=st.total;$('planRemaining').textContent=st.remaining;
  document.querySelectorAll('#modeSwitch button').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
  $('todayHits').textContent=dr.hits||0;$('todayQuotaText').textContent=p.quota||60;$('dailyGoalBar').style.width=Math.min(100,(dr.hits||0)/(p.quota||1)*100)+'%';
  let days='—',need='—',status='未設定';if(p.targetDate){const now=new Date(localDate()+'T00:00:00'),target=new Date(p.targetDate+'T00:00:00');const diff=Math.ceil((target-now)/86400000)+1;days=Math.max(0,diff);need=days>0?Math.ceil(st.remaining/days):st.remaining;if(st.remaining===0)status='範囲クリア';else if(days<=0)status='目標日到達';else if((p.quota||0)>=need)status='ペースOK';else status=`+${need-(p.quota||0)}/日`}
  $('daysLeft').textContent=days;$('neededPerDay').textContent=need;$('paceStatus').textContent=status;
  syncPreset();updateStats();renderSearch();save();
}

function setRange(a,b){a=clamp(Number(a)||1,1,1000);b=clamp(Number(b)||1000,1,1000);if(a>b)[a,b]=[b,a];state.range={start:a,end:b};save();updatePlanInputs();updateHome()}
function setMode(m){if(!['en-ja','ja-en'].includes(m))return;state.mode=m;save();updatePlanInputs();updateHome();toast(`${modeShort(m)}に切り替えました`)}

let currentView='home';
function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(name+'View')?.classList.add('active');currentView=name;document.body.classList.toggle('studying',name==='mission');document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));if(name==='search')renderSearch();if(name==='stats')updateStats();if(name==='home')updateHome();}

let session={qNo:0,combo:0,current:null,retry:[],answered:false,continuePastQuota:false};
function startMission(){const st=courseStats();if(st.remaining<=0){toast('この範囲はすでにクリアしています');return}session={qNo:0,combo:0,current:null,retry:[],answered:false,continuePastQuota:false};showView('mission');updateMissionHeader();nextQuestion()}
function updateMissionHeader(){const st=courseStats(),dr=dayRecord(),q=plan().quota||60;$('missionMode').textContent=modeLabel(state.mode);$('missionTodayHits').textContent=dr.hits||0;$('missionQuota').textContent=q;$('missionBar').style.width=Math.min(100,(dr.hits||0)/q*100)+'%';$('missionRange').textContent=`${state.range.start}–${state.range.end}`;$('missionRemaining').textContent=st.remaining;$('comboCount').textContent=session.combo}
function weightedPick(items){let total=0,weights=items.map(e=>{const p=progress(e);const uncovered=Math.max(0,promptVars(e).length-new Set(p.covered||[]).size);const w=1+Math.min(8,p.wrong||0)*.55+(uncovered>0?.9:0);total+=w;return w});let r=Math.random()*total;for(let i=0;i<items.length;i++){r-=weights[i];if(r<=0)return items[i]}return items[items.length-1]}
function chooseEntry(){const dueIdx=session.retry.findIndex(x=>x.due<=session.qNo&&x.mode===state.mode);if(dueIdx>=0){const r=session.retry.splice(dueIdx,1)[0],e=P[r.id-1];if(e&&!isClear(e)&&e.id>=state.range.start&&e.id<=state.range.end)return {e,promptIndex:r.promptIndex,retry:true}}
  const pool=rangeEntries().filter(e=>!isClear(e));if(!pool.length)return null;const e=weightedPick(pool),p=progress(e),vars=promptVars(e);const covered=new Set(p.covered||[]),uncovered=vars.map((_,i)=>i).filter(i=>!covered.has(i));const promptIndex=(uncovered.length?uncovered:vars.map((_,i)=>i))[Math.floor(Math.random()*(uncovered.length||vars.length))];return {e,promptIndex,retry:false}}
function norm(s){return String(s).toLowerCase().replace(/[\s　～….,、，。!?？!「」『』（）()\[\]［］]/g,'')}
function makeChoices(target){const ans=answerVars(target);const correctDisplay=ans[Math.floor(Math.random()*ans.length)];const targetNorms=new Set(ans.map(norm));const candidates=shuffle(P.filter(e=>e.id!==target.id&&e.id>=state.range.start&&e.id<=state.range.end&&answerVars(e).every(v=>!targetNorms.has(norm(v)))));const selected=[];const used=new Set([norm(correctDisplay)]);for(const e of candidates){const vals=shuffle(answerVars(e));const v=vals.find(x=>!used.has(norm(x)));if(v){selected.push({entry:e,display:v,correct:false});used.add(norm(v))}if(selected.length===3)break}while(selected.length<3){const e=P[Math.floor(Math.random()*P.length)],v=answerVars(e)[0];if(e.id!==target.id&&!used.has(norm(v))){selected.push({entry:e,display:v,correct:false});used.add(norm(v))}}
  return shuffle([{entry:target,display:correctDisplay,correct:true},...selected]);}
function nextQuestion(){
  if(!session.continuePastQuota&&dayRecord().hits>=plan().quota){showComplete();return}
  const picked=chooseEntry();if(!picked){showComplete(true);return}
  session.qNo++;session.answered=false;const choices=makeChoices(picked.e);session.current={...picked,choices};
  const e=picked.e,vars=promptVars(e),p=progress(e);$('missionWordNo').textContent=`No.${e.id}`;$('groupHit').textContent=`${Math.min(p.hits||0,required(e))}/${required(e)}`;$('promptKind').textContent=state.mode==='en-ja'?'英語を見て意味を選ぶ':'日本語を見て英熟語を選ぶ';$('missionPrompt').textContent=vars[picked.promptIndex];$('missionPrompt').classList.toggle('ja',state.mode==='ja-en');$('missionSpeakBtn').classList.toggle('hidden',state.mode!=='en-ja');$('answerStrip').className='answer-strip muted';$('answerStrip').textContent='1つ選んでください';$('nextMissionBtn').disabled=true;$('nextMissionBtn').textContent='次の問題';renderChoices();updateMissionHeader();
}
function renderChoices(){const wrap=$('missionChoices');wrap.className='choices-grid';wrap.innerHTML='';session.current.choices.forEach((c,i)=>{const b=document.createElement('div');b.className='choice';b.setAttribute('role','button');b.tabIndex=0;const L=c.display.length;if(L>46)b.classList.add('very-long');else if(L>28)b.classList.add('long');if(state.mode==='ja-en')b.classList.add('has-speak');const pair=state.mode==='en-ja'?`英語：${c.entry.enRaw}`:`意味：${c.entry.ja[0]}${c.entry.ja.length>1?` ほか${c.entry.ja.length-1}種`:''}`;b.innerHTML=`<span class="choice-main"></span><span class="choice-pair"></span>`;b.querySelector('.choice-main').textContent=c.display;b.querySelector('.choice-pair').textContent=pair;if(state.mode==='ja-en'){const sp=document.createElement('button');sp.type='button';sp.className='choice-speak';sp.textContent='🔊';sp.addEventListener('click',ev=>{ev.stopPropagation();speak(c.display)});b.appendChild(sp)}b.addEventListener('click',()=>answer(i));b.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();answer(i)}});wrap.appendChild(b)})}
function answer(index){if(session.answered)return;session.answered=true;const q=session.current,c=q.choices[index],e=q.e,p=progress(e),correct=c.correct;const dr=dayRecord();dr.answers++;state.total[state.mode].answers++;
  if(correct){dr.correct++;dr.hits++;state.total[state.mode].correct++;session.combo++;p.hits=Math.min(required(e),Number(p.hits||0)+1);p.covered=[...new Set([...(p.covered||[]),q.promptIndex])];}else{session.combo=0;p.wrong=Number(p.wrong||0)+1;session.retry.push({id:e.id,promptIndex:q.promptIndex,due:session.qNo+4+Math.floor(Math.random()*3),mode:state.mode})}
  save();const buttons=[...$('missionChoices').children];$('missionChoices').classList.add('answered');buttons.forEach((b,i)=>{const opt=q.choices[i];b.setAttribute('aria-disabled','true');if(opt.correct)b.classList.add('correct');else if(i===index)b.classList.add('wrong');else b.classList.add('dim')});
  const strip=$('answerStrip');strip.className='answer-strip '+(correct?'good':'bad');strip.innerHTML='';const msg=document.createElement('span');msg.textContent=correct?(isClear(e)?'✓ 正解・この熟語をクリア':'✓ 正解'):`✕ 正解は「${q.choices.find(x=>x.correct).display}」`;strip.appendChild(msg);const sp=document.createElement('button');sp.textContent='🔊 英語';sp.addEventListener('click',()=>speak(state.mode==='en-ja'?promptVars(e)[q.promptIndex]:q.choices.find(x=>x.correct).display));strip.appendChild(sp);
  $('nextMissionBtn').disabled=false;if(!session.continuePastQuota&&dr.hits>=plan().quota)$('nextMissionBtn').textContent='今日の結果を見る';updateMissionHeader();}
function showComplete(rangeDone=false){showView('complete');const st=courseStats(),dr=dayRecord();$('completeTodayHits').textContent=dr.hits||0;$('completeRemaining').textContent=st.remaining;$('completeCleared').textContent=st.clear;$('completeMode').textContent=modeShort(state.mode);$('continueMissionBtn').textContent=rangeDone?'別の範囲を学習する':'もう少し続ける';$('continueMissionBtn').onclick=()=>{if(rangeDone){showView('home')}else{session.continuePastQuota=true;showView('mission');nextQuestion()}}}

function speak(t){if(!('speechSynthesis'in window)){toast('このブラウザは読み上げに対応していません');return}speechSynthesis.cancel();let s=String(t).replace(/～/g,' something ').replace(/…/g,' ');const u=new SpeechSynthesisUtterance(s);u.lang='en-US';u.rate=.86;u.pitch=1;speechSynthesis.speak(u)}

function renderSearch(){const box=$('searchResults');if(!box)return;const q=($('searchInput')?.value||'').trim().toLowerCase();let list=P.filter(e=>!q||e.enRaw.toLowerCase().includes(q)||e.jaRaw.includes(q)||e.en.some(x=>x.toLowerCase().includes(q))||e.ja.some(x=>x.includes(q)));list=list.slice(0,250);box.innerHTML='';for(const e of list){const p=progress(e),need=required(e),d=document.createElement('div');d.className='phrase-item card';d.innerHTML=`<div class="phrase-top"><div><div class="phrase-no">No.${e.id}</div><div class="phrase-en"></div></div><div class="progress-mini">${Math.min(p.hits||0,need)}/${need}</div></div><div class="phrase-ja"></div><div class="variant-row"><span class="variant-chip">英語 ${e.en.length}種</span><span class="variant-chip">日本語 ${e.ja.length}種</span>${e.sourceNote?'<span class="variant-chip">同義表現あり</span>':''}</div>`;d.querySelector('.phrase-en').textContent=e.enRaw;d.querySelector('.phrase-ja').textContent=e.jaRaw;box.appendChild(d)}if(!list.length)box.innerHTML='<div class="tiny" style="text-align:center;padding:30px">見つかりませんでした</div>'}
function updateStats(){if(!$('statsTitle'))return;const st=courseStats(),dr=dayRecord(),tot=state.total[state.mode];$('statsTitle').textContent=`${modeShort(state.mode)} · ${state.range.start}–${state.range.end}`;$('statsHits').textContent=st.earned;$('statsCleared').textContent=st.clear;$('statsRemaining').textContent=st.remaining;$('statsStreak').textContent=streak();$('statsToday').textContent=dr.hits||0;$('statsAccuracy').textContent=tot.answers?Math.round(tot.correct/tot.answers*100)+'%':'—';
  const es=rangeEntries(),unstarted=es.filter(e=>(progress(e).hits||0)===0).length,cleared=es.filter(e=>isClear(e)).length,working=es.length-unstarted-cleared;$('coverageStats').innerHTML=[['未着手',unstarted],['進行中',working],['クリア',cleared]].map(([n,v])=>`<div class="coverage-row"><b>${n}</b><div class="bar"><i style="width:${es.length?v/es.length*100:0}%"></i></div><span>${v}</span></div>`).join('');
  const week=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=localDate(d),x=state.daily[k]?.[state.mode]?.hits||0;week.push(`<div class="week-day"><b>${x}</b><span>${d.getMonth()+1}/${d.getDate()}</span></div>`)}$('weekStrip').innerHTML=week.join('');
  const hard=es.map(e=>({e,w:progress(e).wrong||0})).filter(x=>x.w>0).sort((a,b)=>b.w-a.w).slice(0,8);$('hardList').innerHTML=hard.length?hard.map(x=>`<div class="hard-row"><div><b>${escapeHtml(x.e.enRaw)}</b><br><span>${escapeHtml(x.e.jaRaw)}</span></div><em>${x.w} miss</em></div>`).join(''):'<p class="tiny">まだ誤答記録はありません。</p>';}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`idiom1000-progress-${localDate()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function importData(file){const r=new FileReader();r.onload=()=>{try{state=mergeState(JSON.parse(r.result));save();applyTheme();updatePlanInputs();updateHome();toast('進捗を読み込みました')}catch(e){toast('読み込みに失敗しました')}};r.readAsText(file)}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1800)}

// events
$('themeBtn').addEventListener('click',()=>{state.theme=state.theme==='light'?'dark':'light';save();applyTheme()});$('rerollAccentBtn').addEventListener('click',()=>setAccent(true));document.querySelectorAll('#modeSwitch button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$('rangePreset').addEventListener('change',e=>{if(e.target.value==='custom')return;const [a,b]=e.target.value.split('-').map(Number);setRange(a,b)});$('rangeStart').addEventListener('change',()=>setRange($('rangeStart').value,$('rangeEnd').value));$('rangeEnd').addEventListener('change',()=>setRange($('rangeStart').value,$('rangeEnd').value));$('targetDate').addEventListener('change',savePlanInputs);$('dailyQuota').addEventListener('change',savePlanInputs);$('autoQuotaBtn').addEventListener('click',()=>{const p=plan();if(!p.targetDate){toast('先に目標日を設定してください');return}const st=courseStats(),now=new Date(localDate()+'T00:00:00'),t=new Date(p.targetDate+'T00:00:00'),days=Math.ceil((t-now)/86400000)+1;p.quota=Math.max(1,Math.ceil(st.remaining/Math.max(1,days)));save();updatePlanInputs();updateHome();toast(`1日 ${p.quota} 正解に設定しました`)});$('startMissionBtn').addEventListener('click',startMission);$('nextMissionBtn').addEventListener('click',nextQuestion);$('missionSpeakBtn').addEventListener('click',()=>{if(session.current)speak(promptVars(session.current.e)[session.current.promptIndex])});$('searchInput').addEventListener('input',renderSearch);$('exportBtn').addEventListener('click',exportData);$('importInput').addEventListener('change',e=>{if(e.target.files[0])importData(e.target.files[0]);e.target.value=''});$('resetBtn').addEventListener('click',()=>{if(confirm('すべての学習進捗をリセットしますか？')){const theme=state.theme,mode=state.mode;state=freshState();state.theme=theme;state.mode=mode;save();updatePlanInputs();updateHome();toast('リセットしました')}});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));

populatePresets();state.range.start=clamp(state.range.start,1,1000);state.range.end=clamp(state.range.end,1,1000);if(state.range.start>state.range.end)[state.range.start,state.range.end]=[state.range.end,state.range.start];applyTheme();setAccent(true);updatePlanInputs();updateHome();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();

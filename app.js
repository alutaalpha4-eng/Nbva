// NBVA School Management. Static front-end for the Supabase backend.
const TERMS=['Term 1','Term 2','Term 3'],EXN=['Opener','Mid-term','End-term'],EX=TERMS.flatMap(t=>EXN.map(n=>t+' · '+n)),CLS=['Playgroup','PP1','PP2','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9'];
const CAT=['Tuition/Term Fee','Admission Fee','Transport','Uniform','Books & Stationery','Meals/Snacks','Swimming','Tours/Trips','Penalties/Fines','Graduation Fee'];
const FI=[];
const fid=n=>FI.findIndex(f=>f.n==n),sum=o=>Object.values(o).reduce((a,b)=>a+b,0),billed=x=>sum(x.ch),paidOf=x=>sum(x.py),bal=x=>billed(x)-paidOf(x);
const fst=x=>!billed(x)?['Not billed','']:bal(x)<=0?['Cleared','']:paidOf(x)?['Partial','wn']:['Unpaid','bad'];
let RN=0;const fd=d=>new Date(d).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
const W1=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'],W2=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
const words=n=>n<20?W1[n]:n<100?W2[Math.floor(n/10)]+(n%10?' '+W1[n%10]:''):n<1000?W1[Math.floor(n/100)]+' Hundred'+(n%100?' and '+words(n%100):''):n<1e6?words(Math.floor(n/1000))+' Thousand'+(n%1000?(n%1000<100?' and ':' ')+words(n%1000):''):words(Math.floor(n/1e6))+' Million'+(n%1e6?' '+words(n%1e6):'');
const SUBS={},OPT=[],ALLS=[],subs=c=>SUBS[c]||[];
const ST=[];
const TEACH=[];
const LV=[{c:'EE',n:'Exceeding Expectation',d:'Excellent mastery',min:75},{c:'ME',n:'Meeting Expectation',d:'Competent, expected level achieved',min:41},{c:'AE',n:'Approaching Expectation',d:'Close to the required level but needs improvement',min:21},{c:'BE',n:'Below Expectation',d:'Needs significant support and improvement',min:0}];
const G=v=>LV.find(l=>v>=l.min).c,lvt=v=>{const c=G(v);return `<span class="t ${{EE:'',ME:'ok',AE:'wn',BE:'bad'}[c]}" title="${LV.find(l=>l.c==c).n}">${c}</span>`};
const legend=()=>`<div class="mu" style="font-size:13px;margin-top:10px">${LV.map((l,i)=>`<div><b>${l.c}</b> (${l.min}-${i?LV[i-1].min-1:100}) ${l.n}: ${l.d}</div>`).join('')}</div>`;
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0,f1=v=>v.toFixed(1);
const kk=(t,x)=>TERMS[t]+' · '+(x==3?'Mean':EXN[x]);
const mk=(x,e,s)=>{if(e.endsWith('Mean')){const t=e.slice(0,6),v=EXN.map(n=>x.m[t+' · '+n]).map(o=>o?o[s]:null).filter(v=>v!=null);return v.length?avg(v):null}const o=x.m[e];return o&&o[s]!=null?o[s]:null};
const has=(x,e)=>x.sj.some(s=>mk(x,e,s)!=null),sAvg=(x,e)=>avg(x.sj.map(s=>mk(x,e,s)).filter(v=>v!=null));
const prevKey=e=>{if(e.endsWith('Mean')){const t=+e[5]-1;return t>0?kk(t-1,3):null}const i=EX.indexOf(e);return i>0?EX[i-1]:null};
const SL=e=>e.replace('Term ','T').replace(' · ',' ').replace('Opener','Op').replace('Mid-term','Mid').replace('End-term','End'),cellv=v=>v==null?'-':Number.isInteger(v)?v:f1(v),KES=v=>'KES '+Math.round(v).toLocaleString();
const S={role:'parent',school:'NBVA School',u:null,sf:{},cp:false,fail:0,lock:0,fs:null,rv:null,bc:'all',bm:'all',bv:false,ay:'2026',term:'Term 3',aq:'',rm:null,fc:'',pa:null,pk:null,pmode:'in',addk:0,f:{},perr:'',t:0,asg:0,ex:8,locked:{},pt:2,px:3,rt:2,pc:0,pi:'all',pm:2,q:'',sel:null,fq:'',note:''};
const $=id=>document.getElementById(id);
const bars=(it,mx)=>it.map(([l,v,t])=>`<div class="bar"><i title="${l}">${l}</i><div><u style="width:${Math.min(100,v/mx*100)}%"></u></div><em>${t!=null?t:f1(v)}</em></div>`).join('');

// ---------- shell ----------
const ROLES=[['parent','Parent portal'],['teacher','Teacher'],['accounts','Accounts'],['principal','Principal & deputies'],['admin','Admin']];
function shell(){$('sn').textContent=S.school;$('nav').innerHTML=ROLES.map(([k,l])=>`<button class="${S.role==k?'on':''}" onclick="S.role='${k}';S.note='';S.perr='';S.pinfo='';draw()">${l}</button>`).join('');
$('who').textContent={teacher:ok('teacher')?S.u.name+' · Teacher dashboard':'Teacher · Sign in',accounts:ok('accounts')?S.u.name+' · Accounts dashboard':'Accounts · Sign in',principal:ok('principal')?S.u.name+' · '+RL[S.u.role]+' · Read-only oversight':'Principal and deputies · Sign in',parent:S.pa?'Parent portal · '+S.pa.name:'Parent portal · Sign in',admin:ok('admin')?S.u.name+' · School setup':'Admin · Sign in'}[S.role]}
function draw(){shell();$('app').innerHTML={teacher:teacher,accounts:accounts,principal:principal,parent:parentView,admin:admin}[S.role]();if(S.role=='accounts'&&ok('accounts'))feeRows();if(S.role=='admin'&&ok('admin'))adminRows()}

// ---------- staff sign-in ----------
const STAFF=[];
const AREA={teacher:['teacher'],accounts:['accounts'],principal:['principal','deputy'],admin:['admin']},RL={teacher:'Teacher',accounts:'Accounts',principal:'Principal',deputy:'Deputy principal',admin:'Admin'},AT={teacher:'Teacher',accounts:'Accounts',principal:'Principal and deputies',admin:'Admin'},PFX={teacher:'TCH',accounts:'ACC',principal:'PRN',deputy:'DEP',admin:'ADM'};
const ok=a=>!!S.u&&AREA[a].includes(S.u.role);
function gate(a){if(ok(a))return '';return `<div class="p" style="max-width:440px;margin:30px auto"><h2>${AT[a]} sign in</h2>${S.u?`<p class="mu" style="margin-top:0">You are signed in as ${esc(S.u.name)} (${RL[S.u.role]}). This area needs a different login.</p>`:`<p class="mu" style="margin-top:0">Sign in with your ${a=='admin'?'':'full name, '}staff code and password.</p>`}${er()}
${a=='admin'?'':`<p><input id="sn_n" placeholder="Full name" style="width:100%" value="${esc(S.sf.n||'')}" autocomplete="off"></p>`}<p><input id="sn_c" placeholder="Staff code" style="width:100%" value="${esc(S.sf.c||'')}" autocomplete="off"></p><p><input id="sn_p" type="password" placeholder="Password" style="width:100%" autocomplete="current-password" onkeydown="if(event.key=='Enter')staffIn('${a}')"></p>
<button class="b" onclick="staffIn('${a}')">Sign in</button><p class="mu" style="font-size:13px;margin-bottom:0">Staff accounts are created by the school admin. If you forgot your password, ask the admin to reset it.</p></div>`}
function staffIn(a){const n=a=='admin'?'':V('sn_n'),c=V('sn_c').toUpperCase(),pw=$('sn_p').value;S.sf={n,c};
if(Date.now()<S.lock){S.perr='Too many attempts. Wait 30 seconds and try again.';return draw()}
const u=STAFF.find(x=>x.code==c&&(a=='admin'||x.name.toLowerCase()==n.toLowerCase())&&x.pw==pw&&AREA[a].includes(x.role));
if(u){S.u=u;S.sf={};S.perr='';S.note='';S.fail=0}else{S.perr=a=='admin'?'The staff code or password is not correct. Check both and try again.':'The name, staff code or password is not correct for this area. Check all three and try again.';if(++S.fail>=5){S.fail=0;S.lock=Date.now()+3e4;S.perr='Too many attempts. Wait 30 seconds and try again.'}}draw()}
function bar(){const u=S.u;return `<div class="row" style="justify-content:space-between;align-items:center"><span class="mu">Signed in as ${esc(u.name)} · ${RL[u.role]} · ${esc(u.code)}</span><span><button class="b" style="${GH}" onclick="S.cp=!S.cp;draw()">Change password</button> <button class="b" onclick="doSignOut()">Sign out</button></span></div>${S.cp?`<div class="p" style="max-width:440px"><h3 style="font-size:16px;margin-bottom:8px">Change password</h3><div class="row"><input id="cp_o" type="password" placeholder="Current password" autocomplete="current-password"><input id="cp_n" type="password" placeholder="New password (8+ characters)" autocomplete="new-password"><input id="cp_c" type="password" placeholder="Confirm new password" autocomplete="new-password"></div><p id="cp_e" class="bd" role="alert" style="margin:8px 0"></p><button class="b" onclick="changePw()">Save password</button></div>`:''}`}
function changePw(){const u=S.u,o=$('cp_o').value,n=$('cp_n').value,e=m=>{$('cp_e').textContent=m};if(o!=u.pw)return e('Your current password is not correct.');if(n.length<8)return e('Choose a password with at least 8 characters.');if(n!=$('cp_c').value)return e('The two new passwords do not match.');if(n==o)return e('Choose a password different from the current one.');u.pw=n;S.cp=false;S.perr='';S.note='Password changed.';draw()}
function teacherOld(){const g=gate('teacher');if(g)return g;const ti=TEACH.findIndex(t=>t.n.toLowerCase()==S.u.name.toLowerCase());
if(ti<0||!TEACH[ti].a.length)return bar()+'<div class="p"><p class="mu" style="margin:0">You have no classes assigned yet. Ask the admin to assign you a class and subject.</p></div>';S.t=ti;if(S.asg>=TEACH[ti].a.length)S.asg=0;return bar()+teacherView()}
function accounts(){return gate('accounts')||bar()+accountsView()}
function principal(){return gate('principal')||bar()+attToday()+principalView()}
function admin(){return gate('admin')||bar()+adminView()}
function staffPanelBase(){const ro=Object.keys(RL).map(v=>`<option value="${v}">${RL[v]}</option>`).join('');
return `<div class="p"><h2>Staff accounts</h2><p class="mu" style="margin-top:0">Teachers, accounts staff, the principal and deputies sign in with their full name, staff code and password. Admins sign in with their staff code and password only. Teachers see only their own classes. Adding someone gives you a printable slip with their code and password to hand over.</p>
<div class="sc"><table><tr><th>Name</th><th>Role</th><th>Staff code</th><th></th></tr>${STAFF.map((u,i)=>`<tr><td>${esc(u.name)}${u===S.u?' <span class="t">You</span>':''}</td><td>${RL[u.role]}</td><td>${esc(u.code)}</td><td><button class="b" style="${GH}" onclick="resetStaff(${i})">Reset password</button> ${u===S.u?'':`<button class="b" style="${GH}" onclick="delStaff(${i})">Remove</button>`}</td></tr>`).join('')}</table></div>
<div class="row" style="margin:12px 0 0"><input id="st_n" placeholder="Full name"><select id="st_r" aria-label="Role">${ro}</select><input id="st_c" placeholder="Staff code (optional)" style="width:150px" autocomplete="off"><input id="st_p" placeholder="Password (blank = generate one)" autocomplete="off"><button class="b" onclick="addStaff()">Add staff</button></div><p id="st_e" class="bd" role="alert" style="margin:8px 0 0"></p></div>`}
function addStaff(){const n=V('st_n').replace(/[<>&"]/g,''),r=$('st_r').value,pw=$('st_p').value,e=m=>{$('st_e').textContent=m};let c=V('st_c').toUpperCase();
if(!n)return e('Enter the full name.');
if(!c){let i=STAFF.filter(x=>x.role==r).length+1;do{c=PFX[r]+String(i++).padStart(3,'0')}while(STAFF.some(x=>x.code==c))}
if(!/^[A-Z0-9-]{3,12}$/.test(c))return e('The staff code must be 3 to 12 letters, numbers or hyphens.');
if(STAFF.some(x=>x.code==c))return e('That staff code is already in use.');
if(pw.length<8)return e('The starting password needs at least 8 characters.');
STAFF.push({code:c,name:n,role:r,pw});if(r=='teacher'&&!TEACH.some(t=>t.n.toLowerCase()==n.toLowerCase()))TEACH.push({n,a:[]});
S.perr='';S.note=`Added ${esc(n)} (${RL[r]}). Staff code ${c}.${r=='teacher'?' Assign their classes under Teachers and assignments.':''}`;draw()}
function resetStaff(i){const u=STAFF[i],ch='abcdefghjkmnpqrstuvwxyz23456789';let t='';for(let k=0;k<8;k++)t+=ch[Math.floor(Math.random()*ch.length)];t+='A1';u.pw=t;S.perr='';S.note=`New password for ${esc(u.name)} (${esc(u.code)}): ${t}. Share it privately. They can change it after signing in.`;draw()}
function delStaff(i){const u=STAFF[i];if(u.role=='admin'&&STAFF.filter(x=>x.role=='admin').length<2){S.note='';S.perr='You cannot remove the last admin account.';return draw()}STAFF.splice(i,1);S.perr='';S.note=`Removed ${esc(u.name)}.`;draw()}
// ---------- teacher ----------
function teacherView(){const T=TEACH[S.t],[c,s]=T.a[S.asg],list=ST.filter(x=>x.cls==c&&x.sj.includes(s)),e=EX[S.ex],tm=Math.floor(S.ex/3),xi=S.ex%3,k=c+s+S.ex,lk=S.locked[k],tk=kk(tm,3);
const v=list.map(x=>x.m[e][s]).filter(v=>v!=null),tv=list.map(x=>mk(x,tk,s)).filter(v=>v!=null),sel=(a,cur,fn)=>`<select onchange="${fn}">${a.map((n,i)=>`<option value="${i}" ${i==cur?'selected':''}>${n}</option>`).join('')}</select>`;
return `${S.note?`<div class="msg">${S.note}</div>`:''}${er()}<div class="row"><select onchange="S.asg=+this.value;draw()">${T.a.map((a,i)=>`<option value="${i}" ${i==S.asg?'selected':''}>${a[0]} · ${a[1]}</option>`).join('')}</select>
${sel(TERMS,tm,'S.ex=+this.value*3+S.ex%3;draw()')}${sel(EXN,xi,'S.ex=Math.floor(S.ex/3)*3+ +this.value;draw()')}</div>
<div class="row"><div class="k"><b id="tm">${v.length?f1(avg(v)):'-'}</b><span>${EXN[xi]} class mean</span></div><div class="k"><b id="ttm">${tv.length?f1(avg(tv)):'-'}</b><span>${TERMS[tm]} class mean</span></div><div class="k"><b id="th">${v.length?Math.max(...v):'-'}</b><span>Highest</span></div><div class="k"><b id="tl">${v.length?Math.min(...v):'-'}</b><span>Lowest</span></div><div class="k"><b>${list.length}</b><span>Students</span></div></div>
<div class="p"><h2>Enter marks: ${c}, ${s}, ${TERMS[tm]} ${EXN[xi]} ${lk?'<span class="t">Submitted and locked</span>':''}</h2>
<div class="sc"><table><tr><th>Adm no.</th><th>Student</th><th>Score (0-100)</th><th>Level</th><th>Change vs previous exam</th><th class="r">${TERMS[tm]} mean</th></tr>
${list.map(x=>{const cur=x.m[e][s],p=S.ex?x.m[EX[S.ex-1]][s]:null,d=p==null||cur==null?null:cur-p,m=mk(x,tk,s);return `<tr><td>${x.adm}</td><td>${x.name}</td><td><input class="n" type="number" min="0" max="100" value="${cur==null?'':cur}" ${lk?'disabled':''} oninput="setMark(${x.id},'${s}',this)"></td><td id="g${x.id}">${cur==null?'-':lvt(cur)}</td><td class="${d>0?'ok':d<0?'bd':'mu'}">${d==null?'-':(d>0?'+':'')+d}</td><td class="r" id="tn${x.id}">${m==null?'-':f1(m)}</td></tr>`}).join('')}</table></div>${legend()}
<p style="margin:14px 0 0"><button class="b" onclick="toggleLock('${c}','${s}',${S.ex})">${lk?'Unlock for editing':'Submit marks for approval'}</button> <span class="mu">The term mean is the average of the exams entered so far. Leave a score blank if the student did not sit the exam.</span></p></div>${teachPanels(T)}`}
function setMarkLocal(id,s,el){const e=EX[S.ex],raw=el.value.trim(),v=raw===''?null:Math.max(0,Math.min(100,Math.round(+raw||0)));ST[id].m[e][s]=v;$('g'+id).innerHTML=v==null?'-':lvt(v);
const [c,sb]=TEACH[S.t].a[S.asg],l=ST.filter(x=>x.cls==c&&x.sj.includes(sb)),a=l.map(x=>x.m[e][sb]).filter(n=>n!=null),tk=kk(Math.floor(S.ex/3),3),tv=[];
l.forEach(x=>{const m=mk(x,tk,sb);$('tn'+x.id).textContent=m==null?'-':f1(m);if(m!=null)tv.push(m)});
$('tm').textContent=a.length?f1(avg(a)):'-';$('ttm').textContent=tv.length?f1(avg(tv)):'-';$('th').textContent=a.length?Math.max(...a):'-';$('tl').textContent=a.length?Math.min(...a):'-'}

// ---------- online lessons and assignments ----------
let LID=0,AID=0;const LESSONS=[],ASG=[],OKX=['pdf','docx','pptx','xlsx','txt','png','jpg','jpeg','zip','csv','md'];
const lst=l=>{const n=Date.now(),t=+new Date(l.start),e=t+l.dur*6e4;if(l.st=='live')return['Live now','ok',1];if(l.st=='ended'||n>e)return['Ended','',0];if(n>=t-9e5)return['Starting soon','wn',1];return['Upcoming','',0]};
const fw=d=>new Date(d).toLocaleString(undefined,{weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}),fday=d=>new Date(d+'T12:00').toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'}),fsz=n=>n<1024?n+' B':n<1048576?Math.round(n/1024)+' KB':(n/1048576).toFixed(1)+' MB';
function teachPanels(T){const me=a=>a.filter(y=>y.teacher==T.n),opts=T.a.map((a,i)=>`<option value="${i}">${a[0]} · ${a[1]}</option>`).join(''),ls=me(LESSONS).sort((a,b)=>new Date(a.start)-new Date(b.start)),as=me(ASG).sort((a,b)=>a.due<b.due?-1:1),td=new Date().toISOString().slice(0,10);
return `<div class="p"><h2>Online lessons</h2><p class="mu" style="margin-top:0">Schedule a lesson and paste your meeting link (Google Meet, Zoom or Teams). Learners join from the Parent portal. The video itself runs in your meeting app.</p>
<div class="row" style="margin-bottom:8px"><select id="lz_s" aria-label="Class and subject">${opts}</select><input id="lz_t" placeholder="Lesson title" style="flex:1 1 200px"><input id="lz_d" type="date" value="${td}" aria-label="Date"><input id="lz_tm" type="time" value="09:00" aria-label="Start time"><input id="lz_du" class="n" type="number" min="10" max="240" value="40" aria-label="Duration in minutes"><span class="mu" style="align-self:center">min</span></div>
<div class="row" style="margin-bottom:6px"><input id="lz_l" placeholder="Meeting link, https://..." style="flex:1 1 320px"><button class="b" onclick="postLesson()">Schedule lesson</button></div><p id="lz_e" class="bd" role="alert" style="margin:0 0 8px"></p>
${ls.length?`<div class="sc"><table><tr><th>When</th><th>Class</th><th>Lesson</th><th>Status</th><th></th></tr>${ls.map(l=>{const q=lst(l);return `<tr><td>${fw(l.start)} · ${l.dur} min</td><td>${l.cls} · ${l.subj}</td><td style="white-space:normal">${esc(l.title)}</td><td><span class="t ${q[1]}">${q[0]}</span></td><td>${l.st=='live'?`<a class="b" href="${esc(l.link)}" target="_blank" rel="noopener noreferrer">Open link</a> <button class="b" style="${GH}" onclick="endLesson(${l.id})">End lesson</button>`:q[0]!='Ended'?`<button class="b" onclick="startLesson(${l.id})">Start lesson</button> `:''}<button class="b" style="${GH}" onclick="delLesson(${l.id})">Remove</button></td></tr>`}).join('')}</table></div>`:'<p class="mu" style="margin:0">No lessons scheduled yet.</p>'}</div>
<div class="p"><h2>Assignments</h2><p class="mu" style="margin-top:0">Post work for a class. Learners and parents can read the instructions and download your file from the Parent portal.</p>
<div class="row" style="margin-bottom:8px"><select id="as_s" aria-label="Class and subject">${opts}</select><input id="as_t" placeholder="Assignment title" style="flex:1 1 200px"><label class="mu">Due <input id="as_d" type="date" value="${td}"></label></div>
<p style="margin:0 0 8px"><textarea id="as_i" rows="3" placeholder="Instructions for learners" style="width:100%;font:inherit;color:var(--tx);background:var(--bg);border:1px solid var(--bd);border-radius:7px;padding:7px 10px"></textarea></p>
<div class="row" style="align-items:center;margin-bottom:6px"><label class="mu">Attach a file (optional) <input id="as_f" type="file" accept=".pdf,.docx,.pptx,.xlsx,.txt,.png,.jpg,.jpeg,.zip,.csv,.md"></label><button class="b" onclick="postAsg()">Post assignment</button></div><p id="as_e" class="bd" role="alert" style="margin:0 0 8px"></p>
${as.length?`<div class="sc"><table><tr><th>Due</th><th>Class</th><th>Assignment</th><th>File</th><th></th></tr>${as.map(a=>`<tr><td>${fday(a.due)}</td><td>${a.cls} · ${a.subj}</td><td style="white-space:normal">${esc(a.title)}</td><td>${a.file?esc(a.file.name)+' <span class="mu">'+fsz(a.file.size)+'</span>':'<span class="mu">None</span>'}</td><td><button class="b" style="${GH}" onclick="delAsg(${a.id})">Remove</button></td></tr>`).join('')}</table></div>`:'<p class="mu" style="margin:0">No assignments posted yet.</p>'}</div>`}
function postLesson(){const T=TEACH[S.t],[c,sb]=T.a[+$('lz_s').value],t=V('lz_t').replace(/[<>&"]/g,''),d=$('lz_d').value,tm=$('lz_tm').value,du=Math.round(+$('lz_du').value),l=V('lz_l'),e=m=>{$('lz_e').textContent=m};
if(!t)return e('Enter the lesson title.');if(!d||!tm)return e('Pick the date and start time.');if(!(du>=10&&du<=240))return e('Duration must be between 10 and 240 minutes.');if(!/^https:\/\/[^\s]+$/.test(l))return e('Paste the meeting link starting with https://');
LESSONS.push({id:++LID,cls:c,subj:sb,title:t,teacher:T.n,start:new Date(d+'T'+tm).toISOString(),dur:du,link:l,st:'sched'});S.perr='';S.note=`Scheduled "${t}" for ${c} ${sb}.`;draw()}
function startLesson(id){const l=LESSONS.find(y=>y.id==id);l.st='live';S.note=`"${esc(l.title)}" is live. Learners can now join from the Parent portal.`;S.perr='';draw();try{window.open(l.link,'_blank','noopener')}catch(e){}}
function endLesson(id){LESSONS.find(y=>y.id==id).st='ended';S.note='Lesson ended.';draw()}
function delLesson(id){LESSONS.splice(LESSONS.findIndex(y=>y.id==id),1);S.note='Lesson removed.';draw()}
function postAsg(){const T=TEACH[S.t],[c,sb]=T.a[+$('as_s').value],t=V('as_t').replace(/[<>&"]/g,''),nt=$('as_i').value.trim(),d=$('as_d').value,f=($('as_f').files||[])[0],e=m=>{$('as_e').textContent=m};
if(!t)return e('Enter the assignment title.');if(!d)return e('Pick the due date.');if(!nt&&!f)return e('Add instructions or attach a file.');
if(f){if(!OKX.includes(f.name.split('.').pop().toLowerCase()))return e('That file type is not supported. Use PDF, Word, PowerPoint, Excel, text, image, CSV or ZIP.');if(f.size>5242880)return e('The file is over 5 MB. Choose a smaller file.')}
ASG.push({id:++AID,cls:c,subj:sb,title:t,notes:nt.replace(/[<>&"]/g,''),due:d,teacher:T.n,file:f||null});S.perr='';S.note=`Posted "${t}" for ${c} ${sb}.`;draw()}
function delAsg(id){ASG.splice(ASG.findIndex(y=>y.id==id),1);S.note='Assignment removed.';draw()}
async function dlAsg(id){const a=ASG.find(y=>y.id==id);if(!a||!a.file)return;S.note='';
try{const d=window.claude?await window.claude.use('downloads'):null;if(!d){S.perr='Downloads are not available in this view. Open the page in claude.ai to download files.';draw();return}await d.save({filename:a.file.name,data:a.file})}catch(e){if(e&&e.code=='declined')return;S.perr='The file could not be saved. '+(e&&e.message||'');draw()}}
function learnPanels(x){const ok=a=>a.filter(y=>y.cls==x.cls&&x.sj.includes(y.subj)),L=ok(LESSONS),up=L.filter(l=>lst(l)[0]!='Ended').sort((a,b)=>new Date(a.start)-new Date(b.start)),en=L.filter(l=>lst(l)[0]=='Ended').sort((a,b)=>new Date(b.start)-new Date(a.start)).slice(0,2),A=ok(ASG).sort((a,b)=>a.due<b.due?-1:1);
const row='border-bottom:1px solid var(--bd);padding:10px 0';
return `<div class="g2" style="margin-bottom:16px"><div class="p"><h2>Online classes</h2>${[...up,...en].slice(0,6).map(l=>{const q=lst(l);return `<div style="${row}"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${esc(l.title)}</b><span class="t ${q[1]}">${q[0]}</span></div><div class="mu">${l.subj} · ${esc(l.teacher)} · ${fw(l.start)} · ${l.dur} min</div>${q[2]?`<p style="margin:8px 0 0"><a class="b" href="${esc(l.link)}" target="_blank" rel="noopener noreferrer">Join class</a></p>`:q[0]=='Upcoming'?'<div class="mu" style="font-size:13px;margin-top:4px">The join button appears 15 minutes before the lesson.</div>':''}</div>`}).join('')||'<p class="mu" style="margin:0">No online classes have been scheduled for this class yet.</p>'}</div>
<div class="p"><h2>Assignments</h2>${A.map(a=>`<div style="${row}"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${esc(a.title)}</b><span class="t wn">Due ${fday(a.due)}</span></div><div class="mu">${a.subj} · ${esc(a.teacher)}</div>${a.notes?`<p style="margin:6px 0 0">${esc(a.notes)}</p>`:''}${a.file?`<p style="margin:8px 0 0"><button class="b" onclick="dlAsg(${a.id})">Download ${esc(a.file.name)}</button> <span class="mu">${fsz(a.file.size)}</span></p>`:''}</div>`).join('')||'<p class="mu" style="margin:0">No assignments have been posted for this class yet.</p>'}</div></div>`}
// ---------- accounts ----------
const GH='background:none;color:var(--mu);border:1px solid var(--bd)';
function stmt(x){const ks=Object.keys(x.ch).map(Number).sort((a,b)=>a-b);return ks.length?`<div class="sc"><table><tr><th>Fee item</th><th>Category</th><th class="r">Charged</th><th class="r">Paid</th><th class="r">Balance</th></tr>${ks.map(k=>{const b=x.ch[k]-(x.py[k]||0);return `<tr><td>${FI[k].n}</td><td class="mu">${CAT[FI[k].c]}</td><td class="r">${KES(x.ch[k])}</td><td class="r">${KES(x.py[k]||0)}</td><td class="r ${b>0?'bd':''}">${KES(b)}</td></tr>`}).join('')}<tr><th>Total</th><th></th><th class="r">${KES(billed(x))}</th><th class="r">${KES(paidOf(x))}</th><th class="r">${KES(bal(x))}</th></tr></table></div>`:'<p class="mu" style="margin:0">No fees have been billed yet.</p>'}
function accountsView(){const tb=ST.reduce((a,x)=>a+billed(x),0),tp=ST.reduce((a,x)=>a+paidOf(x),0),op=a=>a.map((c,i)=>`<option value="${i}">${c}</option>`).join(''),fo=FI.map(f=>f.n);
const cats=CAT.map((c,ci)=>{let b=0,p=0;ST.forEach(x=>Object.keys(x.ch).forEach(k=>{if(FI[k].c==ci){b+=x.ch[k];p+=x.py[k]||0}}));return[c,b,p]}).filter(r=>r[1]>0);
const sp=x=>{const outs=Object.keys(x.ch).filter(k=>x.ch[k]>(x.py[k]||0));return `<div class="p"><div class="row" style="justify-content:space-between;align-items:center;margin-bottom:8px"><h2 style="margin:0">${x.name} <span class="mu" style="font:14px system-ui">${x.adm} · ${x.cls}</span></h2><button class="b" style="${GH}" onclick="S.fs=null;S.rv=null;S.note='';S.perr='';draw()">Close</button></div>${stmt(x)}
<h3 style="font-size:16px;margin:14px 0 6px">Payments received</h3>${x.rc.length?`<div class="sc"><table><tr><th>Date</th><th>Receipt no.</th><th>Method</th><th>Reference</th><th class="r">Amount</th><th></th></tr>${[...x.rc].reverse().map(r=>`<tr><td>${fd(r.d)}</td><td>${r.no}</td><td>${r.m}</td><td>${esc(r.ref||'-')}</td><td class="r">${KES(r.a)}</td><td><button class="b" onclick="S.rv='${r.no}';S.bv=false;S.note='';S.perr='';draw()">Print receipt</button></td></tr>`).join('')}</table></div>`:'<p class="mu" style="margin:0">No payments recorded yet.</p>'}
<div class="g2" style="margin-top:14px"><div><h3 style="font-size:16px;margin-bottom:8px">Add charges</h3>${picker('c')}<p style="margin:10px 0 0"><button class="b" onclick="addCharge()">Add selected charges</button></p></div>
<div><h3 style="font-size:16px;margin-bottom:8px">Record a payment</h3>${bal(x)>0?`<div class="row"><select id="pi" aria-label="Pay towards"><option value="-1">Any outstanding fee (in order listed)</option>${outs.map(k=>`<option value="${k}">${FI[k].n} · ${KES(x.ch[k]-(x.py[k]||0))} due</option>`).join('')}</select><input id="pa" class="n" type="number" min="1" placeholder="Amount" aria-label="Amount paid"><select id="pm" aria-label="Method"><option>Cash</option><option>M-Pesa</option><option>Bank</option></select><input id="pr" placeholder="Reference" style="width:120px" aria-label="Reference"><button class="b" onclick="recPay()">Record</button></div>`:'<p class="mu" style="margin:0">No balance to pay.</p>'}</div></div></div>`};
return `${S.note?`<div class="msg">${S.note}</div>`:''}${er()}
<div class="row"><div class="k"><b>${KES(tb)}</b><span>Billed</span></div><div class="k"><b>${KES(tp)}</b><span>Collected (${tb?Math.round(tp/tb*100):0}%)</span></div><div class="k"><b>${KES(tb-tp)}</b><span>Outstanding</span></div><div class="k"><b>${ST.filter(x=>bal(x)>0).length}</b><span>Students with a balance</span></div></div>
${S.fs!=null?sp(ST[S.fs]):''}${rcptPanel()}
<div class="p"><h2>Student fee accounts: ${S.term} ${S.ay}</h2><p style="margin-top:0"><input id="fq" placeholder="Search name or admission no." value="${esc(S.fq)}" oninput="S.fq=this.value;feeRows()"> <select aria-label="Class" onchange="S.fc=this.value;feeRows()"><option value="">All classes</option>${CLS.map(c=>`<option ${S.fc==c?'selected':''}>${c}</option>`).join('')}</select></p><div class="sc"><table><thead><tr><th>Adm no.</th><th>Student</th><th>Class</th><th class="r">Billed</th><th class="r">Paid</th><th class="r">Balance</th><th>Status</th><th></th></tr></thead><tbody id="fb"></tbody></table></div></div>
${bulkPanel()}
<div class="g2" style="margin-bottom:16px"><div class="p"><h2>Collection by category</h2>${cats.length?`<div class="sc"><table><tr><th>Category</th><th class="r">Billed</th><th class="r">Collected</th><th class="r">Outstanding</th></tr>${cats.map(r=>`<tr><td>${r[0]}</td><td class="r">${KES(r[1])}</td><td class="r">${KES(r[2])}</td><td class="r ${r[1]>r[2]?'bd':''}">${KES(r[1]-r[2])}</td></tr>`).join('')}</table></div>`:'<p class="mu" style="margin:0">Nothing has been billed yet.</p>'}</div>
<div class="p"><h2>Bill a class</h2><p class="mu" style="margin-top:0">Tick the fee items to charge and set the amounts. Each is added to every student in the class. Students who already have an item are skipped.</p><p style="margin:0 0 8px"><select id="bc" aria-label="Class"><option>All</option>${CLS.map(c=>`<option>${c}</option>`).join('')}</select></p>${picker('b')}<p style="margin:10px 0 0"><button class="b" onclick="billClass()">Bill selected items</button></p></div></div>
<div class="p"><h2>Fee items and default amounts</h2><p class="mu" style="margin-top:0">Tick the fee items your school uses. Only ticked items appear when you bill.</p><div class="sc" style="max-height:340px;overflow:auto"><table><tr><th>In use</th><th>Fee item</th><th>Category</th><th>Default amount (KES)</th></tr>${FI.map(f=>`<tr><td><input type="checkbox" ${f.on?'checked':''} aria-label="Use ${f.n}" onchange="setOn(${f.id},this.checked)"></td><td>${f.n}</td><td class="mu">${CAT[f.c]}</td><td><input class="n" style="width:110px" type="number" min="0" value="${f.a}" aria-label="Default amount for ${f.n}" onchange="setAmt(${f.id},this.value)"></td></tr>`).join('')}</table></div>
<div class="row" style="margin:12px 0 0"><input id="fn2" placeholder="New fee item name"><select id="fc2" aria-label="Category">${op(CAT)}</select><input id="fa2" class="n" type="number" min="0" placeholder="Amount"><button class="b" onclick="addItem()">Add fee item</button></div></div>`}
function feeRows(){const q=S.fq.toLowerCase();$('fb').innerHTML=ST.filter(x=>(x.name+x.adm).toLowerCase().includes(q)&&(!S.fc||x.cls==S.fc)).map(x=>{const f=fst(x);return `<tr><td>${x.adm}</td><td>${x.name}</td><td>${x.cls}</td><td class="r">${KES(billed(x))}</td><td class="r">${KES(paidOf(x))}</td><td class="r ${bal(x)>0?'bd':''}">${KES(bal(x))}</td><td><span class="t ${f[1]}">${f[0]}</span></td><td><button class="b" onclick="S.fs=${x.id};S.rv=null;S.note='';S.perr='';draw()">Statement</button></td></tr>`}).join('')||'<tr><td colspan="8" class="mu">No students match that search.</td></tr>'}
function picker(p){const g=CAT.map((c,ci)=>{const it=FI.filter(f=>f.on&&f.c==ci);return it.length?`<div style="margin-bottom:8px"><label><input type="checkbox" aria-label="Select all ${c}" onchange="document.querySelectorAll('.${p}k[data-c=&quot;${ci}&quot;]').forEach(e=>e.checked=this.checked)"> <b>${c}</b></label>${it.map(f=>`<div style="display:flex;align-items:center;gap:8px;margin:3px 0 0 22px"><label style="flex:1"><input type="checkbox" class="${p}k" data-c="${ci}" value="${f.id}"> ${f.n}</label><input class="n" style="width:90px" type="number" min="0" id="${p}a${f.id}" value="${f.a}" aria-label="Amount for ${f.n}"></div>`).join('')}</div>`:''}).join('');
return `<div style="max-height:300px;overflow:auto;border:1px solid var(--bd);border-radius:8px;padding:10px">${g||'<p class="mu" style="margin:0">No fee items are in use. Tick items under Fee items and default amounts.</p>'}</div>`}
const chosen=p=>[...document.querySelectorAll('.'+p+'k:checked')].map(e=>({k:+e.value,a:Math.round(+$(p+'a'+e.value).value)}));
function setOn(k,v){FI[k].on=v;draw()}
function addCharge(){const x=ST[S.fs],c=chosen('c');S.note='';S.perr=!c.length?'Tick at least one fee item.':c.some(i=>!(i.a>0))?'Enter an amount above 0 for each ticked item.':'';
if(!S.perr){c.forEach(i=>x.ch[i.k]=(x.ch[i.k]||0)+i.a);S.note=`Charged ${c.length} fee item${c.length==1?'':'s'} (${KES(c.reduce((t,i)=>t+i.a,0))}) to ${x.name}.`}draw()}
function recPay(){const x=ST[S.fs],k=+$('pi').value,a=Math.round(+$('pa').value),m=$('pm').value,rf=V('pr'),mx=k<0?bal(x):(x.ch[k]||0)-(x.py[k]||0);S.note='';
S.perr=!(a>0)?'Enter an amount above 0.':a>mx?`That is more than the balance of ${KES(mx)}.`:(m!='Cash'&&!rf)?'Enter the payment reference.':'';
if(!S.perr){let r=a;const al={};(k<0?Object.keys(x.ch).map(Number).sort((p,q)=>p-q):[k]).forEach(j=>{const d=Math.min(r,(x.ch[j]||0)-(x.py[j]||0));if(d>0){x.py[j]=(x.py[j]||0)+d;al[j]=d;r-=d}});const no='RCT-'+String(++RN).padStart(5,'0');x.rc.push({no,d:new Date().toISOString(),m,ref:rf,a,it:al,bl:bal(x)});S.rv=no;S.bv=false;S.note=`Recorded ${KES(a)} (${m}${rf?', '+esc(rf):''}) for ${x.name}. Receipt ${no} issued. It is shown below, ready to print.`}draw()}
function rcptHtml(x,r){const ks=Object.keys(r.it).map(Number).sort((a,b)=>a-b),cell=(l,v)=>`<div><span class="mu">${l}</span><br><b>${v}</b></div>`;
return `<div class="rcpt" style="border:1px solid var(--bd);border-radius:10px;padding:18px;margin-bottom:16px;background:var(--cd)">
<img class="wm" src="watermark.png" alt="" aria-hidden="true">
<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;border-bottom:2px solid var(--ac);padding-bottom:10px;margin-bottom:12px"><div style="display:flex;gap:12px;align-items:center"><img class="logo" src="logo.jpg" alt="" style="width:64px;height:64px"><div><h2 style="font-size:20px;margin:0">${esc(S.school)}</h2><div class="mu">Fee payment receipt</div></div></div><div style="text-align:right"><b style="font-size:16px">${r.no}</b><div class="mu">${fd(r.d)}</div></div></div>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px 16px;margin-bottom:12px">${cell('Received for',x.name)}${cell('Adm no.',x.adm)}${cell('Class',x.cls)}${cell('Payment method',r.m)}${cell('Reference',esc(r.ref||'-'))}${cell('Term',esc(S.term+' '+S.ay))}</div>
<div class="sc"><table><tr><th>Fee item</th><th>Category</th><th class="r">Amount paid</th></tr>${ks.map(k=>`<tr><td>${FI[k].n}</td><td class="mu">${CAT[FI[k].c]}</td><td class="r">${KES(r.it[k])}</td></tr>`).join('')}<tr><th>Total received</th><th></th><th class="r">${KES(r.a)}</th></tr></table></div>
<p style="margin:10px 0 4px"><b>Amount in words:</b> ${words(r.a)} Kenya Shillings only</p>
<p style="margin:4px 0"><b>Balance after this payment:</b> ${KES(Math.max(r.bl,0))}</p>
<div style="display:flex;gap:24px;margin-top:26px;flex-wrap:wrap"><div style="flex:1;min-width:160px;border-top:1px solid var(--tx);padding-top:4px;font-size:13px">Received by (Accounts)</div><div style="flex:1;min-width:160px;border-top:1px solid var(--tx);padding-top:4px;font-size:13px">Official stamp</div></div>
<div class="mu" style="font-size:12px;margin-top:8px">Fees paid are not refundable. Keep this receipt for your records.</div></div>`}
function rcptPanel(){const x=S.fs==null?null:ST[S.fs],r=x&&S.rv?x.rc.find(y=>y.no==S.rv):null;if(!r)return '';
return `<div class="p pw" id="rw"><div class="row np" style="align-items:center"><button class="b" onclick="printSlips()">Print receipt</button><button class="b" style="${GH}" onclick="S.rv=null;draw()">Close preview</button><span class="mu">In the print window, choose Save as PDF to keep a copy.</span></div>${rcptHtml(x,r)}</div>`}
function bulkPanel(){const c=S.bc,md=S.bm,td=new Date().toDateString(),l=ST.filter(x=>c=='all'||x.cls==CLS[c]),
rs=l.flatMap(x=>{let a=x.rc;if(md=='last')a=a.slice(-1);else if(md=='today')a=a.filter(r=>new Date(r.d).toDateString()==td);return a.map(r=>[x,r])}),
ch=(a,cur,fn)=>`<select onchange="${fn}">${a.map(([v,t])=>`<option value="${v}" ${v==cur?'selected':''}>${t}</option>`).join('')}</select>`,n=`${rs.length} receipt${rs.length==1?'':'s'}`;
const ctl=`<div class="p"><h2>Print receipts for a class</h2><div class="row" style="align-items:center;margin:0">${ch([['all','All classes'],...CLS.map((t,i)=>[i,t])],c,"S.bc=this.value=='all'?'all':+this.value;S.bv=false;draw()")}${ch([['all','All payments'],['last','Latest payment per student'],['today','Payments received today']],md,"S.bm=this.value;S.bv=false;draw()")}<button class="b" onclick="S.bv=true;S.rv=null;S.note='';S.perr='';draw()">Preview ${n}</button></div></div>`;
if(!S.bv)return ctl;
return ctl+`<div class="p pw"><div class="row np" style="align-items:center"><button class="b" onclick="printSlips()" ${rs.length?'':'disabled'}>Print ${n}</button><button class="b" style="${GH}" onclick="S.bv=false;draw()">Close preview</button><span class="mu">Each receipt prints on its own page. Choose Save as PDF to keep a copy.</span></div>${rs.length?rs.map(([x,r])=>rcptHtml(x,r)).join(''):'<p class="mu np">No payments match this selection.</p>'}</div>`}
function billClass(){const c=$('bc').value,it=chosen('b'),l=ST.filter(x=>c=='All'||x.cls==c);S.note='';
S.perr=!it.length?'Tick at least one fee item.':it.some(i=>!(i.a>0))?'Enter an amount above 0 for each ticked item.':!l.length?'There are no students in that class.':'';
if(!S.perr){let n=0,sk=0;it.forEach(i=>l.forEach(x=>{if(x.ch[i.k]==null){x.ch[i.k]=i.a;n++}else sk++}));S.note=`Billed ${it.length} fee item${it.length==1?'':'s'} to ${l.length} student${l.length==1?'':'s'} in ${c=='All'?'all classes':c}: ${n} charge${n==1?'':'s'} added${sk?`, ${sk} skipped because the student already had that item`:''}.`}draw()}
function setAmt(k,v){FI[k].a=Math.max(0,Math.round(+v||0))}
function addItem(){const n=V('fn2').replace(/[<>&"]/g,''),c=+$('fc2').value,a=Math.round(+$('fa2').value||0);S.note='';S.perr=!n?'Enter the fee item name.':FI.some(f=>f.n.toLowerCase()==n.toLowerCase())?'That fee item already exists.':'';if(!S.perr){FI.push({id:FI.length,n,c,a,on:true});S.note=`Added the fee item ${n}.`}draw()}
// ---------- principal ----------
function principalView(){const e=kk(S.pt,S.px),en=ST.filter(x=>has(x,e)),all=en.flatMap(x=>x.sj.map(t=>mk(x,e,t)).filter(v=>v!=null)),XN=[...EXN,'Term mean'];
const sel=`<div class="row"><select aria-label="Term" onchange="S.pt=+this.value;draw()">${TERMS.map((t,i)=>`<option value="${i}" ${i==S.pt?'selected':''}>${t}</option>`).join('')}</select><select aria-label="Exam" onchange="S.px=+this.value;draw()">${XN.map((t,i)=>`<option value="${i}" ${i==S.px?'selected':''}>${t}</option>`).join('')}</select></div>`;
const mt=`<div class="p"><h2>School mean by term and exam</h2><div class="sc"><table><tr><th>Term</th>${XN.map(n=>`<th class="r">${n}</th>`).join('')}</tr>${TERMS.map((t,ti)=>`<tr><td>${t}</td>${[0,1,2,3].map(xi=>{const k=kk(ti,xi),v=ST.flatMap(x=>x.sj.map(q=>mk(x,k,q))).filter(v=>v!=null);return `<td class="r">${v.length?f1(avg(v)):'-'}</td>`}).join('')}</tr>`).join('')}</table></div></div>`;
const lk=`<div class="p"><h2>Student lookup</h2><input id="sq" style="width:min(100%,360px)" placeholder="Search name or admission no." value="${esc(S.q)}" oninput="S.q=this.value;look()"><div id="hits"></div><div id="prof"></div></div>`;
if(!en.length)return sel+`<div class="p"><p class="mu" style="margin:0">No marks have been entered for ${e} yet.</p></div>`+mt+lk;
const pr=en.filter(x=>sAvg(x,e)>=LV[1].min).length,col=ST.reduce((a,x)=>a+paidOf(x),0)/(ST.reduce((a,x)=>a+billed(x),0)||1),gd=LV.map(l=>[l.c,all.filter(v=>G(v)==l.c).length]),mxg=Math.max(...gd.map(x=>x[1]),1);
const rk=[...en].sort((a,b)=>sAvg(b,e)-sAvg(a,e)),pe=prevKey(e),imp=pe?en.filter(x=>has(x,pe)).map(x=>[x,sAvg(x,e)-sAvg(x,pe)]).sort((a,b)=>b[1]-a[1]).slice(0,3):[];
const cm=CLS.map(c=>{const l=en.filter(x=>x.cls==c);return l.length?[c,avg(l.map(x=>sAvg(x,e)))]:null}).filter(Boolean),sm=ALLS.map(t=>{const a=en.map(x=>mk(x,e,t)).filter(v=>v!=null);return a.length?[t,avg(a)]:null}).filter(Boolean);
const li=(x,extra)=>`<div class="bar" style="justify-content:space-between"><span>${x.name} <span class="mu">${x.cls}</span></span><b>${extra}</b></div>`;
return sel+`<div class="row"><div class="k"><b>${f1(avg(all))}</b><span>School mean, ${e}</span></div><div class="k"><b>${Math.round(pr/en.length*100)}%</b><span>Students at ME or above</span></div><div class="k"><b>${en.length} of ${ST.length}</b><span>Students with marks</span></div><div class="k"><b>${Math.round(col*100)}%</b><span>Fees collected</span></div></div>
<div class="g2" style="margin-bottom:16px"><div class="p"><h2>Achievement levels</h2>${bars(gd.map(([g,n])=>[g,n,n]),mxg)}${legend()}</div>
<div class="p"><h2>Mean by subject</h2><div style="max-height:360px;overflow:auto">${bars(sm,100)}</div></div><div class="p"><h2>Mean by class</h2>${bars(cm,100)}</div>
<div class="p"><h2>Top 3</h2>${rk.slice(0,3).map(x=>li(x,f1(sAvg(x,e)))).join('')}<h2 style="margin-top:14px">Needs support</h2>${rk.slice(-3).reverse().map(x=>li(x,f1(sAvg(x,e)))).join('')}${imp.length?`<h2 style="margin-top:14px">Most improved since ${pe}</h2>${imp.map(([x,d])=>li(x,(d>0?'+':'')+f1(d))).join('')}`:''}</div></div>
`+mt+lk}
function look(){const q=S.q.toLowerCase(),h=q?ST.filter(x=>(x.name+x.adm).toLowerCase().includes(q)).slice(0,5):[];
$('hits').innerHTML=h.map(x=>`<button class="hit" onclick="S.sel=${x.id};S.q='';$('sq').value='';look()"><span>${x.name}</span><span class="mu">${x.adm} · ${x.cls}</span></button>`).join('')||(q?'<p class="mu">No student matches that search.</p>':'');
const x=S.sel==null?null:ST[S.sel];if(!x){$('prof').innerHTML='<p class="mu">Search for a student to see their results by term, subject breakdown, attendance and fee status.</p>';return}
const t=S.rt,n=EX.length,W=580,H=180,px=i=>40+i*(W-70)/(n-1),py=v=>H-34-(v/100)*(H-56),pts=EX.map(e=>has(x,e)?sAvg(x,e):null),ok=pts.map((v,i)=>v==null?null:[i,v]).filter(Boolean),ks=[0,1,2,3].map(i=>kk(t,i)),f=fst(x);
const svg=`<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:640px;min-width:520px">${[0,50,100].map(v=>`<line x1="34" x2="${W-14}" y1="${py(v)}" y2="${py(v)}" stroke="var(--bd)"/><text x="4" y="${py(v)+4}">${v}</text>`).join('')}<polyline fill="none" stroke="var(--ac)" stroke-width="3" points="${ok.map(([i,v])=>px(i)+','+py(v)).join(' ')}"/>${ok.map(([i,v])=>`<circle cx="${px(i)}" cy="${py(v)}" r="4" fill="var(--ac)"/><text x="${px(i)}" y="${py(v)-9}" text-anchor="middle" style="fill:var(--tx);font-size:10px">${Math.round(v)}</text>`).join('')}${EX.map((e,i)=>`<text x="${px(i)}" y="${H-10}" text-anchor="middle" style="font-size:10px">${SL(e)}</text>`).join('')}</svg>`;
const dd=ok.length>1?ok[ok.length-1][1]-ok[0][1]:null;
$('prof').innerHTML=`<div style="margin-top:14px"><div style="display:flex;gap:14px;align-items:center;margin-bottom:10px">${av(x,64,80)}<div><h3 style="font-size:20px">${x.name}</h3><p class="mu" style="margin:2px 0 0">${x.adm} · UPI ${x.upi} · ${x.cls} · Attendance ${x.att==null?'-':x.att+'%'} · Fees <span class="t ${f[1]}">${f[0]}${bal(x)>0?' · '+KES(bal(x))+' due':''}</span></p></div></div>
<h3 style="font-size:16px;margin-bottom:6px">Performance across all exams</h3><div class="sc">${svg}</div><p class="mu" style="margin:4px 0 14px">${dd==null?'More exams are needed to show a trend.':`Overall ${dd>0.5?'improving':dd<-0.5?'declining':'steady'}: ${dd>0?'+':''}${f1(dd)} from the first exam to the latest.`}</p>
<div class="row" style="align-items:center;margin-bottom:8px"><h3 style="font-size:16px;margin:0">Report for</h3><select aria-label="Term" onchange="S.rt=+this.value;draw()">${TERMS.map((n,i)=>`<option value="${i}" ${i==t?'selected':''}>${n}</option>`).join('')}</select></div>
<div class="sc"><table><tr><th>Subject</th>${[...EXN,'Term mean'].map(n=>`<th class="r">${n}</th>`).join('')}<th>Level</th></tr>${x.sj.map(q=>{const m=mk(x,ks[3],q);return `<tr><td>${q}</td>${ks.map(k=>`<td class="r">${cellv(mk(x,k,q))}</td>`).join('')}<td>${m==null?'-':lvt(m)}</td></tr>`}).join('')}<tr><th>Average</th>${ks.map(k=>`<th class="r">${has(x,k)?f1(sAvg(x,k)):'-'}</th>`).join('')}<th>${has(x,ks[3])?lvt(sAvg(x,ks[3])):'-'}</th></tr></table></div>${legend()}</div>`}
// ---------- admin ----------
const av=(x,w=40,h=50)=>x.ph?`<img src="${x.ph}" alt="Photo of ${x.name}" style="width:${w}px;height:${h}px;object-fit:cover;border-radius:6px;display:block">`:`<span aria-hidden="true" style="display:grid;place-items:center;width:${w}px;height:${h}px;border-radius:6px;background:var(--ac2);color:var(--ac);font-weight:600">${x.name.split(' ').map(t=>t[0]).slice(0,2).join('')}</span>`;
function pickPhoto(inp){const f=inp.files[0],pv=$('pv'),e=$('fe2');S.ph=null;pv.innerHTML='';if(!f)return;
if(!f.type.startsWith('image/')){e.textContent='Choose an image file (JPG or PNG).';inp.value='';return}
const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const W=240,H=300,c=document.createElement('canvas');c.width=W;c.height=H;const sc=Math.max(W/im.width,H/im.height),w=im.width*sc,h=im.height*sc;c.getContext('2d').drawImage(im,(W-w)/2,(H-h)/2,w,h);S.ph=c.toDataURL('image/jpeg',.82);e.textContent='';pv.innerHTML=`<img src="${S.ph}" alt="Photo preview" style="width:48px;height:60px;object-fit:cover;border-radius:6px;display:block">`};im.onerror=()=>{e.textContent='That file could not be read as an image.'};im.src=r.result};r.readAsDataURL(f)}
function adminView(){S.ph=null;const opt=(a,sel)=>a.map(c=>`<option ${c==sel?'selected':''}>${c}</option>`).join('');
return `${S.note?`<div class="msg">${S.note}</div>`:''}${er()}
<div class="row"><div class="k"><b>${ST.length}</b><span>Students</span></div><div class="k"><b>${CLS.length}</b><span>Classes</span></div><div class="k"><b>${TEACH.length}</b><span>Teachers</span></div><div class="k"><b>${PAR.length}</b><span>Parent accounts</span></div></div>
<div class="p"><h2>School settings</h2><div class="row" style="margin:0"><input id="as" aria-label="School name" value="${esc(S.school)}"><input id="ay" class="n" aria-label="Academic year" value="${esc(S.ay)}"><select id="at" aria-label="Term">${opt(['Term 1','Term 2','Term 3'],S.term)}</select><button class="b" onclick="saveSet()">Save settings</button></div><p class="mu" style="margin:8px 0 0">Fee items and amounts are managed in the Accounts tab. To move students up at the end of the year, use End of year promotion below, not this box.</p></div>
${yearEndPanel()}
${gradPanel()}
${ctPanel()}
${staffPanel()}
<div class="p"><h2>Achievement levels</h2><p class="mu" style="margin-top:0">A score at or above the minimum earns that level.</p><div class="sc"><table><tr><th>Level</th><th>Meaning</th><th>Minimum score</th></tr>${LV.map((l,i)=>`<tr><td><b>${l.c}</b> ${l.n}</td><td style="white-space:normal">${l.d}</td><td>${i<3?`<input class="n" id="lv${i}" type="number" min="1" max="100" value="${l.min}" aria-label="Minimum score for ${l.c}">`:'0 (anything below AE)'}</td></tr>`).join('')}</table></div><p style="margin:10px 0 0"><button class="b" onclick="saveLv()">Save levels</button></p></div>
${slipPanel()}
<div class="p"><h2>Students</h2><div class="row" style="margin-bottom:10px"><input id="sn2" aria-label="Student full name" placeholder="Student full name"><input id="sa" aria-label="Admission number" placeholder="ADM NO" style="width:130px" autocomplete="off"><input id="su" aria-label="UPI number" placeholder="UPI NO" style="width:130px" autocomplete="off"><select id="sc" aria-label="Class">${opt(CLS)}</select></div>
<div class="row" style="align-items:center;margin-bottom:10px"><label class="mu">Passport photo <input id="sp" type="file" accept="image/*" onchange="pickPhoto(this)"></label><span id="pv"></span></div>
<div class="row" style="gap:6px 14px;font-size:14px;margin-bottom:10px"><span class="mu">Optional subjects (Grade 7 to 9 only):</span>${OPT.map(o=>`<label><input type="checkbox" class="oc" value="${o}"> ${o}</label>`).join('')}</div>
<p id="fe2" class="bd" role="alert" style="margin:0 0 8px"></p><p style="margin:0 0 14px"><button class="b" onclick="addStu()">Add student</button></p>
<input placeholder="Search name, admission no. or class" style="width:min(100%,340px);margin-bottom:8px" value="${esc(S.aq)}" oninput="S.aq=this.value;adminRows()"><div class="sc"><table><thead><tr><th></th><th>Adm no.</th><th>UPI</th><th>Student</th><th>Class</th><th></th></tr></thead><tbody id="ab"></tbody></table></div></div>
<div class="p"><h2>Teachers and assignments</h2><div class="sc"><table><tr><th>Teacher</th><th>Staff code</th><th>Classes and subjects</th></tr>${TEACH.map(t=>`<tr><td>${esc(t.n)}</td><td>${esc((STAFF.find(u=>u.role=='teacher'&&u.name.toLowerCase()==t.n.toLowerCase())||{}).code||'No login')}</td><td style="white-space:normal">${t.a.map(a=>a[0]+' · '+a[1]).join(', ')}</td></tr>`).join('')}</table></div>
<div class="row" style="margin:12px 0 0"><input id="tn" placeholder="Teacher name (new or existing)"><select id="tc" aria-label="Class">${opt(CLS)}</select><select id="ts" aria-label="Subject">${opt(ALLS)}</select><button class="b" onclick="addTeach()">Assign teacher</button></div></div>
<div class="p"><h2>Parent accounts</h2>${PAR.length?`<div class="sc"><table><tr><th>Name</th><th>Email</th><th>Phone</th><th>Linked children</th><th></th></tr>${PAR.map((a,i)=>`<tr><td>${esc(a.name)}</td><td>${esc(a.email)}</td><td>${esc(a.phone)}</td><td>${a.kids.map(k=>ST[k].name).join(', ')||'<span class="mu">None yet</span>'}</td><td><button class="b" onclick="delPar(${i})">Remove</button></td></tr>`).join('')}</table></div>`:'<p class="mu" style="margin:0">No parents have signed up yet. Parents create their own accounts in the Parent portal tab.</p>'}</div>`}
function adminRows(){const q=S.aq.toLowerCase(),h=ST.filter(x=>(x.name+x.adm+x.cls).toLowerCase().includes(q)),gh='background:none;color:var(--mu);border:1px solid var(--bd)';
$('ab').innerHTML=h.slice(0,12).map(x=>`<tr><td>${av(x,32,40)}</td><td>${x.adm}</td><td>${x.upi}</td><td>${x.name}</td><td>${x.cls}</td><td>${S.rm===x.id?`<span class="mu">Delete marks and fee record?</span> <button class="b" style="background:var(--bad)" onclick="doRm(${x.id})">Yes, remove</button> <button class="b" style="${gh}" onclick="S.rm=null;adminRows()">Cancel</button>`:`<button class="b" style="${gh};color:var(--bad)" onclick="S.rm=${x.id};adminRows()">Remove</button>`}</td></tr>`).join('')+(h.length>12?`<tr><td colspan="6" class="mu">Showing 12 of ${h.length}. Search to narrow the list.</td></tr>`:'')||'<tr><td colspan="6" class="mu">No students match that search.</td></tr>'}
function doRm(id){const x=ST[id],fx=k=>k>id?k-1:k;ST.splice(id,1);ST.forEach((y,n)=>y.id=n);PAR.forEach(a=>{a.kids=a.kids.filter(k=>k!=id).map(fx)});
if(S.pk!=null)S.pk=S.pk==id?(S.pa&&S.pa.kids.length?S.pa.kids[0]:null):fx(S.pk);if(S.sel!=null)S.sel=S.sel==id?null:fx(S.sel);if(S.fs!=null)S.fs=S.fs==id?null:fx(S.fs);S.rm=null;S.pi='all';S.perr='';S.note=`${esc(x.name)} (${x.adm}) was removed, with their marks, fee record and parent links.`;draw()}
function slip(x,t){const e=kk(t,3),hv=has(x,e),cl=ST.filter(y=>y.cls==x.cls&&has(y,e)).sort((a,b)=>sAvg(b,e)-sAvg(a,e)),pe=t>0?kk(t-1,3):null,ch=pe&&hv&&has(x,pe)?sAvg(x,e)-sAvg(x,pe):null,ks=[0,1,2,3].map(i=>kk(t,i)),f=fst(x);
return `<div class="slip" style="border:1px solid var(--bd);border-radius:10px;padding:18px;margin-bottom:16px;background:var(--cd)">
<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:2px solid var(--ac);padding-bottom:10px;margin-bottom:12px"><div><h2 style="font-size:20px;margin:0">${esc(S.school)}</h2><div class="mu">Learner results slip · ${TERMS[t]} ${esc(S.ay)}</div></div>${av(x,64,80)}</div>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:4px 16px;margin-bottom:12px"><div><span class="mu">Name</span><br><b>${x.name}</b></div><div><span class="mu">Adm no.</span><br><b>${x.adm}</b></div><div><span class="mu">UPI</span><br><b>${x.upi}</b></div><div><span class="mu">Class</span><br><b>${x.cls}</b></div><div><span class="mu">Attendance</span><br><b>${x.att==null?'-':x.att+'%'}</b></div><div><span class="mu">Position in class</span><br><b>${hv?cl.indexOf(x)+1+' of '+cl.length:'-'}</b></div></div>
<div class="sc"><table><tr><th>Subject</th>${[...EXN,'Term mean'].map(n=>`<th class="r">${n}</th>`).join('')}<th>Level</th></tr>${x.sj.map(q=>{const m=mk(x,ks[3],q);return `<tr><td>${q}</td>${ks.map(k=>`<td class="r">${cellv(mk(x,k,q))}</td>`).join('')}<td>${m==null?'-':lvt(m)}</td></tr>`}).join('')}<tr><th>Average</th>${ks.map(k=>`<th class="r">${has(x,k)?f1(sAvg(x,k)):'-'}</th>`).join('')}<th>${has(x,ks[3])?lvt(sAvg(x,ks[3])):'-'}</th></tr></table></div>
<p style="margin:10px 0 4px"><b>Remark:</b> ${ch==null?'Marks for this term are not complete yet.':ch>=5?'Excellent progress since last term. Keep it up.':ch<=-5?'The mean has dropped since last term. Please arrange to meet the class teacher.':'Steady performance. Encourage regular revision at home.'}</p>
<p style="margin:4px 0"><b>Fee balance:</b> ${f[0]=='Not billed'?'Not billed':bal(x)>0?KES(bal(x)):'Cleared'}</p>${legend()}
<div style="display:flex;gap:24px;margin-top:22px;flex-wrap:wrap">${['Class teacher','Principal','Parent or guardian'].map(n=>`<div style="flex:1;min-width:140px;border-top:1px solid var(--tx);padding-top:4px;font-size:13px">${n}</div>`).join('')}</div>
<div class="mu" style="font-size:12px;margin-top:8px">Printed ${new Date().toLocaleDateString()}</div></div>`}
function slipPanel(){const c=CLS[S.pc],l=ST.filter(x=>x.cls==c),sel=S.pi=='all'?l:l.filter(x=>x.id==S.pi),ch=(a,cur,fn)=>`<select onchange="${fn}">${a.map(([v,t])=>`<option value="${v}" ${v==cur?'selected':''}>${t}</option>`).join('')}</select>`;
return `<div class="p pw" id="sw"><h2 class="np">Print results slips</h2><div class="row np" style="align-items:center">${ch(CLS.map((n,i)=>[i,n]),S.pc,"S.pc=+this.value;S.pi='all';draw()")}${ch([['all','All students in class'],...l.map(x=>[x.id,x.name+' ('+x.adm+')'])],S.pi,"S.pi=this.value;draw()")}${ch(TERMS.map((n,i)=>[i,n]),S.pm,"S.pm=+this.value;draw()")}<button class="b" onclick="printSlips()" ${sel.length?'':'disabled'}>Print ${sel.length} slip${sel.length==1?'':'s'}</button></div>
<p class="mu np" style="margin:8px 0 12px">The preview below is what prints. In the print window, choose Save as PDF to keep a copy.</p>${sel.length?sel.map(x=>slip(x,S.pm)).join(''):'<p class="mu np">There are no students in this class yet.</p>'}</div>`}
function printSlips(){try{window.print()}catch(e){S.perr='Printing is not available here. Open the page in its own browser tab and try again.';draw()}}
function saveLv(){const v=[0,1,2].map(i=>Math.round(+$('lv'+i).value));S.note='';S.perr=v.every(n=>n>=1&&n<=100)&&v[0]>v[1]&&v[1]>v[2]?'':'Minimums must go down from EE to AE, each between 1 and 100.';if(!S.perr){v.forEach((n,i)=>LV[i].min=n);S.note='Achievement levels saved.'}draw()}
function saveSet(){const n=V('as'),y=V('ay');S.note='';S.perr=!n?'Enter a school name.':!y?'Enter the academic year.':'';if(!S.perr){S.school=n;S.ay=y;S.term=$('at').value;S.note='Settings saved.'}draw()}
function addStu(){const n=V('sn2').replace(/[<>&"]/g,''),ad=V('sa').toUpperCase(),up=V('su').toUpperCase(),c=$('sc').value,e=m=>{$('fe2').textContent=m};
if(!n)return e('Enter the student name.');
if(!/^[A-Z0-9\/-]{2,15}$/.test(ad))return e('Enter an admission number using letters, numbers, / or -.');
if(ST.some(x=>x.adm==ad))return e('That admission number is already in use.');
if(!/^[A-Z0-9]{4,15}$/.test(up))return e('Enter a UPI number using letters and numbers only, 4 to 15 characters.');
if(ST.some(x=>x.upi==up))return e('That UPI number is already in use.');
if(!S.ph)return e('Add a passport photo.');
const i=ST.length,m={},sj=CLS.indexOf(c)>=9?[...L3,...[...document.querySelectorAll('.oc:checked')].map(o=>o.value)]:subs(c).slice();EX.forEach(x=>{m[x]={};sj.forEach(t=>m[x][t]=null)});
ST.push({id:i,adm:ad,upi:up,name:n,cls:c,sj,m,ch:{},py:{},rc:[],att:100,ph:S.ph});S.ph=null;S.perr='';S.note=`Added ${n} (${ad}) to ${c}. No marks yet. Teachers will enter them.`;draw()}
function addTeach(){const n=V('tn'),c=$('tc').value,sb=$('ts').value;S.note='';
if(!n)S.perr='Enter the teacher name.';else if(!subs(c).includes(sb))S.perr=`${c} does not take ${sb}. Pick a subject from that class.`;else{let t=TEACH.find(y=>y.n.toLowerCase()==n.toLowerCase());if(!t){t={n,a:[]};TEACH.push(t)}if(t.a.some(a=>a[0]==c&&a[1]==sb))S.perr=`${esc(t.n)} already teaches ${sb} in ${c}.`;else{t.a.push([c,sb]);S.perr='';S.note=`${esc(t.n)} now teaches ${sb} in ${c}.`}}draw()}
function delPar(i){if(S.pa===PAR[i]){S.pa=null;S.pk=null}PAR.splice(i,1);S.perr='';S.note='Parent account removed.';draw()}
// ---------- parent portal ----------
const PAR=[],esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const er=()=>(S.pinfo?`<div class="msg">${S.pinfo}</div>`:'')+(S.perr?`<div class="msg" style="background:var(--bad2);color:var(--bad)">${S.perr}</div>`:'');
function parentViewBase(){const a=S.pa;
if(!a){const up=S.pmode=='up',f=S.f;return `<div class="p" style="max-width:440px;margin:30px auto"><h2>${up?'Create a parent account':'Parent sign in'}</h2>${er()}
${up?`<p><input id="fn" placeholder="Full name" style="width:100%" value="${esc(f.n||'')}" autocomplete="name"></p><p><input id="fp" type="tel" placeholder="Phone number, e.g. 0712 345 678" style="width:100%" value="${esc(f.p||'')}" autocomplete="tel"></p>`:''}
<p><input id="fe" type="email" placeholder="Email address" style="width:100%" value="${esc(f.e||'')}" autocomplete="email"></p>
<p><input id="fw" type="password" placeholder="${up?'Password (at least 8 characters)':'Password'}" style="width:100%" autocomplete="${up?'new-password':'current-password'}" ${up?'':`onkeydown="if(event.key=='Enter')pin()"`}></p>
${up?`<p><input id="fc" type="password" placeholder="Confirm password" style="width:100%" autocomplete="new-password" onkeydown="if(event.key=='Enter')psignup()"></p>`:''}
<button class="b" onclick="${up?'psignup()':'pin()'}">${up?'Create account':'Sign in'}</button>
<p class="mu" style="margin-bottom:0">${up?'':`<a href="#" style="color:var(--ac)" onclick="S.pmode='forgot';S.perr='';S.pinfo='';draw();return false">Forgot your password?</a><br>`}${up?'Already registered?':'New here?'} <a href="#" style="color:var(--ac)" onclick="S.pmode='${up?'in':'up'}';S.perr='';draw();return false">${up?'Sign in':'Create an account'}</a></p></div>`}
const kids=a.kids.map(i=>ST[i]),bar=`<div class="row" style="justify-content:space-between;align-items:center"><span class="mu">Signed in as ${esc(a.name)} · ${esc(a.email)}</span><button class="b" onclick="doSignOut()">Sign out</button></div>`;
if(!kids.length||S.addk)return bar+`<div class="p" style="max-width:440px;margin:16px auto"><h2>Link your child</h2><p class="mu" style="margin-top:0">Enter your child's admission number and UPI from the school. They confirm that you can view this child's report.</p>${er()}<p><input id="la" placeholder="Admission number" style="width:100%" autocomplete="off"></p><p><input id="lu" placeholder="UPI" style="width:100%" autocomplete="off" onkeydown="if(event.key=='Enter')plink()"></p><button class="b" onclick="plink()">Link child</button> ${kids.length?`<button class="b" style="background:none;color:var(--mu);border:1px solid var(--bd)" onclick="S.addk=0;S.perr='';draw()">Cancel</button>`:''}<p class="mu" style="font-size:13px;margin-bottom:0">Demo child: NB1001 and UP480100</p></div>`;
const x=ST[S.pk],t=S.rt,e=kk(t,3),cl=ST.filter(y=>y.cls==x.cls&&has(y,e)).sort((b,c)=>sAvg(c,e)-sAvg(b,e)),hv=has(x,e),av=sAvg(x,e),pe=t>0?kk(t-1,3):null,ch=pe&&hv&&has(x,pe)?av-sAvg(x,pe):null;
return bar+`${er()}<div class="row">${kids.length>1?`<select onchange="S.pk=+this.value;draw()">${kids.map(k=>`<option value="${k.id}" ${k.id==S.pk?'selected':''}>${k.name}</option>`).join('')}</select>`:''}<button class="b" onclick="S.addk=1;S.perr='';draw()">Link another child</button></div>
<div class="row"><div class="k"><b>${hv?f1(av):'-'}</b><span>${TERMS[t]} mean</span></div><div class="k"><b>${hv?G(av):'-'}</b><span>Term level</span></div><div class="k"><b>${hv?cl.indexOf(x)+1+' of '+cl.length:'-'}</b><span>Position in ${x.cls}</span></div><div class="k"><b>${ch==null?'-':(ch>0?'+':'')+f1(ch)}</b><span>Change since last term</span></div></div>
${attPanel(x)}${learnPanels(x)}<div class="p"><h2>Report card</h2><p style="margin-top:0"><b>Class teacher's remark:</b> ${ch==null?'Marks for this term are not complete yet.':ch>=5?'Excellent progress since last term. Keep it up.':ch<=-5?'The mean has dropped since last term. Please arrange to meet the class teacher.':'Steady performance. Encourage regular revision at home.'}</p><div id="hits" hidden></div><div id="prof"></div></div><div class="p"><h2>Fee statement</h2>${stmt(x)}</div>`}
const V=id=>$(id).value.trim();
function psignup(){const n=V('fn'),ph=V('fp'),em=V('fe').toLowerCase(),pw=$('fw').value;S.f={n,p:ph,e:em};
S.perr=!n?'Enter your full name.':!/^(\+?254|0)?[17]\d{8}$/.test(ph.replace(/[\s-]/g,''))?'Enter a valid Kenyan phone number, for example 0712 345 678.':!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)?'Enter a valid email address.':PAR.some(y=>y.email==em)?'An account with this email already exists. Sign in instead.':pw.length<8?'Choose a password with at least 8 characters.':pw!=$('fc').value?'The two passwords do not match.':'';
if(!S.perr){S.pa={name:n,phone:ph,email:em,pw,kids:[]};PAR.push(S.pa);S.pk=null;S.f={}}draw()}
function pin(){const em=V('fe').toLowerCase(),a=PAR.find(y=>y.email==em&&y.pw==$('fw').value);S.f={e:em};if(a){S.pa=a;S.pk=a.kids.length?a.kids[0]:null;S.perr='';S.f={}}else S.perr='Email or password is incorrect. Check both, or create an account.';draw()}
function plink(){const ad=V('la').toUpperCase(),u=V('lu').toUpperCase(),x=ST.find(y=>y.adm==ad&&y.upi==u);
if(!x)S.perr='Admission number and UPI do not match. Check both and try again.';else if(S.pa.kids.includes(x.id))S.perr='This child is already linked to your account.';else{S.pa.kids.push(x.id);S.pk=x.id;S.addk=0;S.perr=''}draw()}
draw();
const _d=draw;draw=function(){_d();if(S.role=='principal'&&ok('principal'))look();if(S.role=='parent'&&S.pa&&S.pk!=null&&!S.addk){const o=S.sel;S.sel=S.pk;S.q='';look();S.sel=o}};

// =====================================================================
// Supabase data layer. Everything above is the interface; everything
// below replaces the in-memory demo data with the real database.
// =====================================================================
const DB=supabase.createClient(CONFIG.url,CONFIG.key);
const CID={},CLSN={},SID={},SNM={},MT={},CT=[],ATT={};
const staffEmail=c=>c.toLowerCase()+'@staff.nbva.invalid';
const GENERIC='The name, staff code or password is not correct for this area. Check all three and try again.';
const T0=()=>+String(S.term).slice(-1)||1;
const toast=(m,bad)=>{const t=$('toast');t.textContent=m;t.className=bad?'bad':'';t.style.opacity=1;clearTimeout(toast.h);toast.h=setTimeout(()=>{t.style.opacity=0},2500)};
async function fetchAll(make){let out=[],from=0;for(;;){const r=await make().range(from,from+999);if(r.error)throw r.error;out=out.concat(r.data);if(r.data.length<1000)return out;from+=1000}}
async function myProfile(){const u=await DB.auth.getUser();if(!u.data||!u.data.user)return null;const r=await DB.from('profiles').select('*').eq('id',u.data.user.id).single();return r.data}
const ixOf=u=>{const i=u?ST.findIndex(x=>x.uid==u):-1;return i<0?null:i};

async function loadData(){
 try{
  const role=S.u?S.u.role:S.pa?'parent':null;
  [ST,FI,TEACH,STAFF,PAR,LESSONS,ASG].forEach(a=>{a.length=0});
  if(!role)return;
  const fee=['admin','accounts','principal','deputy'].includes(role);
  const R=await Promise.all([DB.from('settings').select('*').single(),DB.from('classes').select('*').order('id'),DB.from('subjects').select('*').order('id'),DB.from('class_subjects').select('*').order('subject_id')]);
  R.forEach(r=>{if(r.error)throw r.error});
  const g=R[0].data;S.school=g.school_name;S.ay=g.academic_year;S.term='Term '+g.current_term;LV[0].min=+g.ee_min;LV[1].min=+g.me_min;LV[2].min=+g.ae_min;
  R[1].data.forEach(c=>{CID[c.name]=c.id;CLSN[c.id]=c.name});R[2].data.forEach(s=>{SID[s.name]=s.id;SNM[s.id]=s.name});
  Object.keys(SUBS).forEach(k=>delete SUBS[k]);OPT.length=0;const all=new Set();
  R[3].data.forEach(r=>{const c=CLSN[r.class_id],n=SNM[r.subject_id];(SUBS[c]=SUBS[c]||[]).push(n);all.add(n);if(r.optional&&!OPT.includes(n))OPT.push(n)});
  ALLS.length=0;all.forEach(n=>ALLS.push(n));
  // students and their subjects
  const stu=await fetchAll(()=>{const q=DB.from('students').select('*').order('adm_no');return role=='accounts'?q:q.eq('status','active')});
  const ss=await fetchAll(()=>DB.from('student_subjects').select('student_id,subject_id').order('student_id').order('subject_id'));
  const by={};
  stu.forEach((r,i)=>{const x={id:i,uid:r.id,adm:r.adm_no,upi:r.upi,name:r.full_name,cls:r.status=='active'?CLSN[r.class_id]:'Alumni',status:r.status,gy:r.pp2_graduated_year||null,sj:[],m:{},ch:{},py:{},rc:[],att:null,ph:null,path:r.photo_path};by[r.id]=x;ST.push(x)});
  ss.forEach(r=>{const x=by[r.student_id];if(x)x.sj.push(SNM[r.subject_id])});
  ST.forEach(x=>{x.sj.sort((a,b)=>SID[a]-SID[b]);EX.forEach(e=>{x.m[e]={};x.sj.forEach(s=>{x.m[e][s]=null})})});
  // marks
  if(role!='accounts'){
   const mm=await fetchAll(()=>DB.from('marks').select('student_id,subject_id,term,exam,score').eq('academic_year',S.ay).order('student_id').order('subject_id').order('term').order('exam'));
   mm.forEach(r=>{const x=by[r.student_id];if(!x)return;const e=EX[(r.term-1)*3+r.exam];if(!x.m[e])x.m[e]={};x.m[e][SNM[r.subject_id]]=r.score==null?null:+r.score});
  }
  S.locked={};
  if(role=='teacher'||role=='admin'){const lk=await DB.from('mark_locks').select('*').eq('academic_year',S.ay);if(!lk.error)lk.data.forEach(r=>{if(r.locked)S.locked[CLSN[r.class_id]+SNM[r.subject_id]+((r.term-1)*3+r.exam)]=true})}
  // photos (private bucket, so use short-lived links)
  const paths=ST.filter(x=>x.path).map(x=>x.path);
  if(paths.length){const sg=await DB.storage.from('student-photos').createSignedUrls(paths,3600);(sg.data||[]).forEach(d=>{const x=ST.find(z=>z.path==d.path);if(x&&d.signedUrl)x.ph=d.signedUrl})}
  // fees
  if(fee||role=='parent'){
   const fi=await DB.from('fee_items').select('*').order('name');if(fi.error)throw fi.error;
   fi.data.forEach((r,i)=>FI.push({id:i,db:r.id,n:r.name,c:Math.max(0,CAT.indexOf(r.category)),a:+r.default_amount,on:r.active}));
   const di={};FI.forEach(f=>{di[f.db]=f.id});
   const fb=await fetchAll(()=>DB.from('fee_balances').select('student_id,fee_item_id,charged,paid').order('student_id').order('fee_item_id'));
   fb.forEach(r=>{const x=by[r.student_id],k=di[r.fee_item_id];if(x&&k!=null){x.ch[k]=+r.charged;x.py[k]=+r.paid}});
   const pay=await fetchAll(()=>DB.from('payments').select('*').order('paid_at').order('id'));
   const al=await fetchAll(()=>DB.from('payment_allocations').select('*').order('payment_id').order('fee_item_id'));
   const pm={};pay.forEach(p=>{const x=by[p.student_id];if(!x)return;const r={no:p.receipt_no,d:p.paid_at,m:p.method,ref:p.reference||'',a:+p.amount,it:{},bl:+p.balance_after};pm[p.id]=r;x.rc.push(r)});
   al.forEach(a=>{const r=pm[a.payment_id],k=di[a.fee_item_id];if(r&&k!=null)r.it[k]=+a.amount});
  }
  // teachers, staff and parents
  if(role=='teacher'){const ta=await DB.from('teacher_assignments').select('class_id,subject_id').eq('teacher_id',S.u.uid);if(ta.error)throw ta.error;
   TEACH.push({uid:S.u.uid,n:S.u.name,a:ta.data.map(r=>[CLSN[r.class_id],SNM[r.subject_id]]).sort((p,q)=>CLS.indexOf(p[0])-CLS.indexOf(q[0]))})}
  if(role=='admin'){
   const pr=await fetchAll(()=>DB.from('profiles').select('*').order('created_at').order('id'));
   const ta=await fetchAll(()=>DB.from('teacher_assignments').select('*').order('id'));
   const pc=await fetchAll(()=>DB.from('parent_children').select('*').order('parent_id').order('student_id'));
   pr.forEach(p=>{if(p.role=='parent')PAR.push({uid:p.id,name:p.full_name,email:p.email||'',phone:p.phone||'',kids:[]});else{STAFF.push({uid:p.id,code:p.staff_code||'',name:p.full_name,role:p.role});if(p.role=='teacher')TEACH.push({uid:p.id,n:p.full_name,a:[]})}});
   ta.forEach(r=>{const t=TEACH.find(z=>z.uid==r.teacher_id);if(t)t.a.push([CLSN[r.class_id],SNM[r.subject_id]])});
   pc.forEach(r=>{const p=PAR.find(z=>z.uid==r.parent_id),i=ixOf(r.student_id);if(p&&i!=null)p.kids.push(i)});
  }
  if(role=='parent'){const pc=await DB.from('parent_children').select('student_id').eq('parent_id',S.pa.uid);if(pc.error)throw pc.error;
   S.pa.kids=pc.data.map(r=>ixOf(r.student_id)).filter(i=>i!=null);if(S.pk==null||S.pa.kids.indexOf(S.pk)<0)S.pk=S.pa.kids.length?S.pa.kids[0]:null}
  // class teachers and attendance
  CT.length=0;Object.keys(ATT).forEach(k=>{delete ATT[k]});
  if(role!='accounts'){
   const ct=await DB.from('class_teachers').select('*');if(!ct.error)ct.data.forEach(r=>CT.push({cid:r.class_id,cls:CLSN[r.class_id],uid:r.teacher_id,name:r.teacher_name}));
   const since=new Date(Date.now()-(role=='parent'||role=='teacher'?30:2)*864e5).toLocaleDateString('en-CA',{timeZone:'Africa/Nairobi'});
   const at=await fetchAll(()=>DB.from('attendance').select('student_id,att_date,status,note,updated_at').gte('att_date',since).order('student_id').order('att_date'));
   at.forEach(r=>{(ATT[r.student_id]=ATT[r.student_id]||{})[r.att_date]={s:r.status,n:r.note||'',t:r.updated_at}});
   const sm=await fetchAll(()=>DB.from('attendance_summary').select('*').order('student_id'));
   sm.forEach(r=>{const x=by[r.student_id];if(x)x.att=r.marked?Math.round(r.attended/r.marked*1000)/10:null});
  }
  S.lastRun=null;
  if(role=='admin'){const pr2=await DB.from('promotion_runs').select('*').is('undone_at',null).order('run_at',{ascending:false}).limit(1);if(!pr2.error&&pr2.data.length)S.lastRun=pr2.data[0]}
  // lessons and assignments
  const ls=await fetchAll(()=>DB.from('lessons').select('*').order('starts_at').order('id'));
  const as=await fetchAll(()=>DB.from('assignments').select('*').order('due_date').order('id'));
  ls.forEach((r,i)=>LESSONS.push({id:i+1,uid:r.id,cls:CLSN[r.class_id],subj:SNM[r.subject_id],title:r.title,teacher:r.teacher_name,start:r.starts_at,dur:r.duration_min,link:r.meeting_url,st:r.status=='scheduled'?'sched':r.status}));
  as.forEach((r,i)=>ASG.push({id:i+1,uid:r.id,cls:CLSN[r.class_id],subj:SNM[r.subject_id],title:r.title,notes:r.notes||'',due:r.due_date,teacher:r.teacher_name,path:r.file_path,file:r.file_name?{name:r.file_name,size:r.file_size||0}:null}));
  if(S.u){const e=STAFF.find(z=>z.uid==S.u.uid);if(e)S.u=e}
 }catch(e){S.perr='Could not load the data: '+(e.message||e)}
}
async function refresh(){const id=i=>i!=null&&ST[i]?ST[i].uid:null,k={fs:id(S.fs),sel:id(S.sel),pk:id(S.pk),pi:S.pi=='all'?null:id(+S.pi)};
 await loadData();S.fs=ixOf(k.fs);S.sel=ixOf(k.sel);if(k.pk&&ixOf(k.pk)!=null)S.pk=ixOf(k.pk);const q=ixOf(k.pi);S.pi=q==null?'all':String(q)}

// ---------- sign-in, sign-out, first-login password ----------
const AREAOF={teacher:'teacher',accounts:'accounts',principal:'principal',deputy:'principal',admin:'admin'};
async function afterAuth(){const p=await myProfile();S.u=null;S.pa=null;S.pk=null;S.sel=null;S.fs=null;S.mc=false;
 if(p){if(p.role=='parent')S.pa={uid:p.id,name:p.full_name,email:p.email||'',phone:p.phone||'',kids:[]};else S.u={uid:p.id,name:p.full_name,code:p.staff_code||'',role:p.role};S.mc=!!p.must_change_password}
 await loadData();
 if(p){S.role=AREAOF[p.role]||'parent';S.pt=S.rt=Math.max(0,T0()-1);S.px=3}
 draw()}
async function doSignOut(){await flushMarks();await DB.auth.signOut();S.u=null;S.pa=null;S.pk=null;S.sel=null;S.fs=null;S.mc=false;S.cp=false;S.addk=0;S.pmode='in';S.perr='';S.pinfo='';S.note='';S.rv=null;S.bv=false;S.iss=[];S.ye=null;await loadData();draw()}
function mcCard(){return `<div class="p" style="max-width:440px;margin:30px auto"><h2>Choose a new password</h2><p class="mu" style="margin-top:0">This is your first sign-in. Please set your own password before you continue.</p><p id="mc_e" class="bd" role="alert"></p><p><input id="mc_1" type="password" placeholder="New password (8+ characters)" style="width:100%" autocomplete="new-password"></p><p><input id="mc_2" type="password" placeholder="Confirm new password" style="width:100%" autocomplete="new-password" onkeydown="if(event.key=='Enter')forceChange()"></p><button class="b" onclick="forceChange()">Save and continue</button> <button class="b" style="${GH}" onclick="doSignOut()">Sign out</button></div>`}
async function forceChange(){const a=$('mc_1').value,e=m=>{$('mc_e').textContent=m};if(a.length<8)return e('Choose a password with at least 8 characters.');if(a!=$('mc_2').value)return e('The two passwords do not match.');
 const u=await DB.auth.updateUser({password:a});if(u.error)return e(u.error.message);const r=await DB.rpc('clear_must_change');if(r.error)return e(r.error.message);S.mc=false;S.note='Password updated.';draw()}
async function staffIn(a){const n=a=='admin'?'':V('sn_n'),c=V('sn_c').toUpperCase(),pw=$('sn_p').value;S.sf={n,c};S.perr='';
 if(!c||!pw){S.perr=GENERIC;return draw()}
 const r=await DB.auth.signInWithPassword({email:staffEmail(c),password:pw});
 if(r.error){S.perr=a=='admin'?'The staff code or password is not correct. Check both and try again.':GENERIC;return draw()}
 const p=await myProfile();let ok_=!!p&&AREA[a].includes(p.role);
 if(ok_&&a!='admin'){const q=await DB.rpc('check_staff_name',{p_name:n});ok_=!q.error&&q.data===true}
 if(!ok_){await DB.auth.signOut();S.perr=a=='admin'?'The staff code or password is not correct. Check both and try again.':GENERIC;return draw()}
 S.sf={};await afterAuth()}
async function changePw(){const o=$('cp_o').value,n=$('cp_n').value,e=m=>{$('cp_e').textContent=m};
 if(n.length<8)return e('Choose a password with at least 8 characters.');if(n!=$('cp_c').value)return e('The two new passwords do not match.');if(n==o)return e('Choose a password different from the current one.');
 const v=await DB.auth.signInWithPassword({email:staffEmail(S.u.code),password:o});if(v.error)return e('Your current password is not correct.');
 const u=await DB.auth.updateUser({password:n});if(u.error)return e(u.error.message);S.cp=false;S.note='Password changed.';draw()}
async function psignup(){const n=V('fn'),ph=V('fp'),em=V('fe').toLowerCase(),pw=$('fw').value;S.f={n,p:ph,e:em};S.pinfo='';
 S.perr=!n?'Enter your full name.':!/^(\+?254|0)?[17]\d{8}$/.test(ph.replace(/[\s-]/g,''))?'Enter a valid Kenyan phone number, for example 0712 345 678.':!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)?'Enter a valid email address.':pw.length<8?'Choose a password with at least 8 characters.':pw!=$('fc').value?'The two passwords do not match.':'';
 if(S.perr)return draw();
 const r=await DB.auth.signUp({email:em,password:pw,options:{data:{full_name:n,phone:ph}}});
 if(r.error){S.perr=r.error.message;return draw()}
 if(r.data.user&&r.data.user.identities&&!r.data.user.identities.length){S.perr='An account with this email already exists. Sign in instead.';return draw()}
 S.f={};if(!r.data.session){S.pinfo='Account created. Check your email and click the confirmation link, then sign in.';S.pmode='in';return draw()}
 await afterAuth()}
async function pin(){const em=V('fe').toLowerCase(),pw=$('fw').value;S.f={e:em};S.pinfo='';
 const r=await DB.auth.signInWithPassword({email:em,password:pw});
 if(r.error){S.perr=/confirm/i.test(r.error.message)?'Please confirm your email first. Check your inbox for the link.':'Email or password is incorrect. Check both, or create an account.';return draw()}
 const p=await myProfile();if(!p||p.role!='parent'){await DB.auth.signOut();S.perr='This is the parent sign-in. Staff sign in from their own tab.';return draw()}
 S.perr='';S.f={};await afterAuth()}
async function plink(){const r=await DB.rpc('link_child',{p_adm:V('la'),p_upi:V('lu')});
 if(r.error){S.perr=r.error.message;return draw()}
 if(!r.data){S.perr='Admission number and UPI do not match. Check both and try again.';return draw()}
 S.perr='';S.addk=0;await loadData();S.pk=ixOf(r.data);draw()}

// ---------- staff accounts (admin) ----------
async function callAdmin(body){const r=await DB.functions.invoke('admin-users',{body});
 if(r.error){let m=r.error.message;try{const j=await r.error.context.json();if(j&&j.error)m=j.error}catch(e){}throw new Error(m)}return r.data}
async function addStaff(){const n=V('st_n').replace(/[<>&"]/g,''),r=$('st_r').value,pw=$('st_p').value,c=V('st_c').toUpperCase(),e=m=>{$('st_e').textContent=m};
 if(!n)return e('Enter the full name.');if(pw.length<8)return e('The starting password needs at least 8 characters.');
 try{const d=await callAdmin({action:'create_staff',name:n,role:r,code:c,password:pw});await refresh();S.perr='';S.note=`Added ${esc(d.name)} (${RL[r]}). Staff code ${esc(d.code)}. They choose their own password at first sign-in.${r=='teacher'?' Assign their classes under Teachers and assignments.':''}`}catch(x){return e(x.message)}draw()}
async function resetStaff(i){const u=STAFF[i];try{const d=await callAdmin({action:'reset_password',user_id:u.uid});S.perr='';S.note=`New temporary password for ${esc(u.name)} (${esc(u.code)}): ${esc(d.password)}. Share it privately. They must choose a new one at next sign-in.`}catch(x){S.note='';S.perr=x.message}draw()}
async function delStaff(i){const u=STAFF[i];try{await callAdmin({action:'delete_user',user_id:u.uid});await refresh();S.perr='';S.note=`Removed ${esc(u.name)}.`}catch(x){S.note='';S.perr=x.message}draw()}
async function delPar(i){const p=PAR[i];try{await callAdmin({action:'delete_user',user_id:p.uid});await refresh();S.perr='';S.note='Parent account removed.'}catch(x){S.note='';S.perr=x.message}draw()}

// ---------- marks ----------
function setMark(id,s,el){setMarkLocal(id,s,el);const ex=S.ex,k=id+'|'+s+'|'+ex;clearTimeout(MT[k]);MT[k]=setTimeout(()=>{delete MT[k];saveMark(id,s,ex)},700)}
async function saveMark(id,s,ex){const x=ST[id];if(!x)return;const r=await DB.from('marks').upsert({student_id:x.uid,subject_id:SID[s],academic_year:S.ay,term:Math.floor(ex/3)+1,exam:ex%3,score:x.m[EX[ex]][s]},{onConflict:'student_id,subject_id,academic_year,term,exam'});toast(r.error?'Not saved: '+r.error.message:'Saved',!!r.error)}
async function flushMarks(){const ks=Object.keys(MT);ks.forEach(k=>clearTimeout(MT[k]));await Promise.all(ks.map(k=>{const p=k.split('|');delete MT[k];return saveMark(+p[0],p[1],+p[2])}))}
async function toggleLock(c,s,ex){await flushMarks();const k=c+s+ex,on=!S.locked[k];
 const r=await DB.from('mark_locks').upsert({class_id:CID[c],subject_id:SID[s],academic_year:S.ay,term:Math.floor(ex/3)+1,exam:ex%3,locked:on},{onConflict:'class_id,subject_id,academic_year,term,exam'});
 if(r.error)S.perr=r.error.message;else{S.locked[k]=on;S.perr=''}draw()}

// ---------- lessons and assignments ----------
async function postLesson(){const T=TEACH[S.t],p=T.a[+$('lz_s').value],c=p[0],sb=p[1],t=V('lz_t').replace(/[<>&"]/g,''),d=$('lz_d').value,tm=$('lz_tm').value,du=Math.round(+$('lz_du').value),l=V('lz_l'),e=m=>{$('lz_e').textContent=m};
 if(!t)return e('Enter the lesson title.');if(!d||!tm)return e('Pick the date and start time.');if(!(du>=10&&du<=240))return e('Duration must be between 10 and 240 minutes.');if(!/^https:\/\/[^\s]+$/.test(l))return e('Paste the meeting link starting with https://');
 const r=await DB.from('lessons').insert({class_id:CID[c],subject_id:SID[sb],teacher_id:S.u.uid,title:t,starts_at:new Date(d+'T'+tm).toISOString(),duration_min:du,meeting_url:l});
 if(r.error)return e(r.error.message);await refresh();S.perr='';S.note=`Scheduled "${t}" for ${c} ${sb}.`;draw()}
async function startLesson(id){const l=LESSONS.find(y=>y.id==id);try{window.open(l.link,'_blank','noopener')}catch(e){}
 const r=await DB.from('lessons').update({status:'live'}).eq('id',l.uid);if(r.error){S.perr=r.error.message}else{await refresh();S.perr='';S.note=`"${esc(l.title)}" is live. Learners can now join from the Parent portal.`}draw()}
async function endLesson(id){const l=LESSONS.find(y=>y.id==id),r=await DB.from('lessons').update({status:'ended'}).eq('id',l.uid);if(r.error){S.perr=r.error.message}else{await refresh();S.perr='';S.note='Lesson ended.'}draw()}
async function delLesson(id){const l=LESSONS.find(y=>y.id==id),r=await DB.from('lessons').delete().eq('id',l.uid);if(r.error){S.perr=r.error.message}else{await refresh();S.perr='';S.note='Lesson removed.'}draw()}
async function postAsg(){const T=TEACH[S.t],p=T.a[+$('as_s').value],c=p[0],sb=p[1],t=V('as_t').replace(/[<>&"]/g,''),nt=$('as_i').value.trim().replace(/[<>&"]/g,''),d=$('as_d').value,f=($('as_f').files||[])[0],e=m=>{$('as_e').textContent=m};
 if(!t)return e('Enter the assignment title.');if(!d)return e('Pick the due date.');if(!nt&&!f)return e('Add instructions or attach a file.');
 if(f){if(!OKX.includes(f.name.split('.').pop().toLowerCase()))return e('That file type is not supported. Use PDF, Word, PowerPoint, Excel, text, image, CSV or ZIP.');if(f.size>5242880)return e('The file is over 5 MB. Choose a smaller file.')}
 const ins=await DB.from('assignments').insert({class_id:CID[c],subject_id:SID[sb],teacher_id:S.u.uid,title:t,notes:nt||null,due_date:d}).select('id').single();
 if(ins.error)return e(ins.error.message);
 if(f){const path=ins.data.id+'/'+f.name.replace(/[^A-Za-z0-9._-]/g,'_'),up=await DB.storage.from('assignment-files').upload(path,f,{contentType:f.type||undefined});
  if(up.error){await DB.from('assignments').delete().eq('id',ins.data.id);return e('The file could not be uploaded: '+up.error.message)}
  await DB.from('assignments').update({file_path:path,file_name:f.name,file_size:f.size}).eq('id',ins.data.id)}
 await refresh();S.perr='';S.note=`Posted "${t}" for ${c} ${sb}.`;draw()}
async function delAsg(id){const a=ASG.find(y=>y.id==id);if(a.path)await DB.storage.from('assignment-files').remove([a.path]);const r=await DB.from('assignments').delete().eq('id',a.uid);if(r.error){S.perr=r.error.message}else{await refresh();S.perr='';S.note='Assignment removed.'}draw()}
async function dlAsg(id){const a=ASG.find(y=>y.id==id);if(!a||!a.path)return;const r=await DB.storage.from('assignment-files').createSignedUrl(a.path,60,{download:a.file.name});
 if(r.error){S.perr='The file could not be opened. '+r.error.message;return draw()}const l=document.createElement('a');l.href=r.data.signedUrl;l.download=a.file.name;document.body.appendChild(l);l.click();l.remove()}

// ---------- fees ----------
async function setOn(k,v){const r=await DB.from('fee_items').update({active:v}).eq('id',FI[k].db);if(r.error)S.perr=r.error.message;else FI[k].on=v;draw()}
async function setAmt(k,v){const a=Math.max(0,Math.round(+v||0)),r=await DB.from('fee_items').update({default_amount:a}).eq('id',FI[k].db);if(r.error)toast(r.error.message,true);else{FI[k].a=a;toast('Saved')}}
async function addItem(){const n=V('fn2').replace(/[<>&"]/g,''),c=+$('fc2').value,a=Math.round(+$('fa2').value||0);S.note='';S.perr=!n?'Enter the fee item name.':FI.some(f=>f.n.toLowerCase()==n.toLowerCase())?'That fee item already exists.':'';
 if(!S.perr){const r=await DB.from('fee_items').insert({name:n,category:CAT[c],default_amount:a});if(r.error)S.perr=r.error.message;else{await refresh();S.note=`Added the fee item ${n}.`}}draw()}
async function addCharge(){const x=ST[S.fs],c=chosen('c');S.note='';S.perr=!c.length?'Tick at least one fee item.':c.some(i=>!(i.a>0))?'Enter an amount above 0 for each ticked item.':'';
 if(!S.perr){const r=await DB.from('fee_charges').insert(c.map(i=>({student_id:x.uid,fee_item_id:FI[i.k].db,amount:i.a,academic_year:S.ay,term:T0()})));
  if(r.error)S.perr=r.error.message;else{await refresh();S.note=`Charged ${c.length} fee item${c.length==1?'':'s'} (${KES(c.reduce((t,i)=>t+i.a,0))}) to ${x.name}.`}}draw()}
async function billClass(){const c=$('bc').value,it=chosen('b');S.note='';S.perr=!it.length?'Tick at least one fee item.':it.some(i=>!(i.a>0))?'Enter an amount above 0 for each ticked item.':'';
 if(!S.perr){const r=await DB.rpc('bill_class',{p_items:it.map(i=>({item:FI[i.k].db,amount:i.a})),p_class:c=='All'?null:CID[c],p_year:S.ay,p_term:T0()});
  if(r.error)S.perr=r.error.message;else{await refresh();const d=r.data;S.note=`Billed ${it.length} fee item${it.length==1?'':'s'} to ${c=='All'?'all classes':c}: ${d.added} charge${d.added==1?'':'s'} added${d.skipped?`, ${d.skipped} skipped because the student already had that item`:''}.`}}draw()}
async function recPay(){const x=ST[S.fs],k=+$('pi').value,a=Math.round(+$('pa').value),m=$('pm').value,rf=V('pr'),mx=k<0?bal(x):(x.ch[k]||0)-(x.py[k]||0);S.note='';
 S.perr=!(a>0)?'Enter an amount above 0.':a>mx?`That is more than the balance of ${KES(mx)}.`:(m!='Cash'&&!rf)?'Enter the payment reference.':'';
 if(!S.perr){const r=await DB.rpc('record_payment',{p_student:x.uid,p_item:k<0?null:FI[k].db,p_amount:a,p_method:m,p_ref:rf||null});
  if(r.error)S.perr=r.error.message;else{await refresh();S.rv=r.data.receipt_no;S.bv=false;S.note=`Recorded ${KES(a)} (${m}${rf?', '+esc(rf):''}) for ${x.name}. Receipt ${r.data.receipt_no} issued. It is shown below, ready to print.`}}draw()}

// ---------- admin: settings, students, assignments ----------
async function saveSet(){const n=V('as'),y=V('ay'),t=+String($('at').value).slice(-1);S.note='';S.perr=!n?'Enter a school name.':!y?'Enter the academic year.':'';
 if(!S.perr){const r=await DB.from('settings').update({school_name:n,academic_year:y,current_term:t}).eq('id',true);if(r.error)S.perr=r.error.message;else{await refresh();S.note='Settings saved.'}}draw()}
async function saveLv(){const v=[0,1,2].map(i=>Math.round(+$('lv'+i).value));S.note='';S.perr=v.every(n=>n>=1&&n<=100)&&v[0]>v[1]&&v[1]>v[2]?'':'Minimums must go down from EE to AE, each between 1 and 100.';
 if(!S.perr){const r=await DB.from('settings').update({ee_min:v[0],me_min:v[1],ae_min:v[2]}).eq('id',true);if(r.error)S.perr=r.error.message;else{await refresh();S.note='Achievement levels saved.'}}draw()}
async function addStu(){const n=V('sn2').replace(/[<>&"]/g,''),ad=V('sa').toUpperCase(),up=V('su').toUpperCase(),c=$('sc').value,e=m=>{$('fe2').textContent=m};
 if(!n)return e('Enter the student name.');
 if(!/^[A-Z0-9\/-]{2,15}$/.test(ad))return e('Enter an admission number using letters, numbers, / or -.');
 if(ST.some(x=>x.adm==ad))return e('That admission number is already in use.');
 if(!/^[A-Z0-9]{4,15}$/.test(up))return e('Enter a UPI number using letters and numbers only, 4 to 15 characters.');
 if(ST.some(x=>x.upi==up))return e('That UPI number is already in use.');
 if(!S.ph)return e('Add a passport photo.');
 const ins=await DB.from('students').insert({adm_no:ad,upi:up,full_name:n,class_id:CID[c]}).select('id').single();if(ins.error)return e(ins.error.message);
 const id=ins.data.id,opts=CLS.indexOf(c)>=9?[...document.querySelectorAll('.oc:checked')].map(o=>o.value).filter(v=>OPT.includes(v)):[];
 if(opts.length)await DB.from('student_subjects').insert(opts.map(v=>({student_id:id,subject_id:SID[v]})));
 try{const blob=await (await fetch(S.ph)).blob(),up2=await DB.storage.from('student-photos').upload(id+'/photo.jpg',blob,{contentType:'image/jpeg',upsert:true});if(!up2.error)await DB.from('students').update({photo_path:id+'/photo.jpg'}).eq('id',id)}catch(x){}
 S.ph=null;await refresh();S.perr='';S.note=`Added ${n} (${ad}) to ${c}. No marks yet. Teachers will enter them.`;draw()}
async function doRm(id){const x=ST[id];if(x.path)await DB.storage.from('student-photos').remove([x.path]);const r=await DB.from('students').delete().eq('id',x.uid);S.rm=null;
 if(r.error){S.note='';S.perr=r.error.message}else{await refresh();S.perr='';S.note=`${esc(x.name)} (${x.adm}) was removed, with their marks, fee record and parent links.`}draw()}
async function addTeach(){const n=V('tn'),c=$('tc').value,sb=$('ts').value,t=TEACH.find(y=>y.n.toLowerCase()==n.toLowerCase());S.note='';
 if(!n)S.perr='Enter the teacher name.';else if(!t)S.perr='No teacher account has that name. Add them under Staff accounts first.';else if(!subs(c).includes(sb))S.perr=`${c} does not take ${sb}. Pick a subject from that class.`;else if(t.a.some(a=>a[0]==c&&a[1]==sb))S.perr=`${esc(t.n)} already teaches ${sb} in ${c}.`;
 else{const r=await DB.from('teacher_assignments').insert({teacher_id:t.uid,class_id:CID[c],subject_id:SID[sb]});if(r.error)S.perr=r.error.message;else{await refresh();S.perr='';S.note=`${esc(t.n)} now teaches ${sb} in ${c}.`}}draw()}

// ---------- start-up ----------
function parentView(){if(!S.pa&&S.pmode=='forgot')return forgotCard();return parentViewBase()}
function forgotCard(){return `<div class="p" style="max-width:440px;margin:30px auto"><h2>Reset your password</h2><p class="mu" style="margin-top:0">Enter the email you registered with. We will send you a link to choose a new password.</p>${er()}<p><input id="fg_e" type="email" placeholder="Email address" style="width:100%" value="${esc(S.f.e||'')}" autocomplete="email" onkeydown="if(event.key=='Enter')sendReset()"></p><button class="b" onclick="sendReset()">Send reset link</button> <button class="b" style="${GH}" onclick="S.pmode='in';S.perr='';S.pinfo='';draw()">Back to sign in</button></div>`}
async function sendReset(){const em=V('fg_e').toLowerCase();S.f={e:em};S.pinfo='';
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){S.perr='Enter a valid email address.';return draw()}
 const r=await DB.auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname});
 if(r.error){S.perr=/rate|limit|seconds/i.test(r.error.message)?'Please wait a minute before asking for another link.':r.error.message;return draw()}
 S.perr='';S.pinfo='If that email has an account, a reset link is on its way. Check your inbox and your spam folder.';draw()}
function recoveryCard(){return `<div class="p" style="max-width:440px;margin:30px auto"><h2>Choose a new password</h2><p class="mu" style="margin-top:0">Enter a new password for your parent account.</p><p id="rc_e" class="bd" role="alert"></p><p><input id="rc_1" type="password" placeholder="New password (8+ characters)" style="width:100%" autocomplete="new-password"></p><p><input id="rc_2" type="password" placeholder="Confirm new password" style="width:100%" autocomplete="new-password" onkeydown="if(event.key=='Enter')saveRecovery()"></p><button class="b" onclick="saveRecovery()">Save password</button></div>`}
async function saveRecovery(){const a=$('rc_1').value,e=m=>{$('rc_e').textContent=m};if(a.length<8)return e('Choose a password with at least 8 characters.');if(a!=$('rc_2').value)return e('The two passwords do not match.');
 const u=await DB.auth.updateUser({password:a});if(u.error)return e(u.error.message);
 S.rec=false;try{history.replaceState(null,'',location.pathname)}catch(x){}S.pinfo='Password changed. You are now signed in.';await afterAuth()}
const _d3=draw;draw=function(){if(S.mc){shell();$('app').innerHTML=mcCard();return}if(S.rec){S.role='parent';shell();$('app').innerHTML=recoveryCard();return}_d3()};
// the emailed reset link brings people back here with a recovery session
if(/type=recovery/.test(location.hash))S.rec=true;
DB.auth.onAuthStateChange(ev=>{if(ev=='PASSWORD_RECOVERY'){S.rec=true;draw()}});
(async()=>{try{if(S.rec){draw();return}const s=await DB.auth.getSession();if(s.data&&s.data.session)await afterAuth()}catch(e){}})();

// ---------- attendance ----------
function todayStr(){return new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Nairobi'})}
function teacher(){const g=gate('teacher');if(g)return g;const mine=CT.filter(c=>c.uid==S.u.uid),ti=TEACH.findIndex(t=>t.n.toLowerCase()==S.u.name.toLowerCase()),hasSub=ti>=0&&TEACH[ti].a.length;
 if(!hasSub&&!mine.length)return bar()+'<div class="p"><p class="mu" style="margin:0">You have no classes assigned yet. Ask the admin to assign you a class and subject.</p></div>';
 let h=bar()+attTeacher(mine);if(hasSub){S.t=ti;if(S.asg>=TEACH[ti].a.length)S.asg=0;h+=teacherView()}else h+='<div class="p"><p class="mu" style="margin:0">You have no subject classes assigned yet.</p></div>';return h}
function attTeacher(mine){if(!mine.length)return '';if(S.ac==null||S.ac>=mine.length)S.ac=0;
 const c=mine[S.ac],td=todayStr(),wk=new Date(td+'T12:00').getDay(),weekend=wk==0||wk==6,list=ST.filter(x=>x.cls==c.cls),rec=x=>ATT[x.uid]&&ATT[x.uid][td],taken=list.some(rec),
 last=list.map(x=>rec(x)&&rec(x).t).filter(Boolean).sort().pop(),at=x=>rec(x)?rec(x).s:'present';
 return `<div class="p"><h2>Morning attendance: ${c.cls}</h2>${mine.length>1?`<p style="margin-top:0"><select aria-label="Class" onchange="S.ac=+this.value;draw()">${mine.map((m,i)=>`<option value="${i}" ${i==S.ac?'selected':''}>${m.cls}</option>`).join('')}</select></p>`:''}
<div class="msg" style="${taken||weekend?'':'background:var(--wn2);color:var(--wn)'}">${weekend?'Today is a weekend. Attendance is only taken on school days.':taken?`Attendance for ${fday(td)} was taken at ${new Date(last).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}. You can still correct it today.`:`Attendance for ${fday(td)} has not been taken yet.`}</div>
${list.length?`<div class="sc"><table><tr><th>Adm no.</th><th>Student</th><th>Status</th><th>Note</th></tr>${list.map(x=>`<tr><td>${x.adm}</td><td>${x.name}</td><td><select class="atsel" id="at_${x.id}" aria-label="Status for ${x.name}"><option value="present" ${at(x)=='present'?'selected':''}>Present</option><option value="late" ${at(x)=='late'?'selected':''}>Late</option><option value="absent" ${at(x)=='absent'?'selected':''}>Absent</option></select></td><td><input id="an_${x.id}" placeholder="Optional note" maxlength="200" value="${esc(rec(x)?rec(x).n:'')}" aria-label="Note for ${x.name}"></td></tr>`).join('')}</table></div>
<p style="margin:12px 0 0"><button class="b" style="${GH}" onclick="document.querySelectorAll('.atsel').forEach(e=>{e.value='present'})">Mark everyone present</button> <button class="b" onclick="saveAtt()" ${weekend?'disabled':''}>Save attendance</button></p>`:'<p class="mu" style="margin:0">There are no students in this class yet.</p>'}</div>`}
async function saveAtt(){const mine=CT.filter(c=>c.uid==S.u.uid),c=mine[S.ac||0],td=todayStr(),list=ST.filter(x=>x.cls==c.cls);
 const r=await DB.from('attendance').upsert(list.map(x=>({student_id:x.uid,att_date:td,status:$('at_'+x.id).value,note:V('an_'+x.id).replace(/[<>&"]/g,'')||null})),{onConflict:'student_id,att_date'});
 if(r.error){toast('Not saved: '+r.error.message,true);return}await refresh();toast('Attendance saved');draw()}
function ctPanel(){const rows=CLS.map((c,i)=>{const ct=CT.find(z=>z.cls==c);return `<tr><td>${c}</td><td><select id="ct_${i}" aria-label="Class teacher for ${c}"><option value="">Not assigned</option>${TEACH.map(t=>`<option value="${t.uid}" ${ct&&ct.uid==t.uid?'selected':''}>${esc(t.n)}</option>`).join('')}</select></td></tr>`}).join('');
 return `<div class="p"><h2>Class teachers</h2><p class="mu" style="margin-top:0">The class teacher takes attendance for their class every morning.</p><div class="sc"><table><tr><th>Class</th><th>Class teacher</th></tr>${rows}</table></div><p style="margin:10px 0 0"><button class="b" onclick="saveCT()">Save class teachers</button></p></div>`}
async function saveCT(){let err='';for(let i=0;i<CLS.length;i++){const c=CLS[i],v=$('ct_'+i).value,cur=CT.find(z=>z.cls==c);
  if(v&&(!cur||cur.uid!=v)){const r=await DB.from('class_teachers').upsert({class_id:CID[c],teacher_id:v},{onConflict:'class_id'});if(r.error)err=r.error.message}
  else if(!v&&cur){const r=await DB.from('class_teachers').delete().eq('class_id',CID[c]);if(r.error)err=r.error.message}}
 S.note='';S.perr=err;if(!err)S.note='Class teachers saved.';await refresh();draw()}
function attToday(){const td=todayStr(),wk=new Date(td+'T12:00').getDay(),wkend=wk==0||wk==6;
 const rows=CLS.map(c=>{const l=ST.filter(x=>x.cls==c);if(!l.length)return '';const rec=l.map(x=>ATT[x.uid]&&ATT[x.uid][td]).filter(Boolean),n=k=>rec.filter(r=>r.s==k).length,ct=CT.find(z=>z.cls==c),yr=l.filter(x=>x.att!=null);
  return `<tr><td>${c}</td><td>${ct?esc(ct.name):'<span class="mu">Not assigned</span>'}</td><td><span class="t ${rec.length?'':'wn'}">${rec.length?'Taken':'Not taken'}</span></td><td class="r">${rec.length?n('present'):'-'}</td><td class="r">${rec.length?n('late'):'-'}</td><td class="r">${rec.length?n('absent'):'-'}</td><td class="r">${yr.length?f1(avg(yr.map(x=>x.att)))+'%':'-'}</td></tr>`}).join('');
 return `<div class="p"><h2>Today's attendance: ${fday(td)}</h2>${wkend?'<p class="mu" style="margin-top:0">Today is a weekend.</p>':''}<div class="sc"><table><tr><th>Class</th><th>Class teacher</th><th>Register</th><th class="r">Present</th><th class="r">Late</th><th class="r">Absent</th><th class="r">Year rate</th></tr>${rows}</table></div></div>`}
function attPanel(x){const a=ATT[x.uid]||{},ds=Object.keys(a).sort().reverse().slice(0,14);
 return `<div class="p"><h2>Attendance</h2><p style="margin-top:0"><b>${x.att==null?'-':x.att+'%'}</b> <span class="mu">of school days attended this year</span></p>${ds.length?`<div style="display:flex;gap:8px;flex-wrap:wrap">${ds.map(d=>{const r=a[d];return `<div style="border:1px solid var(--bd);border-radius:8px;padding:6px 10px"><div class="mu" style="font-size:12px">${fday(d)}</div><span class="t ${r.s=='present'?'ok':r.s=='late'?'wn':'bad'}">${r.s[0].toUpperCase()+r.s.slice(1)}</span>${r.n?`<div class="mu" style="font-size:12px">${esc(r.n)}</div>`:''}</div>`}).join('')}</div>`:'<p class="mu" style="margin:0">No attendance has been recorded yet.</p>'}</div>`}

// ---------- issuing staff logins ----------
const genPw=()=>{const ch='abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789',b=crypto.getRandomValues(new Uint8Array(10));return Array.from(b,x=>ch[x%ch.length]).join('')+'A1'};
const AREAN={teacher:'Teacher',accounts:'Accounts',principal:'Principal & deputies',deputy:'Principal & deputies',admin:'Admin'};
const howTo=c=>`Open the ${AREAN[c.role]} tab and enter ${c.role=='admin'?'your staff code':'your full name, staff code'} and password. You will be asked to choose your own password straight away. Keep this private.`;
function loginText(c){return `${S.school} staff login\nName: ${c.name}\nRole: ${RL[c.role]}\nStaff code: ${c.code}\nPassword: ${c.pw}\nSign in at: ${location.origin+location.pathname}\n${howTo(c)}`}
function issuedPanel(){const L=S.iss||[];if(!L.length)return '';
 return `<div class="p pw" id="issued"><div class="row np" style="align-items:center"><h2 style="margin:0">Login details to hand out</h2><button class="b" onclick="printSlips()">Print</button><button class="b" style="${GH}" onclick="copyIssued()">Copy all</button><button class="b" style="${GH}" onclick="S.iss=[];draw()">Done, clear from screen</button></div><p class="mu np" style="margin:8px 0 12px">These passwords are shown once. After you clear them they cannot be looked up again. If someone loses theirs, use Reset password.</p>${L.map(c=>`<div class="lslip" style="border:1px solid var(--bd);border-radius:10px;padding:14px;margin-bottom:12px;background:var(--cd)"><b>${esc(S.school)} staff login</b><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:6px 16px;margin:10px 0"><div><span class="mu">Name</span><br><b>${esc(c.name)}</b></div><div><span class="mu">Role</span><br><b>${RL[c.role]}</b></div><div><span class="mu">Staff code</span><br><b>${esc(c.code)}</b></div><div><span class="mu">Password</span><br><b style="font-family:ui-monospace,Menlo,Consolas,monospace">${esc(c.pw)}</b></div></div><div class="mu" style="font-size:13px">Sign in at ${esc(location.origin+location.pathname)}. ${howTo(c)}</div></div>`).join('')}</div>`}
async function copyIssued(){try{await navigator.clipboard.writeText((S.iss||[]).map(loginText).join('\n\n'));toast('Copied')}catch(e){toast('Could not copy. Use Print instead.',true)}}
function showIssued(){setTimeout(()=>{const e=$('issued');if(e)e.scrollIntoView({behavior:'smooth',block:'start'})},60)}
function bulkStaffPanel(){const ro=Object.keys(RL).map(v=>`<option value="${v}" ${v=='teacher'?'selected':''}>${RL[v]}</option>`).join('');
 return `<div class="p"><h2>Add several staff at once</h2><p class="mu" style="margin-top:0">Type one full name per line. Each person gets a staff code and a random password, and you get a printable slip for every one.</p><p style="margin:0 0 8px"><textarea id="sb_n" rows="5" placeholder="Jane Wanjiru&#10;Peter Otieno&#10;Mary Achieng" style="width:100%;font:inherit;color:var(--tx);background:var(--bg);border:1px solid var(--bd);border-radius:7px;padding:7px 10px"></textarea></p><div class="row" style="align-items:center"><select id="sb_r" aria-label="Role">${ro}</select><button class="b" onclick="addBulk()">Create accounts</button></div><p id="sb_e" class="bd" role="alert" style="margin:8px 0 0"></p></div>`}
function staffPanel(){return issuedPanel()+staffPanelBase()+bulkStaffPanel()}
async function addStaff(){const n=V('st_n').replace(/[<>&"]/g,''),r=$('st_r').value,c=V('st_c').toUpperCase(),typed=$('st_p').value,e=m=>{$('st_e').textContent=m};
 if(!n)return e('Enter the full name.');if(typed&&typed.length<8)return e('A password you type needs at least 8 characters. Leave it blank to generate one.');
 const pw=typed||genPw();
 try{const d=await callAdmin({action:'create_staff',name:n,role:r,code:c,password:pw});await refresh();S.perr='';S.iss=[{name:d.name,role:r,code:d.code,pw}];S.note=`Added ${esc(d.name)} (${RL[r]}). Their login details are below.${r=='teacher'?' Assign their classes under Teachers and assignments.':''}`}catch(x){return e(x.message)}draw();showIssued()}
async function addBulk(){const names=$('sb_n').value.split('\n').map(x=>x.replace(/[<>&"]/g,'').trim()).filter(Boolean),r=$('sb_r').value,e=m=>{$('sb_e').textContent=m};
 if(!names.length)return e('Type one full name per line.');if(names.length>40)return e('Add up to 40 people at a time.');
 const ok=[],bad=[];for(const n of names){const pw=genPw();try{const d=await callAdmin({action:'create_staff',name:n,role:r,code:'',password:pw});ok.push({name:d.name,role:r,code:d.code,pw})}catch(x){bad.push(n+' ('+x.message+')')}}
 await refresh();S.perr=bad.length?'Not created: '+bad.join('; '):'';S.iss=ok;S.note=ok.length?`Created ${ok.length} account${ok.length==1?'':'s'}. Their login details are below.`:'';draw();if(ok.length)showIssued()}
async function resetStaff(i){const u=STAFF[i];try{const d=await callAdmin({action:'reset_password',user_id:u.uid});S.perr='';S.iss=[{name:u.name,role:u.role,code:u.code,pw:d.password}];S.note=`New password issued for ${esc(u.name)}. The details are below.`}catch(x){S.note='';S.perr=x.message}draw();showIssued()}


// ---------- end of year promotion ----------
const PP2=()=>CLS[2],TOP=()=>CLS[CLS.length-1];
const nextCls=c=>{const i=CLS.indexOf(c);return i<0?'':c==TOP()?'Leaves school (completes '+c+')':c==PP2()?CLS[i+1]+' (graduates from pre-primary)':CLS[i+1]};
function yeCounts(){const rep=(S.ye&&S.ye.rep)||[];let up=0,rp=0,done=0,gp=0;ST.forEach(x=>{if(CLS.indexOf(x.cls)<0)return;if(rep.indexOf(x.uid)>=0)rp++;else if(x.cls==TOP())done++;else{up++;if(x.cls==PP2())gp++}});return{up,rp,done,gp}}
function yeSummary(){const rep=(S.ye&&S.ye.rep)||[],c=yeCounts();
 const rows=CLS.map(k=>{const l=ST.filter(x=>x.cls==k);if(!l.length)return '';const r=l.filter(x=>rep.indexOf(x.uid)>=0).length;return `<tr><td>${k}</td><td class="r">${l.length}</td><td>${nextCls(k)}</td><td class="r">${r||'-'}</td></tr>`}).join('');
 return `<div class="sc"><table><tr><th>Class</th><th class="r">Students</th><th>Moves to</th><th class="r">Repeating</th></tr>${rows||'<tr><td colspan="4" class="mu">There are no students yet.</td></tr>'}</table></div><p style="margin:8px 0 0"><b>${c.up}</b> move up (including <b>${c.gp}</b> PP2 graduates), <b>${c.rp}</b> repeat, <b>${c.done}</b> leave school.</p>`}
function yearEndPanel(){const y=S.ay,nx=/^\d{4}$/.test(y)?String(+y+1):'',run=S.lastRun;if(!S.ye)S.ye={rep:[],yr:nx,confirm:false};
 const last=run?`<div class="msg"><b>Last promotion:</b> ${esc(run.from_year)} to ${esc(run.to_year)} on ${fd(run.run_at)}: ${run.promoted} moved up (${run.graduates} PP2 graduates), ${run.repeated} repeated, ${run.completed} left school. <button class="b" style="${GH}" onclick="undoPromo()">Undo</button> <span class="mu">Possible until marks or fees are entered for ${esc(run.to_year)}.</span></div>`:'';
 if(S.ye.confirm){const c=yeCounts();return `<div class="p"><h2>End of year promotion: confirm</h2>${last}<p style="margin-top:0">You are about to move <b>${c.up}</b> students up (<b>${c.gp}</b> of them PP2 graduates into ${CLS[3]}), keep <b>${c.rp}</b> in their class and let <b>${c.done}</b> leave after ${TOP()}. The academic year will change from <b>${esc(y)}</b> to <b>${esc(S.ye.yr)}</b> and the term will reset to Term 1.</p><p class="mu">Print the results slips for ${esc(y)} first. After this, each class shows its new list of students.</p><p id="ye_e" class="bd" role="alert" style="margin:0 0 8px"></p><div class="row" style="align-items:center"><input id="ye_c" placeholder="Type PROMOTE to confirm" autocomplete="off"><button class="b" onclick="runPromo()">Promote students</button><button class="b" style="${GH}" onclick="S.ye.confirm=false;draw()">Back</button></div></div>`}
 return `<div class="p"><h2>End of year promotion</h2>${last}<p class="mu" style="margin-top:0">When the academic year is over, this moves every student up one class. PP2 children graduate into ${CLS[3]}, and ${TOP()} students complete and leave. Marks stay on record under the year they were entered in. Print the last results slips for ${esc(y)} first, and if the school charges a graduation fee, bill it to PP2 under Accounts before promoting.</p>
<div class="row" style="align-items:center"><label class="mu">New academic year <input id="ye_yr" style="width:110px" value="${esc(S.ye.yr)}"></label></div>
<details style="margin:10px 0"><summary style="cursor:pointer">Students who repeat their class (<span id="ye_n">${S.ye.rep.length}</span>)</summary>${CLS.map(k=>{const l=ST.filter(x=>x.cls==k);return l.length?`<div style="margin:8px 0 2px"><b>${k}</b></div>${l.map(x=>`<label style="display:block;margin-left:12px"><input type="checkbox" ${S.ye.rep.indexOf(x.uid)>=0?'checked':''} onchange="toggleRep('${x.uid}',this.checked)"> ${x.name} <span class="mu">${x.adm}</span></label>`).join('')}`:''}).join('')}</details>
<div id="ye_sum">${yeSummary()}</div><p id="ye_e" class="bd" role="alert" style="margin:8px 0"></p><button class="b" onclick="startPromo()">Review and promote</button></div>`}
function gradPanel(){const run=S.lastRun;if(!run)return '';const g=ST.filter(x=>x.gy==run.from_year);if(!g.length)return '';
 return `<div class="p pw"><div class="row np" style="align-items:center"><h2 style="margin:0">PP2 graduation list ${esc(run.from_year)}</h2><button class="b" onclick="printSlips()">Print</button></div><h2 style="margin:10px 0 4px">${esc(S.school)}: PP2 graduation list ${esc(run.from_year)}</h2><p class="mu" style="margin:0 0 10px">Children who graduated from ${PP2()} into ${CLS[3]}.</p><div class="sc"><table><tr><th>No.</th><th>Adm no.</th><th>Name</th><th>Now in</th></tr>${g.map((x,i)=>`<tr><td>${i+1}</td><td>${x.adm}</td><td>${x.name}</td><td>${x.cls}</td></tr>`).join('')}</table></div></div>`}
function toggleRep(uid,on){const r=S.ye.rep,i=r.indexOf(uid);if(on&&i<0)r.push(uid);if(!on&&i>=0)r.splice(i,1);$('ye_sum').innerHTML=yeSummary();$('ye_n').textContent=r.length}
function startPromo(){const y=V('ye_yr'),e=m=>{$('ye_e').textContent=m};S.ye.yr=y;
 if(!y)return e('Enter the new academic year.');if(y==S.ay)return e('The new year must be different from the current year ('+S.ay+').');if(!ST.length)return e('There are no students to promote.');
 S.ye.confirm=true;draw()}
async function runPromo(){const e=m=>{$('ye_e').textContent=m};if(V('ye_c')!='PROMOTE')return e('Type PROMOTE exactly to confirm.');
 const r=await DB.rpc('promote_students',{p_new_year:S.ye.yr,p_repeat:S.ye.rep});if(r.error)return e(r.error.message);
 const d=r.data;S.ye=null;S.pt=S.rt=0;S.ex=0;await refresh();S.perr='';S.note=`Promotion done: ${d.promoted} moved up (${d.graduates} PP2 graduates), ${d.repeated} repeated, ${d.completed} left school. The academic year is now ${esc(d.year)}, Term 1.`;draw()}
async function undoPromo(){if(!confirm('Undo the last promotion? Students go back to their old classes and the academic year goes back.'))return;
 const r=await DB.rpc('undo_promotion');if(r.error){S.note='';S.perr=r.error.message}else{S.ye=null;await refresh();S.perr='';S.note=`Promotion undone. ${r.data.restored} students are back in their old classes and the year is ${esc(r.data.year)}.`}draw()}

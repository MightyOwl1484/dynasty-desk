import { createFixture } from './domain/models.js';
import { resolveFixture } from './domain/simulation.js';

(() => {
  'use strict';
  const CLUBS = [
    ['Northport Athletic','NPA','#c7f36b','Harbour Ground'],['Ironvale Rovers','IVR','#f4c95d','Foundry Park'],
    ['Kingsbridge FC','KBF','#ef7f6d','Crown Lane'],['Ashcombe Town','ASH','#74b9ff','The Grove'],
    ['Redhaven United','RHU','#ff6577','Beacon Field'],['Westmere City','WMC','#bd9cff','Merebank'],
    ['Calder & Co.','CAL','#5ee6c4','Calder Works'],['Stonemarch Albion','SMA','#ff9f43','March End']
  ].map((c,i)=>({id:i,name:c[0],short:c[1],color:c[2],ground:c[3],reputation:78-i*2}));
  const FIRST=['Jamie','Ellis','Morgan','Theo','Rory','Alex','Sam','Callum','Noah','Luca','Owen','Kai','Finley','Max','Reece','Charlie','Rowan','Ari','Milo','Jude','Elliot','Drew','Taylor','Robin'];
  const LAST=['Mercer','Vale','Okoro','Sato','Doyle','Khan','Bennett','Silva','Price','Hughes','Foster','Ibarra','Nolan','Costa','Wright','Patel','Morris','Reid','Clarke','Young','Bishop','Perry','Hayes','Stone'];
  const POSITIONS=['GK','GK','DEF','DEF','DEF','DEF','DEF','DEF','MID','MID','MID','MID','MID','MID','FWD','FWD','FWD','FWD'];
  const SAVE_KEY='dynasty-desk-save-v1';
  let replayState={events:[],index:0,timer:null,result:null};
  let game = load(); let selectedClub = null;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const ordinal=n=>n+(n%10===1&&n%100!==11?'st':n%10===2&&n%100!==12?'nd':n%10===3&&n%100!==13?'rd':'th');
  function hashRand(seed){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}
  function rand(){game.seed=(game.seed+1)>>>0;return hashRand(game.seed)}
  function poisson(lambda){let l=Math.exp(-lambda),p=1,k=0;do{k++;p*=rand()}while(p>l&&k<10);return k-1}
  function initials(name){return name.split(' ').map(x=>x[0]).join('').slice(0,2)}
  function makeGame(clubId){
    const temp={seed:261126,week:0,season:1,userClub:clubId,clubs:JSON.parse(JSON.stringify(CLUBS)),fixtures:[],news:[],lastResult:null}; game=temp;
    game.clubs.forEach((club,ci)=>{
      club.players=POSITIONS.map((pos,pi)=>{const base=57+Math.floor(rand()*22)+(club.reputation-65)*.28;return{id:`${ci}-${pi}`,name:`${FIRST[Math.floor(rand()*FIRST.length)]} ${LAST[Math.floor(rand()*LAST.length)]}`,pos,age:18+Math.floor(rand()*16),rating:Math.min(84,Math.round(base)),potential:Math.min(91,Math.round(base+rand()*12)),fitness:92+Math.floor(rand()*9),goals:0,apps:0,starting:false}});
      const choose=(pos,n)=>club.players.filter(p=>p.pos===pos).sort((a,b)=>b.rating-a.rating).slice(0,n).forEach(p=>p.starting=true);
      choose('GK',1);choose('DEF',4);choose('MID',4);choose('FWD',2);
      club.stats={p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0};
    });
    game.fixtures=roundRobin(game.clubs.map(c=>c.id));
    pushNews('The board welcomes you',`Your first objective is straightforward: establish ${club().name} in the top half and develop the squad without risking the club’s future.`);
    pushNews('Preseason report','The analysts have completed their initial ratings. Potential is an estimate, not a promise; minutes, age and form will influence development.');
    save();return game;
  }
  function roundRobin(ids){
    const rounds=[], a=[...ids];
    for(let r=0;r<a.length-1;r++){const week=[];for(let i=0;i<a.length/2;i++){let home=a[i],away=a[a.length-1-i];if(r%2){[home,away]=[away,home]}week.push({home,away,played:false,score:null})}rounds.push(week);a.splice(1,0,a.pop())}
    const reverse=rounds.map(w=>w.map(f=>({home:f.away,away:f.home,played:false,score:null})));return [...rounds,...reverse];
  }
  function save(){localStorage.setItem(SAVE_KEY,JSON.stringify(game))}
  function load(){try{return JSON.parse(localStorage.getItem(SAVE_KEY))}catch{return null}}
  function club(id=game.userClub){return game.clubs[id]}
  function fixtureFor(id,week=game.week){return game.fixtures[week]?.find(f=>f.home===id||f.away===id)}
  function table(){return [...game.clubs].sort((a,b)=>b.stats.pts-a.stats.pts||(b.stats.gf-b.stats.ga)-(a.stats.gf-a.stats.ga)||b.stats.gf-a.stats.gf)}
  function teamStrength(team,tactic='balanced'){
    const xi=team.players.filter(p=>p.starting);const active=xi.length===11?xi:[...team.players].sort((a,b)=>b.rating-a.rating).slice(0,11);
    const fit=active.reduce((s,p)=>s+p.rating*(.76+p.fitness/420),0)/11;
    const mods={balanced:0,press:.8,counter:.35,control:.6};return fit+(mods[tactic]||0);
  }
  function simulate(f,tactic){
    const home=club(f.home),away=club(f.away);const userHome=f.home===game.userClub;
    const fixture=createFixture({id:`${game.week}-${f.home}-${f.away}`,homeClubId:String(home.id),awayClubId:String(away.id),status:f.played?'played':'scheduled'});
    const result=resolveFixture({fixture,homeClub:toDomainClub(home),awayClub:toDomainClub(away),homeTactic:userHome?tactic:'balanced',awayTactic:userHome?'balanced':tactic,seed:game.seed});
    const hg=result.homeGoals,ag=result.awayGoals;f.played=true;f.score=[hg,ag];game.seed=(game.seed+97)>>>0;updateStats(home,away,hg,ag);assignGoals(home,hg);assignGoals(away,ag);return{home,away,hg,ag,events:result.events};
  }
  function toDomainClub(team){return{id:String(team.id),name:team.name,reputation:team.reputation,players:team.players.map(p=>({id:p.id,name:p.name,position:p.pos,rating:p.rating,potential:p.potential,fitness:p.fitness,starting:p.starting}))}}
  function updateStats(h,a,hg,ag){h.stats.p++;a.stats.p++;h.stats.gf+=hg;h.stats.ga+=ag;a.stats.gf+=ag;a.stats.ga+=hg;if(hg>ag){h.stats.w++;a.stats.l++;h.stats.pts+=3}else if(ag>hg){a.stats.w++;h.stats.l++;a.stats.pts+=3}else{h.stats.d++;a.stats.d++;h.stats.pts++;a.stats.pts++}}
  function assignGoals(team,n){const xi=team.players.filter(p=>p.starting);xi.forEach(p=>p.apps++);for(let i=0;i<n;i++){const pool=xi.flatMap(p=>Array(p.pos==='FWD'?5:p.pos==='MID'?3:1).fill(p));pool[Math.floor(rand()*pool.length)].goals++}}
  function conditionSquads(){game.clubs.forEach(t=>t.players.forEach(p=>{p.fitness=Math.min(100,Math.max(55,p.fitness+(p.starting?-(5+Math.floor(rand()*8)):4)));if(game.week%4===0&&p.age<25&&p.rating<p.potential&&rand()<.17)p.rating++}))}
  function pushNews(title,text){game.news.unshift({week:game.week,title,text,read:false})}
  function playWeek(){
    if(game.week>=game.fixtures.length)return;const tactic=$('#tacticSelect').value;let result;
    game.fixtures[game.week].forEach(f=>{const r=simulate(f,(f.home===game.userClub||f.away===game.userClub)?tactic:'balanced');if(f.home===game.userClub||f.away===game.userClub)result=r});
    conditionSquads();game.lastResult=result;const usHome=result.home.id===game.userClub,us=usHome?result.hg:result.ag,them=usHome?result.ag:result.hg,opp=usHome?result.away:result.home;
    const tone=us>them?'Victory secured':us===them?'Points shared':'A difficult afternoon';
    pushNews(tone,`${club().name} ${us}–${them} ${opp.name}. ${us>them?'The board noted the impact of your selection and approach.':us===them?'The analysts see useful lessons in a balanced contest.':'The staff will review the tactical matchups before the next fixture.'}`);
    game.week++;
    if(game.week===game.fixtures.length){const pos=table().findIndex(t=>t.id===game.userClub)+1;pushNews('Season complete',`${club().name} finish ${ordinal(pos)} with ${club().stats.pts} points. Your career record has been saved on this device.`)}
    save();showResult(result,us,them,opp,tone);render();
  }
  function showResult(r,us,them,opp,tone){
    const usHome=r.home.id===game.userClub;$('#resultScore').textContent=`${us} — ${them}`;$('#resultHeadline').textContent=`${tone} against ${opp.name}`;
    const events=r.events.map(event=>[event.minute,String(event.teamId)===String(club().id)?club().short:String(event.teamId)===String(opp.id)?opp.short:'MATCH',event.text]);
    $('#commentary').innerHTML=events.map(e=>`<p><b>${e[0]}′ ${e[1]}</b> <span>${e[2]}</span></p>`).join('');
    replayState={events:r.events,index:0,timer:null,result:{home:r.home,away:r.away,score:`${us} — ${them}`}};
    $('#replayTitle').textContent=`${r.home.name} ${usHome?us:them} — ${usHome?them:us} ${r.away.name}`;renderReplay();$('#resultDialog').showModal();
  }
  function renderReplay(){const r=replayState.result;const home=r?.home,away=r?.away;if(!home||!away)return;$('#replayPitch').innerHTML=`<span class="replay-team replay-home" style="--team:${home.color}">${home.short}</span><span class="replay-team replay-away" style="--team:${away.color}">${away.short}</span><span class="replay-ball">●</span>`;$('#replayEvents').innerHTML=replayState.events.slice(0,replayState.index).map(e=>`<p><b>${e.minute}′</b> <span>${e.text}</span></p>`).join('');const current=replayState.events[replayState.index-1];$('#replayStatus').textContent=replayState.index>=replayState.events.length?'Replay complete. The final result is unchanged.':current?`${current.minute}′ — ${current.text}`:'Ready to replay the match events.'}
  function advanceReplay(){if(replayState.index>=replayState.events.length){replayState.timer=null;renderReplay();return}const event=replayState.events[replayState.index++];$('#replayStatus').textContent=`${event.minute}′ — ${event.text}`;renderReplay();if(replayState.index<replayState.events.length)replayState.timer=setTimeout(advanceReplay,900);else replayState.timer=null}
  function startReplay(){if(replayState.timer)return;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(replayState.index>=replayState.events.length){replayState.index=0;renderReplay()}if(reduced){replayState.index=replayState.events.length;renderReplay();return}advanceReplay()}
  function skipReplay(){if(replayState.timer)clearTimeout(replayState.timer);replayState.timer=null;replayState.index=replayState.events.length;renderReplay()}
  function render(){if(!game){$('#setup').hidden=false;$('#game').hidden=true;renderPicker();return}$('#setup').hidden=true;$('#game').hidden=false;const c=club();
    $('#clubName').textContent=$('#mobileClub').textContent=c.name;$('#clubMeta').textContent=`${c.ground} · Season ${game.season}`;setBadge($('#clubCrest'),c);setBadge($('#mobileCrest'),c);$('#weekNumber').textContent=Math.min(game.week+1,game.fixtures.length);$('#greeting').textContent=game.week>=game.fixtures.length?'Season review':'Your match desk.';
    $('#record').textContent=`${c.stats.w}W  ${c.stats.d}D  ${c.stats.l}L`;$('#newsBadge').textContent=game.news.filter(n=>!n.read).length||'';renderDesk();renderSquad();renderTable();renderNews();
  }
  function setBadge(el,t){el.textContent=t.short;el.style.setProperty('--team',t.color)}
  function renderDesk(){const c=club(),f=fixtureFor(c.id);if(!f){$('#homeTeam').textContent='Season';$('#awayTeam').textContent='Complete';$('#playMatch').disabled=true;$('#fixtureVenue').textContent='Final table';$('#fixtureRound').textContent='14/14';$('#formGuide').textContent=`${c.stats.pts} PTS`;}
    else{const h=club(f.home),a=club(f.away);$('#homeTeam').textContent=h.name;$('#awayTeam').textContent=a.name;setBadge($('#homeBadge'),h);setBadge($('#awayBadge'),a);$('#fixtureVenue').textContent=f.home===c.id?'Home':'Away';$('#fixtureRound').textContent=`Week ${game.week+1}`;$('#formGuide').textContent=`${h.stats.pts} PTS · ${a.stats.pts} PTS`;$('#playMatch').disabled=c.players.filter(p=>p.starting).length!==11}
    const pos=table().findIndex(t=>t.id===c.id)+1;$('#leaguePosition').textContent=ordinal(pos);$('#miniTable').innerHTML=table().slice(Math.max(0,pos-2),Math.min(8,pos+2)).map((t,i)=>`<div class="mini-row ${t.id===c.id?'you':''}"><span>${table().indexOf(t)+1}</span><span>${t.name}</span><b>${t.stats.pts}</b></div>`).join('');
    renderPitch();const avg=Math.round(c.players.reduce((s,p)=>s+p.fitness,0)/c.players.length);const top=[...c.players].sort((a,b)=>b.rating-a.rating)[0];$('#briefingDate').textContent=`W${game.week+1}`;$('#briefing').innerHTML=`<h3>${avg<75?'Rotation advised':'Squad ready'}</h3><p>${avg<75?'Several starters are carrying fatigue. Fresh legs may protect performance.':'Fitness levels are healthy. Your chosen approach should be sustainable for the next fixture.'}</p><div class="brief-stat"><span>Fitness ${avg}%</span><span>Top rated ${top.name} · ${top.rating}</span></div>`;
  }
  function renderPitch(){const xi=club().players.filter(p=>p.starting);const slots={GK:[[8,50]],DEF:[[28,18],[28,39],[28,61],[28,82]],MID:[[57,15],[57,38],[57,62],[57,85]],FWD:[[84,35],[84,65]]};const used={GK:0,DEF:0,MID:0,FWD:0};$('#miniPitch').innerHTML=xi.map(p=>{const s=slots[p.pos][used[p.pos]++]||[50,50];return `<span class="pitch-player" title="${p.name}" style="left:${s[0]}%;top:${s[1]}%">${initials(p.name)}</span>`}).join('')}
  function playerRow(p){return `<button class="player-row" data-player="${p.id}"><span class="player-pos">${p.pos}</span><span class="player-name"><strong>${p.name}</strong><span>${p.age} yrs · Potential ${p.potential}</span></span><b class="rating">${p.rating}</b><span class="fitness">${p.fitness}%<i style="width:${p.fitness}%"></i></span></button>`}
  function renderSquad(){const players=club().players;const xi=players.filter(p=>p.starting).sort(posSort),bench=players.filter(p=>!p.starting).sort(posSort);$('#xiCount').textContent=`${xi.length}/11`;$('#startingList').innerHTML=xi.map(playerRow).join('');$('#benchList').innerHTML=bench.map(playerRow).join('');$$('[data-player]').forEach(b=>b.onclick=()=>togglePlayer(b.dataset.player))}
  function posSort(a,b){return ['GK','DEF','MID','FWD'].indexOf(a.pos)-['GK','DEF','MID','FWD'].indexOf(b.pos)||b.rating-a.rating}
  function togglePlayer(id){const p=club().players.find(x=>x.id===id),count=club().players.filter(x=>x.starting).length;if(!p.starting&&count>=11){flash('The starting XI is full. Remove a player first.');return}if(p.starting&&count<=1)return;p.starting=!p.starting;save();render();}
  function flash(msg){const old=$('.save-state span').textContent;$('.save-state span').textContent=msg;setTimeout(()=>$('.save-state span').textContent=old,1800)}
  function renderTable(){const c=club();$('#fullTable').innerHTML=table().map((t,i)=>`<tr class="${t.id===c.id?'you':''}"><td>${i+1}</td><td><span class="team-cell"><i class="table-dot" style="--team:${t.color}"></i>${t.name}</span></td><td>${t.stats.p}</td><td>${t.stats.w}</td><td>${t.stats.d}</td><td>${t.stats.l}</td><td>${t.stats.gf-t.stats.ga}</td><td><b>${t.stats.pts}</b></td></tr>`).join('')}
  function renderNews(){game.news.forEach(n=>n.read=true);save();$('#newsBadge').textContent='';$('#newsList').innerHTML=game.news.map(n=>`<article class="news-item"><time>WEEK ${n.week+1}</time><div><h3>${n.title}</h3><p>${n.text}</p></div></article>`).join('')}
  function renderPicker(){const root=$('#clubPicker');root.innerHTML=CLUBS.map(c=>`<button class="club-option" data-club="${c.id}" aria-pressed="${c.id===selectedClub}"><b style="color:${c.color}">${c.short}</b><span>${c.name}</span></button>`).join('');$$('[data-club]').forEach(b=>b.onclick=()=>{selectedClub=+b.dataset.club;$$('[data-club]').forEach(x=>{const selected=x===b;x.classList.toggle('selected',selected);x.setAttribute('aria-pressed',String(selected))});$('#startGame').disabled=false})}
  function switchView(name){$$('.view').forEach(v=>v.classList.toggle('active-view',v.id===`${name}View`));$$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===name));$('.sidebar').classList.remove('open');if(name==='news')renderNews()}
  $('#startGame').onclick=()=>{makeGame(selectedClub);render()};$('#playMatch').onclick=playWeek;$('#resetGame').onclick=()=>{if(confirm('Start over? Your current career will be removed from this device.')){localStorage.removeItem(SAVE_KEY);game=null;selectedClub=null;render()}};
  $$('.nav-item').forEach(n=>n.onclick=()=>switchView(n.dataset.view));$$('[data-go]').forEach(n=>n.onclick=()=>switchView(n.dataset.go));$('#mobileMenu').onclick=()=>$('.sidebar').classList.toggle('open');$('#continueBtn').onclick=()=>$('#resultDialog').close();$('#replayBtn').onclick=()=>{$('#resultDialog').close();$('#replayDialog').showModal()};$('#replayClose').onclick=()=>{$('#replayDialog').close();if(replayState.timer)clearTimeout(replayState.timer);replayState.timer=null};$('#replayPlay').onclick=startReplay;$('#replaySkip').onclick=skipReplay;
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});render();
})();

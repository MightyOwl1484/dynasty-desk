import { createFixture } from '../domain/models.js';
import { resolveFixture } from '../domain/simulation.js';
import { advanceOffseason, createSeasonReview } from '../domain/offseason.js';
import { createLocalGameStore } from '../stores/local.js';

(() => {
  'use strict';
  const CLUBS = [
    ['Northport Athletic','NPA','#c7f36b','Harbour Ground','Title contender','Strongest squad; a forgiving first career.'],['Ironvale Rovers','IVR','#f4c95d','Foundry Park','Promotion energy','Physical, ambitious, and ready to press.'],
    ['Kingsbridge FC','KBF','#ef7f6d','Crown Lane','Balanced project','Good foundations with room for your ideas.'],['Ashcombe Town','ASH','#74b9ff','The Grove','Youth pathway','Develop emerging players over quick fixes.'],
    ['Redhaven United','RHU','#ff6577','Beacon Field','Counter threat','Direct football and dangerous forwards.'],['Westmere City','WMC','#bd9cff','Merebank','Possession rebuild','Technical players in need of consistency.'],
    ['Calder & Co.','CAL','#5ee6c4','Calder Works','Community club','A patient project with modest expectations.'],['Stonemarch Albion','SMA','#ff9f43','March End','Underdog challenge','The toughest job and the biggest upside.']
  ].map((c,i)=>({id:i,name:c[0],short:c[1],color:c[2],ground:c[3],identity:c[4],description:c[5],reputation:78-i*2}));
  const FIRST=['Jamie','Ellis','Morgan','Theo','Rory','Alex','Sam','Callum','Noah','Luca','Owen','Kai','Finley','Max','Reece','Charlie','Rowan','Ari','Milo','Jude','Elliot','Drew','Taylor','Robin'];
  const LAST=['Mercer','Vale','Okoro','Sato','Doyle','Khan','Bennett','Silva','Price','Hughes','Foster','Ibarra','Nolan','Costa','Wright','Patel','Morris','Reid','Clarke','Young','Bishop','Perry','Hayes','Stone'];
  const POSITIONS=['GK','GK','DEF','DEF','DEF','DEF','DEF','DEF','MID','MID','MID','MID','MID','MID','FWD','FWD','FWD','FWD'];
  const SAVE_KEY='dynasty-desk-save-v1';
  function availableStorage(){
    try{const storage=globalThis.localStorage,testKey='dynasty-desk-storage-test';storage.setItem(testKey,'1');storage.removeItem(testKey);return storage}
    catch{const memory=new Map();return{getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)}}
  }
  const store=createLocalGameStore(availableStorage(),SAVE_KEY);
  let replayState={events:[],index:0,timer:null,result:null,speed:1,durationMs:30000};
  let game = load(); let selectedClub = null; let tourStep=0;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const ordinal=n=>n+(n%10===1&&n%100!==11?'st':n%10===2&&n%100!==12?'nd':n%10===3&&n%100!==13?'rd':'th');
  function hashRand(seed){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}
  function rand(){game.seed=(game.seed+1)>>>0;return hashRand(game.seed)}
  function poisson(lambda){let l=Math.exp(-lambda),p=1,k=0;do{k++;p*=rand()}while(p>l&&k<10);return k-1}
  function initials(name){return name.split(' ').map(x=>x[0]).join('').slice(0,2)}
  function makeGame(clubId){
    const temp={seed:261126,week:0,season:1,userClub:clubId,clubs:JSON.parse(JSON.stringify(CLUBS)),fixtures:[],news:[],seasonHistory:[],lastResult:null,tourSeen:false}; game=temp;
    game.clubs.forEach((club,ci)=>{
      club.players=POSITIONS.map((pos,pi)=>{const base=57+Math.floor(rand()*22)+(club.reputation-65)*.28,rating=Math.min(84,Math.round(base));return{id:`${ci}-${pi}`,name:`${FIRST[Math.floor(rand()*FIRST.length)]} ${LAST[Math.floor(rand()*LAST.length)]}`,pos,age:18+Math.floor(rand()*16),rating,potential:Math.min(91,Math.round(base+rand()*12)),fitness:92+Math.floor(rand()*9),morale:70,seasonStartRating:rating,goals:0,apps:0,starting:false}});
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
  function save(){store.save(game)}
  function load(){return store.load()}
  function updateTacticHelp(){const help={balanced:'Reliable shape; preserves fitness.',press:'More pressure and chances; increases fatigue.',counter:'Protects shape; rewards space behind the opponent.',control:'Keeps the ball; favors lower-risk chance creation.'};const select=$('#tacticSelect');if(select)$('#tacticHelp').textContent=help[select.value]||help.balanced}
  function exportSave(){if(!game)return;const blob=new Blob([JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),data:game},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`dynasty-desk-season-${game.season}-week-${game.week}.json`;link.click();URL.revokeObjectURL(url);flash('Career backup downloaded.');}
  async function importSave(file){try{game=store.importText(await file.text());selectedClub=game.userClub;render();flash('Career backup imported.')}catch{flash('That file could not be imported.');}}
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
  function toDomainClub(team){return{id:String(team.id),name:team.name,reputation:team.reputation,players:team.players.map(p=>({id:p.id,name:p.name,position:p.pos,age:p.age,rating:p.rating,potential:p.potential,fitness:p.fitness,morale:p.morale??70,appearances:p.apps??0,goals:p.goals??0,seasonStartRating:p.seasonStartRating??p.rating,starting:p.starting})),stats:{played:team.stats.p,wins:team.stats.w,draws:team.stats.d,losses:team.stats.l,goalsFor:team.stats.gf,goalsAgainst:team.stats.ga,points:team.stats.pts}}}
  function latestSeasonReview(){return game.seasonHistory?.at(-1)??null}
  function recordSeasonReview(){game.seasonHistory??=[];const existing=latestSeasonReview();if(existing?.season===game.season)return existing;const review=createSeasonReview({season:game.season,clubs:game.clubs.map(toDomainClub),userClubId:String(game.userClub)});game.seasonHistory.push(review);return review}
  function applyOffseason(){if(game.week<game.fixtures.length)return;const progressed=advanceOffseason({clubs:game.clubs.map(toDomainClub),seed:game.seed}),byClub=new Map(progressed.clubs.map(c=>[String(c.id),c]));game.clubs=game.clubs.map(team=>{const next=byClub.get(String(team.id)),byPlayer=new Map(next.players.map(p=>[String(p.id),p]));return{...team,players:team.players.map(player=>{const nextPlayer=byPlayer.get(String(player.id));return{...player,age:nextPlayer.age,rating:nextPlayer.rating,fitness:nextPlayer.fitness,morale:nextPlayer.morale,apps:0,goals:0,seasonStartRating:nextPlayer.seasonStartRating}}),stats:{p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}}});game.seed=progressed.seed;game.season++;game.week=0;game.fixtures=roundRobin(game.clubs.map(c=>c.id));game.lastResult=null;pushNews(`Season ${game.season} begins`,`${club().name} return with ${progressed.changes.filter(change=>String(change.clubId)===String(game.userClub)&&change.delta>0).length} improved players. The board expects another competitive campaign.`);save();if($('#seasonDialog').open)$('#seasonDialog').close();render();requestAnimationFrame(()=>$('#greeting').focus())}
  function showSeasonReview(){const review=latestSeasonReview()??recordSeasonReview();$('#seasonTitle').textContent=`Season ${review.season} review`;$('#seasonSummary').textContent=`${review.userClub.clubName} finished ${ordinal(review.userClub.position)} with ${review.userClub.points} points. ${review.champion.clubName} were champions.`;$('#seasonAwards').innerHTML=`<article><span>Champions</span><strong>${review.champion.clubName} · ${review.champion.points} pts</strong></article><article><span>League top scorer</span><strong>${review.topScorer.name} · ${review.topScorer.goals} goals</strong></article><article><span>Club player of season</span><strong>${review.clubPlayerOfSeason.name} · ${review.clubPlayerOfSeason.goals} goals</strong></article>`;$('#seasonPlayerStats').innerHTML=review.squad.map(player=>{const change=player.ratingChange,changeText=change>0?`+${change}`:String(change);return`<tr><td>${player.name}</td><td>${player.position}</td><td>${player.appearances}</td><td>${player.goals}</td><td>${player.rating}</td><td class="${change>0?'rating-up':change<0?'rating-down':''}">${changeText}</td></tr>`}).join('');$('#seasonAdvance').textContent=$('#startNextSeason').textContent=`Begin season ${game.season+1}`;$('#seasonDialog').showModal()}
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
    if(game.week===game.fixtures.length){const review=recordSeasonReview();pushNews('Season complete',`${club().name} finish ${ordinal(review.userClub.position)} with ${review.userClub.points} points. ${review.clubPlayerOfSeason.name} is your player of the season.`)}
    save();showResult(result,us,them,opp,tone,tactic);render();
  }
  function showResult(r,us,them,opp,tone,tactic){
    const usHome=r.home.id===game.userClub;$('#resultScore').textContent=`${us} — ${them}`;$('#resultHeadline').textContent=`${tone} against ${opp.name}`;
    const explanations={balanced:'Balanced kept the team adaptable across both phases.',press:'High press created more pressure, but the extra running will affect recovery.',counter:'Counter-attacking protected the shape and looked for space after turnovers.',control:'Control prioritized possession and reduced the match\'s volatility.'};$('#resultExplanation').textContent=explanations[tactic]||explanations.balanced;
    const events=r.events.map(event=>[event.minute,String(event.teamId)===String(club().id)?club().short:String(event.teamId)===String(opp.id)?opp.short:'MATCH',event.text]);
    $('#commentary').innerHTML=events.map(e=>`<p><b>${e[0]}′ ${e[1]}</b> <span>${e[2]}</span></p>`).join('');
    replayState={events:r.events,index:0,timer:null,result:{home:r.home,away:r.away,score:`${us} — ${them}`},speed:1,durationMs:30000};$('#replaySpeed').value='1';$('#replayDuration').value='30000';
    $('#replayTitle').textContent=`${r.home.name} ${usHome?us:them} — ${usHome?them:us} ${r.away.name}`;renderReplay();$('#resultDialog').showModal();
  }
  function renderReplay(){const r=replayState.result;const home=r?.home,away=r?.away;if(!home||!away)return;$('#replayPitch').innerHTML=`<span class="replay-team replay-home" style="--team:${home.color}">${home.short}</span><span class="replay-team replay-away" style="--team:${away.color}">${away.short}</span><span class="replay-ball">●</span>`;$('#replayEvents').innerHTML=replayState.events.slice(0,replayState.index).map(e=>`<p><b>${e.minute}′</b> <span>${e.text}</span></p>`).join('');const current=replayState.events[replayState.index-1];$('#replayStatus').textContent=replayState.index>=replayState.events.length?'Replay complete. The final result is unchanged.':current?`${current.minute}′ — ${current.text}`:'Ready to replay the match events.'}
  function replayDelay(){return Math.max(250,replayState.durationMs/Math.max(replayState.events.length,1)/replayState.speed)}
  function advanceReplay(){if(replayState.index>=replayState.events.length){replayState.timer=null;renderReplay();return}const event=replayState.events[replayState.index++];$('#replayStatus').textContent=`${event.minute}′ — ${event.text}`;renderReplay();if(replayState.index<replayState.events.length)replayState.timer=setTimeout(advanceReplay,replayDelay());else replayState.timer=null}
  function startReplay(){if(replayState.timer)return;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(replayState.index>=replayState.events.length){replayState.index=0;renderReplay()}if(reduced){replayState.index=replayState.events.length;renderReplay();return}advanceReplay()}
  function skipReplay(){if(replayState.timer)clearTimeout(replayState.timer);replayState.timer=null;replayState.index=replayState.events.length;renderReplay()}
  function pauseReplay(){if(replayState.timer){clearTimeout(replayState.timer);replayState.timer=null;$('#replayStatus').textContent='Replay paused.'}}
  function render(){if(!game){$('#setup').hidden=false;$('#game').hidden=true;renderPicker();return}$('#setup').hidden=true;$('#game').hidden=false;const c=club();
    $('#clubName').textContent=$('#mobileClub').textContent=c.name;$('#clubMeta').textContent=`${c.ground} · Season ${game.season}`;setBadge($('#clubCrest'),c);setBadge($('#mobileCrest'),c);$('#weekNumber').textContent=Math.min(game.week+1,game.fixtures.length);$('#greeting').textContent=game.week>=game.fixtures.length?'Season review':'Your match desk.';
    $('#record').textContent=`${c.stats.w}W  ${c.stats.d}D  ${c.stats.l}L`;$('#newsBadge').textContent=game.news.filter(n=>!n.read).length||'';renderDesk();renderSquad();renderTable();renderNews();
  }
  function setBadge(el,t){el.textContent=t.short;el.style.setProperty('--team',t.color)}
  function renderDesk(){const c=club(),f=fixtureFor(c.id),seasonComplete=!f;$('#tacticControls').hidden=seasonComplete;$('#playMatch').hidden=seasonComplete;$('#offseasonActions').hidden=!seasonComplete;if(!f){$('#homeTeam').textContent=`Season ${game.season}`;$('#awayTeam').textContent='Complete';$('#homeBadge').textContent='✓';$('#awayBadge').textContent=ordinal(table().findIndex(t=>t.id===c.id)+1);$('#fixtureVenue').textContent='Final table';$('#fixtureRound').textContent=`${game.fixtures.length}/${game.fixtures.length}`;$('#formGuide').textContent=`${c.stats.pts} PTS`;$('#startNextSeason').textContent=`Begin season ${game.season+1}`;}
    else{const h=club(f.home),a=club(f.away);$('#homeTeam').textContent=h.name;$('#awayTeam').textContent=a.name;setBadge($('#homeBadge'),h);setBadge($('#awayBadge'),a);$('#fixtureVenue').textContent=f.home===c.id?'Home':'Away';$('#fixtureRound').textContent=`Week ${game.week+1}`;$('#formGuide').textContent=`${h.stats.pts} PTS · ${a.stats.pts} PTS`;$('#playMatch').disabled=c.players.filter(p=>p.starting).length!==11}
    const pos=table().findIndex(t=>t.id===c.id)+1;$('#leaguePosition').textContent=ordinal(pos);$('#miniTable').innerHTML=table().slice(Math.max(0,pos-2),Math.min(8,pos+2)).map((t,i)=>`<div class="mini-row ${t.id===c.id?'you':''}"><span>${table().indexOf(t)+1}</span><span>${t.name}</span><b>${t.stats.pts}</b></div>`).join('');
    renderPitch();const avg=Math.round(c.players.reduce((s,p)=>s+p.fitness,0)/c.players.length);const top=[...c.players].sort((a,b)=>b.rating-a.rating)[0];$('#briefingDate').textContent=`W${game.week+1}`;$('#briefing').innerHTML=`<h3>${avg<75?'Rotation advised':'Squad ready'}</h3><p>${avg<75?'Several starters are carrying fatigue. Fresh legs may protect performance.':'Fitness levels are healthy. Your chosen approach should be sustainable for the next fixture.'}</p><div class="brief-stat"><span>Fitness ${avg}%</span><span>Top rated ${top.name} · ${top.rating}</span></div>`;
  }
  function renderPitch(){const xi=club().players.filter(p=>p.starting);const slots={GK:[[8,50]],DEF:[[28,18],[28,39],[28,61],[28,82]],MID:[[57,15],[57,38],[57,62],[57,85]],FWD:[[84,35],[84,65]]};const used={GK:0,DEF:0,MID:0,FWD:0};$('#miniPitch').innerHTML=xi.map(p=>{const s=slots[p.pos][used[p.pos]++]||[50,50];return `<span class="pitch-player" title="${p.name}" style="left:${s[0]}%;top:${s[1]}%">${initials(p.name)}</span>`}).join('')}
  function playerRow(p){return `<button class="player-row" data-player="${p.id}"><span class="player-pos">${p.pos}</span><span class="player-name"><strong>${p.name}</strong><span>${p.age} yrs · ${p.apps} apps · ${p.goals} goals · POT ${p.potential}</span></span><b class="rating">${p.rating}</b><span class="fitness">${p.fitness}%<i style="width:${p.fitness}%"></i></span></button>`}
  function renderSquad(){const players=club().players;const xi=players.filter(p=>p.starting).sort(posSort),bench=players.filter(p=>!p.starting).sort(posSort);$('#xiCount').textContent=`${xi.length}/11`;$('#startingList').innerHTML=xi.map(playerRow).join('');$('#benchList').innerHTML=bench.map(playerRow).join('');$$('[data-player]').forEach(b=>b.onclick=()=>togglePlayer(b.dataset.player))}
  function posSort(a,b){return ['GK','DEF','MID','FWD'].indexOf(a.pos)-['GK','DEF','MID','FWD'].indexOf(b.pos)||b.rating-a.rating}
  function togglePlayer(id){const p=club().players.find(x=>x.id===id),count=club().players.filter(x=>x.starting).length;if(!p.starting&&count>=11){flash('The starting XI is full. Remove a player first.');return}if(p.starting&&count<=1)return;p.starting=!p.starting;save();render();}
  function flash(msg){const old=$('.save-state span').textContent;$('.save-state span').textContent=msg;setTimeout(()=>$('.save-state span').textContent=old,1800)}
  function renderTable(){const c=club();$('#fullTable').innerHTML=table().map((t,i)=>`<tr class="${t.id===c.id?'you':''}"><td>${i+1}</td><td><span class="team-cell"><i class="table-dot" style="--team:${t.color}"></i>${t.name}</span></td><td>${t.stats.p}</td><td>${t.stats.w}</td><td>${t.stats.d}</td><td>${t.stats.l}</td><td>${t.stats.gf-t.stats.ga}</td><td><b>${t.stats.pts}</b></td></tr>`).join('')}
  function renderNews(){game.news.forEach(n=>n.read=true);save();$('#newsBadge').textContent='';$('#newsList').innerHTML=game.news.map(n=>`<article class="news-item"><time>WEEK ${n.week+1}</time><div><h3>${n.title}</h3><p>${n.text}</p></div></article>`).join('')}
  function renderClubPreview(){const c=CLUBS[selectedClub];if(!c)return;$('#clubPreview').innerHTML=`<div class="preview-crest" style="--team:${c.color}">${c.short}</div><h2>${c.name}</h2><span class="preview-identity">${c.identity}</span><p>${c.description}</p><div class="preview-meta"><span>Home · ${c.ground}</span><span>Board target · ${c.reputation>=76?'Challenge for the title':c.reputation>=70?'Finish in the top half':'Build for the future'}</span></div>`}
  function selectClub(id){selectedClub=Number(id);$$('[data-club]').forEach(option=>{const selected=Number(option.dataset.club)===selectedClub;option.classList.toggle('selected',selected);option.setAttribute('aria-pressed',String(selected))});$('#startGame').disabled=false;renderClubPreview()}
  function renderPicker(){if(selectedClub===null)selectedClub=0;const root=$('#clubPicker');root.innerHTML=CLUBS.map(c=>`<button class="club-option ${c.id===selectedClub?'selected':''}" type="button" data-club="${c.id}" aria-pressed="${c.id===selectedClub}"><b style="color:${c.color}">${c.short}</b><span>${c.name}</span></button>`).join('');$$('[data-club]').forEach(button=>button.onclick=()=>selectClub(button.dataset.club));$('#startGame').disabled=false;renderClubPreview()}
  const TOUR=[
    {icon:'⚽',title:'Your first match is ready',text:'Choose one tactical approach and press Play match. The default starting XI is valid, so there is nothing else you must configure.'},
    {icon:'◎',title:'Change only what interests you',text:'Open Squad when you want to rotate players. Fitness, age, minutes, and potential shape development across the season.'},
    {icon:'↗',title:'Build a career, one week at a time',text:'Results save on this device. The desk surfaces the next useful decision; the table, inbox, replay, and season review stay available when you want more detail.'}
  ];
  function renderTour(){const step=TOUR[tourStep];$('#tourProgress').textContent=`Quick tour · ${tourStep+1} of ${TOUR.length}`;$('#tourIcon').textContent=step.icon;$('#tourTitle').textContent=step.title;$('#tourText').textContent=step.text;$('#tourDots').innerHTML=TOUR.map((_,index)=>`<i class="${index===tourStep?'active':''}"></i>`).join('');$('#tourNext').textContent=tourStep===TOUR.length-1?'Start week one':'Next'}
  function openTour(){if(!game)return;tourStep=0;renderTour();$('#tourDialog').showModal()}
  function finishTour(){game.tourSeen=true;save();if($('#tourDialog').open)$('#tourDialog').close();requestAnimationFrame(()=>$('#playMatch').focus())}
  function nextTourStep(){if(tourStep<TOUR.length-1){tourStep++;renderTour()}else finishTour()}
  function setNavOpen(open){const sidebar=$('#sidebar'),mobileMenu=$('#mobileMenu'),isMobile=window.matchMedia('(max-width: 820px)').matches;sidebar.classList.toggle('open',open);mobileMenu.setAttribute('aria-expanded',String(open));mobileMenu.setAttribute('aria-label',open?'Close navigation':'Open navigation');sidebar.setAttribute('aria-hidden',String(isMobile&&!open));if(open&&isMobile)sidebar.querySelector('.nav-item')?.focus();if(!open&&isMobile&&sidebar.contains(document.activeElement))mobileMenu.focus()}
  function switchView(name){$$('.view').forEach(v=>v.classList.toggle('active-view',v.id===`${name}View`));$$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===name));setNavOpen(false);if(name==='news')renderNews()}
  $('#startGame').onclick=()=>{makeGame(selectedClub);render();requestAnimationFrame(openTour)};$('#playMatch').onclick=playWeek;$('#exportSave').onclick=exportSave;$('#importSave').onclick=()=>$('#importFile').click();$('#importFile').onchange=event=>{const [file]=event.target.files;if(file)importSave(file);event.target.value=''};$('#openTour').onclick=openTour;$('#tourNext').onclick=nextTourStep;$('#tourSkip').onclick=finishTour;$('#tourClose').onclick=finishTour;$('#resetGame').onclick=()=>{if(confirm('Start over? Your current career will be removed from this device.')){store.clear();game=null;selectedClub=null;render()}};
  $$('.nav-item').forEach(n=>n.onclick=()=>switchView(n.dataset.view));$$('[data-go]').forEach(n=>n.onclick=()=>switchView(n.dataset.go));$('#mobileMenu').onclick=()=>setNavOpen(!$('#sidebar').classList.contains('open'));document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('#sidebar').classList.contains('open'))setNavOpen(false)});$('#resultClose').onclick=()=>$('#resultDialog').close();$('#continueBtn').onclick=()=>{$('#resultDialog').close();if(game.week>=game.fixtures.length)requestAnimationFrame(showSeasonReview)};$('#replayBtn').onclick=()=>{$('#resultDialog').close();$('#replayDialog').showModal()};$('#replayClose').onclick=()=>{$('#replayDialog').close();if(replayState.timer)clearTimeout(replayState.timer);replayState.timer=null};$('#replayPlay').onclick=startReplay;$('#replaySkip').onclick=skipReplay;$('#seasonReviewBtn').onclick=showSeasonReview;$('#startNextSeason').onclick=applyOffseason;$('#seasonAdvance').onclick=applyOffseason;$('#seasonClose').onclick=()=>$('#seasonDialog').close();$('#seasonLater').onclick=()=>$('#seasonDialog').close();
  $('#tacticSelect').onchange=updateTacticHelp;$('#replayPause').onclick=pauseReplay;$('#replaySpeed').onchange=()=>{replayState.speed=Number($('#replaySpeed').value);if(replayState.timer){clearTimeout(replayState.timer);replayState.timer=setTimeout(advanceReplay,replayDelay())}};$('#replayDuration').onchange=()=>{replayState.durationMs=Number($('#replayDuration').value);if(replayState.timer){clearTimeout(replayState.timer);replayState.timer=setTimeout(advanceReplay,replayDelay())}};
  if(location.protocol!=='file:'&&'serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});setNavOpen(false);render();updateTacticHelp();
})();

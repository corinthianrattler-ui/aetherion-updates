/* Aetherion Reforged v1.70.0 — tournament grounds and three playable events. */
'use strict';
(()=>{
 const VERSION='1.70.0';
 const ART=Object.freeze({
  joust:'assets/v170/jousting-arena.png',
  duel:'assets/v170/duel-arena.png',
  archery:'assets/v170/archery-range.png'
 });
 const LABEL=Object.freeze({joust:'Jousting Lists',duel:'Armored Duel Ring',archery:'Archery Butts'});
 const EVENT_ORDER=Object.freeze(['joust','duel','archery']);
 const LANES=Object.freeze(['high','center','low']);
 const INTENTS=Object.freeze({
  high_cut:{name:'HIGH CUT',tell:'His right shoulder rises and the sword comes above the brow.',answer:'high_guard'},
  thrust:{name:'STRAIGHT THRUST',tell:'His point narrows toward the breastplate and his rear heel lifts.',answer:'parry'},
  low_sweep:{name:'LOW SWEEP',tell:'His hands sink and his weight rolls toward the forward knee.',answer:'step'},
  feint:{name:'FEINT & DRAW',tell:'His blade twitches high, but his hips never commit to the cut.',answer:'press'}
 });
 const RESPONSES=Object.freeze({
  high_guard:['⬒','GUARD HIGH'],parry:['⚔','TURN THE POINT'],step:['◌','STEP CLEAR'],press:['◆','PRESS THE FEINT']
 });
 const OPPONENTS=Object.freeze({
  joust:['Ser Aldren Vey','Lady Maeryn Voss','Rurik Stonehand','Ser Corren Ash'],
  duel:['Ser Garran Holt','Merek Vann','Lady Ysra Thorn','The Ashen Blade'],
  archery:['Elen Reed-Eye','Tomas Wren','Brynja Northbow','Orren Pike']
 });
 const runtime={session:null,raf:0,lastTick:0};

 function base(){return{version:VERSION,entries:0,championships:0,wins:{joust:0,duel:0,archery:0},best:{joust:0,duel:0,archery:0},renown:0,history:[]}}
 function ensure(x=S){
  if(!x||typeof x!=='object')return null;x.v170Tournament??=base();const value=x.v170Tournament;
  value.wins??={};value.best??={};for(const kind of EVENT_ORDER){value.wins[kind]=+value.wins[kind]||0;value.best[kind]=+value.best[kind]||0}
  value.entries=+value.entries||0;value.championships=+value.championships||0;value.renown=+value.renown||0;value.history=Array.isArray(value.history)?value.history:[];value.version=VERSION;
  x.meta??={};x.meta.v170Tournaments=VERSION;return value;
 }
 function randomOf(values){return values[Math.floor(Math.random()*values.length)]}
 function now(){return typeof performance==='object'&&performance?.now?performance.now():Date.now()}
 function skill(name,fallback){try{return typeof v26Ensure==='function'?(+v26Ensure().skills[name]||fallback):fallback}catch(_){return fallback}}
 function venue(){
  const here=String(S?.world?.location||'the local keep');
  if(/Blood Keep/i.test(here))return'The Blood Keep Crimson Lists';
  if(/Solaris/i.test(here))return'The Solaris Crown Tourney';
  if(/Ironspine/i.test(here))return'The Ironspine Stone Lists';
  if(/Green|Glade/i.test(here))return'The Green Hall Summer Lists';
  if(/Horn|Grim/i.test(here))return'The Grim Horn Proving Ground';
  return`${here} Tournament Ground`;
 }
 function laneExposure(guard){return({high:'low',center:'high',low:'center'})[guard]}
 function timingGrade(distance){return distance<=.055?3:distance<=.12?2:distance<=.23?1:0}
 function archeryPoints(distance){return distance<=.065?10:distance<=.13?7:distance<=.22?4:distance<=.32?1:0}
 function duelAnswer(intent,response){return INTENTS[intent]?.answer===response}
 function joustResolution(aim,guard,distance,skillValue=50,roll=.5){
  const timing=timingGrade(distance),line=aim===laneExposure(guard)?2:aim===guard?0:1;
  const total=timing+line+(skillValue-50)/100+(roll-.5)*.35;
  if(total>=4.55)return{points:3,name:'UNHORSED',text:'The lance takes the open line dead-center. The opponent leaves the saddle.'};
  if(total>=3.1)return{points:2,name:'LANCE SHATTERED',text:'Ash splinters across the shield and the gallery roars.'};
  if(total>=1.75)return{points:1,name:'SOLID TOUCH',text:'The coronel bites and glances away cleanly.'};
  return{points:0,name:'NO SCORE',text:aim===guard?'The shield was already there. The lance skids wide.':'The lance wavers past the scoring plate.'};
 }
 function markerAt(game,time=now()){return .5+.475*Math.sin((time-game.startedAt)/330)}
 function arrowAt(game,time=now()){
  const elapsed=(time-game.startedAt)/455,wind=game.wind*.0065;
  return{x:clamp(.5+.34*Math.sin(elapsed)+wind,.06,.94),y:clamp(.5+.27*Math.cos(elapsed*.79+game.arrow*.73),.08,.92)};
 }
 function arenaStyle(kind){return`background-image:linear-gradient(180deg,#07050755 0,#070507bb 58%,#070507f2 100%),url('${ART[kind]}')`}
 function historyRows(){
  const rows=ensure().history.slice(-6).reverse();if(!rows.length)return'<p class="muted">No tournament result has been entered yet.</p>';
  return rows.map(row=>`<div class="v170-history"><b>${esc(row.title)}</b><span>Day ${Math.floor(row.day)} · ${esc(row.place)} · ${row.score} points</span></div>`).join('');
 }
 function eventCard(kind,copy,meta){return`<article class="v170-event-card" style="${arenaStyle(kind)}"><div class="v170-card-copy"><span class="v170-kicker">${esc(meta)}</span><h3>${esc(LABEL[kind])}</h3><p>${esc(copy)}</p><button onclick="v170StartTournament('${kind}',false)">ENTER ${kind==='joust'?'THE LISTS':kind==='duel'?'THE RING':'THE RANGE'} · 1s</button></div></article>`}
 function hub(){
  const t=ensure();return`<section class="panel v170-panel"><div class="v170-heading"><div><span class="v170-kicker">${esc(venue())}</span><h2>Tournament Grounds</h2><p>Three physical contests share Valkorion’s energy, wounds, purse, skills, and public standing. Read the opponent, commit at the right moment, and live with the result.</p></div><button class="primary" onclick="v170StartTournament('joust',true)">ENTER FULL TOURNEY · 2s 50c</button></div><div class="v170-ledger"><div><b>${t.renown}</b><span>Tourney renown</span></div><div><b>${t.championships}</b><span>Championships</span></div><div><b>${t.entries}</b><span>Event entries</span></div><div><b>${t.wins.joust}/${t.wins.duel}/${t.wins.archery}</b><span>Joust · duel · bow wins</span></div></div><div class="v170-event-grid">${eventCard('joust','Read the opponent’s shield line, choose the exposed target, then set the lance as the charge closes.','Three scored passes')}${eventCard('duel','Read shoulder, point, hands, and feet. Choose the single answer before the opening closes.','First to three exchanges')}${eventCard('archery','Hold against wind and natural sway. Loose only when the sight crosses the gold.','Six arrows · 60 points')}</div><div class="v170-rules"><h3>One Tournament Day</h3><div class="grid3"><div class="card"><b>Energy is real</b><p>Every event consumes time and 10–14 energy. Starting exhausted narrows nothing in your favor.</p></div><div class="card"><b>Injuries persist</b><p>A failed seat or a lost exchange can remove HP and enter a wound in the medical ledger.</p></div><div class="card"><b>The crowd remembers</b><p>Wins pay coin, raise Nobility standing, and build local tourney renown.</p></div></div><h3>Recent Herald’s Record</h3>${historyRows()}</div></section>`;
 }
 function tournamentTab(){return runtime.session?sessionView():hub()}
 function openGrounds(){
  try{if(typeof SET==='object'){SET.compact=true;if(typeof saveSettings==='function')saveSettings()}}catch(_){ }
  currentTab='tournaments';render();
 }
 function circuitStrip(session){
  if(!session.circuit)return'';return`<div class="v170-circuit">${EVENT_ORDER.map((kind,index)=>`<span class="${index<session.index?'done':index===session.index?'current':''}">${index<session.index?'✓ ':''}${esc(LABEL[kind])}</span>`).join('')}</div>`;
 }
 function sessionView(){
  const session=runtime.session;if(!session)return hub();
  if(session.phase==='event-result')return resultView(session);
  if(session.phase==='circuit-result')return circuitResult(session);
  if(session.event==='joust')return joustView(session);
  if(session.event==='duel')return duelView(session);
  return archeryView(session);
 }
 function gameHeader(session,subtitle){return`<div class="v170-game-head"><div><span class="v170-kicker">${esc(venue())}</span><h2>${esc(LABEL[session.event])}</h2><p>${esc(subtitle)}</p></div><button onclick="v170Forfeit()">WITHDRAW</button></div>${circuitStrip(session)}`}
 function scoreBoard(game,leftLabel='Valkorion',rightLabel='Opponent'){return`<div class="v170-score"><div><b>${esc(leftLabel)}</b><strong>${game.playerScore||0}</strong></div><span>—</span><div><b>${esc(rightLabel)}</b><strong>${game.foeScore||0}</strong></div></div>`}

 function newJoust(){return{pass:1,max:3,playerScore:0,foeScore:0,guard:randomOf(LANES),aim:null,phase:'aim',startedAt:0,target:.5,last:null,log:[]}}
 function joustView(session){
  const game=session.game,exposed=laneExposure(game.guard),phase=game.phase;
  const controls=phase==='aim'?`<div class="v170-choice"><p>The opponent carries the shield <b>${game.guard.toUpperCase()}</b>. The <b>${exposed.toUpperCase()}</b> line is exposed.</p><div class="v170-three">${LANES.map(lane=>`<button onclick="v170JoustAim('${lane}')">AIM ${lane.toUpperCase()}</button>`).join('')}</div></div>`:phase==='timing'?`<div class="v170-timing"><div class="v170-timing-track"><i style="left:${game.target*100}%"></i><span id="v170LanceMarker" style="left:${markerAt(game)*100}%"></span></div><button class="primary v170-commit" onclick="v170SetLance()">SET LANCE</button><small>Strike inside the gold band. A perfect line can unhorse.</small></div>`:`<div class="v170-resolution ${game.last?.points===3?'victory':''}"><b>${esc(game.last?.name||'PASS COMPLETE')}</b><p>${esc(game.last?.text||'')}</p><button class="primary" onclick="v170NextJoust()">${game.pass>=game.max?'HEAR THE RESULT':'RIDE NEXT PASS'}</button></div>`;
  return`<section class="panel v170-panel">${gameHeader(session,`Pass ${game.pass}/${game.max} against ${session.opponent}`)}<div class="v170-arena" style="${arenaStyle('joust')}">${scoreBoard(game)}<div class="v170-herald"><span>SHIELD READ</span><strong>${game.guard.toUpperCase()}</strong><small>${exposed.toUpperCase()} LINE OPEN</small></div>${controls}<div class="v170-pass-log">${game.log.slice(-3).map(line=>`<span>${esc(line)}</span>`).join('')}</div></div></section>`;
 }
 function nextGuard(previous){return randomOf(LANES.filter(lane=>lane!==previous))}

 function newDuel(){return{round:1,max:5,playerScore:0,foeScore:0,intent:randomOf(Object.keys(INTENTS)),phase:'respond',startedAt:now(),deadline:0,last:null,log:[]}}
 function duelView(session){
  const game=session.game,intent=INTENTS[game.intent];
  const controls=game.phase==='respond'?`<div class="v170-intent"><span>READ THE OPPONENT</span><strong>${intent.name}</strong><p>${intent.tell}</p></div><div class="v170-duel-answers">${Object.entries(RESPONSES).map(([id,[glyph,label]])=>`<button onclick="v170DuelRespond('${id}')"><b>${glyph}</b><span>${label}</span></button>`).join('')}</div><div class="v170-deadline"><span id="v170DuelTime" style="width:100%"></span></div>`:`<div class="v170-resolution ${game.last?.won?'victory':''}"><b>${esc(game.last?.title||'EXCHANGE COMPLETE')}</b><p>${esc(game.last?.text||'')}</p><button class="primary" onclick="v170NextDuel()">${game.playerScore>=3||game.foeScore>=3||game.round>=game.max?'HEAR THE RESULT':'NEXT EXCHANGE'}</button></div>`;
  return`<section class="panel v170-panel">${gameHeader(session,`Exchange ${game.round}/${game.max} against ${session.opponent}`)}<div class="v170-arena" style="${arenaStyle('duel')}">${scoreBoard(game)}${controls}<div class="v170-pass-log">${game.log.slice(-3).map(line=>`<span>${esc(line)}</span>`).join('')}</div></div></section>`;
 }

 function newArchery(){return{arrow:1,max:6,playerScore:0,foeScore:0,wind:rnd(-14,14),phase:'aim',startedAt:now(),last:null,shots:[]}}
 function windText(value){return Math.abs(value)<3?'CALM':`${Math.abs(value)} mph ${value<0?'← WEST':'EAST →'}`}
 function archeryView(session){
  const game=session.game,pos=arrowAt(game),shot=game.last;
  const control=game.phase==='aim'?`<div class="v170-range-read"><span>WIND</span><strong>${windText(game.wind)}</strong><small>Natural sway continues until you loose.</small></div><button class="primary v170-loose" onclick="v170LooseArrow()">LOOSE</button>`:`<div class="v170-resolution ${shot?.points===10?'victory':''}"><b>${shot?.points===10?'GOLD':shot?.points?`${shot.points} POINTS`:'MISS'}</b><p>${esc(shot?.text||'')}</p><button class="primary" onclick="v170NextArrow()">${game.arrow>=game.max?'HEAR THE RESULT':'NOCK NEXT ARROW'}</button></div>`;
  return`<section class="panel v170-panel">${gameHeader(session,`Arrow ${game.arrow}/${game.max} · ${session.opponent} sets the field mark`)}<div class="v170-arena v170-archery-arena" style="${arenaStyle('archery')}"><div class="v170-archery-score"><b>VALKORION</b><strong>${game.playerScore}/60</strong></div><div class="v170-target"><i></i><i></i><i></i><i></i><span id="v170Aim" style="left:${pos.x*100}%;top:${pos.y*100}%"></span>${shot?`<b class="v170-impact" style="left:${shot.x*100}%;top:${shot.y*100}%">×</b>`:''}</div>${control}<div class="v170-shot-row">${Array.from({length:game.max},(_,index)=>`<span class="${index<game.shots.length?'used':''}">${game.shots[index]?.points??'—'}</span>`).join('')}</div></div></section>`;
 }

 function start(kind,circuit){
  if(!S?.player?.alive)return;if(!EVENT_ORDER.includes(kind))kind='joust';ensure();
  const energyNeed=circuit?38:14,fee=circuit?250:100;
  if(S.player.energy<energyNeed){toast(`Valkorion needs at least ${energyNeed}% energy for ${circuit?'a full tournament day':'this event'}.`);return}
  if(!payCopper(fee)){toast(`The herald requires ${circuit?'2 silver 50 copper':'1 silver'} entry coin.`);return}
  const session={circuit:!!circuit,index:circuit?0:EVENT_ORDER.indexOf(kind),event:kind,circuitScore:0,placements:[],paid:fee,phase:'play',opponent:'',game:null};
  runtime.session=session;ensure().entries+=circuit?3:1;prepare(kind);persist(false);render();
 }
 function prepare(kind){
  stopFrame();const session=runtime.session;if(!session)return;session.event=kind;session.phase='play';session.opponent=randomOf(OPPONENTS[kind]);
  session.game=kind==='joust'?newJoust():kind==='duel'?newDuel():newArchery();if(kind==='duel')session.game.deadline=session.game.startedAt+5200;
 }
 function stopFrame(){if(runtime.raf){cancelAnimationFrame(runtime.raf);runtime.raf=0}}
 function afterRender(){
  stopFrame();const session=runtime.session;if(currentTab!=='tournaments'||!session||session.phase!=='play')return;
  const game=session.game;if((session.event==='joust'&&game.phase==='timing')||(session.event==='archery'&&game.phase==='aim')||(session.event==='duel'&&game.phase==='respond'))runtime.raf=requestAnimationFrame(tick);
 }
 function tick(time){
  const session=runtime.session;if(!session||currentTab!=='tournaments'||session.phase!=='play'){runtime.raf=0;return}const game=session.game;
  if(session.event==='joust'&&game.phase==='timing'){
   const marker=document.getElementById('v170LanceMarker');if(marker)marker.style.left=(markerAt(game,time)*100)+'%';
  }else if(session.event==='archery'&&game.phase==='aim'){
   const p=arrowAt(game,time),marker=document.getElementById('v170Aim');if(marker){marker.style.left=(p.x*100)+'%';marker.style.top=(p.y*100)+'%'}
  }else if(session.event==='duel'&&game.phase==='respond'){
   const left=Math.max(0,game.deadline-time),bar=document.getElementById('v170DuelTime');if(bar)bar.style.width=(left/5200*100)+'%';if(left<=0){runtime.raf=0;duelRespond(null);return}
  }
  runtime.raf=requestAnimationFrame(tick);
 }

 function joustAim(lane){const session=runtime.session,game=session?.game;if(session?.event!=='joust'||game?.phase!=='aim'||!LANES.includes(lane))return;game.aim=lane;game.phase='timing';game.startedAt=now();game.target=.28+Math.random()*.44;render()}
 function setLance(){
  const session=runtime.session,game=session?.game;if(session?.event!=='joust'||game?.phase!=='timing')return;stopFrame();
  const marker=markerAt(game),distance=Math.abs(marker-game.target),result=joustResolution(game.aim,game.guard,distance,skill('Riding',35),Math.random());
  game.playerScore+=result.points;let foeChance=.44+(game.pass-1)*.04,foe=Math.random()<foeChance?(Math.random()<.18?2:1):0;game.foeScore+=foe;
  game.last=result;game.log.push(`Pass ${game.pass}: ${result.name} · Valkorion +${result.points}, ${session.opponent} +${foe}`);game.phase='resolved';
  if(result.points===0&&distance>.34&&Math.random()<.16)injure('Jousting fall',rnd(4,9),'A failed seat in the lists');render();
 }
 function nextJoust(){
  const session=runtime.session,game=session?.game;if(session?.event!=='joust'||game?.phase!=='resolved')return;
  if(game.pass>=game.max){finishEvent();return}game.pass++;game.guard=nextGuard(game.guard);game.aim=null;game.last=null;game.phase='aim';render();
 }

 function duelRespond(response){
  const session=runtime.session,game=session?.game;if(session?.event!=='duel'||game?.phase!=='respond')return;stopFrame();
  const elapsed=Math.max(0,now()-game.startedAt),correct=response&&duelAnswer(game.intent,response),recovery=!correct&&response&&Math.random()<skill('Swordsmanship',45)/500;
  const won=!!(correct||recovery);if(won)game.playerScore++;else game.foeScore++;
  const title=correct?(elapsed<1700?'PERFECT READ':'CLEAN ANSWER'):recovery?'LATE RECOVERY':response?'WRONG GUARD':'OPENING LOST';
  const text=won?`${session.opponent}'s ${INTENTS[game.intent].name.toLowerCase()} is caught before it can score.`:`${session.opponent} breaks through and takes the exchange.`;
  game.last={won,title,text};game.log.push(`Exchange ${game.round}: ${title} · ${game.playerScore}–${game.foeScore}`);game.phase='resolved';render();
 }
 function nextDuel(){
  const session=runtime.session,game=session?.game;if(session?.event!=='duel'||game?.phase!=='resolved')return;
  if(game.playerScore>=3||game.foeScore>=3||game.round>=game.max){if(game.foeScore>game.playerScore)injure('Tournament bruising',rnd(3,7),'Lost armored tournament bout');finishEvent();return}
  game.round++;game.intent=randomOf(Object.keys(INTENTS).filter(intent=>intent!==game.intent));game.last=null;game.phase='respond';game.startedAt=now();game.deadline=game.startedAt+5200;render();
 }

 function looseArrow(){
  const session=runtime.session,game=session?.game;if(session?.event!=='archery'||game?.phase!=='aim')return;stopFrame();
  const p=arrowAt(game),raw=Math.hypot(p.x-.5,p.y-.5),adjusted=raw*(1-skill('Hunting',25)/500),points=archeryPoints(adjusted);
  const text=points===10?'The shaft buries itself in the gold.':points===7?'The arrow cuts the inner red.':points===4?'The arrow holds inside the scoring rings.':points===1?'A ragged outer-ring hit.':'The shaft passes outside the painted face.';
  const shot={x:p.x,y:p.y,distance:adjusted,points,text};game.last=shot;game.shots.push(shot);game.playerScore+=points;game.phase='resolved';render();
 }
 function nextArrow(){
  const session=runtime.session,game=session?.game;if(session?.event!=='archery'||game?.phase!=='resolved')return;
  if(game.arrow>=game.max){finishEvent();return}game.arrow++;game.wind=rnd(-14,14);game.last=null;game.phase='aim';game.startedAt=now();render();
 }
 function injure(name,damage,cause){
  S.player.hp=Math.max(1,S.player.hp-damage);S.player.wounds??=[];S.player.wounds.push({name,severity:damage+5,day:S.world.day,treated:false,cause});
  toast(`${name}: ${damage} HP lost.`);
 }
 function rankFor(kind,game){
  if(kind==='joust'){if(game.playerScore>game.foeScore)return{place:'Champion',points:5};if(game.playerScore===game.foeScore)return{place:'Second by herald’s count',points:3};return{place:'Eliminated',points:1}}
  if(kind==='duel'){if(game.playerScore>game.foeScore)return{place:'Champion',points:5};return game.playerScore===game.foeScore?{place:'Second by judges’ count',points:3}:{place:'Eliminated',points:1}}
  if(game.playerScore>=44)return{place:'Champion',points:5};if(game.playerScore>=30)return{place:'Second place',points:3};return{place:'Field rank',points:1};
 }
 function eventNumericScore(kind,game){return kind==='archery'?game.playerScore:game.playerScore*10-game.foeScore}
 function finishEvent(){
  stopFrame();const session=runtime.session;if(!session)return;const kind=session.event,game=session.game,rank=rankFor(kind,game),won=rank.points===5,t=ensure(),score=eventNumericScore(kind,game);
  const purse=won?1600:rank.points===3?700:150,rep=won?5:rank.points===3?2:0;earnCopper(purse);S.player.reputation.Nobility=clamp((S.player.reputation.Nobility||0)+rep,-100,100);t.renown+=rank.points;t.best[kind]=Math.max(t.best[kind],score);if(won)t.wins[kind]++;
  if(typeof v26Gain==='function')v26Gain(kind==='joust'?'Riding':kind==='duel'?'Swordsmanship':'Hunting',won?1.6:1.0,`competing in ${LABEL[kind].toLowerCase()}`);
  S.player.energy=clamp(S.player.energy-(kind==='joust'?14:kind==='duel'?12:10),0,100);advanceHours(kind==='joust'?2.5:kind==='duel'?2:1.5,kind==='duel'?'training':'court');
  const record={day:S.world.day,kind,title:LABEL[kind],place:rank.place,score,purse,opponent:session.opponent};t.history.push(record);if(t.history.length>40)t.history=t.history.slice(-40);
  session.circuitScore+=rank.points;session.placements.push(record);session.result={...record,rankPoints:rank.points,won};session.phase='event-result';persist(false);render();
 }
 function resultView(session){
  const result=session.result,kind=result.kind,next=session.circuit&&session.index<EVENT_ORDER.length-1;
  return`<section class="panel v170-panel">${gameHeader(session,'The herald enters the score and purse into the public ledger.')}<div class="v170-result" style="${arenaStyle(kind)}"><span class="v170-kicker">${esc(LABEL[kind])}</span><h2>${esc(result.place)}</h2><div class="v170-result-grid"><div><b>${result.score}</b><span>event score</span></div><div><b>${result.rankPoints}</b><span>circuit points</span></div><div><b>${moneyFromCopper(result.purse)}</b><span>purse won</span></div></div><p>${result.won?'Valkorion’s name carries beyond the rails before the herald finishes speaking.':'The result stands. Skill gained, time spent, and every bruise remain real.'}</p><button class="primary" onclick="v170ContinueTournament()">${next?`NEXT: ${LABEL[EVENT_ORDER[session.index+1]].toUpperCase()}`:session.circuit?'HEAR THE OVERALL RESULT':'RETURN TO TOURNAMENT GROUNDS'}</button></div></section>`;
 }
 function moneyFromCopper(value){const silver=Math.floor(value/100),copper=value%100;return`${silver}s${copper?` ${copper}c`:''}`}
 function continueTournament(){
  const session=runtime.session;if(!session||session.phase!=='event-result')return;
  if(!session.circuit){runtime.session=null;render();return}
  if(session.index<EVENT_ORDER.length-1){session.index++;prepare(EVENT_ORDER[session.index]);render();return}finishCircuit();
 }
 function finishCircuit(){
  const session=runtime.session,t=ensure(),score=session.circuitScore,champion=score>=12,purse=champion?5000:score>=8?2200:700,rep=champion?10:score>=8?4:1;
  earnCopper(purse);S.player.reputation.Nobility=clamp((S.player.reputation.Nobility||0)+rep,-100,100);t.renown+=champion?8:3;if(champion)t.championships++;
  session.circuitResult={champion,score,purse,rep};session.phase='circuit-result';persist(false);pushStory('Tournament Herald',champion?`Valkorion Dominus takes the day across lance, steel, and bow. ${venue()} records a new champion.`:`Valkorion completes the full tournament day with ${score} circuit points. Every result is entered under his name.`,'MM',ART.joust);render();
 }
 function circuitResult(session){
  const result=session.circuitResult;return`<section class="panel v170-panel"><div class="v170-result v170-circuit-result" style="${arenaStyle('joust')}"><span class="v170-kicker">FULL TOURNAMENT RESULT</span><h2>${result.champion?'Champion of the Day':'The Day Completed'}</h2><div class="v170-result-grid"><div><b>${result.score}/15</b><span>circuit score</span></div><div><b>${moneyFromCopper(result.purse)}</b><span>final purse</span></div><div><b>+${result.rep}</b><span>Nobility standing</span></div></div><div class="v170-placement-list">${session.placements.map(row=>`<div><b>${esc(row.title)}</b><span>${esc(row.place)} · ${row.score}</span></div>`).join('')}</div><button class="primary" onclick="v170CloseTournament()">RETURN TO THE GROUNDS</button></div></section>`;
 }
 function closeTournament(){stopFrame();runtime.session=null;render()}
 function forfeit(){
  const session=runtime.session;if(!session)return;stopFrame();S.player.energy=clamp(S.player.energy-4,0,100);advanceHours(.5,'court');ensure().history.push({day:S.world.day,kind:session.event,title:LABEL[session.event],place:'Withdrew',score:0,purse:0});runtime.session=null;persist(false);render();toast('The withdrawal is entered by the herald.');
 }

 const css=document.createElement('style');css.id='aetherion-v170-tournament-style';css.textContent=`
  .v170-panel{--v170-gold:#d7b45f;--v170-line:#744743;overflow:hidden}.v170-heading,.v170-game-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:16px}.v170-heading h2,.v170-game-head h2{margin:4px 0 6px;color:#ead7ca}.v170-heading p,.v170-game-head p{max-width:760px;margin:0}.v170-kicker{color:var(--v170-gold);font-size:.74rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.v170-ledger,.v170-result-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0}.v170-ledger>div,.v170-result-grid>div{padding:12px;border:1px solid #5d3939;border-radius:10px;background:#0b0709cc;text-align:center}.v170-ledger b,.v170-result-grid b{display:block;color:#e6c46e;font-size:1.25rem}.v170-ledger span,.v170-result-grid span{font-size:.7rem;color:#c9b8b1}.v170-event-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.v170-event-card{position:relative;min-height:330px;border:1px solid #805a43;border-radius:14px;background-size:cover;background-position:center;overflow:hidden;box-shadow:0 14px 28px #0009}.v170-card-copy{position:absolute;inset:auto 0 0;padding:22px 16px 16px;background:linear-gradient(transparent,#080608 30%)}.v170-card-copy h3{margin:8px 0;color:#f0dfd2;font-size:1.22rem}.v170-card-copy p{min-height:62px;color:#cdbdb5}.v170-card-copy button{width:100%}.v170-rules{margin-top:20px}.v170-history{display:flex;justify-content:space-between;gap:12px;padding:9px 2px;border-bottom:1px solid #352326}.v170-history span{color:#b9aaa5;font-size:.76rem}.v170-circuit{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}.v170-circuit span{padding:8px;border:1px solid #493033;border-radius:8px;color:#827376;text-align:center;font-size:.7rem}.v170-circuit .current{border-color:#c39c4d;color:#f1d58a;background:#2a1b14}.v170-circuit .done{color:#9fc091;border-color:#486044}.v170-arena,.v170-result{position:relative;min-height:540px;padding:18px;border:1px solid #80563f;border-radius:15px;background-size:cover;background-position:center;overflow:hidden;box-shadow:inset 0 0 70px #000,0 16px 36px #0008}.v170-score{display:flex;align-items:center;justify-content:center;gap:18px;max-width:450px;margin:0 auto 30px;padding:10px;border:1px solid #7a5550;border-radius:12px;background:#080608dd}.v170-score>div{min-width:110px;text-align:center}.v170-score b{display:block;font-size:.68rem;color:#ccb9b1;text-transform:uppercase}.v170-score strong{color:#f0ce78;font-size:1.8rem}.v170-herald,.v170-intent,.v170-range-read{max-width:560px;margin:18px auto;padding:18px;border:1px solid #85614e;border-radius:12px;background:#090608e8;text-align:center}.v170-herald span,.v170-intent span,.v170-range-read span{display:block;color:#ae9c94;font-size:.7rem;letter-spacing:.12em}.v170-herald strong,.v170-intent strong,.v170-range-read strong{display:block;margin:6px;color:#f2cf75;font-size:1.5rem}.v170-herald small,.v170-range-read small{color:#d5c2b9}.v170-choice,.v170-timing,.v170-resolution{max-width:620px;margin:20px auto;padding:16px;border:1px solid #684344;border-radius:12px;background:#090608e8;text-align:center}.v170-three{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.v170-timing-track{position:relative;height:38px;margin:10px 8px 18px;border:1px solid #704540;border-radius:999px;background:linear-gradient(90deg,#1b0b0e,#3f1a1c,#1b0b0e)}.v170-timing-track i{position:absolute;top:2px;bottom:2px;width:15%;transform:translateX(-50%);border:1px solid #f2cc70;border-radius:999px;background:#d5a93b45;box-shadow:0 0 18px #e4b94d88}.v170-timing-track span{position:absolute;top:-6px;width:6px;height:50px;transform:translateX(-50%);border-radius:4px;background:#f4e5cf;box-shadow:0 0 10px #fff}.v170-commit,.v170-loose{min-width:190px;min-height:54px}.v170-timing small{display:block;margin-top:8px;color:#bfaea8}.v170-resolution b{display:block;color:#f0ca6e;font-size:1.35rem}.v170-resolution.victory{border-color:#caa551;box-shadow:0 0 28px #b9882b55}.v170-pass-log{position:absolute;left:14px;right:14px;bottom:12px;display:flex;flex-direction:column;gap:3px;color:#b9aaa4;font-size:.66rem}.v170-duel-answers{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:700px;margin:16px auto}.v170-duel-answers button{min-height:88px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px}.v170-duel-answers b{font-size:1.5rem;color:#e1bd68}.v170-duel-answers span{font-size:.67rem}.v170-deadline{height:8px;max-width:700px;margin:10px auto;border-radius:99px;background:#170b0e;overflow:hidden}.v170-deadline span{display:block;height:100%;background:linear-gradient(90deg,#81362e,#e2bd62)}.v170-archery-arena{display:flex;flex-direction:column;align-items:center;min-height:620px}.v170-archery-score{align-self:stretch;display:flex;justify-content:space-between;padding:10px 14px;border:1px solid #68453f;border-radius:10px;background:#080608dd}.v170-archery-score strong{color:#edc96f}.v170-target{position:relative;width:min(72vw,360px);aspect-ratio:1;margin:18px auto;border:8px solid #2e211d;border-radius:50%;background:radial-gradient(circle,#d3a93e 0 7%,#711f24 7% 18%,#d9cbb0 18% 31%,#27201d 31% 46%,#b39766 46% 62%,#4f302a 62% 78%,#161012 78%);box-shadow:0 10px 36px #000}.v170-target>i{position:absolute;inset:12%;border:1px solid #e6cf9b55;border-radius:50%}.v170-target>i:nth-child(2){inset:26%}.v170-target>i:nth-child(3){inset:40%}.v170-target>i:nth-child(4){inset:48%}.v170-target>span{position:absolute;width:25px;height:25px;transform:translate(-50%,-50%);border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 1px #000,0 0 16px #fff}.v170-target>span:before,.v170-target>span:after{content:"";position:absolute;background:#fff}.v170-target>span:before{left:11px;top:-8px;width:1px;height:37px}.v170-target>span:after{left:-8px;top:11px;width:37px;height:1px}.v170-impact{position:absolute;transform:translate(-50%,-56%);color:#12070a;font:900 28px sans-serif;text-shadow:0 0 2px #fff}.v170-range-read{margin:0 auto 10px;padding:10px 18px}.v170-shot-row{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;width:min(88vw,430px);margin-top:12px}.v170-shot-row span{padding:7px;border:1px solid #563b38;border-radius:7px;background:#080608cc;text-align:center;color:#8d7b76}.v170-shot-row .used{color:#e7c36b}.v170-result{display:flex;min-height:520px;flex-direction:column;align-items:center;justify-content:center;text-align:center}.v170-result h2{margin:8px 0;color:#f0ce79;font-size:2rem}.v170-result>p{max-width:620px}.v170-result-grid{width:min(100%,620px);grid-template-columns:repeat(3,1fr)}.v170-placement-list{width:min(100%,620px);margin:12px 0}.v170-placement-list>div{display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #563936}.v170-circuit-result{min-height:600px}
  @media(max-width:820px){.v170-event-grid{grid-template-columns:1fr}.v170-event-card{min-height:290px}.v170-ledger{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:560px){.v170-heading,.v170-game-head{flex-direction:column}.v170-heading>button,.v170-game-head>button{width:100%}.v170-arena{min-height:570px;padding:12px}.v170-three{grid-template-columns:1fr}.v170-duel-answers{grid-template-columns:repeat(2,1fr)}.v170-duel-answers button{min-height:74px}.v170-score{gap:8px}.v170-score>div{min-width:90px}.v170-pass-log{position:static;margin-top:18px}.v170-history{flex-direction:column}.v170-circuit span{font-size:.58rem;padding:7px 2px}.v170-result-grid{grid-template-columns:1fr}.v170-target{width:min(76vw,320px)}}
 `;document.head?.appendChild(css);

 const dockBase=systemDock;systemDock=function(){let out=String(dockBase.apply(this,arguments));if(!out.includes('v170OpenTournamentGrounds'))out=out.replace('<div class="dockTabs">',`<div class="dockTabs"><button class="small ${currentTab==='tournaments'?'active':''}" onclick="v170OpenTournamentGrounds()">TOURNAMENTS</button>`);return out};
 const tabsBase=tabContent;tabContent=function(){return currentTab==='tournaments'?tournamentTab():tabsBase.apply(this,arguments)};
 const migrateBase=migrateState;migrateState=function(x){const y=migrateBase(x);ensure(y);return y};
 const freshBase=makeStartState;makeStartState=function(){const x=freshBase();ensure(x);return x};
 const renderBase=render;render=function(){const value=renderBase.apply(this,arguments);requestAnimationFrame(afterRender);return value};
 if(typeof S!=='undefined'&&S)ensure(S);

 window.v170OpenTournamentGrounds=openGrounds;window.v170StartTournament=start;window.v170JoustAim=joustAim;window.v170SetLance=setLance;window.v170NextJoust=nextJoust;window.v170DuelRespond=duelRespond;window.v170NextDuel=nextDuel;window.v170LooseArrow=looseArrow;window.v170NextArrow=nextArrow;window.v170ContinueTournament=continueTournament;window.v170CloseTournament=closeTournament;window.v170Forfeit=forfeit;
 window.AetherionTournamentsV170=Object.freeze({version:VERSION,assets:ART,ensure,hub,tournamentTab,state:()=>({session:runtime.session,ledger:S?ensure():null}),rules:Object.freeze({laneExposure,timingGrade,archeryPoints,duelAnswer,joustResolution,markerAt,arrowAt})});
})();

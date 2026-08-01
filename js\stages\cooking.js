/* ========== 烹饪阶段（炒/煮/烤/煎 + 火候 + 翻炒 + 烧焦） ========== */
Cook.Cooking = (function(){
  const E = Cook.Engine, P = Cook.Particles, In = Cook.Input;

  /* 各模式参数 */
  const MODE_CFG = {
    stir:  { name:'炒',   targetRange:[0.82,0.95], burnRate:0.00045, cookRate:0.00033, stirCool:260, pot:'wok' },
    boil:  { name:'煮',   targetRange:[0.85,0.97], burnRate:0.00018, cookRate:0.00030, stirCool:420, pot:'pot' },
    bake:  { name:'烤',   targetRange:[0.88,0.96], burnRate:0.00032, cookRate:0.00026, stirCool:520, pot:'pan' },
    fry:   { name:'煎',   targetRange:[0.84,0.95], burnRate:0.00040, cookRate:0.00030, stirCool:320, pot:'pan' },
    blend: { name:'搅拌', targetRange:[0.85,0.97], burnRate:0.0,     cookRate:0.00080, stirCool:200, pot:'blender' },
    shape: { name:'塑形', targetRange:[0.85,0.97], burnRate:0.0,     cookRate:0.00070, stirCool:240, pot:'mat' }
  };

  let recipe=null, mode='stir', cfg=null, scores={};
  let cookProgress=0, burnLevel=0, heatLevel=0.4;
  let done=false, served=false, burnt=false;
  let pot={x:0,y:0,w:0,h:0};
  let stirCD=0, stirAnim=0;
  let startTime=0;
  let dragH=null, tapH=null, sliderH=null, serveH=null, backH=null;
  let foodBits=[];   // 锅内食材碎块（翻炒跳动）

  function setupLayout(){
    const W=E.SW, H=E.SH;
    const pw = Math.min(W*0.7, 360);
    const ph = pw*0.6;
    pot = { x:W/2, y:H*0.46, w:pw, h:ph };
    // 锅内食材碎块
    foodBits = [];
    const n = 7;
    for(let i=0;i<n;i++){
      const a = i/n*Math.PI*2;
      foodBits.push({
        x: pot.x + Math.cos(a)*pot.w*0.18,
        y: pot.y + Math.sin(a)*pot.h*0.18,
        bx: pot.x + Math.cos(a)*pot.w*0.18,
        by: pot.y + Math.sin(a)*pot.h*0.18,
        vx:0, vy:0, rot:E.rnd(0,6.28), r:E.rnd(10,16)
      });
    }
  }

  function enter(data){
    recipe = data.recipe; scores = data.scores||{}; mode = recipe.mode;
    cfg = MODE_CFG[mode];
    if(!cfg){
      Cook.Game.toast('【'+recipe.name+'】烹饪方式开发中');
      setTimeout(()=> Cook.Game.goMenu(), 1500);
      return;
    }
    cookProgress=0; burnLevel=0; heatLevel=0.4; done=false; served=false; burnt=false;
    stirCD=0; stirAnim=0;
    P.clear();
    setupLayout();
    startTime = Date.now();
    showCtrl();

    dragH = e=>onDrag(e);
    tapH  = e=>onTap(e);
    In.on('drag', dragH);
    In.on('tap', tapH);

    const slider = document.getElementById('heatSlider');
    slider.value = 40;
    sliderH = ()=>{ heatLevel = parseInt(slider.value)/100; updateFireLabel(); };
    slider.addEventListener('input', sliderH);
    const serve = document.getElementById('serveBtn');
    serveH = ()=> serveDish();
    serve.addEventListener('click', serveH);
    const back = document.getElementById('hudBack');
    backH = ()=> Cook.Game.goMenu();
    back.addEventListener('click', backH);
    updateFireLabel();
    updateHUD();
    /* 烹饪环境音（炒/煮/烤/煎有火，blend/shape 无火不响） */
    if(mode !== 'blend' && mode !== 'shape') Cook.Audio.startSizzle();
  }

  function exit(){
    if(dragH) In.off('drag', dragH);
    if(tapH)  In.off('tap', tapH);
    const slider=document.getElementById('heatSlider'); if(slider&&sliderH) slider.removeEventListener('input',sliderH);
    const serve=document.getElementById('serveBtn');     if(serve&&serveH) serve.removeEventListener('click',serveH);
    const back=document.getElementById('hudBack');      if(back&&backH) back.removeEventListener('click',backH);
    hideCtrl();
    Cook.Audio.stopSizzle();
  }

  function showCtrl(){
    document.getElementById('cookCtrl').style.display = 'flex';
    document.getElementById('hud').style.display = 'flex';
  }
  function hideCtrl(){
    document.getElementById('cookCtrl').style.display = 'none';
    document.getElementById('hud').style.display = 'none';
  }
  function updateFireLabel(){
    const lbl = document.getElementById('fireLabel');
    let t='小火', col='#7ac85a';
    if(heatLevel>0.66){ t='大火'; col='#e84a3a'; }
    else if(heatLevel>0.33){ t='中火'; col='#f4a830'; }
    lbl.textContent = t; lbl.style.color = col;
  }
  function updateHUD(){
    const emoji = mode==='blend' ? '🥤' : mode==='shape' ? '👐' : '🔥';
    const subMap = {
      stir:'拖动火候 · 点击锅内翻炒 · 熟度进绿区出锅',
      boil:'拖动火候 · 点击锅内搅动 · 熟度进绿区出锅',
      bake:'拖动火候 · 点击翻面 · 熟度进绿区出锅',
      fry: '拖动火候 · 点击翻面 · 熟度进绿区出锅',
      blend:'拖动力度 · 点击搅拌 · 浓度进绿区完成',
      shape:'拖动力度 · 点击塑形 · 成型进绿区完成'
    };
    document.getElementById('hudGoal').textContent = emoji+' 烹饪·'+cfg.name;
    document.getElementById('hudSub').textContent = subMap[mode] || subMap.stir;
    document.getElementById('hudRight').innerHTML = '<small>菜品</small>'+recipe.name;
    const serve = document.getElementById('serveBtn');
    const inRange = cookProgress>=cfg.targetRange[0] && cookProgress<=cfg.targetRange[1];
    serve.disabled = !inRange && cookProgress<0.5;
    serve.style.opacity = serve.disabled?0.4:1;
  }

  function inPot(x,y){
    const dx=(x-pot.x)/(pot.w*0.5), dy=(y-pot.y)/(pot.h*0.5);
    return dx*dx+dy*dy < 1.15;
  }
  function onTap(e){ if(inPot(e.x,e.y)) stir(); }
  function onDrag(e){ if(inPot(e.x,e.y)) stir(); }

  function stir(){
    if(done || stirCD>0) return;
    stirCD = cfg.stirCool;
    stirAnim = 1;
    burnLevel = Math.max(0, burnLevel - 0.16);
    // 翻炒/搅拌音效
    Cook.Audio.stir();
    // 食材跳起
    foodBits.forEach(b=>{
      b.vy = -E.rnd(2.5,4.5); b.vx = E.rnd(-1.5,1.5); b.rot += E.rnd(-0.5,0.5);
    });
    // 翻炒粒子（油花）
    P.burst(pot.x, pot.y, 10, { col:['#ffd640','#ff8a3a','#fff0c8'], spMin:1, spMax:3.5, life:24, rMin:1, rMax:2.5 });
    updateHUD();
  }

  function serveDish(){
    if(done) return;
    if(cookProgress < 0.5){ Cook.Game.toast('还没熟，再煮一会儿！'); return; }
    finish();
  }

  function finish(){
    done = true;
    served = true;
    const result = score();
    setTimeout(()=> Cook.Game.stageComplete('cooking', result), 600);
  }

  function score(){
    // 熟度精准
    const [lo,hi] = cfg.targetRange;
    let precise = 100;
    if(cookProgress < lo) precise = Math.max(0, 100*(cookProgress/lo));
    else if(cookProgress > hi) precise = Math.max(0, 100*(1-(cookProgress-hi)/(1-hi)));
    // 焦糊
    const burn = Math.max(0, 1-burnLevel);
    // 时间
    const t = (Date.now()-startTime)/1000;
    const idealT = 16;
    const timing = Math.max(0, 100*(1-Math.abs(t-idealT)/idealT));
    const total = Math.round(precise*0.55 + burn*0.35 + timing*0.1);
    const star = total>=82?3 : total>=58?2 : total>=35?1 : 0;
    return { score:total, star, detail:{ 熟度:Math.round(precise), 火候控制:Math.round(burn), 用时:t.toFixed(1)+'s', 熟度值:Math.round(cookProgress*100)+'%' } };
  }

  function update(){
    const dt = E.dt;
    if(!done){
      // 熟度
      cookProgress += heatLevel * cfg.cookRate * dt;
      // 焦糊（火力越大越易焦，熟度高时更易焦）
      const burnBoost = 1 + cookProgress*0.8;
      burnLevel += Math.pow(heatLevel,1.5) * cfg.burnRate * burnBoost * dt;
      // 烧焦强制出锅
      if(burnLevel >= 0.88 && !done){
        burnt = true; done = true;
        const result = score();
        Cook.Game.toast('烧焦了！');
        setTimeout(()=> Cook.Game.stageComplete('cooking', result), 800);
      }
      cookProgress = Math.min(1, cookProgress);
      burnLevel = Math.min(1, burnLevel);
    }
    // 翻炒冷却与动画
    if(stirCD>0) stirCD -= dt;
    stirAnim *= 0.9;
    // 食材碎块物理
    foodBits.forEach(b=>{
      b.vy += 0.35; b.x += b.vx; b.y += b.vy; b.rot += b.vx*0.05;
      // 回到基础位置
      b.x += (b.bx-b.x)*0.06; b.y += (b.by-b.y)*0.06;
      b.vx *= 0.96;
      if(b.y>b.by){ b.y=b.by; b.vy*=-0.3; }
    });
    // 火焰粒子
    if(heatLevel>0.05 && Math.random()<heatLevel*0.8){
      P.flame(pot.x+E.rnd(-pot.w*0.3,pot.w*0.3), pot.y+pot.h*0.42, Math.ceil(heatLevel*3)+1);
    }
    // 蒸汽
    if(cookProgress>0.35 && Math.random()<0.4){
      P.steam(pot.x+E.rnd(-pot.w*0.25,pot.w*0.25), pot.y-pot.h*0.2, 1, {spread:pot.w*0.15, life:70});
    }
    P.update();
    if(E.frame%6===0) updateHUD();
  }

  function render(){
    const ctx=E.ctx;
    drawScene();
    drawStove();
    drawFlameGlow();
    drawPot();
    drawFoodBits();
    drawSteam();
    P.render();
    drawProgressRing();
  }

  function drawScene(){
    const ctx=E.ctx, W=E.SW, H=E.SH;
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#fff5f0'); g.addColorStop(1,'#ffe8d8');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    const glow=ctx.createRadialGradient(W/2, H*0.4, 40, W/2, H*0.4, W*0.7);
    glow.addColorStop(0,'rgba(255,138,90,'+(0.1+heatLevel*0.2)+')'); glow.addColorStop(1,'rgba(255,138,90,0)');
    ctx.fillStyle=glow; ctx.fillRect(0,0,W,H);
  }

  function drawStove(){
    const ctx=E.ctx;
    const {x,y,w,h}=pot;
    // 灶台
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(x, y+h*0.7, w*0.62, h*0.28, 0, 0, Math.PI*2); ctx.fill();
    const g=ctx.createLinearGradient(0, y+h*0.4, 0, y+h*0.95);
    g.addColorStop(0,'#4a3a2e'); g.addColorStop(1,'#2a1d14');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.ellipse(x, y+h*0.6, w*0.58, h*0.34, 0, 0, Math.PI*2); ctx.fill();
    // 灶口
    ctx.fillStyle='#1a1208';
    ctx.beginPath(); ctx.ellipse(x, y+h*0.5, w*0.42, h*0.22, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawFlameGlow(){
    if(heatLevel<=0.05) return;
    const ctx=E.ctx, {x,y,w,h}=pot;
    ctx.save();
    const r = w*0.4*(0.6+heatLevel*0.5);
    const g=ctx.createRadialGradient(x, y+h*0.45, 5, x, y+h*0.45, r);
    g.addColorStop(0,'rgba(255,180,60,'+(0.5*heatLevel)+')');
    g.addColorStop(0.5,'rgba(255,100,40,'+(0.3*heatLevel)+')');
    g.addColorStop(1,'rgba(255,80,30,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x, y+h*0.45, r, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  /* —— 搅拌机（blend 模式专用） —— */
  function drawBlender(){
    const ctx=E.ctx, {x,y,w,h}=pot;
    ctx.save();
    /* 阴影 */
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(x, y+h*0.5, w*0.5, h*0.16, 0,0,Math.PI*2); ctx.fill();
    /* 底座 */
    const bg=ctx.createLinearGradient(0, y+h*0.1, 0, y+h*0.5);
    bg.addColorStop(0,'#5a5a62'); bg.addColorStop(1,'#2a2a32');
    ctx.fillStyle=bg;
    E.roundRect(x-w*0.36, y+h*0.1, w*0.72, h*0.4, 8); ctx.fill();
    /* 指示灯 */
    ctx.fillStyle='#1a1a22'; ctx.beginPath(); ctx.arc(x, y+h*0.3, w*0.05, 0,Math.PI*2); ctx.fill();
    ctx.fillStyle = heatLevel>0.05 ? '#7ac85a' : '#3a3a42';
    ctx.beginPath(); ctx.arc(x, y+h*0.3, w*0.025, 0,Math.PI*2); ctx.fill();
    /* 透明杯身 */
    const cupTop = y-h*0.45, cupBot = y+h*0.12, cupW = w*0.3;
    const cg=ctx.createLinearGradient(x-cupW,0,x+cupW,0);
    cg.addColorStop(0,'rgba(255,255,255,0.22)'); cg.addColorStop(0.5,'rgba(255,255,255,0.06)'); cg.addColorStop(1,'rgba(255,255,255,0.22)');
    ctx.fillStyle=cg; ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(x-cupW, cupTop); ctx.lineTo(x+cupW, cupTop);
    ctx.lineTo(x+cupW*0.78, cupBot); ctx.lineTo(x-cupW*0.78, cupBot); ctx.closePath();
    ctx.fill(); ctx.stroke();
    /* 奶昔液（粉色，随熟度上升） */
    if(cookProgress>0.05){
      const span = cupBot-cupTop, fillH = span*Math.min(1, cookProgress), lTop = cupBot-fillH;
      const ratio = (lTop-cupTop)/span, lwTop = cupW*(1-ratio*0.22);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x-cupW*0.78, cupBot); ctx.lineTo(x+cupW*0.78, cupBot);
      ctx.lineTo(x+lwTop, lTop); ctx.lineTo(x-lwTop, lTop); ctx.closePath();
      ctx.clip();
      const lg=ctx.createLinearGradient(0, lTop, 0, cupBot);
      lg.addColorStop(0,'#ffd0dc'); lg.addColorStop(1,'#e87a98');
      ctx.fillStyle=lg; ctx.fillRect(x-cupW, cupTop, cupW*2, span);
      ctx.restore();
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(x-lwTop, lTop); ctx.lineTo(x+lwTop, lTop); ctx.stroke();
    }
    /* 旋转刀片 */
    const bladeRot = E.frame*0.3*heatLevel + stirAnim*5;
    ctx.save(); ctx.translate(x, cupBot-3); ctx.rotate(bladeRot);
    ctx.fillStyle='#c8d0d8';
    E.roundRect(-cupW*0.6, -2, cupW*1.2, 4, 2); ctx.fill();
    ctx.rotate(Math.PI/2);
    E.roundRect(-cupW*0.5, -2, cupW*1.0, 4, 2); ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  /* —— 寿司竹帘（shape 模式专用） —— */
  function drawMat(){
    const ctx=E.ctx, {x,y,w,h}=pot;
    ctx.save();
    /* 阴影 */
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(x, y+h*0.5, w*0.5, h*0.16, 0,0,Math.PI*2); ctx.fill();
    /* 竹帘底座 */
    const bg=ctx.createLinearGradient(0, y-h*0.3, 0, y+h*0.5);
    bg.addColorStop(0,'#7a5a3a'); bg.addColorStop(1,'#4a3420');
    ctx.fillStyle=bg;
    E.roundRect(x-w*0.42, y-h*0.28, w*0.84, h*0.76, 10); ctx.fill();
    /* 竹条（竖排，交替深浅） */
    const cols=11, gap=w*0.84/cols;
    for(let i=0;i<cols;i++){
      const sx=x-w*0.42+i*gap;
      ctx.fillStyle = i%2? '#d8b07a':'#c8a06a';
      ctx.fillRect(sx, y-h*0.24, gap*0.72, h*0.68);
    }
    /* 竹帘绑带（上下横带） */
    ctx.fillStyle='#3a2a18';
    ctx.fillRect(x-w*0.42, y-h*0.27, w*0.84, h*0.05);
    ctx.fillRect(x-w*0.42, y+h*0.2, w*0.84, h*0.05);
    /* 成型饭团（随熟度增大，捏成椭圆形） */
    if(cookProgress>0.05){
      const pr = h*0.3*Math.min(1, cookProgress);
      const rx=x, ry=y-h*0.02;
      /* 饭团阴影 */
      ctx.fillStyle='rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.ellipse(rx, ry+pr*0.5, pr*1.05, pr*0.45, 0,0,Math.PI*2); ctx.fill();
      /* 饭团（白米渐变，椭圆形=握饭造型） */
      const rg=ctx.createRadialGradient(rx-pr*0.3, ry-pr*0.3, pr*0.1, rx, ry, pr);
      rg.addColorStop(0,'#fffef0'); rg.addColorStop(1,'#e8e0c8');
      ctx.fillStyle=rg;
      ctx.beginPath(); ctx.ellipse(rx, ry, pr, pr*0.62, 0,0,Math.PI*2); ctx.fill();
      /* 米粒纹理（散点高光） */
      ctx.fillStyle='rgba(255,255,255,0.5)';
      for(let i=0;i<9;i++){
        const a=i/9*Math.PI*2, rr=pr*0.55;
        ctx.beginPath(); ctx.arc(rx+Math.cos(a)*rr, ry+Math.sin(a)*rr*0.6, pr*0.07, 0,Math.PI*2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawPot(){
    const ctx=E.ctx, {x,y,w,h}=pot;
    if(cfg.pot==='blender'){ drawBlender(); return; }
    if(cfg.pot==='mat'){ drawMat(); return; }
    ctx.save();
    // 锅身
    const g=ctx.createLinearGradient(0, y-h*0.4, 0, y+h*0.5);
    g.addColorStop(0,'#5a5a62'); g.addColorStop(0.5,'#2a2a32'); g.addColorStop(1,'#1a1a22');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.ellipse(x, y, w*0.5, h*0.5, 0, 0, Math.PI*2); ctx.fill();
    // 锅口高光
    ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.ellipse(x, y-h*0.02, w*0.5, h*0.5, 0, Math.PI*0.1, Math.PI*0.9); ctx.stroke();
    // 锅内（深色）
    ctx.fillStyle='#15151c';
    ctx.beginPath(); ctx.ellipse(x, y, w*0.42, h*0.4, 0, 0, Math.PI*2); ctx.fill();
    // 锅内反光（油）
    if(cookProgress>0.1){
      ctx.fillStyle='rgba(255,180,80,'+(0.08+cookProgress*0.15)+')';
      ctx.beginPath(); ctx.ellipse(x, y, w*0.4, h*0.36, 0, 0, Math.PI*2); ctx.fill();
    }
    // 把柄
    ctx.fillStyle='#3a3a42';
    E.roundRect(x+w*0.48, y-h*0.06, w*0.28, h*0.14, 6); ctx.fill();
    ctx.fillStyle='#5a5a62';
    E.roundRect(x-w*0.76, y-h*0.06, w*0.28, h*0.14, 6); ctx.fill();
    ctx.restore();
  }

  function drawFoodBits(){
    const ctx=E.ctx, {x,y,w,h}=pot;
    const name = recipe.cutFood;
    const burntAmt = burnLevel;
    foodBits.forEach(b=>{
      const jump = stirAnim * 8;
      ctx.save();
      ctx.translate(b.x, b.y - jump);
      ctx.rotate(b.rot);
      // 食材块
      Cook.Ingredients.drawSlice(name, 0, 0, b.r);
      // 烧焦变暗
      if(burntAmt>0.3){
        ctx.globalAlpha = burntAmt*0.7;
        ctx.fillStyle = '#1a0a04';
        ctx.beginPath(); ctx.arc(0,0,b.r*0.9,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    });
  }

  function drawSteam(){ /* 蒸汽由粒子系统渲染，这里空占位 */ }

  function drawProgressRing(){
    const ctx=E.ctx, {x,y,w,h}=pot;
    const cx = x, cy = y - h*0.95, R = Math.min(w*0.12, 34);
    ctx.save();
    // 底环
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(cx,cy,R+6,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=6;
    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke();
    // 目标区间高亮（绿弧）
    const [lo,hi]=cfg.targetRange;
    ctx.strokeStyle='rgba(122,200,90,0.6)'; ctx.lineWidth=6;
    ctx.beginPath();
    ctx.arc(cx,cy,R, -Math.PI/2+lo*Math.PI*2, -Math.PI/2+hi*Math.PI*2);
    ctx.stroke();
    // 当前进度
    const col = cookProgress>hi?'#e84a3a' : cookProgress>=lo?'#7ac85a' : '#f4a830';
    ctx.strokeStyle=col; ctx.lineWidth=6; ctx.lineCap='round';
    ctx.beginPath();
    ctx.arc(cx,cy,R, -Math.PI/2, -Math.PI/2+cookProgress*Math.PI*2);
    ctx.stroke();
    // 焦糊指示
    if(burnLevel>0.2){
      ctx.fillStyle='rgba(232,74,58,'+burnLevel+')';
      ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('焦', cx, cy+4);
    }else{
      ctx.fillStyle='#fff'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
      ctx.fillText(Math.round(cookProgress*100)+'%', cx, cy+4);
    }
    ctx.restore();
  }

  return { enter, exit, update, render };
})();

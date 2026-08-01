/* ========== 摆盘阶段（拖拽摆放 · 旋转/删除 · 对称/构图/整洁评分） ========== */
Cook.Plating = (function(){
  const E = Cook.Engine, P = Cook.Particles, In = Cook.Input, Ingr = Cook.Ingredients;

  let recipe=null, scores={};
  let plate={x:0,y:0,r:0};
  let tray=[];            // 托盘剩余 {type, r, count, label, kind}
  let placed=[];          // 已摆放 {x,y,rot,type,r,kind}
  let sel=-1;             // 选中索引
  let dragging=null;      // {from, idx/trayIdx, x, y, type, r, kind, isNew}
  let downPos={x:0,y:0}, moved=false;
  let done=false;
  let downH=null, moveH=null, upH=null, rotLH=null, rotRH=null, rmH=null, finH=null, backH=null;

  function setupLayout(){
    const W=E.SW, H=E.SH;
    const r = Math.min(W*0.34, H*0.26, 150);
    plate = { x:W/2, y:H*0.42, r };
    tray = [];
    const mainCount = recipe.plateItems || 3;
    tray.push({ type:recipe.cutFood, r:r*0.2,  count:mainCount, kind:'slice' });
    tray.push({ type:'herb',         r:r*0.16, count:2,         kind:'herb'  });
  }

  function enter(data){
    recipe = data.recipe; scores = data.scores||{};
    placed=[]; sel=-1; dragging=null; done=false;
    P.clear();
    setupLayout();
    showCtrl();
    updateHUD();

    downH = e=>onDown(e);
    moveH = e=>onMove(e);
    upH  = e=>onUp(e);
    In.on('down', downH);
    In.on('move', moveH);
    In.on('up', upH);

    const rotL = document.getElementById('rotLeft');
    rotLH = ()=>rotateSel(-15);
    rotL.addEventListener('click', rotLH);
    const rotR = document.getElementById('rotRight');
    rotRH = ()=>rotateSel(15);
    rotR.addEventListener('click', rotRH);
    const rm = document.getElementById('plateRemove');
    rmH = ()=>removeSel();
    rm.addEventListener('click', rmH);
    const fin = document.getElementById('plateFinish');
    finH = ()=>confirmFinish();
    fin.addEventListener('click', finH);
    const back = document.getElementById('hudBack');
    backH = ()=> Cook.Game.goMenu();
    back.addEventListener('click', backH);
  }

  function exit(){
    if(downH) In.off('down', downH);
    if(moveH) In.off('move', moveH);
    if(upH)   In.off('up', upH);
    const rotL=document.getElementById('rotLeft');   if(rotL&&rotLH) rotL.removeEventListener('click',rotLH);
    const rotR=document.getElementById('rotRight');   if(rotR&&rotRH) rotR.removeEventListener('click',rotRH);
    const rm  =document.getElementById('plateRemove'); if(rm&&rmH)   rm.removeEventListener('click',rmH);
    const fin =document.getElementById('plateFinish'); if(fin&&finH) fin.removeEventListener('click',finH);
    const back=document.getElementById('hudBack');    if(back&&backH) back.removeEventListener('click',backH);
    hideCtrl();
  }

  function showCtrl(){
    document.getElementById('plateCtrl').style.display = 'flex';
    document.getElementById('hud').style.display = 'flex';
  }
  function hideCtrl(){
    document.getElementById('plateCtrl').style.display = 'none';
    document.getElementById('hud').style.display = 'none';
  }
  function updateHUD(){
    document.getElementById('hudGoal').textContent = '🍽 摆盘';
    document.getElementById('hudSub').textContent  = '拖食材到盘中 · 点选可旋转/删除 · 已摆 '+placed.length+' 件';
    document.getElementById('hudRight').innerHTML  = '<small>菜品</small>'+recipe.name;
  }

  /* 托盘槽位坐标（控制条上方，避免与底部控制条重叠） */
  function traySlot(i){
    const W=E.SW, H=E.SH;
    const n = tray.length;
    const gap = 96;
    const startX = W/2 - (n-1)*gap/2;
    return { x:startX + i*gap, y:H - 150 };
  }

  function onDown(e){
    if(done) return;
    downPos = {x:e.x, y:e.y}; moved=false;
    // 1. 命中已摆放食材（从上到下）
    for(let i=placed.length-1;i>=0;i--){
      const p=placed[i];
      if(Math.hypot(e.x-p.x, e.y-p.y) <= p.r*1.15){
        sel = i;
        dragging = { from:'placed', idx:i, x:e.x, y:e.y, type:p.type, r:p.r, kind:p.kind };
        return;
      }
    }
    // 2. 命中托盘
    for(let i=0;i<tray.length;i++){
      const t=tray[i];
      if(t.count<=0) continue;
      const s=traySlot(i);
      if(Math.hypot(e.x-s.x, e.y-s.y) <= t.r*1.7){
        dragging = { from:'tray', trayIdx:i, x:e.x, y:e.y, type:t.type, r:t.r, kind:t.kind, isNew:true };
        sel = -1;
        return;
      }
    }
    // 3. 空白 → 取消选中
    sel = -1;
  }

  function onMove(e){
    if(!dragging) return;
    if(Math.hypot(e.x-downPos.x, e.y-downPos.y) > 6) moved=true;
    dragging.x = e.x; dragging.y = e.y;
    if(dragging.from==='placed'){
      placed[dragging.idx].x = e.x;
      placed[dragging.idx].y = e.y;
    }
  }

  function onUp(e){
    if(!dragging) return;
    if(dragging.from==='tray'){
      if(moved && overPlate(e.x, e.y)){
        placed.push({ x:e.x, y:e.y, rot:E.rnd(0,6.28), type:dragging.type, r:dragging.r, kind:dragging.kind });
        tray[dragging.trayIdx].count--;
        P.sparkle(e.x, e.y, 8);
        Cook.Audio.place();
        sel = placed.length-1;
      }
    }
    // placed 拖动：位置已实时更新
    dragging = null;
    updateHUD();
  }

  /* 命中判定：blend 模式杯口为椭圆(rx=r, ry=r*0.62)，其余为圆；scale 为半径缩放 */
  function plateHit(x, y, scale){
    const s = scale==null ? 1 : scale;
    if(recipe.mode === 'blend'){
      const dx=(x-plate.x)/(plate.r*s), dy=(y-plate.y)/(plate.r*0.62*s);
      return dx*dx+dy*dy <= 1;
    }
    return Math.hypot(x-plate.x, y-plate.y) <= plate.r*s;
  }
  function overPlate(x,y){
    return plateHit(x, y, 0.95);
  }
  function rotateSel(deg){
    if(sel<0){ Cook.Game.toast('先点选一个食材'); return; }
    placed[sel].rot += deg*Math.PI/180;
  }
  function removeSel(){
    if(sel<0){ Cook.Game.toast('先点选一个食材'); return; }
    const p = placed[sel];
    const ti = tray.findIndex(t=>t.type===p.type);
    if(ti>=0) tray[ti].count++;
    placed.splice(sel,1);
    sel = -1;
    updateHUD();
  }
  function confirmFinish(){
    if(done) return;
    if(placed.length===0){ Cook.Game.toast('盘中还空着呢！'); return; }
    done = true;
    const result = score();
    P.sparkle(plate.x, plate.y, 24);
    setTimeout(()=> Cook.Game.stageComplete('plating', result), 600);
  }

  /* —— 摆盘评分：覆盖/对称/构图/整洁/溢出 —— */
  function score(){
    const n = placed.length;
    // 覆盖率
    let area=0; placed.forEach(p=> area += Math.PI*p.r*p.r);
    const plateArea = recipe.mode==='blend' ? Math.PI*plate.r*(plate.r*0.62) : Math.PI*plate.r*plate.r;
    const cov = area/plateArea;
    const covScore = cov<0.3 ? 100*(cov/0.3)
                  : cov>0.65 ? Math.max(0, 100*(1-(cov-0.65)/0.45))
                  : 100;
    // 溢出（超出杯/盘边界即计为溢出）
    let off=0; placed.forEach(p=>{ if(!plateHit(p.x, p.y, 0.9)) off++; });
    const offScore = Math.max(0, 100 - off*30);
    // 重叠
    let overlaps=0;
    for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){
      const d=Math.hypot(placed[i].x-placed[j].x, placed[i].y-placed[j].y);
      if(d < (placed[i].r+placed[j].r)*0.45) overlaps++;
    }
    const overlapScore = Math.max(0, 100 - overlaps*22);
    // 对称（四象限面积平衡）
    const q=[0,0,0,0];
    placed.forEach(p=>{
      const dx=p.x-plate.x, dy=p.y-plate.y;
      const qi=(dx>=0?1:0)+(dy>=0?2:0);
      q[qi]+=Math.PI*p.r*p.r;
    });
    const mean=q.reduce((a,b)=>a+b,0)/4;
    const variance=q.reduce((a,b)=>a+(b-mean)*(b-mean),0)/4;
    const std=Math.sqrt(variance);
    const symScore = mean>0 ? Math.max(0, 100*(1 - std/mean)) : 0;
    // 构图（质心居中）
    let cx=0,cy=0; placed.forEach(p=>{cx+=p.x;cy+=p.y;}); cx/=n; cy/=n;
    const cdist=Math.hypot(cx-plate.x,cy-plate.y)/plate.r;
    const compScore=Math.max(0, 100*(1-cdist/0.5));

    const total=Math.round(covScore*0.22 + symScore*0.30 + compScore*0.20 + overlapScore*0.15 + offScore*0.13);
    const star=total>=82?3 : total>=58?2 : total>=35?1 : 0;
    return { score:total, star, detail:{ 覆盖:Math.round(covScore), 对称:Math.round(symScore), 构图:Math.round(compScore), 整洁:Math.round(overlapScore), 溢出:off } };
  }

  function update(){ P.update(); }

  function render(){
    drawScene();
    drawPlate();
    drawPlaced();
    drawTray();
    drawDragging();
    P.render();
  }

  function drawScene(){
    const ctx=E.ctx, W=E.SW, H=E.SH;
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#fff5f8'); g.addColorStop(1,'#ffe8ef');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    const glow=ctx.createRadialGradient(W/2, H*0.4, 40, W/2, H*0.4, W*0.6);
    glow.addColorStop(0,'rgba(255,138,168,0.13)'); glow.addColorStop(1,'rgba(255,138,168,0)');
    ctx.fillStyle=glow; ctx.fillRect(0,0,W,H);
  }

  function drawPlate(){
    const ctx=E.ctx, {x,y,r}=plate;
    ctx.save();
    if(recipe.mode === 'blend'){
      /* blend 模式：俯视奶昔杯作为摆盘容器（食材作杯口装饰） */
      Ingr.cupTop(x, y, r, 0.9);
    } else {
      /* 普通菜品：圆盘 */
      ctx.fillStyle='rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(x, y+r*0.4, r*1.05, r*0.32, 0,0,Math.PI*2); ctx.fill();
      // 盘边
      const g=ctx.createRadialGradient(x-r*0.3, y-r*0.3, r*0.2, x, y, r);
      g.addColorStop(0,'#fffaf2'); g.addColorStop(0.8,'#ece0cc'); g.addColorStop(1,'#c8b89a');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.ellipse(x, y, r, r*0.62, 0,0,Math.PI*2); ctx.fill();
      // 盘内凹陷
      ctx.fillStyle='#e8dcc4';
      ctx.beginPath(); ctx.ellipse(x, y, r*0.86, r*0.52, 0,0,Math.PI*2); ctx.fill();
      // 内圈纹
      ctx.strokeStyle='rgba(180,160,120,0.3)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.ellipse(x, y, r*0.7, r*0.42, 0,0,Math.PI*2); ctx.stroke();
    }
    ctx.restore();
  }

  function drawPiece(p, alpha){
    const ctx=E.ctx;
    ctx.save();
    ctx.globalAlpha = alpha==null?1:alpha;
    ctx.translate(p.x, p.y); ctx.rotate(p.rot||0);
    if(p.kind==='herb' || p.type==='herb') drawHerb(0,0,p.r);
    else Ingr.drawSlice(p.type, 0, 0, p.r);
    ctx.restore();
  }

  /* 香草配菜（绿叶） */
  function drawHerb(x,y,r){
    const ctx=E.ctx;
    ctx.save(); ctx.translate(x,y);
    ctx.fillStyle='rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(1, r*0.5, r*0.8, r*0.25, 0,0,Math.PI*2); ctx.fill();
    const g=ctx.createLinearGradient(0,-r,0,r);
    g.addColorStop(0,'#7ac85a'); g.addColorStop(1,'#3a8a2a');
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.moveTo(0,-r); ctx.bezierCurveTo(r*0.8,-r*0.4, r*0.6,r*0.6, 0,r*0.8);
    ctx.bezierCurveTo(-r*0.6,r*0.6, -r*0.8,-r*0.4, 0,-r); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(30,80,20,0.5)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,-r*0.8); ctx.lineTo(0,r*0.7); ctx.stroke();
    ctx.restore();
  }

  function drawPlaced(){
    placed.forEach((p,i)=>{
      drawPiece(p, 1);
      if(i===sel){
        const ctx=E.ctx;
        ctx.save();
        ctx.strokeStyle='rgba(244,214,120,0.9)'; ctx.lineWidth=2.5; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r*1.25, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
      }
    });
  }

  function drawTray(){
    const ctx=E.ctx;
    tray.forEach((t,i)=>{
      const s=traySlot(i);
      ctx.save();
      // 槽位
      ctx.fillStyle='rgba(255,255,255,0.06)';
      ctx.beginPath(); ctx.ellipse(s.x, s.y, t.r*1.7, t.r*1.3, 0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(232,184,120,0.25)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.ellipse(s.x, s.y, t.r*1.7, t.r*1.3, 0,0,Math.PI*2); ctx.stroke();
      if(t.count>0){
        const dimmed = dragging && dragging.from==='tray' && dragging.trayIdx===i;
        drawPiece({ x:s.x, y:s.y, rot:0, type:t.type, r:t.r, kind:t.kind }, dimmed?0.4:1);
        ctx.fillStyle='#fff4d8'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('×'+t.count, s.x, s.y + t.r*1.7 + 14);
      } else {
        ctx.fillStyle='#7a6448'; ctx.font='12px sans-serif'; ctx.textAlign='center';
        ctx.fillText('空', s.x, s.y+4);
      }
      ctx.restore();
    });
  }

  function drawDragging(){
    if(!dragging || !dragging.isNew) return;
    drawPiece({ x:dragging.x, y:dragging.y, rot:0, type:dragging.type, r:dragging.r, kind:dragging.kind }, 0.85);
  }

  return { enter, exit, update, render };
})();

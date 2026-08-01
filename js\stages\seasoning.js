/* ========== 调味阶段（长按倾倒 · 目标用量带 · 粉末粒子） ========== */
Cook.Seasoning = (function(){
  const E = Cook.Engine, P = Cook.Particles, In = Cook.Input, Ingr = Cook.Ingredients;

  const BAND = 0.12;            // 目标带半宽
  const POUR_RATE = 0.42;       // 每秒增量（基础）
  const RESET_MAX = 2;

  let recipe=null, scores={}, target=0.5;
  let amount=0, pouring=false, done=false;
  let tilt=0, startTime=0, resetUsed=0;
  let bowl={x:0,y:0,r:0}, shaker={x:0,y:0};
  let downH=null, upH=null, finishH=null, resetH=null, backH=null;

  function setupLayout(){
    const W=E.SW, H=E.SH;
    const r = Math.min(W*0.24, H*0.2, 130);
    bowl  = { x:W/2, y:H*0.56, r };
    shaker= { x:W/2, y:H*0.24 };
  }

  function enter(data){
    recipe = data.recipe; scores = data.scores||{};
    target = recipe.seasonTarget || 0.5;
    amount=0; pouring=false; done=false; tilt=0; resetUsed=0;
    P.clear();
    setupLayout();
    startTime = Date.now();
    showCtrl();
    updateHUD();

    downH = e=>onDown(e);
    upH  = e=>onUp(e);
    In.on('down', downH);
    In.on('up', upH);

    const finish = document.getElementById('seasonFinish');
    finishH = ()=>confirmFinish();
    finish.addEventListener('click', finishH);
    const reset = document.getElementById('seasonReset');
    resetH = ()=>doReset();
    reset.addEventListener('click', resetH);
    const back = document.getElementById('hudBack');
    backH = ()=> Cook.Game.goMenu();
    back.addEventListener('click', backH);
  }

  function exit(){
    if(downH) In.off('down', downH);
    if(upH)   In.off('up', upH);
    const finish=document.getElementById('seasonFinish'); if(finish&&finishH) finish.removeEventListener('click',finishH);
    const reset =document.getElementById('seasonReset');  if(reset&&resetH)  reset.removeEventListener('click',resetH);
    const back  =document.getElementById('hudBack');     if(back&&backH)   back.removeEventListener('click',backH);
    hideCtrl();
    Cook.Audio.stopPour();
  }

  function showCtrl(){
    document.getElementById('seasonCtrl').style.display = 'flex';
    document.getElementById('hud').style.display = 'flex';
  }
  function hideCtrl(){
    document.getElementById('seasonCtrl').style.display = 'none';
    document.getElementById('hud').style.display = 'none';
  }
  function updateHUD(){
    document.getElementById('hudGoal').textContent = '🧂 调味';
    document.getElementById('hudSub').textContent  = '按住屏幕倾倒 · 松手停止 · 命中绿区';
    document.getElementById('hudRight').innerHTML  = '<small>菜品</small>'+recipe.name;
  }

  function onDown(){ if(!done){ pouring = true; Cook.Audio.startPour(); } }
  function onUp(){ pouring = false; Cook.Audio.stopPour(); }

  function doReset(){
    if(done) return;
    if(resetUsed>=RESET_MAX){ Cook.Game.toast('重置次数已用完'); return; }
    resetUsed++;
    amount = 0;
    P.burst(bowl.x, bowl.y, 14, {col:['#fff8e8','#e8d8c8'], spMin:1, spMax:3, life:24, rMin:1, rMax:2.5});
    Cook.Game.toast('已重置 ('+resetUsed+'/'+RESET_MAX+')');
  }

  function confirmFinish(){
    if(done) return;
    if(amount < 0.05){ Cook.Game.toast('还没调味呢！'); return; }
    done = true;
    pouring = false;
    Cook.Audio.stopPour();
    const result = score();
    setTimeout(()=> Cook.Game.stageComplete('seasoning', result), 500);
  }

  function score(){
    const delta = Math.abs(amount - target);
    let closeness = Math.max(0, 100*(1 - delta/0.3));
    closeness = Math.max(0, closeness - resetUsed*3);
    const t = (Date.now()-startTime)/1000;
    const timing = Math.max(0, 100*(1 - Math.min(t,30)/30));
    const total = Math.round(closeness*0.85 + timing*0.15);
    const star = total>=85?3 : total>=60?2 : total>=35?1 : 0;
    const label = delta<=0.03?'完美命中' : delta<=0.07?'恰到好处' : delta<=0.13?'尚可' : (amount>target?'偏咸':'偏淡');
    return { score:total, star, detail:{ 用量:Math.round(amount*100)+'%', 目标:Math.round(target*100)+'%', 偏差:Math.round(delta*100)+'%', 评价:label } };
  }

  function update(){
    const dt = E.dt;
    if(!done && pouring){
      // 越接近满越慢，便于微调
      const rate = POUR_RATE * (1 - amount*0.4);
      amount = Math.min(1, amount + rate*dt/1000);
      tilt = Math.min(1, tilt + dt/120);
      // 粉末粒子流
      if(E.frame%2===0){
        const sx = shaker.x + E.rnd(-6,6);
        P.spawn({
          x:sx, y:shaker.y+18,
          vx:E.rnd(-0.4,0.4), vy:E.rnd(1.5,2.8),
          r:E.rnd(1.5,3), life:34, maxLife:34,
          col:['#fff8e8','#f4ecd0','#e8d8b8'][Math.floor(Math.random()*3)],
          g:0.05, fade:true, shrink:false
        });
      }
    } else {
      tilt *= 0.9;
    }
    if(!done && amount>=1){ pouring = false; Cook.Audio.stopPour(); }
    P.update();
    if(E.frame%6===0) updateHUD();
  }

  function render(){
    drawScene();
    drawBowl();
    drawShaker();
    P.render();
    drawGauge();
  }

  function drawScene(){
    const ctx=E.ctx, W=E.SW, H=E.SH;
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#f0fff8'); g.addColorStop(1,'#e8f5f0');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    const glow=ctx.createRadialGradient(W/2, H*0.45, 40, W/2, H*0.45, W*0.6);
    glow.addColorStop(0,'rgba(122,200,192,0.15)'); glow.addColorStop(1,'rgba(122,200,192,0)');
    ctx.fillStyle=glow; ctx.fillRect(0,0,W,H);
  }

  function drawBowl(){
    const ctx=E.ctx, {x,y,r}=bowl;
    ctx.save();
    if(recipe.mode === 'blend'){
      /* blend 模式：俯视奶昔杯（糖粉撒在奶油顶上） */
      Ingr.cupTop(x, y, r, 0.9);
      /* 浮于奶昔表面的草莓切片 */
      const name = recipe.cutFood;
      const n=3;
      for(let i=0;i<n;i++){
        const a = i/n*Math.PI*2 - Math.PI/2;
        const fx = x + Math.cos(a)*r*0.30;
        const fy = y + Math.sin(a)*r*0.15;
        ctx.save(); ctx.translate(fx,fy); ctx.rotate(a);
        Ingr.drawSlice(name, 0, 0, r*0.16);
        ctx.restore();
      }
      /* 调味糖粉覆盖层（仅覆盖液面，随用量加深） */
      if(amount>0.01){
        ctx.fillStyle='rgba(255,248,230,'+(amount*0.55)+')';
        ctx.beginPath(); ctx.ellipse(x, y, r*0.82, r*0.5, 0,0,Math.PI*2); ctx.fill();
      }
    } else {
      /* 普通菜品：陶碗 + 切片 */
      // 阴影
      ctx.fillStyle='rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(x, y+r*0.5, r*1.05, r*0.35, 0,0,Math.PI*2); ctx.fill();
      // 碗外
      const g=ctx.createLinearGradient(0, y-r*0.4, 0, y+r*0.5);
      g.addColorStop(0,'#e8e0d0'); g.addColorStop(1,'#b8a890');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.ellipse(x, y, r, r*0.62, 0,0,Math.PI*2); ctx.fill();
      // 碗内（深色）
      ctx.fillStyle='#3a2a20';
      ctx.beginPath(); ctx.ellipse(x, y, r*0.82, r*0.5, 0,0,Math.PI*2); ctx.fill();
      // 锅内食物（切片）
      const name = recipe.cutFood;
      const n=5;
      for(let i=0;i<n;i++){
        const a = i/n*Math.PI*2 - Math.PI/2;
        const fx = x + Math.cos(a)*r*0.38;
        const fy = y + Math.sin(a)*r*0.2;
        ctx.save(); ctx.translate(fx,fy); ctx.rotate(a);
        Ingr.drawSlice(name, 0, 0, r*0.2);
        ctx.restore();
      }
      // 调味粉覆盖层（随用量加深）
      if(amount>0.01){
        ctx.fillStyle='rgba(255,248,230,'+(amount*0.55)+')';
        ctx.beginPath(); ctx.ellipse(x, y, r*0.8, r*0.48, 0,0,Math.PI*2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawShaker(){
    const ctx=E.ctx, {x,y}=shaker;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt*0.5);   // 倾倒时前倾
    // 罐身
    const g=ctx.createLinearGradient(-22,0,22,0);
    g.addColorStop(0,'#d8d0c0'); g.addColorStop(0.5,'#fff8e8'); g.addColorStop(1,'#c8c0b0');
    ctx.fillStyle=g;
    E.roundRect(-22, -34, 44, 56, 8); ctx.fill();
    // 标签（blend 菜品为糖罐，其余为盐罐）
    ctx.fillStyle='#e8b850'; ctx.fillRect(-16, -10, 32, 18);
    ctx.fillStyle='#5a4020'; ctx.font='12px sans-serif'; ctx.textAlign='center';
    ctx.fillText(recipe.mode==='blend' ? '糖' : '盐', 0, 4);
    // 罐盖（带孔）
    ctx.fillStyle='#8a7a6a';
    E.roundRect(-20, -42, 40, 12, 4); ctx.fill();
    ctx.fillStyle='#3a2a20';
    for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.arc(i*6, -38, 1.6, 0, Math.PI*2); ctx.fill(); }
    ctx.restore();
  }

  function drawGauge(){
    const ctx=E.ctx, {x,y,r}=bowl;
    const cx = x, cy = y - r*1.5, R = Math.min(r*0.5, 30);
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(cx,cy,R+6,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=6;
    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke();
    // 目标带（绿弧）
    ctx.strokeStyle='rgba(122,200,90,0.7)'; ctx.lineWidth=6;
    ctx.beginPath();
    ctx.arc(cx,cy,R, -Math.PI/2+(target-BAND)*Math.PI*2, -Math.PI/2+(target+BAND)*Math.PI*2);
    ctx.stroke();
    // 当前用量
    const col = amount>target+BAND?'#e84a3a' : amount>=target-BAND?'#7ac85a' : '#f4a830';
    ctx.strokeStyle=col; ctx.lineWidth=6; ctx.lineCap='round';
    ctx.beginPath(); ctx.arc(cx,cy,R, -Math.PI/2, -Math.PI/2+amount*Math.PI*2); ctx.stroke();
    ctx.fillStyle='#fff'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
    ctx.fillText(Math.round(amount*100)+'%', cx, cy+4);
    ctx.restore();
  }

  return { enter, exit, update, render };
})();

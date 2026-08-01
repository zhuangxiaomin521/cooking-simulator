/* ========== 切菜阶段 ========== */
Cook.Cutting = (function(){
  const E = Cook.Engine, P = Cook.Particles, In = Cook.Input, Ingr = Cook.Ingredients;

  /* 点到线段距离（判定任意方向滑动是否经过食材） */
  function segDist(px,py,x1,y1,x2,y2){
    const dx=x2-x1, dy=y2-y1, L2=dx*dx+dy*dy;
    if(L2===0) return Math.hypot(px-x1,py-y1);
    let t=((px-x1)*dx+(py-y1)*dy)/L2; t=t<0?0:t>1?1:t;
    return Math.hypot(px-(x1+t*dx), py-(y1+t*dy));
  }

  let recipe=null, seed=0;
  let cuts=[];            // 已切刀痕 {x, t}
  let target=6;
  let board={x:0,y:0,w:0,h:0};
  let food={x:0,y:0,r:0};
  let startTime=0;
  let done=false;
  let knifeTrail=[];      // 刀光点 {x,y,life}
  let finishedT=0;         // 完成时刻（散开动画用）
  let slicePos=[];         // 散开后切片目标位置
  let dragH=null, swipeH=null, backH=null;

  function setupLayout(){
    const W=E.SW, H=E.SH;
    const bw = Math.min(W*0.82, 460);
    const bh = Math.min(H*0.30, 240);
    board = { x:W/2, y:H*0.58, w:bw, h:bh };
    food  = { x:board.x, y:board.y - bh*0.08, r:Math.min(bw*0.14, 58) };
  }

  function enter(data){
    recipe = data.recipe; seed = data.seed;
    P.clear();
    cuts=[]; knifeTrail=[]; done=false; finishedT=0; slicePos=[];
    target = recipe.cutServings || 6;
    setupLayout();
    startTime = Date.now();
    showHUD();

    dragH  = e => onDrag(e);
    swipeH = e => onSwipe(e);
    In.on('drag', dragH);
    In.on('swipe', swipeH);

    const back = document.getElementById('hudBack');
    backH = ()=> Cook.Game.goMenu();
    back.addEventListener('click', backH);
  }

  function exit(){
    if(dragH)  In.off('drag', dragH);
    if(swipeH) In.off('swipe', swipeH);
    const back = document.getElementById('hudBack');
    if(back && backH) back.removeEventListener('click', backH);
    hideHUD();
  }

  function showHUD(){
    const hud = document.getElementById('hud');
    hud.style.display = 'flex';
    updateHUD();
  }
  function hideHUD(){
    document.getElementById('hud').style.display = 'none';
  }
  function updateHUD(){
    document.getElementById('hudGoal').textContent = '🔪 切菜';
    document.getElementById('hudSub').textContent  = '在食材上滑动切刀 · '+cuts.length+'/'+target;
    document.getElementById('hudRight').innerHTML  = '<small>食材</small>'+ (recipe? recipe.name : '');
  }

  function onDrag(e){
    if(done) return;
    knifeTrail.push({ x:e.x, y:e.y, life:14 });
  }

  function onSwipe(e){
    if(done) return;
    const len = Math.hypot(e.dx, e.dy);
    if(len < 15) return;
    // 任意方向：滑动线段经过食材即切一刀（横划/竖划/斜划均可）
    const d = segDist(food.x, food.y, e.sx, e.sy, e.ex, e.ey);
    if(d < food.r*1.15){
      const mx = (e.sx+e.ex)/2;
      registerCut(E.clamp(mx, food.x-food.r, food.x+food.r));
    }
  }

  function registerCut(x){
    // 太近的重复切忽略
    if(cuts.some(c=>Math.abs(c.x-x) < food.r*0.16)) return;
    cuts.push({ x, t:Date.now() });
    // 切菜音效
    Cook.Audio.chop();
    // 汁液飞溅
    P.burst(x, food.y, 14, {
      col:['#e8442a','#ff7a5a','#c8301a','#fff0c8'],
      spMin:1, spMax:4.5, life:26, rMin:1, rMax:3
    });
    // 刀光强化
    for(let i=0;i<3;i++) knifeTrail.push({x:x+E.rnd(-3,3), y:food.y+E.rnd(-food.r,food.r*0.6), life:18});
    updateHUD();
    if(cuts.length >= target) finish();
  }

  function finish(){
    done = true;
    finishedT = Date.now();
    // 计算切片目标位置（均匀排列）
    cuts.sort((a,b)=>a.x-b.x);
    const n = cuts.length + 1;
    const span = food.r*2.4;
    slicePos = [];
    for(let i=0;i<n;i++){
      slicePos.push({ x: food.x - span/2 + span*(i+0.5)/n, y: food.y });
    }
    // 评分
    const result = score();
    // 延迟一点显示完成弹窗（让散开动画播一下）
    setTimeout(()=> Cook.Game.stageComplete('cutting', result), 700);
  }

  function score(){
    // 均匀度
    let uniformity = 100;
    if(cuts.length >= 2){
      const xs = cuts.map(c=>c.x).sort((a,b)=>a-b);
      const gaps = [];
      for(let i=0;i<xs.length-1;i++) gaps.push(xs[i+1]-xs[i]);
      const mean = gaps.reduce((a,b)=>a+b,0)/gaps.length;
      const variance = gaps.reduce((a,b)=>a+(b-mean)*(b-mean),0)/gaps.length;
      const std = Math.sqrt(variance);
      uniformity = Math.max(0, 100 * (1 - (mean? std/mean : 1)));
    }
    // 速度
    const t = (Date.now()-startTime)/1000;
    const idealT = target*1.2;
    const speed = Math.max(0, Math.min(100, 100 * (1 - (t-idealT)/(target*3))));
    const total = Math.round(uniformity*0.6 + speed*0.4);
    const star = total>=82?3 : total>=58?2 : total>=35?1 : 0;
    return { score: total, star, detail:{ 均匀度:Math.round(uniformity), 速度:Math.round(speed), 用时:t.toFixed(1)+'s' } };
  }

  function update(){
    P.update();
    // 刀光淡出
    for(let i=0;i<knifeTrail.length;i++) knifeTrail[i].life--;
    knifeTrail = knifeTrail.filter(k=>k.life>0);
  }

  function render(){
    const ctx = E.ctx;
    drawScene();
    drawBoard();
    drawFood();
    drawKnifeTrail();
    P.render();
  }

  function drawScene(){
    const ctx = E.ctx;
    const W=E.SW, H=E.SH;
    // 可爱厨房背景：奶油白 → 淡粉
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, '#fff5f0'); g.addColorStop(1, '#ffe8ef');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    // 粉色柔光
    const glow = ctx.createRadialGradient(W/2, H*0.3, 40, W/2, H*0.3, W*0.7);
    glow.addColorStop(0, 'rgba(255,138,168,0.15)'); glow.addColorStop(1, 'rgba(255,138,168,0)');
    ctx.fillStyle = glow; ctx.fillRect(0,0,W,H);
  }

  function drawBoard(){
    const ctx = E.ctx;
    const {x,y,w,h} = board;
    ctx.save();
    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    E.roundRect(x-w/2+4, y-h/2+8, w, h, 18); ctx.fill();
    // 木纹砧板
    const g = ctx.createLinearGradient(0, y-h/2, 0, y+h/2);
    g.addColorStop(0, '#c89a6a'); g.addColorStop(0.5, '#a87a4a'); g.addColorStop(1, '#8a5e34');
    ctx.fillStyle = g;
    E.roundRect(x-w/2, y-h/2, w, h, 18); ctx.fill();
    // 木纹线
    ctx.strokeStyle = 'rgba(90,60,30,0.35)'; ctx.lineWidth = 1.2;
    for(let i=0;i<7;i++){
      const yy = y-h/2 + h*(i+1)/8;
      ctx.beginPath(); ctx.moveTo(x-w/2+10, yy);
      ctx.bezierCurveTo(x-w*0.2, yy+3, x+w*0.2, yy-3, x+w/2-10, yy); ctx.stroke();
    }
    // 边框
    ctx.strokeStyle = 'rgba(60,40,20,0.6)'; ctx.lineWidth = 2;
    E.roundRect(x-w/2, y-h/2, w, h, 18); ctx.stroke();
    ctx.restore();
  }

  function drawFood(){
    const ctx = E.ctx;
    const name = recipe ? recipe.cutFood : 'tomato';

    if(!done){
      // 整料
      Ingr.drawWhole(name, food.x, food.y, food.r);
      // 已切刀痕
      cuts.forEach(c=>{
        ctx.save();
        ctx.strokeStyle = 'rgba(110,18,8,0.55)'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(c.x, food.y-food.r*1.0); ctx.lineTo(c.x, food.y+food.r*0.6); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,200,180,0.45)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(c.x-1, food.y-food.r*1.0); ctx.lineTo(c.x-1, food.y+food.r*0.6); ctx.stroke();
        ctx.restore();
      });
    } else {
      // 散开成切片
      const elapsed = (Date.now()-finishedT)/500;
      const t = Math.min(1, elapsed);
      const ease = E.easeOut(t);
      const sr = food.r*0.62;
      slicePos.forEach((p,i)=>{
        // 从中心散开到目标位置
        const sx = food.x + (p.x-food.x)*ease;
        const sy = food.y + (p.y-food.y)*ease;
        ctx.globalAlpha = 0.4 + 0.6*ease;
        Ingr.drawSlice(name, sx, sy, sr);
      });
      ctx.globalAlpha = 1;
    }
  }

  function drawKnifeTrail(){
    if(knifeTrail.length<2) return;
    const ctx = E.ctx;
    ctx.save();
    for(let i=1;i<knifeTrail.length;i++){
      const a = knifeTrail[i-1], b = knifeTrail[i];
      const al = Math.min(a.life,b.life)/14;
      ctx.strokeStyle = 'rgba(255,255,255,'+(al*0.8)+')';
      ctx.lineWidth = 3*al + 1;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      // 外发光
      ctx.strokeStyle = 'rgba(255,220,160,'+(al*0.4)+')';
      ctx.lineWidth = 7*al + 2;
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
    }
    ctx.restore();
  }

  return { enter, exit, update, render };
})();

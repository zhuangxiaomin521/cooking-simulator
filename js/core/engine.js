/* ========== 引擎：画布适配 + 渲染循环 + 工具函数 ========== */
window.Cook = window.Cook || {};
Cook.Engine = (function(){
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  let SW=0, SH=0, DPR=1, frame=0, dt=16, lastT=0;

  function resize(){
    DPR = window.devicePixelRatio || 1;
    SW = window.innerWidth; SH = window.innerHeight;
    cv.width = Math.floor(SW*DPR); cv.height = Math.floor(SH*DPR);
    cv.style.width = SW+'px'; cv.style.height = SH+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  resize();
  window.addEventListener('resize', resize);

  /* —— 工具函数 —— */
  const rnd     = (a,b)=> a + Math.random()*(b-a);
  const randInt= (a,b)=> Math.floor(rnd(a, b+1));
  const dist    = (a,b)=> Math.hypot(a.x-b.x, a.y-b.y);
  const clamp   = (v,a,b)=> Math.max(a, Math.min(b, v));
  const lerp    = (a,b,t)=> a + (b-a)*t;
  const easeOut = t => 1 - Math.pow(1-t, 3);
  const easeInOut= t => t<0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;

  /* 圆角矩形路径（不填充，调用方 fill/stroke） */
  function roundRect(x,y,w,h,r){
    r = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y, x+w,y+h, r);
    ctx.arcTo(x+w,y+h, x,y+h, r);
    ctx.arcTo(x,y+h, x,y, r);
    ctx.arcTo(x,y, x+w,y, r);
    ctx.closePath();
  }

  /* —— 主循环 —— */
  let onUpdate=null, onRender=null;
  function loop(t){
    dt = lastT ? Math.min(t-lastT, 50) : 16;
    lastT = t; frame++;
    if(onUpdate) onUpdate(dt);
    if(onRender) onRender();
    requestAnimationFrame(loop);
  }
  function start(u,r){ onUpdate=u; onRender=r; requestAnimationFrame(loop); }

  return {
    cv, ctx,
    get SW(){return SW;}, get SH(){return SH;}, get DPR(){return DPR;},
    get frame(){return frame;}, get dt(){return dt;},
    resize, rnd, randInt, dist, clamp, lerp, easeOut, easeInOut, roundRect, start
  };
})();

/* ========== 粒子系统：飞溅/蒸汽/火焰/星屑/烟雾 ========== */
Cook.Particles = (function(){
  const E = Cook.Engine;
  let list = [];

  function spawn(o){
    list.push(Object.assign({
      x:0, y:0, vx:0, vy:0, r:2, life:30, maxLife:30,
      col:'#fff', g:0, fade:true, shrink:true
    }, o));
  }

  /* 爆裂飞溅 */
  function burst(x, y, n, opt){
    opt = opt || {};
    for(let i=0;i<n;i++){
      const a = Math.random()*Math.PI*2;
      const s = E.rnd(opt.spMin||1, opt.spMax||5);
      const col = Array.isArray(opt.col) ? opt.col[Math.floor(Math.random()*opt.col.length)]
                                         : (opt.col||'#fff');
      spawn({
        x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s,
        r:E.rnd(opt.rMin||1, opt.rMax||4),
        life:opt.life||30, maxLife:opt.life||30, col, g:opt.g||0
      });
    }
  }

  /* 蒸汽（向上飘） */
  function steam(x, y, n, opt){
    opt = opt || {};
    const spread = opt.spread||6;
    for(let i=0;i<n;i++){
      spawn({
        x:x+E.rnd(-spread, spread), y,
        vx:E.rnd(-0.3, 0.3), vy:E.rnd(-1.6, -0.8),
        r:E.rnd(opt.rMin||6, opt.rMax||12),
        life:opt.life||60, maxLife:opt.life||60,
        col: opt.col || 'rgba(255,255,255,0.55)'
      });
    }
  }

  /* 火焰 */
  function flame(x, y, n, opt){
    opt = opt || {};
    const cols = opt.col || ['#ffd640','#ff8a3a','#e84a3a'];
    for(let i=0;i<n;i++){
      spawn({
        x:x+E.rnd(-4,4), y, vx:E.rnd(-0.3,0.3), vy:E.rnd(-2,-1),
        r:E.rnd(3,7), life:24, maxLife:24,
        col: Array.isArray(cols)? cols[Math.floor(Math.random()*cols.length)] : cols
      });
    }
  }

  /* 星屑闪光（成品/高分） */
  function sparkle(x, y, n){
    for(let i=0;i<n;i++){
      spawn({
        x:x+E.rnd(-24,24), y:y+E.rnd(-24,24),
        vx:E.rnd(-0.5,0.5), vy:E.rnd(-1,-0.2),
        r:E.rnd(1.5,3), life:50, maxLife:50,
        col:['#fff4b0','#f4d640','#ffd0a0'][Math.floor(Math.random()*3)]
      });
    }
  }

  function update(){
    for(let i=0;i<list.length;i++){
      const p = list[i];
      p.x += p.vx; p.y += p.vy; p.vy += p.g;
      p.vx *= 0.92; p.vy *= 0.92; p.life--;
    }
    list = list.filter(p=>p.life>0);
  }

  function render(){
    const ctx = E.ctx;
    for(let i=0;i<list.length;i++){
      const p = list[i];
      const t = p.life/p.maxLife;
      ctx.globalAlpha = p.fade ? t : 1;
      ctx.fillStyle = p.col;
      const r = p.shrink ? p.r*(0.4 + t*0.6) : p.r;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function clear(){ list = []; }
  return { spawn, burst, steam, flame, sparkle, update, render, clear,
           get count(){ return list.length; } };
})();

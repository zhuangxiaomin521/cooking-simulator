/* ========== 食材矢量绘制库（精致扁平矢量风） ========== */
Cook.Ingredients = (function(){
  const E = Cook.Engine;

  /* —— 整番茄 —— */
  function tomato(x, y, r, rot){
    const ctx = E.ctx;
    ctx.save(); ctx.translate(x,y); if(rot) ctx.rotate(rot);
    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(2, r*0.95, r*0.95, r*0.3, 0, 0, Math.PI*2); ctx.fill();
    /* 球体 */
    const g = ctx.createRadialGradient(-r*0.32, -r*0.32, r*0.1, 0, 0, r);
    g.addColorStop(0, '#ff8a6a'); g.addColorStop(0.55, '#e8442a'); g.addColorStop(1, '#a8241a');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
    /* 高光 */
    ctx.fillStyle = 'rgba(255,225,205,0.5)';
    ctx.beginPath(); ctx.ellipse(-r*0.35, -r*0.38, r*0.3, r*0.2, -0.5, 0, Math.PI*2); ctx.fill();
    /* 蒂 */
    ctx.fillStyle = '#5aa23a';
    ctx.beginPath();
    ctx.moveTo(-r*0.28, -r*0.82); ctx.lineTo(-r*0.1, -r*1.05);
    ctx.lineTo(r*0.1, -r*1.05);   ctx.lineTo(r*0.28, -r*0.82);
    ctx.quadraticCurveTo(0, -r*0.7, -r*0.28, -r*0.82); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2f6a1f'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }

  /* —— 番茄切片（俯视扁圆，可见种子） —— */
  function tomatoSlice(x, y, r){
    const ctx = E.ctx;
    ctx.save(); ctx.translate(x,y);
    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(1.5, r*0.55, r*0.95, r*0.42, 0, 0, Math.PI*2); ctx.fill();
    /* 外皮（深红边） */
    ctx.fillStyle = '#c8301a';
    ctx.beginPath(); ctx.ellipse(0, 0, r, r*0.5, 0, 0, Math.PI*2); ctx.fill();
    /* 果肉（浅红） */
    const g = ctx.createRadialGradient(0, 0, r*0.1, 0, 0, r*0.85);
    g.addColorStop(0, '#ffb0a0'); g.addColorStop(1, '#f06848');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, r*0.82, r*0.4, 0, 0, Math.PI*2); ctx.fill();
    /* 种子 */
    ctx.fillStyle = '#fff0c8';
    for(let i=0;i<7;i++){
      const a = i/7*Math.PI*2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a)*r*0.42, Math.sin(a)*r*0.2, r*0.09, r*0.05, a, 0, Math.PI*2);
      ctx.fill();
    }
    /* 高光 */
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(-r*0.3, -r*0.15, r*0.3, r*0.1, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  /* —— 整鸡蛋 —— */
  function egg(x, y, r, rot){
    const ctx = E.ctx;
    ctx.save(); ctx.translate(x,y); if(rot) ctx.rotate(rot);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(1.5, r*0.9, r*0.7, r*0.22, 0, 0, Math.PI*2); ctx.fill();
    const g = ctx.createRadialGradient(-r*0.25, -r*0.3, r*0.1, 0, 0, r);
    g.addColorStop(0, '#fffcec'); g.addColorStop(0.7, '#f4e6c0'); g.addColorStop(1, '#d8c08a');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, r*0.72, r*0.92, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.ellipse(-r*0.22, -r*0.4, r*0.22, r*0.3, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  /* —— 蛋黄（打散后） —— */
  function eggYolk(x, y, r){
    const ctx = E.ctx;
    ctx.save(); ctx.translate(x,y);
    /* 蛋清 */
    ctx.fillStyle = 'rgba(255,250,225,0.85)';
    ctx.beginPath(); ctx.ellipse(0, 0, r*1.5, r*1.1, 0, 0, Math.PI*2); ctx.fill();
    /* 蛋黄 */
    const g = ctx.createRadialGradient(-r*0.2, -r*0.2, r*0.1, 0, 0, r);
    g.addColorStop(0, '#ffd840'); g.addColorStop(0.7, '#f4a818'); g.addColorStop(1, '#d87810');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.ellipse(-r*0.3, -r*0.3, r*0.25, r*0.18, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  /* —— 整草莓（圆锥红身+籽+绿叶蒂） —— */
  function strawberry(x, y, r, rot){
    const ctx = E.ctx;
    ctx.save(); ctx.translate(x,y); if(rot) ctx.rotate(rot);
    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(2, r*0.92, r*0.7, r*0.22, 0, 0, Math.PI*2); ctx.fill();
    /* 草莓身体（上宽下尖的心形） */
    const g = ctx.createRadialGradient(-r*0.28, -r*0.15, r*0.1, 0, 0, r);
    g.addColorStop(0, '#ff8a9a'); g.addColorStop(0.55, '#e8324a'); g.addColorStop(1, '#a8162e');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -r*0.5);
    ctx.bezierCurveTo(r*0.85, -r*0.5, r*0.95, r*0.25, 0, r*0.95);
    ctx.bezierCurveTo(-r*0.95, r*0.25, -r*0.85, -r*0.5, 0, -r*0.5);
    ctx.closePath(); ctx.fill();
    /* 籽（黄白小点，两排） */
    ctx.fillStyle = '#ffe89a';
    for(let i=0;i<12;i++){
      const row = i<6?0:1, k = i%6;
      const px = (k-2.5)*r*0.22 + (row? r*0.11 : 0);
      const py = -r*0.15 + row*r*0.4 + k*r*0.03;
      ctx.beginPath(); ctx.ellipse(px, py, r*0.055, r*0.03, 0, 0, Math.PI*2); ctx.fill();
    }
    /* 顶部绿叶蒂（星形） */
    ctx.fillStyle = '#5aa83a';
    for(let i=0;i<5;i++){
      const a = -Math.PI/2 + (i-2)*0.55;
      ctx.save(); ctx.translate(0,-r*0.45); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(r*0.14,-r*0.32); ctx.lineTo(-r*0.14,-r*0.32); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#3a7a22'; ctx.beginPath(); ctx.arc(0,-r*0.5, r*0.1, 0, Math.PI*2); ctx.fill();
    /* 高光 */
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.beginPath(); ctx.ellipse(-r*0.3, -r*0.15, r*0.22, r*0.12, -0.5, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  /* —— 草莓切片（俯视，可见放射籽） —— */
  function strawberrySlice(x, y, r){
    const ctx = E.ctx;
    ctx.save(); ctx.translate(x,y);
    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(1.5, r*0.55, r*0.95, r*0.42, 0, 0, Math.PI*2); ctx.fill();
    /* 外皮（深红边） */
    ctx.fillStyle = '#c01a30';
    ctx.beginPath(); ctx.ellipse(0, 0, r, r*0.5, 0, 0, Math.PI*2); ctx.fill();
    /* 果肉（粉红渐变） */
    const g = ctx.createRadialGradient(0, 0, r*0.1, 0, 0, r*0.85);
    g.addColorStop(0, '#ffc0c8'); g.addColorStop(1, '#f06878');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, r*0.82, r*0.4, 0, 0, Math.PI*2); ctx.fill();
    /* 放射籽 */
    ctx.fillStyle = '#fff0a0';
    for(let i=0;i<9;i++){
      const a = i/9*Math.PI*2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a)*r*0.46, Math.sin(a)*r*0.2, r*0.07, r*0.04, a, 0, Math.PI*2);
      ctx.fill();
    }
    /* 中心白芯 */
    ctx.fillStyle = 'rgba(255,240,220,0.6)';
    ctx.beginPath(); ctx.ellipse(0, 0, r*0.16, r*0.09, 0, 0, Math.PI*2); ctx.fill();
    /* 高光 */
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.ellipse(-r*0.3, -r*0.15, r*0.28, r*0.1, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  /* —— 俯视奶昔杯口（摆盘/调味容器用） —— */
  /* r = 杯口半径；amount=奶昔液填充比例(0~1)，可选 */
  function cupTop(x, y, r, amount){
    const ctx = E.ctx;
    const amt = amount==null? 0.85 : amount;
    ctx.save(); ctx.translate(x,y);
    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(2, r*0.5, r*1.08, r*0.42, 0, 0, Math.PI*2); ctx.fill();
    /* 杯壁外圈（玻璃） */
    const g = ctx.createRadialGradient(-r*0.3,-r*0.3, r*0.2, 0, 0, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#e0e6ea'); g.addColorStop(1, '#aab4ba');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r*0.62, 0, 0, Math.PI*2); ctx.fill();
    /* 杯内（奶昔液粉色） */
    const lg = ctx.createRadialGradient(0,0, r*0.1, 0, 0, r*0.82);
    lg.addColorStop(0, '#ffd0dc'); lg.addColorStop(1, '#e87a98');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.ellipse(0, 0, r*0.82, r*0.5, 0, 0, Math.PI*2); ctx.fill();
    /* 液面纹理 */
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.ellipse(-r*0.25, -r*0.1, r*0.3, r*0.12, -0.4, 0, Math.PI*2); ctx.fill();
    /* 中心奶油顶 */
    ctx.fillStyle = '#fff8ec';
    ctx.beginPath(); ctx.ellipse(0, 0, r*0.34, r*0.2, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.ellipse(-r*0.1, -r*0.05, r*0.14, r*0.07, -0.4, 0, Math.PI*2); ctx.fill();
    /* 吸管（斜插） */
    ctx.strokeStyle = '#e84a8a'; ctx.lineWidth = Math.max(3, r*0.06); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(r*0.2, -r*0.05); ctx.lineTo(r*0.5, -r*0.45); ctx.stroke();
    ctx.restore();
  }

  /* —— 整三文鱼（流线鱼身+鳞+鳍+眼） —— */
  function fish(x, y, r, rot){
    const ctx = E.ctx;
    ctx.save(); ctx.translate(x,y); if(rot) ctx.rotate(rot);
    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.beginPath(); ctx.ellipse(2, r*0.7, r*1.25, r*0.32, 0, 0, Math.PI*2); ctx.fill();
    /* 尾鳍 */
    ctx.fillStyle = '#c8553a';
    ctx.beginPath();
    ctx.moveTo(r*0.85, 0);
    ctx.lineTo(r*1.3, -r*0.45); ctx.lineTo(r*1.18, 0); ctx.lineTo(r*1.3, r*0.45);
    ctx.closePath(); ctx.fill();
    /* 鱼身（流线椭圆，橙红渐变） */
    const g = ctx.createLinearGradient(0,-r*0.4, 0, r*0.4);
    g.addColorStop(0, '#ff9a6a'); g.addColorStop(0.5, '#ff7a4a'); g.addColorStop(1, '#d8482a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-r*0.95, 0);
    ctx.bezierCurveTo(-r*0.7, -r*0.62, r*0.4, -r*0.58, r*0.82, 0);
    ctx.bezierCurveTo(r*0.4, r*0.58, -r*0.7, r*0.62, -r*0.95, 0);
    ctx.closePath(); ctx.fill();
    /* 背鳍 */
    ctx.fillStyle = '#b8402a';
    ctx.beginPath(); ctx.moveTo(-r*0.2,-r*0.5); ctx.quadraticCurveTo(r*0.1,-r*0.92, r*0.35,-r*0.42); ctx.closePath(); ctx.fill();
    /* 腹鳍 */
    ctx.beginPath(); ctx.moveTo(-r*0.1,r*0.42); ctx.quadraticCurveTo(r*0.15,r*0.74, r*0.3,r*0.4); ctx.closePath(); ctx.fill();
    /* 鳞片（弧线纹） */
    ctx.strokeStyle = 'rgba(200,70,40,0.45)'; ctx.lineWidth = 1;
    for(let i=-2;i<=2;i++) for(let j=-1;j<=1;j++){
      ctx.beginPath(); ctx.arc(i*r*0.26+r*0.05, j*r*0.22, r*0.16, -Math.PI*0.85, -Math.PI*0.15); ctx.stroke();
    }
    /* 头部高光 */
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.ellipse(-r*0.55, -r*0.18, r*0.26, r*0.13, -0.4, 0, Math.PI*2); ctx.fill();
    /* 眼睛 */
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-r*0.7, -r*0.12, r*0.11, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(-r*0.72, -r*0.12, r*0.06, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  /* —— 三文鱼刺身片（俯视，可见脂肪纹） —— */
  function fishSlice(x, y, r){
    const ctx = E.ctx;
    ctx.save(); ctx.translate(x,y);
    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.beginPath(); ctx.ellipse(1.5, r*0.5, r*0.95, r*0.4, 0, 0, Math.PI*2); ctx.fill();
    /* 鱼肉块（圆角，橙红渐变） */
    const g = ctx.createRadialGradient(-r*0.2, -r*0.15, r*0.1, 0, 0, r*0.95);
    g.addColorStop(0, '#ff9a6a'); g.addColorStop(1, '#e85a3a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-r*0.85, -r*0.12);
    ctx.bezierCurveTo(-r*0.7,-r*0.5, r*0.6,-r*0.48, r*0.82,-r*0.05);
    ctx.bezierCurveTo(r*0.78,r*0.42, -r*0.62,r*0.46, -r*0.85,-r*0.12);
    ctx.closePath(); ctx.fill();
    /* 白色脂肪纹（横纹） */
    ctx.strokeStyle = 'rgba(255,250,245,0.7)'; ctx.lineWidth = Math.max(1.2, r*0.05);
    for(let i=0;i<4;i++){
      const yy = -r*0.22 + i*r*0.16;
      ctx.beginPath(); ctx.moveTo(-r*0.7, yy); ctx.bezierCurveTo(-r*0.2, yy+r*0.04, r*0.3, yy-r*0.03, r*0.7, yy+r*0.02); ctx.stroke();
    }
    /* 边缘深色 */
    ctx.strokeStyle = 'rgba(160,50,30,0.4)'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-r*0.85, -r*0.12);
    ctx.bezierCurveTo(-r*0.7,-r*0.5, r*0.6,-r*0.48, r*0.82,-r*0.05);
    ctx.bezierCurveTo(r*0.78,r*0.42, -r*0.62,r*0.46, -r*0.85,-r*0.12);
    ctx.closePath(); ctx.stroke();
    /* 高光 */
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath(); ctx.ellipse(-r*0.25, -r*0.18, r*0.3, r*0.09, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  /* —— 整意面（干面条束 + 纸带） —— */
  function pasta_long(x, y, r, rot){
    const ctx = E.ctx;
    ctx.save(); ctx.translate(x,y); if(rot) ctx.rotate(rot);
    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(2, r*0.95, r*0.55, r*0.2, 0, 0, Math.PI*2); ctx.fill();
    /* 面条束底色 */
    ctx.fillStyle = '#e8c878';
    ctx.beginPath();
    ctx.moveTo(-r*0.35, -r*0.9); ctx.lineTo(r*0.35, -r*0.9);
    ctx.lineTo(r*0.5, r*0.7); ctx.lineTo(-r*0.5, r*0.7);
    ctx.closePath(); ctx.fill();
    /* 密集面条线（黄色，顶部散开） */
    ctx.strokeStyle = '#f4d678'; ctx.lineWidth = Math.max(1.5, r*0.06); ctx.lineCap='round';
    const cols = 9;
    for(let i=0;i<cols;i++){
      const t = i/(cols-1);
      const topX = -r*0.3 + t*r*0.6 + Math.sin(i*1.3)*r*0.04;
      const botX = -r*0.46 + t*r*0.92;
      const grad = ctx.createLinearGradient(0,-r*0.9,0,r*0.7);
      grad.addColorStop(0,'#ffe89a'); grad.addColorStop(1,'#e0b858');
      ctx.strokeStyle = grad;
      ctx.beginPath(); ctx.moveTo(topX, -r*0.9); ctx.lineTo(botX, r*0.7); ctx.stroke();
    }
    /* 顶部散开（弯曲线） */
    ctx.strokeStyle = '#f4d678';
    for(let i=0;i<5;i++){
      const t=i/4, topX=-r*0.3+t*r*0.6;
      ctx.beginPath(); ctx.moveTo(topX, -r*0.9);
      ctx.quadraticCurveTo(topX+r*0.08, -r*1.12, topX+r*0.04, -r*1.2); ctx.stroke();
    }
    /* 纸带（绑带） */
    ctx.fillStyle = '#e8a838';
    ctx.fillRect(-r*0.52, -r*0.12, r*1.04, r*0.28);
    ctx.fillStyle = '#5a3a1a'; ctx.font='bold '+Math.max(8,r*0.2)+'px sans-serif'; ctx.textAlign='center';
    ctx.fillText('面', 0, r*0.06);
    /* 边缘描边 */
    ctx.strokeStyle = 'rgba(120,80,30,0.4)'; ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(-r*0.35, -r*0.9); ctx.lineTo(r*0.35, -r*0.9);
    ctx.lineTo(r*0.5, r*0.7); ctx.lineTo(-r*0.5, r*0.7);
    ctx.closePath(); ctx.stroke();
    ctx.restore();
  }

  /* —— 意面切片（一小撮煮面，弯曲面条） —— */
  function pastaSlice(x, y, r){
    const ctx = E.ctx;
    ctx.save(); ctx.translate(x,y);
    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(1.5, r*0.5, r*0.92, r*0.38, 0, 0, Math.PI*2); ctx.fill();
    /* 面团底 */
    const g = ctx.createRadialGradient(-r*0.2,-r*0.2, r*0.1, 0, 0, r*0.9);
    g.addColorStop(0, '#ffeab0'); g.addColorStop(1, '#f0c870');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, r*0.85, r*0.5, 0, 0, Math.PI*2); ctx.fill();
    /* 弯曲面条（多条曲线） */
    ctx.lineWidth = Math.max(1.5, r*0.07); ctx.lineCap='round';
    for(let i=0;i<7;i++){
      const t=i/6, cx=-r*0.5+t*r, cy=r*0.1+Math.sin(i)*r*0.06;
      ctx.strokeStyle = i%2? '#f4d078' : '#e8b850';
      ctx.beginPath();
      ctx.moveTo(cx-r*0.18, cy-r*0.28);
      ctx.bezierCurveTo(cx+r*0.05, cy-r*0.12, cx-r*0.08, cy+r*0.12, cx+r*0.18, cy+r*0.28);
      ctx.stroke();
    }
    /* 高光 */
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.ellipse(-r*0.28, -r*0.18, r*0.26, r*0.09, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  /* —— 整巧克力（分格板） —— */
  function chocolate(x, y, r, rot){
    const ctx = E.ctx;
    ctx.save(); ctx.translate(x,y); if(rot) ctx.rotate(rot);
    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(2, r*0.78, r*0.85, r*0.26, 0, 0, Math.PI*2); ctx.fill();
    /* 巧克力板（圆角矩形，深棕渐变） */
    const g = ctx.createLinearGradient(0,-r*0.6, 0, r*0.6);
    g.addColorStop(0, '#6a4226'); g.addColorStop(0.5, '#5a3420'); g.addColorStop(1, '#3e2414');
    ctx.fillStyle = g;
    E.roundRect(-r*0.75, -r*0.58, r*1.5, r*1.16, r*0.1); ctx.fill();
    /* 分格凹槽（2x3 网格） */
    ctx.strokeStyle = 'rgba(30,16,8,0.65)'; ctx.lineWidth = 1.4;
    for(let i=1;i<2;i++){ const yy=-r*0.58 + i*r*1.16/2; ctx.beginPath(); ctx.moveTo(-r*0.7, yy); ctx.lineTo(r*0.7, yy); ctx.stroke(); }
    for(let i=1;i<3;i++){ const xx=-r*0.75 + i*r*1.5/3; ctx.beginPath(); ctx.moveTo(xx, -r*0.52); ctx.lineTo(xx, r*0.52); ctx.stroke(); }
    /* 每格高光（左上斜面） */
    ctx.fillStyle = 'rgba(255,200,150,0.18)';
    for(let row=0;row<2;row++) for(let col=0;col<3;col++){
      const cx=-r*0.58+col*r*0.5, cy=-r*0.4+row*r*0.58;
      ctx.beginPath(); ctx.ellipse(cx, cy, r*0.14, r*0.1, 0, 0, Math.PI*2); ctx.fill();
    }
    /* 顶部高光带 */
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(-r*0.7, -r*0.55, r*1.4, r*0.1);
    ctx.restore();
  }

  /* —— 巧克力切片（薄片，分层） —— */
  function chocolateSlice(x, y, r){
    const ctx = E.ctx;
    ctx.save(); ctx.translate(x,y);
    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(1.5, r*0.55, r*0.95, r*0.4, 0, 0, Math.PI*2); ctx.fill();
    /* 巧克力片（深棕椭圆） */
    const g = ctx.createRadialGradient(-r*0.2,-r*0.15, r*0.1, 0, 0, r*0.9);
    g.addColorStop(0, '#7a4a2a'); g.addColorStop(1, '#4a2a14');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, r*0.85, r*0.5, 0, 0, Math.PI*2); ctx.fill();
    /* 分层纹（横线） */
    ctx.strokeStyle = 'rgba(40,20,8,0.5)'; ctx.lineWidth = 1;
    for(let i=-1;i<=1;i++){ const yy=i*r*0.18; ctx.beginPath(); ctx.moveTo(-r*0.75, yy); ctx.bezierCurveTo(-r*0.2,yy+r*0.03, r*0.2,yy-r*0.02, r*0.75,yy+r*0.02); ctx.stroke(); }
    /* 表面高光 */
    ctx.fillStyle = 'rgba(255,210,170,0.3)';
    ctx.beginPath(); ctx.ellipse(-r*0.25, -r*0.18, r*0.3, r*0.1, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  /* —— 整牛排（生肉，不规则形+脂肪纹） —— */
  function steak(x, y, r, rot){
    const ctx = E.ctx;
    ctx.save(); ctx.translate(x,y); if(rot) ctx.rotate(rot);
    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(2, r*0.6, r*0.95, r*0.3, 0, 0, Math.PI*2); ctx.fill();
    /* 肉身（不规则圆角形，红褐渐变） */
    const g = ctx.createRadialGradient(-r*0.3,-r*0.25, r*0.1, 0, 0, r);
    g.addColorStop(0, '#c84838'); g.addColorStop(0.6, '#a8342a'); g.addColorStop(1, '#7a2418');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-r*0.85, -r*0.25);
    ctx.bezierCurveTo(-r*0.7,-r*0.7, r*0.5,-r*0.62, r*0.82,-r*0.2);
    ctx.bezierCurveTo(r*0.9,r*0.2, r*0.6,r*0.6, -r*0.1,r*0.58);
    ctx.bezierCurveTo(-r*0.7,r*0.55, -r*0.92,r*0.15, -r*0.85,-r*0.25);
    ctx.closePath(); ctx.fill();
    /* 脂肪纹（白色弯曲条） */
    ctx.strokeStyle = 'rgba(255,238,220,0.8)'; ctx.lineWidth = Math.max(1.5, r*0.05); ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-r*0.6,-r*0.15); ctx.bezierCurveTo(-r*0.2,-r*0.25, r*0.2,-r*0.1, r*0.6,-r*0.18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r*0.5,r*0.2); ctx.bezierCurveTo(-r*0.1,r*0.12, r*0.3,r*0.25, r*0.55,r*0.18); ctx.stroke();
    /* 脂肪边（下侧白边） */
    ctx.strokeStyle = 'rgba(255,238,220,0.6)'; ctx.lineWidth = Math.max(2, r*0.07);
    ctx.beginPath(); ctx.moveTo(r*0.82,-r*0.2); ctx.bezierCurveTo(r*0.9,r*0.2, r*0.6,r*0.6, -r*0.1,r*0.58); ctx.stroke();
    /* 表面纹理（细纹） */
    ctx.strokeStyle = 'rgba(90,20,12,0.3)'; ctx.lineWidth=1;
    for(let i=0;i<3;i++){ const yy=-r*0.05+i*r*0.12; ctx.beginPath(); ctx.moveTo(-r*0.7,yy); ctx.lineTo(r*0.6,yy+r*0.02); ctx.stroke(); }
    /* 高光 */
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.ellipse(-r*0.3,-r*0.3, r*0.28, r*0.12, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  /* —— 牛排切片（肉片，肌理纹） —— */
  function steakSlice(x, y, r){
    const ctx = E.ctx;
    ctx.save(); ctx.translate(x,y);
    /* 阴影 */
    ctx.fillStyle = 'rgba(0,0,0,0.17)';
    ctx.beginPath(); ctx.ellipse(1.5, r*0.55, r*0.95, r*0.4, 0, 0, Math.PI*2); ctx.fill();
    /* 肉片（红椭圆） */
    const g = ctx.createRadialGradient(-r*0.2,-r*0.15, r*0.1, 0, 0, r*0.9);
    g.addColorStop(0, '#d85a48'); g.addColorStop(1, '#a8342a');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, r*0.85, r*0.5, 0, 0, Math.PI*2); ctx.fill();
    /* 肌理横纹 */
    ctx.strokeStyle = 'rgba(120,30,20,0.4)'; ctx.lineWidth=1;
    for(let i=-2;i<=2;i++){ const yy=i*r*0.12; ctx.beginPath(); ctx.moveTo(-r*0.75,yy); ctx.bezierCurveTo(-r*0.2,yy+r*0.02, r*0.2,yy-r*0.02, r*0.75,yy+r*0.02); ctx.stroke(); }
    /* 脂肪边（一侧白边） */
    ctx.strokeStyle = 'rgba(255,238,220,0.7)'; ctx.lineWidth = Math.max(1.5, r*0.05); ctx.lineCap='round';
    ctx.beginPath(); ctx.arc(0, 0, r*0.85, -Math.PI*0.15, Math.PI*0.15); ctx.stroke();
    /* 高光 */
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath(); ctx.ellipse(-r*0.3,-r*0.18, r*0.3, r*0.1, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  /* —— 通用占位（未实现的食材，批5替换） —— */
  function generic(x, y, r, label){
    const ctx = E.ctx;
    ctx.save(); ctx.translate(x,y);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(2, r*0.9, r*0.9, r*0.3, 0, 0, Math.PI*2); ctx.fill();
    const g = ctx.createRadialGradient(-r*0.3, -r*0.3, r*0.1, 0, 0, r);
    g.addColorStop(0, '#b0a090'); g.addColorStop(1, '#7a6a5a');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, r*0.9, r*0.7, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold '+Math.max(10, r*0.5)+'px sans-serif'; ctx.textAlign='center';
    ctx.fillText(label||'?', 0, r*0.18);
    ctx.restore();
  }

  /* 整料绘制表 */
  const wholes = {
    tomato, egg, strawberry, fish, pasta_long, chocolate, steak
  };
  /* 切片绘制表 */
  const slices = {
    tomato: tomatoSlice,
    strawberry: strawberrySlice,
    fish: fishSlice,
    pasta_long: pastaSlice,
    chocolate: chocolateSlice,
    steak: steakSlice
  };
  /* 整料标签（占位用） */
  const labels = {
    strawberry:'莓', fish:'鱼', pasta_long:'面', chocolate:'巧', steak:'肉'
  };

  function drawWhole(name, x, y, r, rot){
    const fn = wholes[name] || ((x,y,r)=>generic(x,y,r,labels[name]||name));
    fn(x, y, r, rot);
  }
  function drawSlice(name, x, y, r){
    const fn = slices[name] || ((x,y,r)=>generic(x,y,r,labels[name]||name));
    fn(x, y, r);
  }

  return { drawWhole, drawSlice, tomato, tomatoSlice, egg, eggYolk, generic,
           strawberry, strawberrySlice, cupTop,
           fish, fishSlice, pasta_long, pastaSlice, chocolate, chocolateSlice, steak, steakSlice };
})();

/* ========== 音效系统：Web Audio 合成（切/炒/调/摆/完成/解锁） ==========
   无外部音频文件，全部由振荡器 + 噪声缓冲实时合成。
   浏览器自动播放策略：需用户首次交互后 resume AudioContext。 */
Cook.Audio = (function(){
  let ctx=null, master=null, enabled=true, noiseBuf=null;
  let sizzleNode=null, pourNode=null;

  const PREF_KEY = 'cookMaster_audio';

  /* 从存档读取偏好（默认开） */
  try{ enabled = (localStorage.getItem(PREF_KEY) !== '0'); }catch(e){}

  function ensure(){
    if(ctx) return ctx;
    try{
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.45;
      master.connect(ctx.destination);
    }catch(e){ ctx = null; }
    return ctx;
  }

  /* 首次用户交互时恢复 AudioContext（解除浏览器挂起） */
  function resume(){
    const c = ensure();
    if(c && c.state === 'suspended'){ c.resume().catch(()=>{}); }
  }

  function setEnabled(v){
    enabled = !!v;
    try{ localStorage.setItem(PREF_KEY, enabled?'1':'0'); }catch(e){}
    if(!enabled){ stopSizzle(); stopPour(); }
  }
  function isEnabled(){ return enabled; }

  /* —— 基础合成单元 —— */
  /* 单振荡音（可带频率滑动） */
  function tone(freq, dur, opt){
    opt = opt || {};
    if(!enabled) return;
    const c = ensure(); if(!c) return;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = opt.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if(opt.freqTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1,opt.freqTo), t0+dur);
    const vol = opt.vol==null?0.3:opt.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0+dur+0.03);
  }

  /* 复用噪声缓冲（1s 白噪声） */
  function getNoise(){
    if(noiseBuf) return noiseBuf;
    const c = ensure(); if(!c) return null;
    const len = c.sampleRate * 1.0;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for(let i=0;i<len;i++) data[i] = Math.random()*2-1;
    noiseBuf = buf;
    return buf;
  }

  /* 带滤波/包络的噪声脉冲 */
  function noise(dur, opt){
    opt = opt || {};
    if(!enabled) return;
    const c = ensure(); if(!c) return;
    const t0 = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = getNoise(); src.loop = true;
    let node = src;
    if(opt.filter){
      const f = c.createBiquadFilter();
      f.type = opt.filter;
      f.frequency.value = opt.freq || 1000;
      f.Q.value = opt.q || 1;
      src.connect(f); node = f;
    }
    const g = c.createGain();
    const vol = opt.vol==null?0.3:opt.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0+(opt.attack||0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    node.connect(g).connect(master);
    src.start(t0);
    src.stop(t0+dur+0.03);
  }

  /* —— 具体音效 —— */

  /* 切菜：高频噪声 + 木质短冲击 */
  function chop(){
    noise(0.09, {filter:'highpass', freq:2600, vol:0.22, attack:0.002});
    tone(190, 0.07, {type:'square', vol:0.16, freqTo:95});
  }

  /* 翻炒/搅动：油炸滋滋（带通噪声短脉冲） */
  function stir(){
    noise(0.2, {filter:'bandpass', freq:2400, q:0.9, vol:0.22, attack:0.012});
  }

  /* 持续烹饪环境音（轻嘶嘶循环，进入烹饪阶段启动） */
  function startSizzle(){
    if(!enabled) return;
    const c = ensure(); if(!c) return;
    stopSizzle();
    const src = c.createBufferSource();
    src.buffer = getNoise(); src.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = 0.5;
    const g = c.createGain(); g.gain.value = 0.055;
    src.connect(f).connect(g).connect(master);
    src.start();
    sizzleNode = { src, g };
  }
  function stopSizzle(){
    if(sizzleNode){ try{ sizzleNode.src.stop(); }catch(e){} sizzleNode = null; }
  }

  /* 调味倾倒：沙沙噪声（持续，按住期间播放） */
  function startPour(){
    if(!enabled) return;
    const c = ensure(); if(!c) return;
    stopPour();
    const src = c.createBufferSource();
    src.buffer = getNoise(); src.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 3200;
    const g = c.createGain(); g.gain.value = 0.11;
    src.connect(f).connect(g).connect(master);
    src.start();
    pourNode = { src, g };
  }
  function stopPour(){
    if(pourNode){ try{ pourNode.src.stop(); }catch(e){} pourNode = null; }
  }

  /* 摆盘放置：柔和点击 */
  function place(){
    tone(440, 0.09, {type:'sine', vol:0.2, freqTo:300});
  }

  /* 阶段完成（柔和提示） */
  function stageDone(){
    tone(587, 0.14, {type:'triangle', vol:0.18});
    setTimeout(()=> tone(784, 0.16, {type:'triangle', vol:0.18}), 100);
  }

  /* 全流程完成：上升琶音 */
  function success(){
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((f,i)=> setTimeout(()=> tone(f, 0.2, {type:'triangle', vol:0.22}), i*95));
  }

  /* 失败/烧焦：下降不和谐 */
  function fail(){
    const notes = [330, 277, 220];
    notes.forEach((f,i)=> setTimeout(()=> tone(f, 0.24, {type:'sawtooth', vol:0.18}), i*120));
  }

  /* 解锁菜谱：明亮琶音 */
  function unlock(){
    [659, 988, 1319].forEach((f,i)=> setTimeout(()=> tone(f, 0.22, {type:'triangle', vol:0.2}), i*85));
  }

  /* 按钮：短促清脆 */
  function click(){
    tone(680, 0.05, {type:'sine', vol:0.14});
  }

  return {
    resume, setEnabled, isEnabled,
    chop, stir, startSizzle, stopSizzle,
    startPour, stopPour, place, stageDone, success, fail, unlock, click
  };
})();

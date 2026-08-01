/* ========== 主状态机：场景调度 + 阶段流转 ========== */
Cook.Game = (function(){
  const E = Cook.Engine;

  let state = 'menu';
  let current = null;        // 当前菜谱对象
  let stageScores = {};      // 本局各阶段 {score, star, detail}
  let seed = 0;
  const stages = {};
  // 烹饪流程顺序
  const FLOW = ['cutting','cooking','seasoning','plating'];

  function register(name, mod){ stages[name] = mod; }
  function setState(s, data){
    if(stages[state] && stages[state].exit) stages[state].exit();
    state = s;
    if(stages[s] && stages[s].enter) stages[s].enter(data||{});
    else showPlaceholder(s);
  }
  function showPlaceholder(s){
    const names = {cooking:'烹饪', seasoning:'调味', plating:'摆盘'};
    toast('【'+(names[s]||s)+'】阶段开发中，敬请期待');
    setTimeout(()=> goMenu(), 1500);
  }

  function goMenu(){
    if(stages[state] && stages[state].exit) stages[state].exit();
    state = 'menu';
    if(stages.menu) stages.menu.enter();
  }

  function startRecipe(id){
    const r = Cook.Recipes.get(id);
    if(!r) return;
    current = r;
    stageScores = {};
    seed = (Date.now()%1000000) + Math.floor(Math.random()*9999);
    setState('cutting', {recipe:r, seed});
  }

  /* 阶段完成回调 */
  function stageComplete(stageName, result){
    stageScores[stageName] = result;
    const idx = FLOW.indexOf(stageName);
    const next = FLOW[idx+1];
    const isLast = !next || !stages[next];
    /* 中间阶段：完成提示音；烧焦走失败音。末阶段交由 finishRecipe 播放收工音 */
    if(!isLast){
      if(result && result.star===0 && result.detail && ('熟度值' in result.detail)){
        Cook.Audio.fail();
      } else {
        Cook.Audio.stageDone();
      }
    }
    if(next && stages[next]){
      setState(next, {recipe:current, seed, scores:stageScores});
    } else {
      finishRecipe();
    }
  }

  /* 全流程结束：四阶段完整结算 + 分享挑战码 */
  function finishRecipe(){
    const stagesArr = FLOW.map(n=>stageScores[n]).filter(Boolean);
    const total = stagesArr.reduce((a,s)=>a+(s.score||0),0);
    /* 总星级取平均（向下取整），体现整局综合水平 */
    const avgStar = stagesArr.length ? stagesArr.reduce((a,s)=>a+(s.star||0),0)/stagesArr.length : 0;
    const star = Math.round(avgStar);
    /* 收工音：平均≥1.5星走成功琶音，否则走失败音 */
    if(avgStar >= 1.5) Cook.Audio.success(); else Cook.Audio.fail();
    showStageDone(total, star);
  }

  /* 四阶段元信息：图标 / 中文名 / 评分明细键名 */
  const STAGE_META = {
    cutting:  { icon:'🔪', name:'切菜' },
    cooking:  { icon:'🔥', name:'烹饪' },
    seasoning:{ icon:'🧂', name:'调味' },
    plating:  { icon:'🍽', name:'摆盘' }
  };

  /* 生成分享挑战码：CK + 菜谱hex(2) + 四阶段星(每位0-3) + 校验(base36)
     例：菜谱2(三文鱼寿司) 切3炒1调3摆2 → CK02-3132-7 */
  function makeShareCode(){
    if(!current) return 'CK00-0000-0';
    const idHex = ('0'+current.id.toString(16).toUpperCase()).slice(-2);
    const stars = FLOW.map(n=> (stageScores[n] && stageScores[n].star) || 0).join('');
    const sum = FLOW.reduce((a,n,i)=> a + ((stageScores[n] && stageScores[n].star) || 0)*(i+1), 0) + current.id;
    const check = (sum % 36).toString(36).toUpperCase();
    return 'CK'+idHex+'-'+stars+'-'+check;
  }

  /* 反解挑战码：返回 {recipeId, stars:[4], valid} 供校验/展示 */
  function parseShareCode(code){
    const m = /^CK([0-9A-F]{2})-(\d{4})-([0-9A-Z])$/i.exec((code||'').trim());
    if(!m) return null;
    const recipeId = parseInt(m[1],16);
    const stars = m[2].split('').map(s=>parseInt(s,10));
    if(stars.some(s=>s>3)) return null;
    const sum = stars.reduce((a,s,i)=>a+s*(i+1),0) + recipeId;
    const check = (sum % 36).toString(36).toUpperCase();
    return { recipeId, stars, valid: check===m[3].toUpperCase() };
  }

  /* 渲染四阶段明细列表 */
  function renderStageDetails(container){
    const html = FLOW.map(n=>{
      const r = stageScores[n];
      const meta = STAGE_META[n] || {icon:'•', name:n};
      if(!r) return '';
      const starStr = '★'.repeat(r.star||0)+'☆'.repeat(3-(r.star||0));
      const detail = r.detail || {};
      const detailHtml = Object.keys(detail).map(k=>
        '<span class="kv"><b>'+k+'</b>'+detail[k]+'</span>'
      ).join('');
      return '<div class="sd-row">'+
        '<div class="sd-row-hd">'+
          '<span class="sd-ic">'+meta.icon+'</span>'+
          '<span class="sd-nm">'+meta.name+'</span>'+
          '<span class="sd-st">'+starStr+'</span>'+
          '<span class="sd-sc">'+(r.score||0)+'</span>'+
        '</div>'+
        (detailHtml? '<div class="sd-row-dt">'+detailHtml+'</div>' : '')+
      '</div>';
    }).join('');
    container.innerHTML = html;
  }

  function showStageDone(score, star){
    if(!current){ goMenu(); return; }
    document.getElementById('sdStageName').textContent = current.name;
    document.getElementById('sdTitle').textContent = '烹饪完成';
    document.getElementById('sdStars').textContent = '★'.repeat(star)+'☆'.repeat(3-star);
    document.getElementById('sdScore').innerHTML = '总分 <b>'+score+'</b>';
    /* 明细 */
    renderStageDetails(document.getElementById('sdStages'));
    /* 分享挑战码 */
    const code = makeShareCode();
    document.getElementById('sdCode').textContent = code;
    document.getElementById('sdShare').style.display = 'flex';
    document.getElementById('sdCopyTip').textContent = '';
    document.getElementById('sdHint').textContent = '完美收工！复制挑战码邀请好友超越';
    document.getElementById('sdContinue').textContent = '返回菜单';
    document.getElementById('stageDone').style.display = 'flex';
  }

  /* 复制挑战码（含分享文案）到剪贴板 */
  function copyShareCode(){
    const code = document.getElementById('sdCode').textContent;
    const stars = FLOW.map(n=>{
      const s = stageScores[n] && stageScores[n].star || 0;
      return STAGE_META[n].name + '★'.repeat(s);
    }).join(' ');
    const text = '我在《烹饪工坊》挑战「'+current.name+'」：'+stars+'！\n挑战码 '+code+'，你能超越吗？';
    const tip = document.getElementById('sdCopyTip');
    function ok(){ tip.textContent = '✓ 已复制挑战码，去粘贴给好友吧'; tip.className='sd-share-tip ok'; }
    function fail(){ tip.textContent = '复制失败，请长按挑战码手动复制'; tip.className='sd-share-tip err'; }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(ok).catch(()=>fallbackCopy(text, ok, fail));
    } else { fallbackCopy(text, ok, fail); }
  }
  /* 降级复制方案：用临时 textarea + execCommand */
  function fallbackCopy(text, ok, fail){
    try{
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select();
      const done = document.execCommand('copy');
      document.body.removeChild(ta);
      done ? ok() : fail();
    }catch(e){ fail(); }
  }
  function closeStageDone(){
    document.getElementById('stageDone').style.display = 'none';
    if(current){
      const stagesArr = FLOW.map(n=>stageScores[n]).filter(Boolean);
      const total = stagesArr.reduce((a,s)=>a+(s.score||0),0);
      const avgStar = stagesArr.length ? stagesArr.reduce((a,s)=>a+(s.star||0),0)/stagesArr.length : 0;
      const star = Math.round(avgStar);
      /* 完整四阶段流程才记录菜谱成绩并解锁 */
      const implCount = FLOW.filter(n=>stages[n]).length;
      if(implCount >= FLOW.length){
        const before = Cook.Storage.data.unlocked.length;
        Cook.Storage.record(current.id, star, total);
        const after = Cook.Storage.data.unlocked.length;
        /* 新解锁下一道菜 → 播放解锁音 */
        if(after > before) Cook.Audio.unlock();
      }
    }
    goMenu();
  }

  /* toast 提示 */
  let toastTimer = null;
  function toast(msg){
    const el = document.getElementById('toast');
    el.textContent = msg; el.style.display = 'block';
    if(toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> el.style.display='none', 2000);
  }

  /* —— 音效：首次用户交互恢复 AudioContext + 开关 —— */
  const A = Cook.Audio;
  function refreshAudioToggle(){
    const btn = document.getElementById('audioToggle');
    btn.textContent = A.isEnabled() ? '🔊' : '🔇';
    btn.classList.toggle('off', !A.isEnabled());
  }
  function bindAudioToggle(){
    const btn = document.getElementById('audioToggle');
    btn.addEventListener('click', ()=>{
      A.resume();
      A.setEnabled(!A.isEnabled());
      refreshAudioToggle();
      if(A.isEnabled()) A.click();
    });
    refreshAudioToggle();
  }
  /* 浏览器自动播放策略：首次任意交互恢复 AudioContext */
  function bindFirstGesture(){
    const onGesture = ()=>{
      A.resume();
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
    window.addEventListener('pointerdown', onGesture);
    window.addEventListener('keydown', onGesture);
  }

  function update(){ if(stages[state] && stages[state].update) stages[state].update(); }
  function render(){ if(stages[state] && stages[state].render) stages[state].render(); }

  /* —— 初始化 —— */
  register('menu', Cook.Menu);
  register('cutting', Cook.Cutting);
  register('cooking', Cook.Cooking);
  register('seasoning', Cook.Seasoning);
  register('plating', Cook.Plating);

  // 结算弹窗按钮
  document.getElementById('sdContinue').addEventListener('click', closeStageDone);
  document.getElementById('sdCopy').addEventListener('click', copyShareCode);

  // 音效开关 + 首次交互恢复 AudioContext
  bindAudioToggle();
  bindFirstGesture();

  // 启动主循环 + 进入菜单
  E.start(update, render);
  stages.menu.enter();

  return {
    register, setState, goMenu, startRecipe, stageComplete, toast,
    makeShareCode, parseShareCode,
    get state(){ return state; }, get current(){ return current; },
    get stageScores(){ return stageScores; }
  };
})();

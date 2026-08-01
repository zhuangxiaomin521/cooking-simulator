/* ========== 输入：鼠标+触屏统一，识别 tap/drag/swipe/long-press ========== */
Cook.Input = (function(){
  const cv = Cook.Engine.cv;
  const pos = {x:0, y:0};            // 当前指针
  const downPos = {x:0, y:0, t:0};   // 按下时位置与时间
  let isDown=false, dragging=false, longFired=false;
  let longTimer=null;
  const LONG_PRESS = 450;
  const DRAG_THR = 8;                // 触发拖拽的位移阈值

  const handlers = {down:[],up:[],move:[],tap:[],drag:[],swipe:[],longpress:[]};
  function on(type, fn){ (handlers[type]=handlers[type]||[]).push(fn); }
  function off(type, fn){
    if(!handlers[type]) return;
    if(fn) handlers[type] = handlers[type].filter(f=>f!==fn);
    else handlers[type] = [];
  }
  function emit(type, e){ (handlers[type]||[]).forEach(f=>{ try{ f(e); }catch(err){ console.error(err); } }); }

  function getPos(e){
    const t = e.touches ? (e.touches[0]||e.changedTouches[0]) : e;
    const r = cv.getBoundingClientRect();
    return { x:t.clientX-r.left, y:t.clientY-r.top };
  }

  function handleDown(e){
    if(e.cancelable) e.preventDefault();
    const p = getPos(e);
    pos.x=p.x; pos.y=p.y;
    isDown=true; dragging=false; longFired=false;
    downPos.x=p.x; downPos.y=p.y; downPos.t=Date.now();
    emit('down', p);
    longTimer = setTimeout(()=>{ if(isDown && !dragging){ longFired=true; emit('longpress', {x:p.x,y:p.y}); } }, LONG_PRESS);
  }
  function handleMove(e){
    if(e.cancelable && isDown) e.preventDefault();
    const p = getPos(e);
    const dx = p.x-pos.x, dy = p.y-pos.y;
    pos.x=p.x; pos.y=p.y;
    if(isDown){
      if(!dragging && Math.hypot(p.x-downPos.x, p.y-downPos.y) > DRAG_THR){
        dragging=true;
        if(longTimer){ clearTimeout(longTimer); longTimer=null; }
      }
      if(dragging) emit('drag', {x:p.x, y:p.y, dx, dy, downX:downPos.x, downY:downPos.y});
    }
    emit('move', p);
  }
  function handleUp(e){
    if(e.cancelable) e.preventDefault();
    if(longTimer){ clearTimeout(longTimer); longTimer=null; }
    const dur = Date.now() - downPos.t;
    if(!dragging && !longFired && dur < 500){
      emit('tap', {x:downPos.x, y:downPos.y});
    } else if(dragging){
      emit('swipe', { sx:downPos.x, sy:downPos.y, ex:pos.x, ey:pos.y,
                      dx:pos.x-downPos.x, dy:pos.y-downPos.y, dur });
    }
    isDown=false; dragging=false;
    emit('up', {x:pos.x, y:pos.y});
  }

  cv.addEventListener('mousedown', handleDown);
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleUp);
  cv.addEventListener('touchstart', handleDown, {passive:false});
  cv.addEventListener('touchmove', handleMove, {passive:false});
  cv.addEventListener('touchend', handleUp, {passive:false});
  cv.addEventListener('touchcancel', handleUp, {passive:false});

  return {
    on, off,
    get pos(){ return pos; },
    get isDown(){ return isDown; },
    get dragging(){ return dragging; }
  };
})();

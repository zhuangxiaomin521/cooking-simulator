/* ========== 存档系统：解锁菜谱 / 最佳成绩 ========== */
Cook.Storage = (function(){
  const KEY = 'cookMaster_v1';

  function load(){ try{ return JSON.parse(localStorage.getItem(KEY) || '{}'); }catch(e){ return {}; } }
  let data = Object.assign({ unlocked:[0], best:{}, totalScore:0, gamesPlayed:0 }, load());

  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(data)); }catch(e){} }

  function isUnlocked(id){ return data.unlocked.indexOf(id) !== -1; }
  function unlock(id){ if(data.unlocked.indexOf(id)===-1){ data.unlocked.push(id); save(); } }

  function bestStar(id){ return (data.best[id] && data.best[id].star) || 0; }
  function bestScore(id){ return (data.best[id] && data.best[id].score) || 0; }

  /* 记录一局成绩：达到1星即解锁下一道菜 */
  function record(id, star, score){
    const prevStar = bestStar(id), prevScore = bestScore(id);
    if(!data.best[id] || star>prevStar || (star===prevStar && score>prevScore)){
      data.best[id] = { star, score };
    }
    if(star >= 1) unlock(id+1);
    data.totalScore = (data.totalScore||0) + score;
    data.gamesPlayed = (data.gamesPlayed||0) + 1;
    save();
  }

  function reset(){ data = {unlocked:[0], best:{}, totalScore:0, gamesPlayed:0}; save(); }

  return { data, isUnlocked, unlock, bestStar, bestScore, record, save, reset };
})();

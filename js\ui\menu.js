/* ========== 主菜单（DOM 菜谱卡片网格） ========== */
Cook.Menu = (function(){
  function enter(){
    document.getElementById('menu').style.display = 'flex';
    renderStats();
    renderGrid();
  }
  function exit(){
    document.getElementById('menu').style.display = 'none';
  }
  function renderStats(){
    const s = Cook.Storage.data;
    document.getElementById('totalScore').textContent = s.totalScore||0;
    document.getElementById('gamesPlayed').textContent = s.gamesPlayed||0;
    document.getElementById('unlockedCount').textContent = s.unlocked.length;
  }
  function renderGrid(){
    const grid = document.getElementById('recipeGrid');
    grid.innerHTML = '';
    Cook.Recipes.list.forEach(r=>{
      const unlocked = Cook.Storage.isUnlocked(r.id);
      const bestStar = Cook.Storage.bestStar(r.id);
      const card = document.createElement('div');
      card.className = 'recipe-card ' + (unlocked?'unlocked':'locked');
      card.innerHTML =
        '<span class="icon">'+r.icon+'</span>'+
        '<div class="name">'+r.name+'</div>'+
        '<span class="cuisine">'+r.cuisine+'</span>'+
        '<div class="diff">'+Cook.Recipes.diffStars(r.difficulty)+'</div>'+
        '<div class="best">最佳 <b>'+('★'.repeat(bestStar)||'—')+'</b></div>'+
        (unlocked?'':'<div class="lock-mask">🔒</div>');
      if(unlocked){
        card.onclick = ()=> Cook.Game.startRecipe(r.id);
      } else {
        card.onclick = ()=> Cook.Game.toast('先通关前一道菜（获得 ★1）解锁');
      }
      grid.appendChild(card);
    });
  }
  return { enter, exit, renderGrid, renderStats };
})();

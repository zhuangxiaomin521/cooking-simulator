/* ========== 菜谱数据（混合菜系，递进解锁） ========== */
Cook.Recipes = (function(){
  /*
   * mode 烹饪模式: stir 炒 / boil 煮 / bake 烤 / fry 煎 / blend 搅拌
   * cutServings 切菜目标份数
   * seasonTarget 调味目标用量(0~1)
   * plateItems 摆盘需摆放的件数
   * theme 主题色
   */
  const list = [
    {
      id:0, name:'番茄炒蛋', icon:'🍅', cuisine:'中餐', difficulty:1, mode:'stir',
      cutServings:6, seasonTarget:0.5, plateItems:3, theme:'#e8442a',
      ingredients:['tomato','egg'], cutFood:'tomato',
      desc:'经典家常，番茄红亮鸡蛋金黄'
    },
    {
      id:1, name:'草莓奶昔', icon:'🥤', cuisine:'甜品', difficulty:1, mode:'blend',
      cutServings:5, seasonTarget:0.4, plateItems:2, theme:'#e85a8a',
      ingredients:['strawberry','milk'], cutFood:'strawberry',
      desc:'冰凉浓郁，夏日小确幸'
    },
    {
      id:2, name:'三文鱼寿司', icon:'🍣', cuisine:'日料', difficulty:2, mode:'shape',
      cutServings:7, seasonTarget:0.45, plateItems:4, theme:'#e88a4a',
      ingredients:['fish','rice'], cutFood:'fish',
      desc:'醋饭配鲜鱼，匠人之味'
    },
    {
      id:3, name:'番茄意面', icon:'🍝', cuisine:'西餐', difficulty:2, mode:'boil',
      cutServings:6, seasonTarget:0.5, plateItems:3, theme:'#d8682a',
      ingredients:['pasta','tomato'], cutFood:'pasta_long',
      desc:'弹牙面条裹红酱，浓郁意式'
    },
    {
      id:4, name:'巧克力蛋糕', icon:'🍰', cuisine:'甜品', difficulty:3, mode:'bake',
      cutServings:4, seasonTarget:0.55, plateItems:5, theme:'#8a5a3a',
      ingredients:['chocolate','flour'], cutFood:'chocolate',
      desc:'松软可可香，甜品之巅'
    },
    {
      id:5, name:'香煎牛排', icon:'🥩', cuisine:'西餐', difficulty:3, mode:'fry',
      cutServings:4, seasonTarget:0.6, plateItems:2, theme:'#a83828',
      ingredients:['steak','butter'], cutFood:'steak',
      desc:'焦香外壳多汁内里，火候至上'
    }
  ];

  function get(id){ return list.find(r=>r.id===id); }
  function diffStars(d){
    // 难度转星显示
    return '★'.repeat(d) + '☆'.repeat(3-d);
  }
  return { list, get, diffStars };
})();

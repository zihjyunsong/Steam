/* ===== i18n strings ===== */
const I18N = {
  zh: {
    title: "我的遊戲收藏統計",
    disclaimer: "個人遊戲收藏紀錄 · 非官方頁面，與 Valve / Steam 無關。本頁僅顯示個人遊玩數據，不會要求或收集任何登入、密碼、付款等個人資訊。",
    level: "等級", years: "年資", yearUnit: "年",
    avgPrice: "平均單價",
    totalHours: "總遊玩時數",
    entries: "項目總數", playedRatio: "已遊玩遊戲比例",
    priceLabel: "今日購入總價 / 史低總價",
    gamesU: "遊戲", appsU: "應用程式",
    progress: "已遊玩遊戲",
    search: "搜尋遊戲…",
    fAll: "全部", fPlayed: "已遊玩", fUnplayed: "未遊玩",
    countTpl: (n,t)=>`顯示 ${n} / ${t} 款遊戲`,
    cName:"遊戲名稱", cPrice:"價格", cTime:"時數", cRating:"評價",
    free:"免費", noPrice:"無價格", never:"未遊玩",
    foot: a=>`非官方個人頁面，與 Valve / Steam 無關。Steam ID ${a.steamId} · 公開資料擷取自 steamdb.info/calculator（cc=tw）· 擷取日期 ${a.captured}<br>點擊遊戲名稱可開啟該遊戲的 Steam 商店頁。價格以新台幣 (NT$) 計。「今日購入總價」為現價加總，「史低總價」為 SteamDB 紀錄之歷史最低價加總。項目總數 ${a.entries} 含 ${a.gamesTotal} 款遊戲與 ${a.entries-a.gamesTotal} 個應用程式（DisplayFusion、CPUCores、Controller Companion），故「已遊玩遊戲比例」以 ${a.gamesTotal} 款遊戲為分母。`
  },
  en: {
    title: "My Game Collection",
    disclaimer: "A personal record of one player's game collection · Unofficial — not affiliated with, endorsed by, or connected to Valve or Steam. This page only displays personal play data and never asks for or collects any login, password, payment, or other personal information.",
    level: "Level", years: "Member for", yearUnit: "yrs",
    avgPrice: "Average price",
    totalHours: "Hours on record",
    entries: "Total entries", playedRatio: "Games played",
    priceLabel: "Price today / Lowest total",
    gamesU: "games", appsU: "apps",
    progress: "Games played",
    search: "Search games…",
    fAll: "All", fPlayed: "Played", fUnplayed: "Unplayed",
    countTpl: (n,t)=>`Showing ${n} of ${t} games`,
    cName:"Name", cPrice:"Price", cTime:"Time", cRating:"Rating",
    free:"Free", noPrice:"No price", never:"Never played",
    foot: a=>`Unofficial personal page, not affiliated with Valve or Steam. Steam ID ${a.steamId} · Public data from steamdb.info/calculator (cc=tw) · captured ${a.captured}<br>Click a game name to open its Steam store page. Prices in NT$. "Price today" = sum of current prices; "Lowest total" = sum of lowest recorded prices on SteamDB. The ${a.entries} total entries cover ${a.gamesTotal} games and ${a.entries-a.gamesTotal} apps (DisplayFusion, CPUCores, Controller Companion), so "Games played" uses ${a.gamesTotal} games as the denominator.`
  }
};

// assign cropped icon path (matches PNG row order = GAMES order)
GAMES.forEach((g,i)=> g.icon = "images/icons/g"+String(i+1).padStart(3,"0")+".png");

let lang = "zh";
let sortKey = "t", sortDir = -1;   // default: by time desc (matches SteamDB)
let filter = "all", query = "";

const fmt = n => n.toLocaleString("en-US");
const $ = s => document.querySelector(s);

function ratingClass(r){ return r>=90?"r-hi":r>=80?"r-mid":r>=70?"r-lo":"r-vlo"; }

function gameName(g){
  if(lang==="zh") return g.zh || g.en;
  return g.en;
}
// secondary line: show the other language if it differs
function gameSub(g){
  if(!g.zh) return "";
  const primary = gameName(g);
  const other = lang==="zh" ? g.en : g.zh;
  return other && other!==primary ? other : "";
}

// Steam store page for a game. Uses store search by name, which lands on the
// exact game (works without needing per-game appids). Strips parenthetical
// translations and trademark symbols for the cleanest match.
function storeUrl(g){
  const term = g.en.replace(/\s*\([^)]*\)\s*/g," ").replace(/[™®©]/g,"").replace(/\s+/g," ").trim();
  return "https://store.steampowered.com/search/?term="+encodeURIComponent(term);
}

function priceCell(g){
  const t = I18N[lang];
  if(g.p===null) return `<span class="muted">${t.noPrice}</span>`;
  if(g.p===0)    return `<span class="free">${t.free}</span>`;
  return `${ACCOUNT.currency} ${fmt(g.p)}`;
}
function timeCell(g){
  if(g.tl===null) return `<span class="muted">—</span>`;
  return g.tl;
}

/* ===== Account header ===== */
function renderAccount(){
  const a = ACCOUNT, t = I18N[lang];
  $("#account").innerHTML = `
    <div class="account-top">
      <div class="acc-id">
        <img class="avatar" src="images/avatar.png" alt="${a.name}">
        <div>
          <div class="acc-name">${a.name}</div>
          <div class="acc-sub">${t.level} ${a.level} · ${t.years} ${a.years} ${t.yearUnit} · Steam ID ${a.steamId}</div>
        </div>
      </div>
    </div>

    <div class="played-bar">
      <div class="meta"><span>${t.progress}</span><span>${a.gamesPlayed} / ${a.gamesTotal} · ${a.pctPlayed}%</span></div>
      <div class="bar"><span style="width:${a.pctPlayed}%"></span></div>
    </div>

    <div class="stats">
      <div class="stat"><div class="k">${t.playedRatio}</div><div class="v">${a.pctPlayed}% <small>(${a.gamesPlayed} / ${a.gamesTotal})</small></div></div>
      <div class="stat"><div class="k">${t.entries}</div><div class="v">${a.entries} <small>(${t.gamesU} ${a.gamesTotal} · ${t.appsU} ${a.entries-a.gamesTotal})</small></div></div>
      <div class="stat"><div class="k">${t.totalHours}</div><div class="v">${fmt(Math.round(a.hoursTotal))}<small> h</small></div></div>
      <div class="stat"><div class="k">${t.avgPrice}</div><div class="v">${a.currency} ${a.avgPrice}</div></div>
      <div class="stat"><div class="k">${t.priceLabel}</div><div class="v">${a.currency} ${fmt(a.todayPrice)} <small>／ ${a.currency} ${fmt(a.value)}</small></div></div>
    </div>`;
}

/* ===== Table head ===== */
const COLS = [
  {key:"name",  i18n:"cName",  num:false},
  {key:"p",     i18n:"cPrice", num:true},
  {key:"t",     i18n:"cTime",  num:true},
  {key:"r",     i18n:"cRating",num:true},
];
function renderHead(){
  const t = I18N[lang];
  let h = `<th class="idx">#</th>`;
  COLS.forEach(c=>{
    const sorted = c.key===sortKey;
    const arrow = sorted ? (sortDir<0?"▼":"▲") : "↕";
    h += `<th data-key="${c.key}" class="${c.num?'num':''} ${sorted?'sorted':''}">${t[c.i18n]}<span class="arrow">${arrow}</span></th>`;
  });
  $("#head").innerHTML = h;
  $("#head").querySelectorAll("th[data-key]").forEach(th=>{
    th.onclick = ()=>{
      const k = th.dataset.key;
      if(k===sortKey){ sortDir*=-1; }
      else { sortKey=k; sortDir = (k==="name") ? 1 : -1; }
      renderHead(); renderBody();
    };
  });
}

/* ===== Sorting + filtering ===== */
function currentRows(){
  let rows = GAMES.slice();
  if(filter==="played")   rows = rows.filter(g=>g.t!==null);
  if(filter==="unplayed") rows = rows.filter(g=>g.t===null);
  if(query){
    const q = query.toLowerCase();
    rows = rows.filter(g => g.en.toLowerCase().includes(q) || (g.zh && g.zh.includes(query)));
  }
  rows.sort((a,b)=>{
    let va,vb;
    if(sortKey==="name"){ va=gameName(a).toLowerCase(); vb=gameName(b).toLowerCase(); return va<vb?-sortDir:va>vb?sortDir:0; }
    va = a[sortKey]; vb = b[sortKey];
    const na = va===null, nb = vb===null;          // nulls always sink to bottom
    if(na&&nb) return 0; if(na) return 1; if(nb) return -1;
    return (va-vb)*sortDir;
  });
  return rows;
}

function renderBody(){
  const t = I18N[lang];
  const rows = currentRows();
  let html = "";
  rows.forEach((g,i)=>{
    const sub = gameSub(g);
    const subHtml = sub ? '<span class="sub">'+sub+'</span>' : '';
    html += '<tr>'
      + '<td class="idx">'+(i+1)+'</td>'
      + '<td class="gname-cell"><span class="cell-inner">'
        + '<img class="gicon" loading="lazy" src="'+g.icon+'" alt="" onerror="this.style.visibility=\'hidden\'">'
        + '<a class="gname" href="'+storeUrl(g)+'" target="_blank" rel="noopener"><span class="gname-text">'+gameName(g)+'</span>'+subHtml+'</a>'
      + '</span></td>'
      + '<td class="num" data-label="'+t.cPrice+'">'+priceCell(g)+'</td>'
      + '<td class="num" data-label="'+t.cTime+'">'+timeCell(g)+'</td>'
      + '<td class="num" data-label="'+t.cRating+'"><span class="rating '+ratingClass(g.r)+'">'+g.r.toFixed(2)+'%</span></td>'
      + '</tr>';
  });
  $("#body").innerHTML = html;
  $("#count").textContent = t.countTpl(rows.length, GAMES.length);
}

/* ===== Static i18n bits ===== */
function renderStatic(){
  const t = I18N[lang];
  document.documentElement.lang = lang==="zh" ? "zh-Hant" : "en";
  document.querySelectorAll("[data-i18n]").forEach(el=> el.textContent = t[el.dataset.i18n]);
  $("#search").placeholder = t.search;
  const f = $("#filter");
  f.options[0].text=t.fAll; f.options[1].text=t.fPlayed; f.options[2].text=t.fUnplayed;
  $("#foot").innerHTML = t.foot(ACCOUNT);
}

function renderAll(){ renderStatic(); renderAccount(); renderHead(); renderBody(); }

/* ===== Events ===== */
$("#langToggle").addEventListener("click", e=>{
  const b = e.target.closest("button"); if(!b) return;
  lang = b.dataset.lang;
  $("#langToggle").querySelectorAll("button").forEach(x=>x.classList.toggle("active", x===b));
  renderAll();
});
$("#search").addEventListener("input", e=>{ query=e.target.value.trim(); renderBody(); });
$("#filter").addEventListener("change", e=>{ filter=e.target.value; renderBody(); });

renderAll();

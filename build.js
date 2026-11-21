#!/usr/bin/env node
/*
  Сборка сайта. Без зависимостей, нужен только Node.js (nodejs.org).
  Запуск:  node build.js
  Читает data/site.js и data/cases.js, пишет index.html и cases/<id>.html.
*/
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const S = require('./data/site.js');
const ALL = require('./data/cases.js');
const PH = require('./data/placeholders.js');
const CASES = ALL.filter(c => !c.hidden);
const year = new Date().getFullYear();
let placeholders = 0;
const missing = [];

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// текст + подсветка [заполнить] + переносы строк
const P = s => esc(s).replace(/\[([^\]]*)\]/g, m => { placeholders++; return '<span class="pl">' + m + '</span>'; }).replace(/\n/g, '<br>');
const N = i => String(i + 1).padStart(2, '0');
const TL = { web: 'Веб', poster: 'Постеры', product: 'Продукт', smm: 'Соцсети' };

// Стрелки рисуем SVG-ом: символы ↗ ← и т.п. на iPhone превращаются в эмодзи-«кнопки»
const AR = { ne: 'M5 19L19 5M8 5H19V16', down: 'M12 4V20M5 13L12 20L19 13', left: 'M20 12H4M11 5L4 12L11 19', right: 'M4 12H20M13 5L20 12L13 19', up: 'M12 20V4M5 11L12 4L19 11' };
const ar = d => `<svg class="arw" viewBox="0 0 24 24" aria-hidden="true"><path d="${AR[d]}"/></svg>`;
const checkFile = f => { if (f && !fs.existsSync(path.join(ROOT, f))) missing.push(f); };

const C = S.contacts;
const SP = [8, 4, 5, 7];
const sp = CASES.map((c, i) => SP[i % 4]);
if (CASES.length % 2 === 1 && CASES.length > 0) sp[CASES.length - 1] = 12;

/* ---------- общие куски ---------- */
function head(o) {
  const url = S.siteUrl + '/' + o.path;
  const og = fs.existsSync(path.join(ROOT, 'assets/img/og.jpg')) ? S.siteUrl + '/assets/img/og.jpg' : '';
  const metrika = S.metrikaId ? `<script>(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${esc(S.metrikaId)},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true});</script>` : '';
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light only">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:url" content="${esc(url)}">
${og ? `<meta property="og:image" content="${og}">\n<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<link rel="icon" type="image/svg+xml" href="${o.base}assets/favicon.svg">
<link rel="preload" as="font" type="font/woff2" crossorigin href="${o.base}assets/fonts/onest-cyrillic-900-normal.woff2">
<link rel="stylesheet" href="${o.base}assets/css/style.css">
${o.extra || ''}${metrika}
</head>
<body id="top">
`;
}

const nav = b => `<nav>
 <a class="logo" href="${b}index.html"><span>АННА Б.®</span><span class="m">Portfolio/${year}</span></a>
 <a class="l m" href="${b}index.html#works">Работы</a><a class="l m" href="${b}index.html#services">Услуги</a><a class="l m" href="${b}index.html#process">Процесс</a><a class="l m" href="#contact">Контакт</a>
 <div class="st m"><i class="dot"></i>${esc(S.city)} ${ar('right')} мир · UTC+5</div>
 <a class="go" href="#contact">ЗАКАЗАТЬ ПРОЕКТ ${ar('ne')}</a>
</nav>
`;

const contact = () => `<section id="contact" class="fin">
 <h2>ДАВАЙ<br>СДЕЛАЕМ<br>ГРОМКО.</h2>
 <div class="ct">
  <a href="${esc(C.telegram.url)}" target="_blank" rel="noopener">TELEGRAM<span class="m">${esc(C.telegram.label)}</span></a>
  <a href="${esc(C.email.url)}">EMAIL<span class="m">${esc(C.email.label)}</span></a>
  <a href="${esc(C.behance.url)}" target="_blank" rel="noopener">BEHANCE<span class="m">${esc(C.behance.label)}</span></a>
  <a href="${esc(C.telegram.url)}" target="_blank" rel="noopener">НАПИСАТЬ ${ar('ne')}<span class="m" style="color:var(--acid)">${esc(C.note)}</span></a>
 </div>
</section>
`;

const footer = b => `<footer><div class="row m"><span>© ${year} ${esc(S.name)} · ${esc(S.city)}</span><a href="#top">${ar('up')} Наверх</a></div><div class="xl">АННА Б.</div></footer>
<div id="cur">СМОТРЕТЬ ${ar('ne')}</div>
<script src="${b}assets/js/main.js" defer></script>
</body>
</html>
`;

const art = (c, b) => {
  if (c.cover) { checkFile(c.cover); return `<img src="${b}${esc(c.cover)}" alt="${esc(c.title)}" loading="lazy">`; }
  return PH[c.id] || '<div style="inset:0;background:var(--acid)"></div><div class="cap" style="bottom:auto;top:14px;left:14px">[обложка кейса]</div>';
};
const tagsHtml = c => c.tags.map(t => `<span>${P(t)}</span>`).join('');

/* ---------- главная ---------- */
function home() {
  const types = [...new Set(CASES.map(c => c.type))];
  const chips = ['<button class="chip m on" data-f="all">Все</button>'].concat(types.map(t => `<button class="chip m" data-f="${t}">${TL[t] || t}</button>`)).join('');
  const cards = CASES.map((c, i) => `<a class="case" style="grid-column:span ${sp[i]}" data-t="${c.type}" href="cases/${c.id}.html"><div class="top m"><span>${N(i)} / ${TL[c.type] || ''}</span><span>${P(c.client)}</span></div><div class="art">${art(c, '')}</div><div class="body"><h3>${P(c.title)}</h3><p>${P(c.sub)}</p><div class="tags m">${tagsHtml(c)}</div></div></a>`).join('\n  ');
  const mtxt = [...S.marquee, ...S.marquee].join(' ● ') + ' ● ';
  const ab = S.about;
  if (ab.photo) checkFile(ab.photo);
  const photo = ab.photo
    ? `<div class="photo has"><img src="${esc(ab.photo)}" alt="${esc(ab.photoAlt)}" loading="lazy"><i class="m">Это я</i></div>`
    : `<div class="photo"><span class="m">[Фото 4:5<br>Анна, портрет]</span><i class="m">Это я</i></div>`;
  if (!ab.photo) placeholders++;
  const stats = S.stats.map(s => `<div${s.accent ? ' class="acid"' : ''}><b>${esc(s.n)}</b><span class="m">${P(s.label)}</span></div>`).join('\n ');
  const services = S.services.map((s, i) => `<a class="srv" href="#contact"><div class="n">${N(i)}</div><div><h3>${P(s.title)}</h3></div><div class="m" style="font-weight:500">${P(s.text)}</div><div class="m">${P(s.price)}${s.term ? '<br>' + P(s.term) : ''}</div><div class="go">${ar('ne')}</div></a>`).join('\n ');
  const proc = S.process.map((p, i) => {
    const k = i % 4, cls = k === 1 ? ' class="acid"' : k === 3 ? ' class="inv"' : '';
    const st = k === 1 ? ' style="-webkit-text-stroke-color:#0B0B0B"' : k === 3 ? ' style="-webkit-text-stroke-color:var(--acid)"' : '';
    return `<div${cls}><span class="n"${st}>${N(i)}</span><div><h3>${P(p.title)}</h3><p>${P(p.text)}</p></div></div>`;
  }).join('\n  ');
  const ld = { '@context': 'https://schema.org', '@type': 'Person', name: S.name, jobTitle: 'Графический и веб-дизайнер', url: S.siteUrl, address: { '@type': 'PostalAddress', addressLocality: S.city, addressCountry: 'RU' }, sameAs: [C.behance.url, C.telegram.url] };
  const extra = `<script type="application/ld+json">${JSON.stringify(ld)}</script>\n`;

  return head({ title: S.title, desc: S.description, base: '', path: '', extra }) + nav('') + `
<header class="hero">
 <div class="tl m">(Портфолио дизайнера — ${esc(S.name)})</div><div class="tr m">N°001 / Выпуск ${year}</div>
 <h1 id="h1"><span>ДИЗАЙН,</span><span class="o">КОТОРЫЙ</span><span><i class="h">ЦЕПЛЯЕТ</i></span></h1>
 <div class="sticker">${P(S.hero.sticker)}</div>
 <div class="tag a">${P(S.hero.tagA)}</div>
 <div class="tag b2">${P(S.hero.tagB)}</div>
</header>
<section class="info">
 <div><p>${P(S.hero.intro)}</p></div>
 <div><span class="m" style="color:var(--mute)">Статус</span><span class="big" style="display:flex;gap:10px;align-items:center;font-size:20px"><i class="dot"></i>${P(S.hero.status)}</span></div>
 <a class="inv cta" href="#works"><span class="m" style="color:var(--acid)">01</span><span class="big">СМОТРЕТЬ<br>РАБОТЫ ${ar('down')}</span></a>
 <a class="acid cta" href="#contact"><span class="m">02</span><span class="big">ЗАКАЗАТЬ<br>ПРОЕКТ ${ar('ne')}</span></a>
</section>
<div class="mq" aria-hidden="true"><div>${esc(mtxt)}</div><div>${esc(mtxt)}</div></div>

<section class="about" id="about">
 <div class="pc">${photo}</div>
 <div class="ar">
  <span class="m">(01) Обо мне</span>
  <h2 class="rv">${P(ab.statement)}</h2>
  ${ab.bio ? `<p>${P(ab.bio)}</p>` : ''}
 </div>
</section>
<section class="stats">
 ${stats}
</section>

<section id="works">
 <div class="wh"><h2>РАБОТЫ<sup class="m" style="font-size:20px;vertical-align:top"> (${N(CASES.length - 1)})</sup></h2>
  <div class="chips" id="chips">${chips}</div></div>
 <div class="grid" id="grid">
  ${cards}
 </div>
</section>

<section id="services">
 <div class="sh"><h2>ЧТО<br>ЗАКАЗАТЬ</h2><span class="m">(03) Услуги</span></div>
 ${services}
</section>

<section id="process">
 <div class="ph"><h2>КАК Я<br>РАБОТАЮ</h2></div>
 <div class="proc">
  ${proc}
 </div>
</section>

` + contact() + footer('');
}

/* ---------- страница кейса (один шаблон для всех) ---------- */
function casePage(c, i) {
  const b = '../';
  const nx = CASES[(i + 1) % CASES.length];
  const nn = (i + 1) % CASES.length;
  const meta = [['Клиент', c.client], ['Роль', c.role], ['Срок', [c.term, c.year].filter(Boolean).join(' · ')], ['Инструменты', c.tools]]
    .filter(x => x[1]).map(x => `<div><span class="m">${x[0]}</span><div>${P(x[1])}</div></div>`).join('');
  const link = c.link ? `<div style="margin-top:16px">${c.linkUrl
    ? `<a class="chip m" style="display:inline-block" href="${esc(c.linkUrl)}" target="_blank" rel="noopener">${P(c.link)} ${ar('ne')}</a>`
    : `<span class="chip m" style="display:inline-block">${P(c.link)} ${ar('ne')}</span>`}</div>` : '';
  const tl3 = [['Задача', c.task, ''], ['Решение', c.sol, 'acid'], ['Результат', c.res, 'inv']]
    .map(x => `<div class="${x[2]}"><span class="m">${x[0]}</span><h3>${x[0].toUpperCase()}</h3><p>${P(x[1])}</p></div>`).join('');
  const gal = (c.gal || []).map(g => {
    if (g[3]) { checkFile(g[3]); return `<div class="has" style="grid-column:span ${g[1]};aspect-ratio:${g[2]}"><img src="${b}${esc(g[3])}" alt="${esc(g[0])}" loading="lazy"></div>`; }
    return `<div style="grid-column:span ${g[1]};aspect-ratio:${g[2]}"><span class="m">${P(g[0])}</span></div>`;
  }).join('');
  const nums = (c.nums || []).map((x, k) => `<div${k === 1 ? ' class="acid"' : ''}><b>${P(x[0])}</b><span class="m">${P(x[1])}</span></div>`).join('');
  const steps = (c.steps || []).map((s, k) => `<div><span class="m">Шаг ${N(k)}</span><b>${P(s[0])}</b><p>${P(s[1])}</p></div>`).join('');
  const nextHtml = CASES.length > 1
    ? `<a href="${nx.id}.html"><span class="m">Следующий кейс ${N(nn)}</span><h3>${P(nx.title)} ${ar('right')}</h3></a>` : `<a href="${b}index.html#works"><span class="m">Все работы</span><h3>НА ГЛАВНУЮ ${ar('right')}</h3></a>`;

  return head({ title: `${c.title} — ${S.name}`, desc: c.sub, base: b, path: `cases/${c.id}.html` }) + nav(b) + `
<main>
<div class="cv-head"><a class="back" href="${b}index.html#works"><span class="m">Все работы</span><b>${ar('left')}</b></a><div><span class="m">Кейс ${N(i)} / ${TL[c.type] || ''}</span><h1>${P(c.title)}</h1><p class="sub">${P(c.sub)}</p><div class="tags m">${tagsHtml(c)}</div>${link}</div></div>
<div class="meta">${meta}</div>
<div class="cover"><div class="art">${art(c, b)}</div></div>
<div class="tl3">${tl3}</div>
${c.ctx ? `<div class="txt"><span class="m">Контекст</span><p>${P(c.ctx)}</p></div>` : ''}
${steps ? `<div class="steps">${steps}</div>` : ''}
${gal ? `<div class="gal">${gal}</div>` : ''}
${nums ? `<div class="nums">${nums}</div>` : ''}
${c.quote ? `<div class="quote"><q>${P(c.quote)}</q><span class="m">— ${P(c.who)}</span></div>` : ''}
<div class="next"><a class="acid" href="#contact"><span class="m">Нравится?</span><h3>ХОЧУ<br>ТАКОЙ ЖЕ ${ar('ne')}</h3></a>${nextHtml}</div>
</main>
` + contact() + footer(b);
}

/* ---------- запись файлов ---------- */
const casesDir = path.join(ROOT, 'cases');
fs.mkdirSync(casesDir, { recursive: true });
fs.readdirSync(casesDir).filter(f => f.endsWith('.html')).forEach(f => fs.unlinkSync(path.join(casesDir, f)));

fs.writeFileSync(path.join(ROOT, 'index.html'), home());
CASES.forEach((c, i) => fs.writeFileSync(path.join(casesDir, c.id + '.html'), casePage(c, i)));

const urls = [''].concat(CASES.map(c => `cases/${c.id}.html`));
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${S.siteUrl}/${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${S.siteUrl}/sitemap.xml\n`);

/* ---------- отчёт ---------- */
console.log(`Готово: index.html + ${CASES.length} стр. кейсов (скрыто: ${ALL.length - CASES.length}).`);
if (/[\[\]]/.test(S.siteUrl)) console.log('! В data/site.js не указан siteUrl (адрес сайта).');
if (placeholders) console.log(`! Осталось заполнить мест с [скобками]: ${placeholders} (на сайте они красные).`);
if (missing.length) console.log('! Не найдены файлы картинок:\n  ' + [...new Set(missing)].join('\n  '));
if (!fs.existsSync(path.join(ROOT, 'assets/img/og.jpg'))) console.log('i Для превью в соцсетях положи картинку 1200×630 в assets/img/og.jpg.');

(function () {
  'use strict';
  /* Заголовок: буквы выезжают по очереди */
  var h = document.getElementById('h1');
  if (h && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    h.querySelectorAll(':scope > span').forEach(function (s, si) {
      var el = s.querySelector('i') || s, txt = el.textContent;
      el.setAttribute('aria-label', txt);
      el.textContent = '';
      txt.split('').forEach(function (ch, i) {
        var x = document.createElement('span');
        x.className = 'ch'; x.setAttribute('aria-hidden', 'true');
        x.style.setProperty('--i', si * 7 + i);
        x.textContent = ch; el.appendChild(x);
      });
    });
  }
  /* Курсор «СМОТРЕТЬ» над карточками кейсов */
  var cur = document.getElementById('cur');
  if (cur && window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mousemove', function (e) {
      var on = e.target.closest && e.target.closest('.case');
      cur.classList.toggle('on', !!on);
      if (on) { cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px'; }
    });
  }
  /* Фильтр кейсов */
  var chips = document.getElementById('chips');
  if (chips) {
    chips.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      chips.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      var f = b.dataset.f;
      document.querySelectorAll('.case').forEach(function (c) { c.classList.toggle('hide', f !== 'all' && c.dataset.t !== f); });
    });
  }
  /* Появление блоков при скролле */
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.rv,.srv,.proc>div,.stats>div,.tl3>div,.nums>div').forEach(function (el) { el.classList.add('rv'); io.observe(el); });
  }
})();

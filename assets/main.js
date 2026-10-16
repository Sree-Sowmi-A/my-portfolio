/* Sree Sowmi Ananthasayanam — portfolio interactions (no dependencies) */
(() => {
  const d = document, root = d.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];

  /* ---------- page enter / leave ---------- */
  const ready = () => requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));
  ready();
  addEventListener('pageshow', e => { if (e.persisted) { root.classList.remove('leaving'); root.classList.add('ready'); } });
  d.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const href = a.getAttribute('href');
    if (!href || a.target === '_blank' || a.hasAttribute('download') || /^(#|mailto:|tel:|https?:|javascript:)/.test(href)) return;
    e.preventDefault();
    root.classList.add('leaving');
    setTimeout(() => { location.href = a.href; }, reduce ? 0 : 560);
  });

  /* ---------- smooth, slightly delayed scrolling ---------- */
  const smooth = !reduce && !coarse;
  let cur = scrollY, target = scrollY, raf = 0, locked = false;
  const maxY = () => Math.max(0, root.scrollHeight - innerHeight);
  const clamp = v => Math.min(maxY(), Math.max(0, v));
  const EASE = 0.075; // lower = more delay / floatier
  function tick() {
    cur += (target - cur) * EASE;
    if (Math.abs(target - cur) < 0.5) { cur = target; raf = 0; scrollTo({ top: cur, behavior: 'instant' }); return; }
    scrollTo({ top: cur, behavior: 'instant' });
    raf = requestAnimationFrame(tick);
  }
  function go(y) { target = clamp(y); if (!raf) { cur = scrollY; raf = requestAnimationFrame(tick); } }
  if (smooth) {
    root.classList.add('smooth');
    addEventListener('wheel', e => {
      if (e.ctrlKey || locked) return;
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 34 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
      go((raf ? target : scrollY) + dy * 0.9);
    }, { passive: false });
    addEventListener('scroll', () => { if (!raf) cur = target = scrollY; }, { passive: true });
    addEventListener('keydown', e => {
      if (locked || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target; if (t !== d.body && t !== root) return;
      const base = raf ? target : scrollY; let y = null;
      if (e.key === 'ArrowDown') y = base + 90; else if (e.key === 'ArrowUp') y = base - 90;
      else if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) y = base + innerHeight * 0.85;
      else if (e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) y = base - innerHeight * 0.85;
      else if (e.key === 'Home') y = 0; else if (e.key === 'End') y = maxY();
      if (y !== null) { e.preventDefault(); go(y); }
    });
    d.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const el = a.getAttribute('href').length > 1 && $(a.getAttribute('href'));
      e.preventDefault(); go(el ? el.getBoundingClientRect().top + scrollY - 90 : 0);
    });
  }

  /* ---------- header, progress, parallax, timeline ---------- */
  const header = $('.site-header'), bar = $('.progress'), tl = $('.tl');
  const blobs = $$('.blobs i'), par = $$('[data-parallax]');
  let lastY = scrollY, ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY, h = maxY();
    if (bar) bar.style.transform = `scaleX(${h ? y / h : 0})`;
    if (header) {
      header.classList.toggle('solid', y > 30);
      header.classList.toggle('hide', y > 260 && y > lastY + 2 && !$('.menu.open'));
      if (y < lastY - 2) header.classList.remove('hide');
    }
    blobs.forEach((b, i) => b.style.transform = `translate3d(0,${y * (i ? -0.08 : 0.12)}px,0)`);
    par.forEach(el => el.style.transform = `translate3d(0,${y * parseFloat(el.dataset.parallax)}px,0)`);
    if (tl) {
      const r = tl.getBoundingClientRect();
      const p = (innerHeight * 0.6 - r.top) / r.height;
      tl.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(3));
    }
    lastY = y;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- headline word-by-word reveal ---------- */
  $$('[data-split]').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const w = d.createElement('span'), s = d.createElement('span');
            w.className = 'w'; s.textContent = part; s.style.setProperty('--i', i++); w.append(s); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  });

  /* ---------- scroll reveal (staggered) ---------- */
  $$('.reveal-group').forEach(g => $$(':scope > .reveal', g).forEach((el, i) => el.style.setProperty('--d', (i * 0.11) + 's')));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .tl-item').forEach(el => io.observe(el));

  /* ---------- count-up numbers ---------- */
  const co = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; co.unobserve(e.target);
    const end = +e.target.dataset.count, t0 = performance.now(), dur = reduce ? 1 : 1600;
    const step = t => { const k = Math.min(1, (t - t0) / dur), v = 1 - Math.pow(1 - k, 3);
      e.target.textContent = Math.round(end * v); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  $$('[data-count]').forEach(el => co.observe(el));

  /* ---------- pointer effects (fine pointers only) ---------- */
  if (!coarse && !reduce) {
    const glow = $('.glow'); let gx = innerWidth / 2, gy = innerHeight / 3, tx = gx, ty = gy;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; root.classList.add('pointer'); }, { passive: true });
    (function loop() { gx += (tx - gx) * 0.08; gy += (ty - gy) * 0.08;
      if (glow) glow.style.transform = `translate3d(${gx}px,${gy}px,0)`; requestAnimationFrame(loop); })();
    $$('.tilt').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 6}deg) translateY(-4px)`;
        c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
      });
      c.addEventListener('pointerleave', () => { c.style.transform = ''; });
    });
    $$('.magnetic').forEach(m => {
      m.addEventListener('pointermove', e => { const r = m.getBoundingClientRect();
        m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px,${(e.clientY - r.top - r.height / 2) * 0.3}px)`; });
      m.addEventListener('pointerleave', () => { m.style.transform = ''; });
    });
  }

  /* ---------- mobile menu ---------- */
  const mb = $('.menu-btn'), menu = $('.menu');
  if (mb && menu) {
    mb.addEventListener('click', () => { const o = menu.classList.toggle('open'); mb.setAttribute('aria-expanded', o); mb.textContent = o ? 'Close' : 'Menu'; });
  }

  /* ---------- project images: drop files into /images, no HTML edits needed ----------
     Name them  <slug>-1.jpg, <slug>-2.jpg ...  (jpg, png, webp or jpeg; up to 8 per project) */
  const exts = ['jpg', 'png', 'webp', 'jpeg'];
  const probe = (slug, i) => new Promise(res => {
    let k = 0;
    const next = () => { if (k >= exts.length) return res(null);
      const u = `images/${slug}-${i}.${exts[k++]}`, im = new Image(); im.onload = () => res(u); im.onerror = next; im.src = u; };
    next();
  });
  $$('[data-thumb]').forEach(async el => {
    const u = await probe(el.dataset.thumb, 1);
    if (u) { const im = new Image(); im.src = u; im.alt = ''; im.loading = 'lazy'; el.prepend(im); el.classList.add('has-img'); }
  });
  const lb = d.createElement('div'); lb.className = 'lightbox'; lb.innerHTML = '<img alt="">'; d.body.append(lb);
  const closeLb = () => { lb.classList.remove('open'); locked = false; };
  lb.addEventListener('click', closeLb); addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
  $$('[data-gallery]').forEach(async sec => {
    const slug = sec.dataset.gallery, title = sec.dataset.title || slug, box = $('.gallery', sec);
    for (let i = 1; i <= 8; i++) {
      const u = await probe(slug, i); if (!u) break;
      const f = d.createElement('figure'), im = new Image();
      im.src = u; im.alt = `${title} — figure ${i}`; im.loading = 'lazy'; f.append(im);
      f.addEventListener('click', () => { $('img', lb).src = u; $('img', lb).alt = im.alt; lb.classList.add('open'); locked = true; });
      box.append(f); sec.hidden = false;
    }
  });

  /* ---------- footer year ---------- */
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();

/* ==========================================================================
   SAM CHADWELL — tennis coaching · San Antonio, Texas
   Page behaviour.
   Progressive enhancement: all content is readable with no JS and no motion.
   ========================================================================== */
(() => {
  'use strict';

  const d = document;
  const root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const motion = !!(G && ST) && !reduce;

  root.classList.add('js');
  if (!motion) root.classList.remove('motion');
  if (G && ST) G.registerPlugin(ST);

  /* ==========================================================================
     Confirmed details. Anything left empty stays hidden; nothing here is
     ever shown as a placeholder.
     ========================================================================== */
  const CONTACT = {
    email: '',       // e.g. 'hello@…' — shown as a mailto link once Sam approves one
    instagram: '',   // full profile URL, once confirmed
    facebook: '',    // full profile URL, once confirmed
  };
  const PROOF = {
    // Real player feedback only, shared with Sam's and the player's permission —
    // no invented names, quotes, ratings or results.
    testimonials: [], // e.g. { quote: '…', name: 'First name or initials', service: 'Private lessons' }
  };

  // small, failure-proof session memory (private windows / blocked storage just skip it)
  const mem = {
    get: (k) => { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- Media slots: fall back to the labelled placeholder ---------- */
  $$('.media img').forEach((img) => {
    const fig = img.closest('.media');
    const fail = () => { fig.classList.add('is-empty'); (img.closest('picture') || img).remove(); };
    img.addEventListener('error', fail, { once: true });
    // images that already failed before this script ran (decode() rejects for a broken image)
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) img.decode().catch(() => { if (!img.naturalWidth) fail(); });
  });

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add((t) => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }
  const scrollToTarget = (target, offset = -20) => {
    if (lenis) return lenis.scrollTo(target, { offset, duration: 1.2 });
    if (typeof target === 'number') return scrollTo({ top: target + offset, behavior: reduce ? 'auto' : 'smooth' });
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  const restartClass = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  /* ---------- Header: court-line indicator, active link, progress ---------- */
  const nav = $('#nav');
  const links = $$('.nav__links a');
  const pill = $('.nav__pill');
  const movePill = (a) => {
    if (!a) { pill.style.opacity = '0'; return; }
    pill.style.width = `${a.offsetWidth - 24}px`;
    pill.style.transform = `translateX(${a.offsetLeft + 12}px)`;
    pill.style.opacity = '1';
  };
  links.forEach((a) => {
    a.addEventListener('pointerenter', () => movePill(a));
    a.addEventListener('focus', () => movePill(a));
  });
  $('.nav__links').addEventListener('pointerleave', () => movePill(null));
  const secIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = `#${en.target.id}`;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => secIO.observe(s));

  /* ---------- Menu ---------- */
  const menu = $('#menu');
  const burger = $('.nav__menu');
  const mcta = $('.mcta');
  $$('.menu__links li').forEach((li, i) => li.style.setProperty('--i', i));
  menu.inert = true;
  const openMenu = () => {
    const br = burger.getBoundingClientRect();
    menu.style.setProperty('--mx', `${br.left + br.width / 2}px`);
    menu.style.setProperty('--my', `${br.top + br.height / 2}px`);
    menu.classList.add('is-open');
    menu.inert = false;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    nav.classList.remove('is-hidden');
    mcta.classList.remove('is-on');
    lenis && lenis.stop();
    setTimeout(() => $('.menu__links a').focus({ preventScroll: true }), 300);
  };
  const closeMenu = (restoreFocus) => {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.inert = true;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    lenis && lenis.start();
    if (restoreFocus) burger.focus();
  };
  burger.addEventListener('click', () => (menu.classList.contains('is-open') ? closeMenu(true) : openMenu()));
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(true); });

  /* ---------- In-page links ----------
     data-pick → opens that path in the coaching-path selector (start / develop / compete / family / adapt)
     data-type → carries an inquiry category into step 2 of the inquiry */
  d.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 && d.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closeMenu(false);
    if (a.dataset.pick) setPick(a.dataset.pick, true);
    const toBook = id === '#ask';
    if (toBook) prepareBooking({ type: a.dataset.type });
    scrollToTarget(toBook ? form : target, toBook ? -110 : -20);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (toBook) setTimeout(() => focusStep(), lenis ? 1250 : 300);
  });

  /* ---------- Cursor (desktop only) ---------- */
  if (fine) {
    root.classList.add('has-cursor');
    const cur = $('.cursor');
    const label = $('.cursor__label');
    const setPos = G
      ? (() => {
          G.set(cur, { x: -100, y: -100 });
          const xTo = G.quickTo(cur, 'x', { duration: reduce ? 0 : 0.2, ease: 'power3' });
          const yTo = G.quickTo(cur, 'y', { duration: reduce ? 0 : 0.2, ease: 'power3' });
          return (x, y) => { xTo(x); yTo(y); };
        })()
      : (x, y) => { cur.style.transform = `translate(${x}px, ${y}px)`; };
    addEventListener('pointermove', (e) => setPos(e.clientX, e.clientY), { passive: true });
    d.addEventListener('pointerover', (e) => {
      const t = e.target;
      if (t.closest('input, textarea, select')) { cur.classList.add('is-hidden'); return; }
      cur.classList.remove('is-hidden');
      const interactive = t.closest('a, button, label');
      const el = t.closest('[data-cursor]');
      // a label shows over labelled areas, and over controls that carry their own label (gallery "View")
      const text = el && (!interactive || interactive === el || interactive.contains(el)) ? el.dataset.cursor : '';
      label.textContent = text;
      cur.classList.toggle('is-label', !!text);
      cur.classList.toggle('is-hover', !text && !!interactive);
    });
    root.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    root.addEventListener('pointerenter', () => cur.classList.remove('is-hidden'));
  }

  if (fine && motion) {
    $$('[data-magnetic]').forEach((el) => {
      const xTo = G.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      const yTo = G.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.15);
        yTo((e.clientY - r.top - r.height / 2) * 0.25);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Split headings into words ---------- */
  const splitWords = (el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(' ')); return; }
            const w = d.createElement('span');
            const inner = d.createElement('span');
            w.className = 'w';
            inner.className = 'w__in';
            inner.style.setProperty('--wi', i++);
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  };
  if (motion) $$('.split').forEach(splitWords);

  /* ==========================================================================
     LOGO — the court line (C) draws, the ball travels the S trajectory once
     and lands on the C's open end, SC resolves and rests. It repeats every
     seven seconds a few times, then stays still for good (hover or focus on
     the logo replays it). Only while the header is visible and the tab is
     in view. Static for reduced motion / no GSAP.
     ========================================================================== */
  const logo = $('.logo');
  const mark = $('.logo__mark', logo);
  if (mark && motion) {
    const mC = $('.mk-c', mark), mS = $('.mk-s', mark), mB = $('.mk-b', mark), route = $('.mk-route', mark);
    const rLen = route.getTotalLength();
    const rest = { x: 37, y: 13.1 };
    const ballAt = (t) => { const p = route.getPointAtLength(t * rLen); G.set(mB, { attr: { cx: p.x, cy: p.y } }); };
    let ltl = null, runs = 0, loop = 0;
    const play = () => {
      if (ltl && ltl.isActive()) return;
      const o = { t: 0 };
      ltl = G.timeline()
        .set([mC, mS], { strokeDashoffset: 1 })
        .set(mB, { attr: { cx: 17.6, cy: 31 }, scale: 0, transformOrigin: '50% 50%' })
        .to(mC, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' })
        .to(mB, { scale: 1, duration: .25, ease: 'back.out(2)' }, '-=.2')
        .to(mS, { strokeDashoffset: 0, duration: 1.1, ease: 'power1.inOut' }, '<')
        .to(o, { t: 1, duration: 1.3, ease: 'power1.inOut', onUpdate: () => ballAt(o.t) }, '<')
        .set(mB, { attr: { cx: rest.x, cy: rest.y } });
    };
    const schedule = () => {
      clearTimeout(loop);
      if (runs >= 4) return;            // a handful of times, then rest
      loop = setTimeout(() => {
        if (!d.hidden && !nav.classList.contains('is-hidden') && !menu.classList.contains('is-open')) { runs++; play(); }
        schedule();
      }, 7000);
    };
    runs = 1;
    G.delayedCall(.4, play);
    schedule();
    logo.addEventListener('pointerenter', play);
    logo.addEventListener('focus', play);
  }

  /* ==========================================================================
     HERO — the tennis court draws in → the kicker → the headline rises line by
     line → the image opens upward → lede, CTAs and the credibility line → the
     dotted court line draws along the ball path and the ball travels it once,
     landing by the image → the card lands and its 38 counts up from 00, once.
     CSS does the drawing; this sequences the classes and moves the ball.
     Desktop: a gentle parallax on the image while the hero scrolls away.
     ========================================================================== */
  const hx = $('.hx');
  const hxBall = $('.hx__ball', hx);
  const hxLine = $('.hx__line', hx);
  const hxShot = $('.hx__shot', hx);
  const shotLen = hxShot.getTotalLength();
  let shotT = 1;
  // the line's SVG is stretched over the hero, so map its 1600 × 900 box onto the hero's real size
  const placeHxBall = (t) => {
    shotT = t;
    const r = hxLine.getBoundingClientRect();
    if (!r.width) return;
    const pt = hxShot.getPointAtLength(clamp(t, 0, 1) * shotLen);
    hxBall.style.transform = `translate(${((pt.x / 1600) * r.width).toFixed(1)}px, ${((pt.y / 900) * r.height).toFixed(1)}px)`;
  };
  const runShot = () => {
    const o = { t: 0 };
    G.to(o, { t: 1, duration: 1.5, ease: 'power1.inOut', onUpdate: () => placeHxBall(o.t) });
  };
  // 00 → 38, once
  const countUp = () => $$('[data-count]', hx).forEach((el) => {
    const o = { n: 0 };
    el.textContent = '00';
    G.to(o, { n: +el.dataset.count, duration: 1.6, ease: 'power2.out', onUpdate: () => { el.textContent = pad(Math.round(o.n)); } });
  });
  const HX_ALL = ['is-court', 'is-kick', 'is-title', 'is-img', 'is-shot', 'is-card'];
  if (motion) {
    const on = (cls) => () => hx.classList.add(cls);
    const show = (el) => () => el.classList.add('in');
    placeHxBall(0);
    $$('[data-count]', hx).forEach((el) => { el.textContent = '00'; });
    G.timeline({ delay: 0.15 })
      .add(on('is-court'), 0)
      .add(on('is-kick'), 0.15)
      .add(on('is-title'), 0.3)
      .add(on('is-img'), 0.55)
      .add(show($('.hx__lede', hx)), 0.95)
      .add(show($('.hx__ctas', hx)), 1.1)
      .add(show($('.hx__creds', hx)), 1.25)
      .add(on('is-shot'), 1.4)
      .add(runShot, 1.5)
      .add(on('is-card'), 2.6)
      .add(countUp, 2.75);
    // gentle parallax on the image (desktop only; phones keep it still)
    G.matchMedia().add('(min-width: 1024px)', () => {
      const scrub = { trigger: hx, start: 'top top', end: 'bottom top', scrub: true };
      G.fromTo($('.hx__img picture', hx), { yPercent: -3 }, { yPercent: 4, ease: 'none', scrollTrigger: scrub });
      G.to($('.hx__card', hx), { y: -36, ease: 'none', scrollTrigger: { ...scrub } });
    });
  } else {
    hx.classList.add(...HX_ALL);
    $$('.hx__in', hx).forEach((el) => el.classList.add('in'));
    placeHxBall(1);
  }
  let hxRz = 0;
  addEventListener('resize', () => { clearTimeout(hxRz); hxRz = setTimeout(() => placeHxBall(shotT), 120); });

  /* ==========================================================================
     Scroll reveals
     ========================================================================== */
  if (motion) {
    const once = (el, fn, start = 'top 86%') => ST.create({ trigger: el, start, once: true, onEnter: fn });
    const notHero = (el) => !el.closest('.hx');
    $$('.split').forEach((el) => once(el, () => el.classList.add('in')));
    $$('.fade').filter(notHero).forEach((el) => once(el, () => el.classList.add('in')));
    $$('.seam').forEach((el) => once(el, () => el.classList.add('in'), 'top 90%'));
    once($('.fcta__title'), () => G.to('.fcta__title .line__in', { y: 0, yPercent: 0, duration: 1.2, stagger: 0.14, ease: 'expo.out' }), 'top 85%');
  }

  /* ==========================================================================
     Coaching philosophy — the court-side flip board. When it comes into
     view each tile shuffles through a few letters and lands on its word, row
     by row. The words are in the HTML, so it reads correctly without JS.
     ========================================================================== */
  const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const runFlaps = () => {
    $$('.sb__flaps').forEach((col, c) => {
      $$('span', col).forEach((tile, i) => {
        const final = tile.textContent;
        let n = 7 + i * 2;
        const tick = () => {
          tile.classList.remove('is-flip'); void tile.offsetWidth; tile.classList.add('is-flip');
          if (--n <= 0) { tile.textContent = final; return; }
          tile.textContent = FLAP[Math.floor(Math.random() * FLAP.length)];
          setTimeout(tick, 75);
        };
        setTimeout(tick, c * 220 + i * 50);
      });
    });
  };
  if (motion && $('.sb')) ST.create({ trigger: '.sb', start: 'top 72%', once: true, onEnter: runFlaps });

  /* Meet Sam — the card tilts toward the pointer, with a soft shine */
  const ccard = $('.ccard');
  if (ccard && fine && motion) {
    G.set(ccard, { transformPerspective: 1000 });
    const rx = G.quickTo(ccard, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = G.quickTo(ccard, 'rotationY', { duration: 0.6, ease: 'power3' });
    ccard.addEventListener('pointermove', (e) => {
      const r = ccard.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 14);
      rx((0.5 - py) * 12);
      ccard.style.setProperty('--sx', `${(px * 100).toFixed(1)}%`);
      ccard.style.setProperty('--sy', `${(py * 100).toFixed(1)}%`);
    });
    ccard.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }

  /* ==========================================================================
     THE 38-YEAR STORY — Player → Competitor → Coach → Mentor → 38 years,
     across a tennis court, baseline to baseline. p runs 0 → 4 through the
     five milestones. renderJr(p) puts the ball on the
     rally arc between milestone floor(p) and the next (a higher arc over the
     net), fills the rail / court to the ball and makes the nearest milestone
     active (photo, copy, stamp). Desktop + motion: the stage pins and scroll
     drives p, dwelling on each milestone. Otherwise milestones, arrows and
     arrow keys tween p to a milestone. Phones lay the court out vertically —
     the same maths works from the dots' real positions.
     ========================================================================== */
  const jr = $('.jr');
  const jrCourt = $('.jr__court', jr);
  const jrMs = $$('.jr__ms', jr);
  const jrDots = jrMs.map((b) => $('.jr__dot', b));
  const jrBall = $('.jr__ball', jr);
  const jrRail = $('.jr__rail', jr);
  const jrMedia = $('.jr__media', jr);
  const jrImgs = $$('.jr__img', jr);
  const jrSteps = $$('.jr__step', jr);
  const jrStamp = $('.jr__stamp-n', jr);
  const jrPrev = $('.jr__prev', jr);
  const jrNext = $('.jr__next', jr);
  const JN = jrMs.length;
  let jrP = 0, jrActive = -1, jrTween = null, jrST = null, pts = [];

  const measure = () => {
    const cr = jrCourt.getBoundingClientRect();
    pts = jrDots.map((dot) => { const r = dot.getBoundingClientRect(); return { x: r.left - cr.left + r.width / 2, y: r.top - cr.top + r.height / 2 }; });
    const A = pts[0], Z = pts[JN - 1];
    const vertical = Math.abs(Z.y - A.y) > Math.abs(Z.x - A.x);
    jr.classList.toggle('is-v', vertical);
    Object.assign(jrRail.style, vertical
      ? { left: `${A.x - 2}px`, top: `${A.y}px`, width: '4px', height: `${Z.y - A.y}px` }
      : { left: `${A.x}px`, top: `${A.y - 2}px`, width: `${Z.x - A.x}px`, height: '4px' });
  };
  const setJrActive = (i) => {
    if (i === jrActive) return;
    const back = i < jrActive;
    jrActive = i;
    jr.dataset.step = i;
    jrMs.forEach((b, k) => {
      b.classList.toggle('is-on', k === i);
      b.classList.toggle('is-past', k < i);
      if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    if (motion) restartClass(jrMs[i], 'is-hit');
    jrMedia.classList.toggle('is-back', back);
    jrImgs.forEach((f) => f.classList.toggle('is-on', +f.dataset.i === i));
    jrSteps.forEach((s) => s.classList.toggle('is-on', +s.dataset.i === i));
    jrStamp.textContent = pad(i + 1);
    jrPrev.disabled = i === 0;
    jrNext.disabled = i === JN - 1;
  };
  const renderJr = (p) => {
    jrP = clamp(p, 0, JN - 1);
    if (!pts.length) measure();
    const i = Math.min(JN - 2, Math.floor(jrP)), t = jrP - i;
    const P = pts[i], Q = pts[i + 1];
    const vertical = jr.classList.contains('is-v');
    const span = vertical ? Math.abs(Q.y - P.y) : Math.abs(Q.x - P.x);
    const lift = Math.sin(Math.PI * t) * Math.min(vertical ? 34 : 84, span * (i === 2 ? 0.55 : 0.4));   // i === 2 crosses the net
    const x = P.x + (Q.x - P.x) * t + (vertical ? lift : 0);
    const y = P.y + (Q.y - P.y) * t - (vertical ? 0 : lift);
    jrBall.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    const A = pts[0], Z = pts[JN - 1];
    const frac = vertical ? (y - A.y) / (Z.y - A.y) : (x - A.x) / (Z.x - A.x);
    jr.style.setProperty('--jp', clamp(frac, 0, 1).toFixed(4));
    setJrActive(Math.round(jrP));
  };
  // scroll progress → p, dwelling on each milestone before the ball moves on
  const scrollToP = (pr) => {
    const s = pr * JN;
    const i = Math.min(JN - 1, Math.floor(s));
    if (i >= JN - 1) return JN - 1;
    const f = clamp((s - i - 0.5) / 0.5, 0, 1);
    return i + f * f * (3 - 2 * f);
  };
  const goJr = (i) => {
    i = clamp(i, 0, JN - 1);
    if (jrST) {
      const y = jrST.start + (jrST.end - jrST.start) * ((i + 0.25) / JN);
      scrollToTarget(y, 0);
      return;
    }
    if (jrTween) jrTween.kill();
    if (!motion) { renderJr(i); return; }
    const o = { p: jrP };
    jrTween = G.to(o, { p: i, duration: 0.45 + Math.abs(i - jrP) * 0.25, ease: 'power2.inOut', onUpdate: () => renderJr(o.p) });
  };
  jrMs.forEach((b, i) => {
    b.addEventListener('click', () => goJr(i));
    b.addEventListener('keydown', (e) => {
      const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: JN - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      const n = clamp(to, 0, JN - 1);
      jrMs[n].focus({ preventScroll: true });
      goJr(n);
    });
  });
  jrPrev.addEventListener('click', () => goJr(jrActive - 1));
  jrNext.addEventListener('click', () => goJr(jrActive + 1));

  // pinned, scroll-driven mode: desktop-sized screens with motion on
  const scrollyMq = matchMedia('(min-width: 1024px) and (min-height: 620px)');
  const setupScrolly = () => {
    const want = motion && scrollyMq.matches;
    if (want === !!jrST) return;
    if (jrST) { jrST.kill(); jrST = null; }
    jr.classList.toggle('is-scrolly', want);
    measure();
    if (want) {
      jrST = ST.create({
        trigger: $('.jr__scroller', jr), start: 'top 88px', end: 'bottom bottom',
        onUpdate: (self) => { if (jrTween) jrTween.kill(); renderJr(scrollToP(self.progress)); },
      });
    }
    ST.refresh();
    renderJr(jrST ? scrollToP(jrST.progress) : Math.round(jrP));
  };
  measure();
  renderJr(0);
  if (motion) {
    setupScrolly();
    scrollyMq.addEventListener('change', setupScrolly);
  }
  let jrRz = 0;
  addEventListener('resize', () => { clearTimeout(jrRz); jrRz = setTimeout(() => { measure(); renderJr(jrP); }, 120); });
  d.fonts && d.fonts.ready.then(() => { measure(); renderJr(jrP); });

  /* ==========================================================================
     COACHING PATHS — five areas Sam can discuss with players (not confirmed
     services): Start, Develop, Compete, Family, Adapt. The section's
     data-pick drives the CSS (court zone, markers, the ball's spot, legend,
     accent); this swaps the image (wiping from the side you moved toward),
     the copy and the CTA, and remembers the choice for step 2 of the
     inquiry. A radio group: arrows move and select.
     ========================================================================== */
  const PICKS = { start: 'Beginner help', develop: 'Skill development', compete: 'Advanced training', family: 'Family / homeschool', adapt: 'Adaptive tennis' };
  const PICK_ORDER = Object.keys(PICKS);
  const ci = $('.ci');
  const ciOpts = $$('.ci__opt', ci);
  const ciCards = $$('.ci__card', ci);
  const ciImgs = $$('.ci__img', ci);
  const ciMedia = $('.ci__media', ci);
  let chosenType = PICKS[mem.get('sc-pick')] || '';  // carried into the inquiry
  function setPick(key, user) {
    if (!PICKS[key]) return;
    if (user) { chosenType = PICKS[key]; mem.set('sc-pick', key); carryType(); }
    if (ci.dataset.pick === key) return;
    const back = PICK_ORDER.indexOf(key) < PICK_ORDER.indexOf(ci.dataset.pick);
    ci.dataset.pick = key;
    ciOpts.forEach((b) => {
      const on = b.dataset.pick === key;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    ciCards.forEach((c) => { const on = c.dataset.pick === key; c.classList.toggle('is-on', on); c.inert = !on; });
    ciMedia.classList.toggle('is-back', back);
    ciImgs.forEach((f) => f.classList.toggle('is-on', f.dataset.pick === key));
    if (motion) restartClass(ci, 'is-swap');
  }
  ciOpts.forEach((b, i) => {
    b.addEventListener('click', () => setPick(b.dataset.pick, true));
    b.addEventListener('keydown', (e) => {
      const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: ciOpts.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      const n = ciOpts[(to + ciOpts.length) % ciOpts.length];
      n.focus();
      setPick(n.dataset.pick, true);
    });
  });
  ciCards.forEach((c) => { c.inert = !c.classList.contains('is-on'); });
  if (mem.get('sc-pick')) setPick(mem.get('sc-pick'), false);

  /* ==========================================================================
     INCLUSIVE TENNIS — one game, many ways to learn it. ARIA tabs (arrows,
     Home / End). Each concept reshapes the same court line: the path's shape
     and the ends tween (GSAP interpolates the numbers inside the d string),
     and the CSS fades in that concept's overlay. When the section first
     comes into view the line starts as a standard baseline, then adapts.
     ========================================================================== */
  const ia = $('.ia');
  if (ia) {
    const tabs = $$('.ia__tab', ia);
    const panelsIa = $$('.ia__panel', ia);
    const fig = $('.ia__fig', ia);
    const iaLine = $('.ia__line', fig);
    const ends = $$('.ia__end', fig);
    const iaBall = $('.ia__ball', fig);
    const capB = $('.ia__cap-b b', fig);
    // [line d, end A, end B, ball]
    const SHAPES = {
      standard:      ['M60 260 C 230 260, 410 260, 580 260', [60, 260], [580, 260], [420, 180]],
      vision:        ['M60 260 C 230 260, 410 260, 580 260', [60, 260], [580, 260], [420, 180]],
      mobility:      ['M60 260 C 230 260, 410 260, 580 260', [60, 260], [580, 260], [520, 230]],
      communication: ['M46 260 C 230 260, 410 260, 594 260', [46, 260], [594, 260], [510, 150]],
      confidence:    ['M200 236 C 280 236, 340 236, 440 236', [200, 236], [440, 236], [440, 236]],
      adaptation:    ['M60 260 C 200 90, 430 360, 580 200', [60, 260], [580, 200], [580, 200]],
    };
    const NAMES = { vision: 'Vision', mobility: 'Mobility', communication: 'Communication', confidence: 'Confidence', adaptation: 'Adaptation' };
    const shape = (state, animate) => {
      const [dd, A, B, ball] = SHAPES[state];
      fig.dataset.state = state;
      if (capB && NAMES[state]) capB.textContent = NAMES[state];
      if (animate && motion) {
        G.to(iaLine, { attr: { d: dd }, duration: .9, ease: 'power3.inOut', overwrite: 'auto' });
        G.to(ends[0], { attr: { cx: A[0], cy: A[1] }, duration: .9, ease: 'power3.inOut', overwrite: 'auto' });
        G.to(ends[1], { attr: { cx: B[0], cy: B[1] }, duration: .9, ease: 'power3.inOut', overwrite: 'auto' });
        G.to(iaBall, { attr: { cx: ball[0], cy: ball[1] }, duration: .9, ease: 'power2.inOut', overwrite: 'auto' });
      } else {
        iaLine.setAttribute('d', dd);
        ends[0].setAttribute('cx', A[0]); ends[0].setAttribute('cy', A[1]);
        ends[1].setAttribute('cx', B[0]); ends[1].setAttribute('cy', B[1]);
        iaBall.setAttribute('cx', ball[0]); iaBall.setAttribute('cy', ball[1]);
      }
    };
    let iaCur = 'vision';
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panelsIa.forEach((p) => { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
      if (focus) tab.focus();
      iaCur = tab.dataset.state;
      shape(iaCur, true);
    };
    panelsIa.forEach((p, i) => { p.hidden = i !== 0; });
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        select(tabs[(to + tabs.length) % tabs.length], true);
      });
    });
    if (motion) {
      // a standard baseline first, then it adapts to the selected idea
      shape('standard', false);
      G.set(iaLine, { strokeDasharray: 700, strokeDashoffset: 700 });
      ST.create({
        trigger: fig, start: 'top 75%', once: true,
        onEnter: () => {
          G.to(iaLine, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', onComplete: () => { G.set(iaLine, { clearProps: 'strokeDasharray,strokeDashoffset' }); shape(iaCur, true); } });
        },
      });
    } else {
      shape(iaCur, false);
    }
  }

  /* ==========================================================================
     LESSON INQUIRY — an inquiry, not a booking.
     1 who the lesson is for → 2 what you're looking for (both inquiry
     categories only, until Sam confirms his services) → 3 contact, then a
     confirmation. The counter and bar — the court line as a progress
     indicator — follow the current step. Beside the form, the note Sam will
     receive writes itself from the answers (each line jumps back to its step
     once reached) and the checklist ticks off the three things he needs.
     A coaching path chosen earlier on the page is pre-filled in step 2.
     Posts to Netlify Forms. Without JS every step shows and the form posts
     normally.
     ========================================================================== */
  const form = $('#askForm');
  const steps = $$('.rq__step', form);
  const done = $('.rq__done', form);
  const live = $('#rqLive');
  const back = $('.rq__back', form);
  const next = $('.rq__next', form);
  const send = $('.rq__send', form);
  const status = $('#rqStatus');
  const curNum = $('.rq__cur', form);
  const nowLabel = $('.rq__now', form);
  const bars = $$('.rq__bar li', form);
  const carry = $('.rq__carry', form);
  const msg = $('.rq__msg');
  const bubbles = $$('button.rq__bubble', msg);
  const checks = $$('.rq__check li', msg);
  const phone = $('#rq-phone');
  const N = steps.length;
  const TITLES = steps.map((s) => $('.rq__h', s).lastChild.textContent.trim());
  const SHORT = ['Who it\'s for', 'Looking for', 'Contact details'];
  let cur = 1, reached = 1, sent = false;

  const setProgress = (n) => {               // n: 1–N, or N + 1 once sent
    bars.forEach((li, i) => {
      const k = i + 1;
      li.classList.toggle('is-done', n > N || k < n || (k <= reached && k !== n && validStep(k)));
      li.classList.toggle('is-now', k === n && n <= N);
    });
    const label = n > N ? 'Sent to Sam' : SHORT[n - 1];
    const num = pad(Math.min(n, N));
    if (curNum.textContent !== num) { curNum.textContent = num; if (motion) restartClass(curNum, 'is-flip'); }
    nowLabel.textContent = label;
    bubbles.forEach((b) => { const k = +b.dataset.step; b.disabled = sent || k > reached; b.classList.toggle('is-now', !sent && k === n); });
  };
  const goStep = (n, focus) => {
    const isBack = n < cur;
    cur = n;
    reached = Math.max(reached, n);
    steps.forEach((s) => { const on = +s.dataset.step === n; s.classList.toggle('is-current', on); s.classList.toggle('is-back', on && isBack); });
    setProgress(n);
    const first = n === 1;
    back.setAttribute('aria-hidden', String(first));
    back.tabIndex = first ? -1 : 0;
    next.hidden = n === N;
    send.hidden = n !== N;
    live.textContent = `Step ${n} of ${N}: ${TITLES[n - 1]}`;
    if (focus) {
      focusStep();
      if (form.getBoundingClientRect().top < 0) scrollToTarget(form, -110);
    }
  };
  function focusStep() {
    if (sent) return;
    const el = $('input:checked', steps[cur - 1]) || $('input:not([type="hidden"]), textarea', steps[cur - 1]);
    if (el) el.focus({ preventScroll: true });
  }

  // validation — phone is optional, but if one is given it should look like a phone number
  const MSG = { name: 'Please enter your name.', email: 'Please enter a valid email address.', phone: 'That doesn’t look like a phone number — check it, or leave it blank.' };
  const phoneOk = () => { const v = phone.value.trim(); return !v || v.replace(/\D/g, '').length >= 7; };
  const validate = (el) => {
    const err = d.getElementById(`${el.id}-err`);
    const ok = el === phone ? phoneOk() : el.checkValidity();
    el.setAttribute('aria-invalid', String(!ok));
    if (err) {
      err.textContent = ok ? '' : MSG[el.name] || 'Please check this field.';
      if (!ok) el.setAttribute('aria-describedby', err.id); else el.removeAttribute('aria-describedby');
    }
    return ok;
  };
  const checkGroup = (g, quiet) => {
    const ok = $$('input', g).some((i) => i.checked);
    if (quiet) return ok;
    $('.rq__err', g).textContent = ok ? '' : g.dataset.groupReq;
    g.classList.toggle('is-invalid', !ok);
    if (!ok && motion) restartClass(g, 'is-shake');
    return ok;
  };
  const fieldsIn = (step) => $$('input[required]:not([type="radio"]), input[type="tel"]', step);
  // returns the first problem field in step n, or null
  const checkStep = (n) => {
    const step = steps[n - 1];
    let bad = null;
    $$('[data-group-req]', step).forEach((g) => { if (!checkGroup(g) && !bad) bad = $('input', g); });
    fieldsIn(step).forEach((el) => { if (!validate(el) && !bad) bad = el; });
    return bad;
  };
  // the same check without touching the UI
  function validStep(n) {
    const step = steps[n - 1];
    return $$('[data-group-req]', step).every((g) => checkGroup(g, true))
      && fieldsIn(step).every((el) => (el === phone ? phoneOk() : el.checkValidity()));
  }
  fieldsIn(form).forEach((el) => {
    el.addEventListener('blur', () => { if (el.value || el.getAttribute('aria-invalid') === 'true') validate(el); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') validate(el); });
  });
  $$('[data-group-req]', form).forEach((g) => g.addEventListener('change', () => { if (g.classList.contains('is-invalid')) checkGroup(g); }));

  next.addEventListener('click', () => {
    const bad = checkStep(cur);
    if (bad) { bad.focus(); return; }
    goStep(cur + 1, true);
  });
  back.addEventListener('click', () => { if (cur > 1) goStep(cur - 1, true); });
  // the note: jump back to any step already reached (forward only through valid steps)
  bubbles.forEach((b) => b.addEventListener('click', () => {
    const n = +b.dataset.step;
    if (sent || n === cur || n > reached) return;
    if (n > cur) { for (let k = cur; k < n; k++) { const bad = checkStep(k); if (bad) { goStep(k, false); bad.focus(); return; } } }
    goStep(n, true);
  }));
  // Enter in a text field moves on instead of submitting early
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input') && cur < N && !sent) { e.preventDefault(); next.click(); }
  });
  // tapping a card in steps 1–2 moves straight on (a short pause shows the selection);
  // keyboard users arrowing through the options (click events with detail 0) stay put
  let focusByUser = false;   // once the visitor picks step 2 themselves, a path chosen above no longer replaces it
  $$('input[name="lesson_for"], input[name="looking_for"]', form).forEach((r) => r.addEventListener('click', (e) => {
    if (r.name === 'looking_for') { carry.hidden = true; focusByUser = true; }
    const n = +r.closest('.rq__step').dataset.step;
    if (cur === n && e.detail > 0) setTimeout(() => { if (cur === n && r.checked) goStep(n + 1, true); }, motion ? 450 : 0);
  }));

  // the note Sam will see, written from the answers
  const LINES = {
    who: { Myself: 'The lessons would be for me.', 'Child / family member': "I'm asking for my child or another family member.", Family: "We're interested as a family.", Other: "I'm asking on someone else's behalf." },
    focus: { 'Beginner help': "We're looking for help getting started.", 'Skill development': "I'd like to develop my game further.", 'Advanced training': "I'm interested in advanced, competitive training.", 'Adaptive tennis': "I'm interested in adaptive tennis.", 'Family / homeschool': "I'm interested in family or homeschool tennis.", 'Not sure': "I'm not sure yet what would suit best." },
  };
  const compose = (data) => {
    const name = String(data.get('name') || '').trim();
    const hasPhone = !!String(data.get('phone') || '').trim();
    return {
      who: LINES.who[data.get('lesson_for')] || '',
      focus: LINES.focus[data.get('looking_for')] || '',
      contact: name ? `Thanks! — ${name}${hasPhone ? ' · phone number included' : ''}` : '',
    };
  };
  const updateSummary = () => {
    const data = new FormData(form);
    const text = compose(data);
    bubbles.forEach((b) => {
      const t = text[b.dataset.k];
      if (b.textContent === t) return;
      b.textContent = t;
      b.hidden = !t;
      if (t && motion) restartClass(b, 'is-new');
    });
    const set = {
      who: !!data.get('lesson_for'),
      focus: !!data.get('looking_for'),
      contact: validStep(N),
    };
    checks.forEach((li) => li.classList.toggle('is-set', set[li.dataset.k]));
    msg.classList.toggle('is-complete', Object.values(set).every(Boolean));
    if (!sent) setProgress(cur);
  };
  form.addEventListener('input', updateSummary);
  form.addEventListener('change', updateSummary);

  // carrying choices in from elsewhere on the page — a suggestion, never overriding an answer already given
  const flash = (el) => { el.classList.remove('is-flash'); setTimeout(() => el.classList.add('is-flash'), lenis ? 900 : 200); };
  const tick = (name, value, force) => {
    if (!value) return false;
    const inputs = $$(`input[name="${name}"]`, form);
    const r = inputs.find((x) => x.value === value);
    if (!r || r.checked) return false;
    if (!force && inputs.some((x) => x.checked)) return false;
    r.checked = true;
    r.dispatchEvent(new Event('change', { bubbles: true }));
    flash(r.closest('label'));
    return true;
  };
  // a coaching path chosen above is pre-selected in step 2; it replaces an earlier answer only if the visitor didn't pick it themselves
  function carryType() {
    if (sent || !chosenType) return;
    if (tick('looking_for', chosenType, !focusByUser)) { carry.hidden = false; updateSummary(); }
  }
  function prepareBooking({ type } = {}) {
    if (sent) resetBooking();
    if (tick('looking_for', type || chosenType, !!type || !focusByUser)) {
      carry.hidden = false;
      if (type) { chosenType = type; focusByUser = false; }
    }
    updateSummary();
    if (cur !== 1) goStep(1, false);
  }

  const resetBooking = () => {
    form.reset();
    sent = false;
    reached = 1;
    focusByUser = false;
    form.classList.remove('is-sent');
    msg.classList.remove('is-sent');
    done.classList.remove('is-current');
    carry.hidden = true;
    $$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'));
    $$('.is-invalid', form).forEach((el) => el.classList.remove('is-invalid'));
    $$('.rq__err, .rq__ferr', form).forEach((el) => { el.textContent = ''; });
    status.textContent = '';
    goStep(1, false);
    updateSummary();
  };
  $('.rq__again', form).addEventListener('click', () => { resetBooking(); goStep(1, true); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.classList.remove('is-error');
    for (let n = 1; n <= N; n++) {
      const bad = checkStep(n);
      if (bad) {
        goStep(n, false);
        bad.focus();
        status.textContent = 'Please fix the highlighted step.';
        status.classList.add('is-error');
        return;
      }
    }
    const data = new FormData(form);
    const first = String(data.get('name') || '').trim().split(/\s+/)[0];
    // On Netlify the form posts to Netlify Forms; opened locally, nothing is sent
    const preview = ['localhost', '127.0.0.1', ''].includes(location.hostname) || location.protocol === 'file:';
    send.disabled = true;
    try {
      if (!preview) {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(data).toString(),
        });
        if (!res.ok) throw new Error(res.statusText);
      }
      sent = true;
      status.textContent = '';
      form.classList.add('is-sent');
      msg.classList.add('is-sent');
      steps.forEach((s) => s.classList.remove('is-current'));
      $('.rq__done-name', done).textContent = first ? `, ${first}` : '';
      $('.rq__done-p', done).textContent = preview
        ? 'Preview mode — nothing was sent. The form sends for real once the site is live on Netlify.'
        : 'Sam will read your message and reply to talk through what’s possible. Nothing is booked or reserved — this is the start of a conversation.';
      done.classList.add('is-current');
      done.focus({ preventScroll: true });
      setProgress(N + 1);
      if (form.getBoundingClientRect().top < 0) scrollToTarget(form, -110);
    } catch (err) {
      status.textContent = 'Something went wrong sending your message. Please try again in a moment.';
      status.classList.add('is-error');
    }
    send.disabled = false;
  });
  goStep(1, false);
  updateSummary();
  carryType();  // a choice remembered from earlier in this visit

  /* ==========================================================================
     Gallery (kept for Sam's own photos — not on the page yet): expanding
     panels. Hover or focus opens a panel; clicking an open panel shows the
     larger view (on touch screens the first tap opens it). Player feedback
     renders from PROOF once real feedback exists. All of this no-ops while
     the gallery markup is absent.
     ========================================================================== */
  const panels = $$('.panel');
  const wide = matchMedia('(min-width: 701px)');
  const openPanel = (p) => panels.forEach((x) => x.classList.toggle('is-active', x === p));
  panels.forEach((p) => {
    const btn = $('.panel__btn', p);
    if (fine) p.addEventListener('pointerenter', () => openPanel(p));
    btn.addEventListener('focus', () => openPanel(p));
  });
  const lb = $('#lightbox');
  if (lb && typeof lb.showModal === 'function') {
    const lbImg = $('img', lb);
    const lbCap = $('.lightbox__cap', lb);
    let opener = null;
    $$('.panel__btn').forEach((btn) => btn.addEventListener('click', () => {
      const p = btn.closest('.panel');
      if (!fine && wide.matches && !p.classList.contains('is-active')) { openPanel(p); return; }
      const img = $('img', btn);
      if (!img) return;              // no photo yet — nothing larger to show
      opener = btn;
      lbImg.src = btn.dataset.full;
      lbImg.alt = img.alt;
      lbCap.replaceChildren(Object.assign(d.createElement('b'), { textContent: btn.dataset.title }), btn.dataset.desc);
      lb.showModal();
      lenis && lenis.stop();
    }));
    $('.lightbox__close', lb).addEventListener('click', () => lb.close());
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', () => { lenis && lenis.start(); opener && opener.focus({ preventScroll: true }); });
  }

  const voices = $('.voices');
  if (voices && PROOF.testimonials.length) {
    const list = $('.voices__list', voices);
    PROOF.testimonials.forEach(({ quote, name, service }) => {
      const li = d.createElement('li');
      li.className = 'voice';
      const q = Object.assign(d.createElement('blockquote'), { textContent: quote });
      const f = d.createElement('footer');
      f.append(name || '');
      if (service) f.append(Object.assign(d.createElement('span'), { textContent: service }));
      li.append(q, f);
      list.append(li);
    });
    voices.hidden = false;
    const fl = $('.nav__links a[href="#feedback"]');
    if (fl) fl.hidden = false;
  }

  /* ==========================================================================
     Footer
     ========================================================================== */
  // confirmed contact / social links (only filled-in CONTACT entries render)
  const socials = $('.fsocials');
  if (socials) {
    const ICON = {
      email: '<path d="M4 6.5h16v11H4z"/><path d="M4 7l8 6 8-6"/>',
      instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><path d="M16.6 7.4h.01"/>',
      facebook: '<path d="M14.5 8H17V4.5h-2.5A3.5 3.5 0 0 0 11 8v2.5H8.5V14H11v6h3.5v-6H17l.5-3.5h-3V8z"/>',
    };
    const LABEL = { email: ['Email', 'Write to Sam'], instagram: ['Instagram', 'Follow Sam'], facebook: ['Facebook', 'Sam on Facebook'] };
    Object.entries(CONTACT).forEach(([k, v]) => {
      if (!v) return;
      const a = Object.assign(d.createElement('a'), { className: 'fsocial', href: k === 'email' ? `mailto:${v}` : v });
      if (k !== 'email') { a.target = '_blank'; a.rel = 'noopener'; }
      a.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg><span></span><b aria-hidden="true">↗</b>`;
      $('span', a).append(LABEL[k][0], Object.assign(d.createElement('small'), { textContent: LABEL[k][1] }));
      if (k !== 'email') a.setAttribute('aria-label', `${LABEL[k][1]} (opens in a new tab)`);
      socials.append(a);
    });
    socials.hidden = !socials.children.length;
  }

  // the ball crosses the giant CHADWELL once — each letter lights as it lands — then rests on the last letter.
  // It runs the first time the word comes on screen, never again.
  const fword = $('.fword');
  if (fword && motion) {
    const letters = $$('span', fword);
    const fball = $('.fword__ball', fword);
    const br = () => fball.offsetWidth / 2;
    const spots = () => {
      const box = fword.getBoundingClientRect();
      return letters.map((l) => { const r = l.getBoundingClientRect(); return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height * 0.04 - br(), el: l }; });
    };
    const put = (x, y) => G.set(fball, { x: x - br(), y: y - br() });
    const land = (el) => {
      letters.forEach((l) => l.classList.toggle('is-lit', l === el));
      setTimeout(() => { el.classList.remove('is-lit'); el.classList.add('is-rest'); }, 380);
      G.fromTo(fball, { scaleX: 1.3, scaleY: 0.72 }, { scaleX: 1, scaleY: 1, duration: 0.4, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
    };
    let done = false;
    const cross = () => {
      if (done) return;
      done = true;
      const pts2 = spots();
      const tl = G.timeline();
      put(pts2[0].x, pts2[0].y - 120);
      G.set(fball, { opacity: 1 });
      tl.to({}, { duration: 0.01 });
      const first = { t: 0 };
      tl.to(first, { t: 1, duration: 0.5, ease: 'power2.in', onUpdate: () => put(pts2[0].x, pts2[0].y - 120 * (1 - first.t)) });
      tl.call(land, [pts2[0].el]);
      pts2.slice(1).forEach((Q, k) => {
        const P = pts2[k];
        const c = { x: (P.x + Q.x) / 2, y: Math.min(P.y, Q.y) - Math.min(90, Math.max(40, Math.abs(Q.x - P.x) * 0.45)) * 2 };
        const s2 = { t: 0 };
        tl.to(s2, { t: 1, duration: 0.42, ease: 'none', onUpdate: () => { const t = s2.t, u = 1 - t; put(u * u * P.x + 2 * u * t * c.x + t * t * Q.x, u * u * P.y + 2 * u * t * c.y + t * t * Q.y); } });
        tl.call(land, [Q.el]);
      });
    };
    ST.create({ trigger: fword, start: 'top 85%', once: true, onEnter: () => (d.fonts ? d.fonts.ready.then(cross) : cross()) });
    // keep a resting ball on the last letter if the layout changes afterwards
    addEventListener('resize', () => { if (!done) return; const p = spots(); const z = p[p.length - 1]; put(z.x, z.y); });
  }

  // the closing band moves with the scroll only — no auto-running marquee
  const fbandTrack = $('.fband__track');
  if (fbandTrack && motion) {
    G.fromTo(fbandTrack, { xPercent: 0 }, { xPercent: -30, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
  }

  // Rolling text on hover
  $$('.nav__links a, .flink').forEach((a) => {
    const t = a.textContent.trim();
    const roll = d.createElement('span');
    const inner = d.createElement('span');
    roll.className = 'roll';
    roll.dataset.text = t;
    inner.textContent = t;
    roll.appendChild(inner);
    a.replaceChildren(roll);
  });

  // Back to top
  const topBtn = $('.ftop');
  if (topBtn) topBtn.addEventListener('click', () => { scrollToTarget($('#top')); $('.logo').focus({ preventScroll: true }); });

  if (motion) {
    ST.sort();
    d.fonts && d.fonts.ready.then(() => { ST.sort(); ST.refresh(); });
    addEventListener('load', () => { ST.refresh(); setTimeout(() => ST.refresh(), 900); measure(); renderJr(jrP); }, { once: true });
  }

  /* ==========================================================================
     Mobile sticky CTA — "Explore lessons" until the coaching paths have been
     on screen, then "Ask about lessons". Hidden over the hero, the inquiry
     and the footer.
     ========================================================================== */
  const mctaT = $('.mcta__t', mcta);
  const seen = { lessons: false };
  const hideOver = new Set();
  const updateMcta = () => {
    const show = !hideOver.size && scrollY > innerHeight * 0.6 && !menu.classList.contains('is-open');
    mcta.classList.toggle('is-on', show);
    mcta.inert = !show;
  };
  const mctaIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const id = en.target.id;
      if (id === 'lessons' && en.isIntersecting && !seen.lessons) {
        seen.lessons = true;
        mcta.setAttribute('href', '#ask');
        mctaT.textContent = 'Ask about lessons';
        restartClass(mcta, 'is-swap');
      }
      if (id !== 'lessons') { if (en.isIntersecting) hideOver.add(id); else hideOver.delete(id); }
    });
    updateMcta();
  }, { threshold: 0.12 });
  ['top', 'lessons', 'ask', 'final'].forEach((id) => mctaIO.observe(d.getElementById(id)));

  /* ==========================================================================
     Header state
     ========================================================================== */
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    const max = root.scrollHeight - innerHeight;
    nav.style.setProperty('--prog', (max > 0 ? y / max : 0).toFixed(4));
    nav.classList.toggle('is-solid', y > 30);
    if (!menu.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > lastY && y > innerHeight * 0.8);
    updateMcta();
    lastY = y;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));
})();

(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toArabic = (n) => n.toLocaleString('ar-SA');

  // Hero entrance
  requestAnimationFrame(() => document.body.classList.add('is-loaded'));

  // Year
  const year = $('#year');
  if (year) year.textContent = toArabic(new Date().getFullYear()).replace(/٬/g, '');

  /* ---------- Header: scrolled state + hide on scroll down ---------- */
  const nav = $('#nav');
  const toggle = $('#navToggle');
  let lastY = window.scrollY;

  /* ---------- Mobile menu ---------- */
  const closeMenu = () => {
    nav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'فتح القائمة');
  };
  toggle.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
  });
  $$('#navLinks a').forEach((a) => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Reveal on scroll (staggered per group) ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const groups = new Map();
    reveals.forEach((el) => {
      const parent = el.parentElement;
      const i = groups.get(parent) || 0;
      el.style.setProperty('--d', `${Math.min(i, 6) * 0.08}s`);
      groups.set(parent, i + 1);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Counters ---------- */
  const counters = $$('[data-count]');
  const runCounter = (el) => {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = toArabic(target); return; }
    const dur = 1600; const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = toArabic(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  } else counters.forEach(runCounter);

  /* ---------- Scroll-linked effects (single rAF loop, only while scrolling) ---------- */
  const heroVideo = $('.hero__video');
  const parallaxEls = $$('.parallax');
  const steps = $$('.step');
  const stepsList = $('#steps');
  const stepsFill = $('#stepsFill');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;

    nav.classList.toggle('is-scrolled', y > 30);
    if (!nav.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > lastY && y > vh * 0.8);
    lastY = y;

    if (!reduceMotion) {
      if (heroVideo && y < vh) heroVideo.style.setProperty('--hero-shift', `${y * 0.18}px`);
      parallaxEls.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.speed || 0.06);
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    }

    if (stepsList) {
      const r = stepsList.getBoundingClientRect();
      const p = Math.min(Math.max((vh * 0.6 - r.top) / r.height, 0), 1);
      stepsFill.style.setProperty('--p', p.toFixed(3));
      steps.forEach((s) => {
        const sr = s.getBoundingClientRect();
        s.classList.toggle('is-active', sr.top < vh * 0.6);
      });
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Pause hero video when off-screen ---------- */
  if (heroVideo) {
    if (reduceMotion) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
    else if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        if (en.isIntersecting) heroVideo.play().catch(() => {});
        else heroVideo.pause();
      }).observe(heroVideo);
    }
  }

  /* ---------- Card spotlight ---------- */
  if (window.matchMedia('(hover: hover)').matches) {
    $$('.svc').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });

    // Magnetic primary CTA
    if (!reduceMotion) {
      $$('.magnetic').forEach((btn) => {
        btn.addEventListener('pointermove', (e) => {
          const r = btn.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) * 0.18;
          const y = (e.clientY - r.top - r.height / 2) * 0.3;
          btn.style.transform = `translate(${x}px, ${y}px)`;
        });
        btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
      });
    }
  }

  /* ---------- Package size switch ---------- */
  const sw = $('.size-switch');
  if (sw) {
    sw.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-size]');
      if (!btn || btn.classList.contains('is-active')) return;
      const size = btn.dataset.size;
      sw.dataset.active = size;
      $$('button', sw).forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
      });
      $$('.plan__price b').forEach((b) => {
        b.classList.add('is-swapping');
        setTimeout(() => { b.textContent = b.dataset[size]; b.classList.remove('is-swapping'); }, 220);
      });
    });
  }

  /* ---------- Plan → preselect service ---------- */
  const serviceSelect = $('#f-service');
  $$('[data-pick]').forEach((a) => a.addEventListener('click', () => {
    serviceSelect.value = a.dataset.pick;
    serviceSelect.closest('.field').classList.remove('has-error');
  }));

  /* ---------- Booking form ---------- */
  const form = $('#bookingForm');
  const status = $('#formStatus');
  const dateInput = $('#f-date');
  const today = new Date();
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dateInput.min = iso(today);

  const setErrors = (errors = {}) => {
    $$('.field', form).forEach((f) => f.classList.remove('has-error'));
    $$('.err', form).forEach((e) => { e.textContent = ''; });
    Object.entries(errors).forEach(([k, msg]) => {
      const slot = $(`[data-err="${k}"]`, form);
      if (slot) { slot.textContent = msg; slot.closest('.field').classList.add('has-error'); }
    });
  };

  const validate = (d) => {
    const errors = {};
    const phone = (d.phone || '').replace(/[\s-]/g, '');
    if (!d.name || d.name.trim().length < 2) errors.name = 'يرجى إدخال الاسم';
    if (!/^(\+?9665|05)\d{8}$/.test(phone)) errors.phone = 'رقم الجوال غير صحيح (مثال: 05XXXXXXXX)';
    if (!d.service) errors.service = 'يرجى اختيار الخدمة';
    if (!d.date) errors.date = 'يرجى اختيار التاريخ';
    if (!d.time) errors.time = 'يرجى اختيار الوقت';
    return errors;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const errors = validate(data);
    setErrors(errors);
    status.className = 'form__status';
    status.textContent = '';
    if (Object.keys(errors).length) {
      const first = $('.has-error input, .has-error select', form);
      if (first) first.focus();
      return;
    }

    form.classList.add('is-loading');
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setErrors(json.errors || {});
        throw new Error('bad');
      }
      form.reset();
      status.classList.add('ok');
      status.textContent = `تم استلام طلبك بنجاح ✓ رقم الحجز ${json.id} — سنتواصل معك قريبًا.`;
    } catch {
      status.classList.add('bad');
      status.textContent = 'تعذّر إرسال الطلب. تأكد من البيانات أو تواصل معنا عبر واتساب.';
    } finally {
      form.classList.remove('is-loading');
    }
  });
})();

/*
 * Emergenetics Landing Page JS — v16
 * - KPI band flat blue (CSS), hero organic swooshes drift (CSS)
 * - Robust KPI animation (hard-coded)
 * - Mobile-safe, conservative behaviors
 */

document.addEventListener('DOMContentLoaded', () => {
  try {
    // Scope
    document.body.classList.add('landing-eg');

    // Remove chat widgets (defensive)
    const nukeChat = () => {
      document.querySelectorAll('#chat-widget, .chat-widget, .tawk-button, .hubspot-chat, .intercom-launcher, [id*="chat"], [class*="chat-bubble"]').forEach(el => {
        try { el.remove(); } catch(e){}
      });
    };
    nukeChat();
    setInterval(nukeChat, 1000);

    // Mobile menu
    const menuBtn = document.querySelector('.eg-menu-btn');
    const mobileMenu = document.getElementById('eg-mobile-menu');
    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener('click', () => {
        const open = menuBtn.getAttribute('aria-expanded') === 'true';
        menuBtn.setAttribute('aria-expanded', String(!open));
        mobileMenu.hidden = open;
      });
      mobileMenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          menuBtn.setAttribute('aria-expanded', 'false');
          mobileMenu.hidden = true;
        });
      });
    }

    // Header progress
    const progressBar = document.querySelector('.eg-progress-bar');
    const updateProgress = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = Math.min(100, Math.max(0, (y / h) * 100));
      if (progressBar) progressBar.style.width = pct + '%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    // Reveal-on-scroll
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

    // Parallax for collage (desktop only)
    const collage = document.querySelector('.eg-hero-collage');
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      if (collage && window.innerWidth > 768) {
        collage.style.transform = `translateY(${Math.min(y * 0.08, 20)}px)`;
      } else if (collage) {
        collage.style.transform = 'translateY(0)';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Calendly popup
    const openBtn = document.getElementById('eg-open-calendly');
    const calendlyPopupUrl = 'https://calendly.com/jessica-smith';
    const ensureCalendly = () => new Promise(resolve => {
      if (window.Calendly) return resolve();
      const s = document.createElement('script');
      s.src = 'https://assets.calendly.com/assets/external/widget.js';
      s.onload = resolve;
      document.body.appendChild(s);
    });
    if (openBtn) {
      openBtn.addEventListener('click', async () => {
        await ensureCalendly();
        Calendly.initPopupWidget({ url: calendlyPopupUrl });
        return false;
      });
    }

    // Canvas background (soft blobs; disabled on small/reduced motion)
    const canvas = document.getElementById('eg-canvas');
    const runCanvas = () => {
      if (!canvas) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const small = window.innerWidth <= 768;
      if (reduce || small) {
        canvas.style.display = 'none';
        return;
      }
      const ctx = canvas.getContext('2d');
      let w, h, dpr, rafId;
      const blobs = [];
      const colors = [
        'rgba(52,68,245,0.12)',
        'rgba(75,95,249,0.10)',
        'rgba(34,197,94,0.10)'
      ];
      function resize(){
        dpr = window.devicePixelRatio || 1;
        w = canvas.clientWidth; h = canvas.clientHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      function rand(a,b){ return a + Math.random()*(b-a); }
      function initBlobs(){
        blobs.length = 0;
        for (let i=0;i<8;i++){
          blobs.push({ x: rand(-0.1*w, 1.1*w), y: rand(0.1*h, 0.9*h), r: rand(80, 180), vx: rand(-0.25, 0.25), vy: rand(-0.2, 0.2), c: colors[i % colors.length] });
        }
      }
      function step(){
        ctx.clearRect(0,0,w,h);
        const g = ctx.createLinearGradient(0,0,w,h);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(1, 'rgba(13,19,43,0.03)');
        ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
        blobs.forEach(b=>{
          b.x += b.vx; b.y += b.vy;
          if (b.x < -200 || b.x > w+200) b.vx *= -1;
          if (b.y < -200 || b.y > h+200) b.vy *= -1;
          const radial = ctx.createRadialGradient(b.x, b.y, 10, b.x, b.y, b.r);
          radial.addColorStop(0, b.c);
          radial.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = radial;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
        });
        rafId = requestAnimationFrame(step);
        window.addEventListener('beforeunload', () => cancelAnimationFrame(rafId));
      }
      const onResize = () => { resize(); initBlobs(); };
      window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) { canvas.style.display='none'; }
        else { canvas.style.display='block'; onResize(); }
      });
      onResize(); step();
    };
    runCanvas();

    // ===== KPI Animation (robust, large) =====
    const kpis = document.querySelectorAll('.eg-kpi');
    const R = 90;                 // matches r in SVG
    const CIRC = 2 * Math.PI * R; // ~565.5

    function animateKPI(el, delayMs = 0) {
      const pct = Math.max(0, Math.min(100, parseFloat(el.getAttribute('data-percent')) || 0));
      const fill = el.querySelector('[data-fill]');
      const num = el.querySelector('[data-count]');
      if (!fill || !num) return;

      // Initialize ring
      fill.style.setProperty('--eg-circ', String(CIRC));
      fill.style.strokeDasharray = String(CIRC);
      fill.style.strokeDashoffset = String(CIRC);
      fill.style.transition = 'none';
      void fill.getBoundingClientRect();

      // Animate after small stagger
      setTimeout(() => {
        requestAnimationFrame(() => {
          const targetOffset = CIRC - (CIRC * pct / 100);
          fill.style.transition = 'stroke-dashoffset 1500ms cubic-bezier(0.65, 0, 0.35, 1)';
          fill.style.strokeDashoffset = String(targetOffset);
        });

        const duration = 1600;
        const start = performance.now();
        const endVal = Math.round(pct);
        function tick(now) {
          const t = Math.min(1, (now - start) / duration);
          const eased = 0.5 * (1 - Math.cos(Math.PI * t)); // easeInOutSine
          num.textContent = String(Math.round(endVal * eased));
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }, delayMs);
    }

    // Trigger via observer + fallback; stagger each card by 120ms
    const grid = document.querySelector('.eg-kpi-grid');
    if (grid) {
      const cards = [...grid.querySelectorAll('.eg-kpi')];
      const sentinel = cards[0];
      const kpiObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            cards.forEach((card, i) => animateKPI(card, i * 120));
            kpiObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.18 });

      if (sentinel) {
        kpiObserver.observe(sentinel);
        // Fallback if already in view on load
        const top = sentinel.getBoundingClientRect().top + window.scrollY;
        if (window.scrollY + window.innerHeight >= top) {
          cards.forEach((card, i) => animateKPI(card, i * 120));
          kpiObserver.disconnect();
        }
      }
    }

  } catch (err) {
    console.error('EG landing script error (v16):', err);
  }
});

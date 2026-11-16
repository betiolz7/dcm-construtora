const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Preloader ----------
document.body.classList.add('is-locked');
let loaded = false;
const finishLoading = () => {
  if (loaded) return;
  loaded = true;
  document.querySelector('.loader')?.classList.add('is-done');
  document.body.classList.remove('is-locked');
  setTimeout(() => document.body.classList.add('is-ready'), 250);
};
window.addEventListener('load', () => setTimeout(finishLoading, reduceMotion ? 0 : 1000));
setTimeout(finishLoading, 3500); // segurança caso alguma imagem demore

document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Header ----------
const header = document.querySelector('.header');
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav');
let lastY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 40);
  header.classList.toggle('is-hidden', y > lastY && y > 500 && !nav.classList.contains('is-open'));
  lastY = y;
}, { passive: true });

burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  nav.classList.toggle('is-open', open);
  document.body.classList.toggle('is-locked', open);
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  if (nav.classList.contains('is-open')) burger.click();
}));

// Link ativo no menu conforme a seção visível
const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    navLinks.forEach(l => l.classList.toggle('is-current', l.getAttribute('href') === `#${e.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach(s => sectionObserver.observe(s));

// ---------- Reveal ao rolar (escalonado entre irmãos) ----------
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => {
  const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
  el.style.setProperty('--d', `${Math.min(siblings.indexOf(el), 5) * 0.09}s`);
  revealObserver.observe(el);
});

// ---------- Contadores ----------
const fmt = new Intl.NumberFormat('pt-BR');
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = +el.dataset.count;
    const write = v => { el.textContent = el.dataset.format === 'br' ? fmt.format(v) : v; };
    if (reduceMotion) { write(target); return; }
    const start = performance.now();
    const dur = 2000;
    const tick = now => {
      const p = Math.min((now - start) / dur, 1);
      write(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

// ---------- Parallax + linha do processo ----------
const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
const steps = [...document.querySelectorAll('.step')];
const stepsWrap = document.querySelector('.steps__wrap');
const stepsLine = document.querySelector('.steps__line i');
let ticking = false;

const onFrame = () => {
  const vh = window.innerHeight;
  parallaxEls.forEach(el => {
    const r = el.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const offset = (r.top + r.height / 2 - vh / 2) * -parseFloat(el.dataset.parallax);
    el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
  });

  if (stepsWrap) {
    const r = stepsWrap.getBoundingClientRect();
    const p = Math.min(Math.max((vh * 0.8 - r.top) / (r.height + vh * 0.2), 0), 1);
    if (stepsLine) stepsLine.style.transform = `scaleX(${p})`;
    steps.forEach((s, i) => s.classList.toggle('is-active', p >= i / steps.length + 0.02));
  }
  ticking = false;
};

if (!reduceMotion) {
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onFrame); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', onFrame);
  onFrame();
} else {
  steps.forEach(s => s.classList.add('is-active'));
}

// ---------- Serviços: preenchimento a partir do cursor ----------
document.querySelectorAll('.service').forEach(card => {
  card.addEventListener('pointerenter', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// ---------- Filtro do portfólio ----------
const filters = document.querySelectorAll('.filter');
const projects = document.querySelectorAll('.project');
filters.forEach(btn => {
  btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.toggle('is-active', b === btn));
    const f = btn.dataset.filter;
    projects.forEach(p => {
      const show = f === 'all' || p.dataset.cat === f;
      p.classList.toggle('is-hidden', !show);
      // destaque só ocupa 2 colunas na visão "Todas"
      if (p.classList.contains('project--feature')) p.style.gridColumn = f === 'all' ? '' : 'auto';
      if (show) {
        p.animate?.([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }],
          { duration: 600, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
    });
  });
});

// ---------- Lightbox ----------
const lightbox = document.querySelector('.lightbox');
const lbImg = lightbox.querySelector('img');
const lbCap = lightbox.querySelector('.lightbox__cap');
const closeLightbox = () => {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-locked');
};
projects.forEach(p => {
  p.addEventListener('click', () => {
    const img = p.querySelector('img');
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = p.querySelector('h3').textContent;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
  });
});
lightbox.addEventListener('click', e => { if (e.target !== lbImg) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ---------- Formulário → WhatsApp ----------
document.getElementById('form').addEventListener('submit', e => {
  e.preventDefault();
  const d = new FormData(e.target);
  const msg = [
    'Olá, vim pelo site da DCM Construtora!',
    `Nome: ${d.get('nome')}`,
    d.get('telefone') && `Telefone: ${d.get('telefone')}`,
    `Tipo de obra: ${d.get('tipo')}`,
    d.get('mensagem') && `Projeto: ${d.get('mensagem')}`,
  ].filter(Boolean).join('\n');
  window.open(`https://wa.me/5516997710226?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
});

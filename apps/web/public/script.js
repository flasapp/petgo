const whatsappNumber = document.body.dataset.whatsappNumber;
const localPreview = window.location.protocol === 'file:'
  || ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
if (localPreview) document.documentElement.classList.add('ui-motion-preview');

document.querySelectorAll('[data-whatsapp]').forEach((button) => {
  button.addEventListener('click', () => {
    window.open(`https://wa.me/${whatsappNumber}`, '_blank', 'noopener,noreferrer');
  });
});

let navScrollFrame = 0;
const cancelNavScroll = (anchor) => {
  if (navScrollFrame) window.cancelAnimationFrame(navScrollFrame);
  navScrollFrame = 0;
  const bypassingRoute = document.documentElement.classList.contains('is-nav-bypassing-route');
  const visualAnchor = anchor instanceof Element
    ? anchor
    : document.elementFromPoint(window.innerWidth / 2, Math.min(80, window.innerHeight / 2));
  const anchorTop = bypassingRoute ? visualAnchor?.getBoundingClientRect().top : 0;
  document.documentElement.classList.remove('is-nav-bypassing-route');
  if (bypassingRoute && visualAnchor) {
    window.scrollTo(0, window.scrollY + visualAnchor.getBoundingClientRect().top - anchorTop);
  }
  document.documentElement.classList.remove('is-nav-scrolling');
};

document.querySelectorAll('.site-header a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    link.closest('.mobile-menu')?.removeAttribute('open');

    const hash = link.getAttribute('href');
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    event.preventDefault();
    cancelNavScroll();
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    window.dispatchEvent(new Event('gopet:navigation-start'));

    const routeFeature = document.querySelector('[data-route-feature]');
    const routeEnd = routeFeature?.getBoundingClientRect().bottom + window.scrollY;
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    if (routeEnd && window.scrollY < routeEnd && targetTop >= routeEnd) {
      document.documentElement.classList.add('is-nav-bypassing-route');
    }

    const start = window.scrollY;
    const destination = Math.min(
      target.getBoundingClientRect().top + start,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const distance = destination - start;
    const duration = Math.min(1100, Math.max(650, Math.abs(distance) * .35));
    const started = performance.now();
    document.documentElement.classList.add('is-nav-scrolling');

    const focusTarget = () => {
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
      target.focus({ preventScroll: true });
    };
    if (Math.abs(distance) < 2) {
      cancelNavScroll(target);
      focusTarget();
      return;
    }

    const step = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = progress * progress * (3 - 2 * progress);
      window.scrollTo(0, start + distance * eased);
      if (progress < 1) {
        navScrollFrame = window.requestAnimationFrame(step);
      } else {
        cancelNavScroll(target);
        focusTarget();
      }
    };
    navScrollFrame = window.requestAnimationFrame(step);
  });
});

window.addEventListener('touchstart', cancelNavScroll, { passive: true });
window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
    cancelNavScroll();
  }
});

const faqReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (localPreview) document.documentElement.classList.add('faq-preview-motion');
document.querySelectorAll('.faq-grid details').forEach((details) => {
  const summary = details.querySelector('summary');
  const answer = details.querySelector('p');
  let animation;

  summary.addEventListener('click', (event) => {
    if (!details.animate) return;
    event.preventDefault();

    const opening = !details.open || details.classList.contains('is-closing');
    const startHeight = details.getBoundingClientRect().height;
    animation?.cancel();
    details.style.height = `${startHeight}px`;
    details.style.overflow = 'hidden';

    if (opening) {
      details.open = true;
      details.classList.add('is-closing');
      answer.getBoundingClientRect();
      details.classList.remove('is-closing');
    } else {
      details.classList.add('is-closing');
    }

    const borderHeight = details.offsetHeight - details.clientHeight;
    const endHeight = opening
      ? details.scrollHeight + borderHeight
      : summary.offsetHeight + borderHeight;

    animation = details.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      {
        duration: faqReducedMotion.matches && !document.documentElement.classList.contains('faq-preview-motion') ? 220 : opening ? 420 : 320,
        easing: opening ? 'cubic-bezier(.16, 1, .3, 1)' : 'ease-in-out'
      }
    );
    animation.onfinish = () => {
      if (!opening) details.open = false;
      details.classList.remove('is-closing');
      details.style.height = '';
      details.style.overflow = '';
      animation = null;
    };
  });
});

const vehicleSection = document.querySelector('.vehicle-section');
if (vehicleSection) {
  vehicleSection.classList.add('is-motion-ready');
  let checkScheduled = false;

  const checkVehicleEntrance = () => {
    checkScheduled = false;
    const bounds = vehicleSection.getBoundingClientRect();
    if (bounds.top > window.innerHeight * .55 || bounds.bottom < window.innerHeight * .2) return;
    window.removeEventListener('scroll', scheduleVehicleCheck);
    window.removeEventListener('resize', scheduleVehicleCheck);
    vehicleSection.classList.add('is-in-view');
  };

  const scheduleVehicleCheck = () => {
    if (checkScheduled) return;
    checkScheduled = true;
    window.requestAnimationFrame(checkVehicleEntrance);
  };

  window.addEventListener('scroll', scheduleVehicleCheck, { passive: true });
  window.addEventListener('resize', scheduleVehicleCheck);
  scheduleVehicleCheck();
}

let sectionMotionObserved = false;
function startSectionMotion() {
  if (sectionMotionObserved || !('IntersectionObserver' in window)) return;
  sectionMotionObserved = true;
  const sectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (entry.target.id === 'coverage-title') {
        entry.target.closest('.coverage-section').classList.add('is-in-view');
      } else {
        entry.target.classList.add('is-in-view');
      }
      sectionObserver.unobserve(entry.target);
    }
  }, { threshold: .25, rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.process .steps li').forEach((step) => {
    step.classList.add('is-motion-ready');
    sectionObserver.observe(step);
  });
  const coverageSection = document.querySelector('.coverage-section');
  if (coverageSection) {
    coverageSection.classList.add('is-motion-ready');
    sectionObserver.observe(coverageSection.querySelector('h2'));
  }
}

if (localPreview || !faqReducedMotion.matches) startSectionMotion();
faqReducedMotion.addEventListener('change', () => {
  if (!faqReducedMotion.matches) startSectionMotion();
});
window.addEventListener('gopet:motion-opt-in', () => {
  document.documentElement.classList.add('ui-motion-preview', 'faq-preview-motion');
  startSectionMotion();
});

const routeStage = document.querySelector('[data-route-stage]');

if (routeStage) {
  const feature = document.querySelector('[data-route-feature]');
  const pin = feature.querySelector('[data-route-pin]');
  const map = routeStage.querySelector('.route-map');
  const road = routeStage.querySelector('[data-route-road]');
  const path = routeStage.querySelector('[data-route-path]');
  const trail = routeStage.querySelector('[data-route-trail]');
  const vehicle = routeStage.querySelector('[data-route-vehicle]');
  const startMarker = routeStage.querySelector('[data-route-start]');
  const endMarker = routeStage.querySelector('[data-route-end]');
  const midpoint = routeStage.querySelector('[data-route-midpoint]');
  const replay = feature.querySelector('[data-route-replay]');
  const status = feature.querySelector('[data-route-status]');
  const bubble = routeStage.querySelector('[data-route-bubble]');
  const compact = window.matchMedia('(max-width: 540px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const paths = {
    wide: 'M165 310C280 265 330 255 430 262S610 290 685 245 775 190 835 160',
    compact: 'M200 515C275 465 340 430 410 440S550 455 610 400 705 320 790 290',
  };

  let length = 0;
  let scrollStart = 0;
  let scrollEnd = 1;
  let frame = 0;
  let routeActive = false;
  let lastState = '';
  let furthestProgress = 0;
  let lastBubble = '';
  let statusStep = 'start';
  let statusAnimationId = 0;
  let statusAnimations = [];
  const stepDescriptions = {
    start: 'Contanos desde dónde salen tus mascotas.',
    middle: 'La cantidad no cambia el precio. Saber cuántos viajan nos ayuda a preparar el traslado.',
    end: 'Con el destino podemos calcular la distancia y el tiempo del viaje.',
  };

  function setStatus(step) {
    if (step === statusStep) return;
    statusStep = step;
    const animationId = ++statusAnimationId;
    statusAnimations.forEach((animation) => animation.cancel());
    statusAnimations = [];

    const previous = status.lastElementChild;
    const next = document.createElement('span');
    next.textContent = stepDescriptions[step];

    if (reducedMotion.matches) {
      status.replaceChildren(next);
      return;
    }

    status.replaceChildren(previous);
    previous.setAttribute('aria-hidden', 'true');
    status.append(next);

    const fadeOut = previous.animate(
      [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-7px)' }],
      { duration: 320, easing: 'ease-in', fill: 'forwards' },
    );
    const fadeIn = next.animate(
      [{ opacity: 0, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 460, delay: 340, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' },
    );
    statusAnimations = [fadeOut, fadeIn];
    Promise.allSettled(statusAnimations.map((animation) => animation.finished)).then(() => {
      if (animationId !== statusAnimationId) return;
      status.replaceChildren(next);
      statusAnimations = [];
    });
  }

  function paintBubble(progress, point, scale) {
    const phase = progress <= 0.17 ? 'start'
      : progress >= 0.42 && progress <= 0.58 ? 'middle'
      : progress >= 0.88 ? 'end' : '';
    bubble.hidden = !phase;
    if (!phase) return;

    if (phase !== lastBubble) {
      bubble.textContent = {
        start: '¿Desde dónde salen?',
        middle: '¿Cuántos viajan?',
        end: '¿A dónde van?',
      }[phase];
      bubble.classList.toggle('is-arrival', phase === 'end');
      lastBubble = phase;
    }

    const stageWidth = routeStage.clientWidth;
    const ratio = stageWidth / 1000;
    const rawX = point.x * ratio;
    const bubbleWidth = bubble.offsetWidth;
    const x = Math.max(bubbleWidth / 2 + 12, Math.min(stageWidth - bubbleWidth / 2 - 12, rawX));
    const y = (point.y + (phase === 'end' ? 18 : -(132 * scale + 16))) * ratio;
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    bubble.style.setProperty('--route-bubble-tail', `${rawX - x}px`);
  }

  function paint(progress) {
    const distance = length * progress;
    const point = path.getPointAtLength(distance);
    const behind = path.getPointAtLength(Math.max(0, distance - 6));
    const ahead = path.getPointAtLength(Math.min(length, distance + 6));
    const slope = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI;
    const angle = Math.max(-24, Math.min(24, slope));
    const scale = compact.matches ? 1.3 : 0.69;

    vehicle.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle}) scale(${scale})`);
    trail.setAttribute('stroke-dasharray', `${distance} ${length}`);
    trail.style.opacity = progress > 0 ? '1' : '0';
    routeStage.dataset.routeProgress = progress.toFixed(3);
    paintBubble(progress, point, scale);
  }

  function setState(state, progress) {
    const step = progress >= 0.88 ? 'end' : progress >= 0.42 ? 'middle' : 'start';
    const stateKey = `${state}:${step}`;
    if (stateKey === lastState) return;
    lastState = stateKey;
    routeStage.classList.toggle('is-complete', state === 'complete');
    routeStage.classList.toggle('is-playing', state === 'travelling');
    replay.hidden = state !== 'complete';

    setStatus(step);

    if (state === 'complete') replay.textContent = 'Repetir recorrido';
  }

  function update() {
    frame = 0;
    if (document.documentElement.classList.contains('is-nav-scrolling')) return;
    if (window.scrollY >= scrollStart && window.scrollY <= scrollEnd) routeActive = true;
    if (window.scrollY > scrollEnd && !routeActive) {
      paint(furthestProgress);
      setState(furthestProgress >= 0.999 ? 'complete' : furthestProgress > 0 ? 'travelling' : 'ready', furthestProgress);
      return;
    }
    if (window.scrollY < scrollStart) routeActive = false;

    const scrollProgress = Math.max(0, Math.min(1, (window.scrollY - scrollStart) / (scrollEnd - scrollStart)));
    furthestProgress = Math.max(furthestProgress, scrollProgress);
    paint(furthestProgress);
    setState(furthestProgress >= 0.999 ? 'complete' : furthestProgress > 0 ? 'travelling' : 'ready', furthestProgress);
    if (window.scrollY > scrollEnd) routeActive = false;
  }

  function scheduleUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  function measure() {
    feature.style.setProperty('--route-pin-height', `${pin.offsetHeight}px`);
    const top = feature.getBoundingClientRect().top + window.scrollY;
    const sectionTop = feature.closest('#viajes').getBoundingClientRect().top + window.scrollY;
    const stickyTop = parseFloat(getComputedStyle(pin).top) || 0;
    scrollStart = Math.max(top - stickyTop, sectionTop);
    const pinRelease = top + feature.offsetHeight - pin.offsetHeight - stickyTop;
    const beforeNextContent = top + feature.offsetHeight - window.innerHeight - 48;
    scrollEnd = Math.max(scrollStart + 1, Math.min(pinRelease, beforeNextContent));
    scheduleUpdate();
  }

  function setGeometry() {
    const mobile = compact.matches;
    const shape = mobile ? paths.compact : paths.wide;
    map.setAttribute('viewBox', mobile ? '0 0 1000 700' : '0 0 1000 460');
    road.setAttribute('d', shape);
    path.setAttribute('d', shape);
    trail.setAttribute('d', shape);
    length = path.getTotalLength();

    const start = path.getPointAtLength(0);
    const end = path.getPointAtLength(length);
    const middle = path.getPointAtLength(length / 2);
    const markerScale = mobile ? 1.65 : 1;
    startMarker.setAttribute('transform', `translate(${start.x} ${start.y}) scale(${markerScale})`);
    endMarker.setAttribute('transform', `translate(${end.x} ${end.y}) scale(${markerScale})`);
    midpoint.setAttribute('transform', `translate(${middle.x} ${middle.y}) scale(${mobile ? 1.35 : 1})`);
    measure();
  }

  replay.addEventListener('click', () => {
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, scrollStart);
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
    furthestProgress = 0;
    lastState = '';
    update();
  });

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('gopet:navigation-start', () => { routeActive = false; });
  window.addEventListener('gopet:navigation-end', scheduleUpdate);
  window.addEventListener('resize', measure);
  compact.addEventListener('change', setGeometry);

  feature.classList.add('is-scroll-ready');
  setGeometry();
}

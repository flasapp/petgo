const tripDialog = document.querySelector('#trip-dialog');

if (tripDialog) {
  const dialogTitle = tripDialog.querySelector('#trip-dialog-title');
  const dialogIntro = tripDialog.querySelector('.trip-dialog-head small');
  const form = tripDialog.querySelector('#trip-form');
  const origin = form.querySelector('#trip-origin');
  const destination = form.querySelector('#trip-destination');
  const departure = form.querySelector('#trip-departure');
  const roundTripChoices = [...form.querySelectorAll('input[name="roundTrip"]')];
  const roundTripError = form.querySelector('[data-roundtrip-error]');
  const waitField = form.querySelector('[data-wait-field]');
  const waitInput = form.querySelector('#trip-wait');
  const returnChoice = form.querySelector('[data-return-choice]');
  const returnOther = form.querySelector('#trip-return-other');
  const returnField = form.querySelector('[data-return-field]');
  const returnInput = form.querySelector('#trip-return');
  const result = tripDialog.querySelector('[data-trip-result]');
  const resultTitle = tripDialog.querySelector('[data-trip-result-title]');
  const messagePreview = tripDialog.querySelector('[data-trip-message]');
  const summary = tripDialog.querySelector('[data-trip-summary]');
  const copyStatus = tripDialog.querySelector('[data-copy-status]');
  const copyButton = tripDialog.querySelector('[data-trip-copy]');
  const whatsappLink = tripDialog.querySelector('[data-trip-whatsapp]');
  const fuelResult = tripDialog.querySelector('[data-fuel-result]');
  const routeMap = tripDialog.querySelector('[data-route-map]');
  const routeMapFrame = routeMap.querySelector('[data-route-map-frame]');
  const routeMapNote = routeMap.querySelector('[data-route-map-note]');
  const humanCheck = form.querySelector('[data-human-check]');
  const humanStatus = form.querySelector('[data-human-status]');
  const turnstileContainer = form.querySelector('[data-turnstile-widget]');
  const checkIsHuman = document.body.dataset.checkIsHuman !== 'false';
  const turnstileSiteKey = document.body.dataset.turnstileSiteKey;
  const enableMap = document.body.dataset.enableMap === 'true';
  const enableMessage = document.body.dataset.enableMessage === 'true';
  const isUnprocessedPreview = document.body.dataset.checkIsHuman === '__CHECK_IS_HUMAN__'
    || turnstileSiteKey === '__TURNSTILE_SITE_KEY__';
  humanCheck.hidden = !checkIsHuman;
  messagePreview.hidden = !enableMessage;
  let turnstileWidgetId;
  let humanVerifiedUntil = 0;
  const whatsappNumber = document.body.dataset.whatsappNumber;
  const includedWaitMinutes = 60;
  const dateFormatter = new Intl.DateTimeFormat('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const departurePicker = flatpickr(departure, {
    locale: flatpickr.l10ns.es,
    dateFormat: 'd/m/Y H:i',
    enableTime: true,
    time_24hr: true,
    disableMobile: true,
    static: true,
    position: 'above',
    closeOnSelect: false,
    monthSelectorType: 'static',
    minuteIncrement: 1,
    minDate: currentMinute(),
    onOpen: (_selectedDates, _dateString, instance) => instance.set('minDate', currentMinute()),
    onChange: (selectedDates) => {
      if (selectedDates.length) showInputError(departure, false);
    },
  });
  let opener = null;
  let dialogMotion = null;
  let dialogClosing = false;
  const moneyFormatter = new Intl.NumberFormat('es-UY', { maximumFractionDigits: 0 });
  let estimateController = null;
  let activeLoader = null;
  const cancelPlaceSearches = [];

  function needsHumanCheck() {
    return checkIsHuman && Date.now() >= humanVerifiedUntil;
  }

  function requireHumanCheck(message = 'Completá la verificación para buscar direcciones.') {
    if (!checkIsHuman) return;
    humanVerifiedUntil = 0;
    humanStatus.textContent = message;
    if (turnstileWidgetId !== undefined) window.turnstile.reset(turnstileWidgetId);
  }

  function renderHumanCheck() {
    if (!checkIsHuman) return;
    if (isUnprocessedPreview) {
      humanStatus.textContent = 'Esta vista no carga las claves. Iniciá npm run dev y abrí http://127.0.0.1:5173.';
      return;
    }
    if (!turnstileSiteKey) {
      humanStatus.textContent = 'La verificación aún no está configurada. Podés consultar por WhatsApp.';
      return;
    }
    if (!window.turnstile || turnstileWidgetId !== undefined) return;
    turnstileWidgetId = window.turnstile.render(turnstileContainer, {
      sitekey: turnstileSiteKey,
      theme: 'light',
      size: 'flexible',
      callback: async (token) => {
        humanStatus.textContent = 'Verificando…';
        try {
          const response = await fetch('/api/verify-human', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.error);
          humanVerifiedUntil = Date.now() + 10 * 60 * 1000;
          humanStatus.textContent = 'Listo. Ya podés buscar direcciones y cotizar.';
          const pendingInput = [...form.querySelectorAll('[data-place-input]')]
            .find((input) => input.value.trim().length >= 3 && !input.dataset.placeId);
          pendingInput?.dispatchEvent(new Event('input'));
        } catch (error) {
          requireHumanCheck(error.message || 'No se pudo verificar. Intentá de nuevo.');
        }
      },
      'expired-callback': () => {
        if (needsHumanCheck()) requireHumanCheck('La verificación venció. Intentá de nuevo.');
      },
      'error-callback': (code) => {
        const reason = code === '110200'
          ? `Agregá ${window.location.hostname} a Hostname Management en Cloudflare (sin http ni puerto).`
          : ['110100', '110110', '400020'].includes(code)
            ? 'Revisá la clave pública de Turnstile en la configuración.'
          : code === '200500'
            ? 'El navegador o la red bloqueó el iframe de Cloudflare.'
            : 'Recargá la página y probá de nuevo.';
        humanStatus.textContent = `No se pudo completar la verificación (código ${code || 'desconocido'}). ${reason} También podés consultar por WhatsApp.`;
      },
    });
  }
  if (checkIsHuman && !isUnprocessedPreview && turnstileSiteKey) {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.addEventListener('load', () => {
      if (tripDialog.open) renderHumanCheck();
    });
    script.addEventListener('error', () => {
      humanStatus.textContent = 'No se pudo cargar la verificación. Recargá la página o consultá por WhatsApp.';
    });
    document.head.append(script);
  }

  form.querySelectorAll('[data-place-input]').forEach((input) => {
    const suggestions = input.nextElementSibling;
    let timer;
    let controller;
    let sequence = 0;
    const cancelSearch = () => {
      clearTimeout(timer);
      controller?.abort();
      controller = null;
      sequence += 1;
      suggestions.hidden = true;
      suggestions.replaceChildren();
    };
    cancelPlaceSearches.push(cancelSearch);
    input.addEventListener('input', () => {
      delete input.dataset.placeId;
      cancelSearch();
      const query = input.value.trim();
      const current = sequence;
      if ((query.match(/\p{L}/gu)?.length ?? 0) < 3) return;
      if (needsHumanCheck()) {
        humanStatus.textContent = 'Completá la verificación para buscar direcciones.';
        return;
      }
      timer = setTimeout(async () => {
        const requestController = new AbortController();
        controller = requestController;
        try {
          const response = await fetch(`/api/places?q=${encodeURIComponent(query)}`, { signal: requestController.signal });
          if (response.status === 403 || response.status === 429) {
            const problem = await response.json();
            requireHumanCheck(problem.error);
            return;
          }
          if (!response.ok) return;
          const { suggestions: matches } = await response.json();
          if (current !== sequence || !matches.length) return;
          for (const match of matches) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = match.label;
            button.addEventListener('click', () => {
              cancelSearch();
              input.value = match.label;
              input.dataset.placeId = match.id;
              showInputError(input, false);
              input.focus();
            });
            suggestions.append(button);
          }
          const attribution = document.createElement('img');
          attribution.src = 'https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png';
          attribution.alt = 'Con tecnología de Google';
          attribution.className = 'trip-google-attribution';
          suggestions.append(attribution);
          suggestions.hidden = false;
        } catch { /* La consulta manual sigue disponible. */ } finally {
          if (controller === requestController) controller = null;
        }
      }, 700);
    });
  });

  function stopEstimate() {
    estimateController?.abort();
    estimateController = null;
    activeLoader?.disconnect();
    activeLoader = null;
  }

  function setQuoteActionsPending(pending) {
    copyButton.hidden = pending || !enableMessage;
    whatsappLink.hidden = pending || Boolean(fuelResult.querySelector('[data-trip-whatsapp-primary]'));
  }

  function setResultHeading(showingResult) {
    dialogTitle.textContent = showingResult ? 'Tu cotización' : 'Contanos el viaje';
    dialogIntro.hidden = showingResult;
  }

  function showLoader() {
    const loader = document.createElement('div');
    loader.className = 'trip-loader';
    loader.innerHTML = `
      <div class="trip-loader-heading">
        <strong>Estamos trazando tu recorrido</strong>
        <span>PetWay en camino</span>
      </div>
      <div class="trip-loader-scene" aria-hidden="true">
        <span class="trip-loader-sun"></span>
        <span class="trip-loader-pin trip-loader-pin-start"></span>
        <span class="trip-loader-pin trip-loader-pin-end"></span>
        <span class="trip-loader-road"><span class="trip-loader-trail" data-loader-trail></span></span>
        <span class="trip-loader-vehicle" data-loader-vehicle>
          <img class="trip-loader-dog" src="assets/perro-sonriente-recorte.png" alt="">
          <img class="trip-loader-truck" src="assets/camioneta-base.png" alt="">
        </span>
      </div>
      <p class="trip-loader-message" data-loader-message>Iniciando el cálculo…</p>
    `;
    fuelResult.replaceChildren(loader);
    const scene = loader.querySelector('.trip-loader-scene');
    const vehicle = loader.querySelector('[data-loader-vehicle]');
    const trail = loader.querySelector('[data-loader-trail]');
    const message = loader.querySelector('[data-loader-message]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let reportedPercent = 0;
    let visiblePercent = 0;
    let finishing = false;
    const startedAt = performance.now();
    let lastFrameTime = startedAt;
    let frameId = null;
    let finishResolve = null;
    let finishSignal = null;
    const positionVehicle = () => {
      const travel = Math.max(0, scene.clientWidth - vehicle.offsetWidth - 32);
      vehicle.style.transform = `translateX(${travel * visiblePercent / 100}px)`;
      trail.style.transform = `scaleX(${visiblePercent / 100})`;
    };
    const completeFinish = () => {
      if (!finishResolve) return;
      finishSignal?.removeEventListener('abort', completeFinish);
      const resolve = finishResolve;
      finishResolve = null;
      finishSignal = null;
      resolve();
    };
    const animate = (time) => {
      const elapsed = time - startedAt;
      // Avanza mientras la solicitud está en curso, incluso entre eventos del servidor.
      const automaticPercent = 95 * (1 - Math.exp(-elapsed / 12000));
      const targetPercent = finishing ? 100 : Math.max(reportedPercent, automaticPercent);
      // Limitar cada cuadro evita saltos tras volver a una pestaña en segundo plano.
      const frameDuration = Math.min(32, Math.max(0, time - lastFrameTime));
      visiblePercent = Math.min(targetPercent, visiblePercent + frameDuration / (reducedMotion ? 40 : 20));
      lastFrameTime = time;
      positionVehicle();
      if (finishing && elapsed >= 2000 && visiblePercent >= 100) {
        frameId = null;
        completeFinish();
        return;
      }
      frameId = requestAnimationFrame(animate);
    };
    const resizeObserver = new ResizeObserver(positionVehicle);
    resizeObserver.observe(scene);
    positionVehicle();
    frameId = requestAnimationFrame(animate);
    return {
      update(event) {
        const percent = Number(event.percent) || 0;
        reportedPercent = Math.max(reportedPercent, Math.min(95, percent));
        message.textContent = percent < 25 ? 'Ubicando origen y destino…'
          : percent < 75 ? 'Calculando el recorrido…' : 'Preparando tu cotización…';
      },
      finish(signal) {
        if (signal.aborted) return Promise.resolve();
        return new Promise((resolve) => {
          finishResolve = resolve;
          finishSignal = signal;
          signal.addEventListener('abort', completeFinish, { once: true });
          finishing = true;
          message.textContent = 'Llegando al destino…';
        });
      },
      disconnect() {
        if (frameId !== null) cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
        completeFinish();
      },
    };
  }

  async function readEstimateStream(response, update) {
    if (!response.ok) {
      const problem = await response.json().catch(() => ({}));
      throw new Error(problem.error || 'No se pudo verificar el recorrido.');
    }
    if (!response.body) throw new Error('No se pudo recibir el avance del cálculo.');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result;
    const processLine = (line) => {
      if (!line.trim()) return;
      const event = JSON.parse(line);
      if (event.type === 'progress') update(event);
      else if (event.type === 'result') result = event.result;
      else if (event.type === 'error') throw new Error(event.error || 'No se pudo calcular la ruta.');
    };
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      lines.forEach(processLine);
      if (done) break;
    }
    processLine(buffer);
    if (!result) throw new Error('No llegó el resultado del cálculo.');
    return result;
  }

  function showFuel(data, travelDate) {
    fuelResult.replaceChildren();
    const quote = document.createElement('div');
    quote.className = 'trip-quote';
    const price = document.createElement('section');
    price.className = 'trip-quote-price';
    const priceTitle = document.createElement('h4');
    priceTitle.textContent = data.sale ? 'Precio estimado del viaje' : 'Precio del viaje';
    const priceValue = document.createElement('strong');
    priceValue.textContent = data.sale ? `$${moneyFormatter.format(data.sale.priceUYU)} UYU` : 'A confirmar';
    const priceQuestion = document.createElement('p');
    priceQuestion.textContent = data.sale
      ? '¿Te sirve este precio aproximado?'
      : '¿Querés saber cuánto cuesta este viaje?';
    const priceWhatsapp = document.createElement('a');
    priceWhatsapp.className = 'button trip-quote-whatsapp';
    priceWhatsapp.textContent = 'Escribinos por WhatsApp';
    priceWhatsapp.href = whatsappLink.href;
    priceWhatsapp.target = '_blank';
    priceWhatsapp.rel = 'noopener noreferrer';
    priceWhatsapp.dataset.tripWhatsappPrimary = '';
    price.append(priceTitle, priceValue, priceQuestion, priceWhatsapp);
    quote.append(price);

    const route = document.createElement('section');
    route.className = 'trip-quote-route';
    const routeTitle = document.createElement('h4');
    routeTitle.textContent = 'Tu trayecto';
    route.append(routeTitle);
    if (!enableMessage) {
      const travelDateLine = document.createElement('small');
      travelDateLine.className = 'trip-quote-departure';
      travelDateLine.textContent = `Salida: ${formatDate(travelDate)} a las ${flatpickr.formatDate(travelDate, 'H:i')}`;
      route.append(travelDateLine);
    }
    const stops = document.createElement('ol');
    stops.className = 'trip-quote-stops';
    const customerStops = [origin.value.trim(), destination.value.trim()];
    if (data.roundTrip) customerStops.push(returnOther.checked ? returnInput.value.trim() : origin.value.trim());
    for (const [index, address] of customerStops.entries()) {
      const stop = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = index === 0 ? 'Origen' : index === 1 ? 'Destino' : 'Final de la vuelta';
      const place = document.createElement('strong');
      place.textContent = address;
      stop.append(label, place);
      stops.append(stop);
    }
    route.append(stops);
    quote.append(route);

    const includes = document.createElement('section');
    includes.className = 'trip-quote-includes';
    const includesTitle = document.createElement('h4');
    includesTitle.textContent = 'Este viaje incluye';
    const includedList = document.createElement('ul');
    const items = [data.roundTrip ? 'Ida y vuelta' : 'Traslado de ida', 'Hasta 2 perros y 2 gatos'];
    const extraWaitMinutes = Math.max(0, data.wait.requestedMinutes - includedWaitMinutes);
    if (data.roundTrip) items.push(`60 minutos de espera${extraWaitMinutes ? ` y ${extraWaitMinutes} minutos adicionales` : ''}`);
    for (const item of items) {
      const line = document.createElement('li');
      line.textContent = item;
      includedList.append(line);
    }
    includes.append(includesTitle, includedList);
    quote.append(includes);
    fuelResult.append(quote);
    showRouteMap(data);
  }

  function showRouteMap(data) {
    if (!enableMap || !data.mapUrl) return;
    routeMapFrame.src = data.mapUrl;
    routeMapNote.textContent = data.roundTrip
      ? 'El mapa muestra la ida. La vuelta también está contemplada en la cotización.'
      : 'El mapa muestra el traslado entre las direcciones indicadas.';
    routeMap.hidden = false;
  }

  function formatDate(date) {
    const text = dateFormatter.format(date);
    return text[0].toUpperCase() + text.slice(1);
  }

  function currentMinute() {
    const date = new Date();
    date.setSeconds(0, 0);
    return date;
  }

  function showInputError(input, invalid) {
    const message = form.querySelector(`#${input.id}-error`);
    message.hidden = !invalid;
    if (invalid) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function resetForm() {
    stopEstimate();
    cancelPlaceSearches.forEach((cancel) => cancel());
    form.reset();
    departurePicker.clear();
    departurePicker.set('minDate', currentMinute());
    departurePicker.close();
    roundTripError.hidden = true;
    roundTripChoices.forEach((choice) => choice.removeAttribute('aria-invalid'));
    [origin, destination, departure, waitInput, returnInput].forEach((input) => showInputError(input, false));
    form.querySelectorAll('[data-place-input]').forEach((input) => {
      delete input.dataset.placeId;
      input.nextElementSibling.hidden = true;
      input.nextElementSibling.replaceChildren();
    });
    waitField.hidden = true;
    waitInput.required = false;
    returnChoice.hidden = true;
    returnField.hidden = true;
    returnOther.checked = false;
    returnInput.required = false;
    form.hidden = false;
    result.hidden = true;
    setResultHeading(false);
    copyStatus.textContent = '';
    fuelResult.replaceChildren();
    setQuoteActionsPending(false);
    routeMap.hidden = true;
    routeMapFrame.removeAttribute('src');
    if (needsHumanCheck()) requireHumanCheck();
  }

  function buttonToDialogTransform() {
    const buttonRect = opener?.getBoundingClientRect();
    const dialogRect = tripDialog.getBoundingClientRect();
    if (!buttonRect?.width || !dialogRect.width) return 'scale(.9)';
    const x = buttonRect.left + buttonRect.width / 2 - dialogRect.left - dialogRect.width / 2;
    const y = buttonRect.top + buttonRect.height / 2 - dialogRect.top - dialogRect.height / 2;
    const scale = Math.max(.24, Math.min(.55, buttonRect.width / dialogRect.width));
    return `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }

  function prefersReducedDialogMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function animateDialog(keyframes, duration, easing) {
    if (!tripDialog.animate) return Promise.resolve();
    tripDialog.style.willChange = 'transform, opacity';
    const motion = tripDialog.animate(keyframes, { duration, easing, fill: 'both' });
    dialogMotion = motion;
    return motion.finished.catch(() => {}).finally(() => {
      if (dialogMotion === motion) {
        motion.cancel();
        dialogMotion = null;
        tripDialog.style.willChange = '';
      }
    });
  }

  function closeTripDialog() {
    if (!tripDialog.open || dialogClosing) return;
    dialogClosing = true;
    const reducedMotion = prefersReducedDialogMotion();
    const currentTransform = getComputedStyle(tripDialog).transform;
    const currentOpacity = getComputedStyle(tripDialog).opacity;
    dialogMotion?.cancel();
    tripDialog.classList.add('is-closing');
    const keyframes = reducedMotion
      ? [{ opacity: currentOpacity }, { opacity: 0 }]
      : [
        { transform: currentTransform, opacity: currentOpacity },
        { transform: buttonToDialogTransform(), opacity: 0 },
      ];
    animateDialog(keyframes, reducedMotion ? 130 : 230, 'cubic-bezier(.4, 0, 1, 1)')
      .then(() => { if (tripDialog.open) tripDialog.close(); });
  }

  document.querySelectorAll('[data-trip-open]').forEach((button) => {
    button.addEventListener('click', () => {
      opener = button;
      resetForm();
      tripDialog.showModal();
      renderHumanCheck();
      const reducedMotion = prefersReducedDialogMotion();
      const keyframes = reducedMotion
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [
          { transform: buttonToDialogTransform(), opacity: 0 },
          { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1 },
        ];
      animateDialog(keyframes, reducedMotion ? 170 : 480, 'cubic-bezier(.16, 1, .3, 1)');
      origin.focus({ preventScroll: true });
    });
  });

  tripDialog.querySelector('[data-trip-close]').addEventListener('click', closeTripDialog);
  tripDialog.addEventListener('click', (event) => {
    if (event.target === tripDialog) closeTripDialog();
  });
  tripDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeTripDialog();
  });
  tripDialog.addEventListener('close', () => {
    dialogMotion?.cancel();
    dialogMotion = null;
    dialogClosing = false;
    tripDialog.classList.remove('is-closing');
    tripDialog.style.willChange = '';
    stopEstimate();
    cancelPlaceSearches.forEach((cancel) => cancel());
    opener?.focus();
  });

  roundTripChoices.forEach((choice) => {
    choice.addEventListener('change', () => {
      const needsWait = choice.value === 'yes' && choice.checked;
      waitField.hidden = !needsWait;
      returnChoice.hidden = !needsWait;
      returnField.hidden = !needsWait || !returnOther.checked;
      waitInput.required = needsWait;
      if (!needsWait) waitInput.value = '0';
      showInputError(waitInput, false);
      roundTripError.hidden = true;
      roundTripChoices.forEach((radio) => radio.removeAttribute('aria-invalid'));
    });
  });

  returnOther.addEventListener('change', () => {
    returnField.hidden = !returnOther.checked;
    returnInput.required = returnOther.checked;
    if (!returnOther.checked) {
      returnInput.value = '';
      returnInput.dispatchEvent(new Event('input'));
    }
    showInputError(returnInput, false);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const roundTrip = roundTripChoices.find((choice) => choice.checked);
    let firstInvalid = null;
    for (const input of [origin, destination]) {
      const invalid = !input.value.trim();
      showInputError(input, invalid);
      if (invalid && !firstInvalid) firstInvalid = input;
    }
    const selectedDeparture = departurePicker.selectedDates[0];
    const invalidDeparture = !selectedDeparture || selectedDeparture < currentMinute();
    showInputError(departure, invalidDeparture);
    if (invalidDeparture && !firstInvalid) firstInvalid = departure;
    roundTripError.hidden = Boolean(roundTrip);
    if (!roundTrip) {
      roundTripChoices.forEach((radio) => radio.setAttribute('aria-invalid', 'true'));
      if (!firstInvalid) firstInvalid = roundTripChoices[0];
    }
    const extraWaitMinutes = Number(waitInput.value);
    const waitMinutes = includedWaitMinutes + extraWaitMinutes;
    const invalidWait = roundTrip?.value === 'yes' && (waitInput.value.trim() === '' || !Number.isSafeInteger(extraWaitMinutes) || extraWaitMinutes < 0 || waitMinutes > Number.MAX_SAFE_INTEGER / 60);
    showInputError(waitInput, invalidWait);
    if (invalidWait && !firstInvalid) firstInvalid = waitInput;
    const invalidReturn = roundTrip?.value === 'yes' && returnOther.checked && !returnInput.value.trim();
    showInputError(returnInput, invalidReturn);
    if (invalidReturn && !firstInvalid) firstInvalid = returnInput;
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const messageLines = [
      'Hola, hice esta cotización en la web. Quisiera coordinar el traslado.',
      `Origen: ${origin.value.trim()}`,
      `Destino: ${destination.value.trim()}`,
      `Salida: ${formatDate(selectedDeparture)} a las ${flatpickr.formatDate(selectedDeparture, 'H:i')}`,
      `Ida y vuelta: ${roundTrip.value === 'yes' ? 'Sí' : 'No'}`,
      ...(roundTrip.value === 'yes' ? [`Espera: 60 minutos incluidos${extraWaitMinutes ? ` + ${extraWaitMinutes} minutos extra` : ''}`] : []),
      ...(roundTrip.value === 'yes' && returnOther.checked ? [`Destino final de la vuelta: ${returnInput.value.trim()}`] : []),
      // TODO: definir y aplicar el descuento para seguidores de Instagram en la futura tarifa al cliente.
    ];
    const updateSummary = (priceUYU) => {
      summary.value = [
        ...messageLines,
        ...(Number.isFinite(priceUYU) ? [`Precio aproximado: $${moneyFormatter.format(priceUYU)} UYU.`] : []),
        Number.isFinite(priceUYU)
          ? '¿Tienen disponibilidad y me confirman este precio?'
          : '¿Tienen disponibilidad para este viaje? ¿Cuánto cuesta?',
      ].join('\n');
      whatsappLink.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(summary.value)}`;
      const priceWhatsapp = fuelResult.querySelector('[data-trip-whatsapp-primary]');
      if (priceWhatsapp) priceWhatsapp.href = whatsappLink.href;
    };
    fuelResult.replaceChildren();
    routeMap.hidden = true;
    routeMapFrame.removeAttribute('src');
    updateSummary();
    setQuoteActionsPending(false);
    copyStatus.textContent = '';
    form.hidden = true;
    result.hidden = false;
    setResultHeading(true);
    resultTitle.textContent = 'Calculando tu viaje';
    resultTitle.focus();
    if (needsHumanCheck()) {
      resultTitle.textContent = 'Consultá tu viaje';
      fuelResult.textContent = 'Verificá que sos una persona para calcular el precio. Podés consultar el viaje por WhatsApp igualmente.';
      return;
    }
    if (!origin.dataset.placeId || !destination.dataset.placeId || (roundTrip.value === 'yes' && returnOther.checked && !returnInput.dataset.placeId)) {
      resultTitle.textContent = 'Consultá tu viaje';
      fuelResult.textContent = 'Para calcular el precio, elegí cada dirección de las sugerencias. Podés consultar el viaje por WhatsApp igualmente.';
      return;
    }
    stopEstimate();
    setQuoteActionsPending(true);
    const controller = new AbortController();
    estimateController = controller;
    activeLoader = showLoader();
    const loader = activeLoader;
    try {
      const response = await fetch('/api/fuel-estimate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          originId: origin.dataset.placeId,
          destinationId: destination.dataset.placeId,
          roundTrip: roundTrip.value === 'yes',
          waitMinutes: roundTrip.value === 'yes' ? waitMinutes : undefined,
          returnId: roundTrip.value === 'yes' && returnOther.checked ? returnInput.dataset.placeId : undefined,
        }),
      });
      const estimate = await readEstimateStream(response, (progress) => loader.update(progress));
      await loader.finish(controller.signal);
      if (!controller.signal.aborted) {
        showFuel(estimate, selectedDeparture);
        updateSummary(estimate.sale?.priceUYU);
        resultTitle.textContent = 'Precio y recorrido';
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        resultTitle.textContent = 'No pudimos calcular el precio';
        const verificationProblem = checkIsHuman && /verific|límite de consultas/i.test(error.message);
        if (verificationProblem) requireHumanCheck(error.message);
        fuelResult.textContent = verificationProblem
          ? `${error.message} Elegí «Editar cotización» para verificarte de nuevo, o consultá por WhatsApp.`
          : `${error.message} Podés consultar el viaje por WhatsApp igualmente.`;
      }
    } finally {
      if (estimateController === controller) {
        setQuoteActionsPending(false);
        stopEstimate();
      }
    }
  });

  form.querySelectorAll('input[type="text"]:not(#trip-departure), #trip-wait').forEach((input) => {
    input.addEventListener('input', () => {
      if (input.value.trim()) showInputError(input, false);
    });
  });
  tripDialog.querySelector('[data-trip-edit]').addEventListener('click', () => {
    stopEstimate();
    result.hidden = true;
    form.hidden = false;
    setResultHeading(false);
    origin.focus();
  });
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(summary.value);
      copyStatus.textContent = 'Consulta copiada.';
    } catch {
      summary.focus();
      summary.select();
      copyStatus.textContent = 'Seleccionamos el texto para que puedas copiarlo.';
    }
  });
}

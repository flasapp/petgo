const tripDialog = document.querySelector('#trip-dialog');

if (tripDialog) {
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
  const summary = tripDialog.querySelector('[data-trip-summary]');
  const copyStatus = tripDialog.querySelector('[data-copy-status]');
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
  const isUnprocessedPreview = document.body.dataset.checkIsHuman === '__CHECK_IS_HUMAN__'
    || turnstileSiteKey === '__TURNSTILE_SITE_KEY__';
  humanCheck.hidden = !checkIsHuman;
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
  const distanceFormatter = new Intl.NumberFormat('es-UY', { maximumFractionDigits: 1 });
  const literFormatter = new Intl.NumberFormat('es-UY', { maximumFractionDigits: 2 });
  const moneyFormatter = new Intl.NumberFormat('es-UY', { maximumFractionDigits: 0 });
  const targetFormatter = new Intl.NumberFormat('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
      }, 500);
    });
  });

  function stopEstimate() {
    estimateController?.abort();
    estimateController = null;
    activeLoader?.disconnect();
    activeLoader = null;
  }

  function showLoader() {
    const loader = document.createElement('div');
    loader.className = 'trip-loader';
    loader.innerHTML = `
      <div class="trip-loader-heading">
        <strong>Estamos trazando tu recorrido</strong>
        <span>PetGo en camino</span>
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
    let targetPercent = 0;
    let visiblePercent = 0;
    let frameId = null;
    let lastFrameTime = 0;
    let finishResolve = null;
    let finishSignal = null;
    const positionVehicle = () => {
      const travel = Math.max(0, scene.clientWidth - vehicle.offsetWidth - 32);
      vehicle.style.transform = `translateX(${travel * visiblePercent / 100}px)`;
      trail.style.transform = `scaleX(${visiblePercent / 100})`;
    };
    const completeFinish = () => {
      if (!finishResolve) return;
      finishSignal.removeEventListener('abort', completeFinish);
      const resolve = finishResolve;
      finishResolve = null;
      finishSignal = null;
      resolve();
    };
    const animate = (time) => {
      // A lo sumo 50 puntos porcentuales por segundo: 100 % lleva al menos 2 s.
      visiblePercent = Math.min(targetPercent, visiblePercent + Math.max(0, time - lastFrameTime) / 20);
      lastFrameTime = time;
      positionVehicle();
      if (visiblePercent < targetPercent) {
        frameId = requestAnimationFrame(animate);
      } else {
        frameId = null;
        if (targetPercent === 100) completeFinish();
      }
    };
    const advanceTo = (percent) => {
      targetPercent = Math.max(targetPercent, Math.min(100, Number(percent) || 0));
      if (reducedMotion || frameId !== null || visiblePercent >= targetPercent) return;
      lastFrameTime = performance.now();
      frameId = requestAnimationFrame(animate);
    };
    const resizeObserver = new ResizeObserver(positionVehicle);
    resizeObserver.observe(scene);
    positionVehicle();
    return {
      update(event) {
        message.textContent = event.message;
        advanceTo(event.percent);
      },
      finish(signal) {
        if (signal.aborted || reducedMotion) return Promise.resolve();
        return new Promise((resolve) => {
          finishResolve = resolve;
          finishSignal = signal;
          signal.addEventListener('abort', completeFinish, { once: true });
          this.update({ percent: 100, message: 'Llegando al destino…' });
          if (visiblePercent === 100) completeFinish();
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

  function showFuel(data) {
    fuelResult.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = `Recorrido · ${data.zone}`;
    fuelResult.append(title);
    const list = document.createElement('ul');
    for (const leg of data.legs) {
      const item = document.createElement('li');
      item.textContent = `${leg.label}: ${distanceFormatter.format(leg.meters / 1000)} km · aprox. ${formatDuration(leg.seconds)}`;
      list.append(item);
    }
    fuelResult.append(list);
    const totals = document.createElement('p');
    totals.textContent = `${distanceFormatter.format(data.meters / 1000)} km en total · ${distanceFormatter.format(data.cityMeters / 1000)} km en Montevideo · ${distanceFormatter.format(data.roadMeters / 1000)} km fuera · ${literFormatter.format(data.liters)} l de nafta`;
    fuelResult.append(totals);
    const time = document.createElement('p');
    const extraWaitMinutes = Math.max(0, data.wait.requestedMinutes - includedWaitMinutes);
    time.textContent = `Conducción estimada: aprox. ${formatDuration(data.durationSeconds)}${data.roundTrip ? ` · Espera: 60 min incluidos${extraWaitMinutes ? ` + ${extraWaitMinutes} min extra` : ''} · Tiempo ocupado: aprox. ${formatDuration(data.drivingAndWaitSeconds)}` : ''}`;
    fuelResult.append(time);

    const comparison = document.createElement('div');
    comparison.className = 'trip-price-grid';
    const costs = document.createElement('section');
    costs.className = 'trip-price-card';
    const costTitle = document.createElement('h4');
    costTitle.textContent = 'Costos calculados · UYU';
    costs.append(costTitle);
    const costRows = document.createElement('dl');
    addPriceRow(costRows, 'Nafta', data.cost.fuelUYU);
    addPriceRow(costRows, 'Mano de obra · conducción', data.cost.drivingUYU);
    if (data.roundTrip) addPriceRow(costRows, 'Mano de obra · espera', data.cost.waitingUYU);
    addPriceRow(costRows, 'Total de estos costos', data.cost.totalUYU, true);
    costs.append(costRows);
    comparison.append(costs);

    const sale = document.createElement('section');
    sale.className = 'trip-price-card trip-price-sale';
    const saleTitle = document.createElement('h4');
    saleTitle.textContent = 'Precio de venta · UYU';
    sale.append(saleTitle);
    if (data.sale) {
      const saleRows = document.createElement('dl');
      addPriceRow(saleRows, `Recargo ${data.sale.markupPercent} %`, data.sale.markupUYU);
      if (data.sale.minimumAdjustmentUYU > 0) addPriceRow(saleRows, `Ajuste al mínimo de $${moneyFormatter.format(data.sale.minimumUYU)}`, data.sale.minimumAdjustmentUYU);
      addPriceRow(saleRows, 'Precio calculado', data.sale.priceUYU, true);
      sale.append(saleRows);
    } else {
      const manual = document.createElement('p');
      manual.textContent = 'Interior: el porcentaje y los peajes siguen pendientes. Consultá el precio por WhatsApp.';
      sale.append(manual);
    }
    comparison.append(sale);
    fuelResult.append(comparison);

    const note = document.createElement('small');
    note.textContent = `${data.roundTrip ? 'La ida y vuelta incluye 60 minutos de espera en el precio calculado; los minutos extra que indiques también se suman. ' : ''}La mano de obra se calcula a $${moneyFormatter.format(data.laborRateUYUPerHour)}/h sobre conducción y toda la espera prevista. Solo la nafta se redondea antes del precio; los demás importes se muestran a centésimos y pueden diferir un centésimo al sumarlos. La ruta no usa tráfico en tiempo real. Faltan mantenimiento, seguro, estacionamiento y tiempo de carga y descarga${data.tollsPending ? ', además de peajes' : ''}. El precio y la disponibilidad se confirman por WhatsApp.`;
    fuelResult.append(note);
    showRouteMap(data);
  }

  function showRouteMap(data) {
    if (!data.mapUrl) return;
    routeMapFrame.src = data.mapUrl;
    routeMapNote.textContent = data.roundTrip
      ? 'Se muestra la ida. El precio calculado incluye la vuelta, la espera y los trayectos desde y hasta la base. El trazado visual puede variar del cálculo.'
      : 'Se muestra el traslado de ida. El precio calculado incluye los trayectos desde y hasta la base. El trazado visual puede variar del cálculo.';
    routeMap.hidden = false;
  }

  function addPriceRow(list, label, amount, total = false) {
    const term = document.createElement('dt');
    const value = document.createElement('dd');
    if (total) {
      term.className = 'trip-price-total';
      value.className = 'trip-price-total';
    }
    term.textContent = label;
    value.textContent = `$${targetFormatter.format(amount)}`;
    list.append(term, value);
  }

  function formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (!hours) return `${minutes} min`;
    return remainder ? `${hours} h ${remainder} min` : `${hours} h`;
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
    copyStatus.textContent = '';
    fuelResult.replaceChildren();
    routeMap.hidden = true;
    routeMapFrame.removeAttribute('src');
    if (needsHumanCheck()) requireHumanCheck();
  }

  document.querySelectorAll('[data-trip-open]').forEach((button) => {
    button.addEventListener('click', () => {
      opener = button;
      resetForm();
      tripDialog.showModal();
      renderHumanCheck();
      origin.focus();
    });
  });

  tripDialog.querySelector('[data-trip-close]').addEventListener('click', () => tripDialog.close());
  tripDialog.addEventListener('click', (event) => {
    if (event.target === tripDialog) tripDialog.close();
  });
  tripDialog.addEventListener('close', () => {
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

    summary.value = [
      'Hola, quiero consultar un traslado con PetGo.',
      `Origen: ${origin.value.trim()}`,
      `Destino: ${destination.value.trim()}`,
      `Salida: ${formatDate(selectedDeparture)} a las ${flatpickr.formatDate(selectedDeparture, 'H:i')}`,
      `Ida y vuelta: ${roundTrip.value === 'yes' ? 'Sí' : 'No'}`,
      ...(roundTrip.value === 'yes' ? [`Espera: 60 minutos incluidos${extraWaitMinutes ? ` + ${extraWaitMinutes} minutos extra` : ''}`] : []),
      ...(roundTrip.value === 'yes' && returnOther.checked ? [`Destino final de la vuelta: ${returnInput.value.trim()}`] : []),
      // TODO: definir y aplicar el descuento para seguidores de Instagram en la futura tarifa al cliente.
      '¿Tienen disponibilidad para este viaje? ¿Cuánto cuesta?',
    ].join('\n');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(summary.value)}`;
    whatsappLink.href = whatsappUrl;
    form.hidden = true;
    result.hidden = false;
    resultTitle.focus();
    if (needsHumanCheck()) {
      fuelResult.textContent = 'Verificá que sos una persona para calcular el precio. Podés consultar el viaje por WhatsApp igualmente.';
      return;
    }
    if (!origin.dataset.placeId || !destination.dataset.placeId || (roundTrip.value === 'yes' && returnOther.checked && !returnInput.dataset.placeId)) {
      fuelResult.textContent = 'Para calcular la nafta, elegí cada dirección de las sugerencias. Podés consultar el viaje por WhatsApp igualmente.';
      return;
    }
    stopEstimate();
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
      if (!controller.signal.aborted) showFuel(estimate);
    } catch (error) {
      if (!controller.signal.aborted) {
        const verificationProblem = checkIsHuman && /verific|límite de consultas/i.test(error.message);
        if (verificationProblem) requireHumanCheck(error.message);
        fuelResult.textContent = verificationProblem
          ? `${error.message} Elegí «Editar datos» para verificarte de nuevo, o consultá por WhatsApp.`
          : `${error.message} Podés consultar el viaje por WhatsApp igualmente.`;
      }
    } finally {
      if (estimateController === controller) stopEstimate();
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
    origin.focus();
  });
  tripDialog.querySelector('[data-trip-copy]').addEventListener('click', async () => {
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

// EXCESS · la cabina. La página es un reproductor de club: BROWSE (sus sets, que suenan de verdad desde SoundCloud),
// HISTORY (dónde ha tocado), CUE LIST (próximos toques), INFO (quién es) y LINK (booking por WhatsApp).
// Al bajar, la consola se queda fija y cambia de menú. Sin librerías: el reproductor de SoundCloud se controla por postMessage.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const raiz = document.documentElement, quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WHATSAPP = '573223657465';
  const VIDEO_SET = { titulo: 'Los Decks 2025 · Tocancipá · UMBRA Club (video)', youtube: '5wfIJ_eQi3o' };

  const RELATOS = {
    sets: ['Escucha', 'Sus sets, sonando en la consola. Dale play y gira el plato para avanzar.', ['Abrir en SoundCloud', 'https://soundcloud.com/excess_ht-dj']],
    history: ['Dónde ha sonado', 'De UMBRA CLUB en Tocancipá a Antisistema, Radio Berlín, Ibagué y Medellín.', null],
    cuelist: ['Próximos toques', 'Las fechas que vienen. Si quieres la tuya, escríbele.', ['Pedir una fecha', '#booking']],
    info: ['Quién es', 'Autodidacta, residente y fundador de UMBRA. Hardtechno, dark e industrial en una sola sesión.', ['Instagram', 'https://www.instagram.com/excess__dj']],
    link: ['Booking', 'Fecha, ciudad y evento. Llega directo a su WhatsApp.', ['Escribir por WhatsApp', `https://wa.me/${WHATSAPP}`]],
  };

  // ───── Nombre a lo ancho exacto ─────
  const ajustarNombres = () => $$('.portada-nombre, .pie-nombre').forEach((c) => { const s = $('span', c);
    c.style.fontSize = '100px'; c.style.fontSize = (100 * c.clientWidth / s.offsetWidth) + 'px'; });

  // ───── Escala de la consola para que quepa en el escritorio ─────
  const marco = $('.cdj-marco');
  const escalar = () => {
    if (innerWidth <= 900) { marco.style.removeProperty('--s'); return; }
    const col = marco.parentElement.clientWidth * 8 / 12 - 32;
    const s = Math.min((innerHeight - 84) / 860, col / 760, 1.15);
    marco.style.setProperty('--s', s.toFixed(3));
  };

  // ───── Estrobo (como mucho uno cada 1,4 s; nunca con "reducir movimiento") ─────
  const estrobo = document.createElement('div'); estrobo.className = 'estrobo'; document.body.append(estrobo);
  let ultimoDestello = 0;
  const destello = (fuerza = .45) => { const ahora = performance.now();
    if (quieto || ahora - ultimoDestello < 1400) return; ultimoDestello = ahora;
    estrobo.animate([{ opacity: 0 }, { opacity: fuerza, offset: .25 }, { opacity: 0 }], { duration: 180, easing: 'ease-out' }); };

  // ───── Entrada ─────
  const portada = $('.portada');
  let cabinaAbierta = false, quiereSonar = false;
  const abrirCabina = (conSonido) => { if (cabinaAbierta) return; cabinaAbierta = true;
    destello(.7); portada.classList.add('fuera'); if (conSonido) { quiereSonar = true; if (sonidos.length) cargar(0, true); } };
  $('.encender').addEventListener('click', () => abrirCabina(true));
  addEventListener('scroll', () => { if (scrollY > 40) abrirCabina(false); }, { passive: true });

  // ───── Puente con SoundCloud (protocolo del reproductor oficial) ─────
  const sc = $('.sc'), ORIGEN = 'https://w.soundcloud.com';
  const llamar = (method, value) => sc.contentWindow.postMessage(JSON.stringify(value === undefined ? { method } : { method, value }), ORIGEN);
  let sonidos = [], actual = -1, pos = 0, dur = 0, sonando = false, ondaDatos = null, viendoVideo = false;

  addEventListener('message', (e) => {
    if (e.origin !== ORIGEN) return;
    let m; try { m = JSON.parse(e.data); } catch { return; }
    switch (m.method) {
      case 'ready':
        ['playProgress', 'play', 'pause', 'finish'].forEach((ev) => llamar('addEventListener', ev));
        pedirSonidos(); break;
      case 'getSounds': recibirSonidos(m.value || []); break;
      case 'playProgress': if (m.value) { pos = m.value.currentPosition; if (!dur && m.value.relativePosition) dur = pos / m.value.relativePosition; } break;
      case 'play': sonando = true; estadoPlay(); break;
      case 'pause': case 'finish': sonando = false; estadoPlay(); break;
    }
  });
  let intentos = 0;
  const pedirSonidos = () => llamar('getSounds');
  const recibirSonidos = (lista) => {
    const completos = lista.filter((s) => s && s.title);
    if (completos.length < lista.length && intentos++ < 8) { setTimeout(pedirSonidos, 900); }
    sonidos = completos; pintarSets();
    if (quiereSonar && actual < 0 && sonidos.length) cargar(0, true);
  };

  // ───── Cargar y controlar un set ─────
  const tituloPista = $('.titulo-pista');
  const ponerTitulo = (t) => { const s = $('span', tituloPista); s.textContent = t;
    tituloPista.classList.toggle('largo', s.offsetWidth > tituloPista.clientWidth);
    if (tituloPista.classList.contains('largo')) s.textContent = `${t}     ·     ${t}`; };

  const cargar = (i, tocar) => {
    if (i === sonidos.length) { abrirVideo(); return; }
    cerrarVideo(); const s = sonidos[i]; if (!s) return;
    actual = i; pos = 0; dur = s.duration || 0; ondaDatos = null; ponerTitulo(s.title);
    llamar('skip', i); if (!tocar) setTimeout(() => llamar('pause'), 350);
    cargarOnda(s); pintarSets(); $('.play').classList.toggle('listo', !tocar);
  };
  const cargarOnda = async (s) => {
    try { if (!s.waveform_url) throw 0;
      const r = await fetch(s.waveform_url.replace(/\.png(\?.*)?$/, '.json')); const j = await r.json();
      const max = Math.max(...j.samples); ondaDatos = j.samples.map((v) => v / max);
    } catch { ondaDatos = ondaSemilla(400); }
  };
  window.__onda = () => ondaDatos ? 'real' : 'semilla';
  const ondaSemilla = (n) => { let x = 11; return Array.from({ length: n }, (_, i) => { x = (x * 16807) % 2147483647;
    return Math.min(1, .3 + (x / 2147483647) * .5 + (i % 6 === 0 ? .25 : 0)); }); };

  const play = $('.play'), iPlay = $('.i-play'), iPausa = $('.i-pausa');
  const estadoPlay = () => { play.setAttribute('aria-pressed', sonando); play.setAttribute('aria-label', sonando ? 'Pausar' : 'Reproducir');
    iPlay.toggleAttribute('hidden', sonando); iPausa.toggleAttribute('hidden', !sonando); play.classList.toggle('listo', !sonando && actual >= 0); pintarSets(); };
  play.addEventListener('click', () => { if (actual < 0) { if (sonidos.length) cargar(0, true); return; } llamar(sonando ? 'pause' : 'play'); });
  $('.cue').addEventListener('click', () => { if (actual < 0) return; llamar('seekTo', 0); llamar('pause'); pos = 0;
    const c = $('.cue'); c.classList.add('encendido'); setTimeout(() => c.classList.remove('encendido'), 300); });
  const vol = $('.tempo input'), volOut = $('.tempo output');
  vol.addEventListener('input', () => { llamar('setVolume', +vol.value); volOut.textContent = vol.value; });

  // Hot cues: ocho puntos del set
  $$('.pad').forEach((p, i) => p.addEventListener('click', () => { if (!dur) return;
    const t = dur * i / 8; llamar('seekTo', t); pos = t; if (!sonando) llamar('play'); }));

  // ───── El video del set en Los Decks (YouTube) dentro de la pantalla ─────
  const cajaVideo = $('.video-set');
  const abrirVideo = () => { if (sonando) llamar('pause'); viendoVideo = true; actual = sonidos.length;
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${VIDEO_SET.youtube}?autoplay=1&rel=0&modestbranding=1`;
    f.title = VIDEO_SET.titulo; f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
    cajaVideo.replaceChildren(f); cajaVideo.hidden = false; ponerTitulo(VIDEO_SET.titulo); pintarSets(); };
  const cerrarVideo = () => { if (!viendoVideo) return; viendoVideo = false; cajaVideo.replaceChildren(); cajaVideo.hidden = true; };

  // ───── Listas de la pantalla ─────
  const hhmmss = (ms) => { const s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return (h ? `${h}:${String(m).padStart(2, '0')}` : String(m).padStart(2, '0')) + ':' + String(x).padStart(2, '0'); };
  const fila = (lista, { titulo, sub, der, activo, sonandoAhora }, alElegir) => {
    const li = document.createElement('li'); li.setAttribute('role', 'option'); li.setAttribute('aria-selected', !!activo);
    if (sonandoAhora) li.classList.add('sonando');
    const a = document.createElement('span'); a.textContent = titulo;
    if (sub) { const s = document.createElement('small'); s.textContent = sub; a.append(s); }
    const b = document.createElement('span'); b.className = 'der'; b.textContent = der || '';
    li.append(a, b); if (alElegir) li.addEventListener('click', alElegir); lista.append(li); return li; };

  const listaSets = $('.lista-sets'); let selSet = 0;
  const pintarSets = () => {
    listaSets.replaceChildren();
    if (!sonidos.length) { const li = document.createElement('li'); li.className = 'vacia'; li.textContent = 'Conectando con SoundCloud…'; listaSets.append(li); }
    sonidos.forEach((s, i) => fila(listaSets, { titulo: s.title, sub: s.genre || 'SoundCloud', der: hhmmss(s.duration || 0),
      activo: i === selSet, sonandoAhora: i === actual && sonando }, () => { selSet = i; cargar(i, true); }));
    fila(listaSets, { titulo: VIDEO_SET.titulo, sub: 'Video · Los Decks', der: 'YouTube', activo: selSet === sonidos.length,
      sonandoAhora: viendoVideo }, () => { selSet = sonidos.length; abrirVideo(); });
  };

  // ───── HISTORY: lista + mapa ─────
  const ns = 'http://www.w3.org/2000/svg', svgEl = (t, at) => { const e = document.createElementNS(ns, t); for (const k in at) e.setAttribute(k, at[k]); return e; };
  let mapa = null, vbActual = null, vbMeta = null, lugaresMapa = {};
  const pintarHistorial = async () => {
    const [h, m] = await Promise.all([fetch('datos/historial.json').then((r) => r.json()), fetch('datos/mapa.json').then((r) => r.json())]);
    const lista = $('.lista-hist'); $('.conteo-hist').textContent = `${h.lugares.length} lugares`;
    mapa = $('.mapa'); lugaresMapa = m.lugares; const [, , W, H] = m.viewBox.split(' ').map(Number);
    vbActual = [0, 0, W, H]; mapa.setAttribute('viewBox', vbActual.join(' '));
    for (let x = 0; x <= W; x += 50) mapa.append(svgEl('line', { x1: x, y1: 0, x2: x, y2: H, class: 'reja' }));
    for (let y = 0; y <= H; y += 50) mapa.append(svgEl('line', { x1: 0, y1: y, x2: W, y2: y, class: 'reja' }));
    mapa.append(svgEl('path', { d: m.pais, class: 'pais' }));
    const ciudades = [...new Set(h.lugares.map((l) => l.ciudad))];
    ciudades.forEach((c) => { const p = m.lugares[c]; if (!p) return;
      const g = svgEl('g', { 'data-ciudad': c });
      g.append(svgEl('circle', { cx: p[0], cy: p[1], r: 4, class: 'onda-p' }), svgEl('circle', { cx: p[0], cy: p[1], r: 3.2, class: 'punto' }));
      const t = svgEl('text', { x: p[0] + 6, y: p[1] - 6 }); t.textContent = c; g.append(t); mapa.append(g); });
    h.lugares.forEach((l, i) => fila(lista, { titulo: l.lugar, sub: l.detalle || '', der: l.ciudad, activo: i === 0 }, (e) => {
      $$('li', lista).forEach((x) => x.setAttribute('aria-selected', x === e.currentTarget)); enfocarMapa(l.ciudad); }));
    enfocarMapa(h.lugares[0].ciudad);
    // cinta de INFO
    $('.cinta-mueve').textContent = `Compartió tarima con   ${h.compartio.join('   ·   ')}   ·   `.repeat(2);
  };
  const enfocarMapa = (ciudad) => { const p = lugaresMapa[ciudad]; if (!p) return;
    const r = ciudad === 'Medellín' || ciudad === 'Ibagué' ? 120 : 70;
    vbMeta = [p[0] - r, p[1] - r * 1.22, r * 2, r * 2.44];
    $$('.mapa text').forEach((t) => t.style.fontSize = (r * .2) + 'px');
    $$('.mapa g').forEach((g) => { const si = g.dataset.ciudad === ciudad; g.classList.toggle('activa', si); g.style.opacity = si ? 1 : .5; }); };

  // ───── CUE LIST: próximos toques ─────
  const pintarFechas = async () => {
    const d = await fetch('datos/fechas.json').then((r) => r.json()); const lista = $('.lista-fechas');
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const prox = d.fechas.map((f) => ({ ...f, dia: new Date(f.fecha + 'T00:00:00') })).filter((f) => f.dia >= hoy).sort((a, b) => a.dia - b.dia);
    if (!prox.length) { const li = document.createElement('li'); li.className = 'vacia'; li.textContent = 'Sin fechas anunciadas. Escríbele para la tuya en LINK.'; lista.append(li); return; }
    const faltan = Math.round((prox[0].dia - hoy) / 864e5);
    $('.cuenta-atras').textContent = faltan === 0 ? 'Hoy' : `Faltan ${faltan} días`;
    const mes = new Intl.DateTimeFormat('es-CO', { month: 'short' }), sem = new Intl.DateTimeFormat('es-CO', { weekday: 'short' });
    prox.forEach((f) => { const li = document.createElement('li');
      const dia = document.createElement('span'); dia.className = 'dia'; dia.textContent = f.dia.getDate() + ' ';
      const sm = document.createElement('small'); sm.textContent = `${mes.format(f.dia).replace('.', '')} · ${sem.format(f.dia).replace('.', '')}`; dia.append(sm);
      const q = document.createElement('span'); q.textContent = f.lugar;
      if (f.ejemplo) { const e = document.createElement('span'); e.className = 'etiqueta'; e.textContent = 'EJEMPLO'; q.append(e); }
      const s = document.createElement('small'); s.textContent = `${f.ciudad} · ${f.hora}`; q.append(s);
      const b = document.createElement(f.boletas ? 'a' : 'span'); b.className = 'boletas'; b.textContent = f.boletas ? 'Boletas' : 'Pronto';
      if (f.boletas) { b.href = f.boletas; b.target = '_blank'; b.rel = 'noopener'; }
      li.append(dia, q, b); lista.append(li); });
  };

  // ───── LINK: booking por WhatsApp ─────
  $('.booking').addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(e.target);
    const fecha = f.get('fecha') ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(f.get('fecha') + 'T00:00:00')) : '';
    const texto = `Hola EXCESS, quiero contratarte.\nFecha: ${fecha}\nCiudad: ${f.get('ciudad')}\nEvento: ${f.get('evento')}`;
    open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener'); });

  // ───── Menús: teclas, capítulos al bajar, relato ─────
  let modo = 'sets';
  const relato = $('.relato'), accion = $('.relato-accion');
  const ponerModo = (m) => { if (m === modo) return; modo = m;
    $$('.tecla').forEach((t) => t.setAttribute('aria-pressed', t.dataset.modo === m));
    $$('.modo').forEach((s) => s.hidden = s.dataset.modo !== m);
    const [t, x, a] = RELATOS[m]; $('.relato-titulo').textContent = t; $('.relato-texto').textContent = x; accion.replaceChildren();
    if (a) { const l = document.createElement('a'); l.textContent = a[0]; l.href = a[1]; if (a[1].startsWith('http')) { l.target = '_blank'; l.rel = 'noopener'; } accion.append(l); }
    relato.classList.remove('cambia'); void relato.offsetWidth; relato.classList.add('cambia'); destello(.18); };
  $$('.tecla').forEach((t) => t.addEventListener('click', () => { abrirCabina(false);
    document.getElementById({ sets: 'escuchar', history: 'donde', cuelist: 'fechas', info: 'quien', link: 'booking' }[t.dataset.modo]).scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'center' });
    ponerModo(t.dataset.modo); }));

  // ───── Perilla: recorre la lista del menú activo; LOAD carga ─────
  const listaActiva = () => $(`.modo[data-modo="${modo}"] .lista`);
  const mover = (paso) => { const l = listaActiva(); if (!l) return; const filas = $$('li:not(.vacia)', l); if (!filas.length) return;
    let i = filas.findIndex((f) => f.getAttribute('aria-selected') === 'true'); i = Math.max(0, Math.min(filas.length - 1, i + paso));
    filas.forEach((f, k) => f.setAttribute('aria-selected', k === i)); filas[i].scrollIntoView({ block: 'nearest' });
    if (modo === 'sets') selSet = i; if (modo === 'history') filas[i].click(); };
  const perilla = $('.perilla'); let angPer = 0, prevPer = null;
  perilla.addEventListener('wheel', (e) => { e.preventDefault(); mover(Math.sign(e.deltaY)); angPer += Math.sign(e.deltaY) * 18; perilla.style.transform = `rotate(${angPer}deg)`; }, { passive: false });
  perilla.addEventListener('pointerdown', (e) => { prevPer = e.clientY; perilla.setPointerCapture(e.pointerId); });
  perilla.addEventListener('pointermove', (e) => { if (prevPer === null) return; const d = e.clientY - prevPer;
    if (Math.abs(d) > 14) { mover(Math.sign(d)); angPer += Math.sign(d) * 18; perilla.style.transform = `rotate(${angPer}deg)`; prevPer = e.clientY; } });
  perilla.addEventListener('pointerup', () => prevPer = null);
  perilla.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); mover(e.key === 'ArrowDown' ? 1 : -1); } });
  $('.cargar').addEventListener('click', () => { if (modo === 'sets') { selSet === sonidos.length ? abrirVideo() : cargar(selSet, true); } });

  // ───── Plato: avanzar o retroceder arrastrando en círculo (1 vuelta = 30 s) ─────
  const jog = $('.jog'), plato = $('.jog-plato'); let angJog = 0, prevJog = null, ultimoBusco = 0;
  const angulo = (e) => { const r = jog.getBoundingClientRect(); return Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2) * 180 / Math.PI; };
  jog.addEventListener('pointerdown', (e) => { prevJog = angulo(e); jog.setPointerCapture(e.pointerId); });
  jog.addEventListener('pointermove', (e) => { if (prevJog === null) return; let d = angulo(e) - prevJog;
    if (d > 180) d -= 360; if (d < -180) d += 360; prevJog = angulo(e); angJog += d;
    if (dur) { pos = Math.max(0, Math.min(dur, pos + d / 360 * 30000)); const ahora = performance.now();
      if (ahora - ultimoBusco > 120) { llamar('seekTo', pos); ultimoBusco = ahora; } } });
  jog.addEventListener('pointerup', () => { prevJog = null; if (dur) llamar('seekTo', pos); });
  jog.addEventListener('keydown', (e) => { const p = e.key === 'ArrowRight' ? 5000 : e.key === 'ArrowLeft' ? -5000 : 0;
    if (p && dur) { e.preventDefault(); pos = Math.max(0, Math.min(dur, pos + p)); llamar('seekTo', pos); angJog += p / 30000 * 360; } });

  // ───── Balance ─────
  $$('.balance button').forEach((b) => b.addEventListener('click', () => { raiz.dataset.balance = b.dataset.b;
    $$('.balance button').forEach((x) => x.setAttribute('aria-pressed', x === b)); destello(b.dataset.b === 'negativo' ? .5 : .2); }));

  // ───── Onda, tiempo, plato y luz: un solo ciclo de dibujo ─────
  const lienzo = $('.onda');
  lienzo.addEventListener('click', (e) => { if (!dur) return; pos = dur * e.offsetX / lienzo.clientWidth; llamar('seekTo', pos); });
  let nivel = 0, ultimo = performance.now();
  const ciclo = (ahora) => {
    const dt = Math.min(.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (sonando) pos = Math.min(dur || Infinity, pos + dt * 1000);           // interpola entre avisos de SoundCloud
    const rel = dur ? pos / dur : 0;
    $('.t-pasado').textContent = hhmmss(pos); $('.t-resta').textContent = '-' + hhmmss(Math.max(0, dur - pos));
    // el plato gira a 33⅓ rpm mientras suena
    if (sonando && prevJog === null) angJog += dt * 200;
    plato.style.transform = `rotate(${angJog}deg)`; jog.setAttribute('aria-valuenow', Math.round(rel * 100));
    // nivel = intensidad real del set en este punto (de la forma de onda de SoundCloud)
    const objetivo = sonando && ondaDatos ? ondaDatos[Math.min(ondaDatos.length - 1, Math.floor(rel * ondaDatos.length))] : 0;
    nivel += (objetivo - nivel) * Math.min(1, dt * 10);
    const pulso = sonando ? nivel * (.75 + .25 * Math.max(0, Math.sin(ahora / 1000 * Math.PI * 2 * 2.5))) : 0;
    raiz.style.setProperty('--nivel', pulso.toFixed(3));
    if (sonando && objetivo > .93 && raiz.dataset.balance === 'negativo') destello(.35);
    // forma de onda
    const w = lienzo.clientWidth, h = lienzo.clientHeight, dpr = devicePixelRatio || 1;
    if (w) { if (lienzo.width !== Math.round(w * dpr)) { lienzo.width = Math.round(w * dpr); lienzo.height = Math.round(h * dpr); }
      const c = lienzo.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      const datos = ondaDatos || ondaSemilla(400), n = Math.min(datos.length, Math.floor(w / 2)), paso = datos.length / n;
      for (let i = 0; i < n; i++) { const a = datos[Math.floor(i * paso)], bh = Math.max(1, a * (h - 10));
        c.fillStyle = i / n < rel ? '#e9e7e2' : '#3c3c3c'; c.fillRect(i * w / n, (h - bh) / 2, Math.max(1, w / n - .6), bh); }
      c.fillStyle = '#fff'; c.fillRect(rel * w - 1, 0, 2, h); }
    // zoom suave del mapa
    if (mapa && vbMeta) { vbActual = vbActual.map((v, i) => v + (vbMeta[i] - v) * Math.min(1, dt * 4)); mapa.setAttribute('viewBox', vbActual.map((v) => v.toFixed(1)).join(' ')); }
    requestAnimationFrame(ciclo);
  };

  // ───── Arranque ─────
  const obs = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && cabinaAbierta) ponerModo(e.target.dataset.modo); }), { rootMargin: '-50% 0px -50% 0px' });
  $$('.capitulo').forEach((c) => obs.observe(c));
  modo = ''; ponerModo('sets');
  pintarSets(); pintarHistorial(); pintarFechas();
  const listo = () => { ajustarNombres(); escalar(); };
  document.fonts.ready.then(listo); addEventListener('resize', listo); listo();
  requestAnimationFrame(ciclo);
})();

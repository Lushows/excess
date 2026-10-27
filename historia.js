// EXCESS · la historia. Se lee bajando; cada capítulo acerca al visitante a contratarlo.
// Consola: el reproductor oficial de SoundCloud controlado por postMessage. Movimiento: GSAP + ScrollTrigger.
(() => {
  // propuesta de rojo para revisar: ?rojo=1|2|3
  // rojo neón: la propuesta 2 por defecto; ?rojo=1|3 para comparar, ?rojo=0 sin rojo
  const rojo = new URLSearchParams(location.search).get('rojo') ?? '2'; if (/^[123]$/.test(rojo)) document.documentElement.classList.add('rojo-' + rojo);
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const raiz = document.documentElement, quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const escritorio = () => innerWidth > 900;
  const WHATSAPP = '573223657465';

  // ───── Nombres a lo ancho exacto ─────
  const ajustarNombres = () => $$('.monumento, .pie-nombre').forEach((c) => { const s = $('span', c);
    c.style.fontSize = '100px'; c.style.fontSize = (100 * c.clientWidth / s.offsetWidth) + 'px'; });

  // ───── Estrobo: un destello corto, nunca dos seguidos, nunca con "reducir movimiento" ─────
  const estrobo = document.createElement('div'); estrobo.className = 'estrobo'; document.body.append(estrobo);
  let ultimoDestello = 0;
  const destello = (fuerza = .4) => { const t = performance.now(); if (quieto || t - ultimoDestello < 1400) return; ultimoDestello = t;
    estrobo.animate([{ opacity: 0 }, { opacity: fuerza, offset: .25 }, { opacity: 0 }], { duration: 180, easing: 'ease-out' }); };

  // ───── El sonido: los géneros cambian el balance de todas las fotos ─────
  const NOTAS = { contraste: 'Su línea principal. Rápido, duro y directo, como el bombo.',
    sombra: 'Sombra y tensión: la pista se vuelve más oscura y más profunda.',
    negativo: 'Lo más crudo: metal, ruido y estrobo.' };
  $$('.generos button').forEach((b) => b.addEventListener('click', () => {
    raiz.dataset.balance = b.dataset.b; $('.genero-nota').textContent = NOTAS[b.dataset.b];
    $$('.generos button').forEach((x) => x.setAttribute('aria-pressed', x === b)); destello(b.dataset.b === 'negativo' ? .45 : .2); }));

  // ───── UMBRA: pestañas ─────
  const UMBRA = [
    { t: 'UMBRA CLUB', img: 'img/a001-rojo.jpg', alt: 'EXCESS en la cabina del container de UMBRA', p: 'Su residencia, en Tocancipá. El container de lámina y cadenas donde suena lo más crudo de su sonido y donde UMBRA presenta artistas nacionales e internacionales.' },
    { t: 'UMBRA ESTUDIO', img: 'img/estudio.jpg', alt: 'EXCESS en su estudio', p: 'Estudio y sala de ensayo. Su lugar de creación: ahí prepara cada set y trabaja en su música propia.' },
    { t: 'UMBRA COLLECTIVE', img: 'img/pista.jpg', alt: 'La pista llena en un evento de UMBRA', p: 'El colectivo artístico detrás de los eventos de UMBRA: la gente que mueve la noche alrededor de la música.' },
    { t: 'Escuela de DJ', img: 'img/umbra-manos.jpg', alt: 'Manos sobre el mixer', p: 'Formación y proyección de nuevos artistas. Lo que él aprendió solo, a punta de horas, ahora lo enseña.' },
  ];
  const panel = $('.umbra-panel');
  const ponerUmbra = (i) => { const u = UMBRA[i], img = $('img', panel);
    $$('.umbra-pestanas button').forEach((b) => b.setAttribute('aria-selected', +b.dataset.i === i));
    $('h3', panel).textContent = u.t; $('p', panel).textContent = u.p; img.alt = u.alt;
    if (!img.src.endsWith(u.img)) { if (!quieto) img.animate([{ opacity: .2 }, { opacity: 1 }], { duration: 450 }); img.src = u.img; } };
  $$('.umbra-pestanas button').forEach((b) => b.addEventListener('click', () => ponerUmbra(+b.dataset.i)));
  ponerUmbra(0);

  // ───── Video de Los Decks: se carga solo al tocarlo ─────
  $('.video-fachada').addEventListener('click', (e) => { const b = e.currentTarget, marco = document.createElement('div');
    marco.className = 'video-marco'; const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.youtube}?autoplay=1&rel=0`; f.title = 'EXCESS en Los Decks 2025, UMBRA CLUB';
    f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true; marco.append(f);
    if (sonando) llamar('pause'); b.replaceWith(marco); });

  // ───── Dónde ha sonado: mapa digital (MapLibre + OpenFreeMap, uso comercial permitido) ─────
  // El estilo base se repinta con la paleta de la marca: tierra en tinta, agua y vías en grafito, nombres en español.
  const PINTA = { fondo: '#100B0A', agua: '#1C1514', tierra: '#130E0D', parque: '#151010', edificio: '#191312',
    via: '#2E2626', viaMayor: '#433939', limite: '#6A5F5F', texto: '#A49A95', halo: '#100B0A' };
  const repintar = (estilo) => {
    estilo.layers = estilo.layers.filter((l) => !/poi|housenum|aeroway/.test(l.id) && l.source !== 'ne2_shaded');
    estilo.layers.forEach((l) => { const id = l.id, p = (l.paint = l.paint || {});
      if (l.type === 'background') p['background-color'] = PINTA.fondo;
      else if (l.type === 'fill') p['fill-color'] = /water/.test(id) ? PINTA.agua : /building/.test(id) ? PINTA.edificio : /park|wood|grass|landcover/.test(id) ? PINTA.parque : PINTA.tierra;
      else if (l.type === 'line') p['line-color'] = /water|river/.test(id) ? PINTA.agua : /boundary|admin/.test(id) ? PINTA.limite : /motorway|trunk|primary/.test(id) ? PINTA.viaMayor : PINTA.via;
      else if (l.type === 'symbol') { p['text-color'] = PINTA.texto; p['text-halo-color'] = PINTA.halo; p['text-halo-width'] = 1.2;
        if (l.layout && l.layout['text-field']) l.layout['text-field'] = ['coalesce', ['get', 'name:es'], ['get', 'name']];
        if (l.layout) delete l.layout['icon-image']; }
      if (p['fill-pattern']) delete p['fill-pattern']; });
    return estilo; };
  const VISTA_PAIS = { center: [-74.6, 5.3], zoom: 6.1 };
  let mapaGL = null, marcadores = {}, datosLugares = null;
  const ficha = $('.ficha');
  const mostrarFicha = (l) => { ficha.replaceChildren();
    const r = document.createElement('span'); r.className = 'rotulo'; r.textContent = l.ciudad;
    const h = document.createElement('h3'); h.textContent = l.lugar;
    const c = document.createElement('p'); c.className = 'cuando' + (l.cuando ? '' : ' pendiente'); c.textContent = l.cuando || 'Fecha por confirmar';
    ficha.append(r, h, c);
    if (l.eventos.length) { const u = document.createElement('ul'); l.eventos.forEach((e) => { const li = document.createElement('li'); li.textContent = e; u.append(li); }); ficha.append(u); }
    if (l.flyer) { const i = document.createElement('img'); i.src = l.flyer; i.alt = `Flyer: ${l.lugar}`; ficha.append(i); }
    ficha.hidden = false; };
  const elegirLugar = (l, boton) => {
    $$('.lugares button').forEach((b) => b.setAttribute('aria-pressed', b === boton));
    Object.entries(marcadores).forEach(([c, m]) => m.getElement().classList.toggle('activo', c === l.ciudad));
    mostrarFicha(l);
    if (mapaGL) mapaGL.flyTo({ center: datosLugares.ciudades[l.ciudad], zoom: l.ciudad === 'Bogotá' ? 10.5 : 11.5, speed: quieto ? 4 : 1.1, curve: 1.5, essential: true });
  };
  (async () => {
    datosLugares = await fetch('datos/lugares.json').then((r) => r.json());
    const lista = $('.lugares');
    datosLugares.lugares.forEach((l) => { const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      const n = document.createElement('b'); n.textContent = l.lugar; const c = document.createElement('span'); c.textContent = l.ciudad;
      const d = document.createElement('small'); d.textContent = [l.cuando || 'Fecha por confirmar', ...l.eventos].join(' · ');
      b.append(n, c, d); b.addEventListener('click', () => elegirLugar(l, b)); li.append(b); lista.append(li); });
    $('.cinta-mueve').textContent = `Compartió tarima con   ${datosLugares.compartio.join('   ·   ')}   ·   `.repeat(2);
    if (!window.maplibregl) return;
    const estilo = repintar(await fetch('https://tiles.openfreemap.org/styles/positron').then((r) => r.json()));
    mapaGL = new maplibregl.Map({ container: 'mapa', style: estilo, ...VISTA_PAIS, minZoom: 4.5, maxZoom: 15,
      attributionControl: { compact: true }, cooperativeGestures: true, dragRotate: false, pitchWithRotate: false,
      locale: { 'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + rueda para acercar el mapa',
        'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + rueda para acercar el mapa',
        'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa',
        'NavigationControl.ZoomIn': 'Acercar', 'NavigationControl.ZoomOut': 'Alejar' } });
    mapaGL.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapaGL.touchZoomRotate.disableRotation();
    // lejos solo se leen las ciudades principales; al acercarse aparecen los pueblos de la sabana
    const cerca = () => $('#mapa').classList.toggle('cerca', mapaGL.getZoom() >= 8.6); mapaGL.on('zoom', cerca); cerca();
    const porCiudad = {}; datosLugares.lugares.forEach((l) => (porCiudad[l.ciudad] = porCiudad[l.ciudad] || []).push(l));
    Object.entries(porCiudad).forEach(([ciudad, ls]) => {
      const el = document.createElement('button'); el.type = 'button'; el.className = 'pin' + (['Bogotá', 'Tocancipá', 'Medellín', 'Ibagué', 'Sibaté'].includes(ciudad) ? ' mayor' : ''); el.setAttribute('aria-label', `${ciudad}: ${ls.length} lugar${ls.length > 1 ? 'es' : ''}`);
      const punto = document.createElement('i'); const nom = document.createElement('b'); nom.textContent = ls.length > 1 ? `${ciudad} · ${ls.length}` : ciudad; el.append(punto, nom);
      el.addEventListener('click', () => { const b = $$('.lugares button').find((x) => $('span', x).textContent === ciudad); elegirLugar(ls[0], b); if (b) b.scrollIntoView({ block: 'nearest' }); });
      marcadores[ciudad] = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(datosLugares.ciudades[ciudad]).addTo(mapaGL); });
  })();

  // ───── En imágenes: carrete que se arrastra + visor ─────
  const FOTOS = [['retrato-negro', 'Retrato'], ['a001-violeta', 'La cabina del container'], ['visuales-2', 'En vivo, frente a los visuales'], ['malla', 'Retrato'],
    ['container-blanco', 'El container lleno'], ['umbra-cdj', 'UMBRA CLUB'], ['tomine', 'La sabana'], ['pista', 'La pista'], ['grafiti', 'Retrato'],
    ['visuales-3', 'En vivo'], ['container-cdj', 'El container'], ['retrato-chaqueta', 'La sabana'], ['estudio', 'UMBRA ESTUDIO'], ['tomine-lejos', 'La sabana']];
  const carrete = $('.carrete'), visor = $('.visor');
  FOTOS.forEach(([n, t]) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', `Ver grande: ${t}`);
    const i = document.createElement('img'); i.className = 'foto'; i.src = `img/${n}.jpg`; i.alt = t; i.loading = 'lazy';
    const s = document.createElement('span'); s.textContent = t; b.append(i, s);
    b.addEventListener('click', () => { if (movido) return; $('img', visor).src = i.src; $('img', visor).alt = t; $('p', visor).textContent = ['retrato-negro','retrato-chaqueta','tomine'].includes(n) ? `${t} · Foto: José Luis` : t; destello(.3); visor.showModal(); });
    carrete.append(b); });
  $('.cerrar', visor).addEventListener('click', () => visor.close());
  visor.addEventListener('click', (e) => { if (e.target === visor) visor.close(); });
  let arrastre = null, movido = false;
  carrete.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; arrastre = { x: e.clientX, s: carrete.scrollLeft }; movido = false; });
  addEventListener('pointermove', (e) => { if (!arrastre) return; const d = e.clientX - arrastre.x; if (Math.abs(d) > 6) { movido = true; carrete.classList.add('arrastrando'); }
    carrete.scrollLeft = arrastre.s - d; });
  addEventListener('pointerup', () => { arrastre = null; carrete.classList.remove('arrastrando'); setTimeout(() => movido = false, 0); });

  // ───── Próximos toques ─────
  (async () => {
    const d = await fetch('datos/fechas.json').then((r) => r.json()), lista = $('.fechas');
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const prox = d.fechas.map((f) => ({ ...f, dia: new Date(f.fecha + 'T00:00:00') })).filter((f) => f.dia >= hoy).sort((a, b) => a.dia - b.dia);
    if (!prox.length) { const li = document.createElement('li'); li.className = 'vacia'; li.textContent = 'Sin fechas anunciadas todavía. Pide la tuya en Booking.'; lista.append(li); return; }
    const faltan = Math.round((prox[0].dia - hoy) / 864e5); $('.cuenta').textContent = faltan === 0 ? 'Hoy' : `· faltan ${faltan} días`;
    const mes = new Intl.DateTimeFormat('es-CO', { month: 'long' }), sem = new Intl.DateTimeFormat('es-CO', { weekday: 'long' });
    prox.forEach((f) => { const li = document.createElement('li');
      const dia = document.createElement('span'); dia.className = 'dia'; dia.textContent = f.dia.getDate();
      const sm = document.createElement('small'); sm.textContent = `${mes.format(f.dia)} · ${sem.format(f.dia)}`; dia.append(sm);
      const q = document.createElement('span'); q.className = 'lugar'; q.textContent = f.lugar;
      if (f.ejemplo) { const e = document.createElement('span'); e.className = 'etiqueta'; e.textContent = 'EJEMPLO'; q.append(e); }
      const s = document.createElement('small'); s.textContent = `${f.ciudad} · ${f.hora}`; q.append(s);
      const b = document.createElement(f.boletas ? 'a' : 'span'); b.className = 'boletas'; b.textContent = f.boletas ? 'Boletas' : 'Pronto boletas';
      if (f.boletas) { b.href = f.boletas; b.target = '_blank'; b.rel = 'noopener'; }
      li.append(dia, q, b); lista.append(li); });
  })();

  // ───── Booking: WhatsApp con el mensaje escrito ─────
  $('.formulario').addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(e.target);
    const fecha = f.get('fecha') ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(f.get('fecha') + 'T00:00:00')) : '';
    const texto = `Hola EXCESS, quiero contratarte.\nFecha: ${fecha}\nCiudad: ${f.get('ciudad')}\nEvento: ${f.get('evento')}`;
    open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener'); });

  // ───── La consola: SoundCloud por postMessage ─────
  const sc = $('.sc'), ORIGEN = 'https://w.soundcloud.com';
  const llamar = (method, value) => sc.contentWindow.postMessage(JSON.stringify(value === undefined ? { method } : { method, value }), ORIGEN);
  let sonidos = [], actual = -1, pos = 0, dur = 0, sonando = false, onda = null, intentos = 0;
  addEventListener('message', (e) => { if (e.origin !== ORIGEN) return; let m; try { m = JSON.parse(e.data); } catch { return; }
    if (m.method === 'ready') { ['playProgress', 'play', 'pause', 'finish'].forEach((ev) => llamar('addEventListener', ev)); llamar('getSounds'); }
    else if (m.method === 'getSounds') { const l = m.value || [], ok = l.filter((s) => s && s.title);
      if (ok.length < l.length && intentos++ < 8) setTimeout(() => llamar('getSounds'), 900); sonidos = ok; pintarSets(); if (actual < 0 && sonidos.length) preparar(0); }
    else if (m.method === 'playProgress' && m.value) pos = m.value.currentPosition;
    else if (m.method === 'play') { sonando = true; estadoPlay(); }
    else if (m.method === 'pause' || m.method === 'finish') { sonando = false; estadoPlay(); } });

  const tituloPista = $('.titulo-pista');
  const ponerTitulo = (t) => { const s = $('span', tituloPista); s.textContent = t; tituloPista.classList.remove('largo');
    if (s.offsetWidth > tituloPista.clientWidth) { tituloPista.classList.add('largo'); s.textContent = `${t}     ·     ${t}`; } };
  const ondaSemilla = (n) => { let x = 11; return Array.from({ length: n }, (_, i) => { x = (x * 16807) % 2147483647; return Math.min(1, .3 + (x / 2147483647) * .5 + (i % 6 ? 0 : .25)); }); };
  const cargarOnda = async (s) => { try { const r = await fetch(s.waveform_url.replace(/\.png(\?.*)?$/, '.json')); const j = await r.json();
      const max = Math.max(...j.samples); onda = j.samples.map((v) => v / max); } catch { onda = ondaSemilla(400); } };
  // Prepara un set sin sonar (el navegador solo deja sonar después de que la persona toca algo)
  const preparar = (i) => { const s = sonidos[i]; if (!s) return; actual = i; pos = 0; dur = s.duration || 0; onda = null; ponerTitulo(s.title); cargarOnda(s); pintarSets();
    $('.play').classList.add('listo'); };
  const tocar = (i) => { preparar(i); llamar('skip', i); };
  const play = $('.play');
  const estadoPlay = () => { play.setAttribute('aria-pressed', sonando); play.setAttribute('aria-label', sonando ? 'Pausar' : 'Reproducir');
    $('.i-play').toggleAttribute('hidden', sonando); $('.i-pausa').toggleAttribute('hidden', !sonando); play.classList.toggle('listo', !sonando && actual >= 0); pintarSets(); };
  let yaSono = false;
  play.addEventListener('click', () => { if (actual < 0) return; if (!yaSono) { yaSono = true; tocar(actual); destello(.25); return; } llamar(sonando ? 'pause' : 'play'); });
  $('.cue').addEventListener('click', () => { if (actual < 0) return; llamar('seekTo', 0); llamar('pause'); pos = 0;
    const c = $('.cue'); c.classList.add('encendido'); setTimeout(() => c.classList.remove('encendido'), 300); });
  const vol = $('.volumen input'); vol.addEventListener('input', () => { llamar('setVolume', +vol.value); $('.volumen output').textContent = vol.value; });
  $$('.pad').forEach((p, i) => p.addEventListener('click', () => { if (!dur || !yaSono) return; pos = dur * i / 8; llamar('seekTo', pos); if (!sonando) llamar('play'); }));
  const hhmmss = (ms) => { const s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return (h ? `${h}:${String(m).padStart(2, '0')}` : String(m).padStart(2, '0')) + ':' + String(x).padStart(2, '0'); };
  const listaSets = $('.lista-sets');
  const pintarSets = () => { listaSets.replaceChildren();
    if (!sonidos.length) { const li = document.createElement('li'); li.className = 'vacia'; li.textContent = 'Conectando con SoundCloud…'; listaSets.append(li); return; }
    sonidos.forEach((s, i) => { const li = document.createElement('li'); li.setAttribute('aria-selected', i === actual); if (i === actual && sonando) li.classList.add('sonando');
      const a = document.createElement('span'); a.textContent = s.title; const sm = document.createElement('small'); sm.textContent = s.genre || 'SoundCloud'; a.append(sm);
      const b = document.createElement('span'); b.className = 'der'; b.textContent = hhmmss(s.duration || 0); li.append(a, b);
      li.addEventListener('click', () => { yaSono = true; tocar(i); }); listaSets.append(li); }); };
  pintarSets();

  // Plato: 1 vuelta = 30 s
  const jog = $('.jog'), plato = $('.jog-plato'); let ang = 0, prev = null, ultimoBusco = 0;
  const angulo = (e) => { const r = jog.getBoundingClientRect(); return Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2) * 180 / Math.PI; };
  jog.addEventListener('pointerdown', (e) => { prev = angulo(e); jog.setPointerCapture(e.pointerId); });
  jog.addEventListener('pointermove', (e) => { if (prev === null) return; let d = angulo(e) - prev; if (d > 180) d -= 360; if (d < -180) d += 360; prev = angulo(e); ang += d;
    if (dur && yaSono) { pos = Math.max(0, Math.min(dur, pos + d / 360 * 30000)); const t = performance.now(); if (t - ultimoBusco > 120) { llamar('seekTo', pos); ultimoBusco = t; } } });
  jog.addEventListener('pointerup', () => { prev = null; if (dur && yaSono) llamar('seekTo', pos); });
  jog.addEventListener('keydown', (e) => { const p = e.key === 'ArrowRight' ? 5000 : e.key === 'ArrowLeft' ? -5000 : 0;
    if (p && dur && yaSono) { e.preventDefault(); pos = Math.max(0, Math.min(dur, pos + p)); llamar('seekTo', pos); ang += p / 30000 * 360; } });
  const lienzo = $('.onda');
  lienzo.addEventListener('click', (e) => { if (!dur || !yaSono) return; pos = dur * e.offsetX / lienzo.clientWidth; llamar('seekTo', pos); });

  let nivel = 0, ultimo = performance.now();
  const ciclo = (ahora) => {
    const dt = Math.min(.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (sonando) pos = Math.min(dur || Infinity, pos + dt * 1000);
    const rel = dur ? pos / dur : 0;
    $('.t-pasado').textContent = hhmmss(pos); $('.t-resta').textContent = '-' + hhmmss(Math.max(0, dur - pos));
    if (sonando && prev === null) ang += dt * 200;
    plato.style.transform = `rotate(${ang}deg)`; jog.setAttribute('aria-valuenow', Math.round(rel * 100));
    const obj = sonando && onda ? onda[Math.min(onda.length - 1, Math.floor(rel * onda.length))] : 0;
    nivel += (obj - nivel) * Math.min(1, dt * 10);
    raiz.style.setProperty('--nivel', (sonando ? nivel * (.75 + .25 * Math.max(0, Math.sin(ahora / 1000 * Math.PI * 5))) : 0).toFixed(3));
    const w = lienzo.clientWidth, h = lienzo.clientHeight, dpr = devicePixelRatio || 1;
    if (w) { if (lienzo.width !== Math.round(w * dpr)) { lienzo.width = Math.round(w * dpr); lienzo.height = Math.round(h * dpr); }
      const c = lienzo.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      const datos = onda || ondaSemilla(400), n = Math.min(datos.length, Math.floor(w / 2)), paso = datos.length / n;
      for (let i = 0; i < n; i++) { const a = datos[Math.floor(i * paso)], bh = Math.max(1, a * (h - 10));
        c.fillStyle = i / n < rel ? '#EFE9E2' : '#433939'; c.fillRect(i * w / n, (h - bh) / 2, Math.max(1, w / n - .6), bh); }
      c.fillStyle = '#fff'; c.fillRect(rel * w - 1, 0, 2, h); }
    requestAnimationFrame(ciclo);
  };
  requestAnimationFrame(ciclo);

  // ───── Menú: marca el capítulo en el que estás ─────
  const enlaces = $$('.barra nav a');
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) enlaces.forEach((a) => a.classList.toggle('activo', a.getAttribute('href') === '#' + e.target.id)); }),
    { rootMargin: '-45% 0px -50% 0px' });
  $$('#historia, #sonido, #escuchar, #umbra, #fechas').forEach((s) => io.observe(s));

  // ───── Movimiento (GSAP): entrada, apariciones y la línea de tiempo ─────
  const movimiento = () => {
    if (!window.gsap || quieto) return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.monumento', { y: 70, opacity: 0, duration: 1.1, ease: 'expo.out', delay: .1, clearProps: 'transform,opacity' });  // se anima el bloque: si se mueve el span, Chrome deja de pintar las letras con foto
    gsap.from('.portada-retrato', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', delay: .35 });
    gsap.from('.portada-texto > *', { y: 24, opacity: 0, duration: .8, stagger: .08, ease: 'power3.out', delay: .5 });
    setTimeout(() => destello(.35), 250);
    $$('.capitulo').forEach((sec) => { const els = $$('.revela', sec); if (!els.length) return;
      gsap.from(els, { y: 28, opacity: 0, duration: .8, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: sec, start: 'top 78%', once: true } }); });
    ScrollTrigger.matchMedia({ '(min-width: 901px)': () => {
      const pista = $('.linea-pista'), largo = () => pista.scrollWidth - innerWidth + 48;
      gsap.to(pista, { x: () => -largo(), ease: 'none', scrollTrigger: { trigger: '.linea', start: 'top top', end: () => '+=' + largo(), pin: '.linea-pin', scrub: .6, invalidateOnRefresh: true,
        onUpdate: (st) => $('.linea').style.setProperty('--avance', st.progress.toFixed(3)) } });
    } });
  };

  const listo = () => { ajustarNombres(); window.ScrollTrigger && ScrollTrigger.refresh(); };
  document.fonts.ready.then(() => { ajustarNombres(); movimiento(); });
  addEventListener('resize', listo); ajustarNombres();
})();

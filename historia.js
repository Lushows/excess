// EXCESS · la historia. Se lee bajando; cada capítulo acerca al visitante a contratarlo.
// Consola: el reproductor oficial de SoundCloud controlado por postMessage. Movimiento: GSAP + ScrollTrigger.
(() => {
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

  // ───── Dónde ha sonado: lista + mapa + cinta ─────
  const ns = 'http://www.w3.org/2000/svg', svgEl = (t, at) => { const e = document.createElementNS(ns, t); for (const k in at) e.setAttribute(k, at[k]); return e; };
  const mapa = $('.mapa'); let vb = null, vbMeta = null, puntos = {};
  const enfocar = (ciudad) => { const p = puntos[ciudad]; if (!p) return; const r = ciudad === 'Medellín' || ciudad === 'Ibagué' ? 110 : 60;
    vbMeta = [p[0] - r, p[1] - r * 1.25, r * 2, r * 2.5];
    $$('g', mapa).forEach((g) => { const si = g.dataset.ciudad === ciudad; g.classList.toggle('activa', si); g.style.opacity = si ? 1 : .45; $('text', g).style.fontSize = (r * .17) + 'px'; }); };
  (async () => {
    const [h, m] = await Promise.all([fetch('datos/historial.json').then((r) => r.json()), fetch('datos/mapa.json').then((r) => r.json())]);
    puntos = m.lugares; const [, , W, H] = m.viewBox.split(' ').map(Number); vb = [0, 0, W, H]; mapa.setAttribute('viewBox', vb.join(' '));
    for (let x = 0; x <= W; x += 50) mapa.append(svgEl('line', { x1: x, y1: 0, x2: x, y2: H, class: 'reja' }));
    for (let y = 0; y <= H; y += 50) mapa.append(svgEl('line', { x1: 0, y1: y, x2: W, y2: y, class: 'reja' }));
    mapa.append(svgEl('path', { d: m.pais, class: 'pais' }));
    [...new Set(h.lugares.map((l) => l.ciudad))].forEach((c) => { const p = m.lugares[c]; if (!p) return; const g = svgEl('g', { 'data-ciudad': c });
      g.append(svgEl('circle', { cx: p[0], cy: p[1], r: 4, class: 'onda-p' }), svgEl('circle', { cx: p[0], cy: p[1], r: 3, class: 'punto' }));
      const t = svgEl('text', { x: p[0] + 6, y: p[1] - 6 }); t.textContent = c; g.append(t); mapa.append(g); });
    const lista = $('.lugares');
    h.lugares.filter((l) => l.lugar !== 'Fiestas en la sabana' && l.lugar !== 'Presentación').forEach((l, i) => {
      const li = document.createElement('li'); li.tabIndex = 0; li.setAttribute('aria-selected', i === 0);
      const a = document.createElement('div'); const b = document.createElement('b'); b.textContent = l.lugar; a.append(b);
      if (l.detalle) { const s = document.createElement('small'); s.textContent = l.detalle; a.append(s); }
      const c = document.createElement('span'); c.textContent = l.ciudad; li.append(a, c);
      const elegir = () => { $$('li', lista).forEach((x) => x.setAttribute('aria-selected', x === li)); enfocar(l.ciudad); };
      li.addEventListener('click', elegir); li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(); } });
      lista.append(li); });
    const otras = h.lugares.filter((l) => l.lugar === 'Fiestas en la sabana' || l.lugar === 'Presentación').map((l) => l.ciudad);
    if (otras.length) { const li = document.createElement('li'); li.tabIndex = 0; const a = document.createElement('div'); const b = document.createElement('b');
      b.textContent = 'Fiestas y eventos'; const s = document.createElement('small'); s.textContent = otras.join(' · '); a.append(b, s);
      const c = document.createElement('span'); c.textContent = 'Sabana y más'; li.append(a, c);
      li.addEventListener('click', () => { $$('li', lista).forEach((x) => x.setAttribute('aria-selected', x === li)); enfocar('Zipaquirá'); }); lista.append(li); }
    enfocar(h.lugares[0].ciudad);
    $('.cinta-mueve').textContent = `Compartió tarima con   ${h.compartio.join('   ·   ')}   ·   `.repeat(2);
  })();

  // ───── En imágenes: carrete que se arrastra + visor ─────
  const FOTOS = [['retrato-negro', 'Retrato'], ['a001-violeta', 'La cabina del container'], ['visuales-2', 'En vivo, frente a los visuales'], ['malla', 'Retrato'],
    ['container-blanco', 'El container lleno'], ['umbra-cdj', 'UMBRA CLUB'], ['tomine', 'La sabana'], ['pista', 'La pista'], ['grafiti', 'Retrato'],
    ['visuales-3', 'En vivo'], ['container-cdj', 'El container'], ['retrato-chaqueta', 'La sabana'], ['estudio', 'UMBRA ESTUDIO'], ['tomine-lejos', 'La sabana']];
  const carrete = $('.carrete'), visor = $('.visor');
  FOTOS.forEach(([n, t]) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', `Ver grande: ${t}`);
    const i = document.createElement('img'); i.className = 'foto'; i.src = `img/${n}.jpg`; i.alt = t; i.loading = 'lazy';
    const s = document.createElement('span'); s.textContent = t; b.append(i, s);
    b.addEventListener('click', () => { if (movido) return; $('img', visor).src = i.src; $('img', visor).alt = t; $('p', visor).textContent = t; destello(.3); visor.showModal(); });
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
        c.fillStyle = i / n < rel ? '#e9e7e2' : '#3c3c3c'; c.fillRect(i * w / n, (h - bh) / 2, Math.max(1, w / n - .6), bh); }
      c.fillStyle = '#fff'; c.fillRect(rel * w - 1, 0, 2, h); }
    if (vb && vbMeta) { vb = vb.map((v, i) => v + (vbMeta[i] - v) * Math.min(1, dt * 4)); mapa.setAttribute('viewBox', vb.map((v) => v.toFixed(1)).join(' ')); }
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

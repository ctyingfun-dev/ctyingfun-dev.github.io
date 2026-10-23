(() => {
  'use strict';
  const field = document.querySelector('.math-rain');
  const header = document.querySelector('.masthead');
  const toggle = document.querySelector('.rain-toggle');
  if (!field || !header || !toggle || !window.Matter) return;

  const { Engine, Bodies, Body, Composite, Sleeping } = Matter;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = 1;
  const kinds = ['plus', 'x', 'times', 'a', 'equal', 'b', 'minus', 'n', 'divide', 'y', 'plus', 'x', 'equal', 'c', 'minus', 'times'];
  const colours = ['--rain-blue', '--rain-orange', '--rain-pink', '--rain-yellow', '--rain-black', '--rain-grey'];
  const shapes = {
    plus: '<path d="M18 50h64M50 18v64" fill="none" stroke="currentColor" stroke-width="26"/>',
    minus: '<rect x="5" y="37" width="90" height="26" rx="13"/>',
    equal: '<rect x="6" y="22" width="88" height="22" rx="11"/><rect x="6" y="56" width="88" height="22" rx="11"/>',
    times: '<path d="M22 22l56 56M78 22 22 78" fill="none" stroke="currentColor" stroke-width="26"/>',
    divide: '<rect x="5" y="39" width="90" height="22" rx="11"/><circle cx="50" cy="18" r="11"/><circle cx="50" cy="82" r="11"/>',
    x: '<path d="m28 26 44 56m0-56L28 82" fill="none" stroke="currentColor" stroke-width="22"/>',
    a: '<g fill="none" stroke="currentColor" stroke-width="18"><ellipse cx="45" cy="58" rx="22" ry="25"/><path d="M68 31v53"/></g>',
    b: '<g fill="none" stroke="currentColor" stroke-width="18"><path d="M28 13v73"/><circle cx="50" cy="61" r="23"/></g>',
    n: '<path d="M25 30v56M25 53c0-31 45-31 45 0v33" fill="none" stroke="currentColor" stroke-width="20"/>',
    y: '<path d="m24 28 24 36m28-36L43 86" fill="none" stroke="currentColor" stroke-width="20"/>',
    c: '<path d="M74 38C37 8 14 72 47 84c11 4 21-2 27-9" fill="none" stroke="currentColor" stroke-width="20"/>'
  };
  let pieces = [];
  let width = 0;
  let height = 0;
  let frame = 0;
  let previous = 0;
  let accumulator = 0;
  let visible = true;
  let paused = false;
  let resizing = 0;
  const step = 1000 / 60;

  function draw() {
    for (const { body, node, size } of pieces) {
      node.style.transform = `translate(${body.position.x - size / 2}px, ${body.position.y - size / 2}px) rotate(${body.angle}rad)`;
    }
  }

  function tick(now) {
    frame = 0;
    if (paused || reduced.matches || forced.matches || !visible || document.hidden) return;
    accumulator += Math.min(now - (previous || now), 64);
    previous = now;
    while (accumulator >= step) {
      Engine.update(engine, step);
      accumulator -= step;
    }
    draw();
    if (pieces.some(piece => !piece.body.isSleeping)) frame = requestAnimationFrame(tick);
    else previous = 0;
  }

  function start() {
    if (frame || paused || reduced.matches || forced.matches || !visible || document.hidden) return;
    previous = 0;
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    accumulator = 0;
  }

  function bodyFor(kind, x, y, size) {
    const unit = size / 100;
    const rect = (dx, dy, w, h, angle = 0) => Bodies.rectangle(x + dx * unit, y + dy * unit, w * unit, h * unit, {
      angle,
      chamfer: { radius: Math.min(w, h) * unit * .45 }
    });
    let parts;
    if (kind === 'plus') parts = [rect(0, 0, 26, 90), rect(0, 0, 90, 26)];
    else if (kind === 'times') parts = [rect(0, 0, 26, 105, Math.PI / 4), rect(0, 0, 26, 105, -Math.PI / 4)];
    else if (kind === 'equal') parts = [rect(0, -17, 88, 22), rect(0, 17, 88, 22)];
    else if (kind === 'divide') parts = [rect(0, 0, 90, 22), Bodies.circle(x, y - 32 * unit, 11 * unit), Bodies.circle(x, y + 32 * unit, 11 * unit)];
    else if (kind === 'minus') parts = [rect(0, 0, 90, 26)];
    else parts = [rect(0, 4, 64, 80)];
    const body = Body.create({
      parts,
      friction: .65,
      frictionStatic: .9,
      frictionAir: .015,
      restitution: .18,
      sleepThreshold: 75
    });
    Body.setAngle(body, (Math.random() - .5) * 2.2);
    Body.setVelocity(body, { x: (Math.random() - .5) * 5, y: Math.random() * 1.5 });
    Body.setAngularVelocity(body, (Math.random() - .5) * .07);
    return body;
  }

  function build() {
    stop();
    width = header.clientWidth;
    height = header.clientHeight;
    if (!width || !height) return;
    Composite.clear(engine.world, false);
    Engine.clear(engine);
    field.replaceChildren();
    field.dataset.physics = '';
    pieces = [];
    const mobile = width < 600;
    const count = mobile ? 14 : width < 900 ? 22 : 30;
    const order = [...kinds];
    for (let index = order.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [order[index], order[other]] = [order[other], order[index]];
    }
    for (let index = 0; index < count; index++) {
      const kind = order[index % order.length];
      const size = Math.round((mobile ? 46 : 74) + Math.random() * (mobile ? 52 : 92));
      let x;
      let y;
      // Scatter in a volume above the field, not in vertical drop lanes.
      for (let attempt = 0; attempt < 100; attempt++) {
        x = size * .65 + Math.random() * (width - size * 1.3);
        y = -size - Math.random() * 410;
        if (!pieces.some(piece => Math.hypot(x - piece.body.position.x, y - piece.body.position.y) < (size + piece.size) * .57)) break;
      }
      const node = document.createElement('span');
      node.dataset.kind = kind;
      node.style.color = `var(${colours[Math.floor(Math.random() * colours.length)]})`;
      node.style.width = `${size}px`;
      node.style.height = `${size}px`;
      node.innerHTML = `<svg viewBox="0 0 100 100" fill="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[kind]}</svg>`;
      const body = bodyFor(kind, x, y, size);
      pieces.push({ body, node, size, kicked: -Infinity });
      field.append(node);
    }
    Composite.add(engine.world, [
      ...pieces.map(piece => piece.body),
      Bodies.rectangle(width / 2, height + 40, width + 160, 80, { isStatic: true, friction: .8 }),
      Bodies.rectangle(-40, height / 2 - 200, 80, height + 600, { isStatic: true }),
      Bodies.rectangle(width + 40, height / 2 - 200, 80, height + 600, { isStatic: true }),
      Bodies.rectangle(width / 2, -650, width + 160, 80, { isStatic: true })
    ]);
    if (reduced.matches || forced.matches) {
      // Settle offscreen synchronously; reduced motion never shows falling travel.
      for (let index = 0; index < 900; index++) Engine.update(engine, step);
      for (const piece of pieces) Sleeping.set(piece.body, true);
    }
    draw();
    syncToggle();
    start();
  }

  function syncToggle() {
    toggle.hidden = reduced.matches || forced.matches;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? '繼續圖案動畫' : '暫停圖案動畫');
    toggle.querySelector('.tooltip').textContent = paused ? '繼續動畫' : '暫停動畫';
  }

  function lift(event) {
    if (paused || reduced.matches || forced.matches || event.target.closest('button, a')) return;
    if (event.type === 'pointermove' && event.pointerType === 'touch') return;
    const bounds = header.getBoundingClientRect();
    const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    const now = performance.now();
    let lifted = 0;
    for (const piece of pieces) {
      const dx = piece.body.position.x - point.x;
      const dy = piece.body.position.y - point.y;
      if (dx * dx + dy * dy > (piece.size * .5 + 18) ** 2 || now - piece.kicked < 500) continue;
      Sleeping.set(piece.body, false);
      Body.setVelocity(piece.body, { x: Math.max(-4, Math.min(4, dx * .08)), y: -(9 + piece.size / 25) });
      Body.setAngularVelocity(piece.body, Math.max(-.09, Math.min(.09, dx * .003)));
      piece.kicked = now;
      if (++lifted === 3) break;
    }
    if (lifted) start();
  }

  header.addEventListener('pointermove', lift, { passive: true });
  header.addEventListener('pointerdown', lift, { passive: true });
  toggle.addEventListener('click', () => {
    paused = !paused;
    syncToggle();
    if (paused) stop();
    else start();
  });
  new ResizeObserver(() => {
    if (header.clientWidth === width && header.clientHeight === height) return;
    clearTimeout(resizing);
    resizing = setTimeout(build, 120);
  }).observe(header);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) start();
    else stop();
  }).observe(header);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
  reduced.addEventListener('change', build);
  forced.addEventListener('change', build);
  build();
})();

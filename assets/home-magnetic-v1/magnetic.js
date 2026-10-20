(() => {
  const RANGE = 80;
  const MAX_OFFSET = 14;
  const FOLLOW = 0.15;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
  let pointer = null;
  let frame = 0;
  let down = null;

  const states = [...document.querySelectorAll('.open-arrow, .back-top')].map(button => {
    const anchor = document.createElement('span');
    anchor.className = `magnet-anchor${button.matches('.open-arrow') ? ' lesson-magnet' : ''}`;
    button.replaceWith(anchor);
    anchor.append(button);
    button.classList.add('magnet-button');
    const face = document.createElement('span');
    face.className = 'magnet-face';
    face.setAttribute('aria-hidden', 'true');
    [...button.children].filter(child => !child.matches('.tooltip')).forEach(child => face.append(child));
    const fill = document.createElement('span');
    fill.className = 'magnet-fill';
    face.prepend(fill);
    button.prepend(face);
    return {button, anchor, face, fill, x:0, y:0, near:false, hovered:false, spring:null, fillAnimation:null, pressAnimation:null};
  });

  function direction(rect, point) {
    const dx = point.x - (rect.left + rect.width / 2);
    const dy = point.y - (rect.top + rect.height / 2);
    if (Math.abs(dx / rect.width) > Math.abs(dy / rect.height)) return dx < 0 ? 'left' : 'right';
    return dy < 0 ? 'top' : 'bottom';
  }
  function outside(side) {
    return {left:'translateX(-101%)',right:'translateX(101%)',top:'translateY(-101%)',bottom:'translateY(101%)'}[side];
  }
  function paintHover(state, hovered, side = 'left', instant = false) {
    if (state.hovered === hovered) return;
    state.hovered = hovered;
    state.button.toggleAttribute('data-magnet-hover', hovered);
    state.button.dataset.fillDirection = side;
    const current = getComputedStyle(state.fill).transform;
    const interrupted = state.fillAnimation?.playState === 'running';
    state.fillAnimation?.cancel();
    const target = hovered ? 'translate(0, 0)' : outside(side);
    state.fill.style.transform = target;
    if (!instant && !reduced.matches && fine.matches) {
      state.fillAnimation = state.fill.animate([
        {transform: hovered && !interrupted ? outside(side) : current},
        {transform: target}
      ], {duration:hovered ? 220 : 160, easing:ease});
    }
  }
  function render(state) {
    state.button.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
  }
  function start() {
    if (!frame) frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = 0;
    let moving = false;
    const mouse = pointer && fine.matches;
    for (const state of states) {
      const rect = state.anchor.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        resetState(state);
        continue;
      }
      const dx = mouse ? pointer.x - (rect.left + rect.width / 2) : 0;
      const dy = mouse ? pointer.y - (rect.top + rect.height / 2) : 0;
      // Measure the 80px halo from the untransformed anchor, not the moving face.
      const distance = mouse ? Math.hypot(Math.max(Math.abs(dx) - rect.width / 2, 0), Math.max(Math.abs(dy) - rect.height / 2, 0)) : Infinity;
      const near = mouse && !reduced.matches && distance <= RANGE;
      const visual = state.button.getBoundingClientRect();
      const hovered = mouse && pointer.x >= visual.left && pointer.x <= visual.right && pointer.y >= visual.top && pointer.y <= visual.bottom;
      paintHover(state, hovered, mouse ? direction(rect, pointer) : 'left');
      if (near) {
        state.spring = null;
        const length = Math.hypot(dx, dy);
        const amount = MAX_OFFSET * (1 - distance / RANGE) * Math.min(length / (rect.width / 2), 1);
        const targetX = length ? dx / length * amount : 0;
        const targetY = length ? dy / length * amount : 0;
        state.x += (targetX - state.x) * FOLLOW;
        state.y += (targetY - state.y) * FOLLOW;
        moving ||= Math.hypot(targetX - state.x, targetY - state.y) > .01;
      } else {
        if (state.near) state.spring = {x:state.x, y:state.y, start:now};
        if (state.spring) {
          const t = (now - state.spring.start) / 1000;
          // A damped return crosses home slightly, then settles without a long wobble.
          const factor = Math.exp(-14 * t) * (Math.cos(22 * t) + 14 / 22 * Math.sin(22 * t));
          state.x = state.spring.x * factor;
          state.y = state.spring.y * factor;
          if (t >= .48) {
            state.x = state.y = 0;
            state.spring = null;
          } else moving = true;
        }
      }
      state.near = near;
      render(state);
    }
    if (moving) start();
  }
  function resetState(state) {
    state.x = state.y = 0;
    state.near = false;
    state.spring = null;
    state.fillAnimation?.cancel();
    state.pressAnimation?.cancel();
    state.hovered = false;
    state.button.removeAttribute('data-magnet-hover');
    state.button.removeAttribute('data-magnet-down');
    state.button.closest('.lesson')?.removeAttribute('data-magnet-press');
    state.face.style.transform = 'scale(1)';
    state.fill.style.transform = outside('left');
    render(state);
  }
  function reset() {
    pointer = null;
    down = null;
    cancelAnimationFrame(frame);
    frame = 0;
    states.forEach(resetState);
  }
  function release() {
    if (!down) return;
    const state = down;
    down = null;
    state.button.removeAttribute('data-magnet-down');
    state.button.closest('.lesson')?.removeAttribute('data-magnet-press');
    const current = getComputedStyle(state.face).transform;
    state.pressAnimation?.cancel();
    state.face.style.transform = 'scale(1)';
    if (!reduced.matches) {
      state.pressAnimation = state.face.animate([
        {transform:current}, {transform:'scale(1.012)', offset:.65}, {transform:'scale(1)'}
      ], {duration:220, easing:ease});
    }
    if (!pointer) paintHover(state, false, 'left', true);
  }
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    pointer = {x:event.clientX, y:event.clientY};
    start();
  }, {passive:true});
  document.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    if (event.pointerType !== 'mouse') reset();
    const state = states.find(item => {
      const rect = item.button.getBoundingClientRect();
      return rect.width && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    });
    if (!state) return;
    down = state;
    state.button.setAttribute('data-magnet-down', '');
    state.button.closest('.lesson')?.setAttribute('data-magnet-press', '');
    const current = getComputedStyle(state.face).transform;
    state.pressAnimation?.cancel();
    state.face.style.transform = reduced.matches ? 'scale(1)' : 'scale(.96)';
    if (!reduced.matches) state.pressAnimation = state.face.animate([{transform:current},{transform:'scale(.96)'}], {duration:90,easing:ease});
    if (event.pointerType !== 'mouse') paintHover(state, true, 'left', true);
  });
  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', reset);
  document.documentElement.addEventListener('pointerleave', () => { pointer = null; release(); start(); });
  document.addEventListener('keydown', reset);
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', reset);
  window.addEventListener('scroll', reset, {passive:true});
  window.addEventListener('resize', reset, {passive:true});
  reduced.addEventListener('change', reset);
  fine.addEventListener('change', reset);
  new MutationObserver(reset).observe(document.querySelector('main'), {subtree:true,attributes:true,attributeFilter:['hidden']});
})();

(() => {
  'use strict';
  if (document.body.dataset.topic !== 'percentages') return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('keydown', event => {
    if (['Tab','Enter',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) document.body.classList.add('keyboard-input');
  });
  document.addEventListener('pointerdown', () => document.body.classList.remove('keyboard-input'), { passive:true });
  for (const section of document.querySelectorAll('main > section')) {
    const sequence = section.querySelector(':scope > .teaching-sequence');
    const mount = section.querySelector('.sequence-mount');
    if (sequence && mount) mount.append(sequence);
    sequence?.addEventListener('click', event => {
      if (event.detail === 0) sequence.querySelector('.sequence-equation').getAnimations().forEach(animation => animation.cancel());
    });
  }
  for (const group of document.querySelectorAll('.segments')) {
    const indicator = document.createElement('span');
    indicator.className = 'segment-indicator no-transition';
    indicator.setAttribute('aria-hidden', 'true');
    group.prepend(indicator);
    group.classList.add('has-indicator');
    const position = (instant = false) => {
      const active = group.querySelector('button[aria-pressed=true]');
      if (!active) return;
      const box = active.getBoundingClientRect();
      const parent = group.getBoundingClientRect();
      indicator.classList.toggle('no-transition', instant || reduced.matches);
      indicator.style.width = `${box.width}px`;
      indicator.style.height = `${box.height}px`;
      indicator.style.transform = `translate(${box.left - parent.left - group.clientLeft}px, ${box.top - parent.top - group.clientTop}px)`;
    };
    position(true);
    group.addEventListener('click', event => { if (event.target.closest('button')) position(event.detail === 0); });
    new ResizeObserver(() => position(true)).observe(group);
  }
  const original = document.getElementById('original');
  const error = document.getElementById('change-error');
  original.setAttribute('aria-describedby', error.id);
  const syncValidation = () => original.setAttribute('aria-invalid', String(error.textContent.trim().length > 0));
  original.addEventListener('input', syncValidation);
  syncValidation();
})();

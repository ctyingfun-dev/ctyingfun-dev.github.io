(() => {
  'use strict';
  if (document.body.dataset.topic !== 'interest') return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  for (const section of document.querySelectorAll('main > section')) {
    const sequence = section.querySelector(':scope > .teaching-sequence');
    const mount = section.querySelector('.sequence-mount');
    if (sequence && mount) mount.append(sequence);
    sequence?.addEventListener('click', event => {
      if (event.detail === 0) {
        sequence.querySelector('.sequence-equation').getAnimations().forEach(animation => animation.cancel());
      }
    });
  }
  for (const group of document.querySelectorAll('.segments')) {
    const indicator = document.createElement('span');
    indicator.className = 'segment-indicator no-transition';
    indicator.setAttribute('aria-hidden', 'true');
    group.prepend(indicator);
    group.classList.add('has-indicator');
    function position(instant = false) {
      const active = group.querySelector('button[aria-pressed=true]');
      if (!active) return;
      indicator.classList.toggle('no-transition', instant || reduce.matches);
      const box = active.getBoundingClientRect();
      const parent = group.getBoundingClientRect();
      const border = group.clientLeft;
      indicator.style.width = `${box.width}px`;
      indicator.style.height = `${box.height}px`;
      indicator.style.transform = `translate(${box.left - parent.left - border}px, ${box.top - parent.top - border}px)`;
    }
    position(true);
    group.addEventListener('click', event => {
      if (event.target.closest('button')) position(event.detail === 0);
    });
    const observer = new ResizeObserver(() => position(true));
    observer.observe(group);
    group.addEventListener('pointerdown', () => {
      indicator.classList.remove('no-transition');
    });
  }
})();

(() => {
  const nav = document.querySelector('.grade-nav');
  const choices = [...nav.querySelectorAll('.grade-choice')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const highlight = document.createElement('span');
  highlight.className = 'grade-highlight';
  highlight.setAttribute('aria-hidden', 'true');
  const labels = choices.map(choice => {
    const label = document.createElement('span');
    label.className = 'pill-label';
    [...choice.children].forEach(child => label.append(child.cloneNode(true)));
    highlight.append(label);
    return label;
  });
  nav.append(highlight);
  nav.setAttribute('data-pill-ready', '');
  let animation = null;
  let animateNext = false;
  let selected = null;

  function geometry() {
    const parent = nav.getBoundingClientRect();
    const boxes = choices.map(choice => {
      const rect = choice.getBoundingClientRect();
      return {x:rect.left-parent.left,y:rect.top-parent.top,w:rect.width,h:rect.height};
    });
    boxes.forEach((box, index) => Object.assign(labels[index].style, {
      left:`${box.x}px`,top:`${box.y}px`,width:`${box.w}px`,height:`${box.h}px`
    }));
    return {width:parent.width,height:parent.height,boxes};
  }
  function shape(box, bounds) {
    const x = Math.max(4, Math.min(bounds.width - box.w - 4, box.x));
    return `inset(${box.y}px ${Math.max(0,bounds.width-x-box.w)}px ${Math.max(0,bounds.height-box.y-box.h)}px ${x}px round 999px)`;
  }
  function sync(force = false) {
    const index = choices.findIndex(choice=>choice.hasAttribute('aria-current'));
    if (index < 0) return;
    if (!force && selected === index) { animateNext = false; return; }
    const bounds = geometry();
    const target = bounds.boxes[index];
    const prior = getComputedStyle(highlight).clipPath;
    const insets = prior.split('round')[0].match(/-?[\d.]+/g)?.map(Number);
    const values = insets && [
      insets[0], insets[1] ?? insets[0],
      insets[2] ?? insets[0], insets[3] ?? insets[1] ?? insets[0]
    ];
    const from = values
      ? {x:values[3], y:values[0], w:bounds.width-values[1]-values[3], h:bounds.height-values[0]-values[2]}
      : target;
    animation?.cancel();
    const final = shape(target,bounds);
    highlight.style.clipPath = final;
    if (animateNext && !reduced.matches && selected !== null && !force) {
      const distance = target.x-from.x;
      const sign = Math.sign(distance);
      const stretchedWidth = Math.min(bounds.width-8,Math.max(from.w,target.w)+Math.min(26,Math.abs(distance)*.22));
      const stretch = {...target,x:from.x+distance*.55-(sign<0 ? stretchedWidth-target.w : 0),w:stretchedWidth};
      const land = {...target,x:target.x+sign*3,w:target.w*.97};
      animation = highlight.animate([
        {clipPath:prior,offset:0,easing:'cubic-bezier(0.22, 1, 0.36, 1)'},
        {clipPath:shape(stretch,bounds),offset:.52,easing:'cubic-bezier(0.22, 1, 0.36, 1)'},
        {clipPath:shape(land,bounds),offset:.8,easing:'ease-out'},
        {clipPath:final,offset:1}
      ], {duration:300,easing:'linear'});
    }
    selected = index;
    animateNext = false;
  }
  nav.addEventListener('click', event => {
    if (event.target.closest('.grade-choice')) animateNext = event.detail > 0;
  },true);
  new MutationObserver(()=>sync()).observe(nav,{subtree:true,attributes:true,attributeFilter:['aria-current']});
  const settle = () => {animateNext=false; sync(true);};
  document.addEventListener('keydown',settle);
  window.addEventListener('popstate',settle);
  window.addEventListener('hashchange',settle);
  window.addEventListener('resize',settle,{passive:true});
  window.addEventListener('blur',settle);
  document.addEventListener('visibilitychange',settle);
  reduced.addEventListener('change',settle);
  new ResizeObserver(settle).observe(nav);
  document.fonts.ready.then(settle);
  sync(true);
})();

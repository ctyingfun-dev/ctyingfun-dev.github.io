(() => {
  'use strict';
  const zh = document.documentElement.lang === 'zh-Hant';
  const t = (c, e) => zh ? c : e;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const sequences = [];
  const completed = new Set();
  // The same self-hosted Lucide paths used by the similar-triangles lesson.
  const paths = {
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<path d="M9 4v16M15 4v16"/>',
    previous: '<path d="m15 18-6-6 6-6"/>',
    next: '<path d="m9 18 6-6-6-6"/>',
    restart: '<path d="M3 11a9 9 0 1 1 2.7 6.4M3 4v7h7"/>'
  };
  const icon = key => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[key]}</svg>`;
  const plans = {
    concepts: {
      values: ['800', '120', '920'],
      labels: [t('原值 100%', 'Original 100%'), t('增加 15%', 'Increase 15%'), t('新值 115%', 'New amount 115%')],
      equations: ['800 × 15% = 120', '800 + 120 = 920', '800 × 1.15 = 920'],
      captions: [t('先保留原值 800，它是這次的 100%。', 'Keep 800 as the original: this is 100%.'),
        t('15% 是 120；新值要把這 120 加回原值。', '15% is 120. Add this 120 to the original amount.'),
        t('100% 加 15% 是 115%，所以乘 1.15。', '100% plus 15% is 115%, so multiply by 1.15.')]
    },
    'percentage-change': {
      values: ['800', '−200', '−25%'],
      labels: [t('原值', 'Original'), t('變化額', 'Change'), t('百分變化', 'Percentage change')],
      equations: ['600 − 800 = −200', '−200 ÷ 800 = −0.25', '−0.25 × 100% = −25%'],
      captions: [t('先算新值減原值，得到 −200。', 'Subtract the original from the new amount: −200.'),
        t('再除以原值 800；不是除以 600。', 'Divide by the original 800, not by 600.'),
        t('負數表示減少：減少了 25%。', 'The negative sign means a decrease of 25%.')]
    },
    successive: {
      values: ['100', '120', '96'],
      labels: [t('原值', 'Original'), t('增加 20% 後', 'After +20%'), t('再減少 20%', 'Then −20%')],
      equations: ['100 × 1.20 = 120', '120 × 0.80 = 96', '1.20 × 0.80 = 0.96'],
      captions: [t('第一次以 100 為基數，增加 20，得到 120。', 'First use base 100. Add 20 to reach 120.'),
        t('第二次以 120 為基數，減去的是 24。', 'Now the base is 120. The decrease is 24.'),
        t('最後剩下原值的 96%，整體減少 4%。', 'The final amount is 96% of the original: a 4% decrease.')]
    },
    'simple-interest': {
      values: ['5,000', '5,200', '5,400', '5,600'],
      labels: [t('本金', 'Principal'), t('第 1 年', 'Year 1'), t('第 2 年', 'Year 2'), t('第 3 年', 'Year 3')],
      equations: ['5,000 × 4% = 200', '5,000 + 200 = 5,200', '5,200 + 200 = 5,400', '5,000 + 200 × 3 = 5,600'],
      captions: [t('每年都用原本金 5,000 計息。', 'Every year, interest is based on the original 5,000.'),
        t('第一年賺 200，本利和是 5,200。', 'Year 1 earns 200; the balance is 5,200.'),
        t('第二年仍只賺 200，不用 5,200 計息。', 'Year 2 still earns 200: do not calculate interest on 5,200.'),
        t('三年利息共 600；本利和是 5,600。', 'Total interest is 600; the final balance is 5,600.')]
    },
    interest: {
      values: ['5,000', '5,200', '5,408', '5,624.32'],
      labels: [t('本金', 'Principal'), t('第 1 年', 'Year 1'), t('第 2 年', 'Year 2'), t('第 3 年', 'Year 3')],
      equations: ['5,000 × 1.04 = 5,200', '5,200 × 1.04 = 5,408', '5,408 × 1.04 = 5,624.32', '5,624.32 − 5,000 = 624.32'],
      captions: [t('第一年以 5,000 計息，得 5,200。', 'Year 1 starts with 5,000 and ends with 5,200.'),
        t('第二年把已賺的 200 也加入基數。', 'Year 2 includes the 200 already earned in its base.'),
        t('第三年的基數再變成 5,408。', 'Year 3 starts with a new base: 5,408.'),
        t('本利和減本金，才是利息 624.32。', 'Subtract the principal to get interest: 624.32.')]
    },
    'frequent-compounding': {
      values: ['6%', '3%', '4', '9,004.07'],
      labels: [t('名義年利率', 'Nominal annual rate'), t('每半年利率', 'Half-yearly rate'), t('兩年總期數', 'Periods in two years'), t('本利和 HK$', 'Final balance HK$')],
      equations: ['6% ÷ 2 = 3%', '2 × 2 = 4', '8,000 × 1.03 × 1.03 × 1.03 × 1.03', '8,000(1.03)⁴ ≈ 9,004.07'],
      captions: [t('每半年結算，一年分成兩期。', 'Half-yearly compounding means two periods a year.'),
        t('每期利率是 3%，不是每期 6%。', 'The rate per period is 3%, not 6%.'),
        t('兩年共有四期，每期都乘 1.03。', 'There are four periods in two years. Multiply by 1.03 each time.'),
        t('計算過程保留精度，最後才取至一仙。', 'Keep full precision and round to the nearest cent at the end.')]
    }
  };
  const status = document.createElement('p');
  status.className = 'lesson-status';
  status.setAttribute('role', 'status');
  document.querySelector('.intro').append(status);
  const updateStatus = () => status.textContent = t(`已完成 ${completed.size} / ${sequences.length} 段推演`, `${completed.size} / ${sequences.length} explanations completed`);
  class Sequence {
    constructor(section, plan) {
      this.section = section; this.plan = plan; this.index = -1; this.playing = false; this.frame = 0; this.elapsed = 0;
      const root = document.createElement('div');
      root.className = 'teaching-sequence';
      root.setAttribute('role', 'group');
      root.setAttribute('aria-label', t('逐步推演', 'Step-by-step explanation'));
      root.innerHTML = `<ol class="sequence-values">${plan.values.map((value, i) =>
        `<li><span>${plan.labels[i]}</span><strong>${value}</strong></li>`).join('')}</ol>
        <p class="sequence-equation math"></p><p class="sequence-caption" aria-live="polite">${t('先看條件，再逐步推演。', 'Start with the given information, then work through the steps.')}</p>
        <div class="sequence-track" aria-hidden="true"><span></span></div>
        <div class="motion-controls" role="group" aria-label="${t('推演播放控制', 'Explanation playback controls')}">
        <button type="button" data-action="play" class="motion-play">${icon('play')}<span>${t('播放', 'Play')}</span></button>
        <button type="button" data-action="previous" title="${t('上一步', 'Previous step')}" aria-label="${t('上一步', 'Previous step')}">${icon('previous')}</button>
        <span class="step-count"></span>
        <button type="button" data-action="next" title="${t('下一步', 'Next step')}" aria-label="${t('下一步', 'Next step')}">${icon('next')}</button>
        <button type="button" data-action="restart" title="${t('重新開始', 'Restart')}" aria-label="${t('重新開始', 'Restart')}">${icon('restart')}</button></div>`;
      section.querySelector('.section-heading').after(root);
      this.root = root;
      root.addEventListener('click', event => {
        const action = event.target.closest('button')?.dataset.action;
        if (action === 'play') this.playing ? this.pause() : this.play();
        if (action === 'previous') this.seek(this.index - 1);
        if (action === 'next') this.seek(this.index + 1);
        if (action === 'restart') this.seek(-1);
      });
      this.paint();
    }
    paint() {
      const { root, plan, index } = this;
      root.dataset.step = index;
      root.dataset.playing = this.playing;
      root.querySelectorAll('.sequence-values li').forEach((node, i) => {
        node.classList.toggle('is-current', i === Math.max(0, index));
        node.classList.toggle('is-past', i < index);
      });
      root.querySelector('.sequence-equation').textContent = index < 0 ? plan.equations[0] : plan.equations[index];
      root.querySelector('.sequence-caption').textContent = index < 0 ?
        t('先看條件，再逐步推演。', 'Start with the given information, then work through the steps.') : plan.captions[index];
      const play = root.querySelector('[data-action=play]');
      play.innerHTML = icon(this.playing ? 'pause' : 'play') + `<span>${this.playing ? t('暫停', 'Pause') : index === plan.values.length - 1 ? t('重播', 'Replay') : t('播放', 'Play')}</span>`;
      root.querySelector('[data-action=previous]').disabled = index < 0;
      root.querySelector('[data-action=next]').disabled = index === plan.values.length - 1;
      root.querySelector('.step-count').textContent = `${index + 1} / ${plan.values.length}`;
      root.querySelector('.sequence-track span').style.transform = `scaleX(${(index + 1) / plan.values.length})`;
      if (this.lastPaintIndex !== undefined && this.lastPaintIndex !== index && !reduced.matches) {
        root.querySelector('.sequence-equation').animate(
          [{ opacity:.35, transform:'translateY(4px)' }, { opacity:1, transform:'none' }],
          { duration:200, easing:'ease-out' });
      }
      this.lastPaintIndex = index;
      if (index === plan.values.length - 1) {
        completed.add(this.section.id);
        document.querySelector(`.contents a[href="#${this.section.id}"]`).classList.add('is-complete');
        updateStatus();
      }
    }
    pause() { this.playing = false; cancelAnimationFrame(this.frame); this.paint(); }
    seek(index) {
      this.pause(); this.elapsed = 0;
      this.index = Math.max(-1, Math.min(this.plan.values.length - 1, index));
      this.paint();
    }
    play() {
      sequences.forEach(sequence => { if (sequence !== this) sequence.pause(); });
      if (reduced.matches) { this.seek(this.plan.values.length - 1); return; }
      if (this.index === this.plan.values.length - 1) this.index = -1;
      if (this.index < 0) this.index = 0;
      this.playing = true; this.last = performance.now(); this.paint();
      const tick = now => {
        if (!this.playing) return;
        this.elapsed += Math.min(80, now - this.last); this.last = now;
        if (this.elapsed >= 1800) {
          this.elapsed = 0;
          if (this.index === this.plan.values.length - 1) { this.pause(); return; }
          this.index++; this.paint();
        }
        this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    }
  }
  Object.entries(plans).forEach(([id, plan]) => {
    const section = document.getElementById(id);
    if (section) sequences.push(new Sequence(section, plan));
  });
  updateStatus();
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) sequences.find(sequence => sequence.root === entry.target)?.pause();
  }));
  sequences.forEach(sequence => observer.observe(sequence.root));
  document.addEventListener('visibilitychange', () => { if (document.hidden) sequences.forEach(sequence => sequence.pause()); });
  reduced.addEventListener('change', () => sequences.forEach(sequence => sequence.pause()));
  const entrances = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entrances.unobserve(entry.target);
    if (!reduced.matches) entry.target.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
      { duration: 360, easing: 'cubic-bezier(.2,.7,.1,1)' });
  }), { threshold: .1 });
  document.querySelectorAll('main > section > .section-heading, .student-task').forEach(node => entrances.observe(node));
  const links = [...document.querySelectorAll('.contents a')];
  let navFrame = 0;
  function navigation() {
    navFrame = 0;
    const sections = links.map(link => document.getElementById(link.hash.slice(1)));
    const current = sections.filter(section => section.getBoundingClientRect().top <= innerHeight * .3).at(-1) || sections[0];
    links.forEach(link => {
      if (link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  addEventListener('scroll', () => { if (!navFrame) navFrame = requestAnimationFrame(navigation); }, { passive: true });
  navigation();
})();

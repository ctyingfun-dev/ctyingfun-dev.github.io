(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const completed = new Set();
  const sequences = [];
  // Lucide icon paths; keep the controls independent of external requests.
  const paths = {
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<path d="M9 4v16M15 4v16"/>',
    previous: '<path d="m15 18-6-6 6-6"/>',
    next: '<path d="m9 18 6-6-6-6"/>',
    restart: '<path d="M3 11a9 9 0 1 1 2.7 6.4M3 4v7h7"/>',
    check: '<path pathLength="1" d="m5 12 4 4L19 6"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
  const captions = {
    concept: ['3 對 6：邊長變成 2 倍。', '4 對 8：也是 2 倍。', '5 對 10：仍是 2 倍。', '三組邊比相等。'],
    aaa: ['第一組角相等：90°。', '第二組對應角相等。', '第三組角也相等。', '放大後，角度不變。', '三組對應角相等，所以相似。'],
    sas: ['先看第一組對應邊。', '再看第二組對應邊。', '兩邊之間的角相等。', '兩邊同時變成 2 倍。', '連接端點，第三邊確定。', '邊比相等、夾角相等，所以相似。'],
    sides: ['先看第一組對應邊。', '再看第二組對應邊。', '第三組對應邊也要比較。', '三邊同時變成 2 倍。', '三組邊比相等，所以相似。'],
    counter: ['兩組已知邊相等，邊比都是 1。', '相等的是 A 角：30°。', 'AB、BC 在 B 相接，夾角在 B。', 'C 有兩個位置，第三邊 AC 不同。', '兩邊成比例，但非夾角相等，不一定相似。'],
    proof: ['先列兩組對應邊的比例。', '再寫這兩邊的夾角相等。', '按對應次序，寫出相似結論。', '邊比、夾角、結論，缺一不可。']
  };
  const stamps = { aaa: '所以相似', sas: '所以相似', sides: '所以相似' };
  const showPath = (el, visible, progress = 1) => {
    el.style.opacity = visible ? '1' : '0';
    el.style.strokeDashoffset = visible ? String(1 - progress) : '1';
  };

  function counterGeometry() {
    const value = Number(range.value);
    const projection = 10 * Math.cos(theta);
    const offset = Math.sqrt(value * value - 25);
    const points = [projection - offset, projection + offset].map(t => ({
      x: A.x + t * Math.cos(theta) * scale,
      y: A.y - t * Math.sin(theta) * scale
    }));
    byId('known-sides').setAttribute('d', `M${A.x} ${A.y} L${B.x} ${B.y} ${points.map(p => `M${B.x} ${B.y} L${p.x} ${p.y}`).join(' ')}`);
    points.forEach((p, i) => {
      const name = i ? 'far' : 'near';
      const radius = i ? 50 : 32;
      const distance = Math.hypot(p.x - B.x, p.y - B.y);
      const x = B.x + (p.x - B.x) * radius / distance;
      const y = B.y + (p.y - B.y) * radius / distance;
      byId(`included-angle-${name}`).setAttribute('d', `M${B.x - radius} ${B.y} A${radius} ${radius} 0 0 1 ${x} ${y}`);
      byId(`third-side-${name}`).setAttribute('d', `M${A.x} ${A.y} L${p.x} ${p.y}`);
      const angle = Math.acos((B.x - p.x) / distance) * 180 / Math.PI;
      byId(`${name}-b-angle`).textContent = `${angle.toFixed(1)}°`;
    });
  }

  class Sequence {
    constructor(root) {
      this.root = root;
      this.kind = root.dataset.sequence;
      this.steps = captions[this.kind];
      this.index = -1;
      this.elapsed = 0;
      this.playing = false;
      this.finished = false;
      this.frame = 0;
      if (root.matches('.rule')) {
        const caption = root.querySelector('[data-caption]');
        const readout = document.createElement('div');
        readout.className = 'sequence-readout';
        caption.before(readout);
        caption.dataset.sequenceCaption = '';
        readout.append(caption);
        const stamp = document.createElement('span');
        stamp.className = 'result-stamp';
        stamp.dataset.stamp = '';
        stamp.textContent = stamps[this.kind];
        readout.append(stamp);
      }
      this.caption = root.querySelector('[data-sequence-caption]');
      this.initialCaption = this.caption.textContent;
      this.stamp = root.querySelector('[data-stamp]');
      this.stamp.insertAdjacentHTML('afterbegin', icon('check'));
      const host = root.querySelector('[data-controls], .demo-action');
      host.innerHTML = `<div class="motion-controls" role="group" aria-label="${root.querySelector('h2,h3').textContent}動畫控制">
        <button type="button" class="motion-play" data-action="play">${icon('play')}<span>播放</span></button>
        <button type="button" data-action="previous" title="上一步" aria-label="上一步">${icon('previous')}</button>
        <span class="step-count" aria-label="步驟">0 / ${this.steps.length}</span>
        <button type="button" data-action="next" title="下一步" aria-label="下一步">${icon('next')}</button>
        <button type="button" data-action="restart" title="重新開始" aria-label="重新開始">${icon('restart')}</button>
      </div>`;
      this.playButton = host.querySelector('[data-action="play"]');
      this.previousButton = host.querySelector('[data-action="previous"]');
      this.nextButton = host.querySelector('[data-action="next"]');
      this.count = host.querySelector('.step-count');
      host.addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button) return;
        const action = button.dataset.action;
        if (action === 'play') this.playing ? this.pause() : this.play();
        else if (action === 'restart') this.reset();
        else this.seek(this.index + (action === 'next' ? 1 : -1), true);
      });
      if (this.kind === 'proof') root.querySelectorAll('ol li').forEach(li => li.insertAdjacentHTML('beforeend', `<span class="proof-check">${icon('check')}</span>`));
      root.classList.add('motion-ready');
      this.paint(0);
      this.sync();
    }
    duration() { return this.kind === 'counter' ? 2400 : 1800; }
    sync() {
      this.root.dataset.playing = String(this.playing);
      this.root.dataset.phase = String(this.index);
      this.root.classList.toggle('is-final', this.index === this.steps.length - 1);
      this.playButton.innerHTML = `${icon(this.playing ? 'pause' : 'play')}<span>${this.playing ? '暫停' : this.finished ? '重播' : this.index < 0 ? '播放' : '繼續'}</span>`;
      this.previousButton.disabled = this.index < 0;
      this.nextButton.disabled = this.index === this.steps.length - 1;
      this.count.textContent = `${this.index + 1} / ${this.steps.length}`;
      this.caption.textContent = this.index < 0 ? this.initialCaption : this.steps[this.index];
      this.stamp.setAttribute('aria-hidden', String(this.index !== this.steps.length - 1));
    }
    pause() {
      this.playing = false;
      cancelAnimationFrame(this.frame);
      this.sync();
    }
    reset() {
      this.pause();
      this.index = -1;
      this.elapsed = 0;
      this.finished = false;
      this.paint(0);
      this.sync();
    }
    seek(index, countCompletion = false) {
      this.pause();
      this.index = Math.max(-1, Math.min(this.steps.length - 1, index));
      this.elapsed = this.duration();
      this.finished = this.index === this.steps.length - 1;
      this.paint(1);
      this.sync();
      if (this.finished && countCompletion) this.complete();
    }
    play() {
      sequences.forEach(sequence => { if (sequence !== this) sequence.pause(); });
      if (reduced.matches) { this.seek(this.steps.length - 1, true); return; }
      if (this.finished) this.reset();
      if (this.index < 0) { this.index = 0; this.elapsed = 0; }
      this.playing = true;
      this.last = performance.now();
      this.sync();
      const tick = now => {
        if (!this.playing) return;
        this.elapsed += Math.min(now - this.last, 80);
        this.last = now;
        if (this.elapsed >= this.duration()) {
          this.paint(1);
          if (this.index === this.steps.length - 1) {
            this.finished = true;
            this.pause();
            this.complete();
            return;
          }
          this.index++;
          this.elapsed = 0;
          this.sync();
        }
        this.paint(Math.min(1, this.elapsed / 1100));
        this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    }
    complete() {
      completed.add(this.kind);
      byId('viewed-count').textContent = `已看 ${completed.size} / 6`;
      const track = document.querySelector('.viewed-track');
      track.setAttribute('aria-valuenow', String(completed.size));
      track.firstElementChild.style.transform = `scaleX(${completed.size / 6})`;
      document.querySelector('.progress-finish').hidden = completed.size !== 6;
    }
    paint(progress) {
      const root = this.root;
      const index = this.index;
      const ease = 1 - Math.pow(1 - progress, 3);
      const line = root.querySelector('[data-progress]');
      if (line) line.style.transform = `scaleX(${Math.max(0, (index + progress) / this.steps.length)})`;
      if (this.kind === 'concept') {
        root.querySelectorAll('[data-pair]').forEach(edge => showPath(edge, index === 3 || Number(edge.dataset.pair) === index, ease));
        root.querySelectorAll('[data-ratio]').forEach(part => part.classList.toggle('is-highlighted', index === 3 || Number(part.dataset.ratio) === index));
        const pair = Math.max(0, Math.min(index, 2));
        root.querySelector('[data-match-from]').textContent = [3, 4, 5][pair];
        root.querySelector('[data-match-to]').textContent = [6, 8, 10][pair];
        root.querySelector('.pair-link').style.opacity = index >= 0 && index < 3 ? '1' : '0';
        root.querySelector('.pair-link path').style.strokeDashoffset = String(1 - ease);
      } else if (root.matches('.rule')) {
        const growth = 3;
        const factor = index < growth ? 1 : index === growth ? 1 + ease : 2;
        drawDemo(root, factor);
        const keys = ['first', 'second', 'third'];
        root.querySelectorAll('[data-mark]').forEach(mark => {
          const step = this.kind === 'sas' ? 2 : keys.indexOf(mark.dataset.mark);
          showPath(mark, index >= step, index === step ? ease : 1);
        });
        root.querySelectorAll('[data-edge]').forEach(edge => {
          const step = keys.indexOf(edge.dataset.edge);
          showPath(edge, index >= step, index === step ? ease : 1);
        });
        if (this.kind === 'sas') drawClosingSides(root, index < 4 ? 0 : index === 4 ? ease : 1);
        const label = root.querySelector(':scope > svg text:last-child');
        label.textContent = this.kind === 'sides' ? (index >= 3 ? '6、8、10' : '3、4、5') : index >= 3 ? '放大後' : '對應三角形';
      } else if (this.kind === 'counter') {
        const groups = [['.known-sides', 0], ['.angle-a', 1], ['.angle-b', 2], ['.third-side', 3]];
        groups.forEach(([selector, step]) => root.querySelectorAll(selector).forEach(path => showPath(path, index >= step, index === step ? ease : 1)));
        root.classList.toggle('show-correction', index >= 2);
        root.classList.toggle('show-comparison', index >= 3);
      } else {
        root.querySelectorAll('ol li').forEach((li, i) => {
          li.classList.toggle('is-highlighted', i === index || index === 3);
          li.classList.toggle('is-checked', i < index);
        });
      }
    }
  }

  counterGeometry();
  document.querySelectorAll('[data-sequence]').forEach(root => sequences.push(new Sequence(root)));
  range.addEventListener('input', () => {
    counterGeometry();
    sequences.find(sequence => sequence.kind === 'counter').seek(4);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) sequences.forEach(sequence => sequence.pause());
  });
  document.querySelector('details.exam').addEventListener('toggle', event => {
    if (!event.target.open) sequences.find(sequence => sequence.kind === 'proof').pause();
  });
  reduced.addEventListener('change', () => sequences.forEach(sequence => {
    if (reduced.matches && sequence.playing) sequence.seek(sequence.steps.length - 1, true);
  }));
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    const sequence = sequences.find(item => item.root === entry.target);
    if (!entry.isIntersecting) sequence.pause();
  }));
  sequences.forEach(sequence => observer.observe(sequence.root));
  const entrances = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entrances.unobserve(entry.target);
    if (!reduced.matches) entry.target.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.7,.1,1)' });
  }), { threshold: .1 });
  document.querySelectorAll('.rule, .intro, .explore-head').forEach(el => entrances.observe(el));
})();

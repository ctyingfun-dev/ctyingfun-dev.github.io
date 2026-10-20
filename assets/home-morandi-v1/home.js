(() => {
  const input = document.querySelector('#topic-search');
  const searchBar = document.querySelector('.search-bar');
  const clear = document.querySelector('.clear-search');
  const choices = [...document.querySelectorAll('.grade-choice')];
  const sections = [...document.querySelectorAll('.grade-section')];
  const lessons = [...document.querySelectorAll('.lesson')];
  const count = document.querySelector('.result-count');
  const heading = document.querySelector('#catalogue-title');
  const empty = document.querySelector('.empty-state');
  const normalize = text => text.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  const searchable = new Map(lessons.map(lesson => [
    lesson, normalize(`${lesson.textContent} ${lesson.dataset.keywords}`)
  ]));
  let grade = ['#s2', '#s3'].includes(location.hash) ? location.hash.slice(1) : 'all';
  let composing = false;

  function update() {
    const terms = normalize(input.value).split(' ').filter(Boolean);
    let total = 0;
    sections.forEach(section => {
      const inGrade = grade === 'all' || grade === section.id;
      let visible = 0;
      section.querySelectorAll('.lesson').forEach(lesson => {
        const matches = inGrade && terms.every(term => searchable.get(lesson).includes(term));
        lesson.hidden = !matches;
        if (matches) visible++;
      });
      section.hidden = visible === 0;
      section.querySelector('.section-count').textContent = `${visible} 個教材`;
      const note = section.querySelector('.teacher-note');
      if (note) note.hidden = terms.length > 0;
      total += visible;
    });
    choices.forEach(choice => {
      if (choice.dataset.grade === grade) choice.setAttribute('aria-current', 'page');
      else choice.removeAttribute('aria-current');
    });
    heading.textContent = grade === 'all' ? '全部教材' : `${grade === 's2' ? '中二' : '中三'}教材`;
    count.textContent = `${total} 個課題`;
    clear.hidden = input.value.length === 0;
    empty.hidden = total !== 0;
  }

  choices.forEach(choice => {
    choice.addEventListener('click', event => {
      event.preventDefault();
      grade = choice.dataset.grade;
      history.pushState(null, '', choice.getAttribute('href'));
      update();
    });
  });

  function syncLocation() {
    grade = ['#s2', '#s3'].includes(location.hash) ? location.hash.slice(1) : 'all';
    update();
  }
  window.addEventListener('popstate', syncLocation);
  window.addEventListener('hashchange', () => {
    if (['#all', '#s2', '#s3'].includes(location.hash)) syncLocation();
  });
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; update(); });
  input.addEventListener('input', () => { if (!composing) update(); });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !event.isComposing) {
      input.value = '';
      update();
    }
  });
  clear.addEventListener('click', () => {
    input.value = '';
    update();
    input.focus();
  });
  document.querySelector('.reset-button').addEventListener('click', () => {
    input.value = '';
    grade = 'all';
    history.pushState(null, '', '#all');
    update();
    input.focus();
  });
  searchBar.hidden = false;
  update();

  const tooltipControls = document.querySelectorAll('.clear-search, .back-top');
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      tooltipControls.forEach(control => { control.dataset.tooltipHidden = ''; });
    }
  });
  tooltipControls.forEach(control => {
    control.addEventListener('mouseleave', () => { delete control.dataset.tooltipHidden; });
    control.addEventListener('blur', () => { delete control.dataset.tooltipHidden; });
  });

  document.querySelectorAll('.open-arrow > img, .language-links a > img').forEach(image => {
    const slot = document.createElement('span');
    slot.className = 'arrow-motion';
    slot.setAttribute('aria-hidden', 'true');
    image.replaceWith(slot);
    slot.append(image.cloneNode(true), image);
  });

  let pressed = null;
  function releasePress() {
    if (pressed) pressed.removeAttribute('data-pressed');
    pressed = null;
  }
  document.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    releasePress();
    document.documentElement.dataset.input = 'pointer';
    const target = event.target.closest('a, button');
    if (!target || target.matches(':disabled')) return;
    pressed = target.matches('.lesson-link') ? target.closest('.lesson') : target;
    pressed.setAttribute('data-pressed', '');
  });
  document.addEventListener('pointerup', releasePress);
  document.addEventListener('pointercancel', releasePress);
  window.addEventListener('blur', releasePress);
  document.addEventListener('visibilitychange', releasePress);
  document.addEventListener('keydown', () => {
    releasePress();
    document.documentElement.dataset.input = 'keyboard';
  });
  document.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse') document.documentElement.dataset.input = 'pointer';
  }, {passive: true});
})();

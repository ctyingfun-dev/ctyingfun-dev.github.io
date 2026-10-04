(() => {
  const cases = {
    product: {
      question: '2<sup>3</sup> × 2<sup>2</sup> = 2<sup class="empty-index">?</sup>',
      choices: [5, 6, 9], answer: 5,
      explanation: 'Three factors of 2 join two more factors of 2. There are five altogether: add the indices, 3 + 2 = 5.',
      groups: [[2, 2, 2], [2, 2]], operation: '×',
      conclusion: '2<sup>5</sup> = 32'
    },
    quotient: {
      question: '<span class="fraction"><span>3<sup>5</sup></span><span>3<sup>2</sup></span></span> = 3<sup class="empty-index">?</sup>',
      choices: [3, 7, 10], answer: 3,
      explanation: 'Two pairs each give 3 divided by 3 = 1. Three factors of 3 remain: subtract the indices, 5 − 2 = 3.',
      groups: [[3, 3, 3, 3, 3], [3, 3]], operation: '÷',
      conclusion: '3<sup>3</sup> = 27'
    },
    power: {
      question: '(2<sup>3</sup>)<sup>2</sup> = 2<sup class="empty-index">?</sup>',
      choices: [5, 6, 9], answer: 6,
      explanation: 'The outside index repeats the whole group twice. Each group has three factors: multiply the indices, 3 × 2 = 6.',
      groups: [[2, 2, 2], [2, 2, 2]], operation: '×',
      conclusion: '2<sup>6</sup> = 64'
    }
  };
  const question = document.getElementById('factor-question');
  const answers = document.getElementById('factor-answers');
  const reveal = document.getElementById('factor-reveal');
  const feedback = document.getElementById('factor-feedback');
  const model = document.getElementById('factor-model');
  const explanation = document.getElementById('factor-explanation');
  const modes = [...document.querySelectorAll('[data-factor-mode]')];
  let mode = 'product';
  function tokens(values, group) {
    return values.map((value, i) => {
      const divided = mode === 'quotient' && i < 2;
      return `${i ? '<span class="factor-times">×</span>' : ''}<span class="factor-token ${group ? 'factor-second' : ''} ${divided ? 'factor-paired' : ''}">${value}${divided ? `<small>pair ${i + 1}</small>` : ''}</span>`;
    }).join('');
  }
  function choose(value) {
    const item = cases[mode];
    const correct = value === item.answer;
    feedback.textContent = correct ? 'Correct. Now count the factors to explain why.' : `Incorrect: you chose ${value}. The index is ${item.answer}. Let us count the factors.`;
    feedback.className = correct ? 'factor-correct' : 'factor-incorrect';
    answers.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.answer) === value));
      button.classList.toggle('factor-answer-correct', Number(button.dataset.answer) === item.answer);
    });
    model.innerHTML = item.groups.map((group, i) =>
      `${i && mode !== 'quotient' ? '<span class="factor-join">×</span>' : ''}<div class="factor-group"><span class="factor-group-label">${mode === 'quotient' ? (i ? 'Denominator' : 'Numerator') : `Group ${i + 1}`}</span><div class="factor-tokens">${tokens(group, i)}</div></div>`
    ).join('') + `<div class="factor-conclusion math">= ${item.conclusion}</div>`;
    model.classList.toggle('factor-division', mode === 'quotient');
    explanation.textContent = item.explanation;
    reveal.hidden = false;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      model.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 200, easing: 'ease-out' });
    }
  }
  function reset() {
    modes.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.factorMode === mode)));
    question.innerHTML = cases[mode].question;
    answers.replaceChildren(...cases[mode].choices.map(value => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.answer = value;
      button.textContent = value;
      button.setAttribute('aria-label', `Index ${value}`);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => choose(value));
      return button;
    }));
    reveal.hidden = true;
  }
  modes.forEach(button => button.addEventListener('click', () => { mode = button.dataset.factorMode; reset(); }));
  document.getElementById('factor-retry').addEventListener('click', () => {
    reset();
    answers.querySelector('button').focus();
  });
  reset();
})();

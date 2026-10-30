(() => {
  'use strict';
  const q = selector => document.querySelector(selector);
  if (!q('#coin-lab')) return;
  const zh = document.documentElement.lang === 'zh-Hant';
  const text = (c, e) => zh ? c : e;
  const money = value => value.toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let year = 3;
  let view = 'total';
  function coins(selector, amount, extra = false) {
    const pile = q(selector);
    const count = Math.ceil(Math.max(0, amount - 1e-8) / 100);
    while (pile.children.length > count) pile.lastElementChild.remove();
    for (let i = 0; i < count; i++) {
      let slot = pile.children[i];
      if (!slot) {
        slot = document.createElement('div');
        slot.className = 'coin-slot';
        slot.innerHTML = `<div class="coin${extra ? ' extra' : ''}"></div>`;
        pile.append(slot);
      }
      slot.firstElementChild.style.clipPath = `inset(0 ${100 * (1 - Math.min(1, (amount - i * 100) / 100))}% 0 0)`;
    }
  }
  function renderCoins() {
    const balance = 5000 * 1.04 ** year;
    const simple = view === 'total' ? year * 200 : year ? 200 : 0;
    const compound = view === 'total' ? balance - 5000 : year ? 5000 * 1.04 ** (year - 1) * .04 : 0;
    const extra = Math.max(0, compound - simple);
    coins('#simple-coins', simple);
    coins('#compound-base-coins', simple);
    coins('#compound-extra-coins', extra, true);
    q('#coin-year').value = text(`第 ${year} 年`, `Year ${year}`);
    q('#coin-year-range').value = year;
    q('#coin-back').disabled = year === 0; q('#coin-next').disabled = year === 5;
    q('#simple-earned').textContent = `HK$${money(simple)}`;
    q('#compound-earned').textContent = `HK$${money(compound)}`;
    q('#simple-balance').textContent = text('本利和 ', 'Balance ') + money(5000 + year * 200);
    q('#coin-compound-balance').textContent = text('本利和 ', 'Balance ') + money(balance);
    q('#coin-lab').querySelectorAll('.coin-total + p').forEach(node => node.textContent =
      view === 'total' ? text('累積利息', 'Total interest') : text('本年利息', "This year's interest"));
    const headline = document.createElement('strong');
    const explanation = document.createElement('span');
    headline.textContent = year === 0 ? text('本金相同：HK$5,000', 'Same principal: HK$5,000') :
      text(`${view === 'total' ? '累積' : '本年'}多賺 HK$${money(extra)}`,
        `${view === 'total' ? 'Total' : "This year's"} extra: HK$${money(extra)}`);
    explanation.textContent = year === 0 ? text('尚未賺取利息。', 'No interest yet.') :
      year === 1 ? text('第一年相同；從第二年開始，已賺的利息也會計息。', 'Equal in year 1; earlier interest starts earning interest in year 2.') :
      text('已賺的利息，也開始計息。', 'Earlier interest earns interest too.');
    q('#coin-story').replaceChildren(headline, explanation);
  }
  q('#coin-back').addEventListener('click', () => { year = Math.max(0, year - 1); renderCoins(); });
  q('#coin-next').addEventListener('click', () => { year = Math.min(5, year + 1); renderCoins(); });
  q('#coin-year-range').addEventListener('input', event => { year = Number(event.target.value); renderCoins(); });
  document.querySelectorAll('[data-coin-view]').forEach(button => button.addEventListener('click', () => {
    view = button.dataset.coinView;
    document.querySelectorAll('[data-coin-view]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    renderCoins();
  }));
  let frequency = 2;
  function drawStep() {
    const step = Number(q('#settlement-step').value);
    q('#settlement-step-label').textContent = `${step} / ${frequency * 2}`;
    document.querySelectorAll('[data-settlement-period]').forEach(marker => {
      const period = Number(marker.dataset.settlementPeriod);
      marker.classList.toggle('settled', period <= step);
      marker.classList.toggle('current-settlement', period === step);
    });
    const balance = 8000 * (1 + .06 / frequency) ** step;
    const before = step ? balance / (1 + .06 / frequency) : 8000;
    q('#settlement-step-working').innerHTML = step === 0 ?
      `<p>${text('未結算：本金', 'Before settlement: principal')} <strong class="math">HK$8,000.00</strong></p>` :
      `<p class="step-equation"><span><small>${text('期初金額', 'Opening balance')}</small><strong>${money(before)}</strong></span><b>+</b>
      <span><small>${text('本期利息', 'Period interest')}</small><strong>${money(before * .06 / frequency)}</strong></span><b>=</b>
      <span class="step-balance"><small>${text('下一期基數', "Next period's base")}</small><strong>${money(balance)}</strong></span></p>
      <p class="step-rate math">${money(before)} × ${6 / frequency}% ≈ ${money(before * .06 / frequency)}</p>`;
  }
  function settle(m) {
    frequency = m;
    document.querySelectorAll('[data-settlements]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.settlements) === m)));
    const amount = 8000 * (1 + .06 / m) ** (m * 2);
    q('#settlement-result').innerHTML = `<p class="settlement-final">${text('兩年後本利和', 'Final balance after two years')}
      <strong class="math">HK$${money(amount)}</strong></p><details class="visual-notes"><summary>${text('完整計算與總利息', 'Full calculation and total interest')}</summary>
      <div><p class="math"><var>A</var> = 8,000(1 + ${6 / m}%)<sup>${m * 2}</sup> ≈ HK$${money(amount)}</p>
      <p class="math"><var>I</var> = <var>A</var> − 8,000 ≈ HK$${money(amount - 8000)}</p></div></details>`;
    q('#settlement-step').max = m * 2; q('#settlement-step').value = 1;
    q('#settlement-rate-pair').innerHTML = `<div class="rate-pair"><p><span>${text('每期利率', 'Rate per period')}</span><strong class="math">6% ÷ ${m} = ${6 / m}%</strong></p>
      <p><span>${text('總期數', 'Total periods')}</span><strong class="math">${m} × 2 = ${m * 2}</strong></p></div>`;
    q('#settlement-years').innerHTML = [1, 2].map(y => `<div class="settlement-year"><h4>${text(`第 ${y} 年`, `Year ${y}`)}</h4>
      <ol style="--periods:${m}">${Array.from({ length: m }, (_, i) => `<li data-settlement-period="${(y - 1) * m + i + 1}">
      <span class="period-tick" aria-hidden="true"></span><small>${m <= 4 || (i + 1) % 6 === 0 ? `${(i + 1) * 12 / m}${text('月', 'm')}` : ''}</small>
      <span class="visually-hidden">${text(`第 ${(y - 1) * m + i + 1} 次結算`, `Settlement ${(y - 1) * m + i + 1}`)}</span></li>`).join('')}</ol></div>`).join('');
    drawStep();
  }
  document.querySelectorAll('[data-settlements]').forEach(button => button.addEventListener('click', () => settle(Number(button.dataset.settlements))));
  q('#settlement-step').addEventListener('input', drawStep);
  settle(2); renderCoins();
})();

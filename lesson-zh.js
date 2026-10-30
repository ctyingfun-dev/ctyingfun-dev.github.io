(() => {
'use strict';
    const el = id => document.getElementById(id);
    const money = value => "HK$" + value.toLocaleString("en-HK", { minimumFractionDigits:2, maximumFractionDigits:2 });

if (el('original')) {
    let rewindStage = 0;
    function renderRewind() {
      el("rewind-original").textContent = rewindStage ? "720" : "?";
      el("rewind-arrow").innerHTML = rewindStage === 1 ? '&divide; 0.85<span class="flow-arrow" aria-hidden="true">&larr;</span>' : '&times; 0.85<span class="flow-arrow" aria-hidden="true">&rarr;</span>';
      el("rewind-status").textContent = [
        "新值是原值的 85%。把乘以倍率的過程倒轉，找出原來的 100%。",
        "倒帶：HK$612 \u00f7 0.85 = HK$720。直接把 HK$612 增加 15% 只得 HK$703.80，並非原值。",
        "正向驗算：HK$720 \u00d7 0.85 = HK$612。除以倍率便能正確求回減少前的原值。"
      ][rewindStage];
      el("rewind").textContent = rewindStage === 1 ? "正向驗算" : "倒帶";
      el("rewind").hidden = rewindStage === 2;
    }
    el("rewind").addEventListener("click", () => { rewindStage = Math.min(2,rewindStage + 1); renderRewind(); });
    el("rewind-reset").addEventListener("click", () => { rewindStage = 0; renderRewind(); });
    el("reverse-activity").hidden = false;
    let prediction = null;
    document.querySelectorAll("[data-guess]").forEach(button => button.addEventListener("click", () => {
      if (prediction !== null) return;
      prediction = button.dataset.guess;
      document.querySelectorAll("[data-guess]").forEach(item => {
        item.disabled = true;
        item.setAttribute("aria-pressed", String(item === button));
      });
      el("guess-stage").textContent = "增加 20% 後";
      el("guess-amount").textContent = "120";
      el("guess-bar").style.setProperty("--value","100%");
      el("guess-status").textContent = "第一次變化：100 的 20% 是 20。加 20 後得 120。下一次變化改以 120 為基數。";
      el("guess-next").hidden = false;
    }));
    el("guess-next").addEventListener("click", () => {
      el("guess-stage").textContent = "減少 20% 後";
      el("guess-amount").textContent = "96";
      el("guess-bar").style.setProperty("--value","80%");
      el("guess-status").textContent = `${prediction === "below" ? "你的預測正確。" : "最後的數量小於 100。"} 120 的 20% 是 24，所以 120 \u2212 24 = 96。增加 20 後減少 24，整體減少 4%。`;
      el("guess-next").hidden = true;
    });
    el("guess-reset").addEventListener("click", () => {
      prediction = null;
      document.querySelectorAll("[data-guess]").forEach(button => { button.disabled = false; button.setAttribute("aria-pressed","false"); });
      el("guess-stage").textContent = "原值";
      el("guess-amount").textContent = "100";
      el("guess-bar").style.setProperty("--value","83.333333%");
      el("guess-status").textContent = "先作預測，再觀察第一次變化。";
      el("guess-next").hidden = true;
    });
    el("guess-activity").hidden = false;
    function renderDepreciation() {
      const year = el("depreciation-year").valueAsNumber;
      const value = 12000 * 0.85 ** year;
      el("depreciation-year-label").value = year;
      el("laptop-year").textContent = `第 ${year} 年`;
      el("depreciation-value").textContent = money(value);
      el("depreciation-percent").textContent = `${(100 * 0.85 ** year).toFixed(2)}% 的購入價。`;
      el("depreciation-bar").style.setProperty("--value",`${100 * 0.85 ** year}%`);
      el("depreciation-status").textContent = year === 0 ? "購入時尚未折舊。" : `第 ${year} 年：上一年價值 ${money(12000 * 0.85 ** (year - 1))} 的 15% 是 ${money(12000 * 0.85 ** (year - 1) * 0.15)}，這是本年的折舊額。購入至今累計折舊：${money(12000 - value)}。`;
    }
    el("depreciation-year").addEventListener("input",renderDepreciation);
    el("depreciation-activity").hidden = false;
    renderDepreciation();
    let direction = "decrease";
    function renderChange() {
      const original = el("original").valueAsNumber;
      const rate = el("rate").valueAsNumber;
      el("rate-label").value = rate + "%";
      const valid = el("original").validity.valid && Number.isFinite(original);
      el("change-error").textContent = valid ? "" : "請輸入 1 至 1,000,000 的整數金額。";
      el("change-result").hidden = !valid;
      el("bars").hidden = !valid;
      if (!valid) return;
      const multiplier = 1 + (direction === "increase" ? rate : -rate) / 100;
      const amount = original * multiplier;
      el("new-amount").textContent = money(amount);
      el("change-working").textContent = `${money(original)} \u00d7 (1 ${direction === "increase" ? "+" : "\u2212"} ${rate}%) = ${money(original)} \u00d7 ${multiplier.toFixed(2)} = ${money(amount)}`;
      const max = Math.max(original, amount);
      el("original-bar").style.width = (original / max * 100) + "%";
      el("new-bar").style.width = (amount / max * 100) + "%";
      el("bars").setAttribute("aria-label", `原值 ${money(original)}；新值 ${money(amount)}，${direction === 'increase' ? '增加' : '減少'} ${rate}%。`);
    }
    document.querySelectorAll("[data-direction]").forEach(button => button.addEventListener("click", () => {
      direction = button.dataset.direction;
      document.querySelectorAll("[data-direction]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      renderChange();
    }));
    ["original","rate"].forEach(id => el(id).addEventListener("input", renderChange));
    renderChange();


}
if (el('principal')) {
    function renderInterest() {
      const principal = el("principal").valueAsNumber;
      const rate = el("interest-rate").valueAsNumber;
      const years = el("years").valueAsNumber;
      el("years-label").value = years;
      const valid = ["principal","interest-rate"].every(id => el(id).validity.valid && Number.isFinite(el(id).valueAsNumber));
      el("interest-error").textContent = valid ? "" : "請輸入 1 至 1,000,000 的整數本金，以及 0 至 30 的利率（最多一位小數）。";
      el("interest-results").hidden = !valid;
      if (!valid) return;
      const simple = Array.from({length:years + 1}, (_, year) => principal * (1 + rate / 100 * year));
      const compound = Array.from({length:years + 1}, (_, year) => principal * (1 + rate / 100) ** year);
      el("simple-total").textContent = money(simple[years]);
      el("compound-total").textContent = money(compound[years]);
      el("interest-difference").textContent = `複利額外賺取的利息：${money(compound[years] - simple[years])}。`;
      el("interest-table").innerHTML = simple.map((amount, year) => `<tr><th scope="row">${year}</th><td>${money(amount)}</td><td>${money(compound[year])}</td></tr>`).join("");
      drawChart(simple, compound, years);
    }
    function drawChart(simple, compound, years) {
      const canvas = el("interest-chart");
      const width = canvas.clientWidth;
      if (!width) return;
      const height = 260;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      const left = 58, right = width - 16, top = 18, bottom = 222;
      const max = Math.max(...compound, ...simple) * 1.1;
      const x = year => left + year / years * (right - left);
      const y = amount => bottom - amount / max * (bottom - top);
      ctx.font = "11px Arial";
      ctx.textAlign = "right";
      for (let tick = 0; tick <= 4; tick++) {
        const value = max * tick / 4;
        ctx.strokeStyle = "#d7e2de";
        ctx.beginPath(); ctx.moveTo(left,y(value)); ctx.lineTo(right,y(value)); ctx.stroke();
        ctx.fillStyle = "#526664";
        const label = value >= 1000000 ? (value / 1000000).toFixed(1) + "m" : value >= 1000 ? (value / 1000).toFixed(1) + "k" : value.toFixed(0);
        ctx.fillText(label,left - 8,y(value) + 4);
      }
      ctx.textAlign = "left"; ctx.fillText("HK$",0,12);
      ctx.textAlign = "center";
      const gap = Math.max(1, Math.ceil(years / (width < 400 ? 4 : 8)));
      for (let year = 0; year <= years; year++) {
        if (year % gap === 0 || year === years) ctx.fillText(String(year), x(year), bottom + 17);
      }
      ctx.fillText("年", (left + right) / 2, 257);
      [[simple,getComputedStyle(document.body).getPropertyValue("--blue").trim()],[compound,getComputedStyle(document.body).getPropertyValue("--coral").trim()]].forEach(([values,color]) => {
        ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath();
        values.forEach((value,year) => year === 0 ? ctx.moveTo(x(year),y(value)) : ctx.lineTo(x(year),y(value)));
        ctx.stroke();
      });
    }
    ["principal","interest-rate","years"].forEach(id => el(id).addEventListener("input",renderInterest));
    new ResizeObserver(renderInterest).observe(el("interest-chart"));
    renderInterest();


}
    const questions = [
      {prompt:"價格由 HK$240 升至 HK$300，百分增幅是多少？", choices:["20%","25%","60%","80%"], answer:1, reason:"以原價為基數：(300 \u2212 240) \u00f7 240 \u00d7 100% = 25%。"},
      {prompt:"一件恤衫減價 20% 後售 HK$504，原來標價是多少？", choices:["HK$604.80","HK$630","HK$403.20","HK$2,520"], answer:1, reason:"售價是標價的 80%。除以 0.8：504 \u00f7 0.8 = HK$630。"},
      {prompt:"某數量先增加 20%，再減少 20%。整體變化是多少？", choices:["沒有改變","增加 4%","減少 4%","減少 40%"], answer:2, reason:"倍率為 1.2 \u00d7 0.8 = 0.96。最後是原值的 96%，即減少 4%。"},
      {prompt:"本金 HK$8,000，年利率 3%，存期 9 個月。求單利利息。", choices:["HK$180","HK$240","HK$2,160","HK$8,180"], answer:0, reason:"年期 = 9/12 年。利息 = 8,000 \u00d7 0.03 \u00d7 9/12 = HK$180。題目問的是利息，不是本利和。"},
      {prompt:"本金 HK$10,000，年利率 5%，每年複利一次，共存 2 年。求本利和。", choices:["HK$11,000","HK$10,500","HK$11,025","HK$1,025"], answer:2, reason:"本利和 = 10,000 \u00d7 1.05\u00b2 = HK$11,025。第二年的利息包含第一年利息所產生的利息。"},
      {prompt:"一部價值 HK$20,000 的機器每年折舊 10%，2 年後的價值是多少？", choices:["HK$16,000","HK$18,000","HK$19,800","HK$16,200"], answer:3, reason:"價值 = 20,000 \u00d7 0.9\u00b2 = HK$16,200。第二次減少 10% 應以 HK$18,000 為基數。"},
      {prompt:"某數值在 2 年內由 5,000 增至 6,050，求固定年增長率。", choices:["10%","10.5%","21%","5%"], answer:0, reason:"兩年的倍率為 6,050 \u00f7 5,000 = 1.21。每年倍率為 \u221a1.21 = 1.1，因此年增長率為 10%。"},
      {prompt:"減少 25% 後，要增加多少百分率才能回復原值？", choices:["25%","20%","33\u2153%","75%"], answer:2, reason:"剩下原值的 0.75 倍。要回復原值，乘以 1 \u00f7 0.75 = 4/3，即增加 33\u2153%。"},
      {prompt:"合格率由 60% 升至 75%，相對增幅是多少？", choices:["15%","25%","只是 15 個百分點","125%"], answer:1, reason:"增加了 15 個百分點。相對增幅為 (75 \u2212 60) \u00f7 60 \u00d7 100% = 25%。"},
      {prompt:"原價減少 r% 後為 N，哪條公式可求原價 O？", mathPrompt:"原價減少 <var>r</var>% 後為 <var>N</var>，哪條公式可求原價 <var>O</var>？", choices:["<var>O</var> = <var>N</var>(1 + <var>r</var>%)","<var>O</var> = <var>N</var>(1 &minus; <var>r</var>%)","<var>O</var> = <var>N</var> &divide; (1 + <var>r</var>%)","<var>O</var> = <var>N</var> &divide; (1 &minus; <var>r</var>%)"], answer:3, reason:"把新價除以減幅倍率，可倒轉原來的乘法；減幅須小於 100%。"}
    ];
    const questionHints = [
      "增幅要跟原價 240 比較，不是跟新價 300 比較。",
      "504 是原價的 80%。先寫原價乘 0.8 等於 504。",
      "兩次變化的基數不同；試把兩個倍率相乘。",
      "先把 9 個月換算成年，再留意題目問利息還是本利和。",
      "第二年以第一年年終結餘計息，不是再加一次固定金額。",
      "每年都乘剩餘比例；第二年不再以 20,000 為基數。",
      "先求兩年的總倍率，再找每年的相同倍率。",
      "剩下原值的 75%。回復時的增加額應跟這個新值比較。",
      "百分點差是 15，但相對增幅的基數是 60。",
      "原價乘減幅倍率等於新價；求原價時要倒轉這個乘法。"
    ];

    const selected = document.body.dataset.topic === 'interest' ? [3,4] : [0,1,2,5,6,7,8,9];
    const pool = [...questions], hints = [...questionHints];
    questions.splice(0, questions.length, ...selected.map(i => pool[i]));
    questionHints.splice(0, questionHints.length, ...selected.map(i => hints[i]));
    let questionIndex = 0, score = 0, answered = false, attempts = 0;
    function renderQuestion(focus = false) {
      answered = false;
      attempts = 0;
      const question = questions[questionIndex];
      el("progress").textContent = `第 ${questionIndex + 1} 題，共 ${questions.length} 題`;
      el("score").textContent = `得分：${score} / ${questions.length}`;
      el("question").innerHTML = question.mathPrompt || question.prompt;
      el("feedback").textContent = "";
      el("next").hidden = true;
      el("choices").replaceChildren();
      question.choices.forEach((choice,index) => {
        const button = document.createElement("button");
        button.type = "button"; button.className = "choice"; button.innerHTML = choice;
        button.addEventListener("click", () => {
          if (answered) return;
          const correct = index === question.answer;
          attempts++;
          if (!correct && attempts === 1) {
            button.classList.add("wrong");
            button.disabled = true;
            el("feedback").textContent = `再試一次。${questionHints[questionIndex]}`;
            return;
          }
          answered = true;
          if (correct) score++;
          [...el("choices").children].forEach((item,i) => {
            item.disabled = true;
            if (i === question.answer) item.classList.add("correct");
            else if (i === index) item.classList.add("wrong");
          });
          el("feedback").textContent = `${correct ? "答對了。" : "兩次都未答對，現在對照解法。"} ${question.reason}`;
          el("score").textContent = `得分：${score} / ${questions.length}`;
          const last = questionIndex === questions.length - 1;
          if (last) el("feedback").textContent += ` 已完成：答對 ${score} 題，共 ${questions.length} 題。`;
          el("next").textContent = last ? "再試一次" : "下一題";
          el("next").hidden = false;
        });
        el("choices").append(button);
      });
      if (focus) el("question").focus();
    }
    el("next").addEventListener("click", () => {
      if (!answered) return;
      if (questionIndex === questions.length - 1) { questionIndex = 0; score = 0; }
      else questionIndex++;
      renderQuestion(true);
    });
    el("quiz").hidden = false;
    renderQuestion();

})();
(() => {
  const zh = document.documentElement.lang === "zh-Hant";
  const text = (chinese, english) => zh ? chinese : english;
  const find = id => document.getElementById(id);
  const fixed = value => Number(value.toFixed(2)).toLocaleString("en-HK", { maximumFractionDigits:2 });
  const currency = value => "HK$" + value.toLocaleString("en-HK", { minimumFractionDigits:2, maximumFractionDigits:2 });
  function exercise(id) { return document.getElementById(id); }
  function feedback(id, state, message) {
    const node = find(id);
    node.dataset.state = state;
    node.textContent = message;
  }


if (find('base-task')) {
  const baseTask = exercise("base-task", `
    <h3>${text("由 800 變成 600，你會選誰做分母？","From 800 to 600, which denominator would you choose?")}</h3>
    <p>${text("變化額是 −200。選出基數，再看看這個分數到底在比較甚麼。","The change is −200. Choose a base, then check what your fraction actually compares.")}</p>
    <div class="base-expression math"><span class="frac"><span>600 − 800</span><span id="chosen-base">?</span></span> × 100% <span id="base-rate"></span></div>
    <div class="task-actions" role="group" aria-label="${text("選擇基數","Choose the base")}">
      <button type="button" class="secondary" data-base="800" aria-pressed="false">HK$800</button>
      <button type="button" class="secondary" data-base="600" aria-pressed="false">HK$600</button>
    </div>
    <p class="task-feedback" id="base-feedback" aria-live="polite">${text("先選一個基數。","Choose a base first.")}</p>`,
    document.querySelector("#concepts > .section-heading + p"));
  baseTask.querySelectorAll("[data-base]").forEach(button => button.addEventListener("click", () => {
    const base = Number(button.dataset.base);
    baseTask.querySelectorAll("[data-base]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    find("chosen-base").textContent = String(base);
    find("base-rate").textContent = base === 800 ? "= −25%" : "≈ −33.33%";
    feedback("base-feedback", base === 800 ? "success" : "hint", base === 800
      ? text("正確。題目跟原值比較，所以 800 才是 100%。","Correct. We are comparing with the original, so 800 is 100%.")
      : text("這個分數比較的是新值。600 是剩下的金額，不是題目所說的原來金額；請再選。","That fraction compares with the new amount. 600 is what remains, not the original amount in this question. Try the other base."));
  }));

  exercise("reverse-task", `
    <h3>${text("現在由你求原值。","Now find the original amount yourself.")}</h3>
    <p id="reverse-task-question"></p>
    <form id="reverse-answer-form" novalidate>
      <label for="reverse-answer">${text("原值（HK$）","Original amount (HK$)")}</label>
      <div class="answer-entry"><input type="number" id="reverse-answer" min="0.01" max="1000000" step="0.01" inputmode="decimal" aria-describedby="reverse-task-feedback">
        <button type="submit" class="primary">${text("驗算我的答案","Check my answer")}</button></div>
    </form>
    <p class="task-feedback" id="reverse-task-feedback" aria-live="polite"></p>
    <div class="task-actions"><button type="button" class="secondary" id="reverse-hint">${text("給我一個提示","Give me a hint")}</button>
      <button type="button" class="secondary" id="reverse-new">${text("換一題","Another question")}</button></div>`,
    document.querySelector("#reverse > .columns"));
  const reverseCases = [
    {amount:612, rate:15, multiplier:.85},
    {amount:504, rate:20, multiplier:.8},
    {amount:960, rate:20, multiplier:1.2},
    {amount:315, rate:30, multiplier:.7}
  ];
  let reverseIndex = 0;
  function resetReverseTask() {
    const q = reverseCases[reverseIndex];
    find("reverse-task-question").textContent = text(
      `某金額${q.multiplier < 1 ? "減少" : "增加"} ${q.rate}% 後為 ${currency(q.amount)}。原來是多少？`,
      `After a ${q.rate}% ${q.multiplier < 1 ? "decrease" : "increase"}, an amount is ${currency(q.amount)}. What was it before?`);
    find("reverse-answer").value = "";
    feedback("reverse-task-feedback", "neutral", "");
  }
  find("reverse-answer-form").addEventListener("submit", event => {
    event.preventDefault();
    const input = find("reverse-answer"), q = reverseCases[reverseIndex];
    const value = input.valueAsNumber;
    if (!input.validity.valid || !Number.isFinite(value)) {
      feedback("reverse-task-feedback", "hint", text("請輸入不超過 1,000,000 的正數金額，最多兩位小數。","Enter a positive amount up to 1,000,000 with at most two decimal places."));
      input.focus(); return;
    }
    const correct = Math.abs(value - q.amount / q.multiplier) < .005;
    feedback("reverse-task-feedback", correct ? "success" : "hint", correct
      ? text(`答對了。${currency(value)} × ${q.multiplier} = ${currency(q.amount)}，回到題目的新值。`,
        `Correct. ${currency(value)} × ${q.multiplier} = ${currency(q.amount)}, matching the given final amount.`)
      : text(`你的原值正向計算後是 ${currency(value * q.multiplier)}，不是 ${currency(q.amount)}。新值應等於原值乘 ${q.multiplier}；再試一次。`,
        `Your original gives ${currency(value * q.multiplier)} after the change, not ${currency(q.amount)}. The final amount should equal the original × ${q.multiplier}. Try again.`));
  });
  find("reverse-hint").addEventListener("click", () => {
    const q = reverseCases[reverseIndex];
    feedback("reverse-task-feedback", "hint", text(
      `新值是原值的 ${Math.round(q.multiplier * 100)}%。設原值為一個未知數，先寫「原值 × ${q.multiplier} = ${q.amount}」，再倒轉乘法。`,
      `The final amount is ${Math.round(q.multiplier * 100)}% of the original. Write "original × ${q.multiplier} = ${q.amount}", then undo the multiplication.`));
  });
  find("reverse-new").addEventListener("click", () => {
    reverseIndex = (reverseIndex + 1) % reverseCases.length;
    resetReverseTask(); find("reverse-answer").focus();
  });
  resetReverseTask();

  exercise("chain-task", `
    <h3>${text("由你改百分率：怎樣才剛好回到 100？","Change the rates: what brings us exactly back to 100?")}</h3>
    <div class="task-controls">
      <div><label for="chain-rise">${text("先增加","First increase")}: <output id="chain-rise-label">20%</output></label><input id="chain-rise" type="range" min="0" max="50" step="1" value="20"></div>
      <div><label for="chain-fall">${text("再減少","Then decrease")}: <output id="chain-fall-label">20%</output></label><input id="chain-fall" type="range" min="0" max="50" step="any" value="20"></div>
    </div>
    <div class="chain-bars" role="img" id="chain-diagram">
      <div class="value-row"><div class="value-label"><span>${text("原值","Original")}</span><strong>100</strong></div><div class="value-track"><div id="chain-start-bar" class="value-fill"></div></div></div>
      <div class="value-row"><div class="value-label"><span>${text("第一次變化後","After the first change")}</span><strong id="chain-middle"></strong></div><div class="value-track"><div id="chain-middle-bar" class="value-fill rise"></div></div></div>
      <div class="value-row"><div class="value-label"><span>${text("第二次變化後","After the second change")}</span><strong id="chain-final"></strong></div><div class="value-track"><div id="chain-final-bar" class="value-fill fall"></div></div></div>
    </div>
    <p class="task-feedback" id="chain-feedback" aria-live="polite"></p>
    <div class="task-actions"><button type="button" class="secondary" id="chain-match">${text("試相同的增減率","Try equal rates")}</button>
      <button type="button" class="primary" id="chain-restore">${text("求回復 100 的減幅","Find the decrease back to 100")}</button></div>
    <p id="chain-recovery" class="math" aria-live="polite" hidden></p>`,
    document.querySelector("#successive > .columns"));
  function renderChain() {
    const rise = find("chain-rise").valueAsNumber, fall = find("chain-fall").valueAsNumber;
    const middle = 100 * (1 + rise / 100), final = middle * (1 - fall / 100);
    find("chain-rise-label").value = rise + "%";
    find("chain-fall-label").value = (Math.abs(fall - Number(fall.toFixed(2))) > 1e-9 ? "≈ " : "") + fixed(fall) + "%";
    find("chain-middle").textContent = fixed(middle);
    find("chain-final").textContent = fixed(final);
    [["chain-start-bar",100],["chain-middle-bar",middle],["chain-final-bar",final]].forEach(([id,amount]) => {
      find(id).style.setProperty("--value", amount / middle * 100 + "%");
    });
    find("chain-diagram").setAttribute("aria-label",text(
      `相同比例：原值 100，第一次後 ${fixed(middle)}，第二次後 ${fixed(final)}。`,
      `Same scale: original 100, then ${fixed(middle)}, then ${fixed(final)}.`));
    const equal = Math.abs(final - 100) < 1e-8;
    feedback("chain-feedback", equal ? "success" : "neutral", text(
      `第二次按 ${fixed(middle)} 計算，不是按 100。這次減去 ${fixed(middle - final)}。${equal ? "剛好回到 100！" : `最後比原值${final < 100 ? "少" : "多"} ${fixed(Math.abs(final - 100))}。`}`,
      `The second base is ${fixed(middle)}, not 100. This decrease removes ${fixed(middle - final)}. ${equal ? "Exactly back to 100!" : `The final amount is ${fixed(Math.abs(final - 100))} ${final < 100 ? "below" : "above"} the original.`}`));
  }
  ["chain-rise","chain-fall"].forEach(id => find(id).addEventListener("input", () => {
    find("chain-recovery").hidden = true; renderChain();
  }));
  find("chain-match").addEventListener("click", () => {
    find("chain-fall").value = find("chain-rise").value;
    find("chain-recovery").hidden = true; renderChain();
  });
  find("chain-restore").addEventListener("click", () => {
    const rise = find("chain-rise").valueAsNumber, middle = 100 + rise;
    find("chain-fall").value = rise / middle * 100;
    renderChain();
    find("chain-recovery").innerHTML = `<span class="frac"><span>${rise}</span><span>${middle}</span></span> × 100% ≈ ${fixed(rise / middle * 100)}%`;
    find("chain-recovery").hidden = false;
  });
  renderChain();


document.querySelectorAll('[data-guess]').forEach(button => button.addEventListener('click', () => find('guess-reset').hidden = false));
find('guess-reset').addEventListener('click', () => find('guess-reset').hidden = true);
}
if (find('interest-base-task')) {
  const interestTask = exercise("interest-base-task", `
    <h3>${text("第 2 年年初，哪些錢應該計息？","At the start of year 2, which money earns interest?")}</h3>
    <p>${text("本金是 HK$5,000，第 1 年已賺 HK$200，年利率是 4%。先選計息方式，再勾選這一年的基數。","The principal is HK$5,000, year 1 earned HK$200, and the annual rate is 4%. Choose the interest method, then select this year's base.")}</p>
    <div class="segments task-mode" role="group" aria-label="${text("計息方式","Interest method")}">
      <button type="button" data-interest-mode="simple" aria-pressed="false">${text("單利","Simple")}</button>
      <button type="button" data-interest-mode="compound" aria-pressed="true">${text("複利","Compound")}</button>
    </div>
    <fieldset class="money-selection"><legend>${text("哪些金額放進計息基數？","Which amounts belong in the interest base?")}</legend>
      <label><input type="checkbox" id="include-principal" value="5000"><span>${text("原有本金","Original principal")} <strong>HK$5,000</strong></span></label>
      <label><input type="checkbox" id="include-earned" value="200"><span>${text("第 1 年已賺的利息","Interest already earned in year 1")} <strong>HK$200</strong></span></label>
      <label><input type="checkbox" id="include-future" value="208"><span>${text("候選金額：第 2 年利息，尚未賺到","Proposed year 2 interest, not yet earned")} <strong>HK$208</strong></span></label>
    </fieldset>
    <p class="math" id="selected-interest-base" aria-live="polite"></p>
    <button type="button" class="primary" id="check-interest-base">${text("檢查計息基數","Check the interest base")}</button>
    <p class="task-feedback" id="interest-base-feedback" aria-live="polite"></p>
    <p class="task-progress" id="interest-task-progress"></p>`,
    document.querySelector("#interest > .coin-lab"));
  let interestMode = "compound";
  const completedModes = new Set();
  function selectedBase() {
    return [...interestTask.querySelectorAll("input:checked")].reduce((sum,input) => sum + Number(input.value),0);
  }
  function renderInterestBase() {
    const base = selectedBase();
    find("selected-interest-base").textContent = `${currency(base)} × 4% = ${currency(base * .04)}`;
    feedback("interest-base-feedback", "neutral", "");
  }
  interestTask.querySelectorAll("input").forEach(input => input.addEventListener("change",renderInterestBase));
  interestTask.querySelectorAll("[data-interest-mode]").forEach(button => button.addEventListener("click", () => {
    interestMode = button.dataset.interestMode;
    interestTask.querySelectorAll("[data-interest-mode]").forEach(item => item.setAttribute("aria-pressed",String(item === button)));
    interestTask.querySelectorAll("input").forEach(input => input.checked = false);
    renderInterestBase();
  }));
  find("check-interest-base").addEventListener("click", () => {
    const principal = find("include-principal").checked;
    const earned = find("include-earned").checked;
    const future = find("include-future").checked;
    const correct = principal && earned === (interestMode === "compound") && !future;
    let message;
    if (correct) {
      completedModes.add(interestMode);
      message = interestMode === "compound"
        ? text("正確。5,000 + 200 = 5,200；本年利息是 208。其中多出的 8，是上一年利息再賺的利息。","Correct. 5,000 + 200 = 5,200, so this year's interest is 208. The extra 8 is interest earned on last year's interest.")
        : text("正確。單利只按本金 5,000 計算，每年利息都是 200。","Correct. Simple interest uses only the original 5,000, earning 200 each year.");
    } else if (future) {
      message = text("第 2 年的利息還未賺到，不能提前加入年初基數。取消最後一項，再想想。","Year 2's interest has not been earned yet. It cannot be part of the opening base. Remove the last amount and try again.");
    } else if (!principal) {
      message = text("原有本金仍在戶口裏，不能漏掉 5,000。","The original principal is still in the account. Do not leave out the 5,000.");
    } else {
      message = interestMode === "compound"
        ? text("複利要把已賺的利息加入基數。第 1 年的 200 已經在戶口裏了。","Compound interest includes interest already earned. The 200 from year 1 is already in the account.")
        : text("單利的基數只用原有本金。雖然已賺了 200，但它不再產生單利利息。","Simple interest uses only the original principal. The 200 already earned does not itself earn simple interest.");
    }
    feedback("interest-base-feedback", correct ? "success" : "hint",message);
    find("interest-task-progress").textContent = text(`已完成 ${completedModes.size} / 2 種計息方式。`,`Completed ${completedModes.size} / 2 interest methods.`);
  });
  renderInterestBase();

}
})();

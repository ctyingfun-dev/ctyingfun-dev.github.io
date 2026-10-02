(() => {
  "use strict";
  const coefficients = ([p, q, r, s], k = 1) => [k * p * r, k * (p * s + q * r), k * q * s];
  const same = (a, b) => a.every((value, index) => value === b[index]);
  function choiceOptions([p, q, r, s, k], index) {
    const correct = { pair: [p, q, r, s], k };
    const target = coefficients(correct.pair, k);
    const alternatives = [
      { pair: [p, s, r, q], k },
      { pair: [p, -q, r, -s], k },
      { pair: [p, q, r, s], k: 1 },
      { pair: [p, -q, r, s], k },
      { pair: [p, q + 1, r, s], k },
      { pair: [p, q + 2, r, s], k }
    ];
    const result = [];
    for (const option of alternatives) {
      const value = coefficients(option.pair, option.k);
      if (!same(value, target) && !result.some(item => same(coefficients(item.pair, item.k), value))) {
        result.push(option);
      }
      if (result.length === 2) break;
    }
    result.splice(index % 3, 0, correct);
    return result;
  }
  function putToken(placements, token, slot, tokens) {
    if (tokens[token].kind !== (slot % 2 === 0 ? "x" : "constant")) return null;
    const next = placements.map(value => value === token ? null : value);
    next[slot] = token;
    return next;
  }

  // DOM enhancements share the original lesson's cases and mathematical helpers.
  const english = document.documentElement.lang === "en";
  const tr = (zh, en) => english ? en : zh;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const make = (tag, className, html) => {
    const node = document.createElement(tag);
    node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  };
  const plain = html => html.replace(/<sup>2<\/sup>/g, "²").replace(/<[^>]*>/g, "");

  const diagram = document.querySelector("#why .tool .diagram");
  const grid = diagram.querySelector(".cross-grid");
  grid.classList.add("animated-cross");
  const traces = [...grid.querySelectorAll("svg path")].map(path => {
    path.classList.add("trace-base");
    const trace = path.cloneNode();
    trace.classList.remove("trace-base");
    trace.classList.add("trace-line");
    trace.setAttribute("pathLength", "100");
    path.parentNode.append(trace);
    return trace;
  });
  const playback = make("div", "cross-playback", `
    <div class="playback-actions">
      <button type="button" class="primary" id="cross-play">${tr("播放推導", "Play derivation")}</button>
      <button type="button" class="secondary" id="cross-back">${tr("上一步", "Previous step")}</button>
      <button type="button" class="secondary" id="cross-step">${tr("下一步", "Next step")}</button>
      <button type="button" class="secondary" id="cross-reset">${tr("重新推導", "Start again")}</button>
      <label>${tr("速度", "Speed")}<select id="cross-speed" aria-label="${tr("推導播放速度", "Derivation playback speed")}"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option></select></label>
    </div>
    <div class="derivation-readout" aria-live="polite" aria-atomic="true">
      <span class="correction-label" id="cross-step-label"></span>
      <div class="math" id="cross-step-math"></div>
    </div>`);
  diagram.after(playback);
  let phase = 0;
  let timer = null;
  let playing = false;
  function paintPhase() {
    const [p, q, r, s] = cases[+el("case").value];
    grid.dataset.phase = String(phase);
    traces[0].classList.toggle("is-drawn", phase >= 1);
    traces[1].classList.toggle("is-drawn", phase >= 2);
    const labels = [
      tr("先看四個位置", "Start with the four positions"),
      tr("① 左上 × 右下", "① Top left × bottom right"),
      tr("② 左下 × 右上", "② Bottom left × top right"),
      tr("③ 合成中間項", "③ Add the middle terms"),
      tr("④ 沿橫行讀出因式", "④ Read the factors along the rows")
    ];
    const maths = [
      `${term(p * s)} + (${term(q * r)}) = ?`,
      `${term(p)} × (${number(s)}) = ${term(p * s)}`,
      `${term(r)} × (${number(q)}) = ${term(q * r)}`,
      `${term(p * s)} + (${term(q * r)}) = ${term(p * s + q * r)}`,
      `${factor(p, q)}${factor(r, s)}`
    ];
    el("cross-step-label").textContent = `${labels[phase]} · ${phase}/4`;
    el("cross-step-math").innerHTML = maths[phase];
    el("cross-back").disabled = phase === 0;
    el("cross-step").disabled = phase === 4;
    el("cross-play").textContent = playing ? tr("暫停", "Pause") : phase === 4 ? tr("再播放一次", "Replay") : tr("播放推導", "Play derivation");
    el("cross-play").setAttribute("aria-pressed", String(playing));
  }
  function stopPlayback() {
    clearTimeout(timer);
    timer = null;
    playing = false;
    paintPhase();
  }
  function schedulePhase() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!playing) return;
      phase = Math.min(4, phase + 1);
      if (phase === 4) {
        playing = false;
        timer = null;
      }
      paintPhase();
      if (playing) schedulePhase();
    }, 1300 / Number(el("cross-speed").value));
  }
  el("cross-play").addEventListener("click", () => {
    if (playing) return stopPlayback();
    if (phase === 4) phase = 0;
    playing = true;
    paintPhase();
    schedulePhase();
  });
  el("cross-back").addEventListener("click", () => {
    stopPlayback(); phase = Math.max(0, phase - 1); paintPhase();
  });
  el("cross-step").addEventListener("click", () => {
    stopPlayback(); phase = Math.min(4, phase + 1); paintPhase();
  });
  el("cross-reset").addEventListener("click", () => {
    stopPlayback(); phase = 0; paintPhase();
  });
  el("cross-speed").addEventListener("change", () => { if (playing) schedulePhase(); });
  el("case").addEventListener("change", () => { stopPlayback(); phase = 0; paintPhase(); });
  reduced.addEventListener("change", stopPlayback);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopPlayback(); });
  window.addEventListener("pagehide", stopPlayback);
  paintPhase();

  const puzzle = make("div", "tool pairing-tool", `
    <h3 class="tool-heading">${tr("這四塊，怎樣排才得到題目的中間項？", "How would you arrange these four pieces?")}</h3>
    <div class="controls"><label>${tr("配對題", "Pairing question")}<select id="pair-case"></select></label><span class="pair-progress" id="pair-progress"></span></div>
    <div class="tool-body">
      <p class="math target-expression" id="pair-target"></p>
      <div class="pairing-work">
        <div class="pairing-board">
          <div class="pair-column-labels"><span>${tr("首項", "Leading term")}</span><span>${tr("常數", "Constant")}</span></div>
          <div class="cross-grid puzzle-grid" role="group" aria-label="${tr("十字配對位置", "Cross pairing positions")}">
            <button type="button" class="math pair-slot" data-slot="0" style="grid-column:1;grid-row:1"></button>
            <button type="button" class="math pair-slot" data-slot="1" style="grid-column:3;grid-row:1"></button>
            <button type="button" class="math pair-slot" data-slot="2" style="grid-column:1;grid-row:2"></button>
            <button type="button" class="math pair-slot" data-slot="3" style="grid-column:3;grid-row:2"></button>
            <svg viewBox="0 0 100 116" aria-hidden="true"><path d="M8 29 92 87" stroke="#276996" stroke-width="2"/><path d="M8 87 92 29" stroke="#ad3e58" stroke-width="2"/></svg>
          </div>
        </div>
        <div class="pairing-tray" role="group" aria-label="${tr("待配對的四塊", "Four pieces to pair")}">
          ${[0, 1, 2, 3].map(i => `<button type="button" class="math pair-token" data-token="${i}" aria-pressed="false"></button>`).join("")}
        </div>
      </div>
      <p id="pair-feedback" class="feedback" aria-live="polite"></p>
      <div class="formula math" id="pair-result" hidden></div>
      <div class="actions"><button type="button" class="secondary" id="pair-reset">${tr("重新配對", "Clear pairing")}</button><button type="button" class="secondary" id="pair-hint">${tr("提示", "Hint")}</button><button type="button" class="primary" id="pair-next" hidden>${tr("下一題", "Next question")}</button></div>
    </div>`);
  document.querySelector("#coefficient > .tool").after(puzzle);
  const puzzleOrder = [4, 5, 0, 1, 2, 3, 6, 7];
  for (const index of puzzleOrder) {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = plain(poly(...coefficients(cases[index])));
    el("pair-case").append(option);
  }
  el("pair-case").value = "4";
  const slots = [...puzzle.querySelectorAll(".pair-slot")];
  const tokenButtons = [...puzzle.querySelectorAll(".pair-token")];
  let tokens = [];
  let placements = [null, null, null, null];
  let selected = null;
  let drag = null;
  let suppressUntil = 0;
  let suppressToken = null;
  const completedPairs = new Set();
  const positions = [tr("左上", "Top left"), tr("右上", "Top right"), tr("左下", "Bottom left"), tr("右下", "Bottom right")];
  function pairFeedback(text, correct = false) {
    el("pair-feedback").innerHTML = text;
    el("pair-feedback").dataset.correct = String(correct);
  }
  function evaluatePair() {
    const empty = placements.filter(value => value === null).length;
    el("pair-result").hidden = true;
    el("pair-next").hidden = true;
    el("pair-progress").textContent = tr(`完成 ${completedPairs.size}/8`, `${completedPairs.size}/8 paired`);
    if (empty) {
      pairFeedback(tr(`還有 ${empty} 個空位。`, `${empty} positions are still empty.`));
      return;
    }
    const pair = placements.map(index => tokens[index].value);
    const [p, q, r, s] = pair;
    const target = coefficients(cases[+el("pair-case").value]);
    const actual = coefficients(pair);
    const correct = same(actual, target);
    if (correct) {
      completedPairs.add(+el("pair-case").value);
      el("pair-progress").textContent = tr(`完成 ${completedPairs.size}/8`, `${completedPairs.size}/8 paired`);
      el("pair-next").hidden = completedPairs.size === 8;
    }
    pairFeedback(correct
      ? tr("配對成功，三項都吻合。", "Paired! All three terms match.")
      : tr(`未配對：得到 ${term(actual[1])}，不是 ${term(target[1])}。試換右邊兩數。`, `Not a match: ${term(actual[1])}, not ${term(target[1])}. Try swapping the right column.`), correct);
    el("pair-result").innerHTML = `<span class="formula-label">${tr("交叉項驗算", "Check the diagonal terms")}</span>${term(p * s)} + (${term(q * r)}) = ${term(actual[1])}${correct ? `<br>${factor(p, q)}${factor(r, s)} = ${poly(...actual)}` : `<br>≠ ${term(target[1])}`}`;
    el("pair-result").hidden = false;
    puzzle.dataset.correct = String(correct);
  }
  function renderPair() {
    slots.forEach((slot, index) => {
      const token = placements[index];
      slot.innerHTML = token === null ? '<span aria-hidden="true">+</span>' : tokens[token].kind === "x" ? term(tokens[token].value) : signed(tokens[token].value);
      slot.classList.toggle("is-filled", token !== null);
      slot.setAttribute("aria-label", `${positions[index]}: ${token === null ? tr("空位", "empty") : plain(slot.innerHTML)}`);
      slot.title = token === null ? tr("放入所選的一塊", "Place the selected piece") : tr("取回這一塊", "Pick up this piece");
    });
    tokenButtons.forEach((button, index) => {
      const token = tokens[index];
      button.innerHTML = token.kind === "x" ? term(token.value) : signed(token.value);
      button.disabled = placements.includes(index);
      button.setAttribute("aria-pressed", String(selected === index));
      button.setAttribute("aria-label", `${plain(button.innerHTML)} · ${tr("第", "piece ")}${index + 1}${tr("塊", "")}`);
    });
    delete puzzle.dataset.correct;
    evaluatePair();
  }
  function clearDrag() {
    if (drag) {
      const button = tokenButtons[drag.token];
      button.style.transform = "";
      button.classList.remove("is-dragging");
      if (button.hasPointerCapture(drag.pointerId)) button.releasePointerCapture(drag.pointerId);
    }
    drag = null;
    slots.forEach(slot => slot.classList.remove("is-over"));
  }
  function resetPair() {
    clearDrag();
    const [p, q, r, s] = cases[+el("pair-case").value];
    tokens = [{ kind: "constant", value: s }, { kind: "x", value: p }, { kind: "constant", value: q }, { kind: "x", value: r }];
    placements = [null, null, null, null];
    selected = null;
    el("pair-target").innerHTML = poly(...coefficients([p, q, r, s]));
    renderPair();
  }
  function placeSelected(slot) {
    if (selected === null) {
      if (placements[slot] !== null) {
        selected = placements[slot]; placements[slot] = null; renderPair();
        tokenButtons[selected].focus({ preventScroll: true });
      }
      return;
    }
    const next = putToken(placements, selected, slot, tokens);
    if (!next) {
      renderPair();
      pairFeedback(tr(slot % 2 === 0 ? "左邊相乘要得到首項：這裏應放含 x 的一塊。" : "右邊相乘要得到常數項：這裏應放數字。", slot % 2 === 0 ? "The left column gives the leading term. Use a piece containing x." : "The right column gives the constant term. Use a number."));
      return;
    }
    placements = next; selected = null; renderPair();
    slots[slot].focus({ preventScroll: true });
  }
  slots.forEach((slot, index) => {
    slot.addEventListener("click", () => placeSelected(index));
    slot.addEventListener("keydown", event => {
      if ((event.key === "Delete" || event.key === "Backspace") && placements[index] !== null) {
        event.preventDefault(); placements[index] = null; selected = null; renderPair();
      }
    });
  });
  tokenButtons.forEach((button, index) => {
    button.addEventListener("click", event => {
      if (event.detail > 0 && suppressToken === index && Date.now() < suppressUntil) return;
      selected = selected === index ? null : index;
      renderPair();
    });
    button.addEventListener("pointerdown", event => {
      if (button.disabled || event.button !== 0 || drag) return;
      drag = { token: index, x: event.clientX, y: event.clientY, pointerId: event.pointerId, moved: false };
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener("pointermove", event => {
      if (!drag || drag.token !== index || drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      drag.moved = true;
      button.classList.add("is-dragging");
      button.style.transform = `translate(${dx}px,${dy}px)`;
      slots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        slot.classList.toggle("is-over", event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom);
      });
    });
    button.addEventListener("pointerup", event => {
      if (!drag || drag.token !== index || drag.pointerId !== event.pointerId) return;
      const moved = drag.moved;
      const destination = slots.findIndex(slot => {
        const rect = slot.getBoundingClientRect();
        return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      });
      clearDrag();
      if (moved) {
        suppressUntil = Date.now() + 350;
        suppressToken = index;
        selected = index;
        if (destination !== -1) placeSelected(destination);
        else { renderPair(); pairFeedback(tr("這塊還未放入十字圖。", "This piece has not been placed in the cross.")); }
      }
    });
    button.addEventListener("pointercancel", clearDrag);
    button.addEventListener("lostpointercapture", () => { if (drag?.token === index) clearDrag(); });
  });
  puzzle.addEventListener("keydown", event => {
    if (event.key === "Escape") { clearDrag(); selected = null; renderPair(); }
  });
  el("pair-case").addEventListener("change", resetPair);
  el("pair-reset").addEventListener("click", () => { resetPair(); tokenButtons[0].focus({ preventScroll: true }); });
  el("pair-next").addEventListener("click", () => {
    const current = puzzleOrder.indexOf(+el("pair-case").value);
    const remaining = [...puzzleOrder.slice(current + 1), ...puzzleOrder.slice(0, current + 1)];
    const next = remaining.find(index => !completedPairs.has(index));
    if (next === undefined) return;
    el("pair-case").value = String(next);
    resetPair();
    el("pair-target").setAttribute("tabindex", "-1");
    el("pair-target").focus({ preventScroll: true });
  });
  el("pair-hint").addEventListener("click", () => {
    const [p, q, r, s] = cases[+el("pair-case").value];
    pairFeedback(tr(`左邊的乘積要是 ${term(p * r)}<sup>2</sup>，右邊要是 ${number(q * s)}；再讓兩條對角線相加得到 ${term(p * s + q * r)}。`, `The left product must be ${term(p * r)}<sup>2</sup> and the right product ${number(q * s)}. The diagonals must then add to ${term(p * s + q * r)}.`));
  });
  resetPair();

  const quiz = make("fieldset", "factor-quiz", `<legend>${tr("哪組才對？", "Which pair works?")}</legend><div class="progress-line"><span id="factor-count"></span><progress id="factor-progress" value="0" max="10" aria-label="${tr("已答對題數", "Questions solved")}"></progress></div><div class="factor-options"></div><p class="feedback" id="factor-feedback" aria-live="polite"></p>`);
  el("exercise-hint").after(quiz);
  const solved = new Set();
  function showQuizProgress() {
    el("factor-count").textContent = tr(`答對 ${solved.size}/10`, `${solved.size}/10 solved`);
    el("factor-progress").value = solved.size;
  }
  function renderFactorQuiz() {
    showQuizProgress();
    const index = +el("exercise").value;
    const target = coefficients(exercises[index], exercises[index][4]);
    const choices = quiz.querySelector(".factor-options");
    choices.replaceChildren();
    el("factor-feedback").innerHTML = "";
    delete el("factor-feedback").dataset.correct;
    choiceOptions(exercises[index], index).forEach((option, i) => {
      const [p, q, r, s] = option.pair;
      const prefix = option.k === 1 ? "" : option.k === -1 ? "−" : number(option.k);
      const button = make("button", "choice factor-choice", `<span class="option-letter">${"ABC"[i]}</span><span>${prefix}${factor(p, q)}${factor(r, s)}</span>`);
      button.type = "button";
      button.addEventListener("click", () => {
        const actual = coefficients(option.pair, option.k);
        const correct = same(actual, target);
        button.classList.add(correct ? "correct" : "wrong");
        button.setAttribute("aria-label", `${correct ? tr("正確", "Correct") : tr("錯誤", "Incorrect")}: ${plain(button.innerHTML)}`);
        const failed = actual.findIndex((value, position) => value !== target[position]);
        const part = [tr("首項", "leading term"), tr("中間項", "middle term"), tr("常數項", "constant term")][failed];
        el("factor-feedback").innerHTML = correct
          ? `<span class="correction-label">${tr("答對了 · 展開驗算", "Correct · Check by expansion")}</span><span class="math">${poly(...actual)}</span>`
          : `<span class="correction-label correction-wrong">${tr("錯誤答案", "Incorrect answer")}</span>${tr(`這組因式的${part}不符。`, `The ${part} does not match.`)}<span class="math">${poly(...actual)}</span>${tr("再試另一組。", "Try another pair.")}`;
        el("factor-feedback").dataset.correct = String(correct);
        if (correct) {
          solved.add(index);
          showQuizProgress();
          choices.querySelectorAll("button").forEach(node => { node.disabled = true; });
          el("exercise-cross").hidden = false;
          el("exercise-answer").hidden = false;
          el("exercise-reveal").hidden = true;
          el("factor-feedback").setAttribute("tabindex", "-1");
          el("factor-feedback").focus({ preventScroll: true });
        } else {
          button.disabled = true;
          const available = [...choices.querySelectorAll("button")].find(node => !node.disabled);
          if (available) available.focus({ preventScroll: true });
        }
      });
      choices.append(button);
    });
  }
  el("exercise").addEventListener("change", renderFactorQuiz);
  ["exercise-prev", "exercise-next"].forEach(id => el(id).addEventListener("click", renderFactorQuiz));
  renderFactorQuiz();
})();

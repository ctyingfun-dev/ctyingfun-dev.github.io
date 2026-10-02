(() => {
  "use strict";
  const english = document.documentElement.lang === "en";
  const tr = (zh, en) => english ? en : zh;
  function fold(nodes, title, className = "lesson-detail") {
    const present = nodes.filter(Boolean);
    if (!present.length) return null;
    const details = document.createElement("details");
    details.className = className;
    const summary = document.createElement("summary");
    summary.textContent = title;
    details.append(summary);
    present[0].before(details);
    present.forEach(node => details.append(node));
    return details;
  }
  function switchCases(sectionID, labels, titles) {
    const section = document.getElementById(sectionID);
    const panels = [...section.children].filter(node => node.matches(".example"));
    const tabs = document.createElement("div");
    tabs.className = "case-switch";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", tr("選擇情況", "Choose a case"));
    panels[0].before(tabs);
    const buttons = panels.map((panel, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = labels[index];
      button.id = `${sectionID}-tab-${index}`;
      panel.id = `${sectionID}-panel-${index}`;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", panel.id);
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", button.id);
      panel.querySelector("h3").textContent = titles[index];
      button.addEventListener("click", () => activate(index));
      button.addEventListener("keydown", event => {
        const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? panels.length - 1 : (index + (event.key === "ArrowRight" ? 1 : panels.length - 1)) % panels.length;
        activate(next);
        buttons[next].focus();
      });
      tabs.append(button);
      const explanation = [...panel.children].filter(node => node.matches("p") && !node.matches(".math"));
      const detail = fold(explanation, tr("為甚麼？", "Why?"), "lesson-detail inline-explanation");
      if (detail) panel.append(detail);
      return button;
    });
    function activate(index) {
      panels.forEach((panel, i) => {
        panel.hidden = i !== index;
        buttons[i].setAttribute("aria-selected", String(i === index));
        buttons[i].setAttribute("tabindex", i === index ? "0" : "-1");
      });
    }
    activate(0);
  }
  const why = document.getElementById("why");
  why.querySelector(".tool-heading").classList.add("sr-only");
  why.querySelector("h2").textContent = tr("中間項對得上嗎？", "Does the middle match?");
  const derivation = [...why.children].find(node => node.matches(".formula"));
  const description = [...why.children].find(node => node.matches("p"));
  derivation.classList.add("chalk-derivation");
  const principles = fold([derivation, description], tr("為甚麼是交叉相乘？", "Why multiply diagonally?"));
  why.append(principles);
  fold([document.querySelector("#why .diagonal-result"), document.getElementById("clue")], tr("驗算首尾與中間項", "Check all three terms"));
  document.getElementById("reveal").textContent = tr("看因式", "Show factors");
  const settings = fold(
    [document.getElementById("cross-back"), document.getElementById("cross-reset"), document.getElementById("cross-speed").parentNode],
    tr("播放設定", "Playback settings"), "playback-settings");
  const settingsBody = document.createElement("div");
  [...settings.children].filter(node => !node.matches("summary")).forEach(node => settingsBody.append(node));
  settings.append(settingsBody);
  document.getElementById("cross-play").parentNode.append(settings);

  const signs = document.getElementById("signs");
  signs.querySelector("h2").textContent = tr("正負號怎樣選？", "Which signs do we need?");
  const signsFormula = [...signs.children].find(node => node.matches(".formula"));
  const signsCorrection = signs.querySelector(".teacher-correction");
  const signsDetail = fold([signsFormula, signsCorrection], tr("乘積對了，為甚麼仍會錯？", "Right product, wrong answer?"));
  signs.append(signsDetail);
  switchCases("signs",
    [tr("兩個正數", "Both positive"), tr("兩個負數", "Both negative"), tr("一正一負", "Opposite signs")],
    [tr("乘積 +6、和 +5，怎樣配？", "Product +6, sum +5: which pair?"), tr("和變成 −5，怎樣改？", "Sum −5: what changes?"), tr("負號該放在哪裏？", "Where does the minus go?")]);

  const coefficient = document.getElementById("coefficient");
  coefficient.querySelector("h2").textContent = tr("交換後會一樣嗎？", "What changes when we swap?");
  const extra = [...coefficient.children].filter(node => node.matches(".example"));
  fold(extra, tr("係數是 6，還有哪些配對？", "Leading coefficient 6: which pairs?"));
  const introduction = [...coefficient.children].find(node => node.matches("p"));
  fold([introduction, ...[...coefficient.children].filter(node => node.matches(".tool"))], tr("看一次交換示範", "See a worked swap"));
  const puzzle = coefficient.querySelector(".pairing-tool");
  coefficient.querySelector(".section-heading").after(puzzle);
  puzzle.querySelector("h3").textContent = tr("你排的十字，配得對嗎？", "Does your cross work?");

  const first = document.getElementById("first");
  first.querySelector("h2").textContent = tr("要先提出甚麼？", "What comes out first?");
  fold([first.querySelector(".teacher-correction")], tr("外面的因式去了哪裏？", "Where did the outside factor go?"));
  switchCases("first",
    [tr("提出 2", "Take out 2"), tr("提出 −1", "Take out −1"), tr("提出 3x", "Take out 3x")],
    [tr("先提出 2，剩下甚麼？", "Take out 2. What remains?"), tr("提出 −1，哪些項變號？", "Which signs change?"), tr("數字和字母都找齊了嗎？", "Have we found both common factors?")]);

  const special = document.getElementById("special");
  special.querySelector("h2").textContent = tr("有沒有更快的方法？", "Is there a quicker way?");
  fold([special.querySelector(".note")], tr("因式分解是在求 x 嗎？", "Are we solving for x?"));
  switchCases("special",
    [tr("平方差", "Difference of squares"), tr("完全平方", "Perfect square"), tr("常數為零", "Zero constant"), tr("無整數配對", "No integer pair")],
    [tr("哪兩項抵消了？", "Which terms cancel?"), tr("兩行一樣，怎樣寫短？", "Same rows: a shorter answer?"), tr("直接提出字母，可以嗎？", "Can we take out x directly?"), tr("所有整數配對都試過了嗎？", "Have we checked every integer pair?")]);
  document.getElementById("practice").querySelector("h2").textContent = tr("換你配，對得上嗎？", "Your turn. Does it match?");
  document.querySelector("#practice .tool-heading").classList.add("sr-only");
})();

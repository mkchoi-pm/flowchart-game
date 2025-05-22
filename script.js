// script.js
let playerName = "";
let draggingEl = null; // 터치 중인 도형
let touchOffsetX = 0;
let touchOffsetY = 0;

document.addEventListener("DOMContentLoaded", () => {
  loadRecords();
  setupStartButton();
  setupResetButton();
  initGame();
});

function loadRecords() {
  const records = JSON.parse(localStorage.getItem("game_results") || "[]");
  const container = document.getElementById("records");
  container.innerHTML = "";
  if (records.length === 0) {
    container.innerHTML = "<p>아직 기록이 없습니다.</p>";
    return;
  }
  const table = document.createElement("table");
  table.id = "records-table";
  const thead = table.createTHead();
  const headerRow = thead.insertRow();
  ["시간", "참여자", "결과"].forEach((txt) => {
    const th = document.createElement("th");
    th.textContent = txt;
    headerRow.appendChild(th);
  });
  const tbody = table.createTBody();
  records
    .slice()
    .reverse()
    .forEach((r) => {
      const tr = tbody.insertRow();
      tr.insertCell().textContent = formatDateYYMMDD_HHMMSS(new Date(r.time));
      tr.insertCell().textContent = r.name;
      const tdResult = tr.insertCell();
      tdResult.textContent =
        r.result === "정답" ? "정답입니다 🥳" : "오답이에요 🥲";
      tdResult.style.color = r.result === "정답" ? "black" : "gray";
    });
  container.appendChild(table);

  const total = records.length;
  const success = records.filter((r) => r.result === "정답").length;
  const analytics = document.getElementById("result-analytics");
  analytics.style.display = "block";
  analytics.innerHTML = `<span>참여자 <strong>${total}</strong>명 중 <strong>${success}</strong>명이 성공했어요!</span>`;
}

function setupStartButton() {
  const startBtn = document.getElementById("start-btn");
  startBtn.addEventListener("click", () => {
    const name = document.getElementById("name-input").value.trim();
    if (!name) {
      alert("이름을 입력해주세요.");
      return;
    }
    const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
    sessions.push({ name, start: new Date().toISOString() });
    localStorage.setItem("sessions", JSON.stringify(sessions));
    playerName = name;
    document.getElementById("start-screen").style.display = "none";

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    document.getElementById("game-screen").style.display = isMobile
      ? "flex"
      : "grid";

    initGame();
  });
  document.getElementById("name-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing) startBtn.click();
  });
}

function setupResetButton() {
  document.getElementById("reset-btn").addEventListener("click", () => {
    window.location.reload();
  });
}

function initGame() {
  const shapesData = [
    { idx: "1", label: "🔍 SQL 쿼리로 바꿀 수 있는 질문인지 살펴봐요!" },
    { idx: "2", label: "📂 데이터를 꺼내올 테이블을 결정해요!" },
    { idx: "3", label: "🔄 테이블에서 컬럼을 찾아 SQL 쿼리로 바꿔요!" },
    { idx: "4", label: "🖨️ 데이터를 읽고 알맞은 답변을 작성해요!" },
    { idx: "5", label: "📊 결과를 쉽게 이해할 수 있도록 차트를 만들어요!" },
  ];
  const pool = document.getElementById("shapes-pool");
  pool.innerHTML = "";

  shuffle(shapesData).forEach((s) => {
    const d = document.createElement("div");
    d.className = "shape square";
    d.dataset.index = s.idx;
    d.textContent = s.label;
    // desktop drag/drop
    d.setAttribute("draggable", "true");
    d.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", s.idx);
    });
    // mobile touch
    d.addEventListener("touchstart", onTouchStart, { passive: false });
    pool.appendChild(d);
  });

  document.querySelectorAll(".blank-box").forEach((blank) => {
    // desktop
    blank.addEventListener("dragover", (e) => e.preventDefault());
    blank.addEventListener("drop", (e) => {
      e.preventDefault();
      placeShape(blank, e.dataTransfer.getData("text/plain"));
    });
  });

  document.getElementById("submit-btn").addEventListener("click", () => {
    const total = document.querySelectorAll(".blank-box").length;
    const filled = document.querySelectorAll(".blank-box.filled").length;
    if (filled < total) {
      alert("플로우차트를 완성해주세요!");
      return;
    }
    let allCorrect = true;
    document.querySelectorAll(".blank-box").forEach((b) => {
      const s = b.querySelector(".shape");
      if (!s || s.dataset.index !== b.dataset.index) allCorrect = false;
    });
    const modal = document.getElementById("result-modal");
    document.getElementById("modal-message").textContent = allCorrect
      ? "정답 🥳"
      : "오답 🥲";
    modal.style.display = "flex";
    const res = JSON.parse(localStorage.getItem("game_results") || "[]");
    res.push({
      name: playerName,
      result: allCorrect ? "정답" : "오답",
      time: new Date().toISOString(),
    });
    localStorage.setItem("game_results", JSON.stringify(res));
  });
  document
    .getElementById("modal-close")
    .addEventListener("click", () => window.location.reload());
}

// --- touch drag/drop ---
function onTouchStart(e) {
  e.preventDefault();
  draggingEl = e.currentTarget;
  const t = e.touches[0];
  const r = draggingEl.getBoundingClientRect();
  touchOffsetX = t.clientX - r.left;
  touchOffsetY = t.clientY - r.top;

  draggingEl.style.position = "absolute";
  draggingEl.style.zIndex = "1000";
  moveAt(t.pageX, t.pageY);
  document.body.appendChild(draggingEl);

  document.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("touchend", onTouchEnd, { passive: false });
}

function onTouchMove(e) {
  e.preventDefault();
  const t = e.touches[0];
  moveAt(t.pageX, t.pageY);
}

function onTouchEnd(e) {
  e.preventDefault();
  const t = e.changedTouches[0];
  const x = t.clientX,
    y = t.clientY;

  // 빈칸 hit-test: bounding rect 검사
  let dropBox = null;
  document.querySelectorAll(".blank-box").forEach((box) => {
    const rect = box.getBoundingClientRect();
    if (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    ) {
      dropBox = box;
    }
  });

  if (dropBox) {
    placeShape(dropBox, draggingEl.dataset.index, draggingEl);
  } else {
    // 잘못된 부분: dropBox 가 아니라 draggingEl 을 pool 에 다시 추가해야 합니다
    const pool = document.getElementById("shapes-pool");
    pool.appendChild(draggingEl);
  }

  // 스타일 & 위치값 초기화
  draggingEl.style.position = "";
  draggingEl.style.zIndex = "";
  draggingEl.style.left = "";
  draggingEl.style.top = "";

  draggingEl = null;
  document.removeEventListener("touchmove", onTouchMove);
  document.removeEventListener("touchend", onTouchEnd);
}

function moveAt(x, y) {
  draggingEl.style.left = x - touchOffsetX + "px";
  draggingEl.style.top = y - touchOffsetY + "px";
}

function placeShape(blank, idx, draggingEl) {
  // if (blank.querySelector(".shape") || blank.dataset.index !== idx) {
  //   alert("잘못된 위치입니다. 다시 시도해주세요.");
  //   if (draggingEl) {
  //     const pool = document.getElementById("shapes-pool");
  //     pool.appendChild(draggingEl);
  //   }
  //   return;
  // }
  const s = document.querySelector(`.shape[data-index="${idx}"]`);
  blank.appendChild(s);
  s.removeAttribute("draggable");
  blank.classList.add("filled");
  // 진행률 업데이트
  document.getElementById("default-progress").style.display = "none";
  const prog = document.getElementById("progress");
  prog.style.display = "block";
  const total = document.querySelectorAll(".blank-box").length;
  const filled = document.querySelectorAll(".blank-box.filled").length;
  prog.innerHTML = `<span>${filled} / ${total}</span>`;
  // placeholder 숨기기
  const ph = blank.querySelector("#default-text");
  if (ph) ph.style.display = "none";
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatDateYYMMDD_HHMMSS(d) {
  const p = (n) => n.toString().padStart(2, "0");
  return (
    d.getFullYear().toString().slice(-2) +
    "." +
    p(d.getMonth() + 1) +
    "." +
    p(d.getDate()) +
    " " +
    p(d.getHours()) +
    ":" +
    p(d.getMinutes()) +
    ":" +
    p(d.getSeconds())
  );
}

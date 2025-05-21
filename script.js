let playerName = "";
//initGame();

// 페이지 로드 시: 참여자 기록 불러오기 & 시작 버튼 설정
document.addEventListener("DOMContentLoaded", () => {
  // 1) 과거 결과 표시
  const records = JSON.parse(localStorage.getItem("game_results") || "[]");
  const container = document.getElementById("records");
  container.innerHTML = ""; // 기존 내용 지우기

  if (records.length === 0) {
    container.innerHTML = "<p>아직 기록이 없습니다.</p>";
  } else {
    // 테이블 생성
    const table = document.createElement("table");
    table.id = "records-table";

    // 헤더
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    ["시간", "참여자", "결과"].forEach((txt) => {
      const th = document.createElement("th");
      th.textContent = txt;
      headerRow.appendChild(th);
    });

    // 바디
    const tbody = table.createTBody();
    records
      .slice()
      .reverse()
      .forEach((r) => {
        const tr = tbody.insertRow();
        // 시간
        const tdTime = tr.insertCell();
        tdTime.textContent = formatDateYYMMDD_HHMMSS(new Date(r.time));
        // 참여자
        const tdName = tr.insertCell();
        tdName.textContent = r.name;
        // 결과
        const tdResult = tr.insertCell();
        if (r.result === "정답") {
          tdResult.textContent = "정답입니다 🥳";
          tdResult.style.color = "black";
        } else {
          tdResult.textContent = "오답이에요 🥲";
          tdResult.style.color = "gray";
        }
      });

    container.appendChild(table);

    const totalCount = records.length;
    const successCount = records.filter((r) => r.result === "정답").length;

    // 3) result-analytics에 텍스트 삽입
    const analytics = document.getElementById("result-analytics");
    analytics.style.display = "block";
    analytics.innerHTML = `<span>
         참여자 <strong>${totalCount}</strong>명 중 
         <strong>${successCount}</strong>명이 성공했어요!
       </span>`;
  }
  //   const records = JSON.parse(localStorage.getItem('game_results') || '[]');
  //   const ul = document.getElementById('records');
  //   if (records.length === 0) {
  //     ul.innerHTML = '<li>아직 참여자가 없습니다.</li>';
  //   } else {
  //     records.reverse().forEach(r => {
  //       const li = document.createElement('li');
  //       li.textContent = `${r.name}: ${r.result} (${new Date(r.time).toLocaleString()})`;
  //       ul.appendChild(li);

  //       const totalCount   = records.length;
  //       const successCount = records.filter(r => r.result === '정답').length;

  //     // 3) result-analytics에 텍스트 삽입
  //     document.getElementById('result-analytics').style.display="block"
  //     document.getElementById('result-analytics').innerHTML =
  //     `<span>참여자 ${totalCount}명 중 ${successCount}명 이 성공했어요!</span>`;
  //     });
  //   }

  // 2) 시작하기 버튼
  document.getElementById("start-btn").addEventListener("click", () => {
    const input = document.getElementById("name-input");
    const name = input.value.trim();
    if (!name) {
      alert("이름을 입력해주세요.");
      return;
    }
    // 세션 저장 (이름 + 시작 시간)
    const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
    sessions.push({ name, start: new Date().toISOString() });
    localStorage.setItem("sessions", JSON.stringify(sessions));

    playerName = name;
    // 화면 전환
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "grid";

    initGame();
  });
});
// 게임 초기화 함수

function initGame() {
  // 1) 도형 데이터 정의
  const shapesData = [
    {
      idx: "1",
      type: "square",
      label: "🔍 SQL 쿼리로 바꿀 수 있는 질문인지 살펴봐요!",
    },
    // {idx: '2', type: 'square', label: '질문에 필수 항목이 모두 있는가?'},
    // {idx: '3', type: 'square', label: '오타/누락값 판단'},
    {
      idx: "2",
      type: "square",
      label: "📂 데이터를 꺼내올 테이블을 결정해요!",
    },
    {
      idx: "3",
      type: "square",
      label: "🔄 테이블에서 컬럼을 찾아 SQL 쿼리로 바꿔요!",
    },
    {
      idx: "4",
      type: "square",
      label: "🖨️ 데이터를 읽고 알맞은 답변을 작성해요!",
    },
    // {idx: '7', type: 'square', label: '데이터 추출 성공했는가?'},
    // {idx: '8', type: 'square', label: '재질문 요청하기'},
    {
      idx: "5",
      type: "square",
      label: "📊 결과를 쉽게 이해할 수 있도록 차트를 만들어요!",
    },
  ];

  // 2) 랜덤으로 섞어서 shapes-pool 에 뿌리기
  const pool = document.getElementById("shapes-pool");
  shuffle(shapesData).forEach((s) => {
    const div = document.createElement("div");
    div.classList.add("shape", s.type);
    div.setAttribute("draggable", "true");
    div.dataset.index = s.idx;
    // diamond의 텍스트 회전 보정
    if (s.type === "diamond") {
      div.innerHTML = `<span>${s.label}</span>`;
    } else {
      div.textContent = s.label;
    }
    // dragstart 이벤트
    div.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", s.idx);
    });
    pool.appendChild(div);
  });

  // 3) 빈칸(drop zone) 세팅
  document.querySelectorAll(".blank-box").forEach((blank) => {
    blank.addEventListener("dragover", (e) => e.preventDefault());
    blank.addEventListener("drop", (e) => {
      e.preventDefault();
      const shapeIdx = e.dataTransfer.getData("text/plain");
      // 이미 채워졌거나, index 불일치면 경고
      // if (blank.querySelector('.shape') || blank.dataset.index !== shapeIdx) {
      //     console.log('123',blank.querySelector('.shape'), blank.dataset.index, shapeIdx)
      //   alert('잘못된 위치입니다. 다시 시도해주세요.', blank.querySelector('.shape'), blank.dataset.index, shapeIdx);
      //   return;
      // }
      // 맞는 도형이면 빈칸에 위치 이동
      const shapeEl = document.querySelector(
        `.shape[data-index="${shapeIdx}"]`
      );
      blank.appendChild(shapeEl);
      shapeEl.draggable = false;
      blank.classList.add("filled");
      const total = document.querySelectorAll(".blank-box").length;
      const filled = document.querySelectorAll(".blank-box.filled").length;

      const placeholder = blank.querySelector("#default-text");
      if (placeholder) placeholder.style.display = "none";

      document.getElementById("default-progress").style.display = "none";
      document.getElementById("progress").style.display = "block";

      document.getElementById(
        "progress"
      ).innerHTML = `<span>${filled} / ${total}</span>`;
    });
  });

  document.getElementById("modal-close").addEventListener("click", () => {
    location.reload();
  });

  // 4) 제출 버튼
  document.getElementById("submit-btn").addEventListener("click", () => {
    const total = document.querySelectorAll(".blank-box").length;
    const filled = document.querySelectorAll(".blank-box.filled").length;
    if (filled < total) {
      alert(`플로우차트를 완성해주세요!`);
      return;
    }
    // 최종 정답 판정
    let allCorrect = true;
    document.querySelectorAll(".blank-box").forEach((b) => {
      const shp = b.querySelector(".shape");

      if (!shp || shp.dataset.index !== b.dataset.index) {
        allCorrect = false;
      }
    });

    // 결과 모달 띄우기 (기존 로직 재사용)
    const modal = document.getElementById("result-modal");
    const msg = document.getElementById("modal-message");
    msg.textContent = allCorrect ? "정답 🥳" : "오답 🥲";

    modal.style.display = "flex";

    // 로컬 저장
    const results = JSON.parse(localStorage.getItem("game_results") || "[]");
    results.push({
      name: playerName,
      result: allCorrect ? "정답" : "오답",
      time: new Date().toISOString(),
    });
    localStorage.setItem("game_results", JSON.stringify(results));
  });
}

// Fisher–Yates 섞기
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 간단한 배열 섞기 함수 (필요 시 Shape 랜덤 배치 등)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const nameInput = document.getElementById("name-input");
const startBtn = document.getElementById("start-btn");

nameInput.addEventListener("keydown", (e) => {
  // 한글 조합 중(isComposing)이면 무시하고,
  // 실제 Enter 입력일 때만 startBtn.click() 실행
  if (e.key === "Enter" && !e.isComposing) {
    startBtn.click();
  }
});

// 시간 포맷 설정
function formatDateYYMMDD_HHMMSS(date) {
  const pad = (n) => n.toString().padStart(2, "0");
  return (
    date.getFullYear().toString().slice(-2) +
    "." +
    pad(date.getMonth() + 1) +
    "." +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
}

document.getElementById("reset-btn").addEventListener("click", () => {
  window.location.reload();
});

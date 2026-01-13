/**
 * 구매 체스보드 (Purchasing Chessboard) 실습 사이트
 * Main JavaScript
 */

// ===== 전역 변수 =====
let leversData = null;
let currentQuestionIndex = 0;
let answers = {
  supplyPower: {},
  demandPower: {}
};

// ===== 데이터 로드 =====
async function loadLeversData() {
  try {
    const response = await fetch('data/levers.json');
    leversData = await response.json();
    return leversData;
  } catch (error) {
    console.error('데이터 로드 실패:', error);
    return null;
  }
}

// ===== 설문 관련 함수 =====
function initSurvey() {
  if (!leversData) {
    console.error('데이터가 로드되지 않았습니다.');
    return;
  }

  currentQuestionIndex = 0;
  answers = { supplyPower: {}, demandPower: {} };

  // 저장된 답변이 있으면 불러오기
  const savedAnswers = sessionStorage.getItem('surveyAnswers');
  if (savedAnswers) {
    answers = JSON.parse(savedAnswers);
  }

  renderQuestion();
  updateProgress();
}

function getAllQuestions() {
  if (!leversData) return [];

  const supplyQuestions = leversData.surveyQuestions.supplyPower.map(q => ({
    ...q,
    category: 'supplyPower',
    categoryName: '공급력 평가'
  }));

  const demandQuestions = leversData.surveyQuestions.demandPower.map(q => ({
    ...q,
    category: 'demandPower',
    categoryName: '수요력 평가'
  }));

  return [...supplyQuestions, ...demandQuestions];
}

function renderQuestion() {
  const questions = getAllQuestions();
  if (currentQuestionIndex >= questions.length) {
    finishSurvey();
    return;
  }

  const question = questions[currentQuestionIndex];
  const container = document.getElementById('question-container');
  if (!container) return;

  const savedAnswer = answers[question.category][question.id];

  container.innerHTML = `
    <div class="survey-question">
      <span class="question-number">${question.categoryName} - ${currentQuestionIndex + 1}/${questions.length}</span>
      <h3 class="question-text">${question.question}</h3>
      <p class="question-description">${question.description}</p>
      <div class="options-list">
        ${question.options.map(opt => `
          <label class="option-item ${savedAnswer === opt.value ? 'selected' : ''}" data-value="${opt.value}">
            <input type="radio" name="answer" value="${opt.value}" ${savedAnswer === opt.value ? 'checked' : ''}>
            <span class="option-radio"></span>
            <span class="option-text">${opt.label}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `;

  // 옵션 클릭 이벤트
  const options = container.querySelectorAll('.option-item');
  options.forEach(option => {
    option.addEventListener('click', function() {
      options.forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      this.querySelector('input').checked = true;

      const value = parseInt(this.dataset.value);
      answers[question.category][question.id] = value;
      sessionStorage.setItem('surveyAnswers', JSON.stringify(answers));
    });
  });

  updateNavigationButtons();
}

function updateProgress() {
  const questions = getAllQuestions();
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    const progress = ((currentQuestionIndex) / questions.length) * 100;
    progressBar.style.width = `${progress}%`;
  }

  const progressText = document.getElementById('progress-text');
  if (progressText) {
    progressText.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
  }
}

function updateNavigationButtons() {
  const questions = getAllQuestions();
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  if (prevBtn) {
    prevBtn.disabled = currentQuestionIndex === 0;
    prevBtn.style.visibility = currentQuestionIndex === 0 ? 'hidden' : 'visible';
  }

  if (nextBtn) {
    nextBtn.textContent = currentQuestionIndex === questions.length - 1 ? '결과 보기' : '다음';
  }
}

function nextQuestion() {
  const questions = getAllQuestions();
  const question = questions[currentQuestionIndex];

  // 현재 질문에 답변했는지 확인
  if (!answers[question.category][question.id]) {
    alert('답변을 선택해주세요.');
    return;
  }

  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
    updateProgress();
  } else {
    finishSurvey();
  }
}

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();
    updateProgress();
  }
}

function finishSurvey() {
  // 결과 계산 후 결과 페이지로 이동
  const result = calculateResult();
  sessionStorage.setItem('surveyResult', JSON.stringify(result));
  window.location.href = 'result.html';
}

// ===== 결과 계산 =====
function calculateResult() {
  const supplyAnswers = Object.values(answers.supplyPower);
  const demandAnswers = Object.values(answers.demandPower);

  // 평균 점수 계산 (1~4점 척도)
  const supplyScore = supplyAnswers.reduce((a, b) => a + b, 0) / supplyAnswers.length;
  const demandScore = demandAnswers.reduce((a, b) => a + b, 0) / demandAnswers.length;

  // 점수를 퍼센트로 변환 (1~4 -> 0~100)
  const supplyPercent = ((supplyScore - 1) / 3) * 100;
  const demandPercent = ((demandScore - 1) / 3) * 100;

  // 전략 결정
  const strategy = determineStrategy(supplyScore, demandScore);

  return {
    supplyScore,
    demandScore,
    supplyPercent,
    demandPercent,
    strategy,
    answers
  };
}

function determineStrategy(supplyScore, demandScore) {
  // 공급력: 높음 = 점수 높음 (2.5 이상), 낮음 = 점수 낮음 (2.5 미만)
  // 수요력: 높음 = 점수 높음 (2.5 이상), 낮음 = 점수 낮음 (2.5 미만)
  const supplyHigh = supplyScore >= 2.5;
  const demandHigh = demandScore >= 2.5;

  if (supplyHigh && !demandHigh) {
    // 공급력 높음 + 수요력 낮음 = 수요 성질 변경
    return 1;
  } else if (!supplyHigh && !demandHigh) {
    // 공급력 낮음 + 수요력 낮음 = 지출 관리
    return 2;
  } else if (!supplyHigh && demandHigh) {
    // 공급력 낮음 + 수요력 높음 = 경쟁 활용
    return 3;
  } else {
    // 공급력 높음 + 수요력 높음 = 공동 이익 추구
    return 4;
  }
}

// ===== 결과 페이지 렌더링 =====
function initResultPage() {
  const resultData = sessionStorage.getItem('surveyResult');
  if (!resultData) {
    window.location.href = 'survey.html';
    return;
  }

  loadLeversData().then(() => {
    const result = JSON.parse(resultData);
    renderResult(result);
  });
}

function renderResult(result) {
  // 점수 바 업데이트
  const supplyBar = document.getElementById('supply-bar');
  const demandBar = document.getElementById('demand-bar');
  const supplyValue = document.getElementById('supply-value');
  const demandValue = document.getElementById('demand-value');

  if (supplyBar) supplyBar.style.width = `${result.supplyPercent}%`;
  if (demandBar) demandBar.style.width = `${result.demandPercent}%`;
  if (supplyValue) supplyValue.textContent = `${Math.round(result.supplyPercent)}%`;
  if (demandValue) demandValue.textContent = `${Math.round(result.demandPercent)}%`;

  // 전략 정보 표시
  const strategy = leversData.strategies.find(s => s.id === result.strategy);
  if (strategy) {
    const strategyName = document.getElementById('strategy-name');
    const strategyNameEn = document.getElementById('strategy-name-en');
    const strategyDesc = document.getElementById('strategy-description');

    if (strategyName) strategyName.textContent = strategy.name;
    if (strategyNameEn) strategyNameEn.textContent = strategy.nameEn;
    if (strategyDesc) strategyDesc.textContent = strategy.description;

    // 추천 레버 렌더링
    renderRecommendedLevers(strategy);
  }

  // 체스보드 위치 표시
  highlightChessboardPosition(result.strategy);
}

function renderRecommendedLevers(strategy) {
  const container = document.getElementById('recommended-levers');
  if (!container) return;

  const strategyClass = getStrategyClass(strategy.id);

  container.innerHTML = strategy.levers.map(lever => `
    <div class="lever-card">
      <div class="lever-card-header ${strategyClass}">
        <span class="lever-id">${lever.id}</span>
        <div>
          <h4>${lever.name}</h4>
          <p>${lever.nameEn}</p>
        </div>
      </div>
      <div class="lever-card-body">
        <p>${lever.detailedDescription}</p>

        <div class="lever-methods">
          <h4>주요 방법</h4>
          <ul>
            ${lever.methods.map(method => `<li>${method}</li>`).join('')}
          </ul>
        </div>

        <div class="lever-case">
          <h4>${lever.case.title}</h4>
          <dl class="case-detail">
            <dt>산업</dt>
            <dd>${lever.case.industry}</dd>
            <dt>상황</dt>
            <dd>${lever.case.situation}</dd>
            <dt>조치</dt>
            <dd>${lever.case.action}</dd>
            <dt>결과</dt>
            <dd>${lever.case.result}</dd>
          </dl>
        </div>
      </div>
    </div>
  `).join('');
}

function getStrategyClass(strategyId) {
  switch (strategyId) {
    case 1: return 'demand-change';
    case 2: return 'manage-spend';
    case 3: return 'leverage-competition';
    case 4: return 'joint-advantage';
    default: return '';
  }
}

function highlightChessboardPosition(strategyId) {
  const cells = document.querySelectorAll('.chessboard-cell[data-strategy]');
  cells.forEach(cell => {
    cell.classList.remove('active');
    if (parseInt(cell.dataset.strategy) === strategyId) {
      cell.classList.add('active');
    }
  });
}

// ===== 레버 페이지 =====
function initLeversPage() {
  loadLeversData().then(() => {
    if (leversData) {
      renderAllLevers();
      initTabs();
    }
  });
}

function renderAllLevers() {
  leversData.strategies.forEach(strategy => {
    const container = document.getElementById(`strategy-${strategy.id}-levers`);
    if (!container) return;

    const strategyClass = getStrategyClass(strategy.id);

    container.innerHTML = strategy.levers.map(lever => `
      <div class="lever-card">
        <div class="lever-card-header ${strategyClass}">
          <span class="lever-id">${lever.id}</span>
          <div>
            <h4>${lever.name}</h4>
            <p>${lever.nameEn}</p>
          </div>
        </div>
        <div class="lever-card-body">
          <p><strong>${lever.description}</strong></p>
          <p>${lever.detailedDescription}</p>

          <div class="lever-methods">
            <h4>주요 방법</h4>
            <ul>
              ${lever.methods.map(method => `<li>${method}</li>`).join('')}
            </ul>
          </div>

          <div class="lever-case">
            <h4>사례: ${lever.case.title}</h4>
            <dl class="case-detail">
              <dt>산업</dt>
              <dd>${lever.case.industry}</dd>
              <dt>상황</dt>
              <dd>${lever.case.situation}</dd>
              <dt>조치</dt>
              <dd>${lever.case.action}</dd>
              <dt>결과</dt>
              <dd>${lever.case.result}</dd>
            </dl>
          </div>
        </div>
      </div>
    `).join('');
  });
}

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetId)?.classList.add('active');
    });
  });
}

// ===== 체스보드 인터랙션 =====
function initChessboard() {
  createModal();
  const cells = document.querySelectorAll('.chessboard-cell[data-strategy]');
  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      const strategyId = parseInt(cell.dataset.strategy);
      showStrategyInfo(strategyId);
    });
  });
}

function createModal() {
  if (document.getElementById('strategy-modal')) return;

  const modalHTML = `
    <div id="strategy-modal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header" id="modal-header">
          <button class="modal-close" onclick="closeModal()">&times;</button>
          <h3 id="modal-title"></h3>
          <p id="modal-subtitle"></p>
        </div>
        <div class="modal-body">
          <p id="modal-description" style="margin-bottom: 20px;"></p>

          <h4>해당 품목 예시</h4>
          <div id="modal-examples" class="example-items"></div>

          <h4>4가지 레버</h4>
          <ul id="modal-levers" class="modal-levers"></ul>

          <div class="text-center mt-3">
            <a href="levers.html" class="btn btn-primary">상세 보기</a>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // 모달 외부 클릭 시 닫기
  document.getElementById('strategy-modal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeModal();
    }
  });

  // ESC 키로 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function showStrategyInfo(strategyId) {
  if (!leversData) return;

  const strategy = leversData.strategies.find(s => s.id === strategyId);
  if (!strategy) return;

  const strategyClass = getStrategyClass(strategyId);
  const modal = document.getElementById('strategy-modal');
  const header = document.getElementById('modal-header');

  // 헤더 색상 클래스 설정
  header.className = 'modal-header ' + strategyClass;

  // 콘텐츠 설정
  document.getElementById('modal-title').textContent = `${strategy.id}. ${strategy.name}`;
  document.getElementById('modal-subtitle').textContent = strategy.nameEn;
  document.getElementById('modal-description').textContent = strategy.description;

  // 예시 품목 렌더링
  const examplesContainer = document.getElementById('modal-examples');
  examplesContainer.innerHTML = strategy.exampleItems.map(item =>
    `<span class="example-item">${item}</span>`
  ).join('');

  // 레버 목록 렌더링
  const leversContainer = document.getElementById('modal-levers');
  leversContainer.innerHTML = strategy.levers.map(lever => `
    <li>
      <span class="lever-num">${lever.id}</span>
      <div class="lever-info">
        <strong>${lever.name}</strong>
        <span>${lever.description}</span>
      </div>
    </li>
  `).join('');

  // 모달 표시
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('strategy-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
  // 페이지별 초기화
  const page = document.body.dataset.page;

  switch (page) {
    case 'survey':
      loadLeversData().then(() => initSurvey());
      break;
    case 'result':
      initResultPage();
      break;
    case 'levers':
      initLeversPage();
      break;
    default:
      loadLeversData().then(() => initChessboard());
  }
});

// ===== 유틸리티 =====
function resetSurvey() {
  sessionStorage.removeItem('surveyAnswers');
  sessionStorage.removeItem('surveyResult');
  currentQuestionIndex = 0;
  answers = { supplyPower: {}, demandPower: {} };
  if (document.body.dataset.page === 'survey') {
    initSurvey();
  } else {
    window.location.href = 'survey.html';
  }
}

// ===== 공유/저장 기능 =====
function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = 'toast show ' + type;

  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

function getResultText() {
  const resultData = sessionStorage.getItem('surveyResult');
  if (!resultData) return '';

  const result = JSON.parse(resultData);
  const strategy = leversData?.strategies.find(s => s.id === result.strategy);

  let text = `===== 구매 체스보드 분석 결과 =====\n\n`;
  text += `[분석 점수]\n`;
  text += `- 공급력 (Supply Power): ${Math.round(result.supplyPercent)}%\n`;
  text += `- 수요력 (Demand Power): ${Math.round(result.demandPercent)}%\n\n`;

  if (strategy) {
    text += `[추천 전략]\n`;
    text += `${strategy.id}. ${strategy.name} (${strategy.nameEn})\n`;
    text += `${strategy.description}\n\n`;

    text += `[추천 레버]\n`;
    strategy.levers.forEach(lever => {
      text += `- ${lever.name}: ${lever.description}\n`;
    });
  }

  text += `\n===================================\n`;
  text += `분석 일시: ${new Date().toLocaleString('ko-KR')}\n`;
  text += `구매 체스보드 실습 사이트`;

  return text;
}

function copyResultToClipboard() {
  const text = getResultText();
  if (!text) {
    showToast('결과를 불러올 수 없습니다.', 'error');
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    showToast('결과가 클립보드에 복사되었습니다!', 'success');
  }).catch(() => {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('결과가 클립보드에 복사되었습니다!', 'success');
  });
}

function shareResultLink() {
  const resultData = sessionStorage.getItem('surveyResult');
  if (!resultData) {
    showToast('공유할 결과가 없습니다.', 'error');
    return;
  }

  // 결과를 Base64로 인코딩하여 URL 파라미터로 전달
  const encoded = btoa(encodeURIComponent(resultData));
  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = `${baseUrl}?r=${encoded}`;

  // 공유 링크 모달 생성 및 표시
  createShareLinkModal(shareUrl);
}

function createShareLinkModal(shareUrl) {
  // 기존 모달 제거
  const existingModal = document.getElementById('share-link-modal');
  if (existingModal) existingModal.remove();

  const modalHTML = `
    <div id="share-link-modal" class="share-link-modal active">
      <div class="share-link-content">
        <h3>결과 공유 링크</h3>
        <div class="share-link-input-group">
          <input type="text" id="share-url-input" value="${shareUrl}" readonly>
          <button onclick="copyShareLink()">복사</button>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 20px; text-align: center;">
          이 링크를 공유하면 동일한 분석 결과를 볼 수 있습니다.
        </p>
        <button class="share-link-close" onclick="closeShareLinkModal()">닫기</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // 모달 외부 클릭 시 닫기
  document.getElementById('share-link-modal').addEventListener('click', (e) => {
    if (e.target.classList.contains('share-link-modal')) {
      closeShareLinkModal();
    }
  });
}

function copyShareLink() {
  const input = document.getElementById('share-url-input');
  if (!input) return;

  input.select();
  navigator.clipboard.writeText(input.value).then(() => {
    showToast('링크가 복사되었습니다!', 'success');
  }).catch(() => {
    document.execCommand('copy');
    showToast('링크가 복사되었습니다!', 'success');
  });
}

function closeShareLinkModal() {
  const modal = document.getElementById('share-link-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }
}

function printResult() {
  window.print();
}

function downloadResultAsImage() {
  const resultSection = document.querySelector('.result-summary');
  if (!resultSection) {
    showToast('결과를 불러올 수 없습니다.', 'error');
    return;
  }

  showToast('이미지 생성 중...', '');

  // 공유 버튼 섹션 임시 숨김
  const shareSection = resultSection.querySelector('.share-section');
  if (shareSection) shareSection.style.display = 'none';

  html2canvas(resultSection, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false
  }).then(canvas => {
    // 공유 버튼 섹션 복원
    if (shareSection) shareSection.style.display = '';

    const link = document.createElement('a');
    link.download = `구매체스보드_분석결과_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('이미지가 저장되었습니다!', 'success');
  }).catch(err => {
    // 공유 버튼 섹션 복원
    if (shareSection) shareSection.style.display = '';
    console.error('이미지 생성 실패:', err);
    showToast('이미지 저장에 실패했습니다.', 'error');
  });
}

// URL 파라미터에서 결과 로드 (공유 링크로 접속 시)
function loadResultFromURL() {
  const params = new URLSearchParams(window.location.search);
  const encodedResult = params.get('r');

  if (encodedResult) {
    try {
      const decoded = decodeURIComponent(atob(encodedResult));
      sessionStorage.setItem('surveyResult', decoded);
      // URL에서 파라미터 제거 (깔끔한 URL 유지)
      window.history.replaceState({}, '', window.location.pathname);
      return true;
    } catch (e) {
      console.error('결과 로드 실패:', e);
    }
  }
  return false;
}

// 결과 페이지 초기화 시 URL 파라미터 확인
const originalInitResultPage = typeof initResultPage !== 'undefined' ? initResultPage : null;
initResultPage = function() {
  loadResultFromURL();

  const resultData = sessionStorage.getItem('surveyResult');
  if (!resultData) {
    window.location.href = 'survey.html';
    return;
  }

  loadLeversData().then(() => {
    const result = JSON.parse(resultData);
    renderResult(result);
  });
}

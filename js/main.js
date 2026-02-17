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

// Phase 2 설문 변수
let surveyPhase = 1;
let phase2Answers = {};
let determinedStrategy = null;

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
  surveyPhase = 1;
  phase2Answers = {};
  determinedStrategy = null;

  // 저장된 Phase 2 상태 복원
  const savedPhase = sessionStorage.getItem('surveyPhase');
  if (savedPhase) {
    surveyPhase = parseInt(savedPhase);
  }

  const savedPhase2 = sessionStorage.getItem('phase2Answers');
  if (savedPhase2) {
    phase2Answers = JSON.parse(savedPhase2);
  }

  const savedStrategy = sessionStorage.getItem('determinedStrategy');
  if (savedStrategy) {
    determinedStrategy = parseInt(savedStrategy);
  }

  // 저장된 답변이 있으면 불러오기
  const savedAnswers = sessionStorage.getItem('surveyAnswers');
  if (savedAnswers) {
    answers = JSON.parse(savedAnswers);

    if (surveyPhase === 1) {
      // Phase 1: 마지막으로 응답한 질문 다음 위치로 복원
      const questions = getAllQuestions();
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!answers[q.category][q.id]) {
          currentQuestionIndex = i;
          break;
        }
        if (i === questions.length - 1) {
          currentQuestionIndex = i;
        }
      }
    } else if (surveyPhase === 2) {
      // Phase 2: 마지막으로 응답한 질문 다음 위치로 복원
      const questions = getAllQuestions();
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!phase2Answers[q.id]) {
          currentQuestionIndex = i;
          break;
        }
        if (i === questions.length - 1) {
          currentQuestionIndex = i;
        }
      }
    }
  }

  renderQuestion();
  updateProgress();
}

function getAllQuestions() {
  if (!leversData) return [];

  if (surveyPhase === 2 && determinedStrategy) {
    // Phase 2: 전략별 맞춤 질문 반환
    const p2Questions = leversData.phase2Questions[String(determinedStrategy)];
    if (!p2Questions) return [];
    return p2Questions.map(q => ({
      ...q,
      category: 'phase2',
      categoryName: '레버 심층 평가'
    }));
  }

  // Phase 1: 기존 공급력/수요력 질문
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

  // Phase에 따라 저장된 답변 가져오기
  const savedAnswer = surveyPhase === 2
    ? phase2Answers[question.id]
    : answers[question.category][question.id];

  // Phase 표시 배지
  const phaseBadge = surveyPhase === 2
    ? `<span class="phase-badge phase2">2단계</span> `
    : `<span class="phase-badge phase1">1단계</span> `;

  container.innerHTML = `
    <div class="survey-question">
      <span class="question-number">${phaseBadge}${question.categoryName} - ${currentQuestionIndex + 1}/${questions.length}</span>
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
  let autoAdvanceTimer = null;
  const options = container.querySelectorAll('.option-item');
  options.forEach(option => {
    option.addEventListener('click', function() {
      options.forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      this.querySelector('input').checked = true;

      const value = parseInt(this.dataset.value);

      if (surveyPhase === 2) {
        phase2Answers[question.id] = value;
        sessionStorage.setItem('phase2Answers', JSON.stringify(phase2Answers));
      } else {
        answers[question.category][question.id] = value;
        sessionStorage.setItem('surveyAnswers', JSON.stringify(answers));
      }

      // 선택 후 자동으로 다음 질문으로 이동 (짧은 딜레이로 선택 확인 가능)
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = setTimeout(() => {
        autoAdvanceTimer = null;
        nextQuestion();
      }, 300);
    });
  });

  updateNavigationButtons();
}

function updateProgress() {
  const questions = getAllQuestions();
  const progressBar = document.getElementById('progress-bar');

  if (surveyPhase === 2) {
    // Phase 2: 전체 16문항 중 12 + 현재 위치
    const totalAll = 12 + questions.length;
    const currentAll = 12 + currentQuestionIndex + 1;
    if (progressBar) {
      progressBar.style.width = `${(currentAll / totalAll) * 100}%`;
      progressBar.style.background = 'linear-gradient(90deg, var(--secondary-color), var(--purple-color))';
    }
    const progressText = document.getElementById('progress-text');
    if (progressText) {
      progressText.textContent = `2단계: ${currentQuestionIndex + 1} / ${questions.length} (전체 ${currentAll} / ${totalAll})`;
    }
  } else {
    // Phase 1
    if (progressBar) {
      const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
      progressBar.style.width = `${progress}%`;
      progressBar.style.background = '';
    }
    const progressText = document.getElementById('progress-text');
    if (progressText) {
      progressText.textContent = `1단계: ${currentQuestionIndex + 1} / ${questions.length}`;
    }
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

  // 현재 질문에 답변했는지 확인 (Phase에 따라 다른 저장소)
  const hasAnswer = surveyPhase === 2
    ? phase2Answers[question.id]
    : answers[question.category]?.[question.id];

  if (!hasAnswer) {
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
  if (surveyPhase === 1) {
    // Phase 1 완료 → 전략 결정 후 전환 화면 표시
    const result = calculateResult();
    determinedStrategy = result.strategy;
    sessionStorage.setItem('determinedStrategy', String(determinedStrategy));
    showPhaseTransition(result);
  } else {
    // Phase 2 완료 → 최종 결과 계산 후 결과 페이지로 이동
    const result = calculateFinalResult();
    sessionStorage.setItem('surveyResult', JSON.stringify(result));
    window.location.href = 'result.html';
  }
}

function showPhaseTransition(result) {
  const container = document.getElementById('question-container');
  if (!container) return;

  const strategy = leversData.strategies.find(s => s.id === result.strategy);
  const strategyClass = getStrategyClass(result.strategy);

  // 네비게이션 버튼 숨기기
  const navEl = document.querySelector('.survey-navigation');
  if (navEl) navEl.style.display = 'none';

  container.innerHTML = `
    <div class="phase-transition-card">
      <div class="phase-transition-icon">&#10003;</div>
      <h2>1단계 완료!</h2>
      <p class="phase-transition-subtitle">구매 상황 분석이 완료되었습니다.</p>

      <div class="phase-transition-result">
        <div class="phase-transition-scores">
          <div class="phase-score-item">
            <span class="phase-score-label">공급력</span>
            <span class="phase-score-value">${Math.round(result.supplyPercent)}%</span>
          </div>
          <div class="phase-score-item">
            <span class="phase-score-label">수요력</span>
            <span class="phase-score-value">${Math.round(result.demandPercent)}%</span>
          </div>
        </div>
        <div class="phase-transition-strategy ${strategyClass}">
          <p class="strategy-label">추천 전략</p>
          <h3>${strategy.name}</h3>
          <p class="strategy-en">${strategy.nameEn}</p>
        </div>
      </div>

      <div class="phase-transition-next">
        <p>이제 <strong>2단계 맞춤 질문 4개</strong>에 답변하면<br>
        4가지 레버 중 우선순위를 파악할 수 있습니다.</p>
        <button class="btn btn-primary btn-large" onclick="startPhase2()">
          2단계 시작하기
        </button>
        <button class="btn btn-secondary btn-small mt-1" onclick="skipPhase2()">
          건너뛰고 결과 보기
        </button>
      </div>
    </div>
  `;
}

function startPhase2() {
  surveyPhase = 2;
  currentQuestionIndex = 0;
  phase2Answers = {};
  sessionStorage.setItem('surveyPhase', '2');
  sessionStorage.setItem('phase2Answers', JSON.stringify(phase2Answers));

  // 네비게이션 버튼 다시 표시
  const navEl = document.querySelector('.survey-navigation');
  if (navEl) navEl.style.display = '';

  renderQuestion();
  updateProgress();
}

function skipPhase2() {
  // Phase 2 없이 기본 결과로 이동
  const result = calculateResult();
  result.leverScores = null; // Phase 2 미실시 표시
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

// ===== Phase 2 결과 계산 =====
function calculateFinalResult() {
  // Phase 1 기본 점수
  const baseResult = calculateResult();

  // Phase 2 레버별 점수 계산
  const strategy = leversData.strategies.find(s => s.id === determinedStrategy);
  if (!strategy) return baseResult;

  const p2Questions = leversData.phase2Questions[String(determinedStrategy)];
  if (!p2Questions) return baseResult;

  const leverScores = {};
  p2Questions.forEach(q => {
    const answer = phase2Answers[q.id];
    if (answer !== undefined) {
      leverScores[q.leverTarget] = {
        score: answer,
        maxScore: 4
      };
    }
  });

  baseResult.leverScores = leverScores;
  baseResult.phase2Completed = true;
  return baseResult;
}

// ===== 결과 페이지 렌더링 =====
function initResultPage() {
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

    // 추천 레버 렌더링 (Phase 2 점수가 있으면 우선순위 표시)
    renderRecommendedLevers(strategy, result.leverScores);
  }

  // Phase 2 완료 여부 표시
  if (result.phase2Completed && result.leverScores) {
    renderPhase2Summary(strategy, result.leverScores);
  }

  // 체스보드 위치 표시
  highlightChessboardPosition(result.strategy);

  // 경계값 근처일 때 인접 전략 안내
  renderAdjacentStrategyNote(result);
}

function renderRecommendedLevers(strategy, leverScores) {
  const container = document.getElementById('recommended-levers');
  if (!container) return;

  const strategyClass = getStrategyClass(strategy.id);

  // Phase 2 점수가 있으면 점수 기준으로 정렬
  let levers = [...strategy.levers];
  if (leverScores && Object.keys(leverScores).length > 0) {
    levers.sort((a, b) => {
      const scoreA = leverScores[a.id]?.score || 0;
      const scoreB = leverScores[b.id]?.score || 0;
      return scoreB - scoreA;
    });
  }

  container.innerHTML = levers.map((lever, index) => {
    // 레버 우선순위 배지 생성
    let relevanceBadge = '';
    if (leverScores && Object.keys(leverScores).length > 0) {
      const score = leverScores[lever.id]?.score || 0;
      let badgeClass, badgeText;
      if (score >= 4) {
        badgeClass = 'relevance-top';
        badgeText = '최우선';
      } else if (score >= 3) {
        badgeClass = 'relevance-high';
        badgeText = '권장';
      } else {
        badgeClass = 'relevance-normal';
        badgeText = '참고';
      }
      relevanceBadge = `<span class="lever-relevance ${badgeClass}">${badgeText}</span>`;
    }

    return `
    <div class="lever-card">
      <div class="lever-card-header ${strategyClass}">
        <span class="lever-id">${lever.id}</span>
        <div>
          <h4>${lever.name} ${relevanceBadge}</h4>
          <p>${lever.nameEn}</p>
        </div>
      </div>
      <div class="lever-card-body">
        <p>${lever.detailedDescription}</p>

        <div class="lever-methods">
          <h4>주요 방법</h4>
          <ul>
            ${lever.methods.map(method => {
              const methodName = typeof method === 'object' ? method.name : method;
              return `<li>${methodName}</li>`;
            }).join('')}
          </ul>
        </div>

        <div class="lever-case">
          <h4>예시 시나리오: ${lever.case.title}</h4>
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
  `}).join('');
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

// ===== 인접 전략 안내 =====
function renderAdjacentStrategyNote(result) {
  const container = document.getElementById('adjacent-strategy-note');
  if (!container || !leversData) return;

  const THRESHOLD = 2.5;
  const BOUNDARY_MARGIN = 0.4; // 경계값 ±0.4 이내면 인접 전략 안내
  const supplyNearBoundary = Math.abs(result.supplyScore - THRESHOLD) <= BOUNDARY_MARGIN;
  const demandNearBoundary = Math.abs(result.demandScore - THRESHOLD) <= BOUNDARY_MARGIN;

  if (!supplyNearBoundary && !demandNearBoundary) {
    container.style.display = 'none';
    return;
  }

  // 인접 전략 ID 찾기
  const adjacentIds = new Set();
  const supplyHigh = result.supplyScore >= THRESHOLD;
  const demandHigh = result.demandScore >= THRESHOLD;

  if (supplyNearBoundary) {
    // 공급력 축이 경계 근처 → 공급력 반대쪽 전략도 고려
    const altStrategy = determineStrategy(supplyHigh ? THRESHOLD - 1 : THRESHOLD + 1, result.demandScore);
    adjacentIds.add(altStrategy);
  }
  if (demandNearBoundary) {
    // 수요력 축이 경계 근처 → 수요력 반대쪽 전략도 고려
    const altStrategy = determineStrategy(result.supplyScore, demandHigh ? THRESHOLD - 1 : THRESHOLD + 1);
    adjacentIds.add(altStrategy);
  }

  // 현재 전략 제외
  adjacentIds.delete(result.strategy);

  if (adjacentIds.size === 0) {
    container.style.display = 'none';
    return;
  }

  const adjacentNames = [...adjacentIds].map(id => {
    const s = leversData.strategies.find(s => s.id === id);
    return s ? `<strong>${s.name}</strong>` : '';
  }).filter(Boolean);

  container.style.display = '';
  container.innerHTML = `
    <div class="card" style="border-left: 4px solid var(--warning-color); background: rgba(243, 156, 18, 0.05);">
      <h4 style="color: var(--warning-color);">인접 전략 참고</h4>
      <p>분석 점수가 경계 영역에 위치하고 있어, ${adjacentNames.join(', ')} 전략의 레버도 함께 검토하면 효과적입니다.
      실무에서는 인접 사분면의 레버를 조합하여 활용하는 것이 원본 프레임워크의 권장 사항입니다.</p>
      <p style="margin-top: 8px; font-size: 0.9rem; color: var(--text-light);">
        공급력 ${Math.round(result.supplyPercent)}% | 수요력 ${Math.round(result.demandPercent)}% (경계값: 50%)
      </p>
    </div>
  `;
}

// ===== Phase 2 결과 요약 표시 =====
function renderPhase2Summary(strategy, leverScores) {
  const summaryContainer = document.querySelector('.result-summary');
  if (!summaryContainer) return;

  // 레버를 점수 순으로 정렬
  const sortedLevers = [...strategy.levers].sort((a, b) => {
    const scoreA = leverScores[a.id]?.score || 0;
    const scoreB = leverScores[b.id]?.score || 0;
    return scoreB - scoreA;
  });

  const html = `
    <div class="phase2-summary">
      <h4>레버 우선순위 (2단계 분석 결과)</h4>
      <div class="lever-priority-list">
        ${sortedLevers.map((lever, idx) => {
          const score = leverScores[lever.id]?.score || 0;
          let badgeClass, badgeText;
          if (score >= 4) { badgeClass = 'relevance-top'; badgeText = '최우선'; }
          else if (score >= 3) { badgeClass = 'relevance-high'; badgeText = '권장'; }
          else { badgeClass = 'relevance-normal'; badgeText = '참고'; }

          return `
            <div class="lever-priority-item">
              <span class="lever-priority-rank">${idx + 1}</span>
              <span class="lever-priority-name">${lever.name}</span>
              <span class="lever-relevance ${badgeClass}">${badgeText}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  summaryContainer.insertAdjacentHTML('beforeend', html);
}

// ===== 레버 페이지 =====
function initLeversPage() {
  loadLeversData().then(() => {
    if (leversData) {
      renderAllLevers();
      initTabs();
      render64MethodsChessboard();
    }
  });
}

// ===== 64개 방법 체스보드 렌더링 =====
function render64MethodsChessboard() {
  const container = document.getElementById('chessboard-64');
  if (!container || !leversData) return;

  // 전략 맵 생성
  const strategyMap = {};
  leversData.strategies.forEach(s => { strategyMap[s.id] = s; });

  // 8×8 사분면 배치 (2×2 체스보드와 동일한 배열)
  // 상단: 전략3 (좌, 수요력↑ 공급력↓) | 전략4 (우, 수요력↑ 공급력↑)
  // 하단: 전략2 (좌, 수요력↓ 공급력↓) | 전략1 (우, 수요력↓ 공급력↑)
  const quadrantRows = [
    { left: 3, right: 4 },
    { left: 2, right: 1 },
  ];

  let cells = [];

  quadrantRows.forEach(({ left, right }) => {
    const leftStrat = strategyMap[left];
    const rightStrat = strategyMap[right];

    for (let leverIdx = 0; leverIdx < 4; leverIdx++) {
      const leftLever = leftStrat.levers[leverIdx];
      const rightLever = rightStrat.levers[leverIdx];

      leftLever.methods.forEach((method, methodIdx) => {
        const methodName = typeof method === 'object' ? method.name : method;
        cells.push({
          strategyId: leftStrat.id,
          leverName: leftLever.name,
          leverId: leftLever.id,
          method: methodName,
          methodIndex: methodIdx
        });
      });

      rightLever.methods.forEach((method, methodIdx) => {
        const methodName = typeof method === 'object' ? method.name : method;
        cells.push({
          strategyId: rightStrat.id,
          leverName: rightLever.name,
          leverId: rightLever.id,
          method: methodName,
          methodIndex: methodIdx
        });
      });
    }
  });

  container.innerHTML = cells.map((cell, index) => {
    const col = index % 8;
    const row = Math.floor(index / 8);
    const classes = [`method-cell`, `strategy-${cell.strategyId}`];
    if (col === 3) classes.push('boundary-right');
    if (row === 3) classes.push('boundary-bottom');

    return `
    <div class="${classes.join(' ')}"
         data-strategy="${cell.strategyId}"
         data-lever="${cell.leverId}"
         data-method-index="${cell.methodIndex}"
         title="${cell.leverName}: ${cell.method}">
      <span class="method-number">${cell.leverId}-${cell.methodIndex + 1}</span>
      <span class="method-text">${cell.method.replace(/\s*[\(（].*?[\)）]/g, '')}</span>
    </div>`;
  }).join('');

  // 셀 클릭 이벤트 추가
  container.querySelectorAll('.method-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const strategyId = parseInt(cell.dataset.strategy);
      const leverId = cell.dataset.lever;
      const methodIndex = parseInt(cell.dataset.methodIndex);
      showSingleMethodDetail(strategyId, leverId, methodIndex);
    });
  });
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + '…';
}

// 개별 방법 상세 모달 표시
function showSingleMethodDetail(strategyId, leverId, methodIndex) {
  if (!leversData) return;

  // 해당 전략, 레버, 방법 찾기
  const strategy = leversData.strategies.find(s => s.id === strategyId);
  if (!strategy) return;

  const lever = strategy.levers.find(l => l.id === leverId);
  if (!lever) return;

  const method = lever.methods[methodIndex];
  if (!method) return;

  // 모달 생성 및 표시
  createSingleMethodModal(method, lever, strategy, methodIndex);
}

function createSingleMethodModal(method, lever, strategy, methodIndex) {
  // 기존 모달 제거
  const existingModal = document.getElementById('method-detail-modal');
  if (existingModal) existingModal.remove();

  const strategyClass = getStrategyClass(strategy.id);
  const methodName = typeof method === 'object' ? method.name : method;
  const methodDesc = typeof method === 'object' ? method.description : '';
  const methodNum = `${lever.id}-${methodIndex + 1}`;

  const modalHTML = `
    <div id="method-detail-modal" class="modal-overlay active">
      <div class="modal">
        <div class="modal-header ${strategyClass}">
          <button class="modal-close" onclick="closeMethodModal()">&times;</button>
          <span class="method-badge">${methodNum}</span>
          <h3>${methodName}</h3>
          <p>${lever.name} | ${strategy.name}</p>
        </div>
        <div class="modal-body">
          ${methodDesc ? `
            <div class="method-description">
              <h4>상세 설명</h4>
              <p>${methodDesc}</p>
            </div>
          ` : ''}

          <div class="method-context">
            <h4>소속 레버 정보</h4>
            <div class="context-card">
              <div class="context-header">
                <strong>${lever.id}. ${lever.name}</strong>
                <span>${lever.nameEn}</span>
              </div>
              <p>${lever.description}</p>
            </div>
          </div>

          <div class="method-siblings">
            <h4>같은 레버의 다른 방법</h4>
            <ul class="sibling-methods">
              ${lever.methods.map((m, idx) => {
                const mName = typeof m === 'object' ? m.name : m;
                const isActive = idx === methodIndex;
                return `
                  <li class="${isActive ? 'active' : ''}"
                      onclick="${isActive ? '' : `showSingleMethodDetail(${strategy.id}, '${lever.id}', ${idx})`}"
                      style="${isActive ? '' : 'cursor: pointer;'}">
                    <span class="sibling-num">${lever.id}-${idx + 1}</span>
                    <span class="sibling-name">${mName}</span>
                  </li>
                `;
              }).join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // 모달 외부 클릭 시 닫기
  document.getElementById('method-detail-modal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeMethodModal();
    }
  });
}

function closeMethodModal() {
  const modal = document.getElementById('method-detail-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }
}

// ===== 64개 방법 테이블 렌더링 =====
function render64MethodsTable() {
  const container = document.getElementById('methods-table-container');
  if (!container || !leversData) return;

  let tableHTML = `
    <div style="overflow-x: auto;">
      <table class="methods-table">
        <thead>
          <tr>
            <th style="width: 12%;">전략</th>
            <th style="width: 12%;">레버</th>
            <th style="width: 8%;">번호</th>
            <th style="width: 20%;">세부 방법</th>
            <th style="width: 48%;">설명</th>
          </tr>
        </thead>
        <tbody>
  `;

  leversData.strategies.forEach(strategy => {
    const strategyRowSpan = strategy.levers.length * 4; // 4 levers × 4 methods

    strategy.levers.forEach((lever, leverIndex) => {
      lever.methods.forEach((method, methodIndex) => {
        const methodName = typeof method === 'object' ? method.name : method;
        const methodDesc = typeof method === 'object' ? method.description : '-';

        tableHTML += '<tr class="strategy-row-' + strategy.id + '">';

        // 전략 셀 (첫 번째 레버의 첫 번째 방법에만)
        if (leverIndex === 0 && methodIndex === 0) {
          tableHTML += `
            <td rowspan="${strategyRowSpan}" class="strategy-cell strategy-${strategy.id}">
              <strong>${strategy.id}. ${strategy.name}</strong><br>
              <span style="font-size: 0.8rem; color: var(--text-light);">${strategy.nameEn}</span>
            </td>
          `;
        }

        // 레버 셀 (각 레버의 첫 번째 방법에만)
        if (methodIndex === 0) {
          tableHTML += `
            <td rowspan="4" class="lever-cell">
              <strong>${lever.id}</strong><br>
              ${lever.name}
            </td>
          `;
        }

        // 방법 번호, 이름, 설명
        tableHTML += `
          <td class="method-num">${lever.id}-${methodIndex + 1}</td>
          <td class="method-name-cell">${methodName}</td>
          <td class="method-desc-cell">${methodDesc}</td>
        `;

        tableHTML += '</tr>';
      });
    });
  });

  tableHTML += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = tableHTML;
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
              ${lever.methods.map(method => {
                const methodName = typeof method === 'object' ? method.name : method;
                return `<li>${methodName}</li>`;
              }).join('')}
            </ul>
          </div>

          <div class="lever-case">
            <h4>예시 시나리오: ${lever.case.title}</h4>
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

// ===== 모바일 메뉴 =====
function initMobileMenu() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  const overlay = document.querySelector('.nav-overlay');
  if (!toggle || !nav) return;

  function openMenu() {
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    nav.classList.add('open');
    if (overlay) overlay.classList.add('show');
    document.body.classList.add('menu-open');
  }

  function closeMenu() {
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.classList.remove('menu-open');
  }

  toggle.addEventListener('click', () => {
    if (nav.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  // 네비게이션 링크 클릭 시 메뉴 닫기
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // ESC 키로 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      closeMenu();
    }
  });
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
  // 모바일 메뉴 초기화 (모든 페이지 공통)
  initMobileMenu();

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
  sessionStorage.removeItem('surveyPhase');
  sessionStorage.removeItem('phase2Answers');
  sessionStorage.removeItem('determinedStrategy');
  currentQuestionIndex = 0;
  answers = { supplyPower: {}, demandPower: {} };
  surveyPhase = 1;
  phase2Answers = {};
  determinedStrategy = null;
  if (document.body.dataset.page === 'survey') {
    // 네비게이션 버튼 다시 표시 (Phase 전환 후 숨겨졌을 수 있음)
    const navEl = document.querySelector('.survey-navigation');
    if (navEl) navEl.style.display = '';
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
    let levers = [...strategy.levers];

    // Phase 2 점수가 있으면 정렬 및 우선순위 표시
    if (result.leverScores && Object.keys(result.leverScores).length > 0) {
      levers.sort((a, b) => {
        const scoreA = result.leverScores[a.id]?.score || 0;
        const scoreB = result.leverScores[b.id]?.score || 0;
        return scoreB - scoreA;
      });
      levers.forEach(lever => {
        const score = result.leverScores[lever.id]?.score || 0;
        const rank = score >= 4 ? '★★★ 최우선' : score >= 3 ? '★★ 권장' : '★ 참고';
        text += `- [${rank}] ${lever.name}: ${lever.description}\n`;
      });
    } else {
      levers.forEach(lever => {
        text += `- ${lever.name}: ${lever.description}\n`;
      });
    }
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

  // 핵심 데이터만 추출하여 URL 길이 최소화
  const result = JSON.parse(resultData);
  const compact = {
    ss: Math.round(result.supplyScore * 100) / 100,
    ds: Math.round(result.demandScore * 100) / 100,
    st: result.strategy
  };
  const encoded = btoa(JSON.stringify(compact));
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
      const decoded = atob(encodedResult);
      let resultObj;

      // compact 형식 (ss, ds, st) 또는 기존 전체 형식 지원
      const parsed = JSON.parse(decoded);
      if (parsed.ss !== undefined) {
        // compact 형식에서 전체 형식으로 복원
        const supplyScore = parsed.ss;
        const demandScore = parsed.ds;
        resultObj = {
          supplyScore,
          demandScore,
          supplyPercent: ((supplyScore - 1) / 3) * 100,
          demandPercent: ((demandScore - 1) / 3) * 100,
          strategy: parsed.st,
          answers: {}
        };
      } else {
        // 기존 전체 형식 (하위 호환)
        resultObj = parsed;
      }

      sessionStorage.setItem('surveyResult', JSON.stringify(resultObj));
      // URL에서 파라미터 제거 (깔끔한 URL 유지)
      window.history.replaceState({}, '', window.location.pathname);
      return true;
    } catch (e) {
      console.error('결과 로드 실패:', e);
    }
  }
  return false;
}


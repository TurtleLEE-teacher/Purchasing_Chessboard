# 구매 체스보드 (Purchasing Chessboard) 실습 사이트

## 프로젝트 소개

**크랄직 매트릭스(Kraljic Matrix)**를 활용한 전략적 구매 분석 교육 플랫폼입니다.

이 실습 사이트는 기업의 구매 담당자들이 자재/품목을 전략적으로 분류하고, 각 분류에 맞는 최적의 구매 전략을 수립할 수 있도록 돕는 학습 도구입니다.

## 크랄직 매트릭스란?

1983년 Peter Kraljic이 제안한 구매 포트폴리오 분석 모델로, **공급 리스크**와 **수익 영향도** 두 축을 기준으로 구매 품목을 4가지 범주로 분류합니다.

```
                    높음
                     │
         ┌───────────┼───────────┐
         │  병목자재  │  전략자재  │
 공급    │ Bottleneck│ Strategic │
 리스크  ├───────────┼───────────┤
         │ 비중요자재 │레버리지자재│
         │Non-Critical│ Leverage │
         └───────────┼───────────┘
                    낮음
              낮음 ──────── 높음
                  수익 영향도
```

## 4가지 자재 분류 및 전략

| 분류 | 공급리스크 | 수익영향도 | 핵심 전략 |
|------|:----------:|:----------:|----------|
| **비중요 자재** (Non-Critical) | 낮음 | 낮음 | 구매 프로세스 간소화, 표준화 |
| **레버리지 자재** (Leverage) | 낮음 | 높음 | 적극적 가격 협상, 경쟁 입찰 |
| **병목 자재** (Bottleneck) | 높음 | 낮음 | 공급 안정성 확보, 재고 관리 |
| **전략적 자재** (Strategic) | 높음 | 높음 | 장기적 파트너십, 공급망 통합 |

## 주요 기능

### 1. 설문 기반 분석
- 8개 핵심 질문을 통해 자재 특성 파악
- 공급 리스크 평가 (4문항)
- 수익 영향도 평가 (4문항)

### 2. 시각적 결과 제시
- 매트릭스 상 위치 표시
- 해당 분류의 특성 설명
- 권장 전략 제시

### 3. 학습 자료
- 각 분류별 실제 사례
- 전략 적용 가이드라인
- 추가 학습 리소스

## 프로젝트 구조

```
Purchasing_Chessboard/
├── index.html          # 메인 랜딩 페이지
├── survey.html         # 설문/분석 페이지
├── result.html         # 결과 페이지
├── css/
│   └── style.css       # 스타일시트
├── js/
│   └── main.js         # JavaScript 로직
├── images/             # 이미지 리소스
└── README.md           # 프로젝트 설명
```

## 기술 스택

- **HTML5**: 시맨틱 마크업
- **CSS3**: Flexbox, Grid, 반응형 디자인
- **JavaScript (ES6+)**: 설문 로직, 결과 계산
- **GitHub Pages**: 정적 사이트 호스팅

## 설치 및 실행

### 로컬 실행
```bash
# 저장소 클론
git clone https://github.com/TurtleLEE-teacher/Purchasing_Chessboard.git

# 디렉토리 이동
cd Purchasing_Chessboard

# 브라우저에서 index.html 열기
open index.html  # macOS
start index.html # Windows
```

### GitHub Pages 배포
이 프로젝트는 GitHub Pages를 통해 자동 배포됩니다.
- 배포 URL: `https://turtlelee-teacher.github.io/Purchasing_Chessboard/`

## 사용 방법

1. **메인 페이지** 접속
2. **"시작하기"** 버튼 클릭
3. **8개 질문**에 답변 (약 3분 소요)
4. **결과 확인** - 매트릭스 상 위치 및 전략 제안

## 학습 목표

이 실습을 통해 다음을 학습할 수 있습니다:

1. 크랄직 매트릭스의 개념과 구조 이해
2. 자재 분류 기준(공급 리스크, 수익 영향도) 학습
3. 각 분류별 최적 구매 전략 수립 능력 배양
4. 실제 업무에 적용 가능한 분석 역량 강화

## 참고 자료

- Kraljic, P. (1983). "Purchasing must become supply management." Harvard Business Review.
- 참고 사이트: [전략적 자재 분류 시스템](https://turtlelee-teacher.github.io/Project_Strategic_edu/)

## 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

---

**제작**: 구매/SCM 교육팀

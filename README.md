# 구매 체스보드 (Purchasing Chessboard) 실습 사이트

> **사이트 바로가기**: [https://turtlelee-teacher.github.io/Purchasing_Chessboard/](https://turtlelee-teacher.github.io/Purchasing_Chessboard/)

## 프로젝트 소개

**A.T. Kearney(현 Kearney)**가 개발한 **구매 체스보드(Purchasing Chessboard)** 프레임워크를 학습하는 인터랙티브 교육 플랫폼입니다.

이 실습 사이트는 구매/조달 담당자들이 **공급력(Supply Power)**과 **수요력(Demand Power)** 분석을 통해 최적의 구매 전략과 레버를 선택할 수 있도록 돕는 학습 도구입니다.

## 구매 체스보드란?

2008년 A.T. Kearney가 1,000개 이상의 구매 프로젝트 경험을 바탕으로 개발한 전략적 구매 프레임워크입니다.

**4가지 전략 → 16가지 레버 → 64가지 방법**의 계층 구조로 구성되어 있으며, 공급력과 수요력의 균형에 따라 최적의 구매 접근법을 제시합니다.

```
                         공급력 (Supply Power)
                    낮음 ◄──────────────────► 높음
                ┌───────────────────┬───────────────────┐
           높   │   3. 경쟁 활용    │  4. 공동이익 추구  │
           음   │    Leverage       │     Joint         │
                │    Competition    │     Advantage     │
  수            ├───────────────────┼───────────────────┤
  요            │   2. 지출 관리    │  1. 수요성질 변경  │
  력            │     Manage        │   Change Nature   │
           낮   │     Spend         │    of Demand      │
           음   └───────────────────┴───────────────────┘
```

## 4가지 전략 및 16가지 레버

### 1. 수요 성질 변경 (Change Nature of Demand)
> 공급력 높음 + 수요력 낮음 | 독점 상황 탈피를 위한 기술적 접근

| 레버 | 설명 |
|------|------|
| **위험 관리** (Risk Management) | 공급 확보 및 대체 공급선 구축 |
| **혁신 돌파** (Innovation Breakthrough) | 독점 탈피를 위한 근본적 기술 변화 |
| **기술 데이터 마이닝** (Technical Data Mining) | 벤치마킹 및 복잡성 분석 |
| **재사양화** (Re-specification) | 필수 기능 중심 설계 |

### 2. 지출 관리 (Manage Spend)
> 공급력 낮음 + 수요력 낮음 | 수요 통합 및 효율화

| 레버 | 설명 |
|------|------|
| **수요 관리** (Demand Management) | 불필요 수요 감소 및 최적화 |
| **공동조달** (Co-sourcing) | 기업 간 수요 통합 |
| **물량 통합** (Volume Bundling) | 규모의 경제 활용 |
| **상업 데이터 마이닝** (Commercial Data Mining) | 숨겨진 절감 기회 발굴 |

### 3. 경쟁 활용 (Leverage Competition Among Suppliers)
> 공급력 낮음 + 수요력 높음 | 공급자 간 경쟁 유도

| 레버 | 설명 |
|------|------|
| **공급 기반 확대** (Extension of Supply Base) | 글로벌 소싱 등 공급선 확대 |
| **입찰** (Tendering) | 체계적 경쟁 입찰 |
| **목표가격 책정** (Target Pricing) | 원가 기반 목표가 설정 |
| **가격 검증** (Supplier Pricing Review) | 가격 투명성 확보 |

### 4. 공동 이익 추구 (Seek Joint Advantage with Supplier)
> 공급력 높음 + 수요력 높음 | 파트너십 기반 가치 창출

| 레버 | 설명 |
|------|------|
| **통합 운영 계획** (Integrated Operations Planning) | 재고 및 수요예측 최적화 |
| **가치사슬 관리** (Value Chain Management) | 가치사슬 전체 최적화 |
| **원가 파트너십** (Cost Partnership) | 공동 원가 절감 |
| **가치 파트너십** (Value Partnership) | Win-Win 가치 창출 |

## 주요 기능

### 1. 설문 기반 분석
- **12개 핵심 질문**을 통해 구매 상황 분석
- 공급력 평가 (6문항)
- 수요력 평가 (6문항)

### 2. 시각적 결과 제시
- 체스보드 매트릭스 상 위치 표시
- **복수 레버 추천** (상황에 맞는 여러 레버 제안)
- 각 레버별 상세 설명

### 3. 실제 사례 학습
- 16개 레버별 예시 시나리오
- 산업별 활용 예시

## 프로젝트 구조

```
Purchasing_Chessboard/
├── index.html          # 메인 랜딩 페이지
├── survey.html         # 설문/분석 페이지 (12문항)
├── result.html         # 결과 페이지 (복수 레버 추천)
├── levers.html         # 16개 레버 상세 설명
├── css/
│   └── style.css       # 스타일시트
├── js/
│   └── main.js         # JavaScript 로직
├── data/
│   └── levers.json     # 레버 데이터 및 사례
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
- 배포 URL: `https://turtlelee-teacher.github.io/Purchasing_Chessboard/`

## 사용 방법

1. **메인 페이지** 접속
2. **"분석 시작하기"** 버튼 클릭
3. **12개 질문**에 답변 (약 5분 소요)
4. **결과 확인** - 체스보드 위치 및 복수 레버 추천
5. **레버 상세 보기** - 각 레버별 설명 및 사례 학습

## 설문 구성

### 공급력(Supply Power) 평가 - 6문항
1. 대체 공급업체 존재 여부
2. 공급업체 전환 비용
3. 공급업체의 기술적 독점성
4. 시장 내 공급업체 수
5. 공급업체의 협상 태도
6. 원자재/부품의 희소성

### 수요력(Demand Power) 평가 - 6문항
1. 구매 물량 규모
2. 공급업체 매출 내 당사 비중
3. 시장 정보력과 전문성
4. 장기 계약 가능성
5. 대량 구매 능력
6. 시장 내 구매자 지위

## 학습 목표

이 실습을 통해 다음을 학습할 수 있습니다:

1. 구매 체스보드 프레임워크의 개념과 구조 이해
2. 공급력/수요력 분석 방법 습득
3. 4가지 기본 전략의 적용 상황 파악
4. 16가지 레버의 특성과 활용법 학습
5. 실제 업무에 적용 가능한 전략 수립 역량 강화

## 참고 자료

- Schuh, C. et al. (2008). "The Purchasing Chessboard: 64 Methods to Reduce Costs and Increase Value with Suppliers"
- [Kearney - The Purchasing Chessboard](https://www.kearney.com/insights/books/the-purchasing-chessboard)

## 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

---

**제작**: 구매/SCM 교육팀

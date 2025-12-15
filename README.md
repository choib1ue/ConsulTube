# 🎬 ConsulTube

2025-2학기 빅데이터 프로젝트

## 📌 프로젝트 개요

**ConsulTube**는 초보 유튜브 크리에이터가 콘텐츠 전략을 효과적으로 수립할 수 있도록  
최근 트렌드, 제목 패턴, 해시태그 효과를 데이터 기반으로 분석·추천하는 플랫폼입니다.

단순 조회수 나열이 아닌,  
"어떤 주제 / 어떤 제목 / 어떤 해시태그"가 효과적인지  
인사이트를 제공하여 시행착오를 줄이고 성장 속도를 높입니다.

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성:

```env
VITE_YOUTUBE_API_KEY=your_api_key_here
```

### 3. 백엔드 서버 실행

백엔드 서버가 실행 중이어야 합니다. 자세한 내용은 [backend/README.md](./backend/README.md)를 참고하세요.

```bash
# backend 디렉토리에서
uvicorn app.main:app --reload --port 8000
```

### 4. 개발 서버 실행

```bash
npm run dev
```

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8000

## 📊 주요 기능

- **콘텐츠 트렌드 분석**: 최근 인기 주제 토픽 모델링, 조회수/빈도 기반 트렌드 추천
- **해시태그 효과 분석**: 태그별 조회수·좋아요 지표 분석, 상관분석 기반 성과 측정, 추천 태그 조합 제시
- **제목 패턴 분석**: 인기 영상 제목의 문장 구조 패턴 분석, 키워드 분석, 제목 템플릿 추천
- **워드클라우드**: 카테고리별 인기 키워드 시각화

## 🎯 지원 카테고리

뷰티, 패션, 음식, 여행, 게임, 음악, 스포츠, 교육

## 🛠 기술 스택

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI, Recharts
- **Backend**: Python FastAPI (별도 레포지토리)
- **상태 관리**: React Hooks  

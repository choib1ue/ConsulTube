# ConsulTube Backend

Python FastAPI 기반 YouTube 데이터 분석 백엔드 서버

## 빠른 시작

### 1. 환경 설정

```bash
# 가상 환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 의존성 설치
pip install -r requirements.txt
```

### 2. 데이터베이스 설정

**Docker 사용 (권장)**
```bash
docker-compose up -d
```

**로컬 MySQL**
```sql
CREATE DATABASE consultube CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 환경 변수 설정

`.env` 파일 생성:
```env
YOUTUBE_API_KEY=your_youtube_api_key_here
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/consultube?charset=utf8mb4
```

### 4. 서버 실행

```bash
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- API 문서: http://localhost:8000/docs

## 주요 기능

- **자동 데이터 수집**: 서버 시작 시 데이터가 없으면 자동으로 초기 데이터 수집
- **스케줄러**: 주기적 자동 데이터 수집 (기본 설정)
- **CORS**: 프론트엔드 연동 지원 (localhost:5173, localhost:3000)

## API 엔드포인트

### 데이터 수집
- `POST /api/collect` - YouTube 데이터 수집
- `GET /api/last-collection-time` - 마지막 수집 시간 조회
- `GET /api/health` - 헬스 체크

### 분석 데이터
- `GET /api/metrics/{category}` - 메트릭 카드 데이터
- `GET /api/analysis/{category}` - 전체 분석 데이터
- `GET /api/trends/{category}` - 트렌드 데이터
- `GET /api/hashtags/{category}` - 해시태그 분석
- `GET /api/title-patterns/{category}` - 제목 패턴 분석
- `GET /api/wordcloud/{category}` - 워드클라우드 데이터
- `GET /api/keyword-videos/{category}/{keyword}` - 키워드별 영상 목록

모든 분석 엔드포인트는 `time_range` 쿼리 파라미터 지원 (`7days` 또는 `30days`, 기본값: `7days`)


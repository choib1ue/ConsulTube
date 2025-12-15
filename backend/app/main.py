from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .api import routes
from .services.scheduler import start_scheduler
from .models import Video
import threading

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ConsulTube API",
    description="YouTube 데이터 분석을 위한 백엔드 API",
    version="1.0.0",
)

def check_and_collect_initial_data():
    """서버 시작 시 데이터가 없으면 초기 수집 실행"""
    db = SessionLocal()
    try:
        video_count = db.query(Video).count()
        if video_count == 0:
            print("[초기화] 데이터베이스에 영상 데이터가 없습니다. 초기 데이터 수집을 시작합니다...")
            from .services.scheduler import collect_all_categories
            # 전체 수집으로 초기 데이터 수집
            collect_all_categories(incremental=False)
            print("[초기화] 초기 데이터 수집이 완료되었습니다.")
        else:
            print(f"[초기화] 데이터베이스에 {video_count}개의 영상 데이터가 있습니다.")
    except Exception as e:
        print(f"[초기화] 초기 데이터 확인 중 오류 발생: {str(e)}")
    finally:
        db.close()

# 백그라운드에서 초기 데이터 수집 실행 (서버 시작을 막지 않음)
def run_initial_collection():
    """백그라운드 스레드에서 초기 수집 실행"""
    thread = threading.Thread(target=check_and_collect_initial_data, daemon=True)
    thread.start()

# 스케줄러 시작 (자동 데이터 수집)
scheduler = start_scheduler()

# 초기 데이터 수집 실행
run_initial_collection()

# CORS 설정 (프론트엔드에서 API 호출 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite 기본 포트
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(routes.router, prefix="/api", tags=["api"])


@app.get("/")
async def root():
    return {
        "message": "ConsulTube Backend API",
        "docs": "/docs",
    }


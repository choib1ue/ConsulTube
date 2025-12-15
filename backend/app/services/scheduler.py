from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .data_collector import DataCollector

# 카테고리 목록
CATEGORIES = ["뷰티", "패션", "음식", "여행", "게임", "음악", "스포츠", "교육"]


def collect_all_categories(incremental: bool = True):
    """모든 카테고리 데이터 수집
    
    Args:
        incremental: 증분 수집 여부 (True: 마지막 수집 이후 새 영상만, False: 전체 수집)
    """
    total_collected = 0
    for category in CATEGORIES:
        db: Session = SessionLocal()
        try:
            collector = DataCollector(db)
            mode = "증분 수집" if incremental else "전체 수집"
            print(f"[스케줄러] {category} 카테고리 {mode} 시작...")
            count = collector.collect_videos(
                category_name=category,
                time_range_days=7,
                max_results=50,
                incremental=incremental,
            )
            total_collected += count
            print(f"[스케줄러] {category} 카테고리: {count}개 영상 수집 완료")
        except Exception as e:
            print(f"[스케줄러] {category} 카테고리 수집 실패: {str(e)}")
            db.rollback()
        finally:
            db.close()
    print(f"[스케줄러] 전체 수집 완료: 총 {total_collected}개 영상")


def start_scheduler():
    """스케줄러 시작"""
    scheduler = BackgroundScheduler()
    
    # 매일 오전 2시에 모든 카테고리 증분 수집 (새 영상만)
    scheduler.add_job(
        lambda: collect_all_categories(incremental=True),
        trigger=CronTrigger(hour=2, minute=0),
        id="daily_incremental_collection",
        name="일일 증분 데이터 수집",
        replace_existing=True,
    )
    
    # 매주 일요일 오전 3시에 전체 수집 (백업용)
    scheduler.add_job(
        lambda: collect_all_categories(incremental=False),
        trigger=CronTrigger(day_of_week=6, hour=3, minute=0),  # 일요일 = 6
        id="weekly_full_collection",
        name="주간 전체 데이터 수집",
        replace_existing=True,
    )
    
    scheduler.start()
    print("[스케줄러] 데이터 수집 스케줄러가 시작되었습니다.")
    print("[스케줄러] 매일 오전 2시: 증분 수집 (새 영상만)")
    print("[스케줄러] 매주 일요일 오전 3시: 전체 수집 (백업)")
    
    return scheduler


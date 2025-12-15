"""초기 데이터 수집 스크립트 (7일/30일 범위)"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.services.data_collector import DataCollector

# 카테고리 목록
CATEGORIES = ["뷰티", "패션", "음식", "여행", "게임", "음악", "스포츠", "교육"]

def collect_initial_data():
    """각 카테고리별로 7일/30일 범위 데이터 수집"""
    db = SessionLocal()
    total_collected = 0
    
    try:
        for category_name in CATEGORIES:
            collector = DataCollector(db)
            
            print(f"\n{'='*60}")
            print(f"카테고리: {category_name}")
            print(f"{'='*60}")
            
            # 7일 범위 데이터 수집
            print(f"\n  [최근 7일] 데이터 수집 중...")
            try:
                count_7d = collector.collect_videos(
                    category_name=category_name,
                    time_range_days=7,
                    max_results=100,  # 7일 범위는 100개로 증가
                    incremental=False,  # 전체 수집
                )
                print(f"  ✓ {count_7d}개 영상 수집 완료")
            except Exception as e:
                print(f"  ✗ 오류 발생: {str(e)}")
                count_7d = 0
            
            # 30일 범위 데이터 수집 (더 많은 데이터 수집)
            print(f"\n  [최근 30일] 데이터 수집 중...")
            try:
                count_30d = collector.collect_videos(
                    category_name=category_name,
                    time_range_days=30,
                    max_results=200,  # 30일 범위는 200개로 증가 (주별로 골고루 수집)
                    incremental=False,  # 전체 수집
                )
                print(f"  ✓ {count_30d}개 영상 수집 완료")
            except Exception as e:
                print(f"  ✗ 오류 발생: {str(e)}")
                count_30d = 0
            
            category_total = count_7d + count_30d
            total_collected += category_total
            print(f"\n  카테고리 '{category_name}' 총 수집: {category_total}개 (7일: {count_7d}개, 30일: {count_30d}개)")
            
    except Exception as e:
        print(f"\n전체 수집 중 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
    
    print(f"\n{'='*60}")
    print(f"전체 수집 완료: 총 {total_collected}개 영상")
    print(f"{'='*60}")
    print("\n이제 서비스에서 7일/30일 범위의 데이터를 사용할 수 있습니다!")

if __name__ == "__main__":
    print("="*60)
    print("ConsulTube 초기 데이터 수집 스크립트")
    print("="*60)
    print("\n각 카테고리별로 최근 7일/30일 범위의 데이터를 수집합니다.")
    print("YouTube API 할당량을 사용하므로 시간이 걸릴 수 있습니다.\n")
    
    collect_initial_data()


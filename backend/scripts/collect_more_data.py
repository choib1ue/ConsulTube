"""더 많은 데이터 수집 스크립트"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.services.data_collector import DataCollector
from app.models import Category

# 카테고리 목록
CATEGORIES = ["뷰티", "패션", "음식", "여행", "게임", "음악", "스포츠", "교육"]

def collect_more_data():
    """각 카테고리별로 더 많은 데이터 수집 (과거 데이터 포함)"""
    db = SessionLocal()
    total_collected = 0
    
    try:
        for category_name in CATEGORIES:
            collector = DataCollector(db)
            
            print(f"\n{'='*60}")
            print(f"카테고리: {category_name}")
            print(f"{'='*60}")
            
            # 여러 기간에 걸쳐 데이터 수집
            time_ranges = [
                (7, 50),   # 최근 7일, 50개
                (30, 50),  # 최근 30일, 50개
                (90, 50),  # 최근 90일, 50개
            ]
            
            category_total = 0
            for days, max_results in time_ranges:
                print(f"\n  [{days}일 기간] 데이터 수집 중...")
                try:
                    count = collector.collect_videos(
                        category_name=category_name,
                        time_range_days=days,
                        max_results=max_results,
                        incremental=False,  # 전체 수집
                    )
                    category_total += count
                    print(f"  ✓ {count}개 영상 수집 완료")
                except Exception as e:
                    print(f"  ✗ 오류 발생: {str(e)}")
                    continue
            
            total_collected += category_total
            print(f"\n  카테고리 '{category_name}' 총 수집: {category_total}개")
            
    except Exception as e:
        print(f"\n전체 수집 중 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
    
    print(f"\n{'='*60}")
    print(f"전체 수집 완료: 총 {total_collected}개 영상")
    print(f"{'='*60}")

if __name__ == "__main__":
    print("ConsulTube 데이터 수집 스크립트")
    print("각 카테고리별로 과거 데이터를 포함하여 더 많은 데이터를 수집합니다.\n")
    
    response = input("계속하시겠습니까? (y/n): ")
    if response.lower() == 'y':
        collect_more_data()
    else:
        print("수집이 취소되었습니다.")


import { useState, useEffect } from 'react';
import { Cloud, Loader2, X, ExternalLink } from 'lucide-react';
import { getWordCloud, WordCloudWord, getKeywordVideos, type KeywordVideosResponse } from '../services/backendApi';

interface WordCloudProps {
  category: string;
}

// 단어의 예상 크기 계산 (텍스트 길이와 폰트 크기 기반)
function estimateWordSize(word: string, fontSize: number): { width: number; height: number } {
  // 대략적인 계산: 한글은 폰트 크기의 1.2배, 영문은 0.6배
  const charWidth = /[가-힣]/.test(word) ? fontSize * 1.2 : fontSize * 0.6;
  const width = word.length * charWidth;
  const height = fontSize * 1.2;
  return { width, height };
}

// 두 단어가 겹치는지 확인
function isOverlapping(
  pos1: { x: number; y: number; width: number; height: number },
  pos2: { x: number; y: number; width: number; height: number },
  padding: number = 10
): boolean {
  return !(
    pos1.x + pos1.width + padding < pos2.x ||
    pos2.x + pos2.width + padding < pos1.x ||
    pos1.y + pos1.height + padding < pos2.y ||
    pos2.y + pos2.height + padding < pos1.y
  );
}

// 워드클라우드 위치 생성 함수 (충돌 감지 포함)
function generatePositions(
  words: WordCloudWord[],
  containerWidth: number = 800,
  containerHeight: number = 320
): Array<{ top: string; left: string; x: number; y: number }> {
  const positions: Array<{ top: string; left: string; x: number; y: number }> = [];
  const placedWords: Array<{ x: number; y: number; width: number; height: number }> = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const fontSize = word.size;
    const { width, height } = estimateWordSize(word.word, fontSize);
    
    let attempts = 0;
    let placed = false;
    const maxAttempts = 100;

    // 중심에서 시작하여 나선형으로 배치 시도
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    let angle = (i * 137.5) * (Math.PI / 180); // 황금각 사용
    let radius = 0;
    const radiusStep = Math.max(width, height) * 0.8;

    while (attempts < maxAttempts && !placed) {
      let x: number, y: number;

      if (attempts < 50) {
        // 나선형 배치 시도
        radius = (attempts / 10) * radiusStep;
        x = centerX + Math.cos(angle) * radius - width / 2;
        y = centerY + Math.sin(angle) * radius - height / 2;
        angle += 0.5; // 각도 증가
      } else {
        // 나선형 실패 시 랜덤 배치
        x = Math.random() * (containerWidth - width);
        y = Math.random() * (containerHeight - height);
      }

      // 경계 확인
      if (x < 0 || y < 0 || x + width > containerWidth || y + height > containerHeight) {
        attempts++;
        continue;
      }

      // 충돌 확인
      const currentPos = { x, y, width, height };
      const hasCollision = placedWords.some(placedWord => 
        isOverlapping(currentPos, placedWord, 15)
      );

      if (!hasCollision) {
        // 위치 확정
        positions.push({
          top: `${(y / containerHeight) * 100}%`,
          left: `${(x / containerWidth) * 100}%`,
          x,
          y,
        });
        placedWords.push(currentPos);
        placed = true;
      } else {
        attempts++;
      }
    }

    // 모든 시도 실패 시 강제 배치 (가장자리)
    if (!placed) {
      const edgeX = (i % 2 === 0) ? 0 : containerWidth - width;
      const edgeY = ((i % 4) / 2) * (containerHeight - height);
      positions.push({
        top: `${(edgeY / containerHeight) * 100}%`,
        left: `${(edgeX / containerWidth) * 100}%`,
        x: edgeX,
        y: edgeY,
      });
    }
  }

  return positions;
}

export function WordCloud({ category }: WordCloudProps) {
  const [wordData, setWordData] = useState<WordCloudWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalKeywords, setTotalKeywords] = useState(0);
  const [timeRange, setTimeRange] = useState('7days');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [keywordVideos, setKeywordVideos] = useState<KeywordVideosResponse | null>(null);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // 카테고리 변경 시 키워드 영상 목록 닫기
  useEffect(() => {
    setSelectedKeyword(null);
    setKeywordVideos(null);
  }, [category]);

  useEffect(() => {
    const fetchWordCloudData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getWordCloud(category, timeRange as '7days' | '30days', 20);
        setWordData(response.words);
        setTotalKeywords(response.total_keywords);
      } catch (err) {
        console.error('워드클라우드 데이터 조회 실패:', err);
        setError('데이터를 불러올 수 없습니다.');
        setWordData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWordCloudData();
  }, [category, timeRange]);

  const handleKeywordClick = async (keyword: string) => {
    setSelectedKeyword(keyword);
    setLoadingVideos(true);
    setKeywordVideos(null);
    
    try {
      const videos = await getKeywordVideos(category, keyword);
      setKeywordVideos(videos);
    } catch (err) {
      console.error('키워드 영상 조회 실패:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return String(views);
  };

  const maxFrequency = wordData.length > 0 ? Math.max(...wordData.map(w => w.frequency)) : 1;
  
  // 컨테이너 크기 (h-80 = 320px, 실제 사용 가능한 공간 고려)
  const containerWidth = 800;
  const containerHeight = 320;
  const positions = generatePositions(wordData, containerWidth, containerHeight);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Cloud className="size-5" style={{ color: '#FF0000' }} />
          <h3 style={{ color: '#202020' }}>주요 키워드 워드클라우드</h3>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          <option value="7days">최근 7일</option>
          <option value="30days">최근 30일</option>
        </select>
      </div>

      {loading ? (
        <div className="relative h-80 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="relative h-80 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100 flex items-center justify-center">
          <p className="text-gray-500">{error}</p>
        </div>
      ) : wordData.length === 0 ? (
        <div className="relative h-80 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100 flex items-center justify-center">
          <p className="text-gray-500">데이터가 없습니다.</p>
        </div>
      ) : (
        <div className="relative h-80 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-2 p-6">
            {wordData.map((item, index) => {
              const opacity = 0.4 + (item.frequency / maxFrequency) * 0.6;
              
              return (
                <div
                  key={item.word}
                  onClick={() => handleKeywordClick(item.word)}
                  className="absolute transition-all hover:scale-110 cursor-pointer"
                  style={{
                    ...positions[index % positions.length],
                    fontSize: `${item.size}px`,
                    color: index % 3 === 0 ? '#FF0000' : index % 3 === 1 ? '#202020' : '#666',
                    opacity: opacity,
                    transform: `rotate(${(index % 5 - 2) * 5}deg)`
                  }}
                  title={`빈도: ${item.frequency} (클릭하여 영상 목록 보기)`}
                >
                  {item.word}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 키워드 영상 목록 팝업 */}
      {selectedKeyword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedKeyword(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[70vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: '#202020' }}>
                  "{selectedKeyword}" 키워드 영상
                </h3>
                <button
                  onClick={() => setSelectedKeyword(null)}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="size-4 text-gray-600" />
                </button>
              </div>
              {loadingVideos ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-6 animate-spin" style={{ color: '#FF0000' }} />
                  <span className="ml-2 text-gray-600">영상 목록을 불러오는 중...</span>
                </div>
              ) : keywordVideos && keywordVideos.videos.length > 0 ? (
                <div className="space-y-2">
                  {keywordVideos.videos.map((video, index) => (
                    <a
                      key={video.video_id}
                      href={`https://www.youtube.com/watch?v=${video.video_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-2.5 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {video.thumbnail_medium ? (
                          <img
                            src={video.thumbnail_medium}
                            alt={video.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <ExternalLink className="size-3 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-1 mb-0.5 max-w-xs">
                          {video.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-0.5">{video.channel_title}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>조회 {formatViews(video.view_count)}</span>
                          <span>좋아요 {formatViews(video.like_count)}</span>
                          <span>댓글 {formatViews(video.comment_count)}</span>
                        </div>
                      </div>
                      <ExternalLink className="size-6 text-gray-400 flex-shrink-0 mr-8" />
                    </a>
                  ))}
                </div>
              ) : keywordVideos && keywordVideos.videos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  "{selectedKeyword}" 키워드가 포함된 영상을 찾을 수 없습니다.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

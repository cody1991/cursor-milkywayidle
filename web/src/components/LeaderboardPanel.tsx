import React, { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import AnimatedNumber from './AnimatedNumber'
import { formatNumber } from '../utils/numberFormat'

const LeaderboardPanel: React.FC = () => {
  const { leaderboard, ws, isLoggedIn } = useGameStore()

  // 在组件挂载时获取排行榜数据
  useEffect(() => {
    if (isLoggedIn && ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          type: 'fetch_leaderboard'
        }))
      } catch (error) {
        console.error('获取排行榜失败:', error)
      }
    }
  }, [isLoggedIn, ws])

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const getRankClass = (rank: number): string => {
    return rank <= 3 ? 'top-3' : ''
  }

  return (
    <div className="leaderboard-panel">
      <h2>🏆 排行榜 (前100名)</h2>
      <div className="leaderboard-list">
        {leaderboard.length === 0 ? (
          <div className="no-data">暂无排行榜数据</div>
        ) : (
          leaderboard.map((entry, index) => {
            const rank = index + 1
            return (
              <div key={index} className="leaderboard-item">
                <div className={`rank ${getRankClass(rank)}`}>
                  {getRankIcon(rank)}
                </div>
                <div className="player-info">
                  <div className="username">{entry.username}</div>
                  <div className="score">经验值: <AnimatedNumber value={entry.score} duration={1000} formatFunction={formatNumber} keepDecimals={false} /></div>
                </div>
                <div className="date">{formatDate(entry.updated_at)}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default LeaderboardPanel 
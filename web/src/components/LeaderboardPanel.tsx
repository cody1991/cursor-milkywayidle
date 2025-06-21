import React from 'react'
import { useGameStore } from '../store/gameStore'
import AnimatedNumber from './AnimatedNumber'
import { formatNumber } from '../utils/numberFormat'

const LeaderboardPanel: React.FC = () => {
  const leaderboard = useGameStore((state) => state.leaderboard)

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  return (
    <div className="leaderboard-panel">
      <h2>🏆 排行榜</h2>
      <div className="leaderboard-list">
        {leaderboard.length === 0 ? (
          <div className="no-data">暂无排行榜数据</div>
        ) : (
          leaderboard.map((entry, index) => (
            <div key={index} className="leaderboard-item">
              <div className="rank">#{index + 1}</div>
              <div className="player-info">
                <div className="username">{entry.username}</div>
                <div className="score">分数: <AnimatedNumber value={entry.score} duration={1000} formatFunction={formatNumber} /></div>
              </div>
              <div className="date">{formatDate(entry.updated_at)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default LeaderboardPanel 
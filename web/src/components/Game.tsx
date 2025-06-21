import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import ResourceDisplay from './ResourceDisplay'
import AchievementPanel from './AchievementPanel'
import LeaderboardPanel from './LeaderboardPanel'
import ChatPanel from './ChatPanel'
import LoginModal from './LoginModal'
import FloatingActivities from './FloatingActivities'
import HelpPanel from './HelpPanel'
import AnimatedNumber from './AnimatedNumber'

const Game: React.FC = () => {
  const {
    addResource,
    updateActivities,
    saveGame,
    submitScore,
    isLoggedIn,
    username,
    logout,
    loadLoginInfo,
    resources
  } = useGameStore()

  // 从localStorage获取保存的主标签页状态，默认为'resources'
  const getSavedTab = (): 'resources' | 'achievements' | 'leaderboard' | 'chat' | 'help' => {
    try {
      const saved = localStorage.getItem('galaxyCowIdle_activeTab')
      return (saved as 'resources' | 'achievements' | 'leaderboard' | 'chat' | 'help') || 'resources'
    } catch (error) {
      return 'resources'
    }
  }

  const [activeTab, setActiveTab] = useState<'resources' | 'achievements' | 'leaderboard' | 'chat' | 'help'>(getSavedTab)
  const [showLoginModal, setShowLoginModal] = useState(!isLoggedIn)
  const [isLoading, setIsLoading] = useState(true)

  // 保存选中的主标签页到localStorage
  const handleTabChange = (tab: 'resources' | 'achievements' | 'leaderboard' | 'chat' | 'help') => {
    setActiveTab(tab)
    try {
      localStorage.setItem('galaxyCowIdle_activeTab', tab)
    } catch (error) {
      console.error('保存标签页状态失败:', error)
    }
  }

  // 尝试恢复登录状态
  useEffect(() => {
    const tryRestoreLogin = () => {
      const restored = loadLoginInfo()
      if (restored) {
        console.log('登录状态已恢复')
        setShowLoginModal(false)
      } else {
        console.log('没有找到有效的登录信息')
        setShowLoginModal(true)
      }
      setIsLoading(false)
    }

    tryRestoreLogin()
  }, [loadLoginInfo])

  // 游戏循环
  useEffect(() => {
    if (!isLoggedIn) return

    const gameLoop = setInterval(() => {
      // 每10秒更新一次活动状态
      if (Date.now() % 10000 < 100) {
        updateActivities()
      }

      // 每10秒保存一次游戏
      if (Date.now() % 10000 < 100) {
        saveGame()
      }
    }, 1000)

    return () => clearInterval(gameLoop)
  }, [updateActivities, saveGame, isLoggedIn])

  // 初始化活动计算
  useEffect(() => {
    if (isLoggedIn) {
      updateActivities()
    }
  }, [updateActivities, isLoggedIn])

  // 定期提交分数
  useEffect(() => {
    if (isLoggedIn) {
      const scoreInterval = setInterval(() => {
        submitScore()
      }, 60000) // 每分钟提交一次分数

      return () => clearInterval(scoreInterval)
    }
  }, [isLoggedIn, submitScore])

  const handleLogout = () => {
    logout()
    setShowLoginModal(true)
  }

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">加载中...</div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
  }

  return (
    <div className="game-container">
      {/* 顶部区域 */}
      <div className="game-top-section">
        {/* 左侧资源显示 */}
        <div className="resources-display">
          <div className="resource-item">
            <span className="resource-icon">🥛</span>
            <span className="resource-name">牛奶:</span>
            <AnimatedNumber value={Math.floor(resources.milk?.amount || 0)} duration={800} keepDecimals={false} />
          </div>
          <div className="resource-item">
            <span className="resource-icon">🌿</span>
            <span className="resource-name">采摘:</span>
            <AnimatedNumber value={Math.floor(resources.harvest?.amount || 0)} duration={800} keepDecimals={false} />
          </div>
          <div className="resource-item">
            <span className="resource-icon">🪵</span>
            <span className="resource-name">木材:</span>
            <AnimatedNumber value={Math.floor(resources.wood?.amount || 0)} duration={800} keepDecimals={false} />
          </div>
        </div>

        {/* 右侧用户信息 */}
        <div className="user-info-section">
          <span className="username">欢迎，{username}！</span>
          <button className="logout-button" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </div>

      {/* 悬浮活动组件 */}
      <FloatingActivities />

      <div className="game-content">
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => handleTabChange('resources')}
          >
            资源
          </button>
          <button
            className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => handleTabChange('achievements')}
          >
            成就
          </button>
          <button
            className={`tab-button ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('leaderboard')}
          >
            排行榜
          </button>
          <button
            className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => handleTabChange('chat')}
          >
            聊天
          </button>
          <button
            className={`tab-button ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => handleTabChange('help')}
          >
            帮助
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'resources' && <ResourceDisplay />}
          {activeTab === 'achievements' && <AchievementPanel />}
          {activeTab === 'leaderboard' && <LeaderboardPanel />}
          {activeTab === 'chat' && <ChatPanel />}
          {activeTab === 'help' && <HelpPanel />}
        </div>
      </div>
    </div>
  )
}

export default Game 
import React from 'react'
import { useGameStore } from '../store/gameStore'
import AnimatedNumber from './AnimatedNumber'
import { getTitle, getTitleColor, getNextTitleProgress } from '../utils/titleSystem'
import { formatNumber } from '../utils/numberFormat'

const AchievementPanel: React.FC = () => {
  const { achievements, units, unitDefinitions } = useGameStore()

  // 添加调试信息
  console.log('AchievementPanel render - unitDefinitions:', unitDefinitions)
  console.log('AchievementPanel render - unitDefinitions length:', unitDefinitions?.length)

  // 如果单位定义还没有加载，显示加载状态
  if (!unitDefinitions || unitDefinitions.length === 0) {
    console.log('AchievementPanel: 显示loading状态 - 单位定义未加载')
    return (
      <div className="achievement-panel">
        <h2>🏆 成就</h2>
        <div className="loading-message">
          <p>正在加载单位定义...</p>
        </div>
      </div>
    )
  }

  // 如果用户状态还没有加载，显示加载状态
  if (!units || Object.keys(units).length === 0) {
    console.log('AchievementPanel: 显示loading状态 - 用户状态未加载')
    return (
      <div className="achievement-panel">
        <h2>🏆 成就</h2>
        <div className="loading-message">
          <p>正在加载用户状态...</p>
        </div>
      </div>
    )
  }

  console.log('AchievementPanel: 显示正常内容')

  // 获取单位信息
  const getUnitInfo = (moduleId: string, unitId: string) => {
    if (!unitDefinitions || unitDefinitions.length === 0) {
      return null
    }

    const unit = unitDefinitions.find((u: any) => u.moduleId === moduleId && u.unitId === unitId)
    if (!unit) return null

    return {
      name: unit.name,
      baseProduction: unit.baseProduction,
      actionTime: unit.actionTime,
      requiredLevel: unit.requiredLevel,
      rarity: unit.rarity,
      description: unit.description
    }
  }

  // 获取所有单位的生产统计，分组
  const getProductionStatsByModule = () => {
    const statsByModule: Record<string, any[]> = {}
    if (!unitDefinitions || unitDefinitions.length === 0) return statsByModule

    unitDefinitions.forEach((unitDef: any) => {
      const unit = units[`${unitDef.moduleId}.${unitDef.unitId}`] || { produced: 0, owned: 0, unlocked: false }
      const title = getTitle(unitDef.name, unit.produced)
      const titleColor = getTitleColor(unit.produced)
      const progress = getNextTitleProgress(unit.produced)
      if (!statsByModule[unitDef.moduleId]) statsByModule[unitDef.moduleId] = []
      statsByModule[unitDef.moduleId].push({
        moduleId: unitDef.moduleId,
        unitId: unitDef.unitId,
        name: unitDef.name,
        produced: unit.produced,
        title,
        titleColor,
        nextTitle: progress.nextTitle,
        required: progress.required,
        progress: progress.progress
      })
    })
    // 每组内部按requiredLevel排序
    Object.values(statsByModule).forEach(arr => arr.sort((a, b) => {
      const ua = unitDefinitions.find(u => u.moduleId === a.moduleId && u.unitId === a.unitId)
      const ub = unitDefinitions.find(u => u.moduleId === b.moduleId && u.unitId === b.unitId)
      return (ua?.requiredLevel || 0) - (ub?.requiredLevel || 0)
    }))
    return statsByModule
  }

  const productionStatsByModule = getProductionStatsByModule()
  const moduleNameMap: Record<string, string> = {
    cow: '挤奶',
    wood: '伐木',
    harvest: '采摘',
  }

  return (
    <div className="achievement-panel">
      <h2>🏆 成就</h2>

      {/* 生产统计 */}
      <div className="production-stats">
        <h3>📊 生产统计</h3>
        {Object.entries(productionStatsByModule).map(([moduleId, stats]) => (
          <div key={moduleId} style={{ marginBottom: 24 }}>
            <h4 style={{ color: '#4fd7ff', margin: '12px 0 8px 0' }}>{moduleNameMap[moduleId] || moduleId}</h4>
            <div className="stats-grid">
              {stats.map((stat) => (
                <div key={`${stat.moduleId}.${stat.unitId}`} className="stat-item">
                  <div className="stat-header">
                    <span className="stat-name" style={{ color: stat.titleColor }}>{stat.title}</span>
                    <span className="stat-produced">已生产: <AnimatedNumber value={stat.produced} duration={800} formatFunction={formatNumber} /></span>
                  </div>
                  <div className="stat-progress">
                    {stat.required > 0 ? (
                      <>
                        <div className="progress-info">
                          <span>下一个称号: {stat.nextTitle}</span>
                          <span><AnimatedNumber value={stat.produced} duration={600} />/{stat.required}</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${Math.min(stat.progress, 100)}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="progress-info">
                        <span>🏆 已获得最高称号</span>
                        <span>完美达成</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 原有成就 */}
      <div className="achievements-section">
        <h3>🎖️ 系统成就</h3>
        <div className="achievements-grid">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-header">
                <span className="achievement-icon">{achievement.icon}</span>
                <span className="achievement-name">{achievement.name}</span>
              </div>
              <div className="achievement-description">{achievement.description}</div>
              <div className="achievement-status">
                {achievement.unlocked ? '✅ 已解锁' : '🔒 未解锁'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AchievementPanel 
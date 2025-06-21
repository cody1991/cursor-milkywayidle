import React, { useEffect, useState } from 'react'
import Draggable from 'react-draggable'
import { useGameStore, INFINITE_PRODUCTION } from '../store/gameStore'

const FloatingActivities: React.FC = () => {
  const { activities, stopActivity, unitDefinitions } = useGameStore()
  const [localActivities, setLocalActivities] = useState<any[]>([])

  // 同步后端活动到本地（只同步新增/重置）
  useEffect(() => {
    console.log('FloatingActivities: activities changed:', activities)
    setLocalActivities(
      activities.map((a) => ({ ...a, localStart: Date.now() - (Date.now() - a.startTime) }))
    )
  }, [activities])

  // 定时刷新本地进度和自动移除已完成的活动
  useEffect(() => {
    const timer = setInterval(() => {
      setLocalActivities((prev) =>
        prev.filter((activity) => {
          if (!activity.isActive) return false
          if (activity.times === INFINITE_PRODUCTION) return true
          const unitInfo = getUnitInfo(activity.moduleId, activity.unitId)
          if (!unitInfo) return false
          const duration = unitInfo.actionTime * activity.times
          const elapsed = Date.now() - activity.startTime
          return elapsed < duration
        })
      )
    }, 200)
    return () => clearInterval(timer)
  }, [])

  // 本地停止活动
  const handleStopActivity = (activityId: string) => {
    // 先从本地列表移除
    setLocalActivities(prev => prev.filter(activity => activity.id !== activityId))
    // 然后调用后端的停止函数
    stopActivity(activityId)
  }

  const getUnitInfo = (moduleId: string, unitId: string) => {
    if (!unitDefinitions || unitDefinitions.length === 0) {
      // 如果还没有加载单位定义，返回null
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

  // 本地进度条
  const getActivityProgress = (activity: any) => {
    if (!activity.isActive) return 100
    const unitInfo = getUnitInfo(activity.moduleId, activity.unitId)
    if (!unitInfo) return 100

    if (activity.times === INFINITE_PRODUCTION) {
      // 无限次活动：显示单次循环的进度
      const elapsed = Date.now() - activity.startTime
      const cycleProgress = (elapsed % unitInfo.actionTime) / unitInfo.actionTime
      return cycleProgress * 100
    }

    // 有限次活动：显示总体进度
    const duration = unitInfo.actionTime * activity.times
    const elapsed = Date.now() - activity.startTime
    return Math.min((elapsed / duration) * 100, 100)
  }

  // 本地剩余时间
  const formatRemainingTime = (activity: any) => {
    if (!activity.isActive) return '已完成'
    const unitInfo = getUnitInfo(activity.moduleId, activity.unitId)
    if (!unitInfo) return ''

    if (activity.times === INFINITE_PRODUCTION) {
      // 无限次活动：显示当前循环的剩余时间
      const elapsed = Date.now() - activity.startTime
      const cycleElapsed = elapsed % unitInfo.actionTime
      const remaining = unitInfo.actionTime - cycleElapsed
      const seconds = (remaining / 1000).toFixed(1)
      return `${seconds}秒 (循环)`
    }

    // 有限次活动：显示总体剩余时间
    const duration = unitInfo.actionTime * activity.times
    const remaining = duration - (Date.now() - activity.startTime)
    if (remaining <= 0) return '即将完成'
    const seconds = (remaining / 1000).toFixed(1)
    return `${seconds}秒`
  }

  // 过滤出活跃的活动
  const activeActivities = localActivities.filter(activity => activity.isActive)

  // 添加调试信息
  // console.log('FloatingActivities Debug:', {
  //   activities: activities,
  //   localActivities: localActivities,
  //   activeActivities: activeActivities,
  //   activeActivitiesLength: activeActivities.length,
  //   unitDefinitions: unitDefinitions?.length,
  //   activitiesLength: activities.length
  // })

  if (activeActivities.length === 0) {
    console.log('FloatingActivities: 没有活跃活动，不显示面板')
    return null
  }

  console.log('FloatingActivities: 显示面板，活跃活动数量:', activeActivities.length)

  return (
    <Draggable
      handle=".floating-activities-header"
      bounds="body"
    >
      <div className="floating-activities" style={{
        position: 'fixed',
        top: '20px',
        right: '20px'
      }}>
        <div className="floating-activities-header">
          <h3>🔄 当前活动</h3>
          <span className="activity-count">{activeActivities.length}</span>
        </div>
        <div className="floating-activities-list">
          {activeActivities.map((activity, index) => {
            const unitInfo = getUnitInfo(activity.moduleId, activity.unitId)
            const progress = getActivityProgress(activity)
            const activityId = activity.id

            return (
              <div key={activityId} className="floating-activity-item">
                <div className="floating-activity-info">
                  <div className="floating-activity-header">
                    <span className="floating-activity-name">
                      {unitInfo?.name || activity.unitId} - {activity.times === INFINITE_PRODUCTION ? '无限' : `${activity.currentTimes}/${activity.times}`}次
                    </span>
                    <span className="floating-activity-time">{formatRemainingTime(activity)}</span>
                  </div>
                  <div className="floating-activity-progress">
                    <div className="floating-activity-progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
                <button
                  className="floating-stop-activity-button"
                  onClick={() => handleStopActivity(activityId)}
                >
                  停止
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </Draggable>
  )
}

export default FloatingActivities 
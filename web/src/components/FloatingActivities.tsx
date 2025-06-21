import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import Draggable from 'react-draggable'
import { useGameStore, INFINITE_PRODUCTION } from '../store/gameStore'

const FloatingActivities: React.FC = () => {
  const { activities, stopActivity, unitDefinitions } = useGameStore()
  const [localActivities, setLocalActivities] = useState<any[]>([])
  const [progressUpdateTrigger, setProgressUpdateTrigger] = useState(0)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 同步后端活动到本地（只同步新增/重置）
  useEffect(() => {
    console.log('FloatingActivities: activities changed:', activities)
    setLocalActivities(
      activities.map((a) => ({ ...a, localStart: Date.now() - (Date.now() - a.startTime) }))
    )
  }, [activities])

  const getUnitInfo = useCallback((moduleId: string, unitId: string) => {
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
      description: unit.description
    }
  }, [unitDefinitions])

  // 使用useMemo缓存活跃活动列表
  const activeActivities = useMemo(() => {
    return localActivities.filter(activity => activity.isActive)
  }, [localActivities])

  // 专门的进度更新定时器 - 只在有活跃活动时运行
  useEffect(() => {
    if (activeActivities.length > 0) {
      // 有活跃活动时，每100ms更新一次进度
      progressTimerRef.current = setInterval(() => {
        setProgressUpdateTrigger(prev => prev + 1)
      }, 100)
    } else {
      // 没有活跃活动时，清除定时器
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
    }

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
    }
  }, [activeActivities.length])

  // 定时刷新本地进度和自动移除已完成的活动 - 降低频率到1秒
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
    }, 1000) // 改为1秒更新一次
    return () => clearInterval(timer)
  }, [getUnitInfo])

  // 本地停止活动
  const handleStopActivity = useCallback((activityId: string) => {
    // 先从本地列表移除
    setLocalActivities(prev => prev.filter(activity => activity.id !== activityId))
    // 然后调用后端的停止函数
    stopActivity(activityId)
  }, [stopActivity])

  // 使用useMemo缓存活动进度和时间计算
  const activitiesWithProgress = useMemo(() => {
    return activeActivities.map((activity) => {
      const unitInfo = getUnitInfo(activity.moduleId, activity.unitId)

      // 计算进度
      let progress = 100
      if (activity.isActive && unitInfo) {
        if (activity.times === INFINITE_PRODUCTION) {
          // 无限次活动：显示单次循环的进度
          const elapsed = Date.now() - activity.startTime
          const cycleProgress = (elapsed % unitInfo.actionTime) / unitInfo.actionTime
          progress = cycleProgress * 100
        } else {
          // 有限次活动：显示总体进度
          const duration = unitInfo.actionTime * activity.times
          const elapsed = Date.now() - activity.startTime
          progress = Math.min((elapsed / duration) * 100, 100)
        }
      }

      // 计算剩余时间
      let remainingTime = '已完成'
      if (activity.isActive && unitInfo) {
        if (activity.times === INFINITE_PRODUCTION) {
          // 无限次活动：显示当前循环的剩余时间
          const elapsed = Date.now() - activity.startTime
          const cycleElapsed = elapsed % unitInfo.actionTime
          const remaining = unitInfo.actionTime - cycleElapsed
          const seconds = (remaining / 1000).toFixed(1)
          remainingTime = `${seconds}秒 (循环)`
        } else {
          // 有限次活动：显示总体剩余时间
          const duration = unitInfo.actionTime * activity.times
          const remaining = duration - (Date.now() - activity.startTime)
          if (remaining <= 0) {
            remainingTime = '即将完成'
          } else {
            const seconds = (remaining / 1000).toFixed(1)
            remainingTime = `${seconds}秒`
          }
        }
      }

      return {
        ...activity,
        unitInfo,
        progress,
        remainingTime
      }
    })
  }, [activeActivities, getUnitInfo, progressUpdateTrigger]) // 添加progressUpdateTrigger作为依赖

  console.log('FloatingActivities: 显示面板，活跃活动数量:', activeActivities.length)

  return (
    <Draggable>
      <div className="floating-activities" style={{
        zIndex: 9999,
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        minWidth: '280px'
      }}>
        <div className="floating-activities-header">
          <h3>🔄 当前活动</h3>
          <span className="activity-count">{activeActivities.length}</span>
        </div>
        <div className="floating-activities-list">
          {activeActivities.length === 0 ? (
            <div className="no-activities-message">
              <p>暂无活动</p>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                开始生产活动后，进度将在这里显示
              </p>
            </div>
          ) : (
            activitiesWithProgress.map((activity) => {
              const activityId = activity.id

              return (
                <div key={activityId} className="floating-activity-item">
                  <div className="floating-activity-info">
                    <div className="floating-activity-header">
                      <span className="floating-activity-name">
                        {activity.unitInfo?.name || activity.unitId} - {activity.times === INFINITE_PRODUCTION ? '无限' : `${activity.currentTimes}/${activity.times}`}次
                      </span>
                      <span className="floating-activity-time">{activity.remainingTime}</span>
                    </div>
                    <div className="floating-activity-progress">
                      <div className="floating-activity-progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${activity.progress}%` }}
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
            })
          )}
        </div>
      </div>
    </Draggable>
  )
}

export default FloatingActivities 
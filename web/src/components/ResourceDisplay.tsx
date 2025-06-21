import React, { useState, useEffect } from 'react'
import { useGameStore, INFINITE_PRODUCTION } from '../store/gameStore'
import AnimatedNumber from './AnimatedNumber'
import { formatExperience } from '../utils/numberFormat'

const ResourceDisplay: React.FC = () => {
  const { resources, modules, units, startActivity, unitDefinitions } = useGameStore()

  // 添加调试信息
  console.log('ResourceDisplay render - unitDefinitions:', unitDefinitions)
  console.log('ResourceDisplay render - unitDefinitions length:', unitDefinitions?.length)
  console.log('ResourceDisplay render - units:', units)
  console.log('ResourceDisplay render - modules:', modules)

  // 从localStorage获取保存的模块状态，默认为'cow'
  const getSavedModule = (): string => {
    try {
      const saved = localStorage.getItem('galaxyCowIdle_selectedModule')
      return saved || 'cow'
    } catch (error) {
      return 'cow'
    }
  }

  const [selectedSubModule, setSelectedSubModule] = useState<string>(getSavedModule)
  const [productionSettings, setProductionSettings] = useState<{ [key: string]: { times: number; infinite: boolean } }>({})

  // 保存选中的模块到localStorage
  const handleModuleChange = (moduleId: string) => {
    setSelectedSubModule(moduleId)
    try {
      localStorage.setItem('galaxyCowIdle_selectedModule', moduleId)
    } catch (error) {
      console.error('保存模块状态失败:', error)
    }
  }

  // 更新生产设置
  const updateProductionSetting = (unitKey: string, field: 'times' | 'infinite', value: number | boolean) => {
    setProductionSettings(prev => ({
      ...prev,
      [unitKey]: {
        ...prev[unitKey],
        [field]: value,
        // 如果设置为无限次，将次数设为0
        ...(field === 'infinite' && value === true ? { times: 0 } : {}),
        // 如果设置次数，关闭无限次
        ...(field === 'times' ? { infinite: false } : {})
      }
    }))
  }

  // 开始生产活动
  const handleStartActivity = (moduleId: string, unitId: string) => {
    const unitKey = `${moduleId}.${unitId}`
    const setting = productionSettings[unitKey] || { times: 1, infinite: false }

    // 如果设置为无限次，使用INFINITE_PRODUCTION常量
    const times = setting.infinite ? INFINITE_PRODUCTION : setting.times

    if (times > 0 || times === INFINITE_PRODUCTION) {
      startActivity(moduleId, unitId, times)
    }
  }

  // 组件加载时恢复状态
  useEffect(() => {
    const savedModule = getSavedModule()
    setSelectedSubModule(savedModule)
  }, [])

  const moduleNames: { [key: string]: string } = {
    cow: '挤奶',
    wood: '伐木',
    harvest: '采摘'
  }

  // 获取当前子模块的所有单位
  const getModuleUnits = (moduleId: string): string[] => {
    if (!unitDefinitions || unitDefinitions.length === 0) {
      return []
    }

    // 从unitDefinitions中获取指定模块的所有单位
    return unitDefinitions
      .filter((unit: any) => unit.moduleId === moduleId)
      .map((unit: any) => unit.unitId)
      .sort((a: string, b: string) => {
        // 按requiredLevel排序
        const unitA = unitDefinitions.find((u: any) => u.moduleId === moduleId && u.unitId === a)
        const unitB = unitDefinitions.find((u: any) => u.moduleId === moduleId && u.unitId === b)
        return (unitA?.requiredLevel || 0) - (unitB?.requiredLevel || 0)
      })
  }

  const getUnitStyle = (moduleId: string, unitId: string) => {
    if (!unitDefinitions || unitDefinitions.length === 0) {
      return 'unit-basic'
    }

    const unit = unitDefinitions.find((u: any) => u.moduleId === moduleId && u.unitId === unitId)
    if (!unit) return 'unit-basic'

    // 根据稀有度返回样式
    switch (unit.rarity) {
      case 'basic':
        return 'unit-basic'
      case 'advanced':
        return 'unit-advanced'
      case 'rare':
        return 'unit-rare'
      case 'legendary':
        return 'unit-legendary'
      default:
        return 'unit-basic'
    }
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

  // 如果单位定义还没有加载，显示加载状态
  if (!unitDefinitions || unitDefinitions.length === 0) {
    console.log('ResourceDisplay: 显示loading状态 - 单位定义未加载')
    return (
      <div className="resource-display">
        <div className="loading-message">
          <p>正在加载单位定义...</p>
        </div>
      </div>
    )
  }

  // 如果用户状态还没有加载，显示加载状态
  if (!units || Object.keys(units).length === 0) {
    console.log('ResourceDisplay: 显示loading状态 - 用户状态未加载')
    return (
      <div className="resource-display">
        <div className="loading-message">
          <p>正在加载用户状态...</p>
        </div>
      </div>
    )
  }

  console.log('ResourceDisplay: 显示正常内容')

  return (
    <div className="resource-display">
      {/* 二级TAB导航 - 挤奶/伐木/采摘 */}
      <div className="sub-module-navigation">
        {Object.entries(moduleNames).map(([moduleId, moduleName]) => {
          const module = modules[moduleId]
          if (!module) return null

          return (
            <button
              key={moduleId}
              className={`sub-module-button ${selectedSubModule === moduleId ? 'active' : ''}`}
              onClick={() => handleModuleChange(moduleId)}
            >
              <div className="sub-module-info">
                <span className="sub-module-name">{moduleName}</span>
                <span className="sub-module-level">Lv.{module.currentLevel}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* 当前选中的子模块内容 */}
      {(() => {
        const module = modules[selectedSubModule]
        if (!module) return null

        return (
          <div className="selected-module-content">
            <div className="module-header">
              <h3>{moduleNames[selectedSubModule]}</h3>
              <div className="module-level">
                <span>等级 <AnimatedNumber value={module.currentLevel} duration={800} /></span>
                {module.currentLevel >= 999 ? (
                  <div className="max-level-info">
                    <span style={{ color: '#FFD700', fontWeight: 'bold' }}>🏆 已达到最高等级</span>
                  </div>
                ) : (
                  <>
                    <div className="experience-bar">
                      <div
                        className="experience-fill"
                        style={{ width: `${(module.experience / module.levelExperience) * 100}%` }}
                      />
                    </div>
                    <span>
                      {formatExperience(module.experience)}/{formatExperience(module.levelExperience)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 单位列表 */}
            <div className="module-units">
              {getModuleUnits(selectedSubModule).map((unitId: string) => {
                const unit = units[`${selectedSubModule}.${unitId}`]
                const unitInfo = getUnitInfo(selectedSubModule, unitId)

                // 添加调试信息
                console.log(`单位 ${selectedSubModule}.${unitId}:`, {
                  unit,
                  unitInfo,
                  unitKey: `${selectedSubModule}.${unitId}`,
                  allUnits: units
                })

                if (!unitInfo) return null

                const canUse = unit && unit.unlocked && module.currentLevel >= unitInfo.requiredLevel
                const unitStyle = getUnitStyle(selectedSubModule, unitId)

                return (
                  <div key={unitId} className={`unit ${unitStyle} ${!canUse ? 'locked' : ''}`}>
                    <div className="unit-info">
                      <h4>{unitInfo.name}</h4>
                      <p>
                        <span>拥有数量:</span>
                        <span><AnimatedNumber value={unit ? unit.owned : 0} duration={600} /></span>
                      </p>
                      <p>
                        <span>单次产量:</span>
                        <span>{unitInfo.baseProduction}</span>
                      </p>
                      <p>
                        <span>生产时间:</span>
                        <span>{unitInfo.actionTime / 1000}秒</span>
                      </p>
                      {!canUse && (
                        <div className="requirement">
                          {unit && !unit.unlocked ? '未解锁' : `需要等级 ${unitInfo.requiredLevel}`}
                        </div>
                      )}
                      {canUse && (
                        <div className="production-controls">
                          <div className="production-settings">
                            <div className="times-input">
                              <label>生产次数:</label>
                              <input
                                type="number"
                                min="1"
                                max="999"
                                value={productionSettings[`${selectedSubModule}.${unitId}`]?.times || 1}
                                onChange={(e) => updateProductionSetting(
                                  `${selectedSubModule}.${unitId}`,
                                  'times',
                                  parseInt(e.target.value) || 1
                                )}
                                disabled={productionSettings[`${selectedSubModule}.${unitId}`]?.infinite}
                              />
                            </div>
                            <div className="infinite-checkbox">
                              <label>
                                <input
                                  type="checkbox"
                                  checked={productionSettings[`${selectedSubModule}.${unitId}`]?.infinite || false}
                                  onChange={(e) => updateProductionSetting(
                                    `${selectedSubModule}.${unitId}`,
                                    'infinite',
                                    e.target.checked
                                  )}
                                />
                                无限次
                              </label>
                            </div>
                          </div>
                          <button
                            className="start-activity-btn"
                            onClick={() => handleStartActivity(selectedSubModule, unitId)}
                          >
                            {productionSettings[`${selectedSubModule}.${unitId}`]?.infinite ? '开始无限生产' : '开始生产'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

const resourceNames: { [key: string]: string } = {
  milk: '牛奶',
  harvest: '采摘',
  wood: '木材'
}

export default ResourceDisplay 
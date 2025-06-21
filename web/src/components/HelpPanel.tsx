import React from 'react'
import { useGameStore } from '../store/gameStore'
import { getAllTitles } from '../utils/titleSystem'
import { formatExperience } from '../utils/numberFormat'

const HelpPanel: React.FC = () => {
  const { unitDefinitions } = useGameStore()

  // 按模块分组单位
  const getUnitsByModule = () => {
    if (!unitDefinitions || unitDefinitions.length === 0) {
      return {}
    }

    return unitDefinitions.reduce((acc: any, unit: any) => {
      if (!acc[unit.moduleId]) {
        acc[unit.moduleId] = []
      }
      acc[unit.moduleId].push(unit)
      return acc
    }, {})
  }

  const unitsByModule = getUnitsByModule()
  const allTitles = getAllTitles()

  const moduleNames: { [key: string]: string } = {
    cow: '🐄 奶牛农场',
    wood: '🌳 伐木场',
    harvest: '🌿 采摘园'
  }

  // 生成等级经验表数据
  const generateLevelData = () => {
    const data = [];
    let totalExperience = 0;
    for (let level = 1; level <= 500; level++) {
      if (level === 1) {
        data.push({ level, experience: 0, totalExperience: 0 });
      } else if (level === 2) {
        totalExperience = 100;
        data.push({ level, experience: 100, totalExperience });
      } else {
        let experience = 100;
        for (let i = 3; i <= level; i++) {
          experience = Math.floor(experience * 1.1);
        }
        totalExperience += experience;
        data.push({ level, experience, totalExperience });
      }
    }
    return data;
  };

  // 格式化大数字显示
  const formatLargeNumber = (num: number): string => {
    if (num >= 1e15) {
      return '♾️'; // 无限大符号
    } else if (num >= 1e12) {
      return (num / 1e12).toFixed(1) + 'T';
    } else if (num >= 1e9) {
      return (num / 1e9).toFixed(1) + 'B';
    } else if (num >= 1e6) {
      return (num / 1e6).toFixed(1) + 'M';
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const levelExperienceTable = generateLevelData()

  return (
    <div className="help-panel">
      <h2>📖 游戏帮助</h2>

      {/* 游戏介绍 */}
      <div className="help-section">
        <h3>🎮 游戏介绍</h3>
        <p>银河奶牛农场是一个太空主题的放置游戏。通过管理不同的资源模块，生产各种资源，提升等级，解锁更高级的单位。</p>
      </div>

      {/* 称号系统 */}
      <div className="help-section">
        <h3>🏆 称号系统</h3>
        <p>生产特定数量的资源可以获得称号，称号系统采用指数增长设计，越高级的称号越难获得：</p>
        <div className="titles-grid">
          {allTitles.map((title, index) => (
            <div key={index} className="title-info-card" style={{ borderLeftColor: title.color }}>
              <div className="title-header">
                <span className="title-name" style={{ color: title.color }}>{title.name}</span>
                <span className="title-threshold">{title.threshold.toLocaleString()}个</span>
              </div>
              <div className="title-description">
                {index === 0 ? '开始你的生产之旅' :
                  index === allTitles.length - 1 ? '最高荣誉，生产大师' :
                    `需要${title.threshold.toLocaleString()}个单位的产量`}
              </div>
            </div>
          ))}
        </div>
        <p><strong>称号示例：</strong>生产10000个奶牛获得"奶牛新手"称号，生产1000000个奶牛获得"奶牛大帝"称号。</p>
      </div>

      {/* 单位信息 */}
      <div className="help-section">
        <h3>🏭 生产单位</h3>
        <div className="units-info">
          {Object.entries(unitsByModule).map(([moduleId, units]: [string, any]) => (
            <div key={moduleId}>
              <div className="module-header-compact">
                <h4>{moduleNames[moduleId]} <span className="unit-count">({units.length}个单位)</span></h4>
              </div>
              <div className="units-grid">
                {units.map((unit: any) => (
                  <div key={unit.unitId} className="unit-info-card">
                    <div className="unit-header">
                      <span className="unit-name">{unit.name}</span>
                    </div>
                    <div className="unit-details">
                      <div className="unit-stat">
                        <span>单次产量:</span>
                        <span>{unit.baseProduction}</span>
                      </div>
                      <div className="unit-stat">
                        <span>生产时间:</span>
                        <span>{(unit.actionTime / 1000).toFixed(1)}秒</span>
                      </div>
                      <div className="unit-stat">
                        <span>解锁等级:</span>
                        <span>Lv.{unit.requiredLevel}</span>
                      </div>
                      <div className="unit-stat">
                        <span>效率:</span>
                        <span>{((unit.baseProduction / (unit.actionTime / 1000)) * 60).toFixed(1)}/分钟</span>
                      </div>
                      <div className="unit-stat">
                        <span>经验值:</span>
                        <span>{unit.score}</span>
                      </div>
                    </div>
                    <div className="unit-description">
                      {unit.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 游戏机制 */}
      <div className="help-section">
        <h3>⚙️ 游戏机制</h3>
        <div className="mechanics-info">
          <div className="mechanic-item">
            <h4>📈 等级系统</h4>
            <p>通过生产活动获得经验值，提升模块等级。等级越高，可以解锁更高级的单位。</p>
          </div>
          <div className="mechanic-item">
            <h4>🏆 成就系统</h4>
            <p>生产特定数量的资源可以获得称号，称号系统采用指数增长，越高级的称号越难获得。</p>
          </div>
          <div className="mechanic-item">
            <h4>🔄 生产活动</h4>
            <p>选择单位进行生产，生产完成后获得资源和经验。可以同时进行多个生产活动。</p>
          </div>
        </div>
      </div>

      {/* 等级经验表（移到最后） */}
      <div className="help-section">
        <h3>📊 等级经验表</h3>
        <div className="level-experience-table">
          <p>每升一级所需经验值按1.1倍增长，最高等级为500级。以下是详细数据：</p>
          <div className="experience-grid">
            {levelExperienceTable.map((item) => (
              <div key={item.level} className="experience-item">
                <div className="level-number">Lv.{item.level}</div>
                <div className="experience-details">
                  <div className="required-exp">升级需要: {formatExperience(item.experience)}</div>
                  <div className="total-exp">累计经验: {formatLargeNumber(item.totalExperience)}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '16px', color: '#FFD700', fontWeight: 'bold' }}>
            🏆 达到500级后将不再升级，经验值不再增加
          </p>
          <p style={{ marginTop: '8px', color: '#64b5f6', fontSize: '0.9em' }}>
            💡 提示：♾️ 表示数值过大，实际为无限大
          </p>
        </div>
      </div>
    </div>
  )
}

export default HelpPanel 
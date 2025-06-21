import React from 'react'
import { useGameStore } from '../store/gameStore'
import AnimatedNumber from './AnimatedNumber'

const BuildingPanel: React.FC = () => {
  const { buildings, resources, buyBuilding } = useGameStore()

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T'
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B'
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M'
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K'
    return num.toFixed(1)
  }

  const canAfford = (cost: { [key: string]: number }): boolean => {
    return Object.entries(cost).every(([resource, amount]) =>
      resources[resource]?.amount >= amount
    )
  }

  const getBuildingIcon = (buildingId: string): string => {
    switch (buildingId) {
      case 'solarPanel': return '☀️'
      case 'metalMine': return '⛏️'
      case 'crystalLab': return '🧪'
      case 'darkMatterCollector': return '🛸'
      default: return '🏗️'
    }
  }

  return (
    <div className="building-panel">
      <h2>建筑</h2>
      <div className="buildings-grid">
        {Object.values(buildings).map((building) => (
          <div
            key={building.id}
            className={`building-item ${!building.unlocked ? 'locked' : ''} ${canAfford(building.cost) ? 'affordable' : 'unaffordable'}`}
          >
            <div className="building-header">
              <span className="building-icon">{getBuildingIcon(building.id)}</span>
              <span className="building-name">{building.name}</span>
            </div>
            <div className="building-description">{building.description}</div>
            <div className="building-owned">拥有: <AnimatedNumber value={building.owned} duration={600} /></div>
            <div className="building-production">
              生产: +{formatNumber(building.baseProduction * building.productionMultiplier)}/s
            </div>
            <div className="building-cost">
              成本: {Object.entries(building.cost).map(([resource, amount]) => (
                <span key={resource} className="cost-item">
                  {resources[resource]?.name}: {formatNumber(amount)}
                </span>
              ))}
            </div>
            {building.unlocked ? (
              <button
                className="buy-button"
                onClick={() => buyBuilding(building.id)}
                disabled={!canAfford(building.cost)}
              >
                购买
              </button>
            ) : (
              <div className="locked-message">需要解锁</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default BuildingPanel 
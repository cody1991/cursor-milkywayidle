import React from 'react'
import { useGameStore } from '../store/gameStore'

const UpgradePanel: React.FC = () => {
  const { upgrades, resources, buyUpgrade } = useGameStore()

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

  return (
    <div className="upgrade-panel">
      <h2>升级</h2>
      <div className="upgrades-grid">
        {Object.values(upgrades).map((upgrade) => (
          <div
            key={upgrade.id}
            className={`upgrade-item ${!upgrade.unlocked ? 'locked' : ''} ${upgrade.purchased ? 'purchased' : ''} ${canAfford(upgrade.cost) ? 'affordable' : 'unaffordable'}`}
          >
            <div className="upgrade-header">
              <span className="upgrade-icon">⚡</span>
              <span className="upgrade-name">{upgrade.name}</span>
            </div>
            <div className="upgrade-description">{upgrade.description}</div>
            <div className="upgrade-cost">
              成本: {Object.entries(upgrade.cost).map(([resource, amount]) => (
                <span key={resource} className="cost-item">
                  {resources[resource]?.name}: {formatNumber(amount)}
                </span>
              ))}
            </div>
            {upgrade.unlocked && !upgrade.purchased ? (
              <button
                className="buy-button"
                onClick={() => buyUpgrade(upgrade.id)}
                disabled={!canAfford(upgrade.cost)}
              >
                购买
              </button>
            ) : upgrade.purchased ? (
              <div className="purchased-message">已购买</div>
            ) : (
              <div className="locked-message">需要解锁</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default UpgradePanel 
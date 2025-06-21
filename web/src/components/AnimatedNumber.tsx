import React, { useEffect, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
  formatFunction?: (num: number) => string
  keepDecimals?: boolean
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  className = '',
  formatFunction = (num: number) => num.toString(),
  keepDecimals = true
}) => {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (displayValue !== value) {
      setIsAnimating(true)
      const startValue = displayValue
      const endValue = value
      const startTime = Date.now()

      const animate = () => {
        const currentTime = Date.now()
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // 使用缓动函数让动画更自然
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentValue = startValue + (endValue - startValue) * easeOutQuart

        // 根据keepDecimals属性决定是否保留小数
        const finalValue = keepDecimals ? currentValue : Math.floor(currentValue)
        setDisplayValue(finalValue)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setDisplayValue(endValue)
          setIsAnimating(false)
        }
      }

      requestAnimationFrame(animate)
    }
  }, [value, duration, displayValue, keepDecimals])

  return (
    <span className={`animated-number ${isAnimating ? 'animating' : ''} ${className}`}>
      {formatFunction(displayValue)}
    </span>
  )
}

export default AnimatedNumber 
import numeral from 'numeral'

// 安全转换数字
const safeNumber = (value: any): number => {
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }
  if (typeof value === 'number') {
    return value
  }
  return 0
}

// 数字格式化工具函数 - 使用numeral.js
export const formatNumber = (num: any): string => {
  const safeNum = safeNumber(num)

  // 检查是否为有效数字
  if (!isFinite(safeNum) || isNaN(safeNum)) {
    return '0'
  }

  // 使用numeral.js的格式化
  return numeral(safeNum).format('0.0a') // 例如: 1.2K, 3.4M, 5.6B, 1.2T
}

// 格式化经验值显示 - 更精确的显示
export const formatExperience = (num: any): string => {
  const safeNum = safeNumber(num)

  // 检查是否为有效数字
  if (!isFinite(safeNum) || isNaN(safeNum)) {
    return '0'
  }

  // 使用numeral.js的格式化，根据数字大小选择不同精度
  if (safeNum >= 1e12) {
    return numeral(safeNum).format('0.00a') // 万亿级别显示两位小数
  }
  return numeral(safeNum).format('0.0a') // 其他级别显示一位小数
}

// 格式化大数字 - 不带小数
export const formatLargeNumber = (num: any): string => {
  const safeNum = safeNumber(num)

  // 检查是否为有效数字
  if (!isFinite(safeNum) || isNaN(safeNum)) {
    return '0'
  }

  // 使用numeral.js的格式化
  return numeral(safeNum).format('0a') // 例如: 1K, 3M, 5B, 1T
}

// 格式化百分比
export const formatPercent = (num: any): string => {
  const safeNum = safeNumber(num)
  if (!isFinite(safeNum) || isNaN(safeNum)) {
    return '0%'
  }
  return numeral(safeNum).format('0.0%')
}

// 格式化货币
export const formatCurrency = (num: any): string => {
  const safeNum = safeNumber(num)
  if (!isFinite(safeNum) || isNaN(safeNum)) {
    return '$0'
  }
  return numeral(safeNum).format('$0,0')
}

// 格式化带千位分隔符的数字
export const formatWithCommas = (num: any): string => {
  const safeNum = safeNumber(num)
  if (!isFinite(safeNum) || isNaN(safeNum)) {
    return '0'
  }
  return numeral(safeNum).format('0,0')
}

// 格式化科学计数法
export const formatScientific = (num: any): string => {
  const safeNum = safeNumber(num)
  if (!isFinite(safeNum) || isNaN(safeNum)) {
    return '0'
  }
  return numeral(safeNum).format('0.0e+0')
}

// 格式化文件大小
export const formatFileSize = (bytes: any): string => {
  const safeBytes = safeNumber(bytes)
  if (!isFinite(safeBytes) || isNaN(safeBytes)) {
    return '0 B'
  }
  return numeral(safeBytes).format('0.0 ib') // 例如: 1.5 KB, 2.3 MB, 1.1 GB
}

// 格式化时间（秒）
export const formatTime = (seconds: any): string => {
  const safeSeconds = safeNumber(seconds)
  if (!isFinite(safeSeconds) || isNaN(safeSeconds)) {
    return '0s'
  }
  return numeral(safeSeconds).format('00:00:00') // 例如: 01:23:45
}

// 格式化数字为中文单位
export const formatChinese = (num: any): string => {
  const safeNum = safeNumber(num)
  if (!isFinite(safeNum) || isNaN(safeNum)) {
    return '0'
  }

  // numeral.js支持中文格式化
  return numeral(safeNum).format('0.0a').replace(/[KMBT]/g, (match) => {
    switch (match) {
      case 'K': return '千'
      case 'M': return '万'
      case 'B': return '亿'
      case 'T': return '万亿'
      default: return match
    }
  })
} 
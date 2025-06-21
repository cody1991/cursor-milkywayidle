// 称号系统配置
export const TITLE_THRESHOLDS = {
  BEGINNER: 0,         // 初出茅庐 - 0个，一开始就有
  NOVICE: 50000,       // 新手
  EXPERT: 250000,      // 达人
  SPECIALIST: 500000,  // 专家
  MASTER: 1000000,     // 大师
  KING: 2500000,       // 王者
  EMPEROR: 5000000     // 大帝
}

// 称号名称映射
export const TITLE_NAMES = {
  BEGINNER: '初出茅庐',
  NOVICE: '新手',
  EXPERT: '达人',
  SPECIALIST: '专家',
  MASTER: '大师',
  KING: '王者',
  EMPEROR: '大帝'
}

// 称号颜色映射
export const TITLE_COLORS = {
  BEGINNER: '#8B8B8B',    // 灰色
  NOVICE: '#45B7D1',      // 蓝色
  EXPERT: '#4ECDC4',      // 青色
  SPECIALIST: '#FF6B6B',  // 红色
  MASTER: '#CD7F32',      // 铜色
  KING: '#C0C0C0',        // 银色
  EMPEROR: '#FFD700'      // 金色
}

// 获取称号
export const getTitle = (unitName: string, produced: number): string => {
  if (produced >= TITLE_THRESHOLDS.EMPEROR) return `【${unitName}】${TITLE_NAMES.EMPEROR}`
  if (produced >= TITLE_THRESHOLDS.KING) return `【${unitName}】${TITLE_NAMES.KING}`
  if (produced >= TITLE_THRESHOLDS.MASTER) return `【${unitName}】${TITLE_NAMES.MASTER}`
  if (produced >= TITLE_THRESHOLDS.SPECIALIST) return `【${unitName}】${TITLE_NAMES.SPECIALIST}`
  if (produced >= TITLE_THRESHOLDS.EXPERT) return `【${unitName}】${TITLE_NAMES.EXPERT}`
  if (produced >= TITLE_THRESHOLDS.NOVICE) return `【${unitName}】${TITLE_NAMES.NOVICE}`
  return `【${unitName}】${TITLE_NAMES.BEGINNER}` // 默认显示初出茅庐
}

// 获取称号颜色
export const getTitleColor = (produced: number): string => {
  if (produced >= TITLE_THRESHOLDS.EMPEROR) return TITLE_COLORS.EMPEROR
  if (produced >= TITLE_THRESHOLDS.KING) return TITLE_COLORS.KING
  if (produced >= TITLE_THRESHOLDS.MASTER) return TITLE_COLORS.MASTER
  if (produced >= TITLE_THRESHOLDS.SPECIALIST) return TITLE_COLORS.SPECIALIST
  if (produced >= TITLE_THRESHOLDS.EXPERT) return TITLE_COLORS.EXPERT
  if (produced >= TITLE_THRESHOLDS.NOVICE) return TITLE_COLORS.NOVICE
  return TITLE_COLORS.BEGINNER // 默认灰色
}

// 获取下一个称号的进度
export const getNextTitleProgress = (produced: number): { nextTitle: string; required: number; progress: number } => {
  if (produced >= TITLE_THRESHOLDS.EMPEROR) {
    return { nextTitle: '已获得最高称号', required: 0, progress: 100 }
  }
  if (produced >= TITLE_THRESHOLDS.KING) {
    return {
      nextTitle: TITLE_NAMES.EMPEROR,
      required: TITLE_THRESHOLDS.EMPEROR,
      progress: (produced / TITLE_THRESHOLDS.EMPEROR) * 100
    }
  }
  if (produced >= TITLE_THRESHOLDS.MASTER) {
    return {
      nextTitle: TITLE_NAMES.KING,
      required: TITLE_THRESHOLDS.KING,
      progress: (produced / TITLE_THRESHOLDS.KING) * 100
    }
  }
  if (produced >= TITLE_THRESHOLDS.SPECIALIST) {
    return {
      nextTitle: TITLE_NAMES.MASTER,
      required: TITLE_THRESHOLDS.MASTER,
      progress: (produced / TITLE_THRESHOLDS.MASTER) * 100
    }
  }
  if (produced >= TITLE_THRESHOLDS.EXPERT) {
    return {
      nextTitle: TITLE_NAMES.SPECIALIST,
      required: TITLE_THRESHOLDS.SPECIALIST,
      progress: (produced / TITLE_THRESHOLDS.SPECIALIST) * 100
    }
  }
  if (produced >= TITLE_THRESHOLDS.NOVICE) {
    return {
      nextTitle: TITLE_NAMES.EXPERT,
      required: TITLE_THRESHOLDS.EXPERT,
      progress: (produced / TITLE_THRESHOLDS.EXPERT) * 100
    }
  }
  return {
    nextTitle: TITLE_NAMES.NOVICE,
    required: TITLE_THRESHOLDS.NOVICE,
    progress: (produced / TITLE_THRESHOLDS.NOVICE) * 100
  }
}

// 获取所有称号信息（用于帮助文档）
export const getAllTitles = () => {
  return [
    { name: TITLE_NAMES.BEGINNER, threshold: TITLE_THRESHOLDS.BEGINNER, color: TITLE_COLORS.BEGINNER },
    { name: TITLE_NAMES.NOVICE, threshold: TITLE_THRESHOLDS.NOVICE, color: TITLE_COLORS.NOVICE },
    { name: TITLE_NAMES.EXPERT, threshold: TITLE_THRESHOLDS.EXPERT, color: TITLE_COLORS.EXPERT },
    { name: TITLE_NAMES.SPECIALIST, threshold: TITLE_THRESHOLDS.SPECIALIST, color: TITLE_COLORS.SPECIALIST },
    { name: TITLE_NAMES.MASTER, threshold: TITLE_THRESHOLDS.MASTER, color: TITLE_COLORS.MASTER },
    { name: TITLE_NAMES.KING, threshold: TITLE_THRESHOLDS.KING, color: TITLE_COLORS.KING },
    { name: TITLE_NAMES.EMPEROR, threshold: TITLE_THRESHOLDS.EMPEROR, color: TITLE_COLORS.EMPEROR }
  ]
} 
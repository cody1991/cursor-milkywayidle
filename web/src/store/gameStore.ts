import { create } from 'zustand'

// 常量定义
export const INFINITE_PRODUCTION = -1

export interface Resource {
  name: string
  amount: number
  perSecond: number
  maxAmount: number
}

export interface Unit {
  id: string
  name: string
  description: string
  owned: number
  baseProduction: number
  productionMultiplier: number
  unlocked: boolean
  level: number
  requiredLevel: number
  actionTime: number
}

export interface ResourceModule {
  id: string
  name: string
  description: string
  units: { [key: string]: Unit }
  unlocked: boolean
  currentLevel: number
  experience: number
  levelExperience: number
}

export interface ProductionActivity {
  moduleId: string
  unitId: string
  times: number
  currentTimes: number
  startTime: number
  endTime: number
  isActive: boolean
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
}

export interface ChatMessage {
  userId: string
  username: string
  message: string
  timestamp: string
}

export interface LeaderboardEntry {
  username: string
  score: number
  updated_at: string
}

export interface UnitDefinition {
  moduleId: string
  unitId: string
  name: string
  baseProduction: number
  actionTime: number
  requiredLevel: number
  score: number
  description: string
}

export interface GameState {
  userId: string
  username: string
  isLoggedIn: boolean
  ws: WebSocket | null
  wsStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  reconnectAttempts: number
  maxReconnectAttempts: number
  reconnectInterval: number
  resources: { [key: string]: Resource }
  modules: { [key: string]: ResourceModule }
  units: { [key: string]: { owned: number; unlocked: boolean; produced: number } }
  activities: ProductionActivity[]
  achievements: Achievement[]
  chatMessages: ChatMessage[]
  leaderboard: LeaderboardEntry[]
  lastSave: number
  totalPlayTime: number
  unitDefinitions: UnitDefinition[]

  login: (username: string) => Promise<void>
  logout: () => void
  connectWebSocket: () => void
  disconnectWebSocket: () => void
  reconnectWebSocket: () => void
  addResource: (resourceName: string, amount: number) => void
  spendResource: (resourceName: string, amount: number) => boolean
  startActivity: (moduleId: string, unitId: string, times: number) => void
  stopActivity: (activityId: string) => void
  updateActivities: () => void
  saveGame: () => Promise<void>
  loadGame: () => Promise<void>
  unlockAchievement: (achievementId: string) => Promise<void>
  submitScore: () => Promise<void>
  autoSubmitScore: () => Promise<void>
  sendChatMessage: (message: string) => Promise<void>
  checkAchievements: () => void
  handleWebSocketMessage: (data: any) => void
  saveLoginInfo: () => void
  loadLoginInfo: () => boolean
  clearLoginInfo: () => void
  fetchUnitDefinitions: () => void
}

const initialResources: { [key: string]: Resource } = {
  milk: {
    name: '牛奶',
    amount: 0,
    perSecond: 0,
    maxAmount: 1000
  },
  harvest: {
    name: '采摘',
    amount: 0,
    perSecond: 0,
    maxAmount: 1000
  },
  wood: {
    name: '木材',
    amount: 0,
    perSecond: 0,
    maxAmount: 1000
  }
}

// 移除硬编码的initialModules，因为现在从数据库获取单位定义
const initialModules: { [key: string]: ResourceModule } = {
  cow: {
    id: 'cow',
    name: '挤奶',
    description: '从各种奶牛身上获取牛奶',
    units: {},
    unlocked: true,
    currentLevel: 1,
    experience: 0,
    levelExperience: 100
  },
  wood: {
    id: 'wood',
    name: '伐木',
    description: '砍伐各种树木获取木材',
    units: {},
    unlocked: true,
    currentLevel: 1,
    experience: 0,
    levelExperience: 100
  },
  harvest: {
    id: 'harvest',
    name: '采摘',
    description: '采摘各种太空植物和果实',
    units: {},
    unlocked: true,
    currentLevel: 1,
    experience: 0,
    levelExperience: 100
  }
}

export const useGameStore = create<GameState>()(
  (set, get) => ({
    userId: '',
    username: '',
    isLoggedIn: false,
    ws: null,
    wsStatus: 'disconnected',
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectInterval: 1000,
    resources: initialResources,
    modules: initialModules,
    units: {},
    activities: [],
    achievements: [],
    chatMessages: [],
    leaderboard: [],
    lastSave: Date.now(),
    totalPlayTime: 0,
    unitDefinitions: [],

    login: async (username: string) => {
      if (!username.trim()) return

      // 使用用户名生成更一致的用户ID
      const tempUserId = `user_${username}_${Date.now()}`

      try {
        const response = await fetch('/api/user/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: tempUserId, username })
        })

        if (response.ok) {
          const result = await response.json()
          const { userId: actualUserId, isNewUser } = result

          console.log(`登录成功: ${username}, 用户ID: ${actualUserId}, 新用户: ${isNewUser}`)

          set({
            userId: actualUserId,
            username,
            isLoggedIn: true,
            wsStatus: 'disconnected',
            reconnectAttempts: 0
          })

          // 保存登录信息到本地存储
          get().saveLoginInfo()

          get().connectWebSocket()

          if (isNewUser) {
            console.log(`新用户 ${username} 注册成功`)
          } else {
            console.log(`用户 ${username} 登录成功`)
          }
        }
      } catch (error) {
        console.error('登录失败:', error)
      }
    },

    logout: () => {
      get().disconnectWebSocket()
      // 清除登录信息
      get().clearLoginInfo()
      set({
        userId: '',
        username: '',
        isLoggedIn: false,
        ws: null,
        wsStatus: 'disconnected',
        reconnectAttempts: 0,
        resources: initialResources,
        modules: initialModules,
        units: {},
        activities: [],
        achievements: [],
        chatMessages: [],
        leaderboard: [],
        unitDefinitions: []
      })
    },

    connectWebSocket: () => {
      const state = get()
      console.log('connectWebSocket called')
      console.log('登录状态:', state.isLoggedIn)
      console.log('WebSocket状态:', state.wsStatus)
      console.log('用户ID:', state.userId)

      if (!state.isLoggedIn || state.wsStatus === 'connected' || state.wsStatus === 'connecting') {
        console.log('WebSocket连接被阻止:', {
          notLoggedIn: !state.isLoggedIn,
          alreadyConnected: state.wsStatus === 'connected',
          connecting: state.wsStatus === 'connecting'
        })
        return
      }

      set({ wsStatus: 'connecting' })

      const ws = new WebSocket(`ws://localhost:3001?userId=${state.userId}`)

      ws.onopen = () => {
        console.log('WebSocket连接成功')
        set({
          ws,
          wsStatus: 'connected',
          reconnectAttempts: 0
        })

        // 添加延迟，确保连接完全建立
        setTimeout(() => {
          console.log('开始获取单位定义...')
          get().fetchUnitDefinitions()
        }, 100)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          get().handleWebSocketMessage(data)
        } catch (error) {
          console.error('WebSocket消息解析错误:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket错误:', error)
        set({ wsStatus: 'disconnected' })
      }

      ws.onclose = () => {
        console.log('WebSocket连接关闭')
        set({ ws: null, wsStatus: 'disconnected' })

        const currentState = get()
        if (currentState.isLoggedIn && currentState.reconnectAttempts < currentState.maxReconnectAttempts) {
          console.log(`尝试重连... (${currentState.reconnectAttempts + 1}/${currentState.maxReconnectAttempts})`)
          setTimeout(() => {
            get().reconnectWebSocket()
          }, currentState.reconnectInterval)
        }
      }
    },

    disconnectWebSocket: () => {
      const state = get()
      if (state.ws) {
        state.ws.close()
        set({ ws: null, wsStatus: 'disconnected', reconnectAttempts: 0 })
      }
    },

    reconnectWebSocket: () => {
      const state = get()
      if (state.wsStatus === 'connected') return

      set({ wsStatus: 'connecting' })

      const connect = () => {
        get().connectWebSocket()
      }

      const retry = () => {
        if (state.reconnectAttempts < state.maxReconnectAttempts) {
          setTimeout(connect, state.reconnectInterval)
          set({ reconnectAttempts: state.reconnectAttempts + 1 })
        } else {
          set({ wsStatus: 'disconnected' })
        }
      }

      retry()
    },

    handleWebSocketMessage: (data) => {
      console.log('收到WebSocket消息:', data.type)

      switch (data.type) {
        case 'load_game':
          if (data.saveData) {
            set({
              resources: data.saveData.resources,
              modules: data.saveData.modules,
              lastSave: data.saveData.lastSave,
              totalPlayTime: data.saveData.totalPlayTime
            })
            get().updateActivities()
          }
          break

        case 'save_success':
          set({ lastSave: Date.now() })
          break

        case 'achievements':
          set({ achievements: data.data })
          break

        case 'achievement_unlocked':
          console.log(`成就解锁: ${data.achievementId}`)
          break

        case 'leaderboard':
          console.log('收到排行榜数据:', data.data)
          set({ leaderboard: data.data })
          break

        case 'leaderboard_update':
          console.log('排行榜已更新')
          // 重新获取排行榜数据
          const currentState = get()
          if (currentState.isLoggedIn && currentState.ws) {
            try {
              currentState.ws.send(JSON.stringify({
                type: 'fetch_leaderboard'
              }))
            } catch (error) {
              console.error('重新获取排行榜失败:', error)
            }
          }
          break

        case 'chat':
          set((state) => {
            const newMessages = [...state.chatMessages, {
              userId: data.userId,
              username: data.username,
              message: data.message,
              timestamp: data.timestamp
            }];

            // 限制最多100条消息
            if (newMessages.length > 100) {
              return {
                chatMessages: newMessages.slice(-100)
              };
            }

            return {
              chatMessages: newMessages
            };
          })
          break

        case 'chat_history':
          // 确保聊天历史也限制在100条以内
          const limitedHistory = data.data.length > 100 ? data.data.slice(-100) : data.data;
          set({ chatMessages: limitedHistory })
          break

        case 'user_state_update':
          console.log('收到用户状态更新:', data)
          console.log('用户状态更新 - units:', data.units)
          console.log('用户状态更新 - resources:', data.resources)
          console.log('用户状态更新 - modules:', data.modules)
          set({
            resources: data.resources,
            modules: data.modules,
            units: data.units
          })
          // 状态更新后自动提交分数
          setTimeout(() => {
            get().autoSubmitScore()
          }, 100)
          break

        case 'activities_update':
          set({ activities: data.activities })
          break

        case 'activity_started':
          console.log(`活动开始: ${data.activityId}`)
          break

        case 'activity_stopped':
          console.log(`活动停止: ${data.activityId}`)
          break

        case 'unit_definitions':
          console.log('收到单位定义数据:', data.data)
          set({ unitDefinitions: data.data })
          break
      }
    },

    addResource: (resourceName: string, amount: number) => {
      set((state) => ({
        resources: {
          ...state.resources,
          [resourceName]: {
            ...state.resources[resourceName],
            amount: Math.min(
              state.resources[resourceName].amount + amount,
              state.resources[resourceName].maxAmount
            )
          }
        }
      }))
    },

    spendResource: (resourceName: string, amount: number) => {
      const state = get()
      const resource = state.resources[resourceName]

      if (!resource || resource.amount < amount) {
        return false
      }

      set((state) => ({
        resources: {
          ...state.resources,
          [resourceName]: {
            ...state.resources[resourceName],
            amount: state.resources[resourceName].amount - amount
          }
        }
      }))

      get().checkAchievements()
      return true
    },

    startActivity: (moduleId: string, unitId: string, times: number) => {
      const state = get()
      if (!state.isLoggedIn || !state.ws) return

      try {
        state.ws.send(JSON.stringify({
          type: 'start_activity',
          moduleId,
          unitId,
          times
        }))
      } catch (error) {
        console.error('开始活动失败:', error)
      }
    },

    stopActivity: (activityId: string) => {
      const state = get()
      if (!state.isLoggedIn || !state.ws) return

      try {
        state.ws.send(JSON.stringify({
          type: 'stop_activity',
          activityId
        }))
      } catch (error) {
        console.error('停止活动失败:', error)
      }
    },

    updateActivities: () => {
      const state = get()
      if (!state.isLoggedIn || !state.ws) return

      try {
        state.ws.send(JSON.stringify({
          type: 'update_activities'
        }))
      } catch (error) {
        console.error('更新活动失败:', error)
      }
    },

    saveGame: async () => {
      const state = get()
      if (!state.isLoggedIn || !state.ws) return

      try {
        const saveData = {
          resources: state.resources,
          modules: state.modules,
          lastSave: Date.now(),
          totalPlayTime: state.totalPlayTime
        }

        state.ws.send(JSON.stringify({
          type: 'save_game',
          saveData
        }))
      } catch (error) {
        console.error('保存失败:', error)
      }
    },

    loadGame: async () => {
      const state = get()
      if (!state.isLoggedIn || !state.ws) return

      try {
        state.ws.send(JSON.stringify({
          type: 'load_game'
        }))
      } catch (error) {
        console.error('加载失败:', error)
      }
    },

    unlockAchievement: async (achievementId: string) => {
      const state = get()
      if (!state.isLoggedIn || !state.ws) return

      try {
        state.ws.send(JSON.stringify({
          type: 'unlock_achievement',
          achievementId
        }))
      } catch (error) {
        console.error('解锁成就失败:', error)
      }
    },

    submitScore: async () => {
      const state = get()
      if (!state.isLoggedIn || !state.ws) return

      try {
        console.log('当前资源状态:', state.resources)
        console.log('当前单位状态:', state.units)
        console.log('当前模块状态:', state.modules)

        // 计算总资源数量
        const totalResources = Object.values(state.resources).reduce((sum, resource) => {
          console.log(`资源: ${JSON.stringify(resource)}, amount: ${resource.amount}, type: ${typeof resource.amount}`)
          return sum + Number(resource.amount || 0)
        }, 0)

        // 计算总单位数量（从独立的units对象中获取）
        const totalUnits = Object.values(state.units).reduce((sum, unit) => {
          console.log(`单位: ${JSON.stringify(unit)}, owned: ${unit.owned}, type: ${typeof unit.owned}`)
          return sum + Number(unit.owned || 0)
        }, 0)

        // 计算总等级
        const totalLevels = Object.values(state.modules).reduce((sum, module) => {
          console.log(`模块: ${JSON.stringify(module)}, currentLevel: ${module.currentLevel}, type: ${typeof module.currentLevel}`)
          return sum + Number(module.currentLevel || 0)
        }, 0)

        // 分数 = 资源数量 + (单位数量 - 基础单位数量) * 5 + (等级 - 基础等级) * 50
        // 新用户基础单位数量为2，基础等级为3，所以新用户分数为0
        const baseUnits = 2 // 新用户默认拥有的单位数量
        const baseLevels = 3 // 新用户默认的等级总和
        const score = totalResources + Math.max(0, totalUnits - baseUnits) * 5 + Math.max(0, totalLevels - baseLevels) * 50

        console.log(`提交分数: 资源=${totalResources}, 单位=${totalUnits}, 等级=${totalLevels}, 总分=${score}`)

        state.ws.send(JSON.stringify({
          type: 'submit_score',
          score
        }))
      } catch (error) {
        console.error('提交分数失败:', error)
      }
    },

    // 自动提交分数（在资源或等级变化时调用）
    autoSubmitScore: async () => {
      const state = get()
      if (!state.isLoggedIn || !state.ws) {
        console.log('无法自动提交分数：未登录或WebSocket未连接')
        return
      }

      try {
        // 计算总资源数量
        const totalResources = Object.values(state.resources).reduce((sum, resource) => sum + Number(resource.amount || 0), 0)

        // 计算总单位数量
        const totalUnits = Object.values(state.units).reduce((sum, unit) => sum + Number(unit.owned || 0), 0)

        // 计算总等级
        const totalLevels = Object.values(state.modules).reduce((sum, module) => sum + Number(module.currentLevel || 0), 0)

        // 分数 = 资源数量 + (单位数量 - 基础单位数量) * 5 + (等级 - 基础等级) * 50
        // 新用户基础单位数量为2，基础等级为3，所以新用户分数为0
        const baseUnits = 2 // 新用户默认拥有的单位数量
        const baseLevels = 3 // 新用户默认的等级总和
        const score = totalResources + Math.max(0, totalUnits - baseUnits) * 5 + Math.max(0, totalLevels - baseLevels) * 50

        console.log(`自动提交分数: 资源=${totalResources}, 单位=${totalUnits}, 等级=${totalLevels}, 总分=${score}`)

        state.ws.send(JSON.stringify({
          type: 'submit_score',
          score
        }))
      } catch (error) {
        console.error('自动提交分数失败:', error)
      }
    },

    sendChatMessage: async (message: string) => {
      const state = get()
      if (!state.isLoggedIn || !state.ws || !message.trim()) return

      try {
        state.ws.send(JSON.stringify({
          type: 'chat',
          message: message.trim()
        }))
      } catch (error) {
        console.error('发送消息失败:', error)
      }
    },

    checkAchievements: () => {
      console.log('检查成就...')
    },

    saveLoginInfo: () => {
      const state = get()
      if (state.isLoggedIn && state.userId && state.username) {
        const loginInfo = {
          userId: state.userId,
          username: state.username,
          timestamp: Date.now()
        }
        localStorage.setItem('galaxyCowIdle_login', JSON.stringify(loginInfo))
      }
    },

    loadLoginInfo: () => {
      try {
        const savedLogin = localStorage.getItem('galaxyCowIdle_login')
        if (savedLogin) {
          const loginInfo = JSON.parse(savedLogin)
          const now = Date.now()
          const oneDay = 24 * 60 * 60 * 1000 // 24小时

          // 检查登录信息是否在24小时内
          if (now - loginInfo.timestamp < oneDay) {
            set({
              userId: loginInfo.userId,
              username: loginInfo.username,
              isLoggedIn: true
            })

            // 自动连接WebSocket
            setTimeout(() => {
              get().connectWebSocket()
            }, 100)

            return true
          } else {
            // 登录信息过期，清除
            get().clearLoginInfo()
          }
        }
      } catch (error) {
        console.error('加载登录信息失败:', error)
        get().clearLoginInfo()
      }
      return false
    },

    clearLoginInfo: () => {
      localStorage.removeItem('galaxyCowIdle_login')
    },

    fetchUnitDefinitions: () => {
      const { ws } = get()
      console.log('fetchUnitDefinitions called')
      console.log('WebSocket状态:', ws?.readyState)
      console.log('WebSocket连接状态:', ws?.readyState === WebSocket.OPEN ? 'OPEN' : 'NOT OPEN')
      console.log('WebSocket对象:', ws)

      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('发送fetch_unit_definitions请求')
        try {
          ws.send(JSON.stringify({
            type: 'fetch_unit_definitions'
          }))
          console.log('fetch_unit_definitions请求已发送')
        } catch (error) {
          console.error('发送fetch_unit_definitions请求失败:', error)
        }
      } else {
        console.error('WebSocket未连接，无法获取单位定义')
        console.error('WebSocket状态详情:', {
          ws: !!ws,
          readyState: ws?.readyState,
          isOpen: ws?.readyState === WebSocket.OPEN
        })
      }
    }
  })
) 
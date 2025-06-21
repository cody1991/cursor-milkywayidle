import React, { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

const ChatPanel: React.FC = () => {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    chatMessages,
    sendChatMessage,
    userId,
    isLoggedIn,
    ws,
    wsStatus,
    reconnectAttempts,
    maxReconnectAttempts
  } = useGameStore()

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleSendMessage = async () => {
    if (message.trim()) {
      console.log('发送聊天消息:', message.trim())
      console.log('WebSocket状态:', ws?.readyState)
      console.log('登录状态:', isLoggedIn)
      console.log('用户ID:', userId)

      await sendChatMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 如果未登录，显示登录提示
  if (!isLoggedIn) {
    return (
      <div className="chat-panel">
        <h2>💬 聊天室</h2>
        <div className="login-prompt">
          <p>🔐 请先登录以使用聊天功能</p>
          <p>点击右上角的"开始游戏"按钮进行登录</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-panel">
      <h2>💬 聊天室</h2>

      {/* 调试信息 */}
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
        WebSocket状态: {
          wsStatus === 'connected' ? '已连接' :
            wsStatus === 'connecting' ? '连接中' :
              wsStatus === 'reconnecting' ? `重连中 (${reconnectAttempts}/${maxReconnectAttempts})` :
                '未连接'
        } |
        登录状态: {isLoggedIn ? '已登录' : '未登录'} |
        用户ID: {userId || '无'}
      </div>

      <div className="chat-messages">
        {chatMessages.length === 0 ? (
          <div className="no-messages">暂无消息</div>
        ) : (
          chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`chat-message ${msg.userId === userId ? 'own-message' : ''}`}
            >
              <div className="message-header">
                <span className="message-username">{msg.username}</span>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="message-content">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="输入消息..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!isLoggedIn}
        />
        <button
          onClick={handleSendMessage}
          disabled={!message.trim() || !isLoggedIn}
        >
          发送
        </button>
      </div>
    </div>
  )
}

export default ChatPanel 
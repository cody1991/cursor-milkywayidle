import React, { useState } from 'react'
import { useGameStore } from '../store/gameStore'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState('')
  const login = useGameStore((state) => state.login)

  const handleLogin = async () => {
    if (username.trim()) {
      await login(username.trim())
      onClose()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>🐄 欢迎来到银河奶牛放置</h2>
        <p>请输入你的用户名开始你的农场之旅</p>

        <div className="input-group">
          <input
            type="text"
            placeholder="输入用户名..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
          />
        </div>

        <div className="modal-actions">
          <button
            className="login-button"
            onClick={handleLogin}
            disabled={!username.trim()}
          >
            开始游戏
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginModal 
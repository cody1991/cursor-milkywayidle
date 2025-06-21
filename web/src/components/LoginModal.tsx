import React, { useState } from 'react'
import { useGameStore } from '../store/gameStore'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const login = useGameStore((state) => state.login)

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }

    if (username.length < 3 || username.length > 20) {
      setError('用户名长度必须在3-20个字符之间')
      return
    }

    if (password.length < 6) {
      setError('密码长度至少6个字符')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      await login(username.trim(), password.trim())
      if (rememberMe) {
        useGameStore.getState().saveLoginInfo()
      }
      onClose()
    } catch (error: any) {
      setError(error.message || '登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  const handleInputChange = () => {
    if (error) {
      setError('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>🐄 欢迎来到银河奶牛放置</h2>
        <p>请输入你的用户名和密码开始你的农场之旅</p>

        <div className="input-group">
          <input
            type="text"
            placeholder="输入用户名..."
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              handleInputChange()
            }}
            onKeyPress={handleKeyPress}
            autoFocus
          />
        </div>

        <div className="input-group">
          <input
            type="password"
            placeholder="输入密码..."
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              handleInputChange()
            }}
            onKeyPress={handleKeyPress}
          />
        </div>

        <div className="remember-me">
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>记住我（24小时内自动登录）</span>
          </label>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button
            className="login-button"
            onClick={handleLogin}
            disabled={!username.trim() || !password.trim() || isLoading}
          >
            {isLoading ? '登录中...' : '开始游戏'}
          </button>
        </div>

        <div className="login-tips">
          <p>💡 提示：</p>
          <ul>
            <li>用户名长度：3-20个字符</li>
            <li>密码长度：至少6个字符</li>
            <li>首次使用将自动注册新账户</li>
            <li>后续使用相同用户名和密码登录</li>
            <li>勾选"记住我"可在24小时内自动登录</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default LoginModal

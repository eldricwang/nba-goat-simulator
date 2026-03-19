// src/components/AuthModal.tsx
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface AuthModalProps {
  onClose: () => void
}

type Mode = 'login' | 'register'

export default function AuthModal({ onClose }: AuthModalProps) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(username, password)
      } else {
        if (!nickname.trim()) {
          setError('请输入昵称')
          setLoading(false)
          return
        }
        await register(username, password, nickname.trim())
      }
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '操作失败')
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a2e',
          borderRadius: 20,
          padding: 32,
          width: '100%',
          maxWidth: 400,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏀</div>
          <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', margin: 0 }}>
            {mode === 'login' ? '欢迎回来' : '加入讨论'}
          </h2>
          <p style={{ color: '#999', fontSize: 14, marginTop: 6 }}>
            {mode === 'login' ? '登录你的账号' : '注册一个新账号'}
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 6 }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              maxLength={20}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 6 }}>
                昵称（评论时显示）
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="你的球迷昵称"
                maxLength={20}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 15,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 6 }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? '至少6位' : '请输入密码'}
              minLength={6}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,80,80,0.15)',
              border: '1px solid rgba(255,80,80,0.3)',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 16,
              color: '#ff6b6b',
              fontSize: 14,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px 0',
              borderRadius: 10,
              border: 'none',
              background: loading
                ? '#333'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
              cursor: loading ? 'wait' : 'pointer',
              transition: 'all 0.3s',
            }}
          >
            {loading
              ? '处理中...'
              : mode === 'login'
              ? '登 录'
              : '注 册'}
          </button>
        </form>

        {/* 切换模式 */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ color: '#666', fontSize: 14 }}>
            {mode === 'login' ? '还没有账号？' : '已有账号？'}
          </span>
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              fontSize: 14,
              fontWeight: 'bold',
              cursor: 'pointer',
              marginLeft: 4,
            }}
          >
            {mode === 'login' ? '去注册' : '去登录'}
          </button>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: '#666',
            fontSize: 20,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// src/components/CommentSection.tsx
import { useState, useEffect } from 'react'
import { fetchComments, postComment } from '../api'
import type { Comment } from '../api'

export default function CommentSection({ teamName }: { teamName?: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 加载评论
  const loadComments = async () => {
    setLoading(true)
    try {
      const data = await fetchComments()
      setComments(data)
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadComments()
  }, [])

  // 提交评论
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || !content.trim()) return

    setSubmitting(true)
    try {
      await postComment(nickname.trim(), content.trim(), teamName)
      setContent('')
      loadComments()
    } catch {
      alert('发送失败，请重试')
    }
    setSubmitting(false)
  }

  // 时间格式化
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
    if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`
    return date.toLocaleDateString('zh-CN')
  }

  // 随机头像颜色
  const getAvatarColor = (name: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div style={{
      maxWidth: 700,
      margin: '40px auto',
      padding: '0 20px',
    }}>
      {/* 标题 */}
      <div style={{
        textAlign: 'center',
        marginBottom: 30,
      }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: '#fff',
          margin: 0,
        }}>
          🏀 球迷讨论区
        </h2>
        <p style={{ color: '#999', marginTop: 8, fontSize: 14 }}>
          分享你的最强阵容，和其他球迷一起讨论！
        </p>
      </div>

      {/* 发表评论 */}
      <form onSubmit={handleSubmit} style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="你的昵称"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
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
        <div style={{ marginBottom: 16 }}>
          <textarea
            placeholder="说说你的看法... 你觉得谁才是GOAT？"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            rows={4}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 15,
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          <div style={{
            textAlign: 'right',
            fontSize: 12,
            color: '#666',
            marginTop: 4,
          }}>
            {content.length}/500
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting || !nickname.trim() || !content.trim()}
          style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 10,
            border: 'none',
            background: submitting || !nickname.trim() || !content.trim()
              ? '#333'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: submitting ? 'wait' : 'pointer',
            transition: 'all 0.3s',
          }}
        >
          {submitting ? '发送中...' : '💬 发表评论'}
        </button>
      </form>

      {/* 评论列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
          加载中...
        </div>
      ) : comments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#666',
          padding: 60,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 16,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏟️</div>
          <p>还没有评论，来做第一个发言的球迷吧！</p>
        </div>
      ) : (
        <div>
          <div style={{
            color: '#999',
            fontSize: 14,
            marginBottom: 16,
          }}>
            共 {comments.length} 条评论
          </div>
          {comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 14,
                padding: 20,
                marginBottom: 12,
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                {/* 头像 */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: getAvatarColor(comment.nickname),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#fff',
                  marginRight: 12,
                  flexShrink: 0,
                }}>
                  {comment.nickname[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 'bold',
                    color: '#e0e0e0',
                    fontSize: 15,
                  }}>
                    {comment.nickname}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: '#666',
                    marginTop: 2,
                  }}>
                    {formatTime(comment.created_at)}
                    {comment.team_name && (
                      <span style={{
                        marginLeft: 8,
                        background: 'rgba(102,126,234,0.2)',
                        color: '#667eea',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                      }}>
                        🏀 {comment.team_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{
                color: '#ccc',
                fontSize: 15,
                lineHeight: 1.6,
                paddingLeft: 52,
                wordBreak: 'break-word',
              }}>
                {comment.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

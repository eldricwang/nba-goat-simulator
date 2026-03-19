// src/components/ProfilePage.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchProfile, updateProfile } from '../api'
import type { User } from '../api'

// 预设头像列表
const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=LeBron',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Kobe',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Curry',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Duncan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Magic',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bird',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Shaq',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Wilt',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Russell',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Hakeem',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Kareem',
]

const GENDER_OPTIONS = [
  { value: '', label: '不设置' },
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
]

interface ProfilePageProps {
  onBack: () => void
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  // 编辑表单状态
  const [editNickname, setEditNickname] = useState('')
  const [editBirthday, setEditBirthday] = useState('')
  const [editGender, setEditGender] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await fetchProfile()
      setProfile(data)
      // 初始化编辑表单
      setEditNickname(data.nickname || '')
      setEditBirthday(data.birthday || '')
      setEditGender(data.gender || '')
      setEditAvatarUrl(data.avatar_url || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载资料失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const updated = await updateProfile({
        nickname: editNickname.trim(),
        birthday: editBirthday,
        gender: editGender,
        avatar_url: editAvatarUrl,
      })
      setProfile(updated)
      updateUser(updated)
      setIsEditing(false)
      setSuccess('资料更新成功！')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (profile) {
      setEditNickname(profile.nickname || '')
      setEditBirthday(profile.birthday || '')
      setEditGender(profile.gender || '')
      setEditAvatarUrl(profile.avatar_url || '')
    }
    setIsEditing(false)
    setError('')
  }

  const getGenderLabel = (gender: string) => {
    const option = GENDER_OPTIONS.find(o => o.value === gender)
    return option ? option.label : '未设置'
  }

  const getAvatarDisplay = (avatarUrl: string, nickname: string) => {
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={nickname}
          className="w-full h-full rounded-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
            ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
          }}
        />
      )
    }
    return null
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-gray-400 text-lg">请先登录</p>
          <button
            onClick={onBack}
            className="mt-4 px-6 py-2 rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">🏀</div>
          <p className="text-gray-400 animate-pulse">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <span className="text-lg">&larr;</span>
              <span className="text-sm font-bold">返回首页</span>
            </button>
            <h1 className="text-lg font-bold">个人主页</h1>
            <div className="w-20" /> {/* spacer */}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* 提示消息 */}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* 头像区域 */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold text-white overflow-hidden"
              style={{
                background: editAvatarUrl && isEditing
                  ? 'transparent'
                  : profile?.avatar_url
                  ? 'transparent'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {isEditing ? (
                <>
                  {editAvatarUrl ? (
                    <img
                      src={editAvatarUrl}
                      alt={editNickname}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{editNickname[0] || '?'}</span>
                  )}
                </>
              ) : (
                <>
                  {getAvatarDisplay(profile?.avatar_url || '', profile?.nickname || '')}
                  <span className={profile?.avatar_url ? 'hidden' : ''}>
                    {profile?.nickname?.[0] || '?'}
                  </span>
                </>
              )}
            </div>
            {isEditing && (
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm hover:bg-orange-600 transition-colors shadow-lg"
                title="更换头像"
              >
                📷
              </button>
            )}
          </div>

          {!isEditing && (
            <div className="text-center mt-4">
              <h2 className="text-2xl font-bold">{profile?.nickname}</h2>
              <p className="text-gray-500 text-sm mt-1">@{profile?.username}</p>
            </div>
          )}
        </div>

        {/* 头像选择器 */}
        {isEditing && showAvatarPicker && (
          <div className="mb-8 bg-gray-900/50 rounded-2xl p-5 border border-gray-800">
            <h3 className="text-sm font-bold text-gray-400 mb-3">选择头像</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {/* 无头像选项 */}
              <button
                onClick={() => {
                  setEditAvatarUrl('')
                  setShowAvatarPicker(false)
                }}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${
                  !editAvatarUrl
                    ? 'border-orange-500 bg-gray-700'
                    : 'border-transparent bg-gray-800 hover:border-gray-600'
                }`}
              >
                🚫
              </button>
              {AVATAR_OPTIONS.map((url, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setEditAvatarUrl(url)
                    setShowAvatarPicker(false)
                  }}
                  className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${
                    editAvatarUrl === url
                      ? 'border-orange-500'
                      : 'border-transparent hover:border-gray-600'
                  }`}
                >
                  <img src={url} alt={`头像 ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* 自定义头像URL */}
            <div className="mt-4">
              <label className="block text-xs text-gray-500 mb-2">或输入自定义头像 URL</label>
              <input
                type="url"
                value={editAvatarUrl}
                onChange={(e) => setEditAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* 资料卡片 */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-400">个人资料</h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-1.5 rounded-lg text-sm font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-colors"
              >
                编辑资料
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-1.5 rounded-lg text-sm font-bold bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-5">
              {/* 昵称 */}
              <div>
                <label className="block text-xs text-gray-500 mb-2 font-medium">昵称</label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  maxLength={20}
                  placeholder="你的昵称"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              {/* 用户名（只读） */}
              <div>
                <label className="block text-xs text-gray-500 mb-2 font-medium">用户名</label>
                <input
                  type="text"
                  value={profile?.username || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-600 mt-1">用户名不可修改</p>
              </div>

              {/* 性别 */}
              <div>
                <label className="block text-xs text-gray-500 mb-2 font-medium">性别</label>
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setEditGender(opt.value)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                        editGender === opt.value
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 生日 */}
              <div>
                <label className="block text-xs text-gray-500 mb-2 font-medium">生日</label>
                <input
                  type="date"
                  value={editBirthday}
                  onChange={(e) => setEditBirthday(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-orange-500 focus:outline-none transition-colors [color-scheme:dark]"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ProfileField label="昵称" value={profile?.nickname || '未设置'} />
              <ProfileField label="用户名" value={`@${profile?.username || ''}`} />
              <ProfileField label="性别" value={getGenderLabel(profile?.gender || '')} />
              <ProfileField
                label="生日"
                value={profile?.birthday ? formatBirthday(profile.birthday) : '未设置'}
              />
              <ProfileField
                label="注册时间"
                value={profile?.created_at ? formatDate(profile.created_at) : '未知'}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// 子组件：展示一行资料
function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  )
}

// 格式化生日
function formatBirthday(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-')
    return `${year}年${parseInt(month)}月${parseInt(day)}日`
  } catch {
    return dateStr
  }
}

// 格式化日期
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  } catch {
    return dateStr
  }
}

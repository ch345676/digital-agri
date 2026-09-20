import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Sprout, Eye, EyeOff, ShieldCheck, UserRound, UserPlus, Compass, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth'
import { EASE } from '../components/anim'

type Mode = 'admin' | 'login' | 'register'

const TABS: { key: Mode; label: string; icon: typeof ShieldCheck }[] = [
  { key: 'admin', label: '管理员登录', icon: ShieldCheck },
  { key: 'login', label: '用户登录', icon: UserRound },
  { key: 'register', label: '注册', icon: UserPlus },
]

function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  const [show, setShow] = useState(false)
  const isPwd = type === 'password'
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-black/55">{label}</span>
      <span className="relative block">
        <input
          type={isPwd ? (show ? 'text' : 'password') : type}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-[12px] border border-black/[0.1] bg-black/[0.03] px-3.5 py-3 text-[14px] text-[#1a2b23] outline-none transition-colors placeholder:text-black/30 focus:border-[rgba(22,163,74,0.45)] focus:bg-white"
        />
        {isPwd && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-black/35"
            tabIndex={-1}
          >
            {show ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
          </button>
        )}
      </span>
    </label>
  )
}

export default function Login() {
  const { login, register, enterGuest } = useAuth()
  const [mode, setMode] = useState<Mode>('admin')
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      let err: string | null = null
      if (mode === 'admin') {
        err = await login(username || 'admin', password, remember)
        if (!err) toast('欢迎回来，管理员')
      } else if (mode === 'login') {
        err = await login(username, password, remember)
        if (!err) toast('登录成功')
      } else {
        if (password !== confirm) err = '两次输入的密码不一致'
        else {
          err = await register(username, password, nickname, remember)
          if (!err) toast('注册成功，已自动登录')
        }
      }
      if (err) toast.error(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page mx-auto flex min-h-screen w-full max-w-[420px] flex-col px-6 pb-10 pt-16">
      {/* 品牌区 */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex flex-col items-center"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-[rgba(22,163,74,0.25)] bg-[rgba(22,163,74,0.07)]">
          <Sprout className="h-8 w-8 text-[#16a34a]" strokeWidth={1.8} />
        </span>
        <h1 className="mt-4 text-[24px] font-bold tracking-[-0.02em] text-[#1a2b23]">数字农业协作平台</h1>
        <p className="mt-1 text-[12px] text-black/40">智慧农田 · 巡检灌溉 · 农事协作</p>
      </motion.div>

      {/* 登录/注册卡 */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
        className="mt-8 rounded-[18px] border border-black/[0.07] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.1)]"
      >
        {/* 三个入口 Tab */}
        <div className="grid grid-cols-3 gap-1 rounded-[12px] bg-black/[0.04] p-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex items-center justify-center gap-1 rounded-[10px] py-2 text-[12px] font-medium transition-colors ${
                mode === key ? 'bg-white text-[#16a34a] shadow-sm' : 'text-black/45'
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
              {label}
            </button>
          ))}
        </div>

        <form key={mode} onSubmit={submit} className="mt-5 space-y-4">
          <Field
            label="用户名"
            value={mode === 'admin' ? username || 'admin' : username}
            onChange={setUsername}
            placeholder={mode === 'admin' ? 'admin' : '请输入用户名'}
            autoFocus={mode !== 'admin'}
          />
          {mode === 'register' && (
            <Field label="昵称 / 姓名" value={nickname} onChange={setNickname} placeholder="例如：李田丰" />
          )}
          <Field
            label="密码"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={mode === 'admin' ? '初始密码 admin123' : mode === 'register' ? '至少 6 位' : '请输入密码'}
          />
          {mode === 'register' && (
            <Field label="确认密码" type="password" value={confirm} onChange={setConfirm} placeholder="再次输入密码" />
          )}

          <label className="flex items-center gap-2 text-[12px] text-black/50">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 accent-[#16a34a]"
            />
            记住我（下次自动登录）
          </label>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-[13px] bg-[#16a34a] py-3 text-[15px] font-semibold text-white disabled:opacity-60"
          >
            <Lock className="h-4 w-4" strokeWidth={1.8} />
            {busy ? '请稍候…' : mode === 'register' ? '注册并登录' : '登 录'}
          </motion.button>

          {mode === 'admin' && (
            <p className="text-center text-[11px] text-black/35">内置管理员账号 admin · 初始密码 admin123</p>
          )}
        </form>
      </motion.div>

      {/* 游客入口 */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        onClick={() => {
          enterGuest(remember)
          toast('已进入游客预览模式（只读）')
        }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[13px] border border-black/[0.1] bg-white/60 py-3 text-[13.5px] font-medium text-black/55"
      >
        <Compass className="h-4 w-4" strokeWidth={1.6} />
        游客预览 · 无需注册直接体验
      </motion.button>

      <p className="mt-auto pt-8 text-center text-[10.5px] leading-relaxed text-black/30">
        纯静态演示站点 · 账号与数据仅保存在本浏览器 localStorage
        <br />
        密码经 SHA-256 哈希存储，不明文保存
      </p>
    </div>
  )
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

/* ============================== 类型 ============================== */

export type Role = 'admin' | 'user' | 'guest'

export interface UserRec {
  username: string
  nickname: string
  passHash: string
  role: 'admin' | 'user'
  createdAt: number
}

export interface Session {
  role: Role
  /** admin / user 为用户名；guest 无 */
  username?: string
  nickname: string
}

/* ============================== 存储键 ============================== */

const USERS_KEY = 'agri:users'
const SESSION_KEY = 'agri:session'

/** 业务数据命名空间：admin 用默认键（兼容存量数据），用户/游客独立隔离 */
export function storageKeyFor(sess: Session, base: string): string {
  if (sess.role === 'admin') return base
  if (sess.role === 'guest') return `agri:guest:${base}`
  return `agri:user:${sess.username}:${base}`
}

/* ============================== SHA-256（Web Crypto，含降级） ============================== */

export async function sha256(text: string): Promise<string> {
  try {
    if (globalThis.crypto?.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    }
  } catch {
    /* fall through */
  }
  /* 非安全上下文降级：FNV-1a（仅演示环境兜底，生产为 HTTPS 必走 Web Crypto） */
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ (c & 0xff), 0x01000193)
    h2 = Math.imul(h2 ^ (c >> 8), 0x811c9dc5)
  }
  return `fnv-${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`
}

/* ============================== 用户表 ============================== */

function loadUsers(): UserRec[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (raw) return JSON.parse(raw) as UserRec[]
  } catch {
    /* ignore */
  }
  return []
}

function saveUsers(users: UserRec[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

/** 确保内置管理员存在（初始密码 admin123） */
async function ensureAdmin(): Promise<UserRec[]> {
  const users = loadUsers()
  if (users.some((u) => u.username === 'admin')) return users
  const admin: UserRec = {
    username: 'admin',
    nickname: '管理员',
    passHash: await sha256('admin123'),
    role: 'admin',
    createdAt: Date.now(),
  }
  const next = [admin, ...users]
  saveUsers(next)
  return next
}

/* ============================== 会话持久化 ============================== */

function loadSession(): Session | null {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const raw = store.getItem(SESSION_KEY)
      if (raw) return JSON.parse(raw) as Session
    } catch {
      /* ignore */
    }
  }
  return null
}

function saveSession(sess: Session | null, remember: boolean) {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  if (sess) (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(sess))
}

/* ============================== Context ============================== */

interface AuthCtx {
  /** null = 未选择身份（展示登录页） */
  session: Session | null
  users: UserRec[]
  login: (username: string, password: string, remember: boolean) => Promise<string | null>
  register: (username: string, password: string, nickname: string, remember: boolean) => Promise<string | null>
  enterGuest: (remember: boolean) => void
  logout: () => void
  changeNickname: (nickname: string) => void
  changePassword: (oldPwd: string, newPwd: string) => Promise<string | null>
  adminResetPassword: (username: string, newPwd: string) => Promise<void>
  adminDeleteUser: (username: string) => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)
  const [users, setUsers] = useState<UserRec[]>([])

  useEffect(() => {
    void ensureAdmin().then(setUsers)
  }, [])

  const value = useMemo<AuthCtx>(
    () => ({
      session,
      users,
      async login(username, password, remember) {
        const name = username.trim()
        if (!name || !password) return '请输入用户名和密码'
        const list = await ensureAdmin()
        setUsers(list)
        const rec = list.find((u) => u.username === name)
        if (!rec) return '账号不存在，请先注册'
        if (rec.passHash !== (await sha256(password))) return '密码错误，请重试'
        const sess: Session = { role: rec.role, username: rec.username, nickname: rec.nickname }
        setSession(sess)
        saveSession(sess, remember)
        return null
      },
      async register(username, password, nickname, remember) {
        const name = username.trim()
        const nick = nickname.trim()
        if (!/^[a-zA-Z0-9_一-龥]{2,16}$/.test(name)) return '用户名需为 2-16 位字母、数字或汉字'
        if (name === 'admin') return '该用户名为内置管理员保留'
        if (password.length < 6) return '密码至少 6 位'
        if (!nick) return '请填写昵称'
        const list = await ensureAdmin()
        if (list.some((u) => u.username === name)) return '用户名已被注册'
        const rec: UserRec = {
          username: name,
          nickname: nick,
          passHash: await sha256(password),
          role: 'user',
          createdAt: Date.now(),
        }
        const next = [...list, rec]
        saveUsers(next)
        setUsers(next)
        const sess: Session = { role: 'user', username: name, nickname: nick }
        setSession(sess)
        saveSession(sess, remember)
        return null
      },
      enterGuest(remember) {
        const sess: Session = { role: 'guest', nickname: '游客' }
        setSession(sess)
        saveSession(sess, remember)
      },
      logout() {
        setSession(null)
        saveSession(null, true)
      },
      changeNickname(nickname) {
        const nick = nickname.trim()
        if (!nick || !session?.username) return
        const next = users.map((u) => (u.username === session.username ? { ...u, nickname: nick } : u))
        saveUsers(next)
        setUsers(next)
        const sess = { ...session, nickname: nick }
        setSession(sess)
        saveSession(sess, localStorage.getItem(SESSION_KEY) !== null)
      },
      async changePassword(oldPwd, newPwd) {
        if (!session?.username) return '请先登录'
        if (newPwd.length < 6) return '新密码至少 6 位'
        const rec = users.find((u) => u.username === session.username)
        if (!rec) return '账号异常'
        if (rec.passHash !== (await sha256(oldPwd))) return '原密码不正确'
        const hash = await sha256(newPwd)
        const next = users.map((u) => (u.username === session.username ? { ...u, passHash: hash } : u))
        saveUsers(next)
        setUsers(next)
        return null
      },
      async adminResetPassword(username, newPwd) {
        const hash = await sha256(newPwd)
        const next = users.map((u) => (u.username === username ? { ...u, passHash: hash } : u))
        saveUsers(next)
        setUsers(next)
      },
      adminDeleteUser(username) {
        if (username === 'admin') return
        const next = users.filter((u) => u.username !== username)
        saveUsers(next)
        setUsers(next)
        /* 清理该用户的业务数据命名空间 */
        try {
          const prefix = `agri:user:${username}:`
          Object.keys(localStorage)
            .filter((k) => k.startsWith(prefix))
            .forEach((k) => localStorage.removeItem(k))
        } catch {
          /* ignore */
        }
      },
    }),
    [session, users],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内')
  return ctx
}

/* ============================== 权限工具 ============================== */

export function usePerm() {
  const { session } = useAuth()
  const role: Role = session?.role ?? 'guest'
  const isAdmin = role === 'admin'
  const isGuest = role === 'guest'
  /** 仅管理员可用；非管理员触发锁定提示 */
  const needAdmin = (): boolean => {
    if (isAdmin) return true
    toast(isGuest ? '游客模式为只读，登录后可操作' : '该功能仅管理员可用', { icon: '🔒' })
    return false
  }
  /** 登录用户（管理员/普通用户）可用；游客触发只读提示 */
  const needLogin = (): boolean => {
    if (!isGuest) return true
    toast('游客模式为只读，请登录后操作', { icon: '🔒' })
    return false
  }
  return { role, isAdmin, isGuest, needAdmin, needLogin }
}

/** 时段问候语 */
export function greeting(): string {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 12) return '上午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, LogOut, KeyRound, PenLine, Users, ShieldCheck, Trash2, RotateCcw, Compass } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth'
import { EASE } from '../components/anim'

const ROLE_META = {
  admin: { label: '管理员', cls: 'bg-[rgba(22,163,74,0.1)] text-[#16a34a]' },
  user: { label: '普通用户', cls: 'bg-[rgba(53,114,184,0.1)] text-[#3572b8]' },
  guest: { label: '游客模式', cls: 'bg-black/[0.07] text-black/45' },
} as const

export default function Profile({ onClose }: { onClose: () => void }) {
  const { session, users, logout, changeNickname, changePassword, adminResetPassword, adminDeleteUser } = useAuth()
  const [nick, setNick] = useState(session?.nickname ?? '')
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const role = session?.role ?? 'guest'
  const meta = ROLE_META[role]

  const saveNick = () => {
    if (!nick.trim()) return toast.error('昵称不能为空')
    changeNickname(nick)
    toast('昵称已更新')
  }

  const savePwd = async () => {
    const err = await changePassword(oldPwd, newPwd)
    if (err) return toast.error(err)
    setOldPwd('')
    setNewPwd('')
    toast('密码已修改，下次登录生效')
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60"
      />
      <motion.div
        initial={{ y: 420 }}
        animate={{ y: 0 }}
        exit={{ y: 420 }}
        transition={{ duration: 0.32, ease: EASE }}
        className="fixed bottom-0 left-1/2 z-50 max-h-[86vh] w-full max-w-[420px] center-x overflow-y-auto rounded-t-[18px] border-t border-black/[0.09] bg-white p-5 pb-10"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#1a2b23]">个人中心</h3>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/[0.07]">
            <X className="h-4 w-4 text-black/55" strokeWidth={1.5} />
          </button>
        </div>

        {/* 身份卡 */}
        <div className="mt-4 flex items-center gap-3 rounded-[14px] border border-black/[0.07] bg-black/[0.03] p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#16a34a] text-[17px] font-bold text-white">
            {(session?.nickname ?? '游').slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-[#1a2b23]">
              {role === 'guest' ? '游客' : session?.nickname}
            </div>
            <div className="mt-0.5 text-[10.5px] text-black/40">
              {role === 'guest' ? '只读预览，登录后可操作' : `账号：${session?.username}`}
            </div>
          </div>
          <span className={`rounded-md px-2 py-1 text-[10.5px] font-semibold ${meta.cls}`}>{meta.label}</span>
        </div>

        {role === 'guest' ? (
          <button
            onClick={logout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[13px] bg-[#16a34a] py-3 text-[14.5px] font-semibold text-white"
          >
            <Compass className="h-4 w-4" strokeWidth={1.8} />
            去登录 / 注册
          </button>
        ) : (
          <>
            {/* 修改昵称 */}
            <div className="mt-5">
              <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-black/55">
                <PenLine className="h-3.5 w-3.5" strokeWidth={1.6} />
                修改昵称
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  className="min-w-0 flex-1 rounded-[10px] border border-black/[0.1] bg-black/[0.03] px-3 py-2.5 text-[13px] text-[#1a2b23] outline-none focus:border-[rgba(22,163,74,0.45)]"
                />
                <button
                  onClick={saveNick}
                  className="shrink-0 rounded-[10px] bg-[#16a34a] px-4 text-[12.5px] font-medium text-white"
                >
                  保存
                </button>
              </div>
            </div>

            {/* 修改密码 */}
            <div className="mt-5">
              <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-black/55">
                <KeyRound className="h-3.5 w-3.5" strokeWidth={1.6} />
                修改密码
              </div>
              <div className="mt-2 space-y-2">
                <input
                  type="password"
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                  placeholder="原密码"
                  className="w-full rounded-[10px] border border-black/[0.1] bg-black/[0.03] px-3 py-2.5 text-[13px] text-[#1a2b23] outline-none placeholder:text-black/30 focus:border-[rgba(22,163,74,0.45)]"
                />
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="新密码（至少 6 位）"
                    className="min-w-0 flex-1 rounded-[10px] border border-black/[0.1] bg-black/[0.03] px-3 py-2.5 text-[13px] text-[#1a2b23] outline-none placeholder:text-black/30 focus:border-[rgba(22,163,74,0.45)]"
                  />
                  <button
                    onClick={() => void savePwd()}
                    className="shrink-0 rounded-[10px] bg-[#16a34a] px-4 text-[12.5px] font-medium text-white"
                  >
                    修改
                  </button>
                </div>
              </div>
            </div>

            {/* 管理员：用户管理 */}
            {role === 'admin' && (
              <div className="mt-5">
                <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-black/55">
                  <Users className="h-3.5 w-3.5" strokeWidth={1.6} />
                  用户管理（本浏览器注册）
                </div>
                <div className="mt-2 space-y-2">
                  {users.filter((u) => u.role === 'user').length === 0 && (
                    <p className="rounded-[10px] bg-black/[0.04] p-3 text-center text-[11px] text-black/40">
                      暂无注册用户
                    </p>
                  )}
                  {users
                    .filter((u) => u.role === 'user')
                    .map((u) => (
                      <div
                        key={u.username}
                        className="flex items-center gap-2.5 rounded-[10px] border border-black/[0.07] bg-black/[0.03] px-3 py-2.5"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3572b8]/15 text-[12px] font-semibold text-[#3572b8]">
                          {u.nickname.slice(0, 1)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12.5px] font-medium text-[#1a2b23]">{u.nickname}</div>
                          <div className="text-[10px] text-black/40">@{u.username}</div>
                        </div>
                        <button
                          onClick={() => {
                            void adminResetPassword(u.username, '123456').then(() =>
                              toast(`已将 ${u.nickname} 的密码重置为 123456`),
                            )
                          }}
                          className="flex shrink-0 items-center gap-1 rounded-lg border border-black/[0.1] px-2 py-1.5 text-[10.5px] font-medium text-black/55"
                        >
                          <RotateCcw className="h-3 w-3" strokeWidth={1.6} />
                          重置密码
                        </button>
                        <button
                          onClick={() => {
                            adminDeleteUser(u.username)
                            toast(`已删除用户 ${u.nickname}`)
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[rgba(220,38,38,0.2)] text-[#dc2626]"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 退出登录 */}
            <button
              onClick={() => {
                logout()
                toast('已退出登录')
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-[13px] border border-[rgba(220,38,38,0.25)] bg-[rgba(220,38,38,0.05)] py-3 text-[14px] font-semibold text-[#dc2626]"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.8} />
              退出登录
            </button>
          </>
        )}

        {role === 'admin' && (
          <p className="mt-4 flex items-center justify-center gap-1 text-[10px] text-black/35">
            <ShieldCheck className="h-3 w-3" strokeWidth={1.6} />
            管理员拥有全部功能权限
          </p>
        )}
      </motion.div>
    </>
  )
}

export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AnimatePresence>{open && <Profile onClose={onClose} />}</AnimatePresence>
}

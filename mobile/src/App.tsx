import { MotionConfig } from 'framer-motion'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth, storageKeyFor } from './auth'
import { StoreProvider, BASE_STORAGE_KEY } from './store'
import Shell from './Shell'
import Login from './screens/Login'
import InteractionMotion from './components/InteractionMotion'

function Gate() {
  const { session } = useAuth()
  if (!session) return <Login />
  /* key 随身份变化强制重挂载 StoreProvider → 各账号数据隔离 */
  return (
    <StoreProvider key={storageKeyFor(session, BASE_STORAGE_KEY)} storageKey={storageKeyFor(session, BASE_STORAGE_KEY)}>
      <Shell />
    </StoreProvider>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <InteractionMotion />
      <AuthProvider>
        <Gate />
        <Toaster position="top-center" toastOptions={{ style: { fontSize: 13 } }} />
      </AuthProvider>
    </MotionConfig>
  )
}

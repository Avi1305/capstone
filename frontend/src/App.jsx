import { useSelector } from 'react-redux'
import { selectSandboxId } from './store/selectors'
import { LandingScreen } from './components/landing/LandingScreen'
import { AppLayout } from './components/layout/AppLayout'

function App() {
  const sandboxId = useSelector(selectSandboxId)

  return sandboxId ? <AppLayout /> : <LandingScreen />
}

export default App

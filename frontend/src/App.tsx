import './App.css'
import AppRouter from './routes/AppRouter'
import { BranchProvider } from './context/BranchContext'

function App() {
  return (
    <BranchProvider>
      <AppRouter />
    </BranchProvider>
  )
}

export default App
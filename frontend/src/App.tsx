import './App.css'
import { Toaster } from 'react-hot-toast'
import AppRouter from './routes/AppRouter'
import { BranchProvider } from './context/BranchContext'

function App() {
  return (
    <BranchProvider>
      <AppRouter />
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </BranchProvider>
  )
}

export default App

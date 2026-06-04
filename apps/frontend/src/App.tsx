
import { Route, Routes } from 'react-router'
import './App.css'
import LoginPage from './pages/login'
import RegisterPage from './pages/register'

function App() {

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  )
}

export default App

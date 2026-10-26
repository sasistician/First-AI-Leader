import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Register from './pages/Register'
import Agentic from './pages/Agentic'

function App() {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/agentic" element={<Agentic />} />
      </Routes>
    </div>
  )
}

export default App

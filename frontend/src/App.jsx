import { Navigate, Route, Routes } from 'react-router-dom'
import { getToken, getUser } from './lib/auth'
import LandingPage from './Pages/LandingPage'
import Login from './Pages/Login'
import Register from './Pages/Register'
import Home from './Dashboard/Home'
import SearchMentor from './Dashboard/SearchMentor'
import Appointments from './Dashboard/Appointments'
import Messages from './Dashboard/Messages'
import Profile from './Dashboard/Profile'
import AI from './AI_Assistent/AI'
import Admin from './Dashboard/Admin'
import DashboardLayout from './components/DashboardLayout'

function Protected() { return getToken() ? <DashboardLayout /> : <Navigate to="/login" replace /> }
function PublicOnly({ children }) { return getToken() ? <Navigate to="/dashboard" replace /> : children }
function AdminOnly() { return getUser()?.role === 'admin' ? <Admin /> : <Navigate to="/dashboard" replace /> }

export default function App() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
    <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
    <Route path="/dashboard" element={<Protected />}>
      <Route index element={<Home />} />
      <Route path="mentors" element={<SearchMentor />} />
      <Route path="appointments" element={<Appointments />} />
      <Route path="messages" element={<Messages />} />
      <Route path="profile" element={<Profile />} />
      <Route path="ai" element={<AI />} />
      <Route path="admin" element={<AdminOnly />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

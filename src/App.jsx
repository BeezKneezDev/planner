import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './store/useAuth'
import { StoreProvider } from './store/useStore'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Income from './pages/Income'
import Bills from './pages/Bills'
import Transactions from './pages/Transactions'
import Assets from './pages/Assets'
import Liabilities from './pages/Liabilities'
import Goals from './pages/Goals'
import CostOfLiving from './pages/CostOfLiving'
import Scenarios from './pages/Scenarios'
import Settings from './pages/Settings'
import Submit from './pages/Submit'
import Login from './pages/Login'
import Signup from './pages/Signup'

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/income" element={<Income />} />
              <Route path="/bills" element={<Bills />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/liabilities" element={<Liabilities />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/cost-of-living" element={<CostOfLiving />} />
              <Route path="/scenarios" element={<Scenarios />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/submit" element={<Submit />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  )
}

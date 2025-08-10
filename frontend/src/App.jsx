import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import AttackScenarios from '@/pages/AttackScenarios'
import DefenseScenarios from '@/pages/DefenseScenarios'
import CustomScenarios from '@/pages/CustomScenarios'
import Visualization from '@/pages/Visualization'
import ExerciseStatus from '@/pages/ExerciseStatus'
import Reports from '@/pages/Reports'
import TeamManagement from '@/pages/TeamManagement'
import Operations from '@/pages/Operations'
import Intro from '@/pages/Intro'

function AppRoutes() {
  const location = useLocation()
  const isIntro = location.pathname.startsWith('/intro')

  return (
    <>
      {}
      <Routes>
        <Route path="/intro" element={<Intro />} />
      </Routes>

      {}
      {!isIntro && (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/attack-scenarios" element={<AttackScenarios />} />
            <Route path="/defense-scenarios" element={<DefenseScenarios />} />
            <Route path="/custom-scenarios" element={<CustomScenarios />} />
            <Route path="/visualization" element={<Visualization />} />
            <Route path="/exercise-status" element={<ExerciseStatus />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/team-management" element={<TeamManagement />} />
            <Route path="/operations" element={<Operations />} />
          </Routes>
        </Layout>
      )}
    </>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="skyguard-ui-theme">
      <Router>
        <AppRoutes />
      </Router>
    </ThemeProvider>
  )
}

export default App


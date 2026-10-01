import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  useParams,
} from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { UnsavedChangesProvider } from './contexts/UnsavedChangesContext'

import LoginPage from './pages/LoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import QuestionBankPage from './pages/QuestionBankPage'
import CreateQuestionPage from './pages/CreateQuestionPage'
import EditQuestionPage from './pages/EditQuestionPage'
import AssessmentsPage from './pages/AssessmentsPage'
import CreateAssessmentPage from './pages/CreateAssessmentPage'
import AssessmentDetailPage from './pages/AssessmentDetailPage'
import ModuleQuestionsPage from './pages/ModuleQuestionsPage'
import AssessmentResultsPage from './pages/AssessmentResultsPage'
import AdminAttemptDetailPage from './pages/AdminAttemptDetailPage'
import TaxonomyPage from './pages/TaxonomyPage'
import LevelsCoursesPage from './pages/LevelsCoursesPage'
import OrganizationSettingsPage from './pages/OrganizationSettingsPage'
import StudentAssessmentPage from './pages/StudentAssessmentPage'
import TakeAssessmentPage from './pages/TakeAssessmentPage'
import ReportPage from './pages/ReportPage'
import { SurveyActionPlanAdminPage } from './pages/SurveyActionPlanAdminPage'
import ReportSettingsPage from './pages/ReportSettingsPage'

function AppProviders() {
  return (
    <AuthProvider>
      <UnsavedChangesProvider>
        <Outlet />
      </UnsavedChangesProvider>
    </AuthProvider>
  )
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AppProviders />}>
          {/* Public student flow */}
          <Route path="/assessment/:assessmentId" element={<StudentAssessmentPage />} />
          <Route path="/take/:attemptId" element={<TakeAssessmentPage />} />
          <Route path="/report/:attemptId" element={<ReportRoute />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected admin studio */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assessments"
            element={
              <ProtectedRoute>
                <AssessmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assessments/new"
            element={
              <ProtectedRoute>
                <CreateAssessmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assessments/:assessmentId"
            element={
              <ProtectedRoute>
                <AssessmentDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assessments/:assessmentId/modules/:moduleId"
            element={
              <ProtectedRoute>
                <ModuleQuestionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assessments/:assessmentId/results"
            element={
              <ProtectedRoute>
                <AssessmentResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attempts/:attemptId"
            element={
              <ProtectedRoute>
                <AdminAttemptDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedRoute>
                <QuestionBankPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions/new"
            element={
              <ProtectedRoute>
                <CreateQuestionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions/:questionId/edit"
            element={
              <ProtectedRoute>
                <EditQuestionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/taxonomy"
            element={
              <ProtectedRoute>
                <TaxonomyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/levels"
            element={
              <ProtectedRoute>
                <LevelsCoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/survey-action-plans"
            element={
              <ProtectedRoute>
                <SurveyActionPlanAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <OrganizationSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/report-settings"
            element={
              <ProtectedRoute>
                <ReportSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assessments/:assessmentId/report-settings"
            element={
              <ProtectedRoute>
                <ReportSettingsPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
    </Route>
  )
)

export function App() {
  return <RouterProvider router={router} />
}

function ReportRoute() {
  const { attemptId } = useParams()
  return attemptId === 'demo' ? (
    <ProtectedRoute>
      <ReportPage />
    </ProtectedRoute>
  ) : (
    <ReportPage />
  )
}

export default App


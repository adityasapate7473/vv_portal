import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from './dashboard/sidebar';
import Login from './login/login';
import Dashboard from './dashboard/dashboard';
import BatchReport from './dashboard/batch_report';
import TrainerForm from './trainer_record_form/trainer_record_form';
import Grades from './dashboard/addgrades';
import StudentRegistration from './dashboard/student_registration';
import BatchStudents from './dashboard/batch_students';
import Register from './login/register';
import Evaluation from './dashboard/evaluation';
import EvaluationResult from './dashboard/evaluation_result';
// import ExcelStudentRegistration from './dashboard/student_excel_registration';
import EmployeeTaskReport from './dashboard/employee_task_report';
import DailyTask from './dashboard/daily_task';
import MorningUpdate from './dashboard/daily_morning_update';
import SearchSkillset from './dashboard/search.skillset';
import PartnerDashboard from './dashboard/partner_home';
import StudentRequest from './dashboard/partner_student_requests';
import ClientRegistration from './dashboard/client_registration';
import ApproveResume from './dashboard/approve_resume';
import ForgetUsername from './login/forgetusername';
import ForgetPassword from './login/forgetpassword';
import ResetPassword from './login/newpassword';
import BatchDetails from './dashboard/batch_details';
import ProtectedRoute from './login/protectedroute';
import OnboardingForm from './hrms/hrms';
import AccessCardForm from './AccessCard/accesscard';
import AccessCardDashboard from './AccessCard/accesscarddashboard';
import Track from './dashboard/addtrack';
import AddInstructor from './dashboard/addinstructor';
import ReportsPage from './dashboard/report';
import AttendancePage from './dashboard/attendance';
import MCQExamCreator from './dashboard/create_exam';
import StudentAttendancePage from './dashboard/studentattendance';
import VerifyOTP from './login/verifyOTP';
import SendMailPage from './dashboard/sendmailpage';
import ProfilePage from './dashboard/edit_profile';
import InternEvaluationResult from './dashboard/InternEvaluationResult';
import AddAdmin from './dashboard/addadmin';
import AddManager from './dashboard/addmanager';
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Retrieve the authentication status from localStorage on component mount
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Define a function to handle login
  const handleLogin = () => {
    setIsAuthenticated(true);
    // Store the authentication status in localStorage
    localStorage.setItem('isAuthenticated', 'true');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };


  useEffect(() => {
    // Check if the user is authenticated on component mount
    if (localStorage.getItem('isAuthenticated') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path='/' element={<Login onLogin={handleLogin} />} />
        <Route path='/register' element={<Register />} />
        <Route path='/client_registration' element={<ClientRegistration />} />
        <Route path='/forget_username' element={<ForgetUsername />} />
        <Route path='/forget_password' element={<ForgetPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path='/onboarding_form' element={<OnboardingForm />} />
        <Route
          path='/*'
          element={
            isAuthenticated ? (
              <div id="app-container" style={{ display: 'flex', alignItems: 'stretch' }}>
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                <div id="page-content-wrapper" style={{ flex: 1, paddingTop: 0, paddingBottom: 0, paddingLeft: isSidebarOpen ? '0px' : '30px' }}>
                  <Routes>
                    <Route path='/dashboard' element={<ProtectedRoute element={Dashboard} isAuthenticated={isAuthenticated} />} />
                    <Route path='/batch_report' element={<ProtectedRoute element={BatchReport} isAuthenticated={isAuthenticated} />} />
                    <Route path='/trainer_record_form' element={<ProtectedRoute element={TrainerForm} isAuthenticated={isAuthenticated} />} />
                    <Route path='/addgrades' element={<ProtectedRoute element={Grades} isAuthenticated={isAuthenticated} />} />
                    <Route path='/attendance' element={<ProtectedRoute element={AttendancePage} isAuthenticated={isAuthenticated} />} />
                    <Route path='/student_registration' element={<ProtectedRoute element={StudentRegistration} isAuthenticated={isAuthenticated} />} />
                    <Route path='/batch_students' element={<ProtectedRoute element={BatchStudents} isAuthenticated={isAuthenticated} />} />
                    <Route path='/evaluation' element={<ProtectedRoute element={Evaluation} isAuthenticated={isAuthenticated} />} />
                    <Route path='/evaluation_result' element={<ProtectedRoute element={EvaluationResult} isAuthenticated={isAuthenticated} />} />
                    <Route path='/daily_task' element={<ProtectedRoute element={DailyTask} isAuthenticated={isAuthenticated} />} />
                    <Route path='/employee_task_report' element={<ProtectedRoute element={EmployeeTaskReport} isAuthenticated={isAuthenticated} />} />
                    <Route path='/daily_status' element={<ProtectedRoute element={MorningUpdate} isAuthenticated={isAuthenticated} />} />
                    <Route path='/search_skillset' element={<ProtectedRoute element={SearchSkillset} isAuthenticated={isAuthenticated} />} />
                    <Route path='/student_request' element={<ProtectedRoute element={StudentRequest} isAuthenticated={isAuthenticated} />} />
                    <Route path='/resume_approval' element={<ProtectedRoute element={ApproveResume} isAuthenticated={isAuthenticated} />} />
                    <Route path='/batch_details/:batchName' element={<ProtectedRoute element={BatchDetails} isAuthenticated={isAuthenticated} />} />
                    <Route path='/access_card_form' element={<ProtectedRoute element={AccessCardForm} isAuthenticated={isAuthenticated} />} />
                    <Route path='/access_card_dashboard' element={<ProtectedRoute element={AccessCardDashboard} isAuthenticated={isAuthenticated} />} />
                    <Route path="/addtrack" element={<ProtectedRoute element={Track} isAuthenticated={isAuthenticated} />} />
                    <Route path="/addinstructor" element={<ProtectedRoute element={AddInstructor} isAuthenticated={isAuthenticated} />} />
                    <Route path="/report" element={<ProtectedRoute element={ReportsPage} isAuthenticated={isAuthenticated} />} />
                    <Route path="/create_exam" element={<ProtectedRoute element={MCQExamCreator} isAuthenticated={isAuthenticated} />} />
                    <Route path="/studentattendance" element={<ProtectedRoute element={StudentAttendancePage} isAuthenticated={isAuthenticated} />} />
                    <Route path="/sendmail" element={<ProtectedRoute element={SendMailPage} isAuthenticated={isAuthenticated} />} />
                    <Route path="/profile" element={<ProtectedRoute element={ProfilePage} isAuthenticated={isAuthenticated} />} />
                    <Route path="/internresults" element={<ProtectedRoute element={InternEvaluationResult} isAuthenticated={isAuthenticated} />} />
                    <Route path="/addadmin" element={<ProtectedRoute element={AddAdmin} isAuthenticated={isAuthenticated} />} />
                    <Route path="/addmanager" element={<ProtectedRoute element={AddManager} isAuthenticated={isAuthenticated} />} />
                  </Routes>
                </div>
              </div>
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

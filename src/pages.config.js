/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminChats from './pages/AdminChats';
import AdminDashboard from './pages/AdminDashboard';
import AdminInstructors from './pages/AdminInstructors';
import AdminLessons from './pages/AdminLessons';
import AdminLogin from './pages/AdminLogin';
import AdminPayments from './pages/AdminPayments';
import AdminSellers from './pages/AdminSellers';
import AdminSettings from './pages/AdminSettings';
import AdminStudents from './pages/AdminStudents';
import Chat from './pages/Chat';
import Home from './pages/Home';
import InstructorProfile from './pages/InstructorProfile';
import InstructorRegister from './pages/InstructorRegister';
import Instructors from './pages/Instructors';
import Landing from './pages/Landing';
import MyLessons from './pages/MyLessons';
import Payment from './pages/Payment';
import Simulados from './pages/Simulados';
import StudentProfile from './pages/StudentProfile';
import StudentRegister from './pages/StudentRegister';
import SuperAdminLogin from './pages/SuperAdminLogin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminChats": AdminChats,
    "AdminDashboard": AdminDashboard,
    "AdminInstructors": AdminInstructors,
    "AdminLessons": AdminLessons,
    "AdminLogin": AdminLogin,
    "AdminPayments": AdminPayments,
    "AdminSellers": AdminSellers,
    "AdminSettings": AdminSettings,
    "AdminStudents": AdminStudents,
    "Chat": Chat,
    "Home": Home,
    "InstructorProfile": InstructorProfile,
    "InstructorRegister": InstructorRegister,
    "Instructors": Instructors,
    "Landing": Landing,
    "MyLessons": MyLessons,
    "Payment": Payment,
    "Simulados": Simulados,
    "StudentProfile": StudentProfile,
    "StudentRegister": StudentRegister,
    "SuperAdminLogin": SuperAdminLogin,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
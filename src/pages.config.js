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
import AdminInstructors from './pages/AdminInstructors';
import AdminLessons from './pages/AdminLessons';
import AdminLogin from './pages/AdminLogin';
import AdminPayouts from './pages/AdminPayouts';
import AdminSellers from './pages/AdminSellers';
import Chat from './pages/Chat';
import InstructorProfile from './pages/InstructorProfile';
import InstructorRegister from './pages/InstructorRegister';
import InstructorRegisterInvite from './pages/InstructorRegisterInvite';
import Instructors from './pages/Instructors';
import Landing from './pages/Landing';
import MyLessons from './pages/MyLessons';
import Payment from './pages/Payment';
import Simulados from './pages/Simulados';
import StudentPayments from './pages/StudentPayments';
import StudentProfile from './pages/StudentProfile';
import StudentRegister from './pages/StudentRegister';
import StudentSellers from './pages/StudentSellers';
import SuperAdminLogin from './pages/SuperAdminLogin';
import Home from './pages/Home';
import InstructorLogin from './pages/InstructorLogin';
import InstructorRegisterNew from './pages/InstructorRegisterNew';
import SellerLogin from './pages/SellerLogin';
import SellerRegister from './pages/SellerRegister';
import AdminSettings from './pages/AdminSettings';
import AdminStudents from './pages/AdminStudents';
import AdminDashboard from './pages/AdminDashboard';
import AdminPayments from './pages/AdminPayments';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminChats": AdminChats,
    "AdminInstructors": AdminInstructors,
    "AdminLessons": AdminLessons,
    "AdminLogin": AdminLogin,
    "AdminPayouts": AdminPayouts,
    "AdminSellers": AdminSellers,
    "Chat": Chat,
    "InstructorProfile": InstructorProfile,
    "InstructorRegister": InstructorRegister,
    "InstructorRegisterInvite": InstructorRegisterInvite,
    "Instructors": Instructors,
    "Landing": Landing,
    "MyLessons": MyLessons,
    "Payment": Payment,
    "Simulados": Simulados,
    "StudentPayments": StudentPayments,
    "StudentProfile": StudentProfile,
    "StudentRegister": StudentRegister,
    "StudentSellers": StudentSellers,
    "SuperAdminLogin": SuperAdminLogin,
    "Home": Home,
    "InstructorLogin": InstructorLogin,
    "InstructorRegisterNew": InstructorRegisterNew,
    "SellerLogin": SellerLogin,
    "SellerRegister": SellerRegister,
    "AdminSettings": AdminSettings,
    "AdminStudents": AdminStudents,
    "AdminDashboard": AdminDashboard,
    "AdminPayments": AdminPayments,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
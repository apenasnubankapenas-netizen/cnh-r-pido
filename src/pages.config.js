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
import Home from './pages/Home';
import StudentRegister from './pages/StudentRegister';
import MyLessons from './pages/MyLessons';
import Instructors from './pages/Instructors';
import Simulados from './pages/Simulados';
import Chat from './pages/Chat';
import StudentProfile from './pages/StudentProfile';
import Payment from './pages/Payment';
import AdminDashboard from './pages/AdminDashboard';
import AdminStudents from './pages/AdminStudents';
import AdminInstructors from './pages/AdminInstructors';
import AdminLessons from './pages/AdminLessons';
import AdminChats from './pages/AdminChats';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "StudentRegister": StudentRegister,
    "MyLessons": MyLessons,
    "Instructors": Instructors,
    "Simulados": Simulados,
    "Chat": Chat,
    "StudentProfile": StudentProfile,
    "Payment": Payment,
    "AdminDashboard": AdminDashboard,
    "AdminStudents": AdminStudents,
    "AdminInstructors": AdminInstructors,
    "AdminLessons": AdminLessons,
    "AdminChats": AdminChats,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
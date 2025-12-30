import Landing from "./pages/Landing";
import Practice from "./pages/Practice";
import Exam from "./pages/Exam";
import ExamResult from "./pages/ExamResult";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import DegreeSelection from "./pages/DegreeSelection";
import QuestionSetSelection from "./pages/QuestionSetSelection";
import Leaderboard from "./pages/Leaderboard";
import Compiler from "./pages/Compiler";
import Documentation from "./pages/Documentation";
import PracticeArena from "./pages/PracticeArena";
import PracticeSolver from "./pages/PracticeSolver";
import SubjectOppeSelection from "./pages/SubjectOppeSelection"; 
import SubjectModeSelection from "./pages/SubjectModeSelection";
import Profile from "./pages/Profile";
import About from "./pages/About"; 
import TermsOfService from "./pages/TermsOfService"; 
import PrivacyPolicy from "./pages/PrivacyPolicy"; 
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Dashboard from "./pages/Dashboard";

// --- ATTENDANCE SYSTEM IMPORTS ---
import VerifyRegistration from "./pages/VerifyRegistration";
import AdminScanner from "./pages/AdminScanner";

export const AppRoutes = [
  { path: "/", component: Landing, name: "Landing Page" },
  { path: "/auth", component: Auth, name: "Authentication" },
  { path: "/dashboard", component: Dashboard, name: "Dashboard" },
  { path: "/about", component: About, name: "About Us" },
  { path: "/terms", component: TermsOfService, name: "Terms of Service" },
  { path: "/privacy", component: PrivacyPolicy, name: "Privacy Policy" },
  
  // --- ATTENDANCE & VERIFICATION ROUTES ---
  // Dynamic event types (formType) for various registration tables: workshop, webinar, meetup, contest, hackathon, normal
  { path: "/verify/:formType/:registrationId", component: VerifyRegistration, name: "Verify Registration" },
  { path: "/AdminScanner", component: AdminScanner, name: "Admin Terminal" },
  
  // --- EVENT ROUTES ---
  { path: "/events", component: Events, name: "Events" },
  { path: "/events/:slug", component: EventDetails, name: "Event Details" },
  
  { path: "/practice", component: Practice, name: "Practice Dashboard" },
  { path: "/exam", component: Exam, name: "Exam Interface" },
  { path: "/exam/result", component: ExamResult, name: "Exam Result" },
  { path: "/degree", component: DegreeSelection, name: "Degree Selection" },
  { path: "/degree/oppe/:subjectId/:subjectName", component: SubjectOppeSelection, name: "Subject OPPE Selection" },
  { path: "/degree/mode/:subjectId/:subjectName/:examType", component: SubjectModeSelection, name: "Subject Mode Selection" },
  { path: "/degree/sets/:subjectId/:subjectName/:examType/:mode", component: QuestionSetSelection, name: "Question Set Selection" },
  { path: "/practice-arena", component: PracticeArena, name: "Practice Arena" },
  { path: "/practice-arena/:slug", component: PracticeSolver, name: "Practice Solver" },
  { path: "/leaderboard", component: Leaderboard, name: "Leaderboard" },
  { path: "/compiler", component: Compiler, name: "Online Compiler" },
  { path: "/docs", component: Documentation, name: "Documentation" },
  { path: "/u/:username", component: Profile, name: "Public Profile" },
  { path: "/profile", component: Profile, name: "User Profile" },
  { path: "*", component: NotFound, name: "Not Found" },
];

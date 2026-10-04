import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Library,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
  ArrowUpRight,
  ListChecks,
  Search,
  CalendarDays,
  Layers,
  Globe,
} from "lucide-react";
import Brand from "../components/common/Brand";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { errorMessage } from "../services/api";
import useDialog from "../hooks/useDialog";
const items = [
  ["/app", Home, "Overview"],
  ["/app/knowledge", Library, "My knowledge"],
  ["/app/agent", MessageSquare, "Study Agent"],
  ["/app/study", ListChecks, "Study Tools"],
  ["/app/review", Layers, "Daily review"],
  ["/app/plans", CalendarDays, "Study plans"],
  ["/app/research", Globe, "Web research"],
  ["/app/search", Search, "Search"],
];
function Navigation({ onNavigate }) {
  return (
    <>
      <div className="nav-caption">YOUR WORKSPACE</div>
      <nav aria-label="Main navigation">
        {items.map(([to, Icon, label]) => (
          <NavLink key={to} to={to} end={to === "/app"} onClick={onNavigate}>
            <Icon size={19} />
            {label}
            {label === "Study Agent" && <span className="nav-ai">AI</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <BookMark />
          <p>
            A little curiosity.
            <br />A lot of possibility.
          </p>
          <span>Your next idea starts here.</span>
        </div>
      </div>
    </>
  );
}
function BookMark() {
  return <ArrowUpRight size={23} />;
}
export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const drawer = useRef(null);
  const { user, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isAgent = location.pathname.startsWith("/app/agent");
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useDialog(drawer, open);
  async function logout() {
    try {
      await signOut();
      navigate("/");
    } catch (e) {
      toast(errorMessage(e));
    }
  }
  return (
    <div className={`app-shell${isAgent ? " agent-shell" : ""}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {!isAgent && <aside className="sidebar" data-lenis-prevent>
        <Brand />
        <Navigation />
      </aside>}
      {!isAgent && <dialog
        className="mobile-drawer"
        data-lenis-prevent
        ref={drawer}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        aria-label="Navigation"
      >
        <div className="drawer-heading">
          <Brand />
          <button
            className="icon-button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <Navigation onNavigate={() => setOpen(false)} />
      </dialog>}
      <div className="app-body">
        {!isAgent && <header className="app-topbar">
          <div className="mobile-brand">
            <button
              className="icon-button"
              aria-label="Open navigation"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
            </button>
            <Brand />
          </div>
          <div className="desktop-breadcrumb">
            Your space to <strong>understand.</strong>
          </div>
          <div className="user-menu">
            <span className="topbar-name">{user.name}</span>
            <NavLink
              className="icon-button topbar-action"
              to="/app/settings"
              aria-label="Settings"
              title="Settings"
            >
              <Settings size={18} />
            </NavLink>
            <NavLink
              className="avatar"
              to="/app/profile"
              aria-label="My profile"
              title="My profile"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" />
              ) : (
                user.name.slice(0, 1).toUpperCase()
              )}
            </NavLink>
            <button
              className="icon-button"
              aria-label="Sign out"
              onClick={logout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>}
        <main
          id="main"
          className={`app-main ${location.pathname.includes("/agent") ? "chat-main" : ""}`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

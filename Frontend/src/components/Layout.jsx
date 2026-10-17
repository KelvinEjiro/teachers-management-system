import { NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, GraduationCap, LayoutDashboard, LogOut, Megaphone, Menu, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/staff', label: 'Staff', icon: Users },
  { to: '/duty', label: 'Duty Roster', icon: CalendarDays },
  { to: '/management', label: 'Assembly Roster', icon: Megaphone },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="drawer lg:drawer-open">
      <input id="nav-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col min-h-screen">
        <div className="navbar bg-base-200 lg:hidden">
          <label htmlFor="nav-drawer" className="btn btn-ghost btn-square" aria-label="Open menu">
            <Menu size={20} />
          </label>
          <span className="font-semibold">Teachers Management</span>
        </div>
        <main className="p-4 md:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <div className="drawer-side z-20">
        <label htmlFor="nav-drawer" aria-label="Close menu" className="drawer-overlay" />
        <aside className="bg-base-200 w-64 min-h-full flex flex-col p-4">
          <div className="flex items-center gap-2 px-2 py-3 text-primary">
            <GraduationCap size={28} />
            <span className="text-lg font-bold leading-tight">Teachers<br />Management</span>
          </div>

          <ul className="menu w-full gap-1 mt-4 flex-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={() => (document.getElementById('nav-drawer').checked = false)}
                  className={({ isActive }) => (isActive ? 'menu-active' : '')}
                >
                  <Icon size={18} /> {label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="border-t border-base-content/10 pt-3">
            <div className="px-2 pb-2">
              <p className="font-medium truncate">{user.name}</p>
              <span className={`badge badge-sm ${isAdmin ? 'badge-primary' : 'badge-ghost'}`}>{user.role}</span>
            </div>
            <button className="btn btn-ghost btn-sm w-full justify-start" onClick={logout}>
              <LogOut size={16} /> Log out
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Upload,
  Lock,
  Award,
  School,
  BookOpen,
  Search,
} from "lucide-react";

const ENROLL_NAV = [
  { to: "/", icon: LayoutDashboard, label: "9th Grade" },
  { to: "/career-institutes", icon: Building2, label: "Career Institutes" },
  { to: "/data", icon: Upload, label: "Data" },
];

const IBC_NAV = [
  { to: "/ibc", icon: Award, label: "Overview" },
  { to: "/ibc/campuses", icon: School, label: "Campuses" },
  { to: "/ibc/programs", icon: BookOpen, label: "Programs" },
  { to: "/ibc/certs", icon: Search, label: "Cert Search" },
];

const FUTURE = [
  { label: "10th Grade" },
  { label: "11th Grade" },
  { label: "12th Grade" },
];

function NavItem({
  to,
  icon: Icon,
  label,
  end,
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar-bg ${
          isActive
            ? "bg-sidebar-active text-white font-semibold"
            : "text-sidebar-text hover:bg-white/10 hover:text-sidebar-bright"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={17} strokeWidth={isActive ? 2 : 1.7} aria-hidden />
          {label}
        </>
      )}
    </NavLink>
  );
}

function NavSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-text/55">
        {title}
      </p>
      <div className="space-y-0.5" role="list">
        {children}
      </div>
    </div>
  );
}

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <nav
        className="w-52 md:w-56 lg:w-60 shrink-0 bg-sidebar-bg flex flex-col overflow-y-auto"
        aria-label="Primary"
      >
        <div className="px-5 pt-6 pb-6">
          <img
            src="/brand/cte-logo-white-stacked.png"
            alt="Dallas ISD Career and Technical Education"
            className="w-full max-w-[180px] h-auto object-contain"
          />
          <p className="mt-4 text-[15px] font-semibold text-sidebar-bright tracking-tight leading-none">
            Data Dashboard
          </p>
          <p className="mt-1.5 text-[11px] text-accent font-medium">2026–27</p>
        </div>

        <div className="flex-1 px-3 space-y-7">
          <NavSection title="Enrollment">
            {ENROLL_NAV.map((item) => (
              <NavItem key={item.to} {...item} end={item.to === "/"} />
            ))}
          </NavSection>

          <NavSection title="IBC / Certs">
            {IBC_NAV.map((item) => (
              <NavItem key={item.to} {...item} end={item.to === "/ibc"} />
            ))}
          </NavSection>

          <div>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-text/40">
              Coming Soon
            </p>
            <div className="space-y-0.5">
              {FUTURE.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-sidebar-text/35"
                  aria-disabled="true"
                >
                  <Lock size={14} strokeWidth={1.6} aria-hidden />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-[10px] text-sidebar-text/55 leading-relaxed">
            Career &amp; Technical Education
            <br />
            Dallas ISD
          </p>
        </div>
      </nav>

      <main
        className="flex-1 min-w-0 overflow-hidden pl-6 pr-6 md:pl-8 md:pr-8 lg:pl-10 lg:pr-12"
        id="main"
      >
        <Outlet />
      </main>
    </div>
  );
}

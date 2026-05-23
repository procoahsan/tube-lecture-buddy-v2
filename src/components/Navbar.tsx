"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "./ThemeProvider";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/interests", label: "Interests" },
    { href: "/clip", label: "Clip Video" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't render the navbar at all until auth is resolved, and hide it for unauthenticated users
  if (status === "loading" || !session?.user) {
    return null;
  }

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand">
        <img src="/logo.png" alt="Tube Lecture Buddy Logo" />
        <span>Tube Lecture Buddy</span>
      </Link>
      <ul className="navbar-links">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={pathname === link.href ? "active" : ""}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* Logged In - User Avatar Dropdown */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            className="user-avatar-btn"
            onClick={() => setShowDropdown(!showDropdown)}
            title={session.user.name || "Account"}
          >
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid var(--accent)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "var(--gradient-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                {(session.user.name || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {showDropdown && (
            <div className="user-dropdown animate-fade-down">
              <div className="user-dropdown-header">
                <strong>{session.user.name}</strong>
                <span>{session.user.email}</span>
              </div>
              <div className="user-dropdown-divider" />
              <button
                className="user-dropdown-item"
                onClick={() => {
                  setShowDropdown(false);
                  signOut({ callbackUrl: "/" });
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

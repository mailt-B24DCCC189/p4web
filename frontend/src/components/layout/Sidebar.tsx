import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Users, ReceiptText, BarChart3 } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: BookOpen, label: "Quản lý sách", path: "/books" },
    { icon: Users, label: "Quản lý thành viên", path: "/members" },
    { icon: ReceiptText, label: "Mượn/Trả sách", path: "/borrows" },
    { icon: BarChart3, label: "Thống kê", path: "/statistics" },
  ];

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Thư Viện PTIT</h2>
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`sidebar-link ${active ? 'active' : ''}`}>
              <Icon size={22} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
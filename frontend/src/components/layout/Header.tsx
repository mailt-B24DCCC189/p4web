
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '@/redux/authSlice'; 
import { RootState } from '@/redux/store';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-user">
        <User size={24} />
        <span>{user?.full_name || user?.username || 'Administrator'}</span>
      </div>
      <button onClick={handleLogout} className="header-logout">
        <LogOut size={20} />
        Đăng xuất
      </button>
    </header>
  );
}
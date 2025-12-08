import React, { useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import './LoginPage.css';
import { loginSuccess } from '@/redux/authSlice';
import { useNavigate, Link } from 'react-router-dom'; // Thêm Link
import { LogIn, User, Lock } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Xóa lỗi cũ
    
    try {
      const res = await axios.post('http://localhost:8080/api/auth/login', { username, password });
      
      if (res.data.token) { 
        dispatch(loginSuccess({
          token: res.data.token,
          user: res.data.user || {
            id: res.data.user?.userId || res.data.user?.user_id || 0,
            username: res.data.user?.username || '',
            full_name: res.data.user?.full_name || res.data.user?.fullName || ''
          }
        }));
        navigate('/dashboard');
      } else {
        setError(res.data.message || 'Lỗi đăng nhập không xác định');
      }
      
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra tên đăng nhập và mật khẩu.');
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>Thư Viện PTIT</h1>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <User size={20} />
            <input 
              type="text" 
              placeholder="Tên đăng nhập" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <Lock size={20} />
            <input 
              type="password" 
              placeholder="Mật khẩu" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="login-btn">
            <LogIn size={20} /> Đăng nhập
          </button>
          
          {}
          <p className="register-prompt">
            Chưa có tài khoản? 
            <Link to="/register" className="register-link">
              Đăng ký ngay
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
};

export default LoginPage;
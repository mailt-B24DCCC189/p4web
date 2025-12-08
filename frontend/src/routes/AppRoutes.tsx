
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import BorrowsPage from '@/pages/Borrows';
import QuanLySachPage from '@/pages/QuanLySachPage';
import RegisterPage from '@/pages/RegisterPage';
import StatisticsPage from '@/pages/StatisticsPage';
import ReadersPage from '@/pages/ReadersPage';
import CurrentBorrowsPage from '@/pages/CurrentBorrowsPage';
import OverdueBorrowsPage from '@/pages/OverdueBorrowsPage';
import PrivateRoute from '@/components/PrivateRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/books" element={<QuanLySachPage />} />
        <Route path="/borrows" element={<BorrowsPage />} />
        <Route path="/borrows/current" element={<CurrentBorrowsPage />} />
        <Route path="/borrows/overdue" element={<OverdueBorrowsPage />} />
        <Route path="/readers" element={<ReadersPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}
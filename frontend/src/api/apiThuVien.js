
import axiosInstance from './axiosInstance'; 

export const apiThuVien = {
  layDanhSachSach: async (trang = 1, tuKhoa = '') => {
    const res = await axiosInstance.get(`/books?page=${trang}&search=${tuKhoa}`);
    return res.data;
  },

  layDanhSachTheLoai: async () => {
    const res = await axiosInstance.get('/categories');
    return res.data;
  },

  themSachMoi: async (data) => {
    const res = await axiosInstance.post('/books', data);
    return res.data;
  },

  capNhatSach: async (id, data) => {
    const res = await axiosInstance.put(`/books/${id}`, data);
    return res.data;
  },

  xoaSach: async (id) => {
    const res = await axiosInstance.delete(`/books/${id}`);
    return res.data;
  },

  getOverview: async () => {
    const res = await axiosInstance.get('/statistics/overview');
    return res.data;
  },

  getRecentActivities: async (limit = 10) => {
    const res = await axiosInstance.get(`/statistics/recent-activities?limit=${limit}`);
    return res.data;
  },

  getMostBorrowedBooks: async (limit = 10) => {
    const res = await axiosInstance.get(`/statistics/most-borrowed-books?limit=${limit}`);
    return res.data;
  },

  getMostBorrowingReaders: async (limit = 10) => {
    const res = await axiosInstance.get(`/statistics/most-borrowing-readers?limit=${limit}`);
    return res.data;
  },

  getBorrowTrends: async (period = 'week') => {
    const res = await axiosInstance.get(`/statistics/borrow-trends?period=${period}`);
    return res.data;
  },

  getStockStatus: async () => {
    const res = await axiosInstance.get('/statistics/stock-status');
    return res.data;
  },

  getOverdueBooks: async () => {
    const res = await axiosInstance.get('/statistics/overdue-books');
    return res.data;
  },

  getCategoryStats: async () => {
    const res = await axiosInstance.get('/statistics/category-stats');
    return res.data;
  },

  getTimeStats: async (year) => {
    const res = await axiosInstance.get(`/statistics/time-stats?year=${year || new Date().getFullYear()}`);
    return res.data;
  },

  getAllReaders: async (page = 1, limit = 10, search = '') => {
    const res = await axiosInstance.get(`/readers?page=${page}&limit=${limit}&search=${search}`);
    return res.data;
  },

  getReaderById: async (id) => {
    const res = await axiosInstance.get(`/readers/${id}`);
    return res.data;
  },

  createReader: async (data) => {
    const res = await axiosInstance.post('/readers', data);
    return res.data;
  },

  updateReader: async (id, data) => {
    const res = await axiosInstance.put(`/readers/${id}`, data);
    return res.data;
  },

  deleteReader: async (id) => {
    const res = await axiosInstance.delete(`/readers/${id}`);
    return res.data;
  },

  getCurrentBorrows: async (page = 1, limit = 10, search = '') => {
    const res = await axiosInstance.get(`/borrows/current?page=${page}&limit=${limit}&search=${search}`);
    return res.data;
  },

  getOverdueBorrows: async (page = 1, limit = 10, search = '') => {
    const res = await axiosInstance.get(`/borrows/overdue?page=${page}&limit=${limit}&search=${search}`);
    return res.data;
  },

  getAllBorrows: async (page = 1, limit = 10, search = '', status = '') => {
    const res = await axiosInstance.get(`/borrows?page=${page}&limit=${limit}&search=${search}&status=${status}`);
    return res.data;
  },

  getBorrowById: async (id) => {
    const res = await axiosInstance.get(`/borrows/${id}`);
    return res.data;
  },

  createBorrow: async (data) => {
    const res = await axiosInstance.post('/borrows', data);
    return res.data;
  },

  updateBorrow: async (id, data) => {
    const res = await axiosInstance.put(`/borrows/${id}`, data);
    return res.data;
  },

  returnBook: async (id) => {
    const res = await axiosInstance.put(`/borrows/${id}/return`);
    return res.data;
  },

  extendBorrow: async (id, days = 7) => {
    const res = await axiosInstance.put(`/borrows/${id}/extend`, { days });
    return res.data;
  },

  deleteBorrow: async (id) => {
    const res = await axiosInstance.delete(`/borrows/${id}`);
    return res.data;
  }
};
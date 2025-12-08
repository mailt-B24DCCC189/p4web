
import axios from 'axios';
import { store } from '../redux/store'; // Import store

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api', // URL gốc của Backend
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
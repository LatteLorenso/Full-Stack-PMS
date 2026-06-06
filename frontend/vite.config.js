import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Адрес твоего бэкенда
        changeOrigin: true,
        secure: false,
      },
      '/uploads': { // Если у тебя есть загрузка файлов
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    }
  }
})
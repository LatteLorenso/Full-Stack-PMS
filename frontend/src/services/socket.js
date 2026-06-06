import { io } from 'socket.io-client';

// Создаем ОДИН экземпляр соединения на все приложение
export const socket = io('http://localhost:5000', {
    autoConnect: true
});
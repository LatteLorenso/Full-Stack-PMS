# Full-Stack Project Management System

## Стек технологий:
  **Frontend**: React 18, React Router v6, Chart.js, FontAwesome, Axios, Context API
  **Backend**: Node.js, Express.js, JWT, bcryptjs, express-validator, WebSocket (используется socket.io)
  **Database**: MySQL (используется драйвер mysql2)
  **Real-time**: WebSocket - Socket.io.
  **Cache**: Redis - хранение кеша для каждого пользака отдельно.
  **Storage**: Локальная файловая система (папка uploads).


### Предварительные требования
Перед запуском убедитесь, что у вас установлены:
 - Node.js (14+)
 - MySQL Server
 - Redis Server
 - Docker **(опционально: если не хотите устанавливать MySQL/Redis локально, их можно запустить через контейнеры)**
 - 

### Порядок запуска
1. Создайте пустую папку для проекта и склонируйте репозиторий командой:
**git clone https://github.com/LatteLorenso/Full-Stack-PMS.git .**
2. cd *название созданной папки* (обычно, как в названии репозитория *Full-Stack-PMS*)
3. **git init** - инициализация папки .git
4. **git pull origin main**

*(Примечание: Если папка уже создана и вы хотите обновить код, используйте **git pull origin main**)*

### 2. Настройка Backend
1. Перейдите в папку сервера: **cd backend**
2. Установите зависимости: **npm install**
3. Создайте файл **.env** и заполните его данными вашей БД и Redis:
   - **DB_HOST**, **DB_USER**, **DB_PASSWORD**, **DB_NAME**
   - **REDIS_URL** (обычно redis://127.0.0.1:6379)
   - **JWT_SECRET**
4. Запустите сервер: **node server.js**

### 3. Настройка Frontend
1. Откройте новый терминал и перейдите в папку клиента: **cd frontend**
2. Установите зависимости: **npm install**
3. Запустите приложение: **npm start**

Приложение будет доступно по адресу: **http://localhost:3000**
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

### 1. Настройка Корня проекта
1. Перейдите в корень проекта **cd Full-Stack-PMS** (обычно, *Full-Stack-PMS*)
2. Установите зависимости: **npm install**
3. Если используете Docker - в корне проекта запустите **npm docker-up** - это создаст контейнеры с MySQL/Redis

### 2. Настройка Backend
1. Перейдите в папку сервера: **cd backend**
2. Установите зависимости: **npm install**
3. Откройте файл **.env** и проверьте корректность данных подключения к вашей БД и Redis:
   - PORT=5000
   - DB_HOST=localhost
   - DB_PORT=3306
   - DB_USER=app_user
   - DB_PASSWORD=app_pass_dev
   - DB_NAME=full_stack_pms_db
   - JWT_SECRET=super_secret_key_change_me
   - JWT_EXPIRES_IN=7d
4. Запустите инициализацию MySQL базы данных: **npm run init-db**
5. Запустите терминал MySQL/Redis: **npm run docker-it**, **npm run redis-it**
6. Запустите сервер: **npm run dev**

### 3. Настройка Frontend
1. Откройте новый терминал и перейдите в папку клиента: **cd frontend**
2. Установите зависимости: **npm install**
3. Запустите приложение: **npm run dev**

Приложение будет доступно по адресу: **http://localhost:5173**
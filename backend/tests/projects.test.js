const request = require('supertest');
let app;
const { getDb } = require('../db/db');

const serverModule = require('../server'); 
app = serverModule.app || serverModule;

// Тестовые данные
const testUser = {
    username: 'test_user_' + Date.now(),
    password: 'password123',
    email: `test_${Date.now()}@example.com`
};

let token;
let createdProjectId;

// 1. РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ ПЕРЕД ТЕСТАМИ
    beforeAll(async () => {
        const db = getDb();
        const bcrypt = require('bcryptjs');
        
        const hashedPassword = await bcrypt.hash(testUser.password, 10);

        try {
            await db.query(
                'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
                [testUser.username, hashedPassword, testUser.email, 'user']
            );
        } catch (e) {
            // Игнорируем, если пользователь уже есть
        }
        
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ username: testUser.username, password: testUser.password });

        if (!loginRes.body.data || !loginRes.body.data.token) {
            throw new Error(`ЛОГИН НЕ УДАЛСЯ! 
            Статус: ${loginRes.statusCode} 
            Ответ сервера: ${JSON.stringify(loginRes.body)}`);
        }

        token = loginRes.body.data.token;
    });

// 2. ТЕСТ НА СОЗДАНИЕ ПРОЕКТА
describe('Project API Tests', () => {
    
    test('POST /api/projects - должен создать новый проект', async () => {
        const newProject = {
            name: 'Тестовый Проект Jest',
            description: 'Описание для автотеста'
        };

        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send(newProject);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe(newProject.name);
        
        createdProjectId = res.body.id;
    });

    // 3. ТЕСТ НА ЗАПРЕТ ДОСТУПА (Без токена)
    test('GET /api/projects - должен вернуть 401 без токена', async () => {
        const res = await request(app).get('/api/projects');
        expect(res.statusCode).toEqual(401);
    });

    // 4. ТЕСТ НА ПОЛУЧЕНИЕ СПИСКА
    test('GET /api/projects - должен вернуть список проектов', async () => {
        const res = await request(app)
            .get('/api/projects')
            .set('Authorization', `Bearer ${token}`);
            
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body.projects)).toBeTruthy();
    });

});

// 5. ОЧИСТКА ПОСЛЕ ТЕСТОВ
afterAll(async () => {
    const db = getDb();
    if (createdProjectId) {
        await db.query('DELETE FROM projects WHERE id = ?', [createdProjectId]);
    }
    await db.query('DELETE FROM users WHERE username = ?', [testUser.username]);

    if (app && app.close) {
        await new Promise(resolve => app.close(resolve));
    }

    await new Promise (r => setTimeout(r, 500));
});
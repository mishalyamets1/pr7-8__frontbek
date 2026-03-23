# Auth + Products example

Небольшой демонстрационный проект: простая регистрация/логин с `bcrypt` и CRUD для
товаров на `express`. Показывает как работать с JWT (access/refresh tokens) и содержит
примеры запросов для быстрого старта.

Требования:
- Node.js 16+ и npm

Запуск:

```bash
npm install
npm start
```

Swagger UI: http://localhost:3000/api-docs

Примеры запросов:

```bash
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"username":"ivan","password":"qwerty123","age":20}'
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"ivan","password":"qwerty123"}'
curl -X POST http://localhost:3000/api/products -H "Content-Type: application/json" -d '{"title":"item","price":100}'

JWT endpoints:

```bash
# Получить access + refresh токены
curl -X POST http://localhost:3000/api/auth/login-tokens -H "Content-Type: application/json" -d '{"username":"ivan","password":"qwerty123"}'

# Использовать access token (пример):
curl -H "Authorization: Bearer <ACCESS_TOKEN>" http://localhost:3000/api/auth/me

# Обновить access token через refresh token
curl -X POST http://localhost:3000/api/auth/refresh -H "Content-Type: application/json" -d '{"refreshToken":"<REFRESH_TOKEN>"}'

# Разлогиниться (отозвать refresh token)
curl -X POST http://localhost:3000/api/auth/logout -H "Content-Type: application/json" -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```
```


require('dotenv').config();

const express = require('express');
const path = require('path');
const { Sequelize } = require('sequelize');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Подключение к PostgreSQL
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false
    }
);

// Подключение JSON
app.use(express.json());

// Подключение статических файлов сайта
app.use(express.static(path.join(__dirname, 'public')));

// Раздача загруженных обложек
app.use(
    '/uploads',
    express.static(path.join(__dirname, 'uploads'))
);

// Подключение маршрутов книг
const booksRouter = require('./routes/books');
app.use('/books', booksRouter);

// Обработчик ошибок должен быть после маршрутов
app.use(errorHandler);

// Проверка работы сервера
app.get('/api', (req, res) => {
    res.send('Books API работает!');
});

// Подключение к базе данных и запуск сервера
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Подключение к PostgreSQL успешно');

        // Создание или обновление таблиц
        await sequelize.sync({ alter: true });
        console.log('Таблицы базы данных синхронизированы');

        app.listen(PORT, () => {
            console.log(`Сервер запущен: http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Ошибка запуска сервера:', error);
    }
}

startServer();

module.exports = { app, sequelize };
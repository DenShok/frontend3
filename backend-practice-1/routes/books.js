const router = require('express').Router();
const Book = require('../models/Book');

const fs = require('fs/promises');
const path = require('path');
const upload = require('../middleware/upload');

// Удаление файла обложки с диска
async function removeFile(fileUrl) {
    if (!fileUrl) return;

    try {
        const filePath = path.join(
            __dirname,
            '..',
            fileUrl.replace(/^\/+/, '')
        );

        await fs.unlink(filePath);
    } catch (e) {
        if (e.code !== 'ENOENT') {
            console.error('Ошибка удаления файла:', e);
        }
    }
}

// GET /books — получить все книги
router.get('/', async (req, res) => {
    try {
        const books = await Book.findAll({
            order: [['id', 'ASC']]
        });

        res.status(200).json(books);
    } catch (e) {
        console.error(e);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
});

// GET /books/:id — получить одну книгу
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id);

        if (!book) {
            return res.status(404).json({
                error: 'Книга не найдена'
            });
        }

        res.status(200).json(book);
    } catch (e) {
        console.error(e);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
});

// POST /books — добавить книгу
router.post('/', async (req, res) => {
    try {
        const { title, author, year } = req.body;

        if (
            typeof title !== 'string' || !title.trim() ||
            typeof author !== 'string' || !author.trim()
        ) {
            return res.status(400).json({
                error: 'Поля title и author обязательны'
            });
        }

        const book = await Book.create({
            title: title.trim(),
            author: author.trim(),
            year
        });

        res.status(201).json(book);
    } catch (e) {
        console.error(e);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
});

// PUT /books/:id — изменить книгу
router.put('/:id', async (req, res) => {
    try {
        const { title, author, year } = req.body;

        if (
            typeof title !== 'string' || !title.trim() ||
            typeof author !== 'string' || !author.trim()
        ) {
            return res.status(400).json({
                error: 'Поля title и author обязательны'
            });
        }

        const book = await Book.findByPk(req.params.id);

        if (!book) {
            return res.status(404).json({
                error: 'Книга не найдена'
            });
        }

        await book.update({
            title: title.trim(),
            author: author.trim(),
            year
        });

        res.status(200).json(book);
    } catch (e) {
        console.error(e);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
});

// POST /books/:id/cover — загрузить обложку книги
router.post('/:id/cover', upload.single('cover'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'Файл не передан (поле cover)'
            });
        }

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            await fs.unlink(req.file.path).catch(() => {});

            return res.status(400).json({
                error: 'id должен быть числом'
            });
        }

        const book = await Book.findByPk(id);

        if (!book) {
            await fs.unlink(req.file.path).catch(() => {});

            return res.status(404).json({
                error: 'Книга не найдена'
            });
        }

        const oldCover = book.coverUrl;
        const newCover = '/uploads/' + req.file.filename;

        await book.update({
            coverUrl: newCover
        });

        if (oldCover) {
            await removeFile(oldCover);
        }

        res.status(200).json(book);

    } catch (e) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => {});
        }

        console.error(e);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
});

// DELETE /books/:id/cover — удалить обложку книги
router.delete('/:id/cover', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: 'id должен быть числом'
            });
        }

        const book = await Book.findByPk(id);

        if (!book) {
            return res.status(404).json({
                error: 'Книга не найдена'
            });
        }

        if (!book.coverUrl) {
            return res.status(404).json({
                error: 'Обложка не найдена'
            });
        }

        const oldCover = book.coverUrl;

        await book.update({
            coverUrl: null
        });

        await removeFile(oldCover);

        res.status(200).json({
            message: 'Обложка удалена',
            book
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
});

// DELETE /books/:id — удалить книгу вместе с обложкой
router.delete('/:id', async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id);

        if (!book) {
            return res.status(404).json({
                error: 'Книга не найдена'
            });
        }

        const coverUrl = book.coverUrl;

        await book.destroy();
        await removeFile(coverUrl);

        res.status(200).json({
            message: 'Книга и её обложка удалены',
            book
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({
            error: 'Ошибка сервера'
        });
    }
});

module.exports = router;
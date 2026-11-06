const multer = require("multer");

module.exports = (err, req, res, next) => {

    if (err instanceof multer.MulterError) {

        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                error: "Файл слишком большой. Максимальный размер — " +
                    (process.env.MAX_FILE_SIZE_MB || 2) + " МБ"
            });
        }

        if (
            err.code === "LIMIT_UNEXPECTED_FILE" ||
            err.code === "LIMIT_FILE_COUNT"
        ) {
            return res.status(400).json({
                error: "Передайте один файл в поле cover"
            });
        }

        return res.status(400).json({
            error: "Ошибка загрузки файла: " + err.message
        });
    }

    if (err.code === "INVALID_FILE_TYPE") {
        return res.status(415).json({
            error: err.message
        });
    }

    console.error(err);

    res.status(500).json({
        error: "Ошибка сервера"
    });
};
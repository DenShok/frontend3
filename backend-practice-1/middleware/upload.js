const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_SIZE =
    (Number(process.env.MAX_FILE_SIZE_MB) || 2) * 1024 * 1024;

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;

        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        return cb(null, true);
    }

    const error = new Error(
        "Допустимы только изображения JPEG, PNG и WebP"
    );

    error.code = "INVALID_FILE_TYPE";
    cb(error);
};

module.exports = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_SIZE,
        files: 1
    }
});
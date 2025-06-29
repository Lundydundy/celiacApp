"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultiple = exports.uploadSingle = exports.uploadReceiptImage = exports.receiptUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
const receiptsDir = path_1.default.join(uploadsDir, 'receipts');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs_1.default.existsSync(receiptsDir)) {
    fs_1.default.mkdirSync(receiptsDir, { recursive: true });
}
// Configure storage for receipt images
const receiptStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, receiptsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with user ID and timestamp
        const userId = req.user?.id || 'anonymous';
        const timestamp = Date.now();
        const randomId = Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `receipt-${userId}-${timestamp}-${randomId}${ext}`);
    }
});
// File filter for receipt images
const receiptFileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic', // iPhone photos
        'image/heif' // iPhone photos
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and HEIC files are allowed.'));
    }
};
// Receipt image upload configuration
exports.receiptUpload = (0, multer_1.default)({
    storage: receiptStorage,
    fileFilter: receiptFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for receipts
        files: 1 // Only one receipt image per upload
    }
});
// Middleware for single receipt image upload
exports.uploadReceiptImage = exports.receiptUpload.single('receiptImage');
// Keep legacy upload for backward compatibility
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        const name = path_1.default.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP files are allowed.'));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Maximum 5 files
    }
});
// Legacy exports
exports.uploadSingle = upload.single('image');
exports.uploadMultiple = upload.array('images', 5);
exports.default = upload;
//# sourceMappingURL=upload.js.map
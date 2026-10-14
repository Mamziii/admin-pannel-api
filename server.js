const jsonServer = require("json-server");
const auth = require("json-server-auth");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

const rules = auth.rewriter(require("./routes.json"));

server.db = router.db;

// پوشه uploads
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// تنظیم Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // حداکثر ۵ مگابایت
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("فقط فایل تصویری مجاز است"));
    }
  },
});

server.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

// سرو کردن فایل‌های آپلودشده
server.use("/uploads", require("express").static(uploadDir));

server.use(middlewares);

// روت آپلود عکس
server.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "فایلی ارسال نشده" });
  }

  const url = `http://localhost:${process.env.PORT || 4000}/uploads/${req.file.filename}`;
  res.json({
    success: true,
    data: { url },
  });
});

server.use(rules);
server.use(auth);
server.use(router);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`JSON Server is running on ${PORT}`);
});
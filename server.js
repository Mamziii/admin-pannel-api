const jsonServer = require("json-server");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("فقط فایل تصویری مجاز است"));
  },
});

server.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://admin-pannel-rose.vercel.app",
      "https://admin-pannel-78j233ifb-me-e15a.vercel.app",
    ],
    credentials: true,
  }),
);

server.use("/uploads", require("express").static(uploadDir));
server.use(middlewares);

server.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "فایلی ارسال نشده" });
  }
  res.json({
    success: true,
    data: { url: `${BASE_URL}/uploads/${req.file.filename}` },
  });
});

server.use(router);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});

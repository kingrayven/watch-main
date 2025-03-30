import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "delivery_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Database connection established successfully");
    connection.release();
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

testConnection();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profiles/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "profile-" + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Create uploads directory if it doesn't exist
import fs from "fs";
const uploadDir = path.join(__dirname, "uploads/profiles");
fs.mkdirSync(uploadDir, { recursive: true });

// Auth routes
app.post(
  "/api/auth/register",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, role } = req.body;

      // Validate required fields
      if (
        !username ||
        !email ||
        !password ||
        !firstName ||
        !lastName ||
        !role
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if profile image was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "Profile image is required" });
      }

      // Check if user already exists
      const [existingUsers] = await pool.query(
        "SELECT * FROM users WHERE username = ? OR email = ?",
        [username, email],
      );

      if (existingUsers.length > 0) {
        return res
          .status(409)
          .json({ message: "Username or email already exists" });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Save profile image path
      const profileImagePath = req.file.path.replace(/\\/g, "/");

      // Insert user into database
      const [result] = await pool.query(
        "INSERT INTO users (username, email, password, first_name, last_name, role, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          username,
          email,
          hashedPassword,
          firstName,
          lastName,
          role,
          profileImagePath,
        ],
      );

      res.status(201).json({
        message: "User registered successfully",
        userId: result.insertId,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" });
    }
  },
);

// Login route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Remove password from user object
    delete user.password;

    res.status(200).json({
      message: "Login successful",
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// User routes
app.get("/api/users", async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, username, email, first_name, last_name, role, profile_image, created_at FROM users",
    );

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error while fetching users" });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.query(
      "SELECT id, username, email, first_name, last_name, role, profile_image, created_at FROM users WHERE id = ?",
      [id],
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(users[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error while fetching user" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import fs from "fs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

// Load environment variables
dotenv.config();

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

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

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 86400000, // 1 day
  path: '/',
  domain: process.env.NODE_ENV === 'development' ? 'localhost' : undefined
};

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads/profiles');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    res.status(401).json({ success: false, message: "Authentication failed" });
  }
};

// ======================
// ANALYTICS ENDPOINTS
// ======================

app.get("/api/analytics/summary", authenticate, async (req, res) => {
  try {
    // Get all metrics in parallel for better performance
    const [
      [orders],
      [revenue],
      [products],
      [deliveries],
      [lastWeek],
      [categories],
      [customers]
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) as totalOrders FROM orders"),
      pool.query("SELECT SUM(total_amount) as totalRevenue FROM orders WHERE status = 'delivered'"),
      pool.query("SELECT COUNT(*) as totalProducts FROM products WHERE is_active = TRUE"),
      pool.query(`
        SELECT COUNT(*) as pendingDeliveries 
        FROM orders 
        WHERE status IN ('pending', 'processing', 'shipped')
      `),
      pool.query(`
        SELECT 
          COUNT(*) as lastWeekOrders,
          SUM(total_amount) as lastWeekRevenue,
          (SELECT COUNT(*) FROM products WHERE created_at BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY) AND DATE_SUB(NOW(), INTERVAL 7 DAY)) as lastWeekProducts
        FROM orders 
        WHERE created_at BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY) AND DATE_SUB(NOW(), INTERVAL 7 DAY)
      `),
      pool.query("SELECT COUNT(*) as totalCategories FROM product_categories"),
      pool.query("SELECT COUNT(*) as totalCustomers FROM users WHERE role = 'customer'")
    ]);

    // Calculate growth percentages
    const orderGrowth = lastWeek[0].lastWeekOrders > 0 
      ? ((orders[0].totalOrders - lastWeek[0].lastWeekOrders) / lastWeek[0].lastWeekOrders * 100).toFixed(1)
      : 0;
    
    const revenueGrowth = lastWeek[0].lastWeekRevenue > 0 
      ? ((revenue[0].totalRevenue - lastWeek[0].lastWeekRevenue) / lastWeek[0].lastWeekRevenue * 100).toFixed(1)
      : 0;

    const productGrowth = lastWeek[0].lastWeekProducts > 0
      ? ((products[0].totalProducts - lastWeek[0].lastWeekProducts) / lastWeek[0].lastWeekProducts * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalOrders: orders[0].totalOrders,
        totalRevenue: revenue[0].totalRevenue || 0,
        totalProducts: products[0].totalProducts,
        pendingDeliveries: deliveries[0].pendingDeliveries,
        totalCategories: categories[0].totalCategories,
        totalCustomers: customers[0].totalCustomers,
        growthMetrics: {
          orders: parseFloat(orderGrowth),
          revenue: parseFloat(revenueGrowth),
          products: parseFloat(productGrowth)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch analytics data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get("/api/analytics/sales", authenticate, async (req, res) => {
  try {
    const { timeframe } = req.query;
    let dateRange = "7 DAY"; // Default to 7 days
    
    if (timeframe === "30days") dateRange = "30 DAY";
    if (timeframe === "90days") dateRange = "90 DAY";
    if (timeframe === "12months") dateRange = "12 MONTH";

    // Get sales data
    const [salesData] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders_count,
        SUM(total_amount) as revenue,
        AVG(total_amount) as average_order_value
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ${dateRange})
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `);

    res.json({
      success: true,
      data: salesData
    });
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch sales data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get("/api/products", authenticate, async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT 
        p.product_id,
        p.name,
        p.description,
        p.price,
        p.stock_quantity,
        p.is_active,
        c.name as category_name,
        c.category_id
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.category_id
      WHERE p.is_active = TRUE
    `);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch products",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get("/api/delivery-services", authenticate, async (req, res) => {
  try {
    const [services] = await pool.query(`
      SELECT 
        service_id,
        name,
        description,
        price,
        estimated_days,
        is_available,
        image_url,
        (SELECT COUNT(*) FROM orders WHERE delivery_service_id = ds.service_id) as order_count
      FROM delivery_services ds
      WHERE is_available = TRUE
    `);

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error("Error fetching delivery services:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch delivery services",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get("/api/orders/recent", authenticate, async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT 
        o.order_id,
        o.order_number,
        o.status,
        o.total_amount,
        o.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        ds.name as delivery_service,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN delivery_services ds ON o.delivery_service_id = ds.service_id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch recent orders",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ======================
// AUTH ENDPOINTS (existing from your code)
// ======================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    const [users] = await pool.query(
      "SELECT user_id, first_name, last_name, email, role, password_hash FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, COOKIE_CONFIG);
    res.json({
      success: true,
      user: {
        userId: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

app.post("/api/auth/register", upload.single("profileImage"), async (req, res) => {
  try {
    const requiredFields = ['username', 'email', 'password', 'firstName', 'lastName', 'role'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required",
        missingFields
      });
    }

    const { username, email, password, firstName, lastName, role } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      const usernameExists = existingUsers.some(user => user.username === username);
      const emailExists = existingUsers.some(user => user.email === email);
      
      return res.status(409).json({ 
        success: false,
        message: usernameExists && emailExists 
          ? "Username and email already exist" 
          : usernameExists 
            ? "Username already exists" 
            : "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profileImagePath = req.file ? path.relative(__dirname, req.file.path).replace(/\\/g, '/') : null;

    const [result] = await pool.query(
      `INSERT INTO users 
      (username, email, password_hash, first_name, last_name, role, profile_image) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, firstName, lastName, role, profileImagePath]
    );

    const token = jwt.sign(
      { 
        userId: result.insertId, 
        firstName, 
        lastName, 
        role,
        email
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, COOKIE_CONFIG);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        userId: result.insertId,
        firstName,
        lastName,
        role,
        profileImage: profileImagePath ? `/uploads/profiles/${path.basename(profileImagePath)}` : null
      }
    });

  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get("/api/auth/me", authenticate, async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT 
        user_id as userId,
        first_name as firstName,
        last_name as lastName,
        email,
        role,
        profile_image as profileImage
       FROM users 
       WHERE user_id = ?`,
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user data" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie('token', COOKIE_CONFIG);
  res.json({ success: true, message: "Logged out successfully" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.code === 'LIMIT_FILE_SIZE' ? 'File too large' : 'File upload error'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'CORS policy violation' });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
});

export default app;
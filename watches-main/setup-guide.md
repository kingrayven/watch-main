# Setup Guide for Delivery Management System

## Prerequisites
- Node.js (v14 or higher)
- MySQL database

## Step 1: Set up the Database

1. Create a MySQL database:
   ```sql
   CREATE DATABASE delivery_management;
   ```

2. Import the database schema:
   ```bash
   mysql -u your_username -p delivery_management < database.sql
   ```

## Step 2: Set up the Backend Server

1. Create a new folder for the server:
   ```bash
   mkdir delivery-server
   cd delivery-server
   ```

2. Copy the `server.jsx` file to this folder

3. Create a package.json file:
   ```bash
   npm init -y
   ```

4. Install the required dependencies:
   ```bash
   npm install express cors multer mysql2 bcrypt dotenv
   npm install --save-dev nodemon
   ```

5. Create a `.env` file with your database credentials:
   ```
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=delivery_management
   PORT=5000
   ```

6. Add the following to your package.json scripts:
   ```json
   "scripts": {
     "start": "node server.jsx",
     "dev": "nodemon server.jsx"
   }
   ```

7. Create the uploads directory:
   ```bash
   mkdir -p uploads/profiles
   ```

8. Start the server:
   ```bash
   npm run dev
   ```

## Step 3: Set up the Frontend

1. In a separate terminal, navigate to your project directory

2. Install dependencies if not already installed:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Access the application at http://localhost:5173 (or the port shown in your terminal)

## Using the Application

1. Register a new admin account at `/signup`
2. Log in with your credentials at `/login`
3. Navigate to the product management section to add watches
4. Use the delivery assignment section to assign delivery services to products
5. Track orders in the order tracking section

## Deployment

### Backend Deployment
1. Set up a server with Node.js installed
2. Set up a MySQL database
3. Copy your server files and install dependencies
4. Use a process manager like PM2 to keep the server running:
   ```bash
   npm install -g pm2
   pm2 start server.jsx
   ```

### Frontend Deployment
1. Build the frontend:
   ```bash
   npm run build
   ```
2. Deploy the contents of the `dist` folder to a static hosting service like Netlify, Vercel, or a traditional web server

### Important Configuration for Deployment
- Update the API URLs in the frontend code to point to your deployed backend
- Set up proper environment variables on your server
- Configure CORS on the backend to allow requests from your frontend domain

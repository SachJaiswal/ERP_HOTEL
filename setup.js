#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up ERP Reservation System...\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Node.js version 18 or higher is required. Current version:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version check passed:', nodeVersion);

// Create .env files if they don't exist
const backendEnvPath = path.join(__dirname, 'backend', '.env');
const frontendEnvPath = path.join(__dirname, 'frontend', '.env.local');

if (!fs.existsSync(backendEnvPath)) {
  console.log('📝 Creating backend .env file...');
  const backendEnvContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/erp_reservations
JWT_SECRET=your_jwt_secret_key_here_${Math.random().toString(36).substring(2, 15)}
NODE_ENV=development`;
  
  fs.writeFileSync(backendEnvPath, backendEnvContent);
  console.log('✅ Backend .env file created');
} else {
  console.log('✅ Backend .env file already exists');
}

if (!fs.existsSync(frontendEnvPath)) {
  console.log('📝 Creating frontend .env.local file...');
  const frontendEnvContent = `NEXT_PUBLIC_API_URL=http://localhost:5000/api`;
  
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  console.log('✅ Frontend .env.local file created');
} else {
  console.log('✅ Frontend .env.local file already exists');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');

try {
  console.log('Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('Installing backend dependencies...');
  execSync('cd backend && npm install', { stdio: 'inherit' });
  
  console.log('Installing frontend dependencies...');
  execSync('cd frontend && npm install', { stdio: 'inherit' });
  
  console.log('✅ All dependencies installed successfully');
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  process.exit(1);
}

// Check if MongoDB is running
console.log('\n🔍 Checking MongoDB connection...');
try {
  execSync('mongosh --eval "db.runCommand({ping: 1})" --quiet', { stdio: 'pipe' });
  console.log('✅ MongoDB is running');
} catch (error) {
  console.log('⚠️  MongoDB is not running or not accessible');
  console.log('   Please make sure MongoDB is installed and running:');
  console.log('   - macOS: brew services start mongodb-community');
  console.log('   - Ubuntu: sudo systemctl start mongod');
  console.log('   - Windows: net start MongoDB');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Make sure MongoDB is running');
console.log('2. Start the development servers:');
console.log('   npm run dev');
console.log('\n🌐 Access the application:');
console.log('   Frontend: http://localhost:3000');
console.log('   Backend API: http://localhost:5000/api');
console.log('\n📚 For more information, see README.md');

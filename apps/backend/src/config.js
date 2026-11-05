import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'flowpilot-dev-secret',
  mongoUri: process.env.MONGO_URI || null,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};

require('dotenv').config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in environment variables');
}

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES: process.env.JWT_EXPIRES || '24h',
  PRINTER_NAME: process.env.PRINTER_NAME || 'EPSON TM-T20III Receipt',
  ENVIRONMENT: process.env.NODE_ENV || 'development'
};


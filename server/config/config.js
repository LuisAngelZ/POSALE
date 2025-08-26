require('dotenv').config();

const { JWT_SECRET, PORT, JWT_EXPIRES, PRINTER_NAME, NODE_ENV } = process.env;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in environment variables');
}

module.exports = {
  PORT: PORT || 3000,
  JWT_SECRET,
  JWT_EXPIRES: JWT_EXPIRES || '24h',
  PRINTER_NAME: PRINTER_NAME || 'EPSON TM-T20III Receipt',
  ENVIRONMENT: NODE_ENV || 'development'
};


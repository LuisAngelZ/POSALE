const app = require('./server/app');
codex/add-logging-utility-with-winston-or-pino
const config = require('./server/config/config');
const logger = require('./server/utils/logger');
main

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 Servidor POS iniciado en http://localhost:${PORT}`);
});


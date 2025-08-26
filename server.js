const app = require('./server/app');
const config = require('./server/config/config');
const logger = require('./server/utils/logger');

const PORT = config.PORT;
app.listen(PORT, () => {
  logger.info(`🚀 Servidor POS iniciado en http://localhost:${PORT}`);
});


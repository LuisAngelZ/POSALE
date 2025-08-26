const app = require('./server/app');
const config = require('./server/config/config');

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Servidor POS iniciado en http://localhost:${PORT}`);
});


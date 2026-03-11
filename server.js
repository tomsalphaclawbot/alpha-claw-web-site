const { createApp } = require('./src/app');

const port = process.env.PORT || 8080;
const app = createApp({ rootDir: __dirname });

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

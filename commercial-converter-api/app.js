const express = require('express');
require('dotenv').config();
const { errors } = require('celebrate');
const cors = require('cors');
const { router } = require('./routes/root');
const { NotFoundError } = require('./utils/errors/not-found-error');
const error = require('./middlewares/error');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const fileUpload = require('express-fileupload');

const {
  PORT = '3000',
} = process.env;

const app = express();

app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5173', 'https://api.mixer0000.nomoredomainsmonster.ru'],
  credentials: true,
  maxAge: 60,
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(requestLogger);

app.use(fileUpload());

app.use('/', router);

app.use('*', (req, res, next) => {
  next(new NotFoundError({ message: 'Страница не найдена' }));
});

app.use(errorLogger);
app.use(errors());
app.use(error);

app.listen(PORT, () => {
  console.log(`Приложение запущено на порте ${PORT}`);
});

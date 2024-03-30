const express = require('express');
require('dotenv').config();
const { errors } = require('celebrate');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { router } = require('./routes/root');
const { NotFoundError } = require('./utils/errors/not-found-error');
const error = require('./middlewares/error');
const { requestLogger, errorLogger } = require('./middlewares/logger');

const {
  PORT = '8000',
} = process.env;

const app = express();

app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5173', 'https://mixer0000.nomoredomainsmonster.ru',
    'http://formatter', 'https://formatter', 'http://formatter/api', 'https://formatter/api', 'http://192.168.97.110'],
  credentials: true,
  maxAge: 60,
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(requestLogger);

app.use(fileUpload());

app.use('/api', router);

app.use('*', (req, res, next) => {
  next(new NotFoundError({ message: 'Страница не найдена' }));
});

app.use(errorLogger);
app.use(errors());
app.use(error);

app.listen(PORT, () => {
  console.log(`Приложение запущено на порте ${PORT}`);
});

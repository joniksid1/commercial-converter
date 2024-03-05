const router = require('express').Router();
const { pdfToXLSX } = require('../controllers/pdf-excel');

router.post('/convert', pdfToXLSX);

module.exports = { router };

module.exports = (err, req, res, next) => {
  const { statusCode = 500, message } = err;
  console.error('Error:', err);

  return res.status(statusCode).json({
    message,
  });
};

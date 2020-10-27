'use strict';

const { verify } = require('jsonwebtoken');
const APIError = require('../errors/APIError');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = verify(token, process.env.JWT_PRIVATE);
    req.userData = decoded;
    return next();
  } catch (err) {
    return res.code(403).send(new APIError({ message: 'Отсутствует доступ', status: 403, details: err }));
  }
};

const ApplicationError = require("./ApplicationError");
class MiddlewareError extends ApplicationError {
  constructor(message, code) {
    super(message || "Произошла ошибка при проверке данных", code || 500);
  }
}
module.exports = MiddlewareError;

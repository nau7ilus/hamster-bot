class ApplicationError extends Error {
  constructor(message, status, code) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.type = this.constructor.name;
    this.message = message || "Что-то пошло не так. Попробуйте чуть позже.";
    this.status = status || 500;
    this.code = code || 20000;
    this.more_info = process.env.WEBSITE_URL + "/docs/errors/" + this.code;
  }
}
module.exports = ApplicationError;

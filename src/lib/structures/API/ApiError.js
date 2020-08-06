class APIError extends Error {
  constructor({ message, status = 500, code = 20000, details = null }) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.error = {
      message: message || "Что-то пошло не так. Попробуйте чуть позже.",
      more_info: process.env.WEBSITE_URL + "/docs/errors/" + code,
      details,
      code,
      status,
    };
  }
}
module.exports = APIError;

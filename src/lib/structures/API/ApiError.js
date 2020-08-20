class APIError extends Error {
  constructor(props = { message: "", status: 500, code: 20000, details: null }) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.error = {
      message: props.message || "Что-то пошло не так. Попробуйте чуть позже.",
      more_info: process.env.WEBSITE_URL + "/docs/errors/" + props.code,
      details: props.details,
      code: props.code,
      status: props.status,
    };
  }
}
module.exports = APIError;

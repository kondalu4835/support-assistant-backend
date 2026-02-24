const rateLimit = require("express-rate-limit");

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests from this IP. Please wait a moment before trying again.",
  },
  keyGenerator: (req) => {
    return req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
  },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please slow down.",
  },
});

module.exports = { chatLimiter, generalLimiter };

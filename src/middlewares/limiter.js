const { rateLimit } = require("express-rate-limit");

const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { 
        error: "Too many requests, please try again later." 
    }
});

const appLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 150,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { 
        error: "Too many requests, please try again later." 
    }
});

module.exports = {
    loginLimiter,
    appLimiter
};
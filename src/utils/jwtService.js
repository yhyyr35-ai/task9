require("dotenv").config();
const jwt = require("jsonwebtoken");

class JWTService {
    sign = (payload) => {
        return jwt.sign(payload, process.env.JWT_SECRET_KEY);
    }

    verify = (token) => {
        return jwt.verify(token, process.env.JWT_SECRET_KEY);
    }
}

module.exports = new JWTService();
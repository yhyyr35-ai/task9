const User = require("../models/User");
const RevokedToken = require("../models/RevokedToken");
const jwtService = require("../utils/jwtService");

const auth = async (req, res, next) => {
    try {
        const { authorization } = req.headers;

        if (!authorization || !authorization.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authorization.split(" ")[1];

        const isRevoked = await RevokedToken.findOne({ token });
        if (isRevoked) {
            return res.status(401).json({ message: "Token has been revoked" });
        }

        const verified = jwtService.verify(token);
        if (!verified || !verified.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await User.findById(verified.id).select("-password -__v");

        if (!user) {
            return res.status(401).json({ message: "User Not Found" });
        }

        if (user.block) {
            return res.status(403).json({ message: "User is blocked", reason: user.blockReason });
        }

        req._user = user;
        req.token = token;

        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized", msg: err.message });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const { authorization } = req.headers;
        if (!authorization || !authorization.startsWith("Bearer ")) return next();

        const token = authorization.split(" ")[1];
        if (!token) return next();

        const isRevoked = await RevokedToken.findOne({ token });
        if (isRevoked) return next();

        const verified = jwtService.verify(token);
        if (!verified || !verified.id) return next();

        const user = await User.findById(verified.id).select("-password -__v");
        if (user && !user.block) {
            req._user = user;
            req.token = token;
        }
        next();
    } catch (_) {
        next();
    }
};

auth.optionalAuth = optionalAuth;
module.exports = auth;
module.exports.optionalAuth = optionalAuth;
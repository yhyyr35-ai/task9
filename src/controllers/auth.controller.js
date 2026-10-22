const User = require("../models/User");
const RevokedToken = require("../models/RevokedToken");
const hashService = require("../utils/hashService");
const jwtService = require("../utils/jwtService");

class AuthController {
    register = async (req, res) => {
        const { name, phone, password } = req.body;

        const hashedPassword = await hashService.hash(password);

        const user = await User.create({
            name,
            phone,
            password: hashedPassword,
            role: "customer"
        });

        const token = jwtService.sign({ id: user._id, role: user.role });

        return res.status(201).json({
            success: true,
            message: "Customer registered successfully",
            data: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role
            },
            token
        });
    };

    login = async (req, res) => {
        const { phone, password } = req.body;

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await hashService.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (user.block) {
            return res.status(403).json({
                message: "User is blocked",
                reason: user.blockReason
            });
        }

        const token = jwtService.sign({ id: user._id, role: user.role });

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            data: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role
            },
            token
        });
    };

    logout = async (req, res) => {
        const token = req.token;

        if (token) {
            await RevokedToken.findOneAndUpdate(
                { token },
                { token, revokedAt: new Date() },
                { upsert: true, returnDocument: "after" }
            );
        }

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    };

    getMe = async (req, res) => {
        return res.status(200).json({
            success: true,
            data: req._user
        });
    };
}

module.exports = new AuthController();

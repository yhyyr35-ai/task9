require("dotenv").config();
const User = require("../models/User");
const connectDBWithoutApp = require("../utils/connectDbWithoutApp");
const hashService = require("../utils/hashService");

const createAdmin = async () => {
    await connectDBWithoutApp();

    const name = process.env.ADMIN_NAME || "صاحب المحل";
    const phone = process.env.ADMIN_PHONE || "0599000000";
    const rawPassword = process.env.ADMIN_PASSWORD || "AdminPassword123!";
    const hashedPassword = await hashService.hash(rawPassword);

    const existingAdmin = await User.findOne({ phone });

    if (existingAdmin) {
        existingAdmin.name = name;
        existingAdmin.password = hashedPassword;
        existingAdmin.role = "admin";
        existingAdmin.block = false;
        await existingAdmin.save();
        return "Updated existing Admin";
    }

    await User.create({
        name,
        phone,
        password: hashedPassword,
        role: "admin",
        block: false
    });

    return "Created Admin";
};

createAdmin()
    .then((msg) => {
        console.log(msg);
        process.exit(0);
    })
    .catch((err) => {
        console.error("Error creating Admin:", err.message);
        process.exit(1);
    });

const bcrypt = require("bcryptjs");

class HashService {
    hash = async (password) => {
        return await bcrypt.hash(password, 12);
    }

    compare = async (password, storedPassword) => {
        try {
            return await bcrypt.compare(password, storedPassword);
        } catch (error) {
            return false;
        }
    }
}

module.exports = new HashService();
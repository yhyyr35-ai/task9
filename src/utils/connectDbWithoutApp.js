const mongoose = require("mongoose");

const MONGODB_URL = process.env.MONGODB_URL;
const PORT = process.env.PORT;

async function connectDBWithoutApp() {
    return mongoose.connect(MONGODB_URL)
        .then(() => {
            console.log("Connected To DB Successfully");
    });
}

module.exports = connectDBWithoutApp
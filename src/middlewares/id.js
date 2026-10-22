const { param } = require("express-validator");
const validation = require("./validation");

const id = [
    param("id").isMongoId().withMessage("Invalid Id"),
    validation
];

module.exports = id;
const errorMiddleware = (err, req, res, next) => {
    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || "Internal Server Error";

    if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid format for field: ${err.path}`;
    }

    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue || {})[0] || "field";
        message = `${field} already exists`;
    }

    return res.status(statusCode).json({ message });
};

module.exports = errorMiddleware;
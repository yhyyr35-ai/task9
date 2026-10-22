require("dotenv").config();
const express = require("express");
const app = express();

const morgan = require("morgan");
const connectDB = require("./utils/connectDB");
const notFoundMiddleware = require("./middlewares/notFound.middkewars");
const errorMiddleware = require("./middlewares/errorMiddleware");

const authRoutes = require("./routes/auth.routes");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const addressRoutes = require("./routes/address.routes");
const adminRoutes = require("./routes/admin.routes");

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

if (require.main === module) {
    connectDB(app);
}

module.exports = app;
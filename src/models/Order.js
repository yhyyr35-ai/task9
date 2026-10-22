const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    size: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: (val) => Array.isArray(val) && val.length > 0,
            message: "Order must contain at least one item"
        }
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    deliveryAddress: {
        type: String,
        required: true,
        trim: true
    },
    addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address"
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Preparing", "Out for Delivery", "Completed", "Rejected"],
        default: "Pending"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Order", orderSchema);

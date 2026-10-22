const Order = require("../models/Order");
const Product = require("../models/Product");
const Address = require("../models/Address");

const validTransitions = {
    "Pending": ["Approved", "Rejected"],
    "Approved": ["Preparing", "Rejected"],
    "Preparing": ["Out for Delivery"],
    "Out for Delivery": ["Completed"],
    "Completed": [],
    "Rejected": []
};

class OrderController {
    createOrder = async (req, res) => {
        const { items, deliveryAddress, addressId } = req.body;

        let finalAddressText = deliveryAddress;

        if (addressId) {
            const savedAddress = await Address.findOne({ _id: addressId, user: req._user._id });
            if (!savedAddress) {
                return res.status(404).json({ message: "Saved address not found" });
            }
            finalAddressText = savedAddress.details;
        }

        if (!finalAddressText || finalAddressText.trim() === "") {
            return res.status(400).json({ message: "Delivery address is required" });
        }

        const orderItems = [];
        let calculatedTotal = 0;

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product || !product.isAvailable) {
                return res.status(400).json({
                    message: `Product ${product ? product.name : item.productId} is currently not available`
                });
            }

            let unitPrice = product.price;

            if (product.quantityOptions && product.quantityOptions.length > 0) {
                const matchedOption = product.quantityOptions.find(
                    (opt) => opt.size.trim().toLowerCase() === item.size.trim().toLowerCase()
                );

                if (!matchedOption) {
                    return res.status(400).json({
                        message: `Invalid size or quantity option '${item.size}' for product ${product.name}`
                    });
                }
                unitPrice = matchedOption.price;
            }

            const subtotal = unitPrice * item.quantity;
            calculatedTotal += subtotal;

            orderItems.push({
                product: product._id,
                productName: product.name,
                size: item.size,
                quantity: item.quantity,
                unitPrice,
                subtotal
            });
        }

        const order = await Order.create({
            user: req._user._id,
            items: orderItems,
            totalPrice: calculatedTotal,
            deliveryAddress: finalAddressText.trim(),
            addressId: addressId || undefined,
            status: "Pending"
        });

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: order
        });
    };

    getMyOrders = async (req, res) => {
        const orders = await Order.find({ user: req._user._id })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    };

    getAllOrders = async (req, res) => {
        const filter = {};

        if (req.query.status) {
            filter.status = req.query.status;
        }

        if (req.query.user) {
            filter.user = req.query.user;
        }

        const orders = await Order.find(filter)
            .populate("user", "name phone")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    };

    getOrderById = async (req, res) => {
        const order = await Order.findById(req.params.id).populate("user", "name phone");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const isStaff = req._user.role === "admin" || req._user.role === "employee";
        const isOwner = order.user._id.toString() === req._user._id.toString();

        if (!isStaff && !isOwner) {
            return res.status(403).json({ message: "Forbidden: Access denied to this order" });
        }

        return res.status(200).json({
            success: true,
            data: order
        });
    };

    updateOrderStatus = async (req, res) => {
        const { status } = req.body;

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const allowedNextStatuses = validTransitions[order.status] || [];

        if (!allowedNextStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status transition from '${order.status}' to '${status}'`
            });
        }

        order.status = status;
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: order
        });
    };
}

module.exports = new OrderController();

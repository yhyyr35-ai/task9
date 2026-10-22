const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Category = require("../models/Category");
const hashService = require("../utils/hashService");

class AdminController {
    createEmployee = async (req, res) => {
        const { name, phone, password } = req.body;

        const hashedPassword = await hashService.hash(password);

        const employee = await User.create({
            name,
            phone,
            password: hashedPassword,
            role: "employee"
        });

        return res.status(201).json({
            success: true,
            message: "Employee created successfully",
            data: {
                id: employee._id,
                name: employee.name,
                phone: employee.phone,
                role: employee.role
            }
        });
    };

    getEmployees = async (req, res) => {
        const employees = await User.find({ role: "employee" })
            .select("-password -__v")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: employees.length,
            data: employees
        });
    };

    updateEmployee = async (req, res) => {
        const employee = await User.findOne({ _id: req.params.id, role: "employee" });

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const { name, phone, password, block } = req.body;

        if (name !== undefined) employee.name = name;
        if (phone !== undefined) employee.phone = phone;
        if (block !== undefined) employee.block = block;
        if (password) {
            employee.password = await hashService.hash(password);
        }

        await employee.save();

        return res.status(200).json({
            success: true,
            message: "Employee updated successfully",
            data: {
                id: employee._id,
                name: employee.name,
                phone: employee.phone,
                role: employee.role,
                block: employee.block
            }
        });
    };

    deleteEmployee = async (req, res) => {
        if (req.params.id === req._user._id.toString()) {
            return res.status(400).json({ message: "Cannot delete your own admin account" });
        }

        const employee = await User.findOneAndDelete({ _id: req.params.id, role: "employee" });

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Employee deleted successfully"
        });
    };

    getUsers = async (req, res) => {
        const filter = {};

        if (req.query.role) {
            filter.role = req.query.role;
        }

        const users = await User.find(filter)
            .select("-password -__v")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    };

    blockUser = async (req, res) => {
        if (req.params.id === req._user._id.toString()) {
            return res.status(400).json({ message: "Cannot block your own admin account" });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { reason } = req.body;

        user.block = true;
        user.blockReason = reason;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "User blocked successfully",
            data: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                block: user.block,
                blockReason: user.blockReason
            }
        });
    };

    unblockUser = async (req, res) => {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.block = false;
        user.blockReason = null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "User unblocked successfully",
            data: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                block: user.block,
                blockReason: user.blockReason
            }
        });
    };

    getStatistics = async (req, res) => {
        const totalOrders = await Order.countDocuments();

        const ordersByStatusRaw = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const orderStatuses = ["Pending", "Approved", "Preparing", "Out for Delivery", "Completed", "Rejected"];
        const ordersByStatus = {};
        for (const st of orderStatuses) {
            ordersByStatus[st] = 0;
        }
        for (const item of ordersByStatusRaw) {
            ordersByStatus[item._id] = item.count;
        }

        const completedSalesAgg = await Order.aggregate([
            { $match: { status: "Completed" } },
            { $group: { _id: null, totalCompletedSales: { $sum: "$totalPrice" } } }
        ]);
        const totalCompletedSalesValue = completedSalesAgg.length > 0 ? completedSalesAgg[0].totalCompletedSales : 0;

        const totalOrdersValueAgg = await Order.aggregate([
            { $group: { _id: null, totalValue: { $sum: "$totalPrice" } } }
        ]);
        const totalOrdersValue = totalOrdersValueAgg.length > 0 ? totalOrdersValueAgg[0].totalValue : 0;

        const totalRegisteredCustomers = await User.countDocuments({ role: "customer" });
        const totalProducts = await Product.countDocuments();
        const totalCategories = await Category.countDocuments();

        const bestSellingProducts = await Order.aggregate([
            { $match: { status: { $ne: "Rejected" } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    productName: { $first: "$items.productName" },
                    totalQuantitySold: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: "$items.subtotal" }
                }
            },
            { $sort: { totalQuantitySold: -1 } },
            { $limit: 5 }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalOrders,
                ordersByStatus,
                totalCompletedSalesValue,
                totalOrdersValue,
                totalRegisteredCustomers,
                totalProducts,
                totalCategories,
                bestSellingProducts
            }
        });
    };
}

module.exports = new AdminController();

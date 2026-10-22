const Category = require("../models/Category");
const Product = require("../models/Product");

class CategoryController {
    createCategory = async (req, res) => {
        const { name, description, isActive } = req.body;

        const category = await Category.create({
            name,
            description,
            isActive: isActive !== undefined ? isActive : true
        });

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category
        });
    };

    getCategories = async (req, res) => {
        const filter = {};

        const isStaff = req._user && (req._user.role === "admin" || req._user.role === "employee");
        if (!isStaff) {
            filter.isActive = true;
        }

        const categories = await Category.find(filter).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    };

    getCategoryById = async (req, res) => {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const isStaff = req._user && (req._user.role === "admin" || req._user.role === "employee");
        if (!isStaff && !category.isActive) {
            return res.status(404).json({ message: "Category not found" });
        }

        return res.status(200).json({
            success: true,
            data: category
        });
    };

    updateCategory = async (req, res) => {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const { name, description, isActive } = req.body;

        if (name !== undefined) category.name = name;
        if (description !== undefined) category.description = description;
        if (isActive !== undefined) category.isActive = isActive;

        await category.save();

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category
        });
    };

    deleteCategory = async (req, res) => {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const productsCount = await Product.countDocuments({ category: req.params.id });
        if (productsCount > 0) {
            return res.status(400).json({
                message: "Cannot delete category that has existing products"
            });
        }

        await Category.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });
    };
}

module.exports = new CategoryController();

const Product = require("../models/Product");
const Category = require("../models/Category");

class ProductController {
    createProduct = async (req, res) => {
        const { name, description, price, category, quantityOptions, isAvailable } = req.body;

        const existingCategory = await Category.findById(category);
        if (!existingCategory) {
            return res.status(404).json({ message: "Category not found" });
        }

        const product = await Product.create({
            name,
            description,
            price,
            category,
            quantityOptions: quantityOptions || [],
            isAvailable: isAvailable !== undefined ? isAvailable : true
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });
    };

    getProducts = async (req, res) => {
        const filter = {};

        const isStaff = req._user && (req._user.role === "admin" || req._user.role === "employee");
        if (!isStaff) {
            filter.isAvailable = true;
        }

        if (req.query.category) {
            filter.category = req.query.category;
        }

        const products = await Product.find(filter)
            .populate("category", "name isActive")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    };

    getProductById = async (req, res) => {
        const product = await Product.findById(req.params.id).populate("category", "name isActive");

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const isStaff = req._user && (req._user.role === "admin" || req._user.role === "employee");
        if (!isStaff && !product.isAvailable) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json({
            success: true,
            data: product
        });
    };

    updateProduct = async (req, res) => {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const { name, description, price, category, quantityOptions, isAvailable } = req.body;

        if (category) {
            const existingCategory = await Category.findById(category);
            if (!existingCategory) {
                return res.status(404).json({ message: "Category not found" });
            }
            product.category = category;
        }

        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (price !== undefined) product.price = price;
        if (quantityOptions !== undefined) product.quantityOptions = quantityOptions;
        if (isAvailable !== undefined) product.isAvailable = isAvailable;

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });
    };

    deleteProduct = async (req, res) => {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        await Product.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    };
}

module.exports = new ProductController();

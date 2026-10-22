const Address = require("../models/Address");

class addressController {
    createAddress = async (req, res) => {
        const { title, details } = req.body;

        const address = await Address.create({
            user: req._user._id,
            title: title || "home",
            details
        });

        return res.status(201).json({
            success: true,
            message: "Address created successfully",
            data: address
        });
    };

    getMyAddresses = async (req, res) => {
        const addresses = await Address.find({ user: req._user._id }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: addresses.length,
            data: addresses
        });
    };

    getAddressById = async (req, res) => {
        const address = await Address.findOne({
            _id: req.params.id,
            user: req._user._id
        });

        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        return res.status(200).json({
            success: true,
            data: address
        });
    };

    updateAddress = async (req, res) => {
        const address = await Address.findOne({
            _id: req.params.id,
            user: req._user._id
        });

        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        const { title, details } = req.body;

        if (title !== undefined) address.title = title;
        if (details !== undefined) address.details = details;

        await address.save();

        return res.status(200).json({
            success: true,
            message: "Address updated successfully",
            data: address
        });
    };

    deleteAddress = async (req, res) => {
        const address = await Address.findOneAndDelete({
            _id: req.params.id,
            user: req._user._id
        });

        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Address deleted successfully"
        });
    };
}

module.exports = new addressController();

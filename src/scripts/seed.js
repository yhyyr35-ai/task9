require("dotenv").config();
const mongoose = require("mongoose");
const connectDBWithoutApp = require("../utils/connectDbWithoutApp");
const hashService = require("../utils/hashService");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Address = require("../models/Address");
const Order = require("../models/Order");
const RevokedToken = require("../models/RevokedToken");

const seed = async () => {
    await connectDBWithoutApp();

    await RevokedToken.deleteMany({});
    await Order.deleteMany({});
    await Address.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});

    const adminPassword = await hashService.hash("Admin123!");
    const employeePassword = await hashService.hash("Employee123!");
    const customerPassword = await hashService.hash("Customer123!");

    const admin = await User.create({
        name: "صاحب المحل",
        phone: "0599000000",
        password: adminPassword,
        role: "admin"
    });

    const employee = await User.create({
        name: "موظف المحل",
        phone: "0599111111",
        password: employeePassword,
        role: "employee"
    });

    const customer1 = await User.create({
        name: "أحمد الزبون",
        phone: "0599222222",
        password: customerPassword,
        role: "customer"
    });

    const customer2 = await User.create({
        name: "سارة الزبونة",
        phone: "0599333333",
        password: customerPassword,
        role: "customer"
    });

    const blockedCustomer = await User.create({
        name: "زبون محظور",
        phone: "0599444444",
        password: customerPassword,
        role: "customer",
        block: true,
        blockReason: "إلغاء متكرر للطلبات دون عذر"
    });

    const catEastern = await Category.create({
        name: "الحلويات الشرقية",
        description: "أشهى أصناف الحلويات الشرقية الشامية والنابلسية",
        isActive: true
    });

    const catWestern = await Category.create({
        name: "الحلويات الغربية",
        description: "تشكيلة من الكيك والتارت الغربي الفاخر",
        isActive: true
    });

    const catPastries = await Category.create({
        name: "المعجنات",
        description: "معجنات وفطائر طازجة يومياً",
        isActive: true
    });

    const catChocolate = await Category.create({
        name: "الشوكولاتة",
        description: "أفخر أنواع الشوكولاتة البلجيكية والسويسرية",
        isActive: true
    });

    const prodKnafeh = await Product.create({
        name: "كنافة نابلسية خشنة",
        description: "كنافة طازجة بالجبن البلدي والسمن العربي الفاخر",
        price: 60,
        category: catEastern._id,
        quantityOptions: [
            { size: "نصف كيلو", price: 35 },
            { size: "كيلو", price: 60 },
            { size: "صينية 2 كيلو", price: 110 }
        ],
        isAvailable: true
    });

    const prodBaklava = await Product.create({
        name: "بقلاوة مشكلة بالفستق الحلبي",
        description: "تشكيلة بقلاوة فاخرة محشوة بالفستق الحلبي الممتاز",
        price: 80,
        category: catEastern._id,
        quantityOptions: [
            { size: "نصف كيلو", price: 45 },
            { size: "كيلو", price: 80 }
        ],
        isAvailable: true
    });

    const prodCheesecake = await Product.create({
        name: "تشيز كيك التوت الأزرق",
        description: "تشيز كيك مخبوز بالفرن مع صوص التوت البري",
        price: 70,
        category: catWestern._id,
        quantityOptions: [
            { size: "قطعة", price: 15 },
            { size: "قالب كامل", price: 70 }
        ],
        isAvailable: true
    });

    const prodTruffles = await Product.create({
        name: "ترافل شوكولاتة داكنة",
        description: "كرات ترافل فاخرة بنكهة الكاكاو البلجيكي",
        price: 90,
        category: catChocolate._id,
        quantityOptions: [
            { size: "علبة نصف كيلو", price: 50 },
            { size: "علبة كيلو", price: 90 }
        ],
        isAvailable: true
    });

    const address1 = await Address.create({
        user: customer1._id,
        title: "المنزل",
        details: "غزة - شارع الرمال - مقابل مفترق فلسطين - عمارة الأمل الطابق الثالث"
    });

    const address2 = await Address.create({
        user: customer1._id,
        title: "العمل",
        details: "غزة - شارع عمر المختار - برج الشروق الطابق الثاني"
    });

    const completedOrder = await Order.create({
        user: customer1._id,
        items: [
            {
                product: prodKnafeh._id,
                productName: prodKnafeh.name,
                size: "كيلو",
                quantity: 2,
                unitPrice: 60,
                subtotal: 120
            },
            {
                product: prodBaklava._id,
                productName: prodBaklava.name,
                size: "نصف كيلو",
                quantity: 1,
                unitPrice: 45,
                subtotal: 45
            }
        ],
        totalPrice: 165,
        deliveryAddress: address1.details,
        addressId: address1._id,
        status: "Completed"
    });

    const pendingOrder = await Order.create({
        user: customer2._id,
        items: [
            {
                product: prodCheesecake._id,
                productName: prodCheesecake.name,
                size: "قالب كامل",
                quantity: 1,
                unitPrice: 70,
                subtotal: 70
            }
        ],
        totalPrice: 70,
        deliveryAddress: "غزة - تل الهوا - بالقرب من المستشفى الأردني",
        status: "Pending"
    });

    console.log("Database seeded successfully");
    console.log(`Admin phone: ${admin.phone} (Password: Admin123!)`);
    console.log(`Employee phone: ${employee.phone} (Password: Employee123!)`);
    console.log(`Customer phone: ${customer1.phone} (Password: Customer123!)`);
    console.log(`Blocked Customer phone: ${blockedCustomer.phone} (Password: Customer123!)`);
};

module.exports = seed;

if (require.main === module) {
    seed()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error("Seeding error:", err);
            process.exit(1);
        });
}

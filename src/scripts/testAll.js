require("dotenv").config();
const http = require("http");
const app = require("../app");
const mongoose = require("mongoose");
const connectDBWithoutApp = require("../utils/connectDbWithoutApp");
const seed = require("./seed");

let server;
let baseUrl;

const request = async (method, path, body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                "Content-Type": "application/json",
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, headers: res.headers, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, body: data });
                }
            });
        });

        req.on("error", (err) => reject(err));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

const assert = (condition, message) => {
    if (!condition) {
        console.error(`FAILED: ${message}`);
        throw new Error(message);
    }
    console.log(`PASSED: ${message}`);
};

const runAllTests = async () => {
    await connectDBWithoutApp();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`Test server running on ${baseUrl}`);

    await seed();

    let adminToken;
    let employeeToken;
    let customerToken;
    let customer2Token;
    let categoryId;
    let productId;
    let addressId;
    let orderId;

    const testCustomerPhone = `0599${Math.floor(100000 + Math.random() * 900000)}`;
    const regRes = await request("POST", "/api/auth/register", {
        name: "خالد الزبون",
        phone: testCustomerPhone,
        password: "CustomerPassword123!"
    });
    assert(regRes.status === 201, "Customer registration returns 201");
    assert(regRes.body.token, "Registration returns persistent JWT token");
    customerToken = regRes.body.token;

    const dupRegRes = await request("POST", "/api/auth/register", {
        name: "خالد المكرر",
        phone: testCustomerPhone,
        password: "CustomerPassword123!"
    });
    assert(dupRegRes.status === 400, "Duplicate phone registration is rejected with 400");

    const adminLoginRes = await request("POST", "/api/auth/login", {
        phone: "0599000000",
        password: "Admin123!"
    });
    assert(adminLoginRes.status === 200, "Admin login succeeds with 200");
    assert(adminLoginRes.body.data.role === "admin", "Admin role matches");
    adminToken = adminLoginRes.body.token;

    const empLoginRes = await request("POST", "/api/auth/login", {
        phone: "0599111111",
        password: "Employee123!"
    });
    assert(empLoginRes.status === 200, "Employee login succeeds with 200");
    assert(empLoginRes.body.data.role === "employee", "Employee role matches");
    employeeToken = empLoginRes.body.token;

    const custLoginRes = await request("POST", "/api/auth/login", {
        phone: "0599222222",
        password: "Customer123!"
    });
    assert(custLoginRes.status === 200, "Customer 2 login succeeds");
    customer2Token = custLoginRes.body.token;

    const badLoginRes = await request("POST", "/api/auth/login", {
        phone: testCustomerPhone,
        password: "WrongPassword"
    });
    assert(badLoginRes.status === 401, "Invalid password login rejected with 401");

    const meRes = await request("GET", "/api/auth/me", null, {
        Authorization: `Bearer ${customerToken}`
    });
    assert(meRes.status === 200, "Authenticated /api/auth/me returns 200");
    assert(meRes.body.data.phone === testCustomerPhone, "Profile matches customer");

    const unauthMe = await request("GET", "/api/auth/me");
    assert(unauthMe.status === 401, "Unauthenticated request returns 401");

    const tempLogin = await request("POST", "/api/auth/login", {
        phone: testCustomerPhone,
        password: "CustomerPassword123!"
    });
    const tempToken = tempLogin.body.token;
    const logoutRes = await request("POST", "/api/auth/logout", null, {
        Authorization: `Bearer ${tempToken}`
    });
    assert(logoutRes.status === 200, "Logout succeeds with 200");

    const postLogoutMe = await request("GET", "/api/auth/me", null, {
        Authorization: `Bearer ${tempToken}`
    });
    assert(postLogoutMe.status === 401, "Revoked token rejected with 401");

    const blockedLoginRes = await request("POST", "/api/auth/login", {
        phone: "0599444444",
        password: "Customer123!"
    });
    assert(blockedLoginRes.status === 403, "Blocked customer login rejected with 403");

    const customerInDb = await mongoose.model("User").findOne({ phone: testCustomerPhone });
    const blockRes = await request("PATCH", `/api/admin/users/${customerInDb._id}/block`, {
        reason: "إساءة استخدام النظام"
    }, {
        Authorization: `Bearer ${adminToken}`
    });
    assert(blockRes.status === 200, "Admin can block customer with reason");
    assert(blockRes.body.data.block === true, "Customer is marked as blocked");
    assert(blockRes.body.data.blockReason === "إساءة استخدام النظام", "Block reason is recorded");

    const blockedCustomerAccess = await request("GET", "/api/auth/me", null, {
        Authorization: `Bearer ${customerToken}`
    });
    assert(blockedCustomerAccess.status === 403, "Blocked customer cannot access protected services");

    const unblockRes = await request("PATCH", `/api/admin/users/${customerInDb._id}/unblock`, null, {
        Authorization: `Bearer ${adminToken}`
    });
    assert(unblockRes.status === 200, "Admin can unblock customer");

    const unblockedCustomerAccess = await request("GET", "/api/auth/me", null, {
        Authorization: `Bearer ${customerToken}`
    });
    assert(unblockedCustomerAccess.status === 200, "Unblocked customer can access protected services again");

    const newEmpPhone = `0599${Math.floor(100000 + Math.random() * 900000)}`;
    const createEmpRes = await request("POST", "/api/admin/employees", {
        name: "موظف تجريبي جديد",
        phone: newEmpPhone,
        password: "EmpPassword123!"
    }, {
        Authorization: `Bearer ${adminToken}`
    });
    assert(createEmpRes.status === 201, "Admin creates employee returns 201");
    const newEmpId = createEmpRes.body.data.id;

    const listEmpRes = await request("GET", "/api/admin/employees", null, {
        Authorization: `Bearer ${adminToken}`
    });
    assert(listEmpRes.status === 200, "Admin lists employees");
    assert(listEmpRes.body.count >= 1, "Employee list has records");

    const updateEmpRes = await request("PUT", `/api/admin/employees/${newEmpId}`, {
        name: "موظف معدل"
    }, {
        Authorization: `Bearer ${adminToken}`
    });
    assert(updateEmpRes.status === 200, "Admin updates employee");
    assert(updateEmpRes.body.data.name === "موظف معدل", "Updated employee name verified");

    const deleteEmpRes = await request("DELETE", `/api/admin/employees/${newEmpId}`, null, {
        Authorization: `Bearer ${adminToken}`
    });
    assert(deleteEmpRes.status === 200, "Admin deletes employee");

    const custAdminForbidden = await request("GET", "/api/admin/users", null, {
        Authorization: `Bearer ${customerToken}`
    });
    assert(custAdminForbidden.status === 403, "Customer access to admin endpoints returns 403 Forbidden");

    const empAdminForbidden = await request("GET", "/api/admin/users", null, {
        Authorization: `Bearer ${employeeToken}`
    });
    assert(empAdminForbidden.status === 403, "Employee access to admin endpoints returns 403 Forbidden");

    const catName = `قسم حلويات تجريبي ${Date.now()}`;
    const createCatRes = await request("POST", "/api/categories", {
        name: catName,
        description: "وصف قسم تجريبي",
        isActive: true
    }, {
        Authorization: `Bearer ${employeeToken}`
    });
    assert(createCatRes.status === 201, "Employee can create category");
    categoryId = createCatRes.body.data._id;

    const custCreateCatForbidden = await request("POST", "/api/categories", {
        name: "قسم غير مسموح للزبون",
        description: "لا يجوز للزبون إنشاء أقسام"
    }, {
        Authorization: `Bearer ${customerToken}`
    });
    assert(custCreateCatForbidden.status === 403, "Customer cannot create category (403)");

    const listCatsRes = await request("GET", "/api/categories");
    assert(listCatsRes.status === 200, "Public/Customer can browse categories");

    const updateCatRes = await request("PUT", `/api/categories/${categoryId}`, {
        description: "وصف محدث للقسم"
    }, {
        Authorization: `Bearer ${employeeToken}`
    });
    assert(updateCatRes.status === 200, "Employee updates category");

    const prodName = `كنافة إضافية ${Date.now()}`;
    const createProdRes = await request("POST", "/api/products", {
        name: prodName,
        description: "كنافة بالسمن البلدي والجبنة الممتازة",
        price: 50,
        category: categoryId,
        quantityOptions: [
            { size: "نصف كيلو", price: 28 },
            { size: "كيلو", price: 50 }
        ],
        isAvailable: true
    }, {
        Authorization: `Bearer ${employeeToken}`
    });
    assert(createProdRes.status === 201, "Employee creates product");
    productId = createProdRes.body.data._id;

    const custCreateProdForbidden = await request("POST", "/api/products", {
        name: "منتج غير مسموح",
        price: 10,
        category: categoryId
    }, {
        Authorization: `Bearer ${customerToken}`
    });
    assert(custCreateProdForbidden.status === 403, "Customer cannot create product (403)");

    const listProdsRes = await request("GET", `/api/products?category=${categoryId}`);
    assert(listProdsRes.status === 200, "Can list products by category");
    assert(listProdsRes.body.data.length >= 1, "Product found in category");

    const delCatWithProdRes = await request("DELETE", `/api/categories/${categoryId}`, null, {
        Authorization: `Bearer ${employeeToken}`
    });
    assert(delCatWithProdRes.status === 400, "Cannot delete category with associated products (referential integrity preserved)");

    const createAddrRes = await request("POST", "/api/addresses", {
        title: "منزل خالد",
        details: "غزة - شارع الجلاء - عمارة الشروق"
    }, {
        Authorization: `Bearer ${customerToken}`
    });
    assert(createAddrRes.status === 201, "Customer creates address");
    addressId = createAddrRes.body.data._id;

    const listAddrRes = await request("GET", "/api/addresses", null, {
        Authorization: `Bearer ${customerToken}`
    });
    assert(listAddrRes.status === 200, "Customer lists own addresses");
    assert(listAddrRes.body.data.length >= 1, "Address present in list");

    const crossCustAddr = await request("GET", `/api/addresses/${addressId}`, null, {
        Authorization: `Bearer ${customer2Token}`
    });
    assert(crossCustAddr.status === 404, "Customer cannot access another customer's private address");

    const updateAddrRes = await request("PUT", `/api/addresses/${addressId}`, {
        details: "غزة - شارع الجلاء - عمارة الشروق الطابق الرابع"
    }, {
        Authorization: `Bearer ${customerToken}`
    });
    assert(updateAddrRes.status === 200, "Customer updates own address");

    const orderRes = await request("POST", "/api/orders", {
        items: [
            {
                productId,
                size: "نصف كيلو",
                quantity: 2
            },
            {
                productId,
                size: "كيلو",
                quantity: 1
            }
        ],
        addressId
    }, {
        Authorization: `Bearer ${customerToken}`
    });
    assert(orderRes.status === 201, "Customer creates order successfully");
    orderId = orderRes.body.data._id;

    assert(orderRes.body.data.totalPrice === 106, "Server correctly calculates order total (2*28 + 1*50 = 106)");
    assert(orderRes.body.data.status === "Pending", "Initial order status is Pending");
    assert(orderRes.body.data.items[0].unitPrice === 28, "Item unit price is accurately snapshotted");

    const myOrdersRes = await request("GET", "/api/orders/my-orders", null, {
        Authorization: `Bearer ${customerToken}`
    });
    assert(myOrdersRes.status === 200, "Customer can view own orders");
    assert(myOrdersRes.body.data.some((o) => o._id === orderId), "Created order is in customer's order list");

    const otherCustOrderRes = await request("GET", `/api/orders/${orderId}`, null, {
        Authorization: `Bearer ${customer2Token}`
    });
    assert(otherCustOrderRes.status === 403, "Other customer cannot view private order details");

    const staffAllOrdersRes = await request("GET", "/api/orders", null, {
        Authorization: `Bearer ${employeeToken}`
    });
    assert(staffAllOrdersRes.status === 200, "Staff can view all orders");

    const illegalJumpRes = await request("PATCH", `/api/orders/${orderId}/status`, {
        status: "Completed"
    }, {
        Authorization: `Bearer ${employeeToken}`
    });
    assert(illegalJumpRes.status === 400, "Illegal direct jump from Pending to Completed is rejected (400)");

    const custStatusForbidden = await request("PATCH", `/api/orders/${orderId}/status`, {
        status: "Approved"
    }, {
        Authorization: `Bearer ${customerToken}`
    });
    assert(custStatusForbidden.status === 403, "Customer cannot update order status (403)");

    const toApproved = await request("PATCH", `/api/orders/${orderId}/status`, {
        status: "Approved"
    }, {
        Authorization: `Bearer ${employeeToken}`
    });
    assert(toApproved.status === 200, "Status transition: Pending -> Approved");

    const toPreparing = await request("PATCH", `/api/orders/${orderId}/status`, {
        status: "Preparing"
    }, {
        Authorization: `Bearer ${employeeToken}`
    });
    assert(toPreparing.status === 200, "Status transition: Approved -> Preparing");

    const toOutForDelivery = await request("PATCH", `/api/orders/${orderId}/status`, {
        status: "Out for Delivery"
    }, {
        Authorization: `Bearer ${employeeToken}`
    });
    assert(toOutForDelivery.status === 200, "Status transition: Preparing -> Out for Delivery");

    const toCompleted = await request("PATCH", `/api/orders/${orderId}/status`, {
        status: "Completed"
    }, {
        Authorization: `Bearer ${employeeToken}`
    });
    assert(toCompleted.status === 200, "Status transition: Out for Delivery -> Completed");

    const afterCompletedRes = await request("PATCH", `/api/orders/${orderId}/status`, {
        status: "Pending"
    }, {
        Authorization: `Bearer ${employeeToken}`
    });
    assert(afterCompletedRes.status === 400, "Completed order cannot transition back to Pending");

    const statsRes = await request("GET", "/api/admin/statistics", null, {
        Authorization: `Bearer ${adminToken}`
    });
    assert(statsRes.status === 200, "Admin can retrieve sales statistics");
    assert(statsRes.body.data.totalOrders >= 1, "Total orders counted");
    assert(statsRes.body.data.ordersByStatus.Completed >= 1, "Completed orders counted");
    assert(statsRes.body.data.totalCompletedSalesValue > 0, "Completed sales value calculated");
    assert(Array.isArray(statsRes.body.data.bestSellingProducts), "Best selling products array returned");

    const empStatsForbidden = await request("GET", "/api/admin/statistics", null, {
        Authorization: `Bearer ${employeeToken}`
    });
    assert(empStatsForbidden.status === 403, "Employee cannot access admin statistics (403)");

    const notFoundRes = await request("GET", "/api/nonexistent-route");
    assert(notFoundRes.status === 404, "Nonexistent route returns 404");

    console.log("\nALL VERIFICATION CHECKS PASSED SUCCESSFULLY!");
};

runAllTests()
    .then(async () => {
        if (server) server.close();
        await mongoose.disconnect();
        process.exit(0);
    })
    .catch(async (err) => {
        console.error("Test execution failed:", err);
        if (server) server.close();
        await mongoose.disconnect();
        process.exit(1);
    });

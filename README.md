# حلويات الحلاج (Al-Hallaj Sweets) — RESTful Backend API

Backend RESTful API for **حلويات الحلاج (Al-Hallaj Sweets)** built using Node.js, Express.js, MongoDB, Mongoose, Morgan, and JWT.

---

## 1. Requirements Analysis

### Problem & Purpose
Al-Hallaj Sweets is a well-known sweets shop experiencing heavy customer foot traffic and crowding. To streamline operations and enable remote ordering without requiring customers to physically visit the store, this backend serves a mobile application where customers can browse categories, products, prices, and quantity options (such as half a kilogram or one kilogram), save multiple delivery addresses, place orders, and track order lifecycles. It also provides a dashboard backend for store employees to manage catalog items and process orders, and for the store owner (Admin) to manage staff, customer statuses, and sales analytics.

### User Roles & Permissions Matrix

| Capability | Customer | Employee | Admin |
| :--- | :---: | :---: | :---: |
| Register with phone & password | Yes | No (Created by Admin) | Initial setup / seed |
| Persistent login & logout | Yes | Yes | Yes |
| Browse active categories & products | Yes | Yes | Yes |
| Manage categories (CRUD) | No | Yes | Yes |
| Manage products (CRUD, sizes, prices) | No | Yes | Yes |
| Manage saved delivery addresses | Yes (Own only) | No | No |
| Create orders | Yes | No | No |
| View orders & order details | Yes (Own only) | Yes (All) | Yes (All) |
| Update order lifecycle status | No | Yes | Yes |
| Create & manage employees | No | No | Yes |
| Block & unblock customers with reason | No | No | Yes |
| View sales metrics & statistics | No | No | Yes |

### Non-Functional Requirements
- **Security**: Passwords hashed with bcrypt (`bcryptjs`).
- **Persistent Session & Token Invalidation**: Stateless JWT with no forced time expiration, coupled with a server-side `RevokedToken` store on logout and immediate account-blocking checks in authentication middleware.
- **Data Integrity**: Referential checks prevent deleting categories with active products. Order items snapshot product names, unit prices, and selected sizes at purchase time to protect historical accounting against future price alterations.
- **Server Authority**: Order totals and unit prices are strictly resolved and calculated on the server. Client-provided prices or totals are disregarded.

---

## 2. Database Design & Relationships

### Entities & Schemas

#### 1. User (`src/models/User.js`)
- `name`: `String` (Required, trimmed)
- `phone`: `String` (Required, unique, trimmed, primary login credential)
- `password`: `String` (Required, bcrypt hash)
- `role`: `String` (Enum: `["admin", "employee", "customer"]`, default: `"customer"`)
- `block`: `Boolean` (Default: `false`)
- `blockReason`: `String` (Default: `null`)
- `timestamps`: `true`

#### 2. Category (`src/models/Category.js`)
- `name`: `String` (Required, unique, trimmed)
- `description`: `String` (Optional, default: `""`)
- `isActive`: `Boolean` (Default: `true`)
- `timestamps`: `true`

#### 3. Product (`src/models/Product.js`)
- `name`: `String` (Required, trimmed)
- `description`: `String` (Optional, default: `""`)
- `price`: `Number` (Required, min: 0, base price)
- `category`: `ObjectId` (Ref: `Category`, required)
- `quantityOptions`: `Array` of `{ size: String, price: Number }` (e.g., `[{"size": "نصف كيلو", "price": 35}, {"size": "كيلو", "price": 60}]`)
- `isAvailable`: `Boolean` (Default: `true`)
- `timestamps`: `true`

#### 4. Address (`src/models/Address.js`)
- `user`: `ObjectId` (Ref: `User`, required, indexed)
- `title`: `String` (Default: `"المنزل"`)
- `details`: `String` (Required, trimmed)
- `timestamps`: `true`

#### 5. Order (`src/models/Order.js`)
- `user`: `ObjectId` (Ref: `User`, required, indexed)
- `items`: `Array` of:
  - `product`: `ObjectId` (Ref: `Product`, required)
  - `productName`: `String` (Required snapshot)
  - `size`: `String` (Required snapshot)
  - `quantity`: `Number` (Required, min: 1)
  - `unitPrice`: `Number` (Required snapshot)
  - `subtotal`: `Number` (Required snapshot)
- `totalPrice`: `Number` (Required, min: 0, server calculated)
- `deliveryAddress`: `String` (Required snapshot text)
- `addressId`: `ObjectId` (Ref: `Address`, optional)
- `status`: `String` (Enum: `["Pending", "Approved", "Preparing", "Out for Delivery", "Completed", "Rejected"]`, default: `"Pending"`)
- `timestamps`: `true`

#### 6. RevokedToken (`src/models/RevokedToken.js`)
- `token`: `String` (Required, unique, indexed)
- `revokedAt`: `Date` (Default: `Date.now`)

---

## 3. Order Lifecycle State Machine

```
Pending
 ├──> Approved ──> Preparing ──> Out for Delivery ──> Completed (Final)
 └──> Rejected (Final)
```

- Invalid jumps (e.g., `Pending` directly to `Completed`) are rejected with `400 Bad Request`.
- Status changes can only be performed by authorized employees or administrators.

---

## 4. API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new customer (`name`, `phone`, `password`).
- `POST /api/auth/login`: Authenticate customer, employee, or admin (`phone`, `password`).
- `POST /api/auth/logout`: Invalidate active JWT token.
- `GET /api/auth/me`: Retrieve authenticated user profile.

### Categories (`/api/categories`)
- `GET /api/categories`: List categories (public receives active only; staff receives all).
- `GET /api/categories/:id`: Get category details.
- `POST /api/categories`: Create category (Admin/Employee).
- `PUT /api/categories/:id`: Update category (Admin/Employee).
- `DELETE /api/categories/:id`: Delete category (Admin/Employee; prevented if products exist).

### Products (`/api/products`)
- `GET /api/products`: List products with optional category query filter `?category=<id>` (public receives available only; staff receives all).
- `GET /api/products/:id`: Get product details.
- `POST /api/products`: Create product with quantity/size options (Admin/Employee).
- `PUT /api/products/:id`: Update product (Admin/Employee).
- `DELETE /api/products/:id`: Delete product (Admin/Employee).

### Saved Addresses (`/api/addresses`)
- `POST /api/addresses`: Add saved delivery address (Customer).
- `GET /api/addresses`: List customer's saved addresses (Customer).
- `GET /api/addresses/:id`: Get single saved address (Customer, ownership enforced).
- `PUT /api/addresses/:id`: Update saved address (Customer, ownership enforced).
- `DELETE /api/addresses/:id`: Delete saved address (Customer, ownership enforced).

### Orders (`/api/orders`)
- `POST /api/orders`: Place order with items and address (Customer, server pricing & snapshotting).
- `GET /api/orders/my-orders`: View own orders (Customer).
- `GET /api/orders`: View all store orders (Admin/Employee).
- `GET /api/orders/:id`: View order details (Customer if owner; Admin/Employee).
- `PATCH /api/orders/:id/status`: Transition order status according to lifecycle rules (Admin/Employee).

### Admin Management (`/api/admin`)
- `POST /api/admin/employees`: Create new employee account.
- `GET /api/admin/employees`: List store employees.
- `PUT /api/admin/employees/:id`: Update employee details or password.
- `DELETE /api/admin/employees/:id`: Delete employee account.
- `GET /api/admin/users`: List registered users with optional `?role=` filter.
- `PATCH /api/admin/users/:id/block`: Block customer with recorded reason.
- `PATCH /api/admin/users/:id/unblock`: Unblock customer.
- `GET /api/admin/statistics`: Retrieve sales metrics, orders by status, completed sales revenue, best-selling products.

---

## 5. Installation, Configuration & Execution

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on port 27017 or remote MongoDB URI

### Step 1: Clone and Install Dependencies
```bash
npm install
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env` and adjust if needed:
```bash
cp .env.example .env
```

Default configuration in `.env`:
```env
PORT=4000
MONGODB_URL="mongodb://localhost:27017/task9"
JWT_SECRET_KEY="al_hallaj_sweets_jwt_secret_key_2026"
```

### Step 3: Seed Demo Data
Populate the database with preconfigured Admin, Employee, Customers, Categories, Products with size options, Addresses, and Sample Orders:
```bash
npm run seed
```

Default credentials created by seed:
- **Admin**: Phone `0599000000` | Password `Admin123!`
- **Employee**: Phone `0599111111` | Password `Employee123!`
- **Customer**: Phone `0599222222` | Password `Customer123!`
- **Blocked Customer**: Phone `0599444444` | Password `Customer123!`

### Step 4: Run the Server
For development with nodemon:
```bash
npm run watch
```
For production:
```bash
npm start
```
The server will be reachable at `http://localhost:4000`.

### Step 5: Run Automated Tests
Execute the verification suite covering all assignment criteria:
```bash
npm test
```

---

## 6. Testing with Postman
Import the included `postman_collection.json` into Postman. Set the collection variable `baseUrl` to `http://localhost:4000/api`. After logging in via the Login request, copy the returned `token` into the collection variable `token` to authenticate protected requests.

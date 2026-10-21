
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Development: allow requests from Live Server.
// For production, restrict this to your deployed frontend origin.
const allowedOrigins = new Set([
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]);

app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.has(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.use(express.json({ limit: "20kb" }));

// Serve frontend from the public folder when using port 3000.
app.use(express.static(path.join(__dirname, "public")));

const products = [
    {
        id: 1,
        name: "Wireless Headphones",
        price: 1499,
        category: "Electronics",
        emoji: "🎧",
        description: "High-quality wireless headphones for music and study."
    },
    {
        id: 2,
        name: "Smart Watch",
        price: 2199,
        category: "Electronics",
        emoji: "⌚",
        description: "A stylish smartwatch for everyday use."
    },
    {
        id: 3,
        name: "Backpack",
        price: 999,
        category: "Accessories",
        emoji: "🎒",
        description: "A spacious backpack for college and travel."
    },
    {
        id: 4,
        name: "Running Shoes",
        price: 1799,
        category: "Fashion",
        emoji: "👟",
        description: "Comfortable shoes for walking and running."
    },
    {
        id: 5,
        name: "Coffee Mug",
        price: 349,
        category: "Home",
        emoji: "☕",
        description: "A ceramic mug for your favourite drink."
    },
    {
        id: 6,
        name: "Study Lamp",
        price: 799,
        category: "Home",
        emoji: "💡",
        description: "A desk lamp for your study table."
    }
];

const ordersFile = path.join(__dirname, "orders.json");

function readOrders() {
    if (!fs.existsSync(ordersFile)) {
        fs.writeFileSync(ordersFile, "[]", "utf8");
    }

    const data = fs.readFileSync(ordersFile, "utf8");
    const orders = JSON.parse(data);

    if (!Array.isArray(orders)) {
        throw new Error("Invalid orders.json format.");
    }

    return orders;
}

app.get("/api/products", (req, res) => {
    res.json(products);
});

app.get("/api/products/:id", (req, res) => {
    const product = products.find(
        item => item.id === Number(req.params.id)
    );

    if (!product) {
        return res.status(404).json({
            message: "Product not found."
        });
    }

    res.json(product);
});

app.post("/api/orders", (req, res) => {
    const { name, email, address, items } = req.body || {};

    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof address !== "string" ||
        !name.trim() ||
        !email.trim() ||
        !address.trim() ||
        name.trim().length > 100 ||
        email.trim().length > 150 ||
        address.trim().length > 500 ||
        !Array.isArray(items) ||
        items.length === 0 ||
        items.length > products.length
    ) {
        return res.status(400).json({
            message: "Please enter valid details and add products."
        });
    }

    // Basic email-format validation for this demo project.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({
            message: "Please enter a valid email address."
        });
    }

    const orderItems = [];
    const seenProductIds = new Set();

    for (const item of items) {
        const productId = Number(item?.productId);
        const quantity = Number(item?.quantity);

        const product = products.find(
            p => p.id === productId
        );

        if (
            !product ||
            seenProductIds.has(productId) ||
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > 20
        ) {
            return res.status(400).json({
                message: "Invalid product or quantity."
            });
        }

        seenProductIds.add(productId);

        orderItems.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity
        });
    }

    // Always calculate prices on the server.
    const total = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const order = {
        id: "ORD" + Date.now(),
        name: name.trim(),
        email: email.trim(),
        address: address.trim(),
        items: orderItems,
        total,
        status: "Order Placed",
        date: new Date().toISOString()
    };

    try {
        const orders = readOrders();
        orders.push(order);

        fs.writeFileSync(
            ordersFile,
            JSON.stringify(orders, null, 2),
            "utf8"
        );

        return res.status(201).json({
            message: "Order placed successfully!",
            orderId: order.id,
            total: order.total
        });
    } catch (error) {
        console.error("Order save failed:", error.message);

        return res.status(500).json({
            message: "Unable to save the order. Please try again."
        });
    }
});

app.listen(PORT, () => {
    console.log(`ShopEase running at http://localhost:${PORT}`);
});

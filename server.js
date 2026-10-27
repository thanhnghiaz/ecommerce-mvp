const orderRoutes = require("./src/routes/orders");
const productRoutes = require("./src/routes/products");
require("dotenv").config();

const express = require("express");
const authRoutes = require("./src/routes/auth");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

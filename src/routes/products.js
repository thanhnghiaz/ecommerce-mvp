
const express = require("express");
const { prisma } = require("../config/prisma");

const router = express.Router();

// GET /api/products
router.get("/", async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { id: "asc" },
        });

        return res.json({ products });
    } catch (error) {
        console.error("Get products error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid product ID",
            });
        }

        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        return res.json({ product });
    } catch (error) {
        console.error("Get product error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

module.exports = router;

const express = require("express");
const { authenticateToken } = require("../middleware/auth");

const {
    createOrder,
    getOrders,
    getOrderById,
} = require("../controllers/orderController");

const router = express.Router();

router.post("/", authenticateToken, createOrder);
router.get("/", authenticateToken, getOrders);
router.get("/:id", authenticateToken, getOrderById);

module.exports = router;
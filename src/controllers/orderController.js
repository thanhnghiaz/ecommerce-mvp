
const { prisma } = require("../config/prisma");

async function createOrder(req, res) {
    try {
        const userId = Number(req.user.userId);
        const { items, address } = req.body;

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({ message: "Invalid user" });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Order items are required",
            });
        }

        if (typeof address !== "string" || !address.trim()) {
            return res.status(400).json({
                message: "Shipping address is required",
            });
        }

        // Validate items and combine duplicate product IDs.
        const quantities = new Map();

        for (const item of items) {
            const productId = Number(item.productId);
            const quantity = Number(item.quantity);

            if (
                !Number.isInteger(productId) ||
                productId <= 0 ||
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {
                return res.status(400).json({
                    message: "Each item needs a valid productId and positive quantity",
                });
            }

            quantities.set(
                productId,
                (quantities.get(productId) || 0) + quantity
            );
        }

        const order = await prisma.$transaction(async (tx) => {
            const details = [];
            let total = 0;

            for (const [productId, quantity] of quantities) {
                // Atomically decrement stock only when enough stock remains.
                const updated = await tx.product.updateMany({
                    where: {
                        id: productId,
                        quantity: { gte: quantity },
                    },
                    data: {
                        quantity: { decrement: quantity },
                    },
                });

                if (updated.count === 0) {
                    const product = await tx.product.findUnique({
                        where: { id: productId },
                    });

                    const error = new Error(
                        product
                            ? `Insufficient stock for product ${product.name}`
                            : `Product ${productId} not found`
                    );
                    error.status = product ? 400 : 404;
                    throw error;
                }

                const product = await tx.product.findUnique({
                    where: { id: productId },
                });

                // Price is stored in OrderDetail so the order retains its price.
                const unitPrice = Number(product.price);
                total += unitPrice * quantity;

                details.push({
                    productId,
                    quantity,
                    unitPrice,
                });
            }

            const createdOrder = await tx.order.create({
                data: {
                    userId,
                    total,
                    status: "pending",
                    details: {
                        create: details,
                    },
                    shipment: {
                        create: {
                            address: address.trim(),
                            status: "pending",
                        },
                    },
                },
                include: {
                    details: true,
                    shipment: true,
                },
            });

            return createdOrder;
        });

        return res.status(201).json({
            message: "Order created successfully",
            order,
        });
    } catch (error) {
        console.error("Create order error:", error);

        return res.status(error.status || 500).json({
            message:
                error.status && error.status < 500
                    ? error.message
                    : "Internal server error",
        });
    }
}

async function getOrders(req, res) {
    try {
        const userId = Number(req.user.userId);

        const orders = await prisma.order.findMany({
            where: { userId },
            include: {
                details: {
                    include: {
                        product: true,
                    },
                },
                shipment: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({ orders });
    } catch (error) {
        console.error("Get orders error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

async function getOrderById(req, res) {
    try {
        const userId = Number(req.user.userId);
        const orderId = Number(req.params.id);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: "Invalid order ID",
            });
        }

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId,
            },
            include: {
                details: {
                    include: {
                        product: true,
                    },
                },
                shipment: true,
            },
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        return res.status(200).json({ order });
    } catch (error) {
        console.error("Get order detail error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
};

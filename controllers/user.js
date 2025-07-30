const prisma = require("../config/prisma");

exports.listUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                enabled: true,
                address: true,
                updatedAt: true,
            }
        });
        res.json(users);
    } catch (error) {
        console.log(err);
        res.status(500).json({ message: "Server Error"});
    }
}
   

exports.changeStatus = async (req, res) => {
    try {
        const { id, enabled } = req.body;
        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { enabled: enabled }
        });
        res.send("Updated status successfully");
    } catch (error) {
        console.log(err);
        res.status(500).json({ message: "Server Error"});
    }
}

exports.changeRole = async (req, res) => {
    try {
        const { id, role } = req.body;
        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { role: role }
        });
        res.send("Updated Role successfully");
    } catch (error) {
        console.log(err);
        res.status(500).json({ message: "Server Error"});
    }
}

exports.userCart = async (req, res) => {
    try {
        const { cart } = req.body;
        const user = await prisma.user.findFirst({
            where: {
                id: parseInt(req.user.id)
            }
        });

        for (const item of cart) {
            const product = await prisma.product.findUnique({
                where: { id: item.id },
                select: { quantity: true, title: true }
            });

            if (!product || product.quantity < item.count) {
                return res.status(400).json({ok: false, message: `สินค้า ${product.title} หมดแล้ว!` });
            }
        }

        await prisma.productOnCart.deleteMany({
            where: {
                cart: { 
                    orderedById: user.id 
                }
            }
        });

        await prisma.cart.deleteMany({
            where: {
                orderedById: user.id
            }
        });

        let products = cart.map((item) => ({
            productId: item.id,
            count: item.count,
            price: item.price,
        }));

        let cartTotal = products.reduce((sum, item) => sum + item.price * item.count, 0);
        const newCart = await prisma.cart.create({
            data: {
                cartTotal: cartTotal,
                orderedById: user.id,
                products: {
                    create: products
                }
            }
        });
               
        res.send("Added to cart successfully");
    } catch (error) {
        console.log(err);
        res.status(500).json({ message: "Server Error"});
    }
}

exports.getUserCart = async (req, res) => {
    try {
        const cart = await prisma.cart.findFirst({
            where: {
                orderedById: parseInt(req.user.id)
            },
            include: {
                products: {
                    include: {
                        product: true
                    }
                }
            }
        });

        res.json({
            products: cart.products,
            cartTotal: cart.cartTotal
        });
    } catch (error) {
        console.log(err);
        res.status(500).json({ message: "Server Error"});
    }
}

exports.emptyCart = async (req, res) => {
    try {
        const cart = await prisma.cart.findFirst({
            where: {
                orderedById: parseInt(req.user.id)
            }
        });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        await prisma.productOnCart.deleteMany({
            where: {
                cartId: cart.id
            }
        });
        const result = await prisma.cart.deleteMany({
            where: {
                orderedById: parseInt(req.user.id)
            }
        });

        res.json({ 
            message: "Cart emptied successfully",
            deletedCount: result.count
        });
    } catch (error) {
        console.log(err);
        res.status(500).json({ message: "Server Error"});
    }
}

exports.saveAddress = async (req, res) => {
    try {
        const { address } = req.body;
        const addressUser = await prisma.user.update({
            where: { id: parseInt(req.user.id) },
            data: { address: address }
        });

        res.json({ 
            ok: true,
            message: "Address updated successfully"
        });
    } catch (error) {
        console.log(err);
        res.status(500).json({ message: "Server Error"});
    }
}

exports.saveOrder = async (req, res) => {
    try {

        // console.log(req.body);
        // return res.send("Save order endpoint hit")
        const { id, amount, status, currency } = req.body.paymentIntent;

        const userCart = await prisma.cart.findFirst({
            where: {
                orderedById: parseInt(req.user.id)
            },
            include: {
                products: true
            }
        });

        if (!userCart || userCart.products.length === 0) {
            return res.status(400).json({ok: false, message: "Cart is empty" });
        }

        const amountTHB = Number(amount) / 100;

        const order = await prisma.order.create({
            data: {
                products: {
                    create: userCart.products.map(item => ({
                        productId: item.productId,
                        count: item.count,
                        price: item.price
                    }))
                },
                orderedBy: {
                    connect: { id: parseInt(req.user.id) }
                },
                cartTotal: userCart.cartTotal,
                stripPaymentId: id,
                amount: amountTHB,
                status: status,
                currentcy: currency,
            }
        });

        const update = userCart.products.map(item => ({
            where: { id: item.productId },
            data: { 
                quantity: { decrement: item.count },
                sold: { increment: item.count }
            }
        }));

        await Promise.all(update.map(updated =>
            prisma.product.update(updated)
        ));

        await prisma.cart.deleteMany({
            where: { orderedById: parseInt(req.user.id) }
        });
        
        res.json({ ok: true, order });
    } catch (error) {
        console.log(err);
        res.status(500).json({ message: "Server Error"});
    }
}

exports.getOrder = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                orderedById: parseInt(req.user.id)
            },
            include: {
                products: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (prisma.order.length === 0) {
            return res.status(404).json({ ok: false, message: "No orders found" });
        }

        res.json({ ok: true, orders });
    } catch (error) {
        console.log(err);
        res.status(500).json({ message: "Server Error"});
    }
}
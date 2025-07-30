const prisma = require("../config/prisma");
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.create = async (req, res) => {
    try {
        const { title, description, price, quantity, categoryId, images } = req.body;

        const category = await prisma.category.findUnique({
            where: {
                id: parseInt(categoryId)
            }
        });

        if (!category) {
            return res.status(400).json({ message: 'Not Found Category' });
        }

        const product = await prisma.product.create({
            data: {
                title: title,
                description: description,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                categoryId: parseInt(categoryId),
                images: {
                    create: images.map(item => ({
                        asset_id: item.asset_id,
                        public_id: item.public_id,
                        url: item.url,
                        secure_url: item.secure_url
                    }))
                }
            }
        });
        
        res.json(product);   
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
}

exports.list = async (req, res) => {
    try {
        const { count } = req.params;
        const products = await prisma.product.findMany({
            take: parseInt(count),
            include: {
                images: true,
                category: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        res.send(products);   
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
}

exports.read = async (req, res) => {
    try {
        const { id } = req.params;
        const products = await prisma.product.findFirst({
            where: {
                id: parseInt(id)
            },
            include: {
                images: true,
                category: true
            }
        });
        
        res.send(products);   
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
}

exports.update = async (req, res) => {
    try {
        const { title, description, price, quantity, categoryId, images } = req.body;

        await prisma.image.deleteMany({
            where: {
                productId: parseInt(req.params.id)
            }
        });

        const product = await prisma.product.update({
            where: {
                id: parseInt(req.params.id)
            },
            data: {
                title: title,
                description: description,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                categoryId: parseInt(categoryId),
                images: {
                    create: images.map(item => ({
                        asset_id: item.asset_id,
                        public_id: item.public_id,
                        url: item.url,
                        secure_url: item.secure_url
                    }))
                }
            }
        });
        
        res.json(product);   
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
}

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findFirst({
            where: {
                id: parseInt(id)
            },
            include: {
                images: true
            }
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const deleteImage = product.images.map((image) => 
        new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(image.public_id, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        })
        )
        await Promise.all(deleteImage);

        await prisma.product.delete({
            where: {
                id: parseInt(id)
            }
        });
        
        res.send('Delete successfully');   
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
}

exports.listby = async (req, res) => {
    try {
        const { sort, order, limit } = req.body;
        const products = await prisma.product.findMany({
            take: parseInt(limit),
            orderBy: {
                [sort]: order
            },
            include: {
                images: true,
                category: true
            }
        });
        
        res.send(products);   
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
}

const handleQuery = async (req, res, query) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                title: {
                    contains: query
                }
            },
            include: {
                images: true,
                category: true
            }
        });
        res.send(products);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Search Error' });
    }
}

const handleCategory = async (req, res, categoryId) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                categoryId: {
                    in: categoryId.map(id => parseInt(id))
                }
            },
            include: {
                images: true,
                category: true
            }
        });
        res.send(products);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Search Error' });
    }
}

const handlePrice = async (req, res, priceRange) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                price: {
                    gte: priceRange[0],
                    lte: priceRange[1]
                }
            },
            include: {
                images: true,
                category: true
            }
        });
        res.send(products);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Search Error' });
    }
}

exports.searchFilters = async (req, res) => {
    try {
        const { query,category, price } = req.body;

        if (query) {
            console.log('query',query)
            await handleQuery(req, res, query);
        }
        if (category) {
            console.log('category',category)
            await handleCategory(req, res, category);
        }
        if (price) {
            console.log('price',price)
            await handlePrice(req, res, price);
        }
          
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
}

exports.createImages = async (req, res) => {
    try {
        const result = await cloudinary.uploader.upload(req.body.image, {
            public_id: `${Date.now()}`,
            resource_type: 'auto',
            folder: 'Ecom2025'
        });
        res.send(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
}

exports.removeImage = async (req, res) => {
    try {
        const { public_id } = req.body;
        await cloudinary.uploader.destroy(public_id,(result) => {
            res.send('Remove image successfully');
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
}
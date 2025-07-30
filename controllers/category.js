const prisma = require("../config/prisma");

exports.create = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const category = await prisma.category.create({
            data: {
                name: name
            }
        });

        res.send(category);   
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
}

exports.list = async (req, res) => {
    try {
        const category = await prisma.category.findMany();

        res.send(category);   
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
}

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.delete({
            where: {
                id: parseInt(id)
            }
        });
        res.send(category);   
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
}
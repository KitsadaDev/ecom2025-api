const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


exports.register = async (req,res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await prisma.user.findFirst({
            where: {
                email: email
            }
        });

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword
            }
        });

        res.send('Register successful');
    }catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error'});
    }
}

exports.login = async (req,res) => {
   try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await prisma.user.findFirst({
            where: {
                email: email
            }
        });

        if (!user || !user.enabled) {
            return res.status(400).json({ message: 'User Not Found or not enabled' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Password Invalid' });
        }

        const payload = {
            id: user.id,
            email: user.email,
            role: user.role   
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) {
                return res.status(500).json({ message: 'Token generation failed' });
            }
            res.json({ payload, token });
        });

    }catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error'});
    }
}

exports.currentUser = async (req, res) => {
    try {

        const user = await prisma.user.findFirst({
            where: {
                email: req.user.email
            },
            select: {
                id: true,
                email: true,
                role: true,
                name: true
            }
        });
        res.json({ user });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
}

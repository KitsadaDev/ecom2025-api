const express = require('express');
const app = express();
const morgan = require('morgan');
const { readdirSync } = require('fs');
const cors = require('cors');
// const authRoutes = require('./routes/auth');
// const categoryRoutes = require('./routes/category');

const port = 3000;

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// app.use('/api', authRoutes);
// app.use('/api', categoryRoutes);
readdirSync('./routes')
.map((c) => app.use('/api', require('./routes/' + c)));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/`);
});
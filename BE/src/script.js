const { app, server } = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5001;

connectDB();

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
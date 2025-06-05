import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Initialize database variables
let client = null;
let db = null;

// Health check endpoint - respond immediately, don't wait for MongoDB
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok',
        serverTime: new Date().toISOString()
    });
});

// MongoDB connection status endpoint
app.get('/db-status', (req, res) => {
    res.json({ 
        connected: db !== null 
    });
});

// Middleware to check database connection
const checkDbConnection = async (req, res, next) => {
    if (!db) {
        return res.status(503).json({ 
            error: 'Database connection not yet established',
            message: 'The server is still connecting to the database. Please try again in a few moments.'
        });
    }
    next();
};

// Add a new score
app.post('/scores', checkDbConnection, async (req, res) => {
    try {
        const { username, score, timestamp } = req.body;
        if (!username || typeof score !== 'number' || !timestamp) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        await db.collection('scores').insertOne({
            username,
            score,
            timestamp
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ error: 'Failed to save score' });
    }
});

// Get top 5 scores
app.get('/scores/top', checkDbConnection, async (req, res) => {
    try {
        const rows = await db.collection('scores')
            .find({})
            .sort({ score: -1, timestamp: 1 })
            .limit(5)
            .toArray();
            
        res.json(rows);
    } catch (error) {
        console.error('Error fetching scores:', error);
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});

// Start server first
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

// Then connect to MongoDB in the background
async function connectToMongoDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI environment variable is not set');
        return;
    }

    try {
        console.log('Attempting to connect to MongoDB Atlas...');
        client = new MongoClient(uri, {
            maxPoolSize: 10,
            minPoolSize: 1,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 45000
        });

        await client.connect();
        console.log('Connected to MongoDB Atlas');
        
        db = client.db('jimbando');
        console.log('Selected database: jimbando');
        
        // Create indexes if they don't exist
        await db.collection('scores').createIndex({ score: -1 });
        await db.collection('scores').createIndex({ timestamp: 1 });
        console.log('Created indexes on scores collection');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        // Don't exit the process, just log the error
        // The server will continue running and return appropriate errors for database operations
        setTimeout(connectToMongoDB, 5000); // Try to reconnect in 5 seconds
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Starting graceful shutdown...');
    server.close(async () => {
        if (client) {
            await client.close();
            console.log('MongoDB connection closed');
        }
        process.exit(0);
    });
});

// Start MongoDB connection after server is running
connectToMongoDB(); 
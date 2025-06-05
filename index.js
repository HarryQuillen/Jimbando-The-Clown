import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
}

const client = new MongoClient(uri);
let db;

// Connect to MongoDB before starting the server
async function startServer() {
    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas');
        
        db = client.db('jimbando');
        
        // Create indexes if they don't exist
        await db.collection('scores').createIndex({ score: -1 });
        await db.collection('scores').createIndex({ timestamp: 1 });
        
        // Start listening only after successful database connection
        app.listen(PORT, () => {
            console.log(`Leaderboard server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    }
}

// Middleware to check database connection
const checkDbConnection = (req, res, next) => {
    if (!db) {
        return res.status(500).json({ error: 'Database connection not established' });
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

// Handle graceful shutdown
process.on('SIGINT', async () => {
    try {
        await client.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
    }
});

// Start the server
startServer(); 
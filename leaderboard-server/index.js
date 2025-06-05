import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import tls from 'tls';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable trust proxy for Render's infrastructure
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok',
        version: '1.0.1',
        serverTime: new Date().toISOString()
    });
});

// MongoDB connection
const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
}

// MongoDB connection options with TLS configuration
const options = {
    tls: true,
    tlsCAFile: undefined,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    ssl: true,
    sslValidate: true,
    directConnection: false,
    replicaSet: 'atlas-11yg65-shard-0',
    minPoolSize: 1,
    maxPoolSize: 10
};

const client = new MongoClient(uri, options);
let db;
let isConnecting = false;
let server;

// Connect to MongoDB
async function connectToMongoDB() {
    if (isConnecting) return;
    isConnecting = true;
    
    let retries = 5;
    while (retries > 0) {
        try {
            console.log('Attempting to connect to MongoDB Atlas...');
            await client.connect();
            console.log('Connected to MongoDB Atlas');
            
            db = client.db('jimbando');
            console.log('Selected database: jimbando');
            
            // Create indexes if they don't exist
            await db.collection('scores').createIndex({ score: -1 });
            await db.collection('scores').createIndex({ timestamp: 1 });
            console.log('Created indexes on scores collection');
            
            isConnecting = false;
            return true;
        } catch (err) {
            console.error(`Failed to connect to MongoDB (attempt ${6 - retries}/5):`, err);
            retries--;
            if (retries === 0) {
                console.error('All connection attempts failed.');
                isConnecting = false;
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

// Start the server
async function startServer() {
    try {
        // Try to connect to MongoDB first
        const connected = await connectToMongoDB();
        if (!connected) {
            console.error('Could not establish initial MongoDB connection');
            process.exit(1);
        }
        
        // Start the server
        server = app.listen(PORT, () => {
            console.log(`Leaderboard server running on port ${PORT}`);
        });

        // Handle server shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received. Starting graceful shutdown...');
            shutdown();
        });

        process.on('SIGINT', () => {
            console.log('SIGINT received. Starting graceful shutdown...');
            shutdown();
        });

    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

// Graceful shutdown function
async function shutdown() {
    try {
        if (server) {
            await new Promise((resolve) => {
                server.close(resolve);
            });
            console.log('Server closed');
        }
        
        if (client) {
            await client.close();
            console.log('MongoDB connection closed');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
}

// Middleware to check database connection
const checkDbConnection = async (req, res, next) => {
    if (!db) {
        try {
            const connected = await connectToMongoDB();
            if (!connected) {
                return res.status(500).json({ error: 'Database connection not established' });
            }
        } catch (error) {
            console.error('Error reconnecting to database:', error);
            return res.status(500).json({ error: 'Database connection failed' });
        }
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

// Start the server
startServer(); 
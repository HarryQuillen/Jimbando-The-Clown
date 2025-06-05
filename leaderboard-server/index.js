import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Get port from environment variable
const PORT = parseInt(process.env.PORT || '10000', 10);

console.log('Starting server initialization...');
console.log(`PORT environment variable: ${process.env.PORT}`);
console.log(`Using port: ${PORT}`);

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
let uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
}

// Ensure TLS version is set in connection string
if (!uri.includes('tls=true')) {
    uri = uri.includes('?') 
        ? `${uri}&tls=true&tlsInsecure=false`
        : `${uri}?tls=true&tlsInsecure=false`;
}

console.log('Using MongoDB connection string with TLS configuration');

// MongoDB connection options for v6+
const options = {
    maxPoolSize: 10,
    minPoolSize: 1,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true
    }
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
            
            // Verify the connection
            await client.db("admin").command({ ping: 1 });
            console.log("Successfully pinged MongoDB deployment");
            
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
            console.error('Error details:', err.cause || err.message);
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
        
        // Create server but don't start listening yet
        server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running at http://0.0.0.0:${PORT}`);
            console.log('Server is listening on all available network interfaces');
        });

        // Log any server errors
        server.on('error', (error) => {
            console.error('Server error:', error);
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use`);
            }
            process.exit(1);
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
console.log('Calling startServer()...');
startServer(); 
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

async function connectToDb() {
    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas');
        db = client.db('jimbando');
        
        // Create indexes if they don't exist
        await db.collection('scores').createIndex({ score: -1 });
        await db.collection('scores').createIndex({ timestamp: 1 });
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
    }
}

connectToDb();

// Add a new score
app.post('/scores', async (req, res) => {
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
app.get('/scores/top', async (req, res) => {
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

app.listen(PORT, () => {
    console.log(`Leaderboard server running on http://localhost:${PORT}`);
});
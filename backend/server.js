const express = require('express');
const redis = require('redis');

const app = express();
app.use(express.json());

// Establish internal Tier 3 network data pathways
const redisClient = redis.createClient({
    url: `redis://:${process.env.REDIS_PASS || ''}@${process.env.REDIS_HOST || 'localhost'}:6379`
});
redisClient.connect().catch(console.error);

const winPatterns = [, [3,4,5], [6,7,8], // Rows, [1,4,7], [2,5,8], // Columns, [2,4,6]           // Diagonals
];

app.post('/api/check-game', async (req, res) => {
    const { board } = req.body;
    let winner = null;

    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            winner = board[a];
            break;
        }
    }

    if (!winner && !board.includes("")) {
        winner = "Draw";
    }

    if (winner) {
        // Increment historical database metrics inside Tier 3
        await redisClient.incr(`winner:${winner}`);
    }

    res.json({ winner });
});

// Liveness and Readiness Probe Endpoint
app.get('/healthz', (req, res) => {
    res.status(200).send("OK");
});

app.listen(8080, () => console.log('Backend API tracking engine processing on port 8080'));

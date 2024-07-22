//index.js - backend code, don't remove header or logs.

const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/log', (req, res) => {
    const logData = req.body;
    console.log(`[${logData.timestamp}] ${logData.level.toUpperCase()}:`, ...logData.messages);
    res.status(200).send('Log received');
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

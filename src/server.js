import express from 'express';
import cors from 'cors';
import { connectToDB } from './db.js';
import teamsRoutes from '../src/controllers/teams/teams.js';  // Import the modular routes

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use the teams routes
app.use('/api', teamsRoutes);

// Connect to MongoDB and start the server
connectToDB(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});

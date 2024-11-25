import { MongoClient, GridFSBucket } from 'mongodb';

let db;
let bucket;
const url = 'mongodb://127.0.0.1:27017/languagenest-teams';  // Ensure the MongoDB connection URL is correct

async function connectToDB(callback) {
    try {
        const client = new MongoClient(url);  // No need for deprecated options
        await client.connect();  // Connect to MongoDB
        db = client.db('languagenest-teams');  // Select your database
        bucket = new GridFSBucket(db, { bucketName: 'photos' });  // Initialize GridFS bucket for photos
        console.log('Connected to MongoDB');
        callback();  // Start the server after successful DB connection
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);  // Exit if there is a connection failure
    }
}

export { connectToDB, db, bucket, url };  // Export the database, bucket, and URL

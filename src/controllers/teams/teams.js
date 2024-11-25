import express from 'express';
import { ObjectId } from 'mongodb';
import multer from 'multer';
import { db, url, bucket } from '../../db.js'; // Import the db instance, URL, and bucket
import { configureGridFsStorage } from '../../services.js'; // Configure GridFS Storage

const router = express.Router();

// Configure multer for file uploads using GridFS storage
const storage = configureGridFsStorage(url, "photos");
const upload = multer({ storage });

// Route to create a new body in teamlist
router.post('/teamlist', async (req, res) => {
    const { bodyName } = req.body;

    if (!bodyName) {
        return res.status(400).json({ error: "Body name is required." });
    }

    try {
        const result = await db.collection('teamlist').insertOne({ bodyName });
        res.json({ message: "Body added to teamlist", result });
    } catch (e) {
        console.error("Error adding body to teamlist:", e);
        res.status(500).json({ error: "An error occurred while adding body to teamlist." });
    }
});



// Retrieve all bodies in teamlist
router.get('/teamlist', async (req, res) => {
    try {
        const teamList = await db.collection('teamlist').find().toArray();
        res.json(teamList);
    } catch (e) {
        console.error("Error fetching teamlist:", e);
        res.status(500).json({ error: "An error occurred while fetching the teamlist." });
    }
});

router.put('/teamlist/update/:id', async (req, res) => {
    const { id } = req.params;
    const { bodyName } = req.body;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format." });
    }

    if (!bodyName) {
        return res.status(400).json({ error: "Body name is required." });
    }

    try {
        const result = await db.collection('teamlist').updateOne(
            { _id: new ObjectId(id) },
            { $set: { bodyName } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Body not found." });
        }

        res.json({ message: "Body name updated successfully", result });
    } catch (e) {
        console.error("Error updating body name:", e);
        res.status(500).json({ error: "An error occurred while updating body name." });
    }
});

router.delete('/teamlist/delete/:id', async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format." });
    }

    try {
        // Delete the body from the 'teamlist' collection
        const bodyDeleteResult = await db.collection('teamlist').deleteOne({ _id: new ObjectId(id) });

        if (bodyDeleteResult.deletedCount === 0) {
            return res.status(404).json({ error: "Body not found." });
        }

        // Delete all team members related to the body from the 'team' collection
        const teamDeleteResult = await db.collection('team').deleteMany({ bodyId: new ObjectId(id) });

        res.json({
            message: "Body and related team members deleted successfully",
            bodyDeleteResult,
            teamDeleteResult
        });
    } catch (e) {
        console.error("Error deleting body and team members:", e);
        res.status(500).json({ error: "An error occurred while deleting body and related team members." });
    }
});


// Upload member data linked to both bodyName and bodyId in teamlist
router.post('/:bodyId', upload.single("postImage"), async (req, res) => {
    const { bodyId } = req.params;
    const { name, role } = req.body;

    try {
        const postImage = req.file ? req.file.filename : null;

        // Ensure the body exists in teamlist by both bodyName and bodyId
        const bodyExists = await db.collection('teamlist').findOne({ _id: new ObjectId(bodyId) });

        if (!bodyExists) {
            return res.status(404).json({ message: "Body not found in teamlist" });
        }

        // Insert the new team member with Belongs field storing the bodyId
        const result = await db.collection("team").insertOne({
            Name: name,
            Role: role,
            Belongs: new ObjectId(bodyId), // Store the id as the reference
            postImage: postImage
        });

        res.json({ message: "Team member added successfully", result });
    } catch (e) {
        console.error("Error adding team member:", e);
        res.status(500).json({ error: "An error occurred while adding the team member." });
    }
});

// Retrieve all members belonging to a specific bodyName and bodyId from team
router.get('/:bodyId', async (req, res) => {
    const { bodyId } = req.params;

    try {
        // Ensure the body exists in teamlist by both bodyName and bodyId
        const bodyExists = await db.collection('teamlist').findOne({ _id: new ObjectId(bodyId) });

        if (!bodyExists) {
            return res.status(404).json({ message: "Body not found in teamlist" });
        }

        const members = await db.collection('team').find({ Belongs: new ObjectId(bodyId) }).toArray();
        if (members.length === 0) {
            return res.status(404).json({ message: `No team members found for body ID ${bodyId}` });
        }

        res.json(members);
    } catch (e) {
        console.error(`Error fetching team members for body ID ${bodyId}:`, e);
        res.status(500).json({ error: "An error occurred while fetching team members." });
    }
});

// Update a team member by member ID
router.put('/update/:id', upload.single("postImage"), async (req, res) => {
    const { id } = req.params;  // Only using id now
    const { name, role } = req.body; 

    try {
        const postImage = req.file ? req.file.filename : null;

        const result = await db.collection('team').updateOne(
            { _id: new ObjectId(id) },  // Query based only on id
            { $set: { Name: name, Role: role, postImage: postImage } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: `No member found with ID ${id}` });
        }

        res.json({ message: 'Team member updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while updating the team member.' });
    }
});

// Delete a team member by member ID
router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;  // Only using id now

    try {
        const result = await db.collection('team').deleteOne({ _id: new ObjectId(id) });  // Query based only on id

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: `No member found with ID ${id}` });
        }

        res.json({ message: 'Team member deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while deleting the team member.' });
    }
});

// Get uploaded media (image) by filename
router.get("/media/:filename", async (req, res) => {
    try {
        const { filename } = req.params;

        const file = await db.collection('photos.files').findOne({ filename });

        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        const mimeType = file.contentType || file.metadata.mimetype;
        res.setHeader("Content-Type", mimeType);

        const mediaStream = bucket.openDownloadStreamByName(filename);

        mediaStream.on("error", (err) => {
            console.error(err);
            return res.status(404).json({ message: "Error streaming the file" });
        });

        mediaStream.pipe(res);
    } catch (error) {
        console.error("Error retrieving the file:", error);
        res.status(500).json({ error: "Failed to retrieve media file" });
    }
});

export default router;

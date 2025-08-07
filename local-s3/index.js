const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for all origins
app.use(cors());

// Serve static files from the uploads directory
app.use('/images', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    // Use original filename or add timestamp for uniqueness
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Upload endpoint
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the public URL for the uploaded image
  const imageUrl = `/images/${req.file.filename}`;
  res.json({ filename: req.file.filename, url: imageUrl });
});

// Serve static HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint for file list
app.get('/api/files', (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads');
  
  // Use fs.promises for better async handling
  fs.promises.readdir(uploadsDir)
    .then(files => {
      // Filter out hidden files
      const visibleFiles = files.filter(file => !file.startsWith('.'));
      
      // Get file stats for each file
      return Promise.all(
        visibleFiles.map(file => 
          fs.promises.stat(path.join(uploadsDir, file))
            .then(stats => ({
              name: file,
              size: stats.size,
              modified: stats.mtime.toISOString(),
              isImage: file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)
            }))
        )
      );
    })
    .then(files => {
      // Sort files by modification time, newest first
      files.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      res.json({ files });
    })
    .catch(err => {
      console.error('Error reading uploads directory:', err);
      res.status(500).json({ error: 'Failed to read uploads directory' });
    });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Local S3 server running on http://localhost:${PORT}`);
});

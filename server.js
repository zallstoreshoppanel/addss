

const express = require('express');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import fs here


const app = express();
const port = 3000;

// Multer setup:  Use a memory storage engine.  Files are stored in memory.
const upload = multer({ storage: multer.memoryStorage() });

const API = "https://negro.consulting/api/process-image";
const TYPE = [
  "coklat",
  "hitam",
  "nerd",
  "piggy",
  "carbon",
  "botak"
];

async function Hitam(payload) {
    try {
        if (!payload.image || !payload.filter) {
            return {
                ok: false,
                message: "Ingfo gambar dan filter yang valid."
            };
        }

        if (!TYPE.includes(payload.filter)) {
            return {
                ok: false,
                message: "Filter " + payload.filter + " tidak ada di list."
            };
        }

        // If the image is a buffer (from memoryStorage), convert to base64
        let base64Image;
        if (Buffer.isBuffer(payload.image.buffer)) {
            base64Image = payload.image.buffer.toString('base64');
        } else {
            return {
                ok: false,
                message: "Invalid image format."
            };
        }

        const response = await axios({
            url: API,
            method: "POST",
            data: {
                filter: payload.filter,
                imageData: "data:image/png;base64," + base64Image
            },
            responseType: 'json' // Ensure we're expecting JSON
        });

        if (!response.data || !response.data.processedImageUrl) {
            return {
                ok: false,
                message: "Gagal memproses gambar dari API eksternal.  Data atau URL gambar tidak valid."
            };
        }

        return {
            ok: true,
            message: "Penghitaman massal",
            result: response.data
        };

    } catch (err) {
        console.error("Error in Hitam function:", err);
        return {
            ok: false,
            message: `Error: ${err.message || 'Terjadi kesalahan saat memproses gambar.'}`
        };
    }
}

// Route for image upload
app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Tidak ada file yang diunggah!" });
    }

    const { filter } = req.body;

    if (!filter) {
        return res.status(400).json({ message: "Filter tidak disertakan!" });
    }

    const payload = {
        filter: filter,
        image: req.file // Pass the entire file object (which includes buffer)
    };

    const hitam = await Hitam(payload);

    if (hitam.ok) {
        res.json({
            message: "Gambar berhasil diproses!",
            imageUrl: hitam.result.processedImageUrl // Send the URL of the processed image.
        });
    } else {
        res.status(500).json(hitam);
    }
});

// Serve the index.html file
app.use(express.static(path.join(__dirname)));

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

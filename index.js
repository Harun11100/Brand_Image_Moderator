const express = require('express');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3001;



// Brand validator 
const restrictedBrands = ['BrandX', 'BrandY'];

function isBrandAllowed(brand) {
  return !restrictedBrands.includes(brand);
}

app.post('/validate-brand', (req, res) => {
  const { brand } = req.body;
  if (!brand) return res.status(400).json({ message: 'Brand name is required.' });

  if (!isBrandAllowed(brand)) {
    return res.status(400).json({ message: 'Brand is not allowed.' });
  }
  res.status(200).json({ message: 'Brand is valid.' });
});




const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoint for file upload
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image provided.' });
  }
  res.status(200).json({ message: 'Image uploaded successfully.' });
});



// Image moderator
const axios = require('axios');
const { Module } = require('module');

async function isImageSafe(imageBuffer) {
  const subscriptionKey = process.env.AZURE_SUBSCRIPTION_KEY;
  const endpoint = process.env.AZURE_ENDPOINT;

  try {
    const response = await axios.post(`${endpoint}/contentmoderator/moderate`, imageBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': subscriptionKey,
      },
    });

    return response.data.IsImageAdultClassified === false; // Example field
  } catch (error) {
    console.error('Error moderating image:', error);
    return false;
  }
}



app.post('/validate-image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Image is required.' });

  const isSafe = await isImageSafe(req.file.buffer);
  if (!isSafe) return res.status(400).json({ message: 'Inappropriate image detected.' });

  res.status(200).json({ message: 'Image is appropriate.' });
});



app.post('/validate-product', upload.single('image'), async (req, res) => {
      const { brand } = req.body;
      const image = req.file;
    
      // Check brand
      if (!brand) return res.status(400).json({ message: 'Brand name is required.' });
      if (!isBrandAllowed(brand)) {
        return res.status(400).json({ message: 'Brand is not allowed.' });
      }
    
      // Check image
      if (!image) return res.status(400).json({ message: 'Image is required.' });
      const isSafe = await isImageSafe(image.buffer);
      if (!isSafe) return res.status(400).json({ message: 'Inappropriate image detected.' });
    
      res.status(200).json({ message: 'Product is valid.' });
    });
    
    app.get('/', (req, res) => {
      res.send('API is running...');
    });
    
module.exports=app;
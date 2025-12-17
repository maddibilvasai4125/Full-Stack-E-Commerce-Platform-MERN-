const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const fetch = require('node-fetch');
const cors = require('cors'); 
 

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Use cors middleware to enable CORS


// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

 



// Define the directory where your static files (HTML, CSS, etc.) are located
const staticDir = path.join(__dirname, 'public');

// Serve static files from the 'public' directory
app.use(express.static(staticDir));

// Route to serve the root URL ("/") and send the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html')); // Serve index.html
});

// Endpoint to serve main.js file
app.get('/main.js', (req, res) => {
    res.type('text/javascript');
    res.sendFile(path.join(__dirname, 'public', 'js', 'main.js'));
});







 

// Proxy endpoint to fetch data from Google Maps API
app.get('/coffee', async (req, res) => {
    const { lat, lng } = req.query; // Get latitude and longitude from the client
    const radius = 500; // Set the search radius
    
  
    try {

      const apiKey = 'AIzaSyDDgA9z2p_jv6l7-_0a0cnEO9WbfRB9rTA'; // Replace with your actual API key
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=cafe&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching nearby cafes:', error);
      res.status(500).send('Internal Server Error');
    }
  });
















// Endpoint to fetch product data
app.get('/products', (req, res) => {
    // Array containing all product data
    const productsData = [
        {
            "id": 1,
            "name": "PREMIUM (100gm)",
            "price": 499,
            "image": "/img/c1.png" // Adjust the image path
        },
        {
            "id": 2,
            "name": "PREMIUM (250gm)",
            "price": 899,
            "image": "/img/c1.png" // Adjust the image path
        },
        {
            "id": 3,
            "name": "CLASSIC (100gm)",
            "price": 250,
            "image": "/img/c1.png" // Adjust the image path
        },
        {
            "id": 4,
            "name": "CLASSIC (250gm)",
            "price": 450,
            "image": "/img/c1.png" // Adjust the image path
        },
        // Add other product objects here...
    ];
    // Respond with JSON data
    res.json(productsData);
});

// Twilio credentials
const accountSid = 'ACeaae1e8981e010c0629785cddeace500';
const authToken = 'e7dca03b536a7447acda8245c7247d08';
const twilioPhoneNumber = '+12514188416';

const client = twilio(accountSid, authToken);

// Handle POST request for franchise enquiry form
app.post('/franchise-enquiry', (req, res) => {
    const { name, email, phone, message } = req.body;

    // Construct the message body
    const smsBody = `New Franchise Enquiry:
    Name: ${name}
    Email: ${email}
    Phone: ${phone}
    Message: ${message}`;

    // Send SMS using Twilio
    client.messages
        .create({
            body: smsBody,
            from: twilioPhoneNumber,
            to: '+918121284748' // Enter your phone number here
        })
        .then(message => console.log(`SMS sent: ${message.sid}`))
        .catch(error => console.error(error));

    // Send response to the client
    res.sendFile(path.join(staticDir, 'thankyou.html')); // Serve thankyou.html
});






// Server-side endpoint to proxy requests to the YouTube API
app.get('/youtube-proxy', (req, res) => {
    const { query } = req.query;
    const API_KEY = 'AIzaSyB3ifk3v6ynD528M6xsII-7e6Bl7mTcQgw';
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&part=snippet&type=video&q=${query}`;

    // Forward the request to the YouTube API
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            res.json(data);
        })
        .catch(error => {
            console.error('Error fetching YouTube data:', error);
            res.status(500).send('Failed to fetch YouTube data');
        });
});



 






























// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

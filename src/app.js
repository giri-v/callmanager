/**
 * @file Main application file for the Call Attendant web server.
 * Contains a basic HTTP server as a placeholder for an Express.js application.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// --- Placeholder for Express.js initialization ---
// const express = require('express'); // Would be required if 'npm install express' worked
// const app = express(); // Would initialize Express
// const port = process.env.PORT || 5000;
//
// // --- Placeholder for Express Middleware ---
// // app.use(express.json()); // For parsing application/json
// // app.use(express.static(path.join(__dirname, '../public'))); // To serve static files
//
// // --- Placeholder for Express Routes ---
// // const apiRoutes = require('./routes/api');
// // app.use('/api', apiRoutes); // Mount API routes
//
// // app.get('/', (req, res) => {
// //   res.sendFile(path.join(__dirname, '../public/index.html'));
// // });
//
// // app.get('/settings', (req, res) => {
// //   res.sendFile(path.join(__dirname, '../public/settings.html'));
// // });
// --- End of Express.js placeholder section ---

const PORT = process.env.PORT || 5000;
const PUBLIC_DIR = path.join(__dirname, '../public');

/**
 * Serves a file using the response object.
 * @param {http.ServerResponse} res - The server response object.
 * @param {string} filePath - The path to the file to serve.
 * @param {string} contentType - The content type of the file.
 */
function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading file: ' + err.message);
      console.error(`Error reading file ${filePath}:`, err);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

/**
 * Starts the basic HTTP server.
 * This function is a placeholder for what would typically be app.listen() with Express.
 * @returns {http.Server} The created HTTP server instance.
 */
function startServer() {
  const server = http.createServer((req, res) => {
    const { url, method } = req; // Get method for API routing

    // Handle API routes
    if (url.startsWith('/api/')) {
      const api = require('./routes/api'); // Load API handlers
      res.setHeader('Content-Type', 'application/json'); // Default API response type

      if (url === '/api/voicemails' && method === 'GET') {
        // Simulate calling the handler and sending its "response"
        // In a real app, api.getVoicemails would directly use res.
        // Here we capture its console log for the test, and send a generic response.
        // This is still a placeholder as we don't have a real Express res object.
        api.getVoicemails({ params: {}, body: {} }, { 
          send: (data) => { 
            res.writeHead(200); 
            res.end(JSON.stringify({ message: 'API: Voicemails data from handler.', dataSent: data }));
          },
          json: (jsonData) => {
            res.writeHead(200);
            res.end(JSON.stringify(jsonData));
          }
        });
        return; // Prevent further processing
      } else if (url === '/api/blockednumbers' && method === 'GET') {
        api.getBlockedNumbers({ params: {}, body: {} }, {
           send: (data) => { 
            res.writeHead(200); 
            res.end(JSON.stringify({ message: 'API: Blocked numbers data from handler.', dataSent: data }));
          },
          json: (jsonData) => {
            res.writeHead(200);
            res.end(JSON.stringify(jsonData));
          }
        });
        return;
      } else if (url === '/api/status' && method === 'GET') {
        api.getApiStatus({ params: {}, body: {} }, {
          json: (jsonData) => {
            res.writeHead(200);
            res.end(JSON.stringify(jsonData));
          }
        });
        return;
      }
      // Add more API routes here (e.g., POST for adding numbers, DELETE)

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API endpoint not found or method not supported' }));
      return;
    }

    // Handle static file serving
    const staticUrl = url === '/' ? '/index.html' : url;
    const requestedPath = path.join(PUBLIC_DIR, staticUrl);

    // Basic security: prevent path traversal
    if (!requestedPath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    if (staticUrl === '/index.html') {
      serveFile(res, path.join(PUBLIC_DIR, 'index.html'), 'text/html');
    } else if (staticUrl === '/settings') { // Note: original subtask asked for /settings to serve settings.html
      serveFile(res, path.join(PUBLIC_DIR, 'settings.html'), 'text/html');
    } else {
      fs.stat(requestedPath, (err, stats) => {
        if (!err && stats.isFile()) {
          let contentType = 'text/plain';
          if (requestedPath.endsWith('.html')) contentType = 'text/html';
          serveFile(res, requestedPath, contentType);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      });
    }
  });

  server.listen(PORT, () => {
    console.log(`Basic HTTP server running on port ${PORT}. (Express is not operational)`);
    console.log(`Serving content from ${PUBLIC_DIR}`);
    console.log(`- http://localhost:${PORT}/ for voicemails (index.html)`);
    console.log(`- http://localhost:${PORT}/settings for settings (settings.html)`);
  });
  return server; // Return server instance for potential use in tests (e.g., closing it)
}

module.exports = { startServer };

// If this file is run directly, start the server.
if (require.main === module) {
  startServer();
  console.log("src/app.js run directly: Server started.");
} else {
  console.log("src/app.js required as a module.");
}

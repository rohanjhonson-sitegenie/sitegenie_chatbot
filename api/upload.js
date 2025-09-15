// Vercel serverless function to proxy file upload requests
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Forward the FormData directly
    const response = await fetch('https://flaskapi.sitegenie.ai/upload', {
      method: 'POST',
      body: req.body,
      headers: {
        ...req.headers,
        host: 'flaskapi.sitegenie.ai',
      },
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error) {
    console.error('Upload proxy error:', error);
    res.status(500).json({ error: 'Upload proxy request failed' });
  }
}
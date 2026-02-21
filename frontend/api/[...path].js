export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    res.status(500).json({ message: 'BACKEND_URL is not configured' });
    return;
  }

  const pathSegments = Array.isArray(req.query.path) ? req.query.path : [];
  const queryIndex = req.url.indexOf('?');
  const queryString = queryIndex >= 0 ? req.url.slice(queryIndex) : '';
  const pathname = pathSegments.join('/');

  if (pathname === 'health' && req.method === 'GET') {
    try {
      const backendHealthResponse = await fetch(`${backendUrl.replace(/\/$/, '')}/`);
      const backendText = await backendHealthResponse.text();

      res.status(200).json({
        status: 'ok',
        proxy: 'healthy',
        backend: {
          status: backendHealthResponse.ok ? 'reachable' : 'unhealthy',
          httpStatus: backendHealthResponse.status,
          message: backendText,
        },
      });
    } catch (error) {
      res.status(503).json({
        status: 'degraded',
        proxy: 'healthy',
        backend: {
          status: 'unreachable',
          message: error.message,
        },
      });
    }

    return;
  }

  const targetUrl = `${backendUrl.replace(/\/$/, '')}/${pathname}${queryString}`;

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers['content-length'];

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  let requestBody;

  if (hasBody) {
    requestBody = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: hasBody ? requestBody : undefined,
    });

    res.status(upstreamResponse.status);

    upstreamResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'transfer-encoding') {
        res.setHeader(key, value);
      }
    });

    const responseBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
    res.send(responseBuffer);
  } catch (error) {
    res.status(502).json({ message: 'Proxy request failed', error: error.message });
  }
}

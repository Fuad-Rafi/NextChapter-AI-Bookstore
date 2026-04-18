const defaultBackendUrl = 'http://localhost:5000';

const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/$/, '');

const readBackendUrl = () => {
  return normalizeBaseUrl(process.env.BACKEND_URL) || defaultBackendUrl;
};

const buildTargetUrl = (backendUrl, pathSegments, search = '') => {
  const pathname = pathSegments.filter(Boolean).join('/');
  const suffix = pathname ? `/${pathname}` : '';
  return `${backendUrl}${suffix}${search}`;
};

const withTimeout = (request, timeoutMs = 25000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
};

const forwardRequest = async (request, pathSegments = []) => {
  const backendUrl = readBackendUrl();
  const url = new URL(request.url);
  const pathname = pathSegments.length > 0 ? pathSegments.join('/') : '';

  if (pathname === 'health' && request.method === 'GET') {
    const timeout = withTimeout(request, 8000);
    try {
      const backendHealthResponse = await fetch(`${backendUrl}/`, { signal: timeout.signal });
      const backendText = await backendHealthResponse.text();

      return Response.json(
        {
          status: 'ok',
          proxy: 'healthy',
          backend: {
            status: backendHealthResponse.ok ? 'reachable' : 'unhealthy',
            httpStatus: backendHealthResponse.status,
            message: backendText,
          },
        },
        { status: 200 }
      );
    } catch (error) {
      return Response.json(
        {
          status: 'degraded',
          proxy: 'healthy',
          backend: {
            status: 'unreachable',
            message: error.message,
          },
        },
        { status: 503 }
      );
    } finally {
      timeout.clear();
    }
  }

  const targetUrl = buildTargetUrl(backendUrl, pathSegments, url.search);
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const init = {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: 'manual',
  };

  const timeout = withTimeout(request);
  try {
    const upstreamResponse = await fetch(targetUrl, { ...init, signal: timeout.signal });
    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.delete('transfer-encoding');

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      return Response.json({ message: 'Upstream timeout' }, { status: 504 });
    }

    return Response.json({ message: 'Upstream service unavailable' }, { status: 503 });
  } finally {
    timeout.clear();
  }
};

export { forwardRequest };

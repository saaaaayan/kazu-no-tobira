import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';

const [directory, portArg = '8115'] = process.argv.slice(2);
if (!directory) throw new Error('Specify a preview export directory.');
const port = Number(portArg);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid preview port.');
const root = await realpath(directory);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (request, response) => {
  if (request.headers.host !== '127.0.0.1:' + port) {
    response.writeHead(403).end();
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const file = await realpath(resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname)));
    const location = relative(root, file);
    if (!location || location === '..' || location.startsWith('..' + sep) || isAbsolute(location)) {
      response.writeHead(404).end();
      return;
    }
    const body = await readFile(file);
    response.writeHead(200, {
      'Content-Type': types[extname(file)] ?? 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    }).end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404).end();
  }
});
server.listen(port, '127.0.0.1', () => console.log('Review: http://127.0.0.1:' + port + '/'));

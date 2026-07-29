import {
  createReadStream,
  existsSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, relative, resolve } from 'node:path';

const host = '127.0.0.1';
const port = 4176;
const deployment = JSON.parse(
  readFileSync(resolve('deployment.config.json'), 'utf8'),
);
const basePath = deployment.basePath;
const buildRoot = resolve('dist');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
};

function resolveRequestPath(requestPath) {
  const decoded = decodeURIComponent(requestPath);
  const relativePath = decoded.slice(basePath.length) || 'index.html';
  const candidate = resolve(buildRoot, normalize(relativePath));
  const relativeCandidate = relative(buildRoot, candidate);
  if (
    relativeCandidate.startsWith('..') ||
    relativeCandidate.includes(`..${process.platform === 'win32' ? '\\' : '/'}`)
  ) {
    return null;
  }
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    return join(candidate, 'index.html');
  }
  return candidate;
}

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url ?? '/', `http://${host}:${port}`);
  if (requestUrl.pathname === basePath.slice(0, -1)) {
    response.writeHead(302, { Location: basePath });
    response.end();
    return;
  }
  if (!requestUrl.pathname.startsWith(basePath)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const filePath = resolveRequestPath(requestUrl.pathname);
  let responsePath = filePath;
  let status = 200;
  if (
    !responsePath ||
    !existsSync(responsePath) ||
    !statSync(responsePath).isFile()
  ) {
    responsePath = resolve(buildRoot, '404.html');
    status = 404;
  }

  const contentType =
    contentTypes[extname(responsePath)] ?? 'application/octet-stream';
  const buildRelativePath = relative(buildRoot, responsePath).split('\\').join('/');
  const cacheControl =
    buildRelativePath === 'sw.js'
      ? 'no-cache, no-store, must-revalidate'
      : /^assets\/.+-[A-Za-z0-9_-]{8,}\./.test(buildRelativePath)
        ? 'public, max-age=31536000, immutable'
        : 'no-cache';
  response.writeHead(status, {
    'Cache-Control': cacheControl,
    'Content-Type': contentType,
  });
  createReadStream(responsePath).pipe(response);
});

server.listen(port, host, () => {
  process.stdout.write(
    `Gym Buddies Pages fixture available at http://${host}:${port}${basePath}\n`,
  );
});

import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 순수 Node.js HTTP 서버
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log(`${method} ${pathname}`);

  // 루트 경로 - HTML 파일 서빙
  if (pathname === '/' && method === 'GET') {
    const htmlPath = path.join(__dirname, 'views', 'index.html');
    fs.readFile(htmlPath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('서버 오류');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // About 페이지
  if (pathname === '/about' && method === 'GET') {
    const aboutData = {
      message: 'Express MVC 프로젝트 소개',
      structure: {
        models: 'MySQL과 연결된 데이터 모델',
        views: 'HTML 템플릿과 정적 파일',
        controllers: '비즈니스 로직 처리',
        routes: 'URL 라우팅 관리',
        public: '정적 자원 (CSS, JS, 이미지)',
        tests: 'API 테스트 코드'
      }
    };
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(aboutData, null, 2));
    return;
  }

  // API 문서
  if (pathname === '/docs' && method === 'GET') {
    const docsData = {
      endpoints: [
        { method: 'GET', path: '/api/users', description: '모든 도시 조회' },
        { method: 'GET', path: '/api/users/:id', description: '특정 도시 조회' },
        { method: 'POST', path: '/api/users', description: '새 도시 추가' },
        { method: 'PUT', path: '/api/users/:id', description: '도시 정보 수정' },
        { method: 'DELETE', path: '/api/users/:id', description: '도시 삭제' }
      ]
    };
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(docsData, null, 2));
    return;
  }

  // 정적 파일 서빙 (CSS, JS, 이미지 등)
  if (pathname.startsWith('/') && pathname !== '/') {
    const filePath = path.join(__dirname, 'public', pathname);
    
    // 파일 확장자별 Content-Type 설정
    const ext = path.extname(pathname);
    let contentType = 'text/plain';
    
    switch (ext) {
      case '.css':
        contentType = 'text/css';
        break;
      case '.js':
        contentType = 'application/javascript';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.html':
        contentType = 'text/html';
        break;
    }

    fs.readFile(filePath, (err, data) => {
      if (!err) {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      } else {
        // 파일을 찾을 수 없으면 404
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'File not found' }));
      }
    });
    return; // 중요: 여기서 함수 종료
  }

  // API 라우트들
  if (pathname.startsWith('/api/users')) {
    handleUsersAPI(req, res, pathname, method);
    return;
  }

  // 404 Not Found
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Page not found' }));
});

// 간단한 사용자 API 핸들러 (MySQL 없이 더미 데이터)
function handleUsersAPI(req, res, pathname, method) {
  const dummyUsers = [
    { ID: 1, Name: 'Seoul', CountryCode: 'KOR', District: 'Seoul', Population: 9981619 },
    { ID: 2, Name: 'Busan', CountryCode: 'KOR', District: 'Busan', Population: 3678555 },
    { ID: 3, Name: 'Incheon', CountryCode: 'KOR', District: 'Incheon', Population: 2954955 }
  ];

  // GET /api/users - 모든 사용자
  if (pathname === '/api/users' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(dummyUsers));
    return;
  }

  // GET /api/users/:id - 특정 사용자
  const idMatch = pathname.match(/^\/api\/users\/(\d+)$/);
  if (idMatch && method === 'GET') {
    const id = parseInt(idMatch[1]);
    const user = dummyUsers.find(u => u.ID === id);
    
    if (user) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(user));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'User not found' }));
    }
    return;
  }

  // POST /api/users - 새 사용자 생성
  if (pathname === '/api/users' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const newUser = JSON.parse(body);
        newUser.ID = dummyUsers.length + 1;
        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ message: 'User created', id: newUser.ID }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // 지원하지 않는 메소드
  res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

const port = 3001;
server.listen(port, () => {
  console.log(`🚀 Pure Node.js HTTP server listening on port ${port}`);
  console.log(`📡 API: http://localhost:${port}/api/users`);
  console.log(`🌐 Web: http://localhost:${port}`);
});

export default server;
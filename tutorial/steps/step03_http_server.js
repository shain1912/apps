// ==========================================================
// 3단계A: 순수 Node.js HTTP 서버
// ==========================================================
// 학습 목표:
// 1. 순수 Node.js HTTP 모듈로 서버 구현
// 2. Express와 비교하여 복잡성 차이 이해
// 3. 라우팅, 정적 파일, JSON 파싱을 수동으로 구현

import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;

// ==========================================================
// 순수 HTTP 서버 구현 (복잡함!)
// ==========================================================

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  console.log(`${method} ${pathname}`);

  // CORS 헤더 수동 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // 📍 라우팅 1: 홈페이지
  if (pathname === '/' && method === 'GET') {
    res.writeHead(200);
    res.end(`
      <h1>🔥 순수 Node.js HTTP 서버</h1>
      <p>Express 없이 직접 구현한 서버입니다.</p>
      <ul>
        <li><a href="/about">About 페이지</a></li>
        <li><a href="/api/users">사용자 API</a></li>
        <li><a href="/compare">Express 비교</a></li>
      </ul>
      <p><strong>포트:</strong> ${PORT}</p>
    `);
    return;
  }

  // 📍 라우팅 2: About 페이지
  if (pathname === '/about' && method === 'GET') {
    res.writeHead(200);
    res.end(`
      <h1>📚 About</h1>
      <p>순수 Node.js HTTP 서버로 구현했습니다.</p>
      <pre style="background: #f4f4f4; padding: 15px;">
// 라우팅을 이렇게 해야 함!
if (pathname === '/about' && method === 'GET') {
  res.writeHead(200);
  res.end('HTML 내용');
}
      </pre>
      <a href="/">← 홈으로</a>
    `);
    return;
  }

  // 📍 라우팅 3: API 엔드포인트
  if (pathname === '/api/users' && method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'HTTP 서버에서 JSON 응답',
      users: [
        { id: 1, name: '김철수' },
        { id: 2, name: '이영희' }
      ],
      note: 'JSON.stringify()로 수동 변환'
    }, null, 2));
    return;
  }

  // 📍 라우팅 4: POST 요청 처리 (JSON 파싱 수동)
  if (pathname === '/api/users' && method === 'POST') {
    let body = '';
    
    // 데이터 수신
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    // 요청 완료
    req.on('end', () => {
      try {
        const data = JSON.parse(body); // 수동 파싱!
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(201);
        res.end(JSON.stringify({
          message: '사용자 생성됨 (HTTP 서버)',
          data: data,
          note: 'JSON 파싱을 직접 해야 함'
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: '잘못된 JSON' }));
      }
    });
    return;
  }

  // 📍 라우팅 5: Express 비교 페이지
  if (pathname === '/compare' && method === 'GET') {
    res.writeHead(200);
    res.end(`
      <h1>🔄 HTTP vs Express 비교</h1>
      
      <div style="display: flex; gap: 20px;">
        <div style="border: 2px solid #ff6b6b; padding: 20px; border-radius: 8px;">
          <h2>😰 순수 HTTP (복잡함)</h2>
          <pre style="background: #fff5f5; padding: 10px; font-size: 12px;">
// 라우팅
if (pathname === '/users' && method === 'GET') {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(data));
}

// JSON 파싱
let body = '';
req.on('data', chunk => body += chunk);
req.on('end', () => {
  const data = JSON.parse(body);
  // 처리...
});

// 헤더 설정
res.setHeader('Content-Type', 'application/json');
res.writeHead(200);
          </pre>
          <p>❌ 모든 것을 수동으로 구현</p>
          <p>❌ 코드가 길고 복잡</p>
          <p>❌ 에러 처리 어려움</p>
        </div>
        
        <div style="border: 2px solid #4ecdc4; padding: 20px; border-radius: 8px;">
          <h2>😎 Express (간단함)</h2>
          <pre style="background: #f0fdfa; padding: 10px; font-size: 12px;">
// 라우팅
app.get('/users', (req, res) => {
  res.json(data);
});

// JSON 파싱
app.use(express.json()); // 한 줄!

// POST 처리
app.post('/users', (req, res) => {
  const data = req.body; // 자동 파싱!
  res.json({ success: true });
});
          </pre>
          <p>✅ 간단하고 직관적</p>
          <p>✅ 자동 파싱/헤더</p>
          <p>✅ 미들웨어 시스템</p>
        </div>
      </div>
      
      <h3>🎯 결론: Express를 쓰는 이유</h3>
      <ul>
        <li><strong>생산성:</strong> 10줄 → 1줄</li>
        <li><strong>안정성:</strong> 검증된 라이브러리</li>
        <li><strong>확장성:</strong> 미들웨어 생태계</li>
        <li><strong>유지보수:</strong> 읽기 쉬운 코드</li>
      </ul>
      
      <p><a href="/">← 홈으로</a></p>
    `);
    return;
  }

  // 📍 404 Not Found
  res.writeHead(404);
  res.end(`
    <h1>404 - 페이지를 찾을 수 없습니다</h1>
    <p>요청: ${method} ${pathname}</p>
    <p>이것도 수동으로 처리해야 합니다!</p>
    <a href="/">← 홈으로</a>
  `);
});

// ==========================================================
// 서버 시작
// ==========================================================

server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🔥 순수 Node.js HTTP 서버 시작!');
  console.log(`📍 주소: http://localhost:${PORT}`);
  console.log(`🔗 비교: http://localhost:${PORT}/compare`);
  console.log('💡 Express 서버와 비교해보세요!');
  console.log('='.repeat(60));
});

// ==========================================================
// 실행 방법:
// node tutorial/steps/step03_http_server.js
//
// 그 다음에 Express 버전도 실행:
// node tutorial/steps/step03_express_server.js
// ==========================================================
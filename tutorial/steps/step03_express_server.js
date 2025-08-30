// ==========================================================
// 3단계B: Express 서버 (비교용)
// ==========================================================
// 학습 목표:
// 1. 같은 기능을 Express로 구현
// 2. 코드 간결성 비교
// 3. Express의 장점 체감

import express from 'express';

const app = express();
const PORT = 3002;

// ==========================================================
// Express 미들웨어 (한 줄로 해결!)
// ==========================================================

// JSON 파싱 미들웨어 - 자동으로 req.body에 파싱된 데이터
app.use(express.json());

// URL 인코딩 파싱
app.use(express.urlencoded({ extended: true }));

// ==========================================================
// Express 라우팅 (간단함!)
// ==========================================================

// 📍 라우팅 1: 홈페이지
app.get('/', (req, res) => {
  res.send(`
    <h1>⚡ Express 서버</h1>
    <p>Express로 구현한 같은 기능의 서버입니다.</p>
    <ul>
      <li><a href="/about">About 페이지</a></li>
      <li><a href="/api/users">사용자 API</a></li>
      <li><a href="/compare">HTTP 비교</a></li>
    </ul>
    <p><strong>포트:</strong> ${PORT}</p>
    <p>🚀 훨씬 간단한 코드로 같은 기능!</p>
  `);
});

// 📍 라우팅 2: About 페이지
app.get('/about', (req, res) => {
  res.send(`
    <h1>⚡ About (Express)</h1>
    <p>Express로 구현한 About 페이지입니다.</p>
    <pre style="background: #f0f8f8; padding: 15px;">
// Express는 이렇게 간단!
app.get('/about', (req, res) => {
  res.send('HTML 내용');
});
    </pre>
    <p>✅ <strong>HTTP 서버 대비:</strong></p>
    <ul>
      <li>if문 체인 → 깔끔한 라우팅</li>
      <li>수동 헤더 → 자동 처리</li>
      <li>복잡한 응답 → res.send() 한 번</li>
    </ul>
    <a href="/">← 홈으로</a>
  `);
});

// 📍 라우팅 3: GET API
app.get('/api/users', (req, res) => {
  // JSON 응답이 이렇게 간단!
  res.json({
    message: 'Express에서 JSON 응답',
    users: [
      { id: 1, name: '김철수' },
      { id: 2, name: '이영희' }
    ],
    note: 'res.json()으로 자동 변환!'
  });
});

// 📍 라우팅 4: POST API (JSON 자동 파싱!)
app.post('/api/users', (req, res) => {
  // req.body에 이미 파싱된 JSON이 들어있음!
  const userData = req.body;
  
  res.status(201).json({
    message: '사용자 생성됨 (Express)',
    data: userData,
    note: 'JSON 파싱이 자동으로 완료됨!'
  });
});

// 📍 라우팅 5: 비교 페이지
app.get('/compare', (req, res) => {
  res.send(`
    <h1>⚡ Express의 장점</h1>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div style="border: 2px solid #ff6b6b; padding: 20px; border-radius: 8px;">
        <h2>😰 순수 HTTP 서버</h2>
        <h3>📝 코드량</h3>
        <ul>
          <li>라우팅: 10+ 줄</li>
          <li>JSON 파싱: 8+ 줄</li>
          <li>에러 처리: 5+ 줄</li>
          <li>헤더 설정: 매번 수동</li>
        </ul>
        <h3>😅 문제점</h3>
        <ul>
          <li>반복적인 boilerplate</li>
          <li>에러 처리 복잡</li>
          <li>확장성 부족</li>
          <li>유지보수 어려움</li>
        </ul>
      </div>
      
      <div style="border: 2px solid #4ecdc4; padding: 20px; border-radius: 8px;">
        <h2>😎 Express 서버</h2>
        <h3>⚡ 코드량</h3>
        <ul>
          <li>라우팅: 1줄</li>
          <li>JSON 파싱: 1줄</li>
          <li>에러 처리: 자동</li>
          <li>헤더 설정: 자동</li>
        </ul>
        <h3>🚀 장점</h3>
        <ul>
          <li>간결한 문법</li>
          <li>미들웨어 생태계</li>
          <li>자동 최적화</li>
          <li>커뮤니티 지원</li>
        </ul>
      </div>
    </div>
    
    <div style="background: #e8f5e8; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3>🎯 속도 비교</h3>
      <p><strong>같은 기능 구현 시간:</strong></p>
      <ul>
        <li>순수 HTTP: 2-3시간</li>
        <li>Express: 10-15분</li>
      </ul>
      <p><strong>결론:</strong> Express는 개발 생산성을 10배 이상 높입니다!</p>
    </div>
    
    <a href="/">← 홈으로</a>
  `);
});

// ==========================================================
// 404 에러 처리 (Express는 이것도 간단!)
// ==========================================================

app.use('*', (req, res) => {
  res.status(404).send(`
    <h1>404 - Express에서 처리한 에러</h1>
    <p>요청: ${req.method} ${req.originalUrl}</p>
    <p>✅ Express가 자동으로 에러 처리!</p>
    <a href="/">← 홈으로</a>
  `);
});

// ==========================================================
// 서버 시작
// ==========================================================

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('⚡ Express 서버 시작!');
  console.log(`📍 주소: http://localhost:${PORT}`);
  console.log(`🔗 비교: http://localhost:${PORT}/compare`);
  console.log('💡 HTTP 서버와 코드를 비교해보세요!');
  console.log('='.repeat(60));
});

// ==========================================================
// 실행 방법:
// node tutorial/steps/step03_express_server.js
//
// 동시에 두 서버를 실행해서 비교:
// HTTP 서버: http://localhost:3001
// Express 서버: http://localhost:3002
// ==========================================================
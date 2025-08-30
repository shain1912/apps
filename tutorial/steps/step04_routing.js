// ==========================================================
// 4단계: Express 라우팅 완전 정복
// ==========================================================
// 학습 목표:
// 1. HTTP 메소드별 라우팅 (GET, POST, PUT, DELETE)
// 2. 경로 매개변수 (:id) 사용법
// 3. 쿼리 스트링 처리
// 4. 라우터 분리 방법

import express from 'express';

const app = express();
const PORT = 3000;

// JSON 파싱 미들웨어
app.use(express.json());

// ==========================================================
// 더미 데이터 (실제로는 데이터베이스)
// ==========================================================

let users = [
  { id: 1, name: '김철수', email: 'kim@example.com', age: 25 },
  { id: 2, name: '이영희', email: 'lee@example.com', age: 30 },
  { id: 3, name: '박민수', email: 'park@example.com', age: 28 }
];

let nextId = 4;

// ==========================================================
// 1. 기본 라우팅
// ==========================================================

app.get('/', (req, res) => {
  res.send(`
    <h1>🛣️ Express 라우팅 학습</h1>
    <h2>📚 학습 내용:</h2>
    <ul>
      <li><a href="/users">사용자 목록 (GET)</a></li>
      <li><a href="/users/1">특정 사용자 (GET :id)</a></li>
      <li><a href="/search?q=김&age=25">검색 (쿼리스트링)</a></li>
      <li><a href="/demo">라우팅 데모 페이지</a></li>
    </ul>
    
    <h2>🔧 API 테스트:</h2>
    <p>Postman이나 curl로 테스트:</p>
    <ul>
      <li><strong>GET</strong> /api/users - 모든 사용자</li>
      <li><strong>POST</strong> /api/users - 사용자 생성</li>
      <li><strong>PUT</strong> /api/users/:id - 사용자 수정</li>
      <li><strong>DELETE</strong> /api/users/:id - 사용자 삭제</li>
    </ul>
  `);
});

// ==========================================================
// 2. GET 라우팅 - 데이터 조회
// ==========================================================

// 모든 사용자 조회
app.get('/users', (req, res) => {
  res.send(`
    <h1>👥 사용자 목록</h1>
    <ul>
      ${users.map(user => `
        <li>
          <a href="/users/${user.id}">
            ${user.name} (${user.email})
          </a>
        </li>
      `).join('')}
    </ul>
    <a href="/">← 홈으로</a>
  `);
});

// 특정 사용자 조회 (경로 매개변수 :id 사용)
app.get('/users/:id', (req, res) => {
  // req.params로 경로 매개변수 접근
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).send(`
      <h1>❌ 사용자를 찾을 수 없습니다</h1>
      <p>ID: ${userId}</p>
      <a href="/users">← 사용자 목록</a>
    `);
  }
  
  res.send(`
    <h1>👤 사용자 정보</h1>
    <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
      <h2>${user.name}</h2>
      <p><strong>ID:</strong> ${user.id}</p>
      <p><strong>이메일:</strong> ${user.email}</p>
      <p><strong>나이:</strong> ${user.age}</p>
    </div>
    <br>
    <a href="/users">← 사용자 목록</a>
  `);
});

// ==========================================================
// 3. 쿼리 스트링 처리
// ==========================================================

app.get('/search', (req, res) => {
  // req.query로 쿼리 스트링 접근
  const { q, age, limit } = req.query;
  
  let results = users;
  
  // 이름으로 검색
  if (q) {
    results = results.filter(user => 
      user.name.toLowerCase().includes(q.toLowerCase())
    );
  }
  
  // 나이로 필터링
  if (age) {
    results = results.filter(user => user.age == age);
  }
  
  // 결과 제한
  if (limit) {
    results = results.slice(0, parseInt(limit));
  }
  
  res.send(`
    <h1>🔍 검색 결과</h1>
    <p><strong>검색어:</strong> ${q || '없음'}</p>
    <p><strong>나이 필터:</strong> ${age || '없음'}</p>
    <p><strong>제한:</strong> ${limit || '없음'}</p>
    
    <h3>결과 (${results.length}명):</h3>
    <ul>
      ${results.map(user => `
        <li>${user.name} - ${user.email} (${user.age}세)</li>
      `).join('')}
    </ul>
    
    <h3>📝 쿼리스트링 예시:</h3>
    <ul>
      <li><a href="/search?q=김">이름에 '김' 포함</a></li>
      <li><a href="/search?age=25">25세</a></li>
      <li><a href="/search?q=이&age=30">이름에 '이' + 30세</a></li>
      <li><a href="/search?limit=2">결과 2개만</a></li>
    </ul>
    
    <a href="/">← 홈으로</a>
  `);
});

// ==========================================================
// 4. RESTful API 라우팅
// ==========================================================

// GET - 모든 사용자 (JSON)
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    count: users.length,
    data: users
  });
});

// GET - 특정 사용자 (JSON)
app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '사용자를 찾을 수 없습니다'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
});

// POST - 사용자 생성
app.post('/api/users', (req, res) => {
  const { name, email, age } = req.body;
  
  // 입력 검증
  if (!name || !email || !age) {
    return res.status(400).json({
      success: false,
      message: '이름, 이메일, 나이는 필수입니다'
    });
  }
  
  const newUser = {
    id: nextId++,
    name,
    email,
    age: parseInt(age)
  };
  
  users.push(newUser);
  
  res.status(201).json({
    success: true,
    message: '사용자가 생성되었습니다',
    data: newUser
  });
});

// PUT - 사용자 수정
app.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '사용자를 찾을 수 없습니다'
    });
  }
  
  const { name, email, age } = req.body;
  
  // 기존 데이터 업데이트
  if (name) users[userIndex].name = name;
  if (email) users[userIndex].email = email;
  if (age) users[userIndex].age = parseInt(age);
  
  res.json({
    success: true,
    message: '사용자 정보가 수정되었습니다',
    data: users[userIndex]
  });
});

// DELETE - 사용자 삭제
app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '사용자를 찾을 수 없습니다'
    });
  }
  
  const deletedUser = users.splice(userIndex, 1)[0];
  
  res.json({
    success: true,
    message: '사용자가 삭제되었습니다',
    data: deletedUser
  });
});

// ==========================================================
// 5. 라우팅 데모 페이지
// ==========================================================

app.get('/demo', (req, res) => {
  res.send(`
    <h1>🛣️ 라우팅 패턴 데모</h1>
    
    <h2>1. 경로 매개변수 (:parameter)</h2>
    <ul>
      <li><a href="/demo/products/123">/demo/products/:id → 123</a></li>
      <li><a href="/demo/category/electronics/item/laptop">/demo/category/:cat/item/:item</a></li>
    </ul>
    
    <h2>2. 와일드카드 (*)</h2>
    <ul>
      <li><a href="/demo/wildcard/any/path/here">/demo/wildcard/* → any/path/here</a></li>
    </ul>
    
    <h2>3. 정규식 패턴</h2>
    <ul>
      <li><a href="/demo/number/123">/demo/number/:id(\\\\d+) → 숫자만</a></li>
    </ul>
    
    <a href="/">← 홈으로</a>
  `);
});

// 데모 라우트들
app.get('/demo/products/:id', (req, res) => {
  res.json({ 
    route: '/demo/products/:id',
    params: req.params,
    message: '상품 ID: ' + req.params.id 
  });
});

app.get('/demo/category/:category/item/:item', (req, res) => {
  res.json({
    route: '/demo/category/:category/item/:item',
    params: req.params,
    message: `카테고리: ${req.params.category}, 아이템: ${req.params.item}`
  });
});

app.get('/demo/wildcard/*', (req, res) => {
  res.json({
    route: '/demo/wildcard/*',
    wildcard: req.params[0],
    message: '와일드카드 경로: ' + req.params[0]
  });
});

// 정규식: 숫자만 허용
app.get('/demo/number/:id(\\d+)', (req, res) => {
  res.json({
    route: '/demo/number/:id(\\d+)',
    params: req.params,
    message: '숫자 ID: ' + req.params.id
  });
});

// ==========================================================
// 서버 시작
// ==========================================================

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🛣️ Express 라우팅 서버 시작!');
  console.log(`📍 주소: http://localhost:${PORT}`);
  console.log('');
  console.log('📚 학습 포인트:');
  console.log('1. HTTP 메소드 (GET, POST, PUT, DELETE)');
  console.log('2. 경로 매개변수 (:id)');
  console.log('3. 쿼리 스트링 (?key=value)');
  console.log('4. RESTful API 설계');
  console.log('='.repeat(60));
});

// ==========================================================
// 실행 방법:
// cp tutorial/steps/step04_routing.js app.js
// npm run dev
//
// 테스트 예시 (Postman/curl):
// curl -X POST http://localhost:3000/api/users \
//   -H "Content-Type: application/json" \
//   -d '{"name":"홍길동","email":"hong@test.com","age":35}'
// ==========================================================
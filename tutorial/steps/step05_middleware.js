// ==========================================================
// 5단계: Express 미들웨어 완전 정복
// ==========================================================
// 학습 목표:
// 1. 미들웨어의 개념과 작동 원리
// 2. 커스텀 미들웨어 작성
// 3. 미들웨어 체이닝과 next() 사용
// 4. 에러 처리 미들웨어

import express from 'express';

const app = express();
const PORT = 3000;

// ==========================================================
// 1. 기본 미들웨어들
// ==========================================================

// JSON 파싱 미들웨어
app.use(express.json());

// URL 인코딩 파싱 미들웨어
app.use(express.urlencoded({ extended: true }));

// ==========================================================
// 2. 커스텀 미들웨어 작성
// ==========================================================

// 📝 로깅 미들웨어
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.get('User-Agent');
  
  console.log(`[${timestamp}] ${method} ${url}`);
  console.log(`User-Agent: ${userAgent}`);
  console.log('-'.repeat(50));
  
  // ⭐ next() 호출로 다음 미들웨어로 진행
  next();
};

// 🕐 응답 시간 측정 미들웨어
const responseTime = (req, res, next) => {
  const start = Date.now();
  
  // res.on()으로 응답 완료 시점에 콜백 등록
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`⏱️ 응답 시간: ${duration}ms`);
  });
  
  next();
};

// 🔐 간단한 인증 미들웨어
const authenticate = (req, res, next) => {
  const token = req.get('Authorization');
  
  if (!token) {
    return res.status(401).json({
      error: '인증이 필요합니다',
      message: 'Authorization 헤더를 포함해주세요'
    });
  }
  
  // 간단한 토큰 검증 (실제로는 JWT 등 사용)
  if (token === 'Bearer valid-token') {
    req.user = { id: 1, name: '김철수' };
    next();
  } else {
    return res.status(401).json({
      error: '잘못된 토큰입니다'
    });
  }
};

// 📊 요청 카운터 미들웨어
let requestCount = 0;
const counter = (req, res, next) => {
  requestCount++;
  req.requestNumber = requestCount;
  next();
};

// ==========================================================
// 3. 전역 미들웨어 등록
// ==========================================================

// 모든 요청에 적용
app.use(logger);
app.use(responseTime);
app.use(counter);

// ==========================================================
// 4. 라우트별 미들웨어 적용
// ==========================================================

// 홈페이지
app.get('/', (req, res) => {
  res.send(`
    <h1>🔧 Express 미들웨어 학습</h1>
    <p><strong>요청 번호:</strong> ${req.requestNumber}</p>
    
    <h2>📚 미들웨어 예시:</h2>
    <ul>
      <li><a href="/public">공개 페이지</a></li>
      <li><a href="/protected">보호된 페이지 (인증 필요)</a></li>
      <li><a href="/chain">미들웨어 체인</a></li>
      <li><a href="/error">에러 테스트</a></li>
    </ul>
    
    <h2>🔐 인증 테스트:</h2>
    <p>Authorization: Bearer valid-token</p>
    
    <h2>📊 현재 상태:</h2>
    <ul>
      <li>총 요청 수: ${requestCount}</li>
      <li>서버 시작 시간: 방금 전</li>
    </ul>
  `);
});

// 공개 페이지 (미들웨어 없음)
app.get('/public', (req, res) => {
  res.json({
    message: '공개 페이지입니다',
    requestNumber: req.requestNumber,
    middleware: ['logger', 'responseTime', 'counter']
  });
});

// 보호된 페이지 (인증 미들웨어 적용)
app.get('/protected', authenticate, (req, res) => {
  res.json({
    message: '보호된 페이지에 접근했습니다!',
    user: req.user,
    requestNumber: req.requestNumber,
    middleware: ['logger', 'responseTime', 'counter', 'authenticate']
  });
});

// ==========================================================
// 5. 미들웨어 체이닝 예시
// ==========================================================

// 여러 미들웨어를 체인으로 연결
const validateInput = (req, res, next) => {
  const { name, age } = req.body;
  
  if (!name || !age) {
    return res.status(400).json({
      error: '이름과 나이는 필수입니다'
    });
  }
  
  if (age < 0 || age > 120) {
    return res.status(400).json({
      error: '올바른 나이를 입력해주세요 (0-120)'
    });
  }
  
  next();
};

const sanitizeInput = (req, res, next) => {
  if (req.body.name) {
    req.body.name = req.body.name.trim();
  }
  next();
};

const addTimestamp = (req, res, next) => {
  req.body.createdAt = new Date().toISOString();
  next();
};

// 미들웨어 체인 적용
app.post('/chain', 
  authenticate, 
  validateInput, 
  sanitizeInput, 
  addTimestamp, 
  (req, res) => {
    res.json({
      message: '모든 미들웨어를 통과했습니다!',
      data: req.body,
      user: req.user,
      middlewareChain: [
        'authenticate',
        'validateInput', 
        'sanitizeInput',
        'addTimestamp'
      ]
    });
  }
);

// 체인 설명 페이지
app.get('/chain', (req, res) => {
  res.send(`
    <h1>⛓️ 미들웨어 체이닝</h1>
    
    <h2>💡 실행 순서:</h2>
    <ol>
      <li><strong>authenticate</strong> - 인증 확인</li>
      <li><strong>validateInput</strong> - 입력값 검증</li>
      <li><strong>sanitizeInput</strong> - 입력값 정제</li>
      <li><strong>addTimestamp</strong> - 타임스탬프 추가</li>
      <li><strong>최종 핸들러</strong> - 응답 처리</li>
    </ol>
    
    <h2>🧪 테스트 방법:</h2>
    <pre style="background: #f4f4f4; padding: 15px;">
curl -X POST http://localhost:3000/chain \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer valid-token" \\
  -d '{"name":"홍길동","age":30}'
    </pre>
    
    <p>❌ <strong>실패 케이스:</strong></p>
    <ul>
      <li>Authorization 헤더 없음 → 401</li>
      <li>잘못된 토큰 → 401</li>
      <li>name 없음 → 400</li>
      <li>나이가 음수 → 400</li>
    </ul>
    
    <a href="/">← 홈으로</a>
  `);
});

// ==========================================================
// 6. 에러 처리 미들웨어
// ==========================================================

// 에러를 발생시키는 라우트
app.get('/error', (req, res, next) => {
  // 의도적으로 에러 발생
  const error = new Error('의도적인 에러입니다!');
  error.status = 500;
  next(error); // 에러를 next()로 전달
});

// 비동기 에러 예시
app.get('/async-error', async (req, res, next) => {
  try {
    // 비동기 작업 시뮬레이션
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('비동기 작업 실패!'));
      }, 1000);
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================================
// 7. 404 처리 미들웨어
// ==========================================================

// 모든 라우트 다음에 위치
app.use((req, res, next) => {
  res.status(404).json({
    error: '페이지를 찾을 수 없습니다',
    path: req.originalUrl,
    method: req.method,
    suggestion: '올바른 URL을 확인해주세요'
  });
});

// ==========================================================
// 8. 에러 처리 미들웨어 (맨 마지막에 위치!)
// ==========================================================

app.use((err, req, res, next) => {
  console.error('🚨 에러 발생:');
  console.error(err.stack);
  
  const status = err.status || 500;
  const message = err.message || '서버 내부 오류';
  
  res.status(status).json({
    error: message,
    status: status,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    // 개발 환경에서만 스택 트레이스 포함
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==========================================================
// 서버 시작
// ==========================================================

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🔧 Express 미들웨어 서버 시작!');
  console.log(`📍 주소: http://localhost:${PORT}`);
  console.log('');
  console.log('📚 학습 포인트:');
  console.log('1. 미들웨어 작동 원리와 next()');
  console.log('2. 커스텀 미들웨어 작성');
  console.log('3. 미들웨어 체이닝');
  console.log('4. 에러 처리 미들웨어');
  console.log('');
  console.log('🔐 테스트 토큰: Bearer valid-token');
  console.log('='.repeat(60));
});

// ==========================================================
// 실행 방법:
// cp tutorial/steps/step05_middleware.js app.js
// npm run dev
//
// 테스트 예시:
// curl -H "Authorization: Bearer valid-token" \
//   http://localhost:3000/protected
// ==========================================================
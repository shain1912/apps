// ==========================================================
// 1단계: Express 기본 서버 구조
// ==========================================================
// 학습 목표:
// 1. Express 서버의 기본 구조 이해
// 2. 포트 설정과 서버 시작 방법
// 3. 간단한 라우트 작성

// Express 모듈 가져오기 (CommonJS 방식)
const express = require('express');

// Express 애플리케이션 인스턴스 생성
const app = express();

// 포트 번호 설정 (환경변수 또는 기본값 3000)
const PORT = process.env.PORT || 3000;

// ==========================================================
// 기본 라우트 설정
// ==========================================================

// GET 요청 처리: 루트 경로 ('/')
app.get('/', (req, res) => {
  res.send('<h1>🎉 Express 서버 시작!</h1><p>첫 번째 Express 애플리케이션입니다.</p>');
});

// GET 요청 처리: About 페이지
app.get('/about', (req, res) => {
  res.send('<h1>📚 About</h1><p>Node.js Express 강의 1단계입니다.</p>');
});

// JSON 응답 예시
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from Express!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ==========================================================
// 서버 시작
// ==========================================================

// 지정된 포트에서 서버 시작
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 Express 서버가 시작되었습니다!');
  console.log(`📍 주소: http://localhost:${PORT}`);
  console.log(`⏰ 시작 시간: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50));
});

// ==========================================================
// 예상 결과:
// 1. http://localhost:3000 → HTML 응답
// 2. http://localhost:3000/about → About 페이지
// 3. http://localhost:3000/api/hello → JSON 응답
// ==========================================================
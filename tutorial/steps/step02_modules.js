// ==========================================================
// 2단계: CommonJS → ES Modules 변환
// ==========================================================
// 학습 목표:
// 1. CommonJS와 ES Modules의 차이점 이해
// 2. require() → import 변환
// 3. module.exports → export 변환
// 4. package.json의 "type": "module" 설정

// ES Modules 방식으로 Express 가져오기
import express from 'express';

// Express 애플리케이션 인스턴스 생성
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================================
// ES Modules vs CommonJS 비교
// ==========================================================

/* 
CommonJS (구방식):
const express = require('express');
module.exports = app;

ES Modules (신방식):
import express from 'express';
export default app;
*/

// ==========================================================
// 라우트 설정
// ==========================================================

// 루트 경로
app.get('/', (req, res) => {
  res.send(`
    <h1>📦 ES Modules 사용</h1>
    <p>CommonJS에서 ES Modules로 변환했습니다!</p>
    <ul>
      <li><strong>이전:</strong> const express = require('express')</li>
      <li><strong>현재:</strong> import express from 'express'</li>
    </ul>
    <p>📝 package.json에 "type": "module" 추가 필요</p>
  `);
});

// 모듈 정보 API
app.get('/api/modules', (req, res) => {
  res.json({
    moduleSystem: 'ES Modules',
    features: [
      'import/export 구문',
      'Top-level await 지원',
      'Tree shaking 최적화',
      '정적 분석 가능'
    ],
    advantages: [
      '표준 문법',
      '더 나은 성능',
      '현대적 개발 도구 지원'
    ]
  });
});

// 비교 페이지
app.get('/compare', (req, res) => {
  res.send(`
    <h1>🔄 CommonJS vs ES Modules</h1>
    
    <div style="display: flex; gap: 20px;">
      <div style="border: 1px solid #ccc; padding: 20px; border-radius: 5px;">
        <h2>CommonJS (구방식)</h2>
        <pre style="background: #f4f4f4; padding: 10px;">
// 가져오기
const express = require('express');
const fs = require('fs');

// 내보내기
module.exports = app;
        </pre>
      </div>
      
      <div style="border: 1px solid #ccc; padding: 20px; border-radius: 5px;">
        <h2>ES Modules (신방식)</h2>
        <pre style="background: #f4f4f4; padding: 10px;">
// 가져오기
import express from 'express';
import fs from 'fs';

// 내보내기
export default app;
        </pre>
      </div>
    </div>
    
    <h3>✅ ES Modules의 장점:</h3>
    <ul>
      <li>JavaScript 표준 문법</li>
      <li>정적 분석으로 더 나은 최적화</li>
      <li>Tree shaking 지원 (사용하지 않는 코드 제거)</li>
      <li>Top-level await 지원</li>
      <li>현대적 번들러와의 호환성</li>
    </ul>
  `);
});

// ==========================================================
// 서버 시작
// ==========================================================

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('📦 ES Modules Express 서버가 시작되었습니다!');
  console.log(`📍 주소: http://localhost:${PORT}`);
  console.log(`🔗 비교: http://localhost:${PORT}/compare`);
  console.log(`🔗 API: http://localhost:${PORT}/api/modules`);
  console.log('='.repeat(60));
});

// ES Modules에서 앱을 내보내기 (다른 파일에서 import 가능)
export default app;

// ==========================================================
// 이 파일을 사용하려면:
// 1. package.json에 "type": "module" 추가
// 2. node step02_modules.js 실행
// ==========================================================
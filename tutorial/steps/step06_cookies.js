// ==========================================================
// 6단계: 쿠키 사용법 완전 정복
// ==========================================================
// 학습 목표:
// 1. 쿠키의 개념과 사용법
// 2. cookie-parser 미들웨어 사용
// 3. 쿠키 옵션 설정 (secure, httpOnly, maxAge 등)
// 4. 쿠키 기반 사용자 설정 저장

import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 3000;

// ==========================================================
// 필수 미들웨어 설정
// ==========================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🍪 cookie-parser 미들웨어 (signed cookie용 secret 설정)
app.use(cookieParser('my-secret-key'));

// ==========================================================
// 더미 데이터
// ==========================================================

const users = [
  { id: 1, name: '김철수', email: 'kim@example.com' },
  { id: 2, name: '이영희', email: 'lee@example.com' },
  { id: 3, name: '박민수', email: 'park@example.com' }
];

// ==========================================================
// 쿠키 학습 페이지들
// ==========================================================

app.get('/', (req, res) => {
  const visitCount = parseInt(req.cookies.visitCount || 0) + 1;
  const lastVisit = req.cookies.lastVisit;
  const username = req.cookies.username;
  const theme = req.cookies.theme || 'light';
  
  // 방문 횟수 쿠키 업데이트
  res.cookie('visitCount', visitCount, { 
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  });
  
  // 마지막 방문 시간 업데이트
  res.cookie('lastVisit', new Date().toISOString());
  
  const themeStyle = theme === 'dark' 
    ? 'background: #333; color: white;' 
    : 'background: white; color: black;';
    
  res.send(`
    <div style="${themeStyle} padding: 20px; min-height: 100vh;">
      <h1>🍪 Express 쿠키 학습</h1>
      
      <div style="border: 1px solid #ccc; padding: 15px; margin: 20px 0; border-radius: 8px;">
        <h3>🔍 현재 쿠키 정보:</h3>
        <ul>
          <li><strong>방문 횟수:</strong> ${visitCount}회</li>
          <li><strong>마지막 방문:</strong> ${lastVisit || '처음 방문'}</li>
          <li><strong>사용자명:</strong> ${username || '미설정'}</li>
          <li><strong>테마:</strong> ${theme}</li>
        </ul>
      </div>
      
      <h2>📚 쿠키 기능 테스트:</h2>
      <ul>
        <li><a href="/set-username">사용자명 설정</a></li>
        <li><a href="/theme/dark">다크 테마 적용</a></li>
        <li><a href="/theme/light">라이트 테마 적용</a></li>
        <li><a href="/login-form">로그인 (Remember Me)</a></li>
        <li><a href="/secure-cookies">보안 쿠키 테스트</a></li>
        <li><a href="/clear-cookies">모든 쿠키 삭제</a></li>
      </ul>
      
      <h2>🔧 개발자 도구:</h2>
      <ul>
        <li><a href="/show-cookies">모든 쿠키 보기</a></li>
        <li><a href="/cookie-info">쿠키 상세 정보</a></li>
      </ul>
    </div>
  `);
});

// ==========================================================
// 기본 쿠키 설정/읽기
// ==========================================================

// 사용자명 설정 폼
app.get('/set-username', (req, res) => {
  const currentUsername = req.cookies.username || '';
  
  res.send(`
    <h1>👤 사용자명 설정</h1>
    <form method="POST" action="/set-username">
      <input type="text" name="username" placeholder="사용자명을 입력하세요" 
             value="${currentUsername}" required>
      <button type="submit">설정</button>
    </form>
    
    <h3>🍪 쿠키 설정 옵션:</h3>
    <ul>
      <li><strong>maxAge:</strong> 7일간 유지</li>
      <li><strong>httpOnly:</strong> JavaScript 접근 불가</li>
      <li><strong>secure:</strong> HTTPS에서만 전송</li>
    </ul>
    
    <a href="/">← 홈으로</a>
  `);
});

// 사용자명 설정 처리
app.post('/set-username', (req, res) => {
  const { username } = req.body;
  
  // 쿠키 설정 (7일간 유지, httpOnly)
  res.cookie('username', username, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    httpOnly: true, // JavaScript 접근 불가
    // secure: true, // HTTPS에서만 전송 (개발 시 주석)
    sameSite: 'strict' // CSRF 방지
  });
  
  res.redirect('/');
});

// ==========================================================
// 테마 설정 (쿠키 활용)
// ==========================================================

app.get('/theme/:themeName', (req, res) => {
  const { themeName } = req.params;
  
  if (!['light', 'dark'].includes(themeName)) {
    return res.status(400).send('지원하지 않는 테마입니다.');
  }
  
  // 테마 쿠키 설정 (1년간 유지)
  res.cookie('theme', themeName, {
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1년
    httpOnly: false // CSS에서 접근 가능하도록
  });
  
  res.redirect('/');
});

// ==========================================================
// 로그인 예시 (Remember Me 쿠키)
// ==========================================================

app.get('/login-form', (req, res) => {
  res.send(`
    <h1>🔐 로그인</h1>
    <form method="POST" action="/login">
      <div>
        <input type="email" name="email" placeholder="이메일" required>
      </div>
      <br>
      <div>
        <input type="password" name="password" placeholder="비밀번호" required>
      </div>
      <br>
      <div>
        <input type="checkbox" name="remember" id="remember">
        <label for="remember">로그인 상태 유지 (30일)</label>
      </div>
      <br>
      <button type="submit">로그인</button>
    </form>
    
    <h3>📝 테스트 계정:</h3>
    <ul>
      <li>kim@example.com / password123</li>
      <li>lee@example.com / password123</li>
    </ul>
    
    <a href="/">← 홈으로</a>
  `);
});

app.post('/login', (req, res) => {
  const { email, password, remember } = req.body;
  
  // 간단한 인증 (실제로는 해싱된 비밀번호 비교)
  const user = users.find(u => u.email === email);
  
  if (!user || password !== 'password123') {
    return res.status(401).send(`
      <h1>❌ 로그인 실패</h1>
      <p>이메일 또는 비밀번호가 올바르지 않습니다.</p>
      <a href="/login-form">다시 시도</a>
    `);
  }
  
  // 기본 세션 쿠키 (브라우저 종료 시 삭제)
  res.cookie('userId', user.id, { httpOnly: true });
  
  // Remember Me 체크 시 장기 쿠키 설정
  if (remember) {
    res.cookie('rememberToken', `${user.id}-${Date.now()}`, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
      httpOnly: true,
      secure: false, // 개발 환경
      sameSite: 'strict'
    });
  }
  
  res.send(`
    <h1>✅ 로그인 성공!</h1>
    <p>안녕하세요, ${user.name}님!</p>
    <p><strong>Remember Me:</strong> ${remember ? '활성화 (30일)' : '비활성화'}</p>
    
    <ul>
      <li><a href="/profile">내 프로필</a></li>
      <li><a href="/logout">로그아웃</a></li>
      <li><a href="/">홈으로</a></li>
    </ul>
  `);
});

// 프로필 페이지 (인증 필요)
app.get('/profile', (req, res) => {
  const userId = req.cookies.userId;
  const rememberToken = req.cookies.rememberToken;
  
  if (!userId && !rememberToken) {
    return res.redirect('/login-form');
  }
  
  const user = users.find(u => u.id == userId);
  
  if (!user) {
    return res.status(404).send('사용자를 찾을 수 없습니다.');
  }
  
  res.send(`
    <h1>👤 내 프로필</h1>
    <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
      <h3>${user.name}</h3>
      <p><strong>이메일:</strong> ${user.email}</p>
      <p><strong>ID:</strong> ${user.id}</p>
    </div>
    
    <h3>🍪 인증 정보:</h3>
    <ul>
      <li><strong>세션 쿠키:</strong> ${userId ? '있음' : '없음'}</li>
      <li><strong>Remember 토큰:</strong> ${rememberToken ? '있음' : '없음'}</li>
    </ul>
    
    <ul>
      <li><a href="/logout">로그아웃</a></li>
      <li><a href="/">홈으로</a></li>
    </ul>
  `);
});

// 로그아웃
app.get('/logout', (req, res) => {
  res.clearCookie('userId');
  res.clearCookie('rememberToken');
  
  res.send(`
    <h1>👋 로그아웃 완료</h1>
    <p>안전하게 로그아웃되었습니다.</p>
    <a href="/">홈으로</a>
  `);
});

// ==========================================================
// 서명된 쿠키 (Signed Cookies)
// ==========================================================

app.get('/secure-cookies', (req, res) => {
  // 서명된 쿠키 설정
  res.cookie('secureData', 'important-value', { 
    signed: true,
    maxAge: 24 * 60 * 60 * 1000
  });
  
  // 서명된 쿠키 읽기
  const secureData = req.signedCookies.secureData;
  
  res.send(`
    <h1>🔒 보안 쿠키 테스트</h1>
    
    <h3>📝 서명된 쿠키:</h3>
    <ul>
      <li><strong>설정된 값:</strong> important-value</li>
      <li><strong>읽은 값:</strong> ${secureData || '없음'}</li>
    </ul>
    
    <h3>✅ 서명된 쿠키의 장점:</h3>
    <ul>
      <li>클라이언트에서 값 변조 불가</li>
      <li>서명 검증으로 무결성 확인</li>
      <li>보안이 중요한 데이터에 사용</li>
    </ul>
    
    <h3>🔍 개발자 도구에서 확인:</h3>
    <p>Application → Cookies에서 서명된 쿠키 값을 확인해보세요.</p>
    
    <a href="/">← 홈으로</a>
  `);
});

// ==========================================================
// 개발자 도구
// ==========================================================

// 모든 쿠키 표시
app.get('/show-cookies', (req, res) => {
  res.json({
    cookies: req.cookies,
    signedCookies: req.signedCookies,
    headers: {
      cookie: req.get('Cookie')
    }
  });
});

// 쿠키 상세 정보
app.get('/cookie-info', (req, res) => {
  const cookieInfo = [];
  
  for (const [name, value] of Object.entries(req.cookies)) {
    cookieInfo.push({
      name,
      value,
      type: 'regular'
    });
  }
  
  for (const [name, value] of Object.entries(req.signedCookies)) {
    cookieInfo.push({
      name,
      value,
      type: 'signed'
    });
  }
  
  res.send(`
    <h1>🔍 쿠키 상세 정보</h1>
    
    <table border="1" style="border-collapse: collapse; width: 100%;">
      <tr>
        <th>쿠키명</th>
        <th>값</th>
        <th>타입</th>
      </tr>
      ${cookieInfo.map(cookie => `
        <tr>
          <td>${cookie.name}</td>
          <td>${cookie.value}</td>
          <td>${cookie.type}</td>
        </tr>
      `).join('')}
    </table>
    
    <h3>📊 통계:</h3>
    <ul>
      <li>일반 쿠키: ${Object.keys(req.cookies).length}개</li>
      <li>서명된 쿠키: ${Object.keys(req.signedCookies).length}개</li>
    </ul>
    
    <a href="/">← 홈으로</a>
  `);
});

// 모든 쿠키 삭제
app.get('/clear-cookies', (req, res) => {
  const cookieNames = Object.keys(req.cookies);
  const signedCookieNames = Object.keys(req.signedCookies);
  
  // 모든 일반 쿠키 삭제
  cookieNames.forEach(name => {
    res.clearCookie(name);
  });
  
  // 모든 서명된 쿠키 삭제
  signedCookieNames.forEach(name => {
    res.clearCookie(name);
  });
  
  res.send(`
    <h1>🗑️ 쿠키 삭제 완료</h1>
    <p>삭제된 쿠키: ${cookieNames.length + signedCookieNames.length}개</p>
    
    <ul>
      <li>일반 쿠키: ${cookieNames.join(', ')}</li>
      <li>서명된 쿠키: ${signedCookieNames.join(', ')}</li>
    </ul>
    
    <a href="/">← 홈으로</a>
  `);
});

// ==========================================================
// 서버 시작
// ==========================================================

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🍪 Express 쿠키 서버 시작!');
  console.log(`📍 주소: http://localhost:${PORT}`);
  console.log('');
  console.log('📚 학습 포인트:');
  console.log('1. 쿠키 설정과 읽기 (res.cookie, req.cookies)');
  console.log('2. 쿠키 옵션 (maxAge, httpOnly, secure, sameSite)');
  console.log('3. 서명된 쿠키 (cookie-parser)');
  console.log('4. Remember Me 로그인 구현');
  console.log('='.repeat(60));
});

// ==========================================================
// 실행 방법:
// npm install cookie-parser
// cp tutorial/steps/step06_cookies.js app.js
// npm run dev
//
// 브라우저 개발자 도구 → Application → Cookies에서 확인
// ==========================================================
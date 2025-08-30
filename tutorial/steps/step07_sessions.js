// ==========================================================
// 7단계: Express 세션 완전 정복
// ==========================================================
// 학습 목표:
// 1. 세션의 개념과 쿠키의 차이점
// 2. express-session 미들웨어 사용
// 3. 세션 저장소 설정 (메모리, Redis, MongoDB)
// 4. 세션 기반 인증 구현

import express from 'express';
import session from 'express-session';

const app = express();
const PORT = 3000;

// ==========================================================
// 기본 미들웨어 설정
// ==========================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================================
// 세션 설정
// ==========================================================

app.use(session({
  secret: 'my-super-secret-key', // 세션 암호화 키
  name: 'sessionId', // 세션 쿠키명 (기본: connect.sid)
  resave: false, // 세션이 수정되지 않아도 저장할지
  saveUninitialized: false, // 초기화되지 않은 세션 저장할지
  cookie: {
    secure: false, // HTTPS에서만 전송 (개발 시 false)
    httpOnly: true, // JavaScript 접근 차단
    maxAge: 24 * 60 * 60 * 1000 // 24시간 (밀리초)
  },
  // 메모리 저장소 사용 (실제 운영에서는 Redis 등 사용)
  store: null // 기본값: MemoryStore
}));

// ==========================================================
// 더미 사용자 데이터
// ==========================================================

const users = [
  { id: 1, username: 'kim', password: 'password123', name: '김철수', role: 'admin' },
  { id: 2, username: 'lee', password: 'password123', name: '이영희', role: 'user' },
  { id: 3, username: 'park', password: 'password123', name: '박민수', role: 'user' }
];

// 세션별 활동 기록
const userActivities = {};

// ==========================================================
// 홈페이지
// ==========================================================

app.get('/', (req, res) => {
  const visitCount = (req.session.visitCount || 0) + 1;
  req.session.visitCount = visitCount;
  
  const user = req.session.user;
  const sessionId = req.sessionID;
  
  const loginStatus = user 
    ? `<div style="background: #e8f5e8; padding: 15px; border-radius: 8px;">
         <h3>👋 안녕하세요, ${user.name}님!</h3>
         <p><strong>역할:</strong> ${user.role}</p>
         <p><strong>로그인 시간:</strong> ${new Date(req.session.loginTime).toLocaleString()}</p>
       </div>`
    : `<div style="background: #fff3cd; padding: 15px; border-radius: 8px;">
         <h3>🔒 로그인이 필요합니다</h3>
         <a href="/login-form">로그인하기</a>
       </div>`;
  
  res.send(`
    <h1>🛡️ Express 세션 학습</h1>
    
    <div style="border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 8px;">
      <h3>📊 세션 정보:</h3>
      <ul>
        <li><strong>세션 ID:</strong> ${sessionId}</li>
        <li><strong>방문 횟수:</strong> ${visitCount}회</li>
        <li><strong>세션 생성:</strong> ${new Date(req.session.cookie.originalMaxAge + Date.now() - req.session.cookie.maxAge).toLocaleString()}</li>
        <li><strong>만료 시간:</strong> ${new Date(Date.now() + req.session.cookie.maxAge).toLocaleString()}</li>
      </ul>
    </div>
    
    ${loginStatus}
    
    <h2>📚 세션 기능 테스트:</h2>
    <ul>
      <li><a href="/login-form">로그인</a></li>
      <li><a href="/profile">내 프로필 (로그인 필요)</a></li>
      <li><a href="/admin">관리자 페이지 (권한 필요)</a></li>
      <li><a href="/cart">장바구니 (세션 활용)</a></li>
      <li><a href="/session-data">세션 데이터 보기</a></li>
      <li><a href="/logout">로그아웃</a></li>
    </ul>
    
    <h2>🍪 세션 vs 쿠키:</h2>
    <table border="1" style="border-collapse: collapse; width: 100%;">
      <tr>
        <th></th>
        <th>세션</th>
        <th>쿠키</th>
      </tr>
      <tr>
        <td>저장 위치</td>
        <td>서버</td>
        <td>클라이언트</td>
      </tr>
      <tr>
        <td>보안</td>
        <td>높음</td>
        <td>낮음</td>
      </tr>
      <tr>
        <td>용량 제한</td>
        <td>없음</td>
        <td>4KB</td>
      </tr>
      <tr>
        <td>서버 부하</td>
        <td>높음</td>
        <td>낮음</td>
      </tr>
    </table>
  `);
});

// ==========================================================
// 로그인 시스템
// ==========================================================

app.get('/login-form', (req, res) => {
  if (req.session.user) {
    return res.redirect('/profile');
  }
  
  res.send(`
    <h1>🔐 로그인</h1>
    
    <form method="POST" action="/login">
      <div style="margin: 10px 0;">
        <label>사용자명:</label><br>
        <input type="text" name="username" required>
      </div>
      
      <div style="margin: 10px 0;">
        <label>비밀번호:</label><br>
        <input type="password" name="password" required>
      </div>
      
      <div style="margin: 10px 0;">
        <input type="checkbox" name="rememberMe" id="remember">
        <label for="remember">로그인 상태 유지</label>
      </div>
      
      <button type="submit">로그인</button>
    </form>
    
    <h3>📝 테스트 계정:</h3>
    <ul>
      <li><strong>관리자:</strong> kim / password123</li>
      <li><strong>일반 사용자:</strong> lee / password123</li>
      <li><strong>일반 사용자:</strong> park / password123</li>
    </ul>
    
    <a href="/">← 홈으로</a>
  `);
});

app.post('/login', (req, res) => {
  const { username, password, rememberMe } = req.body;
  
  // 사용자 인증
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).send(`
      <h1>❌ 로그인 실패</h1>
      <p>사용자명 또는 비밀번호가 올바르지 않습니다.</p>
      <a href="/login-form">다시 시도</a>
    `);
  }
  
  // 세션에 사용자 정보 저장
  req.session.user = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role
  };
  
  req.session.loginTime = Date.now();
  
  // Remember Me 체크 시 세션 쿠키 만료 시간 연장
  if (rememberMe) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30일
  }
  
  // 사용자 활동 기록 초기화
  userActivities[user.id] = [];
  
  res.redirect('/profile');
});

// ==========================================================
// 인증이 필요한 페이지들
// ==========================================================

// 인증 미들웨어
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).send(`
      <h1>🔒 인증 필요</h1>
      <p>이 페이지에 접근하려면 로그인이 필요합니다.</p>
      <a href="/login-form">로그인하기</a>
    `);
  }
  next();
}

// 관리자 권한 미들웨어
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send(`
      <h1>❌ 관리자 권한 필요</h1>
      <p>이 페이지는 관리자만 접근할 수 있습니다.</p>
      <a href="/">홈으로</a>
    `);
  }
  next();
}

// 프로필 페이지
app.get('/profile', requireAuth, (req, res) => {
  const user = req.session.user;
  const activities = userActivities[user.id] || [];
  
  // 프로필 접근 활동 기록
  activities.push({
    action: 'profile_view',
    timestamp: new Date().toISOString()
  });
  
  res.send(`
    <h1>👤 내 프로필</h1>
    
    <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
      <h3>${user.name}</h3>
      <p><strong>사용자명:</strong> ${user.username}</p>
      <p><strong>역할:</strong> ${user.role}</p>
      <p><strong>로그인 시간:</strong> ${new Date(req.session.loginTime).toLocaleString()}</p>
    </div>
    
    <h3>📊 활동 기록 (${activities.length}건):</h3>
    <ul>
      ${activities.slice(-5).map(activity => `
        <li>${activity.action} - ${new Date(activity.timestamp).toLocaleString()}</li>
      `).join('')}
    </ul>
    
    <ul>
      <li><a href="/edit-profile">프로필 수정</a></li>
      <li><a href="/change-password">비밀번호 변경</a></li>
      <li><a href="/">홈으로</a></li>
    </ul>
  `);
});

// 관리자 페이지
app.get('/admin', requireAuth, requireAdmin, (req, res) => {
  const allSessions = Object.keys(userActivities);
  
  res.send(`
    <h1>⚙️ 관리자 대시보드</h1>
    
    <div style="background: #f0f8f8; padding: 20px; border-radius: 8px;">
      <h3>📊 서버 통계:</h3>
      <ul>
        <li><strong>활성 세션 수:</strong> ${allSessions.length}개</li>
        <li><strong>전체 사용자 수:</strong> ${users.length}명</li>
        <li><strong>현재 관리자:</strong> ${req.session.user.name}</li>
      </ul>
    </div>
    
    <h3>👥 사용자 목록:</h3>
    <table border="1" style="border-collapse: collapse; width: 100%;">
      <tr>
        <th>ID</th>
        <th>이름</th>
        <th>사용자명</th>
        <th>역할</th>
        <th>활동 수</th>
      </tr>
      ${users.map(user => `
        <tr>
          <td>${user.id}</td>
          <td>${user.name}</td>
          <td>${user.username}</td>
          <td>${user.role}</td>
          <td>${(userActivities[user.id] || []).length}</td>
        </tr>
      `).join('')}
    </table>
    
    <ul>
      <li><a href="/admin/sessions">세션 관리</a></li>
      <li><a href="/">홈으로</a></li>
    </ul>
  `);
});

// ==========================================================
// 장바구니 예시 (세션 활용)
// ==========================================================

app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  res.send(`
    <h1>🛒 장바구니</h1>
    
    <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
      ${cart.length === 0 
        ? '<p>장바구니가 비어있습니다.</p>'
        : `
          <table border="1" style="border-collapse: collapse; width: 100%;">
            <tr>
              <th>상품명</th>
              <th>가격</th>
              <th>수량</th>
              <th>소계</th>
            </tr>
            ${cart.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.price.toLocaleString()}원</td>
                <td>${item.quantity}</td>
                <td>${(item.price * item.quantity).toLocaleString()}원</td>
              </tr>
            `).join('')}
          </table>
          <h3>총액: ${total.toLocaleString()}원</h3>
        `
      }
    </div>
    
    <h3>🛍️ 상품 추가:</h3>
    <form method="POST" action="/add-to-cart">
      <select name="product" required>
        <option value="">상품을 선택하세요</option>
        <option value="laptop,1200000">노트북 - 1,200,000원</option>
        <option value="mouse,25000">마우스 - 25,000원</option>
        <option value="keyboard,150000">키보드 - 150,000원</option>
      </select>
      <input type="number" name="quantity" value="1" min="1" required>
      <button type="submit">장바구니 추가</button>
    </form>
    
    <ul>
      <li><a href="/clear-cart">장바구니 비우기</a></li>
      <li><a href="/">홈으로</a></li>
    </ul>
  `);
});

app.post('/add-to-cart', (req, res) => {
  const { product, quantity } = req.body;
  const [name, price] = product.split(',');
  
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  const existingItem = req.session.cart.find(item => item.name === name);
  
  if (existingItem) {
    existingItem.quantity += parseInt(quantity);
  } else {
    req.session.cart.push({
      name,
      price: parseInt(price),
      quantity: parseInt(quantity)
    });
  }
  
  res.redirect('/cart');
});

app.get('/clear-cart', (req, res) => {
  req.session.cart = [];
  res.redirect('/cart');
});

// ==========================================================
// 세션 디버깅 도구
// ==========================================================

app.get('/session-data', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    session: req.session,
    cookie: req.session.cookie
  });
});

// ==========================================================
// 로그아웃
// ==========================================================

app.get('/logout', (req, res) => {
  const username = req.session.user?.name;
  
  req.session.destroy((err) => {
    if (err) {
      console.error('세션 삭제 오류:', err);
      return res.status(500).send('로그아웃 중 오류가 발생했습니다.');
    }
    
    // 세션 쿠키도 삭제
    res.clearCookie('sessionId');
    
    res.send(`
      <h1>👋 로그아웃 완료</h1>
      <p>${username ? `${username}님, ` : ''}안전하게 로그아웃되었습니다.</p>
      <p>세션이 완전히 삭제되었습니다.</p>
      <a href="/">홈으로</a>
    `);
  });
});

// ==========================================================
// 서버 시작
// ==========================================================

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🛡️ Express 세션 서버 시작!');
  console.log(`📍 주소: http://localhost:${PORT}`);
  console.log('');
  console.log('📚 학습 포인트:');
  console.log('1. express-session 설정과 사용법');
  console.log('2. 세션 기반 인증 시스템');
  console.log('3. 세션 데이터 활용 (장바구니, 사용자 설정)');
  console.log('4. 세션 보안 설정');
  console.log('');
  console.log('⚠️ 주의: 실제 운영에서는 Redis 등의 세션 저장소 사용');
  console.log('='.repeat(60));
});

// ==========================================================
// 실행 방법:
// npm install express-session
// cp tutorial/steps/step07_sessions.js app.js
// npm run dev
//
// 세션과 쿠키의 차이점을 직접 확인해보세요!
// ==========================================================
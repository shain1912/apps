// ==========================================================
// 10단계: 로그인 시스템 구현
// ==========================================================
// 학습 목표:
// 1. bcrypt로 비밀번호 해싱
// 2. 세션 기반 인증 시스템
// 3. 회원가입, 로그인, 로그아웃 구현
// 4. 권한 기반 접근 제어

import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3000;

// ==========================================================
// 데이터베이스 연결
// ==========================================================

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234', // 실제 비밀번호로 변경
  database: 'express_auth',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ==========================================================
// 미들웨어 설정
// ==========================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 설정
app.use(session({
  secret: 'your-super-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // HTTPS에서는 true
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

// ==========================================================
// 데이터베이스 초기화
// ==========================================================

async function initializeDatabase() {
  try {
    // 데이터베이스 생성
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234'
    });
    
    await connection.execute('CREATE DATABASE IF NOT EXISTS express_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.end();
    
    // 테이블 생성
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'moderator', 'user') DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    const createLoginAttemptsTable = `
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        success BOOLEAN DEFAULT false,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_time (email, attempted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await pool.execute(createUsersTable);
    await pool.execute(createLoginAttemptsTable);
    
    // 관리자 계정 생성 (없을 경우)
    const [adminCheck] = await pool.execute('SELECT id FROM users WHERE role = "admin" LIMIT 1');
    
    if (adminCheck.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123!', 12);
      await pool.execute(
        'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@example.com', hashedPassword, '관리자', 'admin']
      );
      console.log('✅ 기본 관리자 계정 생성 (admin@example.com / admin123!)');
    }
    
    console.log('✅ 로그인 시스템 데이터베이스 초기화 완료');
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error.message);
  }
}

// ==========================================================
// 인증 미들웨어
// ==========================================================

// 로그인 확인
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      error: '인증이 필요합니다',
      redirectTo: '/login'
    });
  }
  next();
}

// 관리자 권한 확인
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({
      error: '관리자 권한이 필요합니다'
    });
  }
  next();
}

// 로그인 시도 제한 (5분 동안 5회 실패 시 차단)
async function checkLoginAttempts(email, ipAddress) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const [attempts] = await pool.execute(
    'SELECT COUNT(*) as count FROM login_attempts WHERE email = ? AND ip_address = ? AND attempted_at > ? AND success = false',
    [email, ipAddress, fiveMinutesAgo]
  );
  
  return attempts[0].count >= 5;
}

// 로그인 시도 기록
async function recordLoginAttempt(email, ipAddress, success) {
  await pool.execute(
    'INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)',
    [email, ipAddress, success]
  );
}

// ==========================================================
// 라우트 정의
// ==========================================================

// 홈페이지 - 로그인 상태에 따른 다른 응답
app.get('/', (req, res) => {
  const user = req.session.user;
  
  if (user) {
    res.json({
      message: `안녕하세요, ${user.full_name}님!`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        last_login: user.last_login
      },
      menu: [
        { name: '프로필', path: '/profile' },
        { name: '설정', path: '/settings' },
        ...(user.role === 'admin' ? [{ name: '관리자', path: '/admin' }] : []),
        { name: '로그아웃', path: '/logout' }
      ]
    });
  } else {
    res.json({
      message: '로그인 시스템에 오신 것을 환영합니다!',
      features: [
        '🔐 안전한 비밀번호 해싱 (bcrypt)',
        '🛡️ 세션 기반 인증',
        '🚫 브루트 포스 공격 방지',
        '👤 역할 기반 접근 제어'
      ],
      actions: [
        { name: '로그인', path: '/login' },
        { name: '회원가입', path: '/register' }
      ]
    });
  }
});

// 회원가입
app.post('/register', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { username, email, password, full_name } = req.body;
    
    // 입력값 검증
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        error: '모든 필드를 입력해주세요'
      });
    }
    
    // 비밀번호 강도 검증
    if (password.length < 6) {
      return res.status(400).json({
        error: '비밀번호는 최소 6자리 이상이어야 합니다'
      });
    }
    
    // 이메일 형식 검증 (간단)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: '올바른 이메일 형식을 입력해주세요'
      });
    }
    
    // 중복 확인
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: '이미 사용 중인 사용자명 또는 이메일입니다'
      });
    }
    
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // 사용자 생성
    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, full_name]
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다',
      user: {
        id: result.insertId,
        username,
        email,
        full_name
      }
    });
    
  } catch (error) {
    await connection.rollback();
    res.status(500).json({
      error: '회원가입 처리 중 오류가 발생했습니다',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// 로그인
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // 입력값 검증
    if (!email || !password) {
      return res.status(400).json({
        error: '이메일과 비밀번호를 입력해주세요'
      });
    }
    
    // 로그인 시도 제한 확인
    const isBlocked = await checkLoginAttempts(email, ipAddress);
    if (isBlocked) {
      return res.status(429).json({
        error: '로그인 시도 횟수를 초과했습니다. 5분 후 다시 시도해주세요'
      });
    }
    
    // 사용자 확인
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = true',
      [email]
    );
    
    if (users.length === 0) {
      await recordLoginAttempt(email, ipAddress, false);
      return res.status(401).json({
        error: '이메일 또는 비밀번호가 올바르지 않습니다'
      });
    }
    
    const user = users[0];
    
    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      await recordLoginAttempt(email, ipAddress, false);
      return res.status(401).json({
        error: '이메일 또는 비밀번호가 올바르지 않습니다'
      });
    }
    
    // 성공 기록
    await recordLoginAttempt(email, ipAddress, true);
    
    // 마지막 로그인 시간 업데이트
    await pool.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );
    
    // 세션에 사용자 정보 저장
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      last_login: new Date()
    };
    
    res.json({
      success: true,
      message: `환영합니다, ${user.full_name}님!`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: '로그인 처리 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

// 로그아웃
app.post('/logout', requireAuth, (req, res) => {
  const userName = req.session.user.full_name;
  
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        error: '로그아웃 처리 중 오류가 발생했습니다'
      });
    }
    
    res.json({
      success: true,
      message: `${userName}님, 안전하게 로그아웃되었습니다`
    });
  });
});

// 프로필 조회
app.get('/profile', requireAuth, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, full_name, role, is_active, last_login, created_at FROM users WHERE id = ?',
      [req.session.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }
    
    const user = users[0];
    
    // 최근 로그인 기록
    const [loginHistory] = await pool.execute(
      'SELECT ip_address, success, attempted_at FROM login_attempts WHERE email = ? ORDER BY attempted_at DESC LIMIT 10',
      [user.email]
    );
    
    res.json({
      success: true,
      user: user,
      loginHistory: loginHistory
    });
    
  } catch (error) {
    res.status(500).json({
      error: '프로필 조회 실패',
      details: error.message
    });
  }
});

// 비밀번호 변경
app.put('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: '현재 비밀번호와 새 비밀번호를 입력해주세요'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: '새 비밀번호는 최소 6자리 이상이어야 합니다'
      });
    }
    
    // 현재 사용자 정보 조회
    const [users] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.session.user.id]);
    const user = users[0];
    
    // 현재 비밀번호 확인
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: '현재 비밀번호가 올바르지 않습니다'
      });
    }
    
    // 새 비밀번호 해싱
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    // 비밀번호 업데이트
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, req.session.user.id]
    );
    
    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다'
    });
    
  } catch (error) {
    res.status(500).json({
      error: '비밀번호 변경 실패',
      details: error.message
    });
  }
});

// 관리자 전용 - 모든 사용자 조회
app.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.is_active, 
             u.last_login, u.created_at,
             COUNT(la.id) as login_attempts,
             SUM(CASE WHEN la.success = true THEN 1 ELSE 0 END) as successful_logins
      FROM users u
      LEFT JOIN login_attempts la ON u.email = la.email
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    
    res.json({
      success: true,
      count: users.length,
      users: users
    });
    
  } catch (error) {
    res.status(500).json({
      error: '사용자 목록 조회 실패',
      details: error.message
    });
  }
});

// 사용자 인증 상태 확인
app.get('/auth-status', (req, res) => {
  res.json({
    authenticated: !!req.session.user,
    user: req.session.user || null
  });
});

// ==========================================================
// 서버 시작
// ==========================================================

async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🔐 로그인 시스템 서버 시작!');
      console.log(`📍 주소: http://localhost:${PORT}`);
      console.log('');
      console.log('🧪 테스트 계정:');
      console.log('📧 이메일: admin@example.com');
      console.log('🔑 비밀번호: admin123!');
      console.log('');
      console.log('🔗 API 엔드포인트:');
      console.log('POST /register - 회원가입');
      console.log('POST /login - 로그인');
      console.log('POST /logout - 로그아웃');
      console.log('GET /profile - 프로필 조회');
      console.log('PUT /change-password - 비밀번호 변경');
      console.log('GET /admin/users - 관리자 전용');
      console.log('='.repeat(60));
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

startServer();

// ==========================================================
// 실행 방법:
// npm install bcrypt express-session mysql2
// cp tutorial/steps/step10_login.js app.js
// MySQL 비밀번호 수정 후 실행
// npm run dev
// ==========================================================
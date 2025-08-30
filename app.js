import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3000;

// ==========================================================
// MySQL 연결 설정
// ==========================================================

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'express_tutorial',
  charset: 'utf8mb4',
  timezone: '+09:00'
};

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

// ==========================================================
// 미들웨어 설정
// ==========================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 세션 설정
app.use(session({
  secret: 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // HTTPS에서만 true
    maxAge: 1000 * 60 * 60 * 24 // 24시간
  }
}));

// EJS 템플릿 엔진 설정
app.set('view engine', 'ejs');
app.set('views', './views');

// ==========================================================
// 데이터베이스 초기화
// ==========================================================

async function initializeDatabase() {
  try {
    // 데이터베이스 생성
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.end();
    
    // 테이블 생성
    await createTables();
    
    console.log('✅ 데이터베이스 초기화 완료');
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error.message);
  }
}

async function createTables() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role ENUM('admin', 'user') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  await pool.execute(createUsersTable);
}

// ==========================================================
// 인증 미들웨어
// ==========================================================

function requireAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

function requireGuest(req, res, next) {
  if (!req.session.user) {
    next();
  } else {
    res.redirect('/dashboard');
  }
}

// ==========================================================
// 라우트
// ==========================================================

// 홈페이지 (로그인 페이지로 리다이렉트)
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// 로그인 페이지
app.get('/login', requireGuest, (req, res) => {
  res.render('login', { 
    title: '로그인',
    error: null 
  });
});

// 로그인 처리
app.post('/login', requireGuest, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.render('login', { 
        title: '로그인',
        error: '사용자명과 비밀번호를 입력해주세요.' 
      });
    }
    
    // 사용자 조회
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.render('login', { 
        title: '로그인',
        error: '존재하지 않는 사용자명입니다.' 
      });
    }
    
    const user = users[0];
    
    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.render('login', { 
        title: '로그인',
        error: '비밀번호가 올바르지 않습니다.' 
      });
    }
    
    // 세션에 사용자 정보 저장
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    res.redirect('/dashboard');
    
  } catch (error) {
    console.error('로그인 에러:', error);
    res.render('login', { 
      title: '로그인',
      error: '로그인 처리 중 오류가 발생했습니다.' 
    });
  }
});

// 회원가입 페이지
app.get('/register', requireGuest, (req, res) => {
  res.render('register', { 
    title: '회원가입',
    error: null,
    success: null
  });
});

// 회원가입 처리
app.post('/register', requireGuest, async (req, res) => {
  try {
    const { username, email, password, confirmPassword, name } = req.body;
    
    // 입력값 검증
    if (!username || !email || !password || !confirmPassword || !name) {
      return res.render('register', { 
        title: '회원가입',
        error: '모든 필드를 입력해주세요.',
        success: null
      });
    }
    
    if (password !== confirmPassword) {
      return res.render('register', { 
        title: '회원가입',
        error: '비밀번호가 일치하지 않습니다.',
        success: null
      });
    }
    
    if (password.length < 6) {
      return res.render('register', { 
        title: '회원가입',
        error: '비밀번호는 최소 6자 이상이어야 합니다.',
        success: null
      });
    }
    
    // 중복 검사
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      return res.render('register', { 
        title: '회원가입',
        error: '이미 존재하는 사용자명 또는 이메일입니다.',
        success: null
      });
    }
    
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 사용자 생성
    await pool.execute(
      'INSERT INTO users (username, email, password, name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, name]
    );
    
    res.render('register', { 
      title: '회원가입',
      error: null,
      success: '회원가입이 완료되었습니다. 로그인해주세요.'
    });
    
  } catch (error) {
    console.error('회원가입 에러:', error);
    res.render('register', { 
      title: '회원가입',
      error: '회원가입 처리 중 오류가 발생했습니다.',
      success: null
    });
  }
});

// 대시보드 (로그인 후 메인 페이지)
app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    // 통계 정보 조회
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    
    res.render('dashboard', { 
      title: '대시보드',
      user: req.session.user,
      stats: {
        totalUsers: userCount[0].count
      }
    });
    
  } catch (error) {
    console.error('대시보드 에러:', error);
    res.status(500).send('서버 오류가 발생했습니다.');
  }
});

// 프로필 페이지
app.get('/profile', requireAuth, (req, res) => {
  res.render('profile', { 
    title: '프로필',
    user: req.session.user,
    error: null,
    success: null
  });
});

// 프로필 업데이트
app.post('/profile', requireAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.session.user.id;
    
    if (!name || !email) {
      return res.render('profile', { 
        title: '프로필',
        user: req.session.user,
        error: '이름과 이메일을 입력해주세요.',
        success: null
      });
    }
    
    // 이메일 중복 검사 (자신 제외)
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );
    
    if (existingUsers.length > 0) {
      return res.render('profile', { 
        title: '프로필',
        user: req.session.user,
        error: '이미 사용중인 이메일입니다.',
        success: null
      });
    }
    
    // 프로필 업데이트
    await pool.execute(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, userId]
    );
    
    // 세션 정보도 업데이트
    req.session.user.name = name;
    req.session.user.email = email;
    
    res.render('profile', { 
      title: '프로필',
      user: req.session.user,
      error: null,
      success: '프로필이 업데이트되었습니다.'
    });
    
  } catch (error) {
    console.error('프로필 업데이트 에러:', error);
    res.render('profile', { 
      title: '프로필',
      user: req.session.user,
      error: '프로필 업데이트 중 오류가 발생했습니다.',
      success: null
    });
  }
});

// 로그아웃
app.post('/logout', requireAuth, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('세션 삭제 에러:', error);
      return res.status(500).send('로그아웃 중 오류가 발생했습니다.');
    }
    res.redirect('/login');
  });
});

// ==========================================================
// 서버 시작
// ==========================================================

async function startServer() {
  try {
    await initializeDatabase();
    
    // 관리자 계정 생성 (존재하지 않을 경우)
    const [adminUsers] = await pool.execute('SELECT id FROM users WHERE username = ?', ['admin']);
    
    if (adminUsers.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.execute(
        'INSERT INTO users (username, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@example.com', hashedPassword, '관리자', 'admin']
      );
      console.log('✅ 기본 관리자 계정 생성: admin / admin123');
    }
    
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🔐 로그인 시스템 서버 시작!');
      console.log(`📍 주소: http://localhost:${PORT}`);
      console.log('');
      console.log('🔑 기본 계정:');
      console.log('   사용자명: admin');
      console.log('   비밀번호: admin123');
      console.log('='.repeat(60));
    });
    
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

startServer();

export default app;
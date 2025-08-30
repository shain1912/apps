// ==========================================================
// 11단계: 완전한 CRUD API 구현 (MVC 패턴)
// ==========================================================
// 학습 목표:
// 1. MVC 패턴으로 완전한 CRUD API 구현
// 2. 인증과 권한 기반 접근 제어
// 3. 입력 검증과 에러 처리
// 4. RESTful API 설계 원칙 적용

import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// ==========================================================
// 데이터베이스 연결 설정
// ==========================================================

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234', // 실제 비밀번호로 변경
  database: 'express_final',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+09:00'
});

// ==========================================================
// 미들웨어 설정
// ==========================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 설정
app.use(session({
  secret: 'your-super-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // HTTPS에서는 true
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.session.user) {
    console.log(`User: ${req.session.user.username} (${req.session.user.role})`);
  }
  next();
});

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
    
    await connection.execute('CREATE DATABASE IF NOT EXISTS express_final CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.end();
    
    // 테이블 생성
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'editor', 'user') DEFAULT 'user',
        avatar VARCHAR(255) NULL,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        slug VARCHAR(100) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    const createPostsTable = `
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        author_id INT NOT NULL,
        category_id INT,
        status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
        featured_image VARCHAR(255),
        views INT DEFAULT 0,
        likes INT DEFAULT 0,
        published_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_status_published (status, published_at),
        INDEX idx_author (author_id),
        INDEX idx_category (category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    const createTagsTable = `
      CREATE TABLE IF NOT EXISTS tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        slug VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    const createPostTagsTable = `
      CREATE TABLE IF NOT EXISTS post_tags (
        post_id INT,
        tag_id INT,
        PRIMARY KEY (post_id, tag_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await pool.execute(createUsersTable);
    await pool.execute(createCategoriesTable);
    await pool.execute(createPostsTable);
    await pool.execute(createTagsTable);
    await pool.execute(createPostTagsTable);
    
    await insertSampleData();
    
    console.log('✅ 완전한 CRUD 시스템 데이터베이스 초기화 완료');
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error.message);
  }
}

async function insertSampleData() {
  try {
    // 관리자 계정 확인 후 생성
    const [adminCheck] = await pool.execute('SELECT id FROM users WHERE role = "admin" LIMIT 1');
    
    if (adminCheck.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123!', 12);
      
      // 사용자 생성
      await pool.execute(
        'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@example.com', hashedPassword, '관리자', 'admin']
      );
      
      await pool.execute(
        'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
        ['editor', 'editor@example.com', hashedPassword, '에디터', 'editor']
      );
      
      await pool.execute(
        'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
        ['user1', 'user@example.com', hashedPassword, '일반사용자', 'user']
      );
      
      // 카테고리 생성
      const categories = [
        ['기술', '프로그래밍 및 기술 관련 포스트', 'tech'],
        ['생활', '일상 생활 관련 포스트', 'life'],
        ['여행', '여행 경험과 팁', 'travel']
      ];
      
      for (const [name, description, slug] of categories) {
        await pool.execute(
          'INSERT INTO categories (name, description, slug) VALUES (?, ?, ?)',
          [name, description, slug]
        );
      }
      
      // 태그 생성
      const tags = [
        ['JavaScript', 'javascript'],
        ['Node.js', 'nodejs'],
        ['MySQL', 'mysql'],
        ['Express', 'express'],
        ['웹개발', 'webdev']
      ];
      
      for (const [name, slug] of tags) {
        await pool.execute(
          'INSERT INTO tags (name, slug) VALUES (?, ?)',
          [name, slug]
        );
      }
      
      console.log('✅ 샘플 데이터 생성 완료');
      console.log('🔑 테스트 계정: admin@example.com / admin123!');
    }
  } catch (error) {
    console.error('❌ 샘플 데이터 생성 실패:', error.message);
  }
}

// ==========================================================
// 인증 & 권한 미들웨어
// ==========================================================

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      error: '인증이 필요합니다',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: '인증이 필요합니다',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({
        success: false,
        error: '권한이 부족합니다',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.session.user.role
      });
    }
    
    next();
  };
}

// 소유자 확인 미들웨어 (포스트 작성자만 수정/삭제 가능)
async function requireOwnershipOrAdmin(resourceType) {
  return async (req, res, next) => {
    try {
      if (req.session.user.role === 'admin') {
        return next(); // 관리자는 모든 권한
      }
      
      const resourceId = req.params.id;
      
      if (resourceType === 'post') {
        const [posts] = await pool.execute(
          'SELECT author_id FROM posts WHERE id = ?',
          [resourceId]
        );
        
        if (posts.length === 0) {
          return res.status(404).json({
            success: false,
            error: '포스트를 찾을 수 없습니다'
          });
        }
        
        if (posts[0].author_id !== req.session.user.id) {
          return res.status(403).json({
            success: false,
            error: '자신의 포스트만 수정/삭제할 수 있습니다'
          });
        }
      }
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '권한 확인 중 오류 발생',
        details: error.message
      });
    }
  };
}

// ==========================================================
// 유틸리티 함수
// ==========================================================

function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function createResponse(success, data, message, error = null, pagination = null) {
  const response = { success };
  
  if (success) {
    if (data !== undefined) response.data = data;
    if (message) response.message = message;
    if (pagination) response.pagination = pagination;
  } else {
    response.error = error || message;
  }
  
  return response;
}

// ==========================================================
// 인증 API
// ==========================================================

// 로그인
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json(
        createResponse(false, null, null, '이메일과 비밀번호를 입력해주세요')
      );
    }
    
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = true',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json(
        createResponse(false, null, null, '이메일 또는 비밀번호가 올바르지 않습니다')
      );
    }
    
    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json(
        createResponse(false, null, null, '이메일 또는 비밀번호가 올바르지 않습니다')
      );
    }
    
    // 마지막 로그인 시간 업데이트
    await pool.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    
    // 세션에 사용자 정보 저장
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    };
    
    res.json(createResponse(true, {
      user: req.session.user
    }, `환영합니다, ${user.full_name}님!`));
    
  } catch (error) {
    res.status(500).json(
      createResponse(false, null, null, '로그인 처리 중 오류가 발생했습니다')
    );
  }
});

// 로그아웃
app.post('/api/auth/logout', requireAuth, (req, res) => {
  const userName = req.session.user.full_name;
  
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json(
        createResponse(false, null, null, '로그아웃 처리 중 오류가 발생했습니다')
      );
    }
    
    res.json(createResponse(true, null, `${userName}님, 안전하게 로그아웃되었습니다`));
  });
});

// 현재 사용자 정보
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(createResponse(true, { user: req.session.user }));
});

// ==========================================================
// 사용자 CRUD API
// ==========================================================

// 사용자 목록 조회 (관리자만)
app.get('/api/users', requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, active } = req.query;
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let params = [];
    
    if (search) {
      whereConditions.push('(u.username LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (role) {
      whereConditions.push('u.role = ?');
      params.push(role);
    }
    
    if (active !== undefined) {
      whereConditions.push('u.is_active = ?');
      params.push(active === 'true');
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    // 총 개수 조회
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );
    
    // 사용자 목록 조회
    const [users] = await pool.execute(`
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.is_active, 
             u.last_login, u.created_at,
             COUNT(p.id) as post_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    res.json(createResponse(true, users, null, null, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
      totalPages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }));
    
  } catch (error) {
    res.status(500).json(
      createResponse(false, null, null, '사용자 목록 조회 실패')
    );
  }
});

// 특정 사용자 조회
app.get('/api/users/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 일반 사용자는 자신의 정보만 조회 가능
    if (req.session.user.role !== 'admin' && req.session.user.id != userId) {
      return res.status(403).json(
        createResponse(false, null, null, '다른 사용자의 정보를 조회할 권한이 없습니다')
      );
    }
    
    const [users] = await pool.execute(`
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.is_active,
             u.avatar, u.last_login, u.created_at, u.updated_at,
             COUNT(p.id) as post_count,
             SUM(p.views) as total_views
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [userId]);
    
    if (users.length === 0) {
      return res.status(404).json(
        createResponse(false, null, null, '사용자를 찾을 수 없습니다')
      );
    }
    
    res.json(createResponse(true, users[0]));
    
  } catch (error) {
    res.status(500).json(
      createResponse(false, null, null, '사용자 조회 실패')
    );
  }
});

// 사용자 생성 (회원가입)
app.post('/api/users', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { username, email, password, full_name, role = 'user' } = req.body;
    
    // 입력값 검증
    if (!username || !email || !password || !full_name) {
      return res.status(400).json(
        createResponse(false, null, null, '모든 필수 필드를 입력해주세요')
      );
    }
    
    if (password.length < 6) {
      return res.status(400).json(
        createResponse(false, null, null, '비밀번호는 최소 6자리 이상이어야 합니다')
      );
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json(
        createResponse(false, null, null, '올바른 이메일 형식을 입력해주세요')
      );
    }
    
    // 역할 검증 (관리자만 admin/editor 생성 가능)
    if (role !== 'user' && (!req.session.user || req.session.user.role !== 'admin')) {
      return res.status(403).json(
        createResponse(false, null, null, '해당 역할로 사용자를 생성할 권한이 없습니다')
      );
    }
    
    // 중복 확인
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existing.length > 0) {
      return res.status(409).json(
        createResponse(false, null, null, '이미 사용 중인 사용자명 또는 이메일입니다')
      );
    }
    
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // 사용자 생성
    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, full_name, role]
    );
    
    await connection.commit();
    
    res.status(201).json(createResponse(true, {
      id: result.insertId,
      username,
      email,
      full_name,
      role
    }, '사용자가 성공적으로 생성되었습니다'));
    
  } catch (error) {
    await connection.rollback();
    res.status(500).json(
      createResponse(false, null, null, '사용자 생성 실패')
    );
  } finally {
    connection.release();
  }
});

// ==========================================================
// 포스트 CRUD API
// ==========================================================

// 포스트 목록 조회
app.get('/api/posts', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = 'published', 
      category, 
      author, 
      search,
      tag,
      sort = 'created_at',
      order = 'desc'
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereConditions = ['p.status = ?'];
    let params = [status];
    
    // 인증되지 않은 사용자는 published만 조회
    if (!req.session.user && status !== 'published') {
      return res.status(401).json(
        createResponse(false, null, null, '인증이 필요합니다')
      );
    }
    
    if (search) {
      whereConditions.push('(p.title LIKE ? OR p.content LIKE ? OR p.excerpt LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (category) {
      whereConditions.push('c.slug = ?');
      params.push(category);
    }
    
    if (author) {
      whereConditions.push('u.username = ?');
      params.push(author);
    }
    
    if (tag) {
      whereConditions.push('t.slug = ?');
      params.push(tag);
    }
    
    const whereClause = 'WHERE ' + whereConditions.join(' AND ');
    const orderClause = `ORDER BY p.${sort} ${order.toUpperCase()}`;
    
    // 총 개수 조회
    const [countResult] = await pool.execute(`
      SELECT COUNT(DISTINCT p.id) as total
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      ${whereClause}
    `, params);
    
    // 포스트 목록 조회
    const [posts] = await pool.execute(`
      SELECT DISTINCT p.id, p.title, p.slug, p.excerpt, p.status, p.views, p.likes,
             p.published_at, p.created_at, p.updated_at,
             u.username as author, u.full_name as author_name,
             c.name as category, c.slug as category_slug,
             GROUP_CONCAT(t.name) as tags
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      ${whereClause}
      GROUP BY p.id
      ${orderClause}
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    res.json(createResponse(true, posts, null, null, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
      totalPages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }));
    
  } catch (error) {
    res.status(500).json(
      createResponse(false, null, null, '포스트 목록 조회 실패')
    );
  }
});

// 특정 포스트 조회
app.get('/api/posts/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    
    const [posts] = await pool.execute(`
      SELECT p.*, u.username as author, u.full_name as author_name,
             c.name as category, c.slug as category_slug,
             GROUP_CONCAT(t.name) as tags
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.id = ?
      GROUP BY p.id
    `, [postId]);
    
    if (posts.length === 0) {
      return res.status(404).json(
        createResponse(false, null, null, '포스트를 찾을 수 없습니다')
      );
    }
    
    const post = posts[0];
    
    // 비공개 포스트는 작성자나 관리자만 조회 가능
    if (post.status !== 'published') {
      if (!req.session.user || 
          (req.session.user.id !== post.author_id && req.session.user.role !== 'admin')) {
        return res.status(403).json(
          createResponse(false, null, null, '이 포스트를 조회할 권한이 없습니다')
        );
      }
    } else {
      // 공개 포스트의 경우 조회수 증가
      await pool.execute('UPDATE posts SET views = views + 1 WHERE id = ?', [postId]);
      post.views += 1;
    }
    
    res.json(createResponse(true, post));
    
  } catch (error) {
    res.status(500).json(
      createResponse(false, null, null, '포스트 조회 실패')
    );
  }
});

// 포스트 생성
app.post('/api/posts', requireRole(['admin', 'editor', 'user']), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      title, 
      content, 
      excerpt, 
      category_id, 
      status = 'draft', 
      tags = [] 
    } = req.body;
    
    // 입력값 검증
    if (!title || !content) {
      return res.status(400).json(
        createResponse(false, null, null, '제목과 내용은 필수입니다')
      );
    }
    
    // 슬러그 생성
    let slug = createSlug(title);
    
    // 슬러그 중복 확인 및 처리
    let slugCounter = 1;
    let finalSlug = slug;
    
    while (true) {
      const [existing] = await connection.execute(
        'SELECT id FROM posts WHERE slug = ?',
        [finalSlug]
      );
      
      if (existing.length === 0) break;
      
      finalSlug = `${slug}-${slugCounter}`;
      slugCounter++;
    }
    
    // 발행일 설정
    const publishedAt = status === 'published' ? new Date() : null;
    
    // 포스트 생성
    const [result] = await connection.execute(`
      INSERT INTO posts (title, slug, content, excerpt, author_id, category_id, status, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, finalSlug, content, excerpt, req.session.user.id, category_id, status, publishedAt]);
    
    const postId = result.insertId;
    
    // 태그 처리
    if (tags.length > 0) {
      for (const tagName of tags) {
        // 태그 존재 확인 또는 생성
        let [existingTags] = await connection.execute(
          'SELECT id FROM tags WHERE name = ?',
          [tagName]
        );
        
        let tagId;
        if (existingTags.length === 0) {
          const tagSlug = createSlug(tagName);
          const [tagResult] = await connection.execute(
            'INSERT INTO tags (name, slug) VALUES (?, ?)',
            [tagName, tagSlug]
          );
          tagId = tagResult.insertId;
        } else {
          tagId = existingTags[0].id;
        }
        
        // 포스트-태그 연결
        await connection.execute(
          'INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)',
          [postId, tagId]
        );
      }
    }
    
    await connection.commit();
    
    res.status(201).json(createResponse(true, {
      id: postId,
      title,
      slug: finalSlug,
      status
    }, '포스트가 성공적으로 생성되었습니다'));
    
  } catch (error) {
    await connection.rollback();
    res.status(500).json(
      createResponse(false, null, null, '포스트 생성 실패')
    );
  } finally {
    connection.release();
  }
});

// 포스트 수정
app.put('/api/posts/:id', requireAuth, requireOwnershipOrAdmin('post'), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const postId = req.params.id;
    const { title, content, excerpt, category_id, status, tags = [] } = req.body;
    
    // 현재 포스트 정보 조회
    const [currentPost] = await connection.execute(
      'SELECT * FROM posts WHERE id = ?',
      [postId]
    );
    
    if (currentPost.length === 0) {
      return res.status(404).json(
        createResponse(false, null, null, '포스트를 찾을 수 없습니다')
      );
    }
    
    const updateFields = [];
    const updateValues = [];
    
    if (title) {
      updateFields.push('title = ?');
      updateValues.push(title);
      
      // 제목이 변경되면 슬러그도 업데이트
      let newSlug = createSlug(title);
      let slugCounter = 1;
      let finalSlug = newSlug;
      
      // 현재 포스트가 아닌 다른 포스트와 슬러그 중복 확인
      while (true) {
        const [existing] = await connection.execute(
          'SELECT id FROM posts WHERE slug = ? AND id != ?',
          [finalSlug, postId]
        );
        
        if (existing.length === 0) break;
        
        finalSlug = `${newSlug}-${slugCounter}`;
        slugCounter++;
      }
      
      updateFields.push('slug = ?');
      updateValues.push(finalSlug);
    }
    
    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(content);
    }
    
    if (excerpt !== undefined) {
      updateFields.push('excerpt = ?');
      updateValues.push(excerpt);
    }
    
    if (category_id !== undefined) {
      updateFields.push('category_id = ?');
      updateValues.push(category_id);
    }
    
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
      
      // 상태가 published로 변경되고 published_at이 null이면 현재 시간으로 설정
      if (status === 'published' && !currentPost[0].published_at) {
        updateFields.push('published_at = CURRENT_TIMESTAMP');
      }
    }
    
    // 포스트 업데이트
    if (updateFields.length > 0) {
      updateValues.push(postId);
      await connection.execute(
        `UPDATE posts SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }
    
    // 태그 업데이트
    if (tags.length >= 0) {
      // 기존 태그 관계 삭제
      await connection.execute('DELETE FROM post_tags WHERE post_id = ?', [postId]);
      
      // 새 태그 처리
      for (const tagName of tags) {
        let [existingTags] = await connection.execute(
          'SELECT id FROM tags WHERE name = ?',
          [tagName]
        );
        
        let tagId;
        if (existingTags.length === 0) {
          const tagSlug = createSlug(tagName);
          const [tagResult] = await connection.execute(
            'INSERT INTO tags (name, slug) VALUES (?, ?)',
            [tagName, tagSlug]
          );
          tagId = tagResult.insertId;
        } else {
          tagId = existingTags[0].id;
        }
        
        await connection.execute(
          'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
          [postId, tagId]
        );
      }
    }
    
    await connection.commit();
    
    res.json(createResponse(true, null, '포스트가 성공적으로 수정되었습니다'));
    
  } catch (error) {
    await connection.rollback();
    res.status(500).json(
      createResponse(false, null, null, '포스트 수정 실패')
    );
  } finally {
    connection.release();
  }
});

// 포스트 삭제
app.delete('/api/posts/:id', requireAuth, requireOwnershipOrAdmin('post'), async (req, res) => {
  try {
    const postId = req.params.id;
    
    const [result] = await pool.execute('DELETE FROM posts WHERE id = ?', [postId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json(
        createResponse(false, null, null, '포스트를 찾을 수 없습니다')
      );
    }
    
    res.json(createResponse(true, null, '포스트가 성공적으로 삭제되었습니다'));
    
  } catch (error) {
    res.status(500).json(
      createResponse(false, null, null, '포스트 삭제 실패')
    );
  }
});

// ==========================================================
// 카테고리 API
// ==========================================================

// 카테고리 목록
app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute(`
      SELECT c.*, COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.name
    `);
    
    res.json(createResponse(true, categories));
  } catch (error) {
    res.status(500).json(
      createResponse(false, null, null, '카테고리 조회 실패')
    );
  }
});

// 카테고리 생성 (관리자만)
app.post('/api/categories', requireRole(['admin']), async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json(
        createResponse(false, null, null, '카테고리 이름은 필수입니다')
      );
    }
    
    const slug = createSlug(name);
    
    const [result] = await pool.execute(
      'INSERT INTO categories (name, description, slug) VALUES (?, ?, ?)',
      [name, description, slug]
    );
    
    res.status(201).json(createResponse(true, {
      id: result.insertId,
      name,
      description,
      slug
    }, '카테고리가 생성되었습니다'));
    
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json(
        createResponse(false, null, null, '이미 존재하는 카테고리명입니다')
      );
    } else {
      res.status(500).json(
        createResponse(false, null, null, '카테고리 생성 실패')
      );
    }
  }
});

// ==========================================================
// 대시보드 API
// ==========================================================

app.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    const isAdmin = req.session.user.role === 'admin';
    const userId = req.session.user.id;
    
    // 기본 통계
    const stats = {};
    
    if (isAdmin) {
      // 관리자 전용 통계
      const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = true');
      const [postCount] = await pool.execute('SELECT COUNT(*) as count FROM posts');
      const [publishedCount] = await pool.execute('SELECT COUNT(*) as count FROM posts WHERE status = "published"');
      const [categoryCount] = await pool.execute('SELECT COUNT(*) as count FROM categories WHERE is_active = true');
      
      stats.users = userCount[0].count;
      stats.totalPosts = postCount[0].count;
      stats.publishedPosts = publishedCount[0].count;
      stats.categories = categoryCount[0].count;
    } else {
      // 일반 사용자 통계 (본인 것만)
      const [myPostCount] = await pool.execute('SELECT COUNT(*) as count FROM posts WHERE author_id = ?', [userId]);
      const [myPublishedCount] = await pool.execute('SELECT COUNT(*) as count FROM posts WHERE author_id = ? AND status = "published"', [userId]);
      const [myViews] = await pool.execute('SELECT SUM(views) as total FROM posts WHERE author_id = ?', [userId]);
      
      stats.myPosts = myPostCount[0].count;
      stats.myPublishedPosts = myPublishedCount[0].count;
      stats.myTotalViews = myViews[0].total || 0;
    }
    
    // 최근 포스트
    const [recentPosts] = await pool.execute(`
      SELECT p.id, p.title, p.status, p.views, p.created_at, u.username as author
      FROM posts p
      JOIN users u ON p.author_id = u.id
      ${isAdmin ? '' : 'WHERE p.author_id = ?'}
      ORDER BY p.created_at DESC
      LIMIT 5
    `, isAdmin ? [] : [userId]);
    
    res.json(createResponse(true, {
      stats,
      recentPosts
    }));
    
  } catch (error) {
    res.status(500).json(
      createResponse(false, null, null, '대시보드 데이터 조회 실패')
    );
  }
});

// ==========================================================
// 홈페이지 및 문서화
// ==========================================================

app.get('/', (req, res) => {
  const isLoggedIn = !!req.session.user;
  
  res.json({
    title: '🎉 완전한 CRUD API 시스템',
    description: 'Node.js Express를 활용한 완전한 백엔드 시스템',
    version: '1.0.0',
    features: [
      '🔐 JWT 기반 인증 시스템',
      '👥 역할 기반 접근 제어 (RBAC)',
      '📝 완전한 CRUD API',
      '🗄️ MySQL 데이터베이스 연동',
      '🔍 고급 검색 및 필터링',
      '📄 페이지네이션',
      '🏷️ 태그 시스템',
      '📊 대시보드 및 통계',
      '✅ 입력 검증 및 에러 처리'
    ],
    authentication: {
      status: isLoggedIn ? 'authenticated' : 'not_authenticated',
      user: isLoggedIn ? req.session.user : null
    },
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me'
      },
      users: {
        list: 'GET /api/users (admin only)',
        get: 'GET /api/users/:id',
        create: 'POST /api/users',
      },
      posts: {
        list: 'GET /api/posts',
        get: 'GET /api/posts/:id',
        create: 'POST /api/posts (auth required)',
        update: 'PUT /api/posts/:id (owner or admin)',
        delete: 'DELETE /api/posts/:id (owner or admin)'
      },
      categories: {
        list: 'GET /api/categories',
        create: 'POST /api/categories (admin only)'
      },
      dashboard: 'GET /api/dashboard (auth required)'
    },
    testAccounts: {
      admin: { email: 'admin@example.com', password: 'admin123!' },
      editor: { email: 'editor@example.com', password: 'admin123!' },
      user: { email: 'user@example.com', password: 'admin123!' }
    }
  });
});

// ==========================================================
// 에러 처리
// ==========================================================

// 404 처리
app.use('*', (req, res) => {
  res.status(404).json(
    createResponse(false, null, null, `경로를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`)
  );
});

// 전역 에러 처리
app.use((err, req, res, next) => {
  console.error('전역 에러:', err);
  res.status(500).json(
    createResponse(false, null, null, '서버 내부 오류가 발생했습니다')
  );
});

// ==========================================================
// 서버 시작
// ==========================================================

async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log('='.repeat(70));
      console.log('🎉 완전한 CRUD API 시스템 서버 시작!');
      console.log(`📍 주소: http://localhost:${PORT}`);
      console.log('');
      console.log('🔑 테스트 계정:');
      console.log('   Admin: admin@example.com / admin123!');
      console.log('   Editor: editor@example.com / admin123!');
      console.log('   User: user@example.com / admin123!');
      console.log('');
      console.log('📖 API 문서: http://localhost:3000 (루트 페이지)');
      console.log('📊 대시보드: GET /api/dashboard');
      console.log('🔐 로그인: POST /api/auth/login');
      console.log('📝 포스트: GET /api/posts');
      console.log('');
      console.log('✨ 모든 Express 기능이 구현된 완전한 시스템입니다!');
      console.log('='.repeat(70));
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

startServer();

// ==========================================================
// 실행 방법:
// npm install express express-session bcrypt mysql2
// cp tutorial/steps/step11_crud_complete.js app.js
// MySQL 설정 후 npm run dev
//
// 🎯 완성된 기능:
// - 인증 & 인가 시스템
// - 사용자 관리 (CRUD)
// - 포스트 관리 (CRUD)  
// - 카테고리 & 태그 시스템
// - 검색 & 필터링 & 페이지네이션
// - 대시보드 & 통계
// - 에러 처리 & 검증
// ==========================================================
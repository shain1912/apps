// ==========================================================
// 9단계: MySQL 데이터베이스 연동
// ==========================================================
// 학습 목표:
// 1. MySQL 연결 설정
// 2. Connection Pool 사용
// 3. SQL 쿼리 실행 (SELECT, INSERT, UPDATE, DELETE)
// 4. 에러 처리와 트랜잭션

import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3000;

// ==========================================================
// MySQL 연결 설정
// ==========================================================

// 데이터베이스 설정
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '1234', // 실제 비밀번호로 변경
  database: 'express_tutorial',
  charset: 'utf8mb4',
  timezone: '+09:00'
};

// Connection Pool 생성 (권장 방식)
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

// ==========================================================
// 데이터베이스 초기화
// ==========================================================

async function initializeDatabase() {
  try {
    // 데이터베이스 생성 (존재하지 않을 경우)
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
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  const createPostsTable = `
    CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      author_id INT NOT NULL,
      views INT DEFAULT 0,
      status ENUM('draft', 'published') DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  const createTagsTable = `
    CREATE TABLE IF NOT EXISTS tags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
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
  await pool.execute(createPostsTable);
  await pool.execute(createTagsTable);
  await pool.execute(createPostTagsTable);
}

// ==========================================================
// 샘플 데이터 삽입
// ==========================================================

async function insertSampleData() {
  try {
    // 사용자 데이터 확인
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    
    if (users[0].count === 0) {
      const sampleUsers = [
        ['김철수', 'kim@example.com', 'password123', 'admin'],
        ['이영희', 'lee@example.com', 'password123', 'user'],
        ['박민수', 'park@example.com', 'password123', 'user']
      ];
      
      for (const user of sampleUsers) {
        await pool.execute(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          user
        );
      }
      
      // 샘플 포스트 삽입
      const samplePosts = [
        [1, 'MySQL 연동 가이드', 'Node.js Express에서 MySQL을 연동하는 방법을 알아봅시다.', 'published'],
        [2, 'Connection Pool 사용법', 'Database Connection Pool을 사용하여 성능을 최적화하는 방법입니다.', 'published'],
        [1, '트랜잭션 처리', 'MySQL에서 트랜잭션을 안전하게 처리하는 방법을 설명합니다.', 'draft']
      ];
      
      for (const [authorId, title, content, status] of samplePosts) {
        await pool.execute(
          'INSERT INTO posts (author_id, title, content, status) VALUES (?, ?, ?, ?)',
          [authorId, title, content, status]
        );
      }
      
      // 샘플 태그 삽입
      const sampleTags = ['MySQL', 'Database', 'Node.js', 'Express', 'Backend'];
      
      for (const tagName of sampleTags) {
        await pool.execute('INSERT INTO tags (name) VALUES (?)', [tagName]);
      }
      
      // 포스트-태그 관계 삽입
      const postTagRelations = [
        [1, 1], [1, 2], [1, 3], // 첫 번째 포스트
        [2, 1], [2, 2], [2, 4], // 두 번째 포스트
        [3, 1], [3, 5] // 세 번째 포스트
      ];
      
      for (const [postId, tagId] of postTagRelations) {
        await pool.execute(
          'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
          [postId, tagId]
        );
      }
      
      console.log('✅ 샘플 데이터 삽입 완료');
    }
  } catch (error) {
    console.error('❌ 샘플 데이터 삽입 실패:', error.message);
  }
}

// ==========================================================
// 라우트 정의
// ==========================================================

// 홈페이지 - 통계 대시보드
app.get('/', async (req, res) => {
  try {
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [postCount] = await pool.execute('SELECT COUNT(*) as count FROM posts WHERE status = "published"');
    const [totalViews] = await pool.execute('SELECT SUM(views) as total FROM posts');
    const [recentPosts] = await pool.execute(`
      SELECT p.title, p.views, u.name as author, p.created_at 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC 
      LIMIT 5
    `);
    
    res.json({
      title: 'MySQL 연동 대시보드',
      stats: {
        users: userCount[0].count,
        posts: postCount[0].count,
        totalViews: totalViews[0].total || 0
      },
      recentPosts: recentPosts,
      message: '🎉 MySQL 연동이 성공적으로 완료되었습니다!'
    });
  } catch (error) {
    res.status(500).json({ error: '데이터베이스 조회 실패', details: error.message });
  }
});

// 모든 사용자 조회
app.get('/users', async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT u.*, 
             COUNT(p.id) as post_count,
             SUM(p.views) as total_views
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ error: '사용자 조회 실패', details: error.message });
  }
});

// 특정 사용자 조회
app.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }
    
    const [posts] = await pool.execute(`
      SELECT p.*, GROUP_CONCAT(t.name) as tags
      FROM posts p
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.author_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      user: users[0],
      posts: posts
    });
  } catch (error) {
    res.status(500).json({ error: '사용자 조회 실패', details: error.message });
  }
});

// 사용자 생성
app.post('/users', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { name, email, password, role = 'user' } = req.body;
    
    // 입력값 검증
    if (!name || !email || !password) {
      return res.status(400).json({ error: '이름, 이메일, 비밀번호는 필수입니다' });
    }
    
    // 이메일 중복 확인
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: '이미 존재하는 이메일입니다' });
    }
    
    // 사용자 생성
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role] // 실제로는 비밀번호 해싱 필요
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: '사용자가 생성되었습니다',
      userId: result.insertId
    });
    
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: '사용자 생성 실패', details: error.message });
  } finally {
    connection.release();
  }
});

// 모든 포스트 조회 (태그 포함)
app.get('/posts', async (req, res) => {
  try {
    const { status = 'published', limit = 10, offset = 0 } = req.query;
    
    const [posts] = await pool.execute(`
      SELECT p.*, u.name as author, 
             GROUP_CONCAT(t.name) as tags
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.status = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [status, parseInt(limit), parseInt(offset)]);
    
    res.json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    res.status(500).json({ error: '포스트 조회 실패', details: error.message });
  }
});

// 포스트 조회수 증가
app.patch('/posts/:id/views', async (req, res) => {
  try {
    const postId = req.params.id;
    
    await pool.execute('UPDATE posts SET views = views + 1 WHERE id = ?', [postId]);
    
    res.json({
      success: true,
      message: '조회수가 증가했습니다'
    });
  } catch (error) {
    res.status(500).json({ error: '조회수 업데이트 실패', details: error.message });
  }
});

// 복잡한 검색 (LIKE, JOIN 활용)
app.get('/search', async (req, res) => {
  try {
    const { q, tag, author } = req.query;
    
    let sql = `
      SELECT DISTINCT p.*, u.name as author,
             GROUP_CONCAT(t.name) as tags
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.status = 'published'
    `;
    
    const params = [];
    
    if (q) {
      sql += ' AND (p.title LIKE ? OR p.content LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    
    if (tag) {
      sql += ' AND t.name = ?';
      params.push(tag);
    }
    
    if (author) {
      sql += ' AND u.name LIKE ?';
      params.push(`%${author}%`);
    }
    
    sql += ' GROUP BY p.id ORDER BY p.created_at DESC';
    
    const [results] = await pool.execute(sql, params);
    
    res.json({
      success: true,
      query: { q, tag, author },
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({ error: '검색 실패', details: error.message });
  }
});

// 데이터베이스 상태 확인
app.get('/db-status', async (req, res) => {
  try {
    const [result] = await pool.execute('SELECT 1 as connected, NOW() as server_time');
    
    res.json({
      status: 'connected',
      serverTime: result[0].server_time,
      pool: {
        totalConnections: pool.pool._allConnections.length,
        freeConnections: pool.pool._freeConnections.length,
        acquiringConnections: pool.pool._acquiringConnections.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'disconnected', 
      error: error.message 
    });
  }
});

// ==========================================================
// 에러 처리
// ==========================================================

app.use((err, req, res, next) => {
  console.error('데이터베이스 에러:', err);
  res.status(500).json({
    error: '서버 오류가 발생했습니다',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==========================================================
// 서버 시작
// ==========================================================

async function startServer() {
  try {
    await initializeDatabase();
    await insertSampleData();
    
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🗄️ MySQL 연동 서버 시작!');
      console.log(`📍 주소: http://localhost:${PORT}`);
      console.log('');
      console.log('📊 테스트 엔드포인트:');
      console.log(`🏠 대시보드: http://localhost:${PORT}/`);
      console.log(`👥 사용자: http://localhost:${PORT}/users`);
      console.log(`📝 포스트: http://localhost:${PORT}/posts`);
      console.log(`🔍 검색: http://localhost:${PORT}/search?q=MySQL`);
      console.log(`💚 DB 상태: http://localhost:${PORT}/db-status`);
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
// 1. MySQL 설치 및 실행
// 2. npm install mysql2
// 3. cp tutorial/steps/step09_mysql.js app.js
// 4. MySQL 비밀번호 수정 (line 15)
// 5. npm run dev
//
// 데이터베이스와 테이블이 자동으로 생성됩니다!
// ==========================================================
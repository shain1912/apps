// ==========================================================
// 8단계: EJS 템플릿 엔진 완전 정복
// ==========================================================
// 학습 목표:
// 1. EJS 템플릿 엔진 설정과 사용법
// 2. 동적 HTML 렌더링
// 3. 템플릿 상속과 부분 템플릿(partials)
// 4. 템플릿에서 데이터 바인딩

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// ==========================================================
// EJS 템플릿 엔진 설정
// ==========================================================

// 뷰 엔진을 EJS로 설정
app.set('view engine', 'ejs');

// 뷰 파일 경로 설정 (기본값: ./views)
app.set('views', path.join(__dirname, 'views'));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================================
// 더미 데이터
// ==========================================================

const posts = [
  {
    id: 1,
    title: 'EJS 템플릿 엔진 소개',
    content: 'EJS는 Embedded JavaScript의 줄임말로, HTML에 JavaScript를 삽입할 수 있는 템플릿 엔진입니다.',
    author: '김철수',
    date: '2024-01-15',
    views: 150,
    tags: ['EJS', 'Node.js', 'Express']
  },
  {
    id: 2,
    title: '동적 웹 페이지 만들기',
    content: '서버 사이드에서 데이터를 처리하여 동적으로 HTML을 생성하는 방법을 알아봅시다.',
    author: '이영희',
    date: '2024-01-10',
    views: 89,
    tags: ['웹개발', 'HTML', 'JavaScript']
  },
  {
    id: 3,
    title: 'RESTful API와 템플릿',
    content: 'API에서 받은 데이터를 템플릿으로 렌더링하여 사용자에게 보여주는 방법입니다.',
    author: '박민수',
    date: '2024-01-08',
    views: 234,
    tags: ['API', 'REST', 'Template']
  }
];

const users = [
  { id: 1, name: '김철수', email: 'kim@example.com', role: 'admin', avatar: 'avatar1.jpg' },
  { id: 2, name: '이영희', email: 'lee@example.com', role: 'editor', avatar: 'avatar2.jpg' },
  { id: 3, name: '박민수', email: 'park@example.com', role: 'user', avatar: 'avatar3.jpg' }
];

// ==========================================================
// 라우트 정의
// ==========================================================

// 홈페이지 - 기본 EJS 렌더링
app.get('/', (req, res) => {
  res.render('home', {
    title: 'EJS 템플릿 엔진 학습',
    message: 'Express와 EJS로 동적 웹페이지를 만들어보세요!',
    posts: posts,
    currentPage: 'home'
  });
});

// 블로그 목록
app.get('/posts', (req, res) => {
  const { search, tag } = req.query;
  let filteredPosts = posts;
  
  // 검색 필터
  if (search) {
    filteredPosts = filteredPosts.filter(post => 
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.content.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // 태그 필터
  if (tag) {
    filteredPosts = filteredPosts.filter(post => 
      post.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  }
  
  res.render('posts/list', {
    title: '블로그 포스트',
    posts: filteredPosts,
    searchQuery: search || '',
    selectedTag: tag || '',
    allTags: [...new Set(posts.flatMap(post => post.tags))],
    currentPage: 'posts'
  });
});

// 블로그 상세보기
app.get('/posts/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  const post = posts.find(p => p.id === postId);
  
  if (!post) {
    return res.render('error', {
      title: '404 - 페이지를 찾을 수 없습니다',
      message: '요청하신 포스트를 찾을 수 없습니다.',
      statusCode: 404
    });
  }
  
  // 조회수 증가
  post.views++;
  
  // 관련 포스트 (같은 태그를 가진 포스트)
  const relatedPosts = posts
    .filter(p => p.id !== post.id && p.tags.some(tag => post.tags.includes(tag)))
    .slice(0, 3);
  
  res.render('posts/detail', {
    title: post.title,
    post: post,
    relatedPosts: relatedPosts,
    currentPage: 'posts'
  });
});

// 사용자 목록
app.get('/users', (req, res) => {
  res.render('users/list', {
    title: '사용자 목록',
    users: users,
    currentPage: 'users'
  });
});

// 사용자 상세보기
app.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.render('error', {
      title: '404 - 사용자를 찾을 수 없습니다',
      message: '요청하신 사용자를 찾을 수 없습니다.',
      statusCode: 404
    });
  }
  
  // 해당 사용자의 포스트
  const userPosts = posts.filter(post => post.author === user.name);
  
  res.render('users/detail', {
    title: `${user.name} 프로필`,
    user: user,
    posts: userPosts,
    currentPage: 'users'
  });
});

// 포스트 작성 폼
app.get('/create-post', (req, res) => {
  res.render('posts/create', {
    title: '새 포스트 작성',
    currentPage: 'create'
  });
});

// 포스트 작성 처리
app.post('/create-post', (req, res) => {
  const { title, content, author, tags } = req.body;
  
  const newPost = {
    id: posts.length + 1,
    title,
    content,
    author,
    date: new Date().toISOString().split('T')[0],
    views: 0,
    tags: tags.split(',').map(tag => tag.trim())
  };
  
  posts.push(newPost);
  
  res.redirect(`/posts/${newPost.id}`);
});

// 통계 페이지 (EJS 헬퍼 함수 사용 예시)
app.get('/stats', (req, res) => {
  const stats = {
    totalPosts: posts.length,
    totalViews: posts.reduce((sum, post) => sum + post.views, 0),
    totalUsers: users.length,
    avgViews: Math.round(posts.reduce((sum, post) => sum + post.views, 0) / posts.length),
    topPost: posts.reduce((max, post) => post.views > max.views ? post : max, posts[0]),
    recentPosts: posts.slice(-3).reverse()
  };
  
  res.render('stats', {
    title: '사이트 통계',
    stats: stats,
    currentPage: 'stats'
  });
});

// JSON API 엔드포인트 (EJS와 비교용)
app.get('/api/posts', (req, res) => {
  res.json({
    posts: posts,
    message: '이것은 JSON API 응답입니다. /posts와 비교해보세요!'
  });
});

// ==========================================================
// 에러 처리
// ==========================================================

// 404 처리
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - 페이지를 찾을 수 없습니다',
    message: '요청하신 페이지를 찾을 수 없습니다.',
    statusCode: 404
  });
});

// 에러 처리
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: '500 - 서버 오류',
    message: '서버에서 오류가 발생했습니다.',
    statusCode: 500
  });
});

// ==========================================================
// 서버 시작
// ==========================================================

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🎨 EJS 템플릿 엔진 서버 시작!');
  console.log(`📍 주소: http://localhost:${PORT}`);
  console.log('');
  console.log('📚 학습 포인트:');
  console.log('1. EJS 문법 (<% %>, <%= %>, <%- %>)');
  console.log('2. 템플릿에 데이터 전달 (res.render)');
  console.log('3. 템플릿 상속 (header, footer 분리)');
  console.log('4. 조건문과 반복문 활용');
  console.log('');
  console.log('🎯 비교해보세요:');
  console.log(`📄 EJS 렌더링: http://localhost:${PORT}/posts`);
  console.log(`📊 JSON API: http://localhost:${PORT}/api/posts`);
  console.log('='.repeat(60));
});

// ==========================================================
// 실행 방법:
// npm install ejs
// mkdir views views/posts views/users views/partials
// cp tutorial/steps/step08_ejs.js app.js
// 템플릿 파일들을 views 폴더에 생성해야 함
// npm run dev
// ==========================================================
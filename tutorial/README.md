# Node.js Express 단계별 강의

## 📚 강의 순서

각 단계별로 파일을 복사해서 실행하며 학습합니다.

### 1단계: Express 기본 코드
```bash
cp tutorial/steps/step01_basic.js app.js
npm run dev
```
- Express 서버 기본 구조
- 포트 설정과 서버 시작

### 2단계: CommonJS → ES Modules
```bash
cp tutorial/steps/step02_modules.js app.js
cp tutorial/steps/step02_package.json package.json
npm run dev
```
- `require` → `import` 변환
- `module.exports` → `export` 변환

### 3단계: HTTP vs Express 비교
```bash
# HTTP 버전
node tutorial/steps/step03_http_server.js

# Express 버전  
node tutorial/steps/step03_express_server.js
```
- 순수 Node.js HTTP와 Express 비교
- 코드 복잡성 차이

### 4단계: 라우팅 구현
```bash
cp tutorial/steps/step04_routing.js app.js
npm run dev
```
- GET, POST, PUT, DELETE 라우트
- 경로 매개변수 사용

### 5단계: 미들웨어 구현
```bash
cp tutorial/steps/step05_middleware.js app.js
npm run dev
```
- 커스텀 미들웨어 작성
- 미들웨어 체이닝과 next()

### 6단계: 쿠키 사용
```bash
cp tutorial/steps/step06_cookies.js app.js
npm install cookie-parser
npm run dev
```
- 쿠키 설정과 읽기
- 쿠키 옵션 설정

### 7단계: 세션 사용
```bash
cp tutorial/steps/step07_sessions.js app.js
npm install express-session
npm run dev
```
- 세션 설정과 사용
- 세션 기반 인증

### 8단계: 템플릿 엔진 (EJS)
```bash
cp tutorial/steps/step08_ejs.js app.js
npm install ejs
npm run dev
```
- EJS 템플릿 설정
- 동적 HTML 렌더링

### 9단계: MySQL 연동
```bash
cp tutorial/steps/step09_mysql.js app.js
npm install mysql2
npm run dev
```
- MySQL 데이터베이스 연결
- 기본 쿼리 실행

### 10단계: 로그인 구현
```bash
cp -r tutorial/steps/step10_login/* ./
npm install bcrypt
npm run dev
```
- 회원가입/로그인 구현
- 비밀번호 해싱

### 11단계: CRUD API 구현
```bash
cp -r tutorial/steps/step11_crud/* ./
npm run dev
```
- 완전한 CRUD API
- MVC 패턴 적용

## 🎯 각 단계의 학습 목표

1. **Express 기본**: 웹 서버의 기본 개념
2. **모듈 시스템**: 현대적 JavaScript 모듈 사용
3. **HTTP 비교**: Express의 장점 이해
4. **라우팅**: RESTful API 설계
5. **미들웨어**: Express의 핵심 개념
6. **쿠키**: 클라이언트 상태 관리
7. **세션**: 서버 상태 관리
8. **템플릿**: 서버 사이드 렌더링
9. **데이터베이스**: 영구 데이터 저장
10. **인증**: 보안 구현
11. **API**: 완전한 백엔드 시스템

## 📝 실습 방법

1. 각 단계의 파일을 복사
2. 서버 실행 후 테스트
3. 코드 분석 및 주석 확인
4. 다음 단계로 진행
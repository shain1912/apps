/**
 * Express 서버 실행 파일 (모던 스타일)
 * ES Modules 호환 서버 시작점
 */

import app from "../../app.js";
import http from "http";

const port = normalizePort(process.env.PORT || "5000");

const server = http.createServer(app);

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * 포트 번호 정규화
 */
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}

/**
 * HTTP 서버 에러 핸들러
 */
function onError(error) {
  if (error.syscall !== "listen") throw error;

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  switch (error.code) {
    case "EACCES":
      console.error(`❌ ${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`❌ ${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * HTTP 서버 리스닝 이벤트 핸들러
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  console.log(`🚀 Express server listening on ${bind}`);
  console.log(`📡 API: http://localhost:${port}/api/users`);
  console.log(`🌐 Web: http://localhost:${port}`);
}

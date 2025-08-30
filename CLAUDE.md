프론트는 vite react로 프로젝트 구성
백엔드는 express 로 구성 (module js 사용)
백엔드는 routes , public, 폴더 등으로 폴더 구조 사용
파일 분기를 해서 깔끔하게 구성
프로젝트를 처음만들 때 프로젝트 요구사항을 받고
plan 폴더를 만든 후 그 안에 요구사항 명세를 prd.md에 작성함
prd.md를 파싱해서 task.md로 개발 단계를 claude code context넘지 않게 잘게 나눌 것
state.json 파일 만들어서 개발을 얼만큼 진행했는지 단계 체크 해 놓을 것

프론트에서 이미지 예시 띄울떄는 웹에서 간단히 이미지 받아서 임시로 쓰고 사용자에게 폴더 넣어서 수정해달라고 하기
백엔드 테스트 프로젝트 구조는 routes , public, views, bin/www 인데 views는 템플릿엔진으로 테스트용 웹표시함 실제로는 프론트 개발을 react spa로 하지만 테스트로도 볼수있게 해야함


# Snow Manager - Mobile App

스노우화이트 관리자 모바일 애플리케이션입니다.

> ⚠️ **Note**: 이 프로젝트는 학습 목적으로 제작되었습니다.

## 📋 프로젝트 소개

효율적인 작업 관리와 사용자 관리를 위한 모바일 애플리케이션입니다. 관리자는 이 앱을 통해 작업을 생성, 조회, 수정하고, 다양한 작업 추적을 유연하게 설정할 수 있습니다.

## ✨ 주요 기능

- 📝 새로운 작업 생성 및 상세 정보 입력
- 📋 작업 목록 조회 및 상태 관리
- ⚙️ 작업별 세부 옵션 설정 및 수정 (박 종류, 코팅 방식, 재단 옵션 등)
- 📊 작업 진행 상황 추적 및 업데이트

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| **Framework** | React Native, Expo |
| **Language** | TypeScript (96.2%) |
| **State Management** | Zustand (stores) |
| **Backend** | NestJS |
| **Database** | MySQL |
| **Build** | EAS Build |

## 📁 프로젝트 구조

```
snow-manager-app/
├── .vscode/             # VS Code 설정
├── android/             # Android 네이티브 코드
├── app/                 # 앱 라우팅 (Expo Router)
├── assets/              # 이미지, 폰트 등 정적 파일
├── components/          # 재사용 가능한 컴포넌트
├── constants/           # 상수 정의
├── hooks/               # 커스텀 훅
├── scripts/             # 스크립트
├── stores/              # 상태 관리 (Zustand)
├── app.json             # Expo 설정
├── eas.json             # EAS 빌드 설정
├── google-services.json # Firebase 설정
├── package.json         # 의존성 관리
├── tsconfig.json        # TypeScript 설정
└── README.md
```

## 🚀 시작하기

### 설치

```bash
# 저장소 클론
git clone https://github.com/greekr4/snow-manager-app.git

# 디렉토리 이동
cd snow-manager-app

# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
# Expo 개발 서버 시작
npx expo start
```

### 빌드

```bash
# 테스트 버전 빌드 (Android)
eas build -p android --profile preview

# 최근 Android 빌드 설치
eas build:run --platform android
```

## 🎨 화면 디자인

### ERD
<img width="1726" height="422" alt="image" src="https://github.com/user-attachments/assets/c503efa6-a097-4b17-a445-3ef16765d03e" />

### Figma 화면
<img width="253" height="532" alt="image" src="https://github.com/user-attachments/assets/08b513e6-7056-441b-bf47-a61c44a8917e" />
<img width="826" height="534" alt="image" src="https://github.com/user-attachments/assets/36d96846-bba1-4a97-be18-3aa62c2ecb1f" />
<img width="241" height="818" alt="image" src="https://github.com/user-attachments/assets/62cf037e-e509-4a3a-b40f-5f202a715559" />

## 🔗 관련 저장소

| 저장소 | 설명 |
|--------|------|
| [snow-manager-nest](https://github.com/greekr4/snow-manager-nest) | 백엔드 API 서버 |

## 📚 참고 자료

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

## 👤 Author

[@greekr4](https://github.com/greekr4)

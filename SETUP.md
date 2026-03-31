# 🚀 دليل إعداد تطبيق وصل (Wasal)

## المتطلبات
- Node.js 18+ (تحقق: `node -v`)
- npm أو yarn
- حساب Google (لإنشاء مشروع Firebase)

---

## 1. إعداد Firebase

### أ. إنشاء مشروع جديد
1. اذهب إلى [console.firebase.google.com](https://console.firebase.google.com)
2. انقر **"Add project"** → أدخل اسم المشروع (مثلاً: `wasal-app`) → أنشئ المشروع

### ب. تفعيل Authentication
1. من القائمة الجانبية → **Authentication** → **Get started**
2. انقر **Email/Password** → فعّله → احفظ

### ج. إنشاء قاعدة البيانات Firestore
1. من القائمة الجانبية → **Firestore Database** → **Create database**
2. اختر **Start in test mode** (للتطوير فقط)
3. اختر أقرب منطقة جغرافية → انتهِ

### د. إعداد Storage
1. من القائمة الجانبية → **Storage** → **Get started**
2. اختر **Start in test mode** → انتهِ

### هـ. الحصول على بيانات الاتصال
1. من صفحة Project Overview → انقر **</>** (Web app)
2. أدخل اسم التطبيق → انقر **Register app**
3. ستظهر لك بيانات مثل:
```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}
```

---

## 2. إعداد المشروع المحلي

### أ. نسخ ملف البيئة
```bash
cp .env.example .env
```

### ب. تعديل ملف `.env`
افتح الملف وأضف بياناتك من Firebase:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=wasal-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=wasal-app
VITE_FIREBASE_STORAGE_BUCKET=wasal-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### ج. تثبيت الحزم وتشغيل التطبيق
```bash
npm install
npm run dev
```

سيفتح التطبيق على: http://localhost:3000

---

## 3. قواعد Firestore (للإنتاج)

استبدل قواعد test mode بهذه القواعد في Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // المستخدمون يقرؤون ويكتبون بياناتهم فقط
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    // المحادثات: المشاركون فقط
    match /chats/{chatId} {
      allow read, write: if request.auth != null &&
        request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
      match /messages/{msgId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

---

## 4. قواعد Storage (للإنتاج)

في Firebase Console → Storage → Rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /chats/{chatId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 5. النشر على الإنترنت

### خيار 1: Firebase Hosting (موصى به)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### خيار 2: Vercel (أسهل)
1. ارفع المشروع على GitHub
2. اذهب إلى [vercel.com](https://vercel.com)
3. انقر "Import Project" → اختر المستودع
4. أضف متغيرات البيئة من ملف `.env`
5. انقر Deploy!

---

## 📌 ملاحظات مهمة

- **الإشعارات**: تطلب التطبيق إذن الإشعارات تلقائياً عند أول محادثة
- **الوضع التجريبي**: في test mode، البيانات مكشوفة لمدة 30 يوم — حدّث القواعد قبل الإنتاج
- **حجم الملفات**: Storage يدعم ملفات كبيرة، لكن تأكد من خطة Firebase تناسب حجم الاستخدام

---

## 🐛 حل المشكلات الشائعة

| المشكلة | الحل |
|---------|------|
| `Firebase: Error (auth/configuration-not-found)` | تأكد من ملف `.env` وإعادة تشغيل `npm run dev` |
| الصور لا ترفع | تأكد من تفعيل Firebase Storage وضبط القواعد |
| `CORS error` | تأكد من `authDomain` في الإعدادات |

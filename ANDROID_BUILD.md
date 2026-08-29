# تحويل أنس المحاسبي AI إلى Android APK

تم تجهيز المشروع ليعمل مع Capacitor.

## 1) المتطلبات
- Node.js 20+
- npm
- Android Studio + Android SDK + JDK 21
- اتصال إنترنت أول مرة لتنزيل Gradle/Android dependencies

## 2) تثبيت الحزم
```bash
npm install
```

## 3) إعداد API
التطبيق يحتوي على واجهة React وخادم Express منفصل. قبل إنشاء APK، انشر `server.ts` على HTTPS، ثم أنشئ `.env`:

```env
VITE_API_BASE_URL=https://YOUR-API-DOMAIN.example
```

لا تضع `GEMINI_API_KEY` داخل التطبيق أو ملفات الواجهة.

## 4) إنشاء مشروع Android ومزامنته
```bash
npm run android:sync
```

ثم:
```bash
npm run android:open
```

سيُفتح مجلد `android/` في Android Studio.

## 5) بناء APK
من Android Studio: Build → Generate App Bundle / APK → Generate APK.

أو:
```bash
npm run android:build
```

## ملاحظات
- اسم التطبيق: أنس المحاسبي AI
- Application ID: `com.anas.accountingai`
- الواجهة العربية RTL محفوظة.
- الميكروفون والصوت يعتمدان على Web Speech API داخل WebView؛ على بعض إصدارات Android قد تحتاج صلاحية RECORD_AUDIO.
- ميزات Gemini الموجودة في `/api/*` تحتاج خادم Express منشوراً، لأن مفتاح Gemini لا يجب تضمينه في APK.

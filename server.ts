/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const AI_TAB_LABELS: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  accounts: 'الحسابات والعملاء',
  ledger: 'دفتر القيود',
  invoice: 'الفواتير',
  reports: 'التقارير',
  'ai-control': 'تحكم الذكاء الاصطناعي',
  'sync-import': 'المزامنة والاستيراد',
  recycle: 'سلة المحذوفات',
  'activity-log': 'سجل العمليات',
  gateway: 'الإعدادات والبوابة',
  backup: 'النسخ الاحتياطي'
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Keep request bodies bounded. Base64 expands binary payloads, so 12 MB is enough for the UI's document workflow without exposing a 50 MB abuse surface.
  app.use(express.json({ limit: "12mb" }));
  app.use(express.urlencoded({ limit: "12mb", extended: true }));

  // Lightweight in-process rate limiter for the unauthenticated AI routes.
  // Production deployments should also enforce a reverse-proxy/API-gateway limit.
  const aiRequestLog = new Map<string, number[]>();
  const AI_WINDOW_MS = 60_000;
  const AI_MAX_REQUESTS = 20;
  const rateLimitAI = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const recent = (aiRequestLog.get(key) || []).filter(ts => now - ts < AI_WINDOW_MS);
    if (recent.length >= AI_MAX_REQUESTS) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({ error: 'تم تجاوز حد طلبات الذكاء الاصطناعي مؤقتاً. حاول بعد دقيقة.' });
    }
    recent.push(now);
    aiRequestLog.set(key, recent);
    return next();
  };

  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of aiRequestLog) {
      const recent = timestamps.filter(ts => now - ts < AI_WINDOW_MS);
      if (recent.length) aiRequestLog.set(key, recent);
      else aiRequestLog.delete(key);
    }
  }, AI_WINDOW_MS).unref();

  // API Route: Check system health
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // API Route: Parse PDF or Image using Gemini 3.5 Flash
  app.post("/api/parse-document", rateLimitAI, async (req, res) => {
    try {
      const { fileData, mimeType, textContent } = req.body || {};

      if (!fileData && !textContent) {
        return res.status(400).json({ error: "الرجاء توفير ملف مرمز بـ Base64 أو نص للتحليل." });
      }

      if (typeof fileData !== 'undefined' && (typeof fileData !== 'string' || fileData.length > 8_000_000)) {
        return res.status(413).json({ error: "حجم المستند المرسل أكبر من الحد المسموح." });
      }
      if (typeof textContent !== 'undefined' && (typeof textContent !== 'string' || textContent.length > 250_000)) {
        return res.status(413).json({ error: "حجم النص المرسل أكبر من الحد المسموح." });
      }
      const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'text/plain', 'text/csv']);
      if (fileData && (!mimeType || !allowedMimeTypes.has(mimeType))) {
        return res.status(415).json({ error: "نوع الملف غير مدعوم للتحليل." });
      }

      // Check if API key is configured
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "معذرة، لم يتم العثور على مفتاح الكود السري GEMINI_API_KEY في بيئة العمل. الرجاء ضبط السيكرت من الإعدادات."
        });
      }

      const prompt = `
      أنت محاسب قانوني محترف وخبير في تحليل وتفريغ القيود المالية من الفواتير والتقارير المالية.
      مهمتك هي تحليل المستند المرفق (سواء كان صورة فاتورة، أو مستند PDF مالي، أو كشف حساب) وتفريغ الحسابات المالية (Accounts) والقيود اليومية ومبيعات دفتر الـ 30 يوماً (Ledger Entries).

      يرجى استخراج البيانات بدقة متناهية وإرجاعها بصيغة JSON متوافقة كلياً مع الموديل التالي وبدون أي كود إضافي خارج الـ JSON:

      {
        "accounts": [
          {
            "name": "اسم المورد أو العميل كاملاً (مثال: مؤسسة النور للتوريد)",
            "phone": "رقم الهاتف مع فتح الخط إن وجد (مثال: +967770000000) أو اتركه فارغاً",
            "address": "العنوان بالتفصيل أو المدينة (مثال: صنعاء - شارع الجزائر) أو اتركه فارغاً",
            "openingBalance": 12000, // رصيد افتتاحي كقيمة عددية فقط
            "type": "supplier", // يجب أن يكون حصراً إما "supplier" (مورد) أو "buyer" (عميل ومشتري)
            "currency": "YER" // العملة المفترضة: YER أو USD أو SAR أو AED
          }
        ],
        "ledgerEntries": [
          {
            "date": "2026-06-16", // تاريخ القيد بالصيغة YYYY-MM-DD
            "description": "تفاصيل ومحتوى القيد بالتفصيل (مثل: مبيعات الإسمنت والحديد)",
            "quantity": 10, // الكمية كقيمة عددية
            "unitPrice": 500, // سعر الوحدة كقيمة عددية
            "extraCharges": 0, // رسوم أو مصاريف إضافية إن وجدت
            "total": 5000, // الإجمالي = (الكمية * سعر الوحدة) + مصاريف إضافية
            "transactionType": "debit" // يجب أن يكون "debit" (مبيعات/مدين) أو "credit" (مشتريات/دائن)
          }
        ]
      }

      تنبيهات هامة جداً:
      1. في حال عدم وجود رقم هاتف أو عنوان أو تفاصيل دقيقة، اتركها كحقول فارغة "" لكن لا تفترض بيانات وهمية عشوائية.
      2. تأكد دائماً أن الحساب يتم تصنيفه إما "supplier" (إذا كنا نشتري منه بضائع) أو "buyer" (إذا كنا نبيعه بضائع أو هو مستهلك).
      3. يجب أن تكون مخرجاتك قائمة (Array) حتى لو استخرجت حساباً واحداً أو قيداً واحداً فقط.
      `;

      const contents: any[] = [{ text: prompt }];
      if (textContent) {
        contents.push({ text: `البيانات المستخرجة (CSV/Text):\n\n${textContent}` });
      }
      if (fileData && mimeType) {
        contents.push({
          inlineData: {
            data: fileData,
            mimeType: mimeType,
          },
        });
      }

      const response = await getGenAI().models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-3.7-flash",
        contents: contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              accounts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name of account" },
                    phone: { type: Type.STRING, description: "Phone number of account" },
                    address: { type: Type.STRING, description: "Address of account" },
                    openingBalance: { type: Type.NUMBER, description: "Opening balance or initial debt" },
                    type: { type: Type.STRING, description: "Should be either 'supplier' or 'buyer'" },
                    currency: { type: Type.STRING, description: "Currency e.g. YER, USD, SAR, AED" },
                  },
                  required: ["name", "type"],
                },
              },
              ledgerEntries: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING, description: "Date of entry in YYYY-MM-DD format" },
                    description: { type: Type.STRING, description: "Detail or label of the entry" },
                    quantity: { type: Type.NUMBER, description: "Quantity of items" },
                    unitPrice: { type: Type.NUMBER, description: "Unit price of item" },
                    extraCharges: { type: Type.NUMBER, description: "Additional costs" },
                    total: { type: Type.NUMBER, description: "Total value of entry" },
                    transactionType: { type: Type.STRING, description: "Should be 'debit' or 'credit'" },
                  },
                  required: ["date", "description", "quantity", "unitPrice", "total", "transactionType"],
                },
              },
            },
          },
        },
      });

      const jsonText = response.text;
      if (!jsonText) {
        return res.status(500).json({ error: "فشل الذكاء الاصطناعي في تقديم استجابة منسقة." });
      }

      let parsedData: unknown;
      try {
        parsedData = JSON.parse(jsonText.trim());
      } catch {
        return res.status(502).json({ error: "تعذر تفسير الاستجابة المنظمة من خدمة الذكاء الاصطناعي." });
      }
      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error("Gemini Parsing error:", error);
      res.status(500).json({ error: "حدث خطأ غير متوقع أثناء معالجة المستند." });
    }
  });


  // API Route: Context-aware AI assistant (text + browser voice transcription)
  // The browser handles microphone capture and speech playback; this endpoint
  // securely keeps the Gemini API key on the server and supplies the live app context.
  app.post("/api/ai-chat", rateLimitAI, async (req, res) => {
    try {
      const { message, history, siteContext } = req.body || {};
      if (typeof message !== "string" || message.trim().length === 0 || message.length > 12_000) {
        return res.status(400).json({ error: "الرجاء إرسال رسالة صحيحة ضمن الحد المسموح." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "لم يتم إعداد GEMINI_API_KEY. أضف المفتاح في Secrets/Environment Variables."
        });
      }

      const safeHistory = Array.isArray(history)
        ? history.slice(-12).filter((m: any) =>
            m && (m.role === "user" || m.role === "assistant") &&
            typeof m.text === "string"
          ).map((m: any) => ({
            role: m.role,
            text: m.text.slice(0, 6000)
          }))
        : [];

      const contextJson = JSON.stringify(siteContext || {}).slice(0, 120_000);

      const systemPrompt = `
أنت "ANAS AI" المساعد الذكي المدمج داخل نظام ANAS المحاسبي المطور.
أنت مساعد عملي ودقيق باللغة العربية، وتعرف بنية التطبيق وحالة البيانات الحالية من السياق المرفق.

قدرات التطبيق الحالية تشمل:
- لوحة التحكم والمؤشرات
- العملاء والموردون والحسابات والأرصدة
- دفتر القيود والمعاملات اليومية
- فواتير المبيعات والمشتريات
- التقارير المالية
- لوحة تحكم الذكاء الاصطناعي
- الاستيراد والمزامنة والنسخ الاحتياطي
- سلة المحذوفات وسجل العمليات
- الإعدادات والبوابة
- PWA والعمل دون اتصال والمزامنة السحابية
- الإدخال السريع والآلة الحاسبة

قواعد مهمة:
1. لا تخترع أرقاماً أو حسابات أو فواتير غير موجودة في السياق.
2. عندما يكون السؤال عن أرقام مالية، اذكر العملة، وقل بوضوح إن كانت الأرقام ملخصاً من البيانات الحالية.
3. لا تدّعي أنك نفذت تعديلاً على البيانات. هذه الواجهة مخصصة حالياً للإجابة والإرشاد والتنقل الآمن.
4. إذا طلب المستخدم فتح قسم، أرجع targetTab بالقيمة المناسبة.
5. إذا كان الطلب متعلقاً بالمحاسبة، قدم تفسيراً واضحاً ولا تقدم نصيحة قانونية أو ضريبية قطعية دون تنبيه.
6. إذا كانت البيانات غير كافية، اطلب المعلومة الناقصة بدلاً من التخمين.
7. اجعل الإجابة مختصرة وعملية ومناسبة للهاتف.
8. يمكنك شرح طريقة استخدام أي ميزة موجودة في قائمة القدرات.

الأقسام المسموحة للتنقل:
${JSON.stringify(AI_TAB_LABELS)}

سياق التطبيق الحالي:
${contextJson}

أعد JSON فقط وفق المخطط المحدد.
`;

      const prompt = `
المحادثة السابقة:
${JSON.stringify(safeHistory)}

رسالة المستخدم الحالية:
${message}

أجب بالعربية.
إذا كانت الرسالة أمراً مثل "افتح الفواتير" أو "اذهب للتقارير"، ضع targetTab.
إذا لم يوجد طلب تنقل، اجعل targetTab فارغاً.
`;

      const response = await getGenAI().models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-3.7-flash",
        contents: [{ text: systemPrompt + "\n\n" + prompt }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              responseText: { type: Type.STRING },
              action: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  targetTab: { type: Type.STRING }
                },
                required: ["type", "targetTab"]
              }
            },
            required: ["responseText", "action"]
          }
        }
      });

      const text = response.text;
      if (!text) return res.status(502).json({ error: "لم تصل استجابة صالحة من نموذج الذكاء الاصطناعي." });

      let parsed: any;
      try {
        parsed = JSON.parse(text.trim());
      } catch {
        return res.status(502).json({ error: "تعذر تفسير استجابة مساعد الذكاء الاصطناعي." });
      }

      const targetTab = typeof parsed?.action?.targetTab === "string" && Object.prototype.hasOwnProperty.call(AI_TAB_LABELS, parsed.action.targetTab)
        ? parsed.action.targetTab
        : "";

      res.json({
        success: true,
        responseText: String(parsed?.responseText || "تم استلام طلبك."),
        action: { type: targetTab ? "navigate" : "none", targetTab }
      });
    } catch (error: any) {
      console.error("ANAS AI chat error:", error);
      res.status(500).json({ error: "حدث خطأ أثناء تشغيل مساعد ANAS الذكي." });
    }
  });

  // API Route: AI Manager Command Prompt (Executive theme & database controller)
  app.post("/api/ai-control", rateLimitAI, async (req, res) => {
    try {
      const { prompt, currentTheme, database } = req.body || {};
      if (typeof prompt !== 'string' || prompt.length === 0 || prompt.length > 20_000) {
        return res.status(400).json({ error: "الرجاء توفير أمر صحيح ضمن الحد المسموح." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "معذرة، لم يتم العثور على مفتاح الكود السري GEMINI_API_KEY في الإعدادات."
        });
      }

      const systemPrompt = `
      أنت الآن "المدير التنفيذي الذكي" والمتحكم والمدبر الكامل لنظام ANAS المحاسبي ومخازن بياناته.
      تم تفويضك بالكامل من قبل مدير الحسابات لتنفيذ أوامر تغيير المظهر، الألوان، الأيقونات، شكل الحسابات، تصحيح الأخطاء، وضبط قيود الجداول فورياً وبدون الرجوع لأي شخص.

      معلومات المظهر الحالية للتطبيق:
      اللون المميز (accentColor): ${currentTheme?.accentColor || "blue"}
      شكل الحواف (borderShape): ${currentTheme?.borderShape || "rounded-2xl"}
      أيقونة العلامة (brandIcon): ${currentTheme?.brandIcon || "Building2"}

      قائمة الرمز اللوني (accentColor) للتطبيق هي حصراً:
      ['slate', 'indigo', 'emerald', 'rose', 'amber', 'teal', 'orange', 'violet', 'cyan', 'fuchsia', 'lime', 'sky', 'pink', 'red', 'yellow', 'stone', 'blue']

      قائمة خيارات شكل حواف النوافذ (borderShape) هي حصراً:
      ['rounded-none' (زوايا قائمة حادة), 'rounded-xl' (حواف مودرن متوسطة), 'rounded-2xl' (افتراضية ناعمة), 'rounded-3xl' (حواف دائرية فقاعية)]

      قائمة خيارات أيقونة الهوية البراند (brandIcon) هي حصراً:
      ['Briefcase', 'Coins', 'Activity', 'Wallet', 'Landmark', 'Receipt', 'Scale', 'Calculator', 'Award', 'Shield', 'Fingerprint', 'Compass', 'Gem', 'Layers', 'ArrowLeftRight', 'Building2']

      مهمتك:
      1. فهم طلب المستخدم جيداً. إذا طلب تغيير السمة لشيء دافئ، فاختر "amber" أو "orange". إذا طلب شيء حاد أو مهني، فاختر "slate" أو "stone" أو "rounded-none". إذا طلب مظهر فاخر كالجواهر، فاختر "emerald" أو "violet" وأيقونة "Gem".
      2. إذا طلب معالجة بيانات أو حسابات (مثلاً: "جعل كل أرقام الهاتف تبتدئ برمز اليمن +967" أو "تعديل رصيد كشف مؤسسة النور ليكون 50000" أو "ترتيب القيود اليومية حسب تنازلي")، فقم بإدخال التعديلات المطلوبة وتصحيحها في مصفوفة الحسابات والقيود المقدمة لك وإعادتها محدثة بالكامل.
      3. إذا كان الطلب استفساراً عاماً ومقترحاً، قم بتطبيق ما يفيد وتحسين الألوان لشكل أفضل لائق ومفاجئ.

      يجب عليك تلبية رغبات العميل وإرجاع النتيجة بصيغة JSON متوافقة كلياً مطابقة للمخطط التالي فقط:

      {
        "responseText": "حديث إداري أنيق ومهذب باللغة العربية يشرح للعميل بدقة وجاذبية ما هي الصلاحيات والتعديلات التي قمت بفرضها على مظهر وتفاصيل التطبيق فوراً تلبيةً لأمره.",
        "themeUpdated": {
          "accentColor": "emerald", // اختياري: أرسل هذه القيمة في حال تغييرها
          "borderShape": "rounded-3xl", // اختياري: أرسل في حال تغييرها
          "brandIcon": "Gem" // اختياري: أرسل في حال تغييرها
        },
        "databaseUpdated": {
          "accounts": [], // اختياري: أرسل مصفوفة الحسابات كاملة ومكتملة بعد تعديل حقولها المحددة أو تنظيفها
          "dailyEntries": [] // اختياري: أرسل مصفوفة القيود كاملة بعد التعديل إن كان هناك تعديل مطلوب
        }
      }

      البيانات الحالية للتحليل والتعديل:
      الحسابات (Accounts): ${JSON.stringify(database?.accounts || [])}
      القيود (LedgerEntries): ${JSON.stringify(database?.dailyEntries || [])}
      `;

      const response = await getGenAI().models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              responseText: { type: Type.STRING, description: "Friendly execution summary in Arabic" },
              themeUpdated: {
                type: Type.OBJECT,
                properties: {
                  accentColor: { type: Type.STRING },
                  borderShape: { type: Type.STRING },
                  brandIcon: { type: Type.STRING }
                }
              },
              databaseUpdated: {
                type: Type.OBJECT,
                properties: {
                  accounts: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        address: { type: Type.STRING },
                        openingBalance: { type: Type.NUMBER },
                        type: { type: Type.STRING },
                        createdAt: { type: Type.STRING },
                        currency: { type: Type.STRING },
                        status: { type: Type.STRING }
                      },
                      required: ["id", "name"]
                    }
                  },
                  dailyEntries: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        dayNumber: { type: Type.NUMBER },
                        date: { type: Type.STRING },
                        description: { type: Type.STRING },
                        quantity: { type: Type.NUMBER },
                        unitPrice: { type: Type.NUMBER },
                        extraCharges: { type: Type.NUMBER },
                        total: { type: Type.NUMBER },
                        transactionType: { type: Type.STRING }
                      },
                      required: ["id", "description"]
                    }
                  }
                }
              }
            },
            required: ["responseText"]
          }
        }
      });

      let parsedResponse: Record<string, unknown>;
      try {
        parsedResponse = JSON.parse(response.text?.trim() || "{}");
      } catch {
        return res.status(502).json({ error: "تعذر تفسير استجابة المدير الذكي." });
      }
      res.json({ success: true, ...parsedResponse });
    } catch (error: any) {
      console.error("AI Executive control error:", error);
      res.status(500).json({ error: "فشل ملقم المدير التنفيذي للذكاء الاصطناعي في الاستجابة." });
    }
  });

  // Vite Middleware configuration for development, with fallback to static production assets
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode with static direct paths...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ANAS Accounting sync-enabled server running on http://localhost:${PORT}`);
  });
}

startServer();

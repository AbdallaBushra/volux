# هيكلية قاعدة بيانات Firebase لمنصة فولكس (Volux)

تم تحديث نظام الـ Authentication والـ Firestore ليدعم الأدوار الثلاثة (متطوع، منظمة، فريق) مع استخدام الـ Subcollections المطلوبة لضمان تنظيم البيانات وسرعة الوصول إليها.

## 1. هيكلية Firestore (Collections & Subcollections)

### Collection: `users`
يحتوي على البيانات الأساسية لكل مستخدم (UID، البريد الإلكتروني، الدور، الاسم المعروض، التوقيت).

*   **المستند (Document):** `{userId}`
    *   `uid`: string
    *   `email`: string
    *   `role`: "volunteer" | "institution" | "team"
    *   `displayName`: string
    *   `createdAt`: timestamp
    *   `updatedAt`: timestamp
    *   `lastLogin`: timestamp

#### Subcollections داخل `users/{userId}`:

1.  **Volunteer_Profile** (للمتطوعين فقط):
    *   المستند: `profile`
    *   يحتوي على: `firstName`, `lastName`, `nationalId`, `gender`, `birthDate`, `nationality`, `state`, `residence`, `phone`, `disability`, `howKnown`, `languages`, `mainSkills`, `experience`, `skillLevel`, `volunteeringHours`, `trainingHours`, `opportunitiesJoined`, `trainingCourses`, `level`.

2.  **Organization_Profile** (للمنظمات فقط):
    *   المستند: `profile`
    *   يحتوي على: `orgNameAr`, `orgNameEn`, `orgType`, `phone`, `website`, `state`, `address`, `activities`, `brief`, `contactName`, `contactEmail`, `contactPhone`, `totalVolunteers`, `activeOpportunities`, `completedProjects`, `rating`.

3.  **Volunteer_Team_Profile** (للفرق التطوعية فقط):
    *   المستند: `profile`
    *   يحتوي على: `teamNameAr`, `teamNameEn`, `phone`, `activities`, `description`, `leaderName`, `leaderEmail`, `leaderPhone`, `teamSize`, `activeMembers`, `completedProjects`, `ongoingProjects`, `successRate`.

## 2. المجموعات الأخرى (Collections) المطلوبة:
يجب التأكد من إنشاء هذه المجموعات في Firebase Console (أو سيتم إنشاؤها تلقائياً عند إضافة أول مستند):
*   `Opportunities`
*   `Applications`
*   `Rewards` (مع Subcollections: `Certificates`, `Badges`, `Levels`, `Leaderboard`)
*   `Reports` (مع Subcollections: `Complaints`, `Users Report`, `Opportunities Report`)
*   `Notifications` (مع Subcollections: `in_App`, `Email_Verfication`)
*   `Media_Files` (مع Subcollections: `Images`, `Videos`, `Files`)

## 3. التغييرات البرمجية الرئيسية:
1.  **`src/auth/registerUser.js`**: تم تحديثه ليقوم بإنشاء الحساب في Auth، ثم إنشاء المستند الرئيسي في `users` ثم إنشاء مستند البروفايل في الـ Subcollection المناسب.
2.  **`src/database/userData.js`**: تم تحديثه ليقوم بدمج البيانات من المستند الرئيسي والـ Subcollection عند الجلب، وتوزيع التحديثات عليهما عند الحفظ.
3.  **`src/App.js`**: تم إضافة `ToastProvider` وإصلاح نظام التوجيه (Routing) لضمان انتقال المستخدم للبروفايل الصحيح.
4.  **`src/components/Toast.jsx`**: مكون جديد لعرض رسائل النجاح والفشل (Notifications) داخل المنصة.

## 4. ملاحظات هامة:
*   تأكد من تفعيل **Email/Password Authentication** في Firebase Console.
*   تأكد من ضبط **Firestore Rules** لتسمح للمستخدمين بالقراءة والكتابة في مستنداتهم الخاصة.

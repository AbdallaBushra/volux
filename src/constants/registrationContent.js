const volunteerTerms = {
  en: {
    title: "Volunteer Terms and Conditions",
    intro: "Please review the volunteer commitments before completing registration.",
    items: [
      "Provide accurate identity, contact, skills, and availability information.",
      "Apply only to opportunities you can realistically attend and complete.",
      "Respect organizers, beneficiaries, other volunteers, privacy, and community dignity.",
      "Points, hours, badges, and certificates are granted only after verified completion.",
      "Repeated no-shows, false information, harassment, or misuse of reports may restrict the account.",
      "Keep opportunity details, beneficiary data, and platform communications confidential when required.",
    ],
  },
  ar: {
    title: "شروط وأحكام المتطوع",
    intro: "يرجى مراجعة التزامات المتطوع قبل إكمال التسجيل.",
    items: [
      "تقديم بيانات هوية وتواصل ومهارات وتوفر صحيحة ودقيقة.",
      "التقديم فقط على الفرص التي يمكنك حضورها وإكمالها بواقعية.",
      "احترام المنظمين والمستفيدين والمتطوعين وخصوصية وكرامة المجتمع.",
      "لا تمنح النقاط والساعات والأوسمة والشهادات إلا بعد التحقق من اكتمال المشاركة.",
      "قد يؤدي تكرار الغياب أو البيانات غير الصحيحة أو الإساءة أو سوء استخدام البلاغات إلى تقييد الحساب.",
      "الحفاظ على سرية تفاصيل الفرص وبيانات المستفيدين ومراسلات المنصة عند الحاجة.",
    ],
  },
};

const teamTerms = {
  en: {
    title: "Volunteer Team Terms and Conditions",
    intro: "Team accounts must follow these operating standards on Volux.",
    items: [
      "Register the team with accurate leadership, contact, members, and field-of-work information.",
      "Publish opportunities only within the team's approved fields and operational capacity.",
      "Coordinate volunteers professionally and avoid collecting unrelated sensitive data.",
      "Confirm attendance, acceptance, completion, and bonus selections honestly.",
      "Reports, rewards, and certificates must reflect real participation records.",
      "Volux may suspend publishing privileges for unsafe, misleading, or repeatedly late practices.",
    ],
  },
  ar: {
    title: "شروط وأحكام الفرق التطوعية",
    intro: "يجب على حسابات الفرق الالتزام بهذه المعايير التشغيلية داخل Volux.",
    items: [
      "تسجيل الفريق ببيانات قيادة وتواصل وأعضاء ومجالات عمل صحيحة.",
      "نشر الفرص فقط ضمن مجالات الفريق المعتمدة وقدرته التشغيلية.",
      "تنسيق المتطوعين بمهنية وعدم جمع بيانات حساسة غير مرتبطة بالفرصة.",
      "تأكيد الحضور والقبول والاكتمال واختيار المتطوعين المميزين بأمانة.",
      "يجب أن تعكس البلاغات والمكافآت والشهادات سجلات مشاركة حقيقية.",
      "قد تقوم Volux بتعليق صلاحيات النشر عند وجود ممارسات غير آمنة أو مضللة أو متأخرة بشكل متكرر.",
    ],
  },
};

const organizationTerms = {
  en: {
    title: "Organization Terms and Conditions",
    intro: "Organizations must meet these standards before operating on Volux.",
    items: [
      "Provide valid legal, license, contact, and operational information.",
      "Keep the organization license active and renew it before applying to the platform.",
      "Publish lawful, safe, realistic opportunities with clear schedules, locations, and responsibilities.",
      "Protect volunteer and beneficiary data and use it only for the approved opportunity purpose.",
      "Confirm completion and rewards only for accepted volunteers who actually participated.",
      "Volux may reject, suspend, or remove accounts and opportunities that violate platform standards.",
    ],
  },
  ar: {
    title: "شروط وأحكام المنظمات",
    intro: "يجب على المنظمات الالتزام بهذه المعايير قبل العمل داخل Volux.",
    items: [
      "تقديم بيانات قانونية وترخيص وتواصل وتشغيل صحيحة وسارية.",
      "الحفاظ على سريان ترخيص المنظمة وتجديده قبل التقديم على المنصة.",
      "نشر فرص قانونية وآمنة وواقعية بجداول ومواقع ومسؤوليات واضحة.",
      "حماية بيانات المتطوعين والمستفيدين واستخدامها فقط لغرض الفرصة المعتمدة.",
      "تأكيد الاكتمال والمكافآت فقط للمتطوعين المقبولين الذين شاركوا فعليًا.",
      "قد ترفض Volux أو تعلق أو تزيل الحسابات والفرص المخالفة لمعايير المنصة.",
    ],
  },
};

export const registrationTerms = {
  volunteer: volunteerTerms,
  team: teamTerms,
  organization: organizationTerms,
  institution: organizationTerms,
  en: volunteerTerms.en,
  ar: volunteerTerms.ar,
};

export const volunteerGuidelines = {
  en: {
    title: "Volunteer Guidelines",
    intro: "Potential violation - platform consequence.",
    items: [
      "No-show without notice - warning and reduced eligibility for future acceptance.",
      "False attendance or completion claims - reward cancellation and account review.",
      "Harassment, discrimination, or unsafe behavior - immediate restriction and admin review.",
      "Sharing private beneficiary or organizer data - suspension until investigation is completed.",
      "Repeated low-quality or disruptive participation - temporary opportunity application limits.",
      "Misuse of reports or false complaints - complaint privileges may be restricted.",
    ],
  },
  ar: {
    title: "إرشادات المتطوعين",
    intro: "مخالفة محتملة - العقوبة المرتبطة بها.",
    items: [
      "الغياب دون إخطار - إنذار وتقليل أولوية القبول لاحقًا.",
      "ادعاء حضور أو اكتمال غير صحيح - إلغاء المكافأة ومراجعة الحساب.",
      "الإساءة أو التمييز أو السلوك غير الآمن - تقييد فوري ومراجعة إدارية.",
      "مشاركة بيانات خاصة بالمستفيدين أو المنظمين - تعليق حتى اكتمال التحقيق.",
      "تكرار المشاركة الضعيفة أو المربكة - حدود مؤقتة على التقديم للفرص.",
      "سوء استخدام البلاغات أو البلاغات الكاذبة - قد يتم تقييد صلاحية البلاغات.",
    ],
  },
};

export const teamGuidelines = {
  en: {
    title: "Volunteer Team Guidelines",
    intro: "Potential violation - platform consequence.",
    items: [
      "Publishing vague or unverifiable opportunities - opportunity rejection or edit request.",
      "Accepting more volunteers than the team can supervise - publishing privileges review.",
      "Late response to applicants or unsafe coordination - warning and admin monitoring.",
      "Awarding completion to non-participants - reward reversal and account review.",
      "Repeated complaints from accepted volunteers - temporary publishing hold.",
      "Operating outside registered fields of work - opportunity rejection until profile update approval.",
    ],
  },
  ar: {
    title: "إرشادات الفرق التطوعية",
    intro: "مخالفة محتملة - العقوبة المرتبطة بها.",
    items: [
      "نشر فرص غامضة أو غير قابلة للتحقق - رفض الفرصة أو طلب تعديلها.",
      "قبول عدد متطوعين أكبر من قدرة الفريق على الإشراف - مراجعة صلاحيات النشر.",
      "التأخر في الرد على المتقدمين أو التنسيق غير الآمن - إنذار ومتابعة إدارية.",
      "منح اكتمال لمتطوعين لم يشاركوا - عكس المكافآت ومراجعة الحساب.",
      "تكرار الشكاوى من المتطوعين المقبولين - إيقاف مؤقت للنشر.",
      "العمل خارج مجالات الفريق المسجلة - رفض الفرصة حتى اعتماد تحديث الملف.",
    ],
  },
};

export const organizationGuidelines = {
  en: {
    title: "Organization Guidelines",
    intro: "Potential violation - platform consequence.",
    items: [
      "Expired or inaccurate license information - registration or publishing rejection until renewed.",
      "Unsafe opportunity environment - immediate opportunity removal and admin investigation.",
      "Collecting unrelated sensitive volunteer data - account restriction and data handling review.",
      "Misleading impact, hours, or beneficiary claims - report flag and publishing review.",
      "Delaying applicant decisions or completion confirmation repeatedly - automated quality review.",
      "Retaliation against reporters or volunteers - suspension pending admin decision.",
    ],
  },
  ar: {
    title: "إرشادات المنظمات",
    intro: "مخالفة محتملة - العقوبة المرتبطة بها.",
    items: [
      "بيانات ترخيص منتهية أو غير دقيقة - رفض التسجيل أو النشر حتى التجديد.",
      "بيئة فرصة غير آمنة - إزالة فورية للفرصة وتحقيق إداري.",
      "جمع بيانات حساسة غير مرتبطة بالمتطوع - تقييد الحساب ومراجعة التعامل مع البيانات.",
      "تضليل في الأثر أو الساعات أو بيانات المستفيدين - وضع بلاغ ومراجعة صلاحيات النشر.",
      "تكرار تأخير قرارات المتقدمين أو تأكيد الاكتمال - مراجعة جودة تلقائية.",
      "الانتقام من المبلغين أو المتطوعين - تعليق الحساب لحين قرار الإدارة.",
    ],
  },
};

export const volunteerViolationOptions = [
  {
    value: "no_show",
    labels: { en: "No-show without notice", ar: "الغياب دون إخطار" },
    consequence: {
      en: "Warning and reduced acceptance priority.",
      ar: "إنذار وتقليل أولوية القبول لاحقًا.",
    },
    pointsPenalty: 2,
  },
  {
    value: "false_attendance",
    labels: { en: "False attendance or completion claim", ar: "ادعاء حضور أو اكتمال غير صحيح" },
    consequence: {
      en: "Reward cancellation and account review.",
      ar: "إلغاء المكافأة ومراجعة الحساب.",
    },
    pointsPenalty: 5,
  },
  {
    value: "unsafe_behavior",
    labels: { en: "Unsafe or disrespectful behavior", ar: "سلوك غير آمن أو غير محترم" },
    consequence: {
      en: "Immediate restriction and admin review.",
      ar: "تقييد فوري ومراجعة إدارية.",
    },
    pointsPenalty: 5,
  },
  {
    value: "privacy_violation",
    labels: { en: "Privacy or data misuse", ar: "انتهاك الخصوصية أو إساءة استخدام البيانات" },
    consequence: {
      en: "Suspension until investigation is completed.",
      ar: "تعليق حتى اكتمال التحقيق.",
    },
    pointsPenalty: 5,
  },
  {
    value: "report_misuse",
    labels: { en: "Misuse of reports", ar: "سوء استخدام البلاغات" },
    consequence: {
      en: "Complaint privileges may be restricted.",
      ar: "قد يتم تقييد صلاحية البلاغات.",
    },
    pointsPenalty: 3,
  },
];

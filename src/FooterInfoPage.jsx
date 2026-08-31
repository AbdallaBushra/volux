import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiCheckCircle, FiHelpCircle, FiLock, FiShield } from "react-icons/fi";
import { useLanguage } from "./context/LanguageContext";
import { organizationGuidelines, registrationTerms, teamGuidelines, volunteerGuidelines } from "./constants/registrationContent";
import "./styles/FooterInfoPage.css";

const pageContent = {
  "/faq": {
    icon: FiHelpCircle,
    title: { en: "FAQ", ar: "الأسئلة الشائعة" },
    subtitle: {
      en: "Clear answers for volunteers, teams, and organizations using Volux.",
      ar: "إجابات واضحة للمتطوعين والفرق والمنظمات داخل Volux.",
    },
    sections: [
      {
        heading: { en: "Getting Started", ar: "البداية" },
        items: [
          { en: "Create the account type that matches your role: volunteer, team, or organization.", ar: "أنشئ نوع الحساب المناسب لدورك: متطوع، فريق، أو منظمة." },
          { en: "Teams and organizations are reviewed before they can publish opportunities.", ar: "تتم مراجعة الفرق والمنظمات قبل نشر الفرص." },
          { en: "Volunteers can browse opportunities, apply, and track participation from their profile.", ar: "يمكن للمتطوعين تصفح الفرص والتقديم ومتابعة المشاركات من الملف الشخصي." },
        ],
      },
      {
        heading: { en: "Points and Certificates", ar: "النقاط والشهادات" },
        items: [
          { en: "Points and hours are awarded after an opportunity owner marks participation as completed.", ar: "تُضاف النقاط والساعات بعد اعتماد اكتمال المشاركة من صاحب الفرصة." },
          { en: "Certificates are generated for completed or approved participations.", ar: "يتم توليد الشهادات للمشاركات المكتملة أو المعتمدة." },
        ],
      },
    ],
  },
  "/guidelines": {
    icon: FiCheckCircle,
    title: { en: "Volunteer Guidelines", ar: "إرشادات المتطوعين" },
    subtitle: {
      en: "A practical code for respectful, reliable, and safe volunteering.",
      ar: "دليل عملي لتطوع محترم وموثوق وآمن.",
    },
    sections: [
      {
        heading: { en: "Before Applying", ar: "قبل التقديم" },
        items: [
          { en: "Review the location, time, required hours, and responsibilities carefully.", ar: "راجع الموقع والوقت والساعات المطلوبة والمسؤوليات بعناية." },
          { en: "Apply only when you can realistically attend and complete the commitment.", ar: "قدّم فقط عندما تكون قادرا على الحضور وإتمام الالتزام." },
          { en: "Keep your profile contact information updated.", ar: "حافظ على تحديث بيانات التواصل في ملفك الشخصي." },
        ],
      },
      {
        heading: { en: "During Participation", ar: "أثناء المشاركة" },
        items: [
          { en: "Follow organizer instructions and respect community members.", ar: "اتبع تعليمات المنظمين واحترم أفراد المجتمع." },
          { en: "Report safety issues or inappropriate behavior through the platform.", ar: "أبلغ عن مشكلات السلامة أو السلوك غير المناسب عبر المنصة." },
        ],
      },
    ],
  },
  "/privacy": {
    icon: FiLock,
    title: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
    subtitle: {
      en: "How Volux handles profile, participation, and platform activity data.",
      ar: "كيف تتعامل Volux مع بيانات الملف الشخصي والمشاركات ونشاط المنصة.",
    },
    sections: [
      {
        heading: { en: "Data We Use", ar: "البيانات التي نستخدمها" },
        items: [
          { en: "Account details, profile information, applications, points, badges, and certificates.", ar: "بيانات الحساب والملف الشخصي والتقديمات والنقاط والأوسمة والشهادات." },
          { en: "Administrative review data for teams, organizations, reports, and approvals.", ar: "بيانات المراجعة الإدارية للفرق والمنظمات والبلاغات والاعتمادات." },
        ],
      },
      {
        heading: { en: "How We Protect It", ar: "كيف نحميها" },
        items: [
          { en: "Access is role-based so each account sees the data needed for its workflow.", ar: "يعتمد الوصول على الدور بحيث يرى كل حساب البيانات اللازمة لعمله." },
          { en: "We use the data to operate opportunities, verify activity, and improve platform reliability.", ar: "نستخدم البيانات لتشغيل الفرص والتحقق من النشاط وتحسين موثوقية المنصة." },
        ],
      },
    ],
  },
  "/terms": {
    icon: FiShield,
    title: { en: "Terms of Service", ar: "شروط الخدمة" },
    subtitle: {
      en: "The shared rules that keep Volux trustworthy and useful.",
      ar: "القواعد المشتركة التي تجعل Volux موثوقة ومفيدة.",
    },
    sections: [
      {
        heading: { en: "Platform Use", ar: "استخدام المنصة" },
        items: [
          { en: "Use accurate information and do not impersonate another person or entity.", ar: "استخدم معلومات دقيقة ولا تنتحل شخصية فرد أو جهة أخرى." },
          { en: "Opportunities must be lawful, respectful, and aligned with community service.", ar: "يجب أن تكون الفرص قانونية ومحترمة ومرتبطة بخدمة المجتمع." },
        ],
      },
      {
        heading: { en: "Administration", ar: "الإدارة" },
        items: [
          { en: "Volux may review, approve, reject, or remove content that violates platform standards.", ar: "يمكن لـ Volux مراجعة أو قبول أو رفض أو إزالة المحتوى المخالف لمعايير المنصة." },
          { en: "Misuse of reports, certificates, points, or accounts may lead to restrictions.", ar: "إساءة استخدام البلاغات أو الشهادات أو النقاط أو الحسابات قد تؤدي إلى قيود." },
        ],
      },
    ],
  },
};

export default function FooterInfoPage() {
  const { language } = useLanguage();
  const { pathname } = useLocation();
  const content = pageContent[pathname] || pageContent["/faq"];
  const Icon = content.icon;
  const roleSections = pathname === "/guidelines"
    ? [
        { role: language === "en" ? "Volunteers" : "المتطوعون", content: volunteerGuidelines[language] },
        { role: language === "en" ? "Teams" : "الفرق التطوعية", content: teamGuidelines[language] },
        { role: language === "en" ? "Organizations" : "المنظمات", content: organizationGuidelines[language] },
      ]
    : pathname === "/terms"
    ? [
        { role: language === "en" ? "Volunteers" : "المتطوعون", content: registrationTerms.volunteer[language] },
        { role: language === "en" ? "Teams" : "الفرق التطوعية", content: registrationTerms.team[language] },
        { role: language === "en" ? "Organizations" : "المنظمات", content: registrationTerms.organization[language] },
      ]
    : [];

  return (
    <main className={`footer-info-page ${language === "ar" ? "rtl" : ""}`}>
      <section className="footer-info-hero">
        <div className="footer-info-icon">
          <Icon aria-hidden="true" />
        </div>
        <div>
          <p className="footer-info-kicker">Volux Resources</p>
          <h1>{content.title[language]}</h1>
          <p>{content.subtitle[language]}</p>
        </div>
      </section>

      <section className="footer-info-content">
        {content.sections.map((section) => (
          <article className="info-panel" key={section.heading.en}>
            <h2>{section.heading[language]}</h2>
            <ul>
              {section.items.map((item) => (
                <li key={item.en}>{item[language]}</li>
              ))}
            </ul>
          </article>
        ))}
        {roleSections.map((section) => (
          <article className="info-panel role-policy-panel" key={section.role}>
            <p className="role-policy-kicker">{section.role}</p>
            <h2>{section.content.title}</h2>
            <p className="role-policy-intro">{section.content.intro}</p>
            <ul>
              {section.content.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <div className="footer-info-actions">
        <Link to="/opportunities">{language === "en" ? "Explore Opportunities" : "تصفح الفرص"}</Link>
        <Link to="/about">{language === "en" ? "About Volux" : "عن Volux"}</Link>
      </div>
    </main>
  );
}

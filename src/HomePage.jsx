import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from './context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { fetchLeaderboardUsers } from './utils/leaderboard';
import './styles/HomePage.css';

function HomePage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isEn = language === 'en';

  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  const revealRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('show');
        });
      },
      { threshold: 0.14 }
    );

    revealRefs.current.forEach((ref) => ref && observer.observe(ref));

    return () => {
      revealRefs.current.forEach((ref) => ref && observer.unobserve(ref));
    };
  }, []);

  useEffect(() => {
    const loadHomeLeaderboard = async () => {
      setLeaderboardLoading(true);
      try {
        const users = await fetchLeaderboardUsers();
        const sorted = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
        setLeaderboardData(sorted.slice(0, 6));
      } catch (error) {
        console.error('Error fetching homepage leaderboard:', error);
        setLeaderboardData([]);
      }
      setLeaderboardLoading(false);
    };

    loadHomeLeaderboard();
  }, []);

  const addRevealRef = (el) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el);
  };

  const content = useMemo(
    () => ({
      en: {
        badge: 'Volunteer Platform for Sudan',
        heroTitle: 'Build measurable impact through coordinated volunteering.',
        heroDesc:
          'Volux connects volunteers, teams, and organizations in one trusted workspace to launch opportunities, track impact, and scale community recovery across Sudan.',
        ctaPrimary: 'Explore Opportunities',
        ctaSecondary: 'Create Your Account',
        trustPoints: ['Verified organizations', 'Transparent activity tracking', 'Role-based collaboration'],
        sectionTitleMission: 'Why Volux Works',
        sectionTextMission:
          'The platform is built for operational clarity: discover opportunities quickly, coordinate teams with less friction, and ensure every contribution can be measured and reported with confidence.',
        sectionTitleHow: 'How It Works',
        sectionTitleAreas: 'Strategic Volunteering Areas',
        sectionTitleLeaderboard: 'Top Volunteers This Period',
        leaderboardHint: 'Live ranking based on verified points from completed activities.',
        leaderboardEmpty: 'No leaderboard data yet.',
        loading: 'Loading...',
        fullLeaderboard: 'View Full Leaderboard',
        sectionTitleGovernance: 'Trust, Safety, and Governance',
        governanceCards: [
          {
            title: 'Verification Layer',
            text: 'Institutions and teams are reviewed before publication to protect volunteers and improve opportunity quality.'
          },
          {
            title: 'Data Transparency',
            text: 'Hours, points, and participation metrics are visible and auditable for clear performance evaluation.'
          },
          {
            title: 'Actionable Reporting',
            text: 'Structured insights support data-driven planning for organizations and platform administration.'
          }
        ],
        sectionTitleStories: 'Words That Inspire Volunteering',
        stories: [
          {
            quote:
              'Volunteer work is not a luxury; it is a measure of a society that believes in responsibility.',
            by: 'Ahmed Al Shugairi'
          },
          {
            quote:
              'Life’s most persistent and urgent question is: what are you doing for others?',
            by: 'Martin Luther King Jr.'
          },
          {
            quote:
              'Not all of us can do great things, but we can do small things with great love.',
            by: 'Mother Teresa'
          }
        ],
        sectionTitleFaq: 'Frequently Asked Questions',
        faqs: [
          {
            q: 'Who can join Volux?',
            a: 'Individual volunteers, registered teams, and approved organizations can all use the platform.'
          },
          {
            q: 'How are points calculated?',
            a: 'Points are awarded according to completed opportunity hours and validated participation records.'
          },
          {
            q: 'Can opportunities be virtual?',
            a: 'Yes. Organizations can publish field and virtual opportunities based on program needs.'
          },
          {
            q: 'Is Arabic supported across the platform?',
            a: 'Yes. Core platform pages support both Arabic and English for daily use.'
          }
        ],
        finalTitle: 'Ready to create meaningful impact?',
        finalText: 'Join Volux today and move from intention to measurable action.',
        finalButton: 'Get Started'
      },
      ar: {
        badge: 'منصة تطوع متكاملة للسودان',
        heroTitle: 'اصنع أثرًا حقيقيًا عبر تطوع منظم واحترافي.',
        heroDesc:
          'فولكس تربط المتطوعين والفرق والمنظمات في مساحة موحدة لإطلاق الفرص، متابعة الإنجاز، وتوسيع أثر المبادرات المجتمعية داخل السودان.',
        ctaPrimary: 'استعرض الفرص',
        ctaSecondary: 'أنشئ حسابك',
        trustPoints: ['منظمات موثقة', 'متابعة شفافة للأنشطة', 'تعاون منظم حسب الأدوار'],
        sectionTitleMission: 'لماذا فولكس فعّالة؟',
        sectionTextMission:
          'المنصة مصممة للوضوح التشغيلي: اكتشاف الفرص بسرعة، تنسيق الفرق بدون تعقيد، وضمان أن كل مساهمة قابلة للقياس والتتبع والتقييم.',
        sectionTitleHow: 'كيف تعمل المنصة',
        sectionTitleAreas: 'مجالات التطوع الاستراتيجية',
        sectionTitleLeaderboard: 'أفضل المتطوعين في الفترة الحالية',
        leaderboardHint: 'ترتيب مباشر مبني على النقاط المعتمدة من الأنشطة المكتملة.',
        leaderboardEmpty: 'لا توجد بيانات ليدربورد حتى الآن.',
        loading: 'جاري التحميل...',
        fullLeaderboard: 'عرض الليدربورد كاملة',
        sectionTitleGovernance: 'الثقة والسلامة والحوكمة',
        governanceCards: [
          {
            title: 'طبقة تحقق قوية',
            text: 'تتم مراجعة الفرق والمنظمات قبل النشر لحماية المتطوعين ورفع جودة الفرص.'
          },
          {
            title: 'شفافية في البيانات',
            text: 'الساعات والنقاط ومؤشرات المشاركة ظاهرة وقابلة للمراجعة لتقييم الأداء بوضوح.'
          },
          {
            title: 'تقارير قابلة للتنفيذ',
            text: 'مؤشرات منظمة تساعد الإدارات والمنظمات على التخطيط واتخاذ قرارات أدق.'
          }
        ],
        sectionTitleStories: 'أقوال ملهمة عن التطوع',
        stories: [
          {
            quote:
              'العمل التطوعي ليس ترفًا، بل مقياس لمجتمع يؤمن بالمسؤولية.',
            by: 'أحمد الشقيري'
          },
          {
            quote:
              'السؤال الأكثر إلحاحًا في الحياة هو: ماذا تفعل من أجل الآخرين؟',
            by: 'مارتن لوثر كينغ الابن'
          },
          {
            quote:
              'لا نستطيع جميعًا فعل أشياء عظيمة، لكن نستطيع فعل أشياء صغيرة بمحبة عظيمة.',
            by: 'الأم تيريزا'
          }
        ],
        sectionTitleFaq: 'أسئلة متكررة',
        faqs: [
          {
            q: 'من يمكنه الانضمام إلى فولكس؟',
            a: 'الأفراد المتطوعون، الفرق المسجلة، والمنظمات المعتمدة يمكنهم استخدام المنصة.'
          },
          {
            q: 'كيف يتم احتساب النقاط؟',
            a: 'تُمنح النقاط بناءً على الساعات المكتملة في الفرص مع توثيق المشاركة.'
          },
          {
            q: 'هل يمكن أن تكون الفرص افتراضية؟',
            a: 'نعم، يمكن نشر فرص ميدانية أو افتراضية حسب طبيعة البرنامج.'
          },
          {
            q: 'هل العربية مدعومة في المنصة؟',
            a: 'نعم، الصفحات الأساسية تدعم العربية والإنجليزية بشكل متكامل.'
          }
        ],
        finalTitle: 'جاهز تصنع أثر ملموس؟',
        finalText: 'انضم إلى فولكس الآن وحوّل الرغبة في المساعدة إلى نتائج قابلة للقياس.',
        finalButton: 'ابدأ الآن'
      }
    }),
    []
  );

  const c = content[isEn ? 'en' : 'ar'];

  const steps = [
    {
      icon: '/icons/create-account.svg',
      en: 'Create profile',
      ar: 'أنشئ ملفك الشخصي',
      subEn: 'Choose your role and complete your identity.',
      subAr: 'اختر نوع حسابك وأكمل بياناتك الأساسية.'
    },
    {
      icon: '/icons/choose-organization.svg',
      en: 'Find opportunities',
      ar: 'ابحث عن الفرص',
      subEn: 'Filter by category, location, and work mode.',
      subAr: 'فلتر حسب المجال والموقع ونوع الفرصة.'
    },
    {
      icon: '/icons/apply-tasks.svg',
      en: 'Apply and participate',
      ar: 'قدّم وشارك',
      subEn: 'Join missions and coordinate with teams.',
      subAr: 'انضم للمهام وتعاون مع الفرق والمنظمات.'
    },
    {
      icon: '/icons/earn-points.svg',
      en: 'Track progress',
      ar: 'تابع تقدمك',
      subEn: 'Earn points, climb levels, and build your impact profile.',
      subAr: 'اجمع النقاط وارتقِ بالمستويات وابنِ سجل أثرك.'
    }
  ];

  const areas = [
    { icon: '/icons/rebuilding-homes.svg', en: 'Community Services', ar: 'الخدمات المجتمعية' },
    { icon: '/icons/educational-support.svg', en: 'Education Support', ar: 'الدعم التعليمي' },
    { icon: '/icons/medical-assistance.svg', en: 'Medical Assistance', ar: 'المساندة الطبية' },
    { icon: '/icons/environment-cleanup.svg', en: 'Environment & Clean-up', ar: 'البيئة والنظافة' },
    { icon: '/icons/documentation-research.svg', en: 'Documentation & Research', ar: 'التوثيق والبحث' },
    { icon: '/icons/psychosocial-support.svg', en: 'Psychosocial Support', ar: 'الدعم النفسي والاجتماعي' }
  ];

  return (
    <div className={`home-shell ${isEn ? '' : 'rtl'}`}>
      <section className="home-hero">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="home-max hero-grid">
          <div className="hero-copy">
            <span className="hero-badge">{c.badge}</span>
            <h1>{c.heroTitle}</h1>
            <p>{c.heroDesc}</p>

            <div className="hero-actions">
              <button className="btn-main" onClick={() => navigate('/opportunities')}>
                {c.ctaPrimary}
              </button>
              <button className="btn-ghost" onClick={() => navigate('/register')}>
                {c.ctaSecondary}
              </button>
            </div>

            <ul className="trust-list">
              {c.trustPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="hero-media">
            <div className="hero-video-frame">
              <video controls>
                <source src="/videos/Vol.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>

      <main className="home-max home-main">
        <section className="block-card fade-reveal" ref={addRevealRef}>
          <div className="block-row">
            <div className="block-text">
              <h2>{c.sectionTitleMission}</h2>
              <p>{c.sectionTextMission}</p>
            </div>
            <div className="block-media">
              <img src="/images/sections/why.png" alt="Volux mission" />
            </div>
          </div>
        </section>

        <section className="block-card fade-reveal" ref={addRevealRef}>
          <h2 className="center-title">{c.sectionTitleHow}</h2>
          <div className="how-grid">
            {steps.map((step, idx) => (
              <article className="how-card" key={step.en} style={{ animationDelay: `${idx * 90}ms` }}>
                <span className="how-step-number">0{idx + 1}</span>
                <span className="how-icon">
                  <img src={step.icon} alt={step.en} />
                </span>
                <h3>{isEn ? step.en : step.ar}</h3>
                <p>{isEn ? step.subEn : step.subAr}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="block-card fade-reveal" ref={addRevealRef}>
          <h2 className="center-title">{c.sectionTitleAreas}</h2>
          <div className="areas-grid">
            {areas.map((area) => (
              <article className="area-card" key={area.en}>
                <span className="area-icon">
                  <img src={area.icon} alt={area.en} />
                </span>
                <h3>{isEn ? area.en : area.ar}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="block-card fade-reveal" ref={addRevealRef}>
          <div className="leaderboard-head">
            <div>
              <h2>{c.sectionTitleLeaderboard}</h2>
              <p>{c.leaderboardHint}</p>
            </div>
            <button className="btn-main small" onClick={() => navigate('/leaderboard')}>
              {c.fullLeaderboard}
            </button>
          </div>

          <div className="leaderboard-grid">
            {leaderboardLoading ? (
              <div className="placeholder-card">{c.loading}</div>
            ) : leaderboardData.length === 0 ? (
              <div className="placeholder-card">{c.leaderboardEmpty}</div>
            ) : (
              leaderboardData.map((user, index) => (
                <article className="leader-card" key={user.id || `${user.name}-${index}`}>
                  <div className="leader-rank">#{index + 1}</div>
                  <div className="leader-meta">
                    <h3>{user.name || (isEn ? 'Volunteer' : 'متطوع')}</h3>
                    <p>
                      {isEn ? 'Points' : 'النقاط'}: <strong>{user.points || 0}</strong>
                      {' · '}
                      {isEn ? 'Hours' : 'الساعات'}: <strong>{user.hours || 0}</strong>
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="block-card fade-reveal" ref={addRevealRef}>
          <h2 className="center-title">{c.sectionTitleGovernance}</h2>
          <div className="governance-grid">
            {c.governanceCards.map((card) => (
              <article className="gov-card" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="block-card fade-reveal" ref={addRevealRef}>
          <h2 className="center-title">{c.sectionTitleStories}</h2>
          <div className="stories-grid">
            {c.stories.map((story) => (
              <article className="story-card" key={story.by}>
                <p>“{story.quote}”</p>
                <span>{story.by}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="block-card fade-reveal" ref={addRevealRef}>
          <h2 className="center-title">{c.sectionTitleFaq}</h2>
          <div className="faq-grid">
            {c.faqs.map((faq) => (
              <article className="faq-card" key={faq.q}>
                <h3>{faq.q}</h3>
                <p>{faq.a}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <section className="home-final-cta fade-reveal" ref={addRevealRef}>
        <div className="home-max final-inner">
          <h2>{c.finalTitle}</h2>
          <p>{c.finalText}</p>
          <button className="btn-main" onClick={() => navigate('/register')}>
            {c.finalButton}
          </button>
        </div>
      </section>
    </div>
  );
}

export default HomePage;

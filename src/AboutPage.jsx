import React, {useEffect, useRef, useState} from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "./context/LanguageContext";
import "./styles/AboutPage.css" ;


const AboutPage = () => {
const { language } = useLanguage();
const revealRefs = useRef([]) ;
const navigate = useNavigate(); 
revealRefs.current = [];
const addRevealRef = (el) => {
  if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el) ;
  }
}
const handleRegisterClick = () => {
    navigate("/register"); // غيّري 
  };



useEffect(() => {
 const observer= new IntersectionObserver(
  (entries) => 
    entries.forEach((entry,index) => {
       if(entry.isIntersecting) {
        entry.target.style.transitionDelay = `${index * 0.15}s`;
        entry.target.classList.add("show");
       } 
    }),
   {threshold: 0.2} 
  );
revealRefs.current.forEach((ref) => observer.observe(ref));
}, []);


  /* Sections */
return (
  <div className={`about-page ${language === "ar" ? "rtl" : ""}`}>
    

     {/* hero */} 
    <section className="about-hero fade-reveal" ref={addRevealRef}>
       <div className="overlay">
        <h1>{language === "en"
  ? "About Volux: Empowering Sudan Through Volunteerism"
  : "عن فولكس: تمكين السودان عبر التطوع"}</h1>
        <p>
         {language === "en"
           ? "A national platform uniting volunteers, organizations, and authorities to rebuild Sudan through compassion, transparency, and shared purpose."
           : "منصة وطنية توحد المتطوعين والمؤسسات والجهات الحكومية لإعادة بناء السودان بروح التضامن والشفافية والمسؤولية المشتركة."}
        </p>
        </div>
        </section>
   
     
     {/* M\V\V Section */}
     <section className="mission-section fade-reveal" ref={addRevealRef}>
     <div className="mission-card fade-reveal" ref={addRevealRef}>
      <span className="icon"><img src="/icons/our-mission.svg" alt="Our Mission" /></span>
      <h3>{language === "en" ? "Our Mission" : "مهمتنا"}</h3>
      <p>
        {language === "en"
          ? "To organize and promote volunteering opportunities that support Sudan’s recovery and sustainable development."
          : "تنظيم وتعزيز فرص التطوع التي تدعم تعافي السودان وتنميته المستدامة."}
      </p>
      </div> 
 
      <div className="mission-card fade-reveal" ref={addRevealRef}>
         <span className="icon"><img src="/icons/our-vision.svg" alt="Our Vision" /></span>
         <h3>{language === "en" ? "Our Vision" : "رؤيتنا"}</h3>
         <p>
          {language === "en"
           ? "A unified digital ecosystem built on civic engagement, cooperation, and shared national responsibility."
           : "بناء منظومة رقمية موحدة تقوم على المشاركة المجتمعية والتعاون والمسؤولية الوطنية المشتركة."}
         </p>
      </div>

      <div className="mission-card fade-reveal" ref={addRevealRef}>
         <span className="icon"><img src="/icons/our-values.svg" alt="Our Values" /></span>
         <h3>{language === "en" ? "Our Values" : "قيمنا"}</h3>
         <p>
          {language === "en"
             ? "Transparency — Collaboration — Empowerment — Inclusivity — Impact."
             : "الشفافية — التعاون — التمكين — الشمولية — الأثر."}
         </p>
      </div>
     </section>

     {/* Connecting Section */}

     <section className="connecting-section fade-reveal" ref={addRevealRef}>
      <img src="/images/Vol.jpg" alt="Volunteering in Sudan" />
      <div className="text">
      <h3>{language === "en" ? "Connecting Hearts and Hands" : "نربط القلوب بالأيادي"}</h3>
      <p>
        {language === "en"
          ? "Volux bridges volunteers and organizations through transparent, meaningful engagement and measurable impact."
          : "يقوم فولكس بدور الجسر بين المتطوعين والمؤسسات عبر تفاعل هادف قائم على الشفافية والأثر الحقيقي."}
      </p>
      <p>
        {language === "en"
          ? "Whether individual or institution, Volux supports and connects all efforts towards rebuilding Sudan."
          : "سواء كنت فردًا أو مؤسسة، فإن فولكس يدعم ويصل كل الجهود نحو إعادة إعمار السودان."}
      </p>
      </div>
     </section>


    {/* Team Section */ }
     
    <section className="team-section fade-reveal" ref={addRevealRef}>
       <h2>{language === "en" ? "Meet the People Behind Volux" : "تعرّف على القائمين على فولكس"}</h2>
       <p>
        {language === "en"
             ? "A passionate team from Sudan University of Science & Technology committed to empowering communities and rebuilding Sudan."
             : "فريق شغوف من جامعة السودان للعلوم والتكنولوجيا ملتزم بتمكين المجتمعات وإعادة بناء السودان."}
       </p>

      <div className="team-grid">

         <div className="team-card fade-reveal" ref={addRevealRef}>
          <img src="/images/team/suhayb.jpg" className="team-img" alt="Suhayb" />
          <h4>Suhayb Hussain Elshaikh</h4>
          <p>{language === "en" ? "Developer & Volunteer" : "مطور ومتطوع"}</p>
         </div>

         <div className="team-card fade-reveal" ref={addRevealRef}>
          <img src="/images/team/abdallah.jpg" className="team-img" alt="Abdallah" />
          <h4>Abdallah Bushra Mohammed</h4>
          <p>{language === "en" ? "Developer & Volunteer" : "مطور ومتطوع"}</p>
         </div>

         <div className="team-card fade-reveal" ref={addRevealRef}>
          <img src="/images/team/alkhansaa.jpg" className="team-img" alt="Alkhansaa" />
          <h4>Alkhansaa Jamal Aldeen Ahmed</h4>
          <p>{language === "en" ? "Developer & Volunteer" : "مطور ومتطوع"}</p>
         </div>

      </div>
    </section>
    
     {/* our story section */}
       
     <section className="story-section fade-reveal" ref={addRevealRef}>
        <img src="/images/Vol3.jpg" alt="Volux Story" className="story-img" />

        <div className="story-text">
          <h3>{language === "en" ? "The Story Behind Volux" : "قصة فولكس"}</h3>
          <p>
            {language === "en"
                ? "Volux was born in one of Sudan’s most challenging times — when homes were destroyed, communities displaced, and hope strained. Yet in the middle of this hardship, something powerful appeared: people helping people."
                : "وُلدت فكرة فولكس في واحدة من أصعب فترات السودان — عندما تهدمت البيوت وتشردت المجتمعات. لكن وسط هذه المحنة ظهر شيء قوي: وهو مساندة المجتمع بعضهم البعض."}
          </p>
          <p>
            {language === "en"
                ? "A group of young Sudanese students, volunteers, and community members came together and realized that even with limited resources, unity itself is powerful. Instead of waiting for change, they chose to build it."
                : "اجتمع مجموعة من الشباب السودانيين من طلاب ومتطوعين وأفراد من المجتمع، وأدركوا أنه حتى مع قلة الإمكانات، فإن القوة الحقيقية تكمن في الوحدة. فبدلًا من انتظار التغيير، قرروا أن يصنعوه."}
          </p>
          <p>
            {language === "en"
               ? "Volux stands as a testament to resilience, compassion, and the belief that Sudan can rise again — not through one hero, but through thousands working hand in hand."
               : "فولكس هو شاهد حي على الصمود والرحمة والإيمان بأن السودان قادر على النهوض من جديد — ليس ببطل واحد، بل بآلاف يعملون معًا يداً بيد."}
          </p>
        </div>
     </section>

        
    {/* Register Now Section */}
    <section className="register-section fade-reveal" ref={addRevealRef}>
       <h3>{language === "en" ? "Ready to Make a Difference?" : "جاهز لتصنع فرقًا؟"}</h3>
       <p>{language === "en"
           ? "Join Volux today and start creating real impact."
           : "انضم إلى فولكس الآن وابدأ بإحداث أثر حقيقي."}</p>
       <button onClick={handleRegisterClick}>{language === "en" ? "Register Now" : "سجل الآن"}</button>
    </section>


    
    </div> 
    );
   }; 

   export default AboutPage;
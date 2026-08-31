const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
// const admin = require('firebase-admin'); // يتطلب ملف serviceAccountKey.json

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes Placeholder
app.get('/', (req, res) => {
  res.send('Volux Backend API is running...');
});

// Certificate Route - توليد شهادة PDF
app.get('/api/certificates/generate', async (req, res) => {
  const {
    userName,
    volunteerName,
    opportunityTitle,
    opportunityName,
    date,
    completionDate,
    ownerName,
    organizationName,
    orgName,
    teamName,
    organizerName,
  } = req.query;

  try {
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
    });

    const repairTextEncoding = (value) => {
      const text = String(value || '');
      if (/[\u0600-\u06ff]/.test(text) || !/[ØÙÛÜÃ]/.test(text)) return text;
      try {
        const repaired = Buffer.from(text, 'latin1').toString('utf8');
        return /[\u0600-\u06ff]/.test(repaired) ? repaired : text;
      } catch (error) {
        return text;
      }
    };

    const normalizeOwnerName = (value) => {
      const text = repairTextEncoding(value).trim();
      const invalidTokens = new Set(['', 'undefined', 'null', '[object object]', 'n/a', 'na', 'unknown organization', 'organization name']);
      return invalidTokens.has(text.toLowerCase()) ? '' : text;
    };

    const volunteer = repairTextEncoding(volunteerName || userName || 'Volunteer Name');
    const opportunity = repairTextEncoding(opportunityName || opportunityTitle || 'Volunteer Opportunity');
    const completion = repairTextEncoding(completionDate || date || new Date().toLocaleDateString());
    const ownerDisplay =
      [ownerName, organizationName, orgName, teamName, organizerName].map(normalizeOwnerName).find(Boolean) ||
      'Opportunity Owner';

    const arabicFontCandidates = [
      process.env.VOLUX_ARABIC_FONT,
      path.join(__dirname, 'assets', 'NotoNaskhArabic-Regular.ttf'),
      path.join('C:', 'Windows', 'Fonts', 'arial.ttf'),
      path.join('C:', 'Windows', 'Fonts', 'arabtype.ttf'),
      path.join('C:', 'Windows', 'Fonts', 'tahoma.ttf'),
    ].filter(Boolean);
    const arabicFontPath = arabicFontCandidates.find((candidate) => fs.existsSync(candidate));
    if (arabicFontPath) {
      doc.registerFont('VoluxArabic', arabicFontPath);
    }
    const setPdfFont = (value, fallbackFont = 'Helvetica') => {
      if (arabicFontPath && /[\u0600-\u06ff]/.test(String(value || ''))) return doc.font('VoluxArabic');
      return doc.font(fallbackFont);
    };

    // إعداد الاستجابة كملف PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate_${volunteer || 'volunteer'}.pdf`);

    doc.pipe(res);

    // تصميم الشهادة
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8fafc');
    
    // إطار ذهبي
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(5)
       .stroke('#d4af37');

    // المحتوى
    doc.fillColor('#1e293b')
       .fontSize(40)
       .text('CERTIFICATE OF APPRECIATION', 0, 100, { align: 'center' });

    doc.fontSize(20)
       .text('This is to certify that', 0, 180, { align: 'center' });

    setPdfFont(volunteer, 'Helvetica-Bold')
       .fillColor('#9b5f2d')
       .fontSize(35)
       .text(volunteer, 0, 230, { align: 'center' });

    doc.fillColor('#1e293b')
       .fontSize(20)
       .text('has successfully participated in', 0, 300, { align: 'center' });

    setPdfFont(opportunity, 'Helvetica-Bold')
       .fontSize(25)
       .text(opportunity, 0, 340, { align: 'center' });

    setPdfFont(ownerDisplay)
       .fontSize(15)
       .text(`Opportunity Owner: ${ownerDisplay}`, 0, 410, { align: 'center' });

    doc.font('Helvetica')
       .fontSize(15)
       .text(`Date: ${completion}`, 0, 440, { align: 'center' });

    doc.fontSize(12)
       .text('Volux Platform - Empowering Volunteers', 0, 500, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating certificate');
  }
});

// Points & Badges Route - تحديث النقاط
app.post('/api/points/update', async (req, res) => {
  const { userId, pointsToAdd } = req.body;
  
  // هنا يتم كتابة منطق التحديث في Firestore باستخدام admin.firestore()
  // مثال:
  // await db.collection('Users').doc(userId).update({ points: admin.firestore.FieldValue.increment(pointsToAdd) });
  
  console.log(`Adding ${pointsToAdd} points to user ${userId}`);
  res.json({ success: true, message: `Added ${pointsToAdd} points successfully` });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

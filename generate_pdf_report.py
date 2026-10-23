import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_header_footer(self, page_count):
        if self._pageNumber > 1:
            self.saveState()
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#64748B"))
            
            # Header
            self.drawString(54, 11 * inch - 36, "CAMPUSPLAY: ENHANCING CAMPUS SPORTS ACCESS")
            self.drawRightString(8.5 * inch - 54, 11 * inch - 36, "VIT • DEPT OF INFORMATION TECHNOLOGY")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)

            # Footer
            self.line(54, 46, 8.5 * inch - 54, 46)
            self.setFont("Helvetica", 8.5)
            self.drawString(54, 32, "Design Thinking Mini-Project Report • Academic Year 2025–2026")
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(8.5 * inch - 54, 32, page_text)
            self.restoreState()

def build_pdf_report(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Colors
    NAVY = colors.HexColor("#0F172A")
    BLUE = colors.HexColor("#2563EB")
    SLATE = colors.HexColor("#334155")
    MUTED = colors.HexColor("#64748B")
    GREEN = colors.HexColor("#10B981")
    LIGHT_BLUE = colors.HexColor("#EFF6FF")
    LIGHT_GREEN = colors.HexColor("#ECFDF5")
    BG_LIGHT = colors.HexColor("#F8FAFC")

    # Custom Paragraph Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=NAVY,
        alignment=TA_CENTER,
        spaceAfter=10
    )

    inst_style = ParagraphStyle(
        'DocInst',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=NAVY,
        alignment=TA_CENTER,
        spaceAfter=6
    )

    dept_style = ParagraphStyle(
        'DocDept',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=MUTED,
        alignment=TA_CENTER,
        spaceAfter=20
    )

    h1_style = ParagraphStyle(
        'ChapterHeading',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=NAVY,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=BLUE,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'SubSectionHeading',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13,
        textColor=SLATE,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=SLATE,
        alignment=TA_JUSTIFY,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=SLATE,
        leftIndent=15,
        spaceAfter=3
    )

    story = []

    # ==========================================
    # COVER PAGE
    # ==========================================
    story.append(Spacer(1, 20))
    story.append(Paragraph("VIDYALANKAR INSTITUTE OF TECHNOLOGY", inst_style))
    story.append(Paragraph("DEPARTMENT OF INFORMATION TECHNOLOGY<br/>Wadala (East), Mumbai – 400037<br/>(Affiliated to University of Mumbai, Approved by AICTE)", dept_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=BLUE, spaceAfter=25))

    story.append(Paragraph("A MINI-PROJECT REPORT ON", ParagraphStyle('SubSub', fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=BLUE, alignment=TA_CENTER, spaceAfter=8)))
    story.append(Paragraph("CAMPUSPLAY: ENHANCING CAMPUS SPORTS ACCESS", title_style))
    story.append(Paragraph("Automated Facility Scheduling, Sports Equipment Governance, and Academic Timetable Conflict Verification", ParagraphStyle('Theme', fontName='Helvetica-Oblique', fontSize=11, leading=15, textColor=SLATE, alignment=TA_CENTER, spaceAfter=30)))

    story.append(Paragraph("Submitted in partial fulfillment of the requirements for the course of<br/><b>DESIGN THINKING MINI-PROJECT</b><br/>Bachelor of Engineering in Information Technology<br/>(Second Year Engineering – S.E. IT, Academic Year 2025–2026)", ParagraphStyle('Deg', fontName='Helvetica', fontSize=10, leading=15, textColor=SLATE, alignment=TA_CENTER, spaceAfter=35)))

    # Team Table
    team_data = [
        [
            Paragraph("<b>SUBMITTED BY:</b><br/><b>Aryan Kelkar</b><br/>Roll No: [TO BE CONFIRMED BY TEAM]<br/>Dept. of Information Technology<br/>aryan.kelkar.2016@gmail.com<br/><br/><b>Team Members:</b><br/>[TO BE CONFIRMED: Member 2]<br/>[TO BE CONFIRMED: Member 3]<br/>[TO BE CONFIRMED: Member 4]", body_style),
            Paragraph("<b>UNDER THE GUIDANCE OF:</b><br/><b>[TO BE CONFIRMED: Faculty Guide]</b><br/>Dept. of Information Technology<br/>Vidyalankar Institute of Technology<br/><br/><b>HEAD OF DEPARTMENT:</b><br/><b>[TO BE CONFIRMED: Dr. HOD Name]</b><br/>Head, Dept. of Information Technology", body_style)
        ]
    ]
    t_team = Table(team_data, colWidths=[3.5*inch, 3.5*inch])
    t_team.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('PADDING', (0,0), (-1,-1), 12),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    story.append(t_team)

    story.append(PageBreak())

    # ==========================================
    # CERTIFICATE
    # ==========================================
    story.append(Paragraph("CERTIFICATE", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceAfter=15))
    story.append(Paragraph("This is to certify that the mini-project entitled <b>“CAMPUSPLAY: ENHANCING CAMPUS SPORTS ACCESS”</b> is a bona fide record of work carried out by <b>Aryan Kelkar</b> (Roll No: [TO BE CONFIRMED BY TEAM]), along with [Team Member 2 Name], [Team Member 3 Name], and [Team Member 4 Name] in partial fulfillment of the requirements for the award of the Degree of Bachelor of Engineering in Information Technology from the University of Mumbai, during the academic year 2025–2026 at Vidyalankar Institute of Technology, Wadala, Mumbai.", body_style))
    story.append(Spacer(1, 50))

    sig_data = [
        [
            Paragraph("_______________________<br/><b>[TO BE SIGNED]</b><br/>Project Guide<br/>Dept. of IT, VIT", ParagraphStyle('S1', alignment=TA_CENTER, fontSize=9, leading=12)),
            Paragraph("_______________________<br/><b>[TO BE SIGNED]</b><br/>Head of Department<br/>Dept. of IT, VIT", ParagraphStyle('S2', alignment=TA_CENTER, fontSize=9, leading=12)),
            Paragraph("_______________________<br/><b>[TO BE SIGNED]</b><br/>Principal / Examiner<br/>Vidyalankar Inst. of Tech.", ParagraphStyle('S3', alignment=TA_CENTER, fontSize=9, leading=12))
        ]
    ]
    t_sig = Table(sig_data, colWidths=[2.33*inch, 2.33*inch, 2.33*inch])
    story.append(t_sig)

    story.append(PageBreak())

    # ==========================================
    # ABSTRACT
    # ==========================================
    story.append(Paragraph("ABSTRACT", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceAfter=12))
    story.append(Paragraph("Collegiate sports infrastructure plays an indispensable role in student physical well-being, collegiate sports excellence, and campus social vitality. However, campus sports facility management in higher education institutes frequently suffers from manual, paper-bound administrative workflows, lack of transparent slot discovery, double-booking friction, untracked equipment attrition, and scheduling conflicts with academic timetables. This project presents <b>CampusPlay</b>, an institutional-grade, full-stack campus sports facility reservation, equipment governance, and academic timetable verification system engineered through a structured Design Thinking methodology.", body_style))
    story.append(Paragraph("CampusPlay replaces opaque physical registers with a real-time, responsive web portal. The system features: (i) an interactive, 11-slot visual ground and indoor court booking wizard supporting single and dual-hour reservations; (ii) an automated academic timetable conflict verification engine that programmatically cross-references requested booking intervals against division-specific academic lecture and laboratory practical schedules (e.g., INFT, CMPN, EXTC, EXCS, BIOMED across divisions A–D); (iii) a closed-loop equipment inventory governance lifecycle featuring check-and-set stock locking, student return requests, physical return inspection reconciliation (usable, damaged, and missing units), and immutable audit transaction logging; and (iv) bi-directional real-time administrative notification synchronization powered by WebSocket room broadcasting (Socket.io).", body_style))
    story.append(Paragraph("The system is implemented using Next.js 14 (TypeScript) with the bespoke 'Sport & Nature Harmony' design system on the frontend, an Express.js service-oriented RESTful API on Node.js, and a MongoDB Atlas cloud persistence tier with Mongoose ODM. System correctness, boundary-touching interval calculations, anti-path-traversal file security, and inventory idempotency have been verified through an automated test suite comprising <b>49 unit and integration tests executing with a 100% pass rate</b>. CampusPlay establishes a transparent, accountable, and academically harmonized digital benchmark for collegiate athletic management.", body_style))
    story.append(Paragraph("<b>Keywords:</b> Campus Sports Management, Design Thinking, Automated Timetable Verification, Real-Time Scheduling, Equipment Inventory Governance, Next.js, Express.js, Socket.io, MongoDB Atlas.", ParagraphStyle('KW', fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=NAVY, spaceBefore=8)))

    story.append(PageBreak())

    # ==========================================
    # CHAPTERS
    # ==========================================

    def add_callout_box(title, text, bg_hex="#EFF6FF", border_hex="#2563EB"):
        box_data = [[
            Paragraph(f"<b><font color='{border_hex}'>{title}</font></b><br/>{text}", body_style)
        ]]
        t_box = Table(box_data, colWidths=[7.0*inch])
        t_box.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(bg_hex)),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor(border_hex)),
            ('PADDING', (0,0), (-1,-1), 8)
        ]))
        story.append(t_box)
        story.append(Spacer(1, 6))

    # CHAPTER 1
    story.append(Paragraph("CHAPTER 1: INTRODUCTION", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceAfter=10))
    story.append(Paragraph("1.1 Background and Context", h2_style))
    story.append(Paragraph("Sports and physical recreation are foundational to balanced undergraduate development. In engineering institutions such as Vidyalankar Institute of Technology (VIT), Mumbai, students must balance demanding instructional schedules—including theory lectures, laboratory practicals, and project assessments—with athletic pursuits. Institutional facilities include Ground 1 (football, cricket), Ground 2 (athletics, field sports), the Basketball Court, and the Badminton Court, alongside gymkhana equipment.", body_style))

    story.append(Paragraph("1.2 Motivation for the Project", h2_style))
    story.append(Paragraph("Historically, facility scheduling was managed via physical logbooks at the sports gymkhana. This paper-based method produced severe systemic friction: students could not verify ground availability without walking across campus; overlapping groups frequently argued over double-booked grounds; reservations were booked during lecture hours without faculty knowledge; and unreturned or damaged sports gear went untracked, causing inventory loss.", body_style))

    story.append(Paragraph("1.3 Objectives and Scope", h2_style))
    story.append(Paragraph("• <b>Objective 1:</b> Provide real-time slot visibility across 11 daily slots (8 AM to 7 PM).<br/>• <b>Objective 2:</b> Automate academic conflict checks against division timetables (INFT, CMPN, EXTC, etc.).<br/>• <b>Objective 3:</b> Establish closed-loop equipment governance with return inspection and damage reconciliation.<br/>• <b>Objective 4:</b> Deploy WebSocket synchronization for immediate status updates.", bullet_style))

    story.append(Spacer(1, 10))

    # CHAPTER 2
    story.append(Paragraph("CHAPTER 2: PROBLEM DEFINITION", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceAfter=10))
    story.append(Paragraph("2.1 Existing Manual Workflow & Bottlenecks", h2_style))
    story.append(Paragraph("In the legacy system, a student visits the gymkhana in person, checks a paper ledger, and writes their details. Key bottlenecks include: (i) zero remote accessibility; (ii) lack of concurrency control leading to double-booking disputes; (iii) no academic cross-checking against class rosters; and (iv) unverified equipment return resulting in unaccounted damage.", body_style))

    story.append(Paragraph("2.2 Synthesized Problem Statement", h2_style))
    add_callout_box("Synthesized Problem Statement",
                    "\"How might we provide collegiate students with transparent, real-time sports facility reservation while empowering sports administrators with automated academic timetable conflict detection and verifiable equipment governance?\"")

    story.append(Spacer(1, 10))

    # CHAPTER 3
    story.append(Paragraph("CHAPTER 3: DESIGN THINKING METHODOLOGY", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceAfter=10))
    story.append(Paragraph("3.1 The Five-Stage Human-Centered Process", h2_style))
    story.append(Paragraph("CampusPlay followed the Stanford d.school Design Thinking framework:", body_style))
    story.append(Paragraph("• <b>Stage 1: Empathize:</b> Observed sports gymkhana desk bottlenecks during 12-1 PM and 3:30 PM recesses; interviewed student athletes, recreational players, and attendants.<br/>• <b>Stage 2: Define:</b> Formulated Point-of-View (POV) statements and established institutional constraints (@vit.edu.in email domain, division schedules).<br/>• <b>Stage 3: Ideate:</b> Compared Google Forms vs custom web application; selected full-stack Next.js/Express architecture for real-time WebSocket sync and custom relational logic.<br/>• <b>Stage 4: Prototype:</b> Built the Booking Wizard, Sport & Nature Harmony design system, academic conflict engine, and equipment inspection modal.<br/>• <b>Stage 5: Test:</b> Verified the system through 49 automated unit and integration tests executing with 100% pass rate.", bullet_style))

    story.append(Spacer(1, 10))

    # CHAPTER 4
    story.append(Paragraph("CHAPTER 4: EXISTING VS PROPOSED SYSTEM", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceAfter=10))
    
    comp_data = [
        [Paragraph("<b>Evaluation Metric</b>", ParagraphStyle('TH1', fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.white)),
         Paragraph("<b>Manual Paper Register</b>", ParagraphStyle('TH2', fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.white)),
         Paragraph("<b>CampusPlay System (Verified)</b>", ParagraphStyle('TH3', fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.white))],
        [Paragraph("Slot Discovery", body_style), Paragraph("In-person gymkhana visit required", body_style), Paragraph("Real-time visual slot grid (11 slots)", body_style)],
        [Paragraph("Academic Check", body_style), Paragraph("Completely absent; zero verification", body_style), Paragraph("Automated algorithmic conflict engine", body_style)],
        [Paragraph("Equipment Control", body_style), Paragraph("Informal sign-out; no damage audit", body_style), Paragraph("Full lifecycle: check-and-set & return inspection", body_style)],
        [Paragraph("Live Updates", body_style), Paragraph("None; manual inquiry", body_style), Paragraph("Instant WebSocket room events (Socket.io)", body_style)]
    ]
    t_comp = Table(comp_data, colWidths=[2.2*inch, 2.3*inch, 2.5*inch])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('PADDING', (0,0), (-1,-1), 6)
    ]))
    story.append(t_comp)

    story.append(Spacer(1, 10))

    # CHAPTER 5 & 6
    story.append(Paragraph("CHAPTER 5 & 6: SYSTEM REQUIREMENTS & ARCHITECTURE", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceAfter=10))
    story.append(Paragraph("5.1 Verified Architecture Tiers", h2_style))
    story.append(Paragraph("• <b>Presentation Layer:</b> Next.js 14.2 (Pages router), TypeScript 5.9, Tailwind CSS 3.4, Framer Motion, Socket.io-client.<br/>• <b>Application & API Layer:</b> Node.js 18+ runtime, Express.js 4.19, Helmet, CORS, Cookie-Parser, Multer file upload handling.<br/>• <b>Domain Service Layer:</b> timetableConflictService, equipmentService, facilityService, storageService, socketService.<br/>• <b>Persistence Layer:</b> MongoDB Atlas replica set cloud cluster, Mongoose 8.6 ODM with compound indexing.<br/>• <b>Security Architecture:</b> Encrypted JWT in HttpOnly cookies, bcrypt password hashing (10 salt rounds), binary magic-byte inspection (%PDF-, PNG, JPEG), anti-path-traversal sanitization.", bullet_style))

    story.append(Spacer(1, 10))

    # CHAPTER 8 & 9
    story.append(Paragraph("CHAPTER 8 & 9: IMPLEMENTATION & UI/UX", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceAfter=10))
    story.append(Paragraph("8.1 Key Algorithms and Modules", h2_style))
    story.append(Paragraph("• <b>Interval Overlap Algorithm:</b> Mathematically evaluates <code>(startB &lt; endS) &amp;&amp; (endB &gt; startS)</code> to detect true lecture clashes while permitting exact boundary-touching transitions.<br/>• <b>Equipment Reconciliation:</b> Evaluates <code>usableStock = total - damaged - missing - activeAllocations</code>; enforces <code>(returned + damaged + missing == issued)</code> on return inspection.<br/>• <b>Design System:</b> Implements the 'Sport & Nature Harmony' palette (Primary Blue #2563EB, Turf Green #10B981, Deep Navy #0F172A) with Poppins headings and Inter body typography.", body_style))

    story.append(Spacer(1, 10))

    # CHAPTER 10: TESTING
    story.append(Paragraph("CHAPTER 10: TESTING & EMPIRICAL VERIFICATION", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceAfter=10))
    add_callout_box("EMPIRICAL TEST VERIFICATION: 49/49 PASSED (100% SUCCESS RATE)",
                    "Executed via native Node.js test runner (node:test, node:assert/strict). All 49 unit and integration tests executed with 0 failures.",
                    "#ECFDF5", "#10B981")

    test_summary_data = [
        [Paragraph("<b>Test Suite</b>", ParagraphStyle('TS1', fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.white)),
         Paragraph("<b>Count</b>", ParagraphStyle('TS2', fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.white)),
         Paragraph("<b>Core Focus & Edge Cases Verified</b>", ParagraphStyle('TS3', fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.white)),
         Paragraph("<b>Result</b>", ParagraphStyle('TS4', fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.white))],
        [Paragraph("Equipment Governance", body_style), Paragraph("10 Tests", body_style), Paragraph("Full return, partial return, damage reconciliation, check-and-set idempotency, cancellation integrity", body_style), Paragraph("10/10 PASS", body_style)],
        [Paragraph("Academic Profile & Contact", body_style), Paragraph("15 Tests", body_style), Paragraph("Phone normalization, profile immutability, stream combination validation, contact RBAC", body_style), Paragraph("15/15 PASS", body_style)],
        [Paragraph("Timetable Conflict & Security", body_style), Paragraph("24 Tests", body_style), Paragraph("Slot interval overlap, touching boundaries, CSV validation, %PDF- magic bytes, anti-traversal", body_style), Paragraph("24/24 PASS", body_style)]
    ]
    t_test = Table(test_summary_data, colWidths=[1.8*inch, 0.8*inch, 3.4*inch, 1.0*inch])
    t_test.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('PADDING', (0,0), (-1,-1), 6)
    ]))
    story.append(t_test)

    story.append(Spacer(1, 10))

    # CHAPTER 11, 12, 13
    story.append(Paragraph("CHAPTER 11, 12 & 13: DISCUSSION, ROADMAP & CONCLUSION", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceAfter=10))
    story.append(Paragraph("11.1 Results and Impact", h2_style))
    story.append(Paragraph("CampusPlay successfully deployed an automated sports coordination platform with backend live on Render (https://campusplay-4g0z.onrender.com) and persistent MongoDB Atlas cloud database. The system delivers transparent slot visibility, prevents double-booking disputes, safeguards lecture attendance, and establishes full equipment auditability.", body_style))

    story.append(Paragraph("12.1 Prioritized Future Roadmap", h2_style))
    story.append(Paragraph("• <b>Phase 1:</b> Smart RFID / QR turnstiles at ground gates.<br/>• <b>Phase 2:</b> Inter-college festival tournament fixture brackets.<br/>• <b>Phase 3:</b> Automated fine deduction for damaged equipment via student accounts.", bullet_style))

    story.append(Paragraph("13.1 Conclusion", h2_style))
    story.append(Paragraph("CampusPlay validates the efficacy of applying Design Thinking to campus operational challenges. By integrating user empathy, strict mathematical interval modeling, and modern web technologies, the platform elevates campus athletic life while honoring academic commitments.", body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] Successfully created academic project report PDF at: {output_path}")

if __name__ == "__main__":
    out_dir = r"c:\CampusPLAY\deliverables"
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "CampusPlay_Project_Report.pdf")
    build_pdf_report(out_file)

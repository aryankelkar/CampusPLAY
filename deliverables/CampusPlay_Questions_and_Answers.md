# CampusPlay: Comprehensive Viva Voce Questions & Answers
**Course:** Design Thinking Mini-Project (Second Year Engineering — S.E. IT)  
**Institution:** Vidyalankar Institute of Technology (VIT), Mumbai  
**Project Lead:** Aryan Kelkar  
**Repository:** [https://github.com/aryankelkar/CampusPLAY](https://github.com/aryankelkar/CampusPLAY)  
**Backend Live URL:** [https://campusplay-4g0z.onrender.com](https://campusplay-4g0z.onrender.com)  

---

### Category 1: Project Motivation & Problem Statement

#### Q1. What was the core motivation behind developing CampusPlay?
**Answer:**  
In higher education institutions like Vidyalankar Institute of Technology, sports facilities (Ground 1, Ground 2, Basketball Court, Badminton Court) are heavily utilized, yet their management historically relied on paper registers at the gymkhana desk. This caused significant operational friction: students had no remote visibility into ground vacancy, groups suffered from double-booking disputes, equipment returned damaged was rarely tracked, and bookings frequently clashed with scheduled academic lectures and laboratory practicals. CampusPlay was engineered to provide a transparent, real-time digital reservation platform that integrates automated academic timetable conflict verification and closed-loop equipment governance.

#### Q2. How is your problem statement structured according to Design Thinking principles?
**Answer:**  
We formulated a human-centered Point-of-View (POV) statement:  
*"Collegiate students and sports administrators require a transparent, real-time sports facility reservation and equipment governance platform because manual paper-based processes cause slot collisions, inventory depletion, administrative delays, and unverified academic timetable clashes."*  
From this, we derived actionable "How Might We" (HMW) challenge questions focusing on availability discovery, conflict prevention, and equipment accountability.

#### Q3. How does CampusPlay prevent students from booking sports facilities during academic hours?
**Answer:**  
CampusPlay integrates an automated **Academic Timetable Conflict Engine** (`timetableConflictService.js`). When a student requests a sports slot, the system queries the active academic timetable for that student’s branch (e.g., INFT), academic year (e.g., SE), and division (e.g., Div A). It programmatically evaluates whether the requested sports interval overlaps with any scheduled lecture or lab session. If an overlap is detected, the booking is flagged as `CONFLICT DETECTED` on the administrator's dashboard, enabling the coordinator to deny the request or require justification.

---

### Category 2: Design Thinking Methodology & User Research

#### Q4. Explain the five stages of Design Thinking as applied in CampusPlay.
**Answer:**  
1. **Empathize:** Observed gymkhana congestion during peak 12–1 PM and 3:30 PM recesses; interviewed student athletes, casual players, and gymkhana attendants to understand their frustrations.
2. **Define:** Synthesized observations into user personas, an empathy map, and our core POV problem statement with clear constraints (@vit.edu.in email domain, 11 hourly slots).
3. **Ideate:** Brainstormed alternatives (Google Forms vs Native App vs Web Portal); selected a full-stack Next.js/Express web platform for universal mobile accessibility and WebSocket real-time synchronization.
4. **Prototype:** Developed the system iteratively—Iteration 1 implemented the core booking MVP; Iteration 2 added the multi-step Booking Wizard, Sport & Nature Harmony design system, conflict engine, and equipment inspection modal.
5. **Test:** Implemented an automated test harness of 49 unit and integration tests covering interval math, equipment reconciliation, and security bounds, achieving a 100% pass rate.

#### Q5. What specific user insights influenced your interface design?
**Answer:**  
Two critical insights emerged:  
First, students organizing squad matches felt extreme anxiety about submitting bookings with errors. To address this, we implemented a **Pre-Submission Review Modal** displaying a complete summary of the ground, date, slot interval, team squad, and academic profile before final commit.  
Second, students needed immediate confirmation without repeatedly refreshing the page. We implemented **Socket.io WebSocket room broadcasting**, allowing instant state updates to reflect across user viewports.

---

### Category 3: Technology Stack & Technical Rationale

#### Q6. What is the verified technology stack of CampusPlay?
**Answer:**  
- **Frontend:** Next.js 14.2.33 (Pages Router, TypeScript 5.9.3), React 18.3.1, Tailwind CSS 3.4.4, Socket.io-client 4.8.3, Axios 1.19.0, Lucide React 0.552.0, Framer Motion 12.43.0.
- **Backend:** Node.js 18+ (ES Modules), Express.js 4.19.2, Socket.io 4.8.1, Mongoose 8.6.0, jsonwebtoken 9.0.2, bcrypt 5.1.1, Multer 2.4.0, Helmet 7.1.0, express-validator 7.2.1.
- **Database:** MongoDB Atlas (Cloud Managed NoSQL Database).
- **Testing:** Node.js native test runner (`node:test`, `node:assert/strict`).
- **Deployment:** Render (live backend: `https://campusplay-4g0z.onrender.com`), MongoDB Atlas cluster, Vercel-ready frontend.

#### Q7. Why did you choose Next.js instead of a plain React Single Page Application (SPA)?
**Answer:**  
Next.js provides server-side rendering (SSR), optimized font delivery via `next/font` (Poppins & Inter), fast file-based routing, and built-in production bundling. It ensures high performance and viewport-first mobile responsiveness when students access the platform via campus mobile networks.

#### Q8. Why did you choose MongoDB over a relational SQL database like PostgreSQL?
**Answer:**  
Sports bookings involve nested, semi-structured documents: a booking document contains a dynamic array of team squad members (names, rolls, verification statuses), an embedded timetable verification snapshot, and admin audit metadata. MongoDB document collections model this hierarchy naturally without requiring multi-table joins. Furthermore, Mongoose provides strict schema validation, type casting, pre-save hooks, and compound indexing (`ground + date + status`).

---

### Category 4: System Architecture & Data Flow

#### Q9. Describe the high-level architecture of CampusPlay.
**Answer:**  
CampusPlay uses a 4-tier service-oriented architecture:
1. **Client Tier:** Next.js 14 SPA with TypeScript, Tailwind CSS, and Socket.io-client.
2. **API & Security Gateway:** Express.js router with Helmet security headers, CORS policies, cookie parsing, and RBAC middleware.
3. **Domain Service Tier:** Decoupled business logic isolated in dedicated services (`timetableConflictService`, `equipmentService`, `facilityService`, `socketService`, `storageService`).
4. **Persistence Tier:** MongoDB Atlas replica set cluster with Mongoose ODM.

#### Q10. How does the real-time notification mechanism work?
**Answer:**  
When the HTTP server initializes, it attaches a `Socket.io` instance (`socketService.js`). When a client connects, they join designated rooms: administrators join `admin-room`, while students join their unique user ID room. When a student creates a booking, `socketService.notifyNewBooking()` emits a WebSocket event to `admin-room`. When an admin approves or rejects a request, `socketService.notifyBookingStatusChange()` dispatches an event directly to the student’s room, updating their UI instantly without polling.

---

### Category 5: Database Design & Models

#### Q11. What are the core database models in CampusPlay?
**Answer:**  
The system defines nine Mongoose models:
1. `User`: Student and admin profiles, credentials, roll number, academic branch/division, and contact numbers.
2. `Booking`: Facility reservations, time-slots, student snapshot, team members, timetable conflict verification snapshot, and admin approval/rejection audit.
3. `Equipment`: Sports equipment catalog, total stock, damaged quantity, missing quantity, and maintenance status.
4. `EquipmentBooking`: Equipment checkout requests, issuance timestamps, expected return, and physical inspection reconciliation.
5. `EquipmentInventoryTransaction`: Immutable audit log recording every inventory change, balance after, damaged delta, and actor.
6. `Facility`: Ground 1, Ground 2, Basketball Court, Badminton Court configurations, supported sports, and active/maintenance statuses.
7. `Timetable`: Structured academic timetable records (branch, academic year, division, semester, day, startTime, endTime, subject).
8. `TimetableDocument`: Metadata for uploaded reference timetable PDFs/images with binary validation.
9. `TimetableImportAudit`: Audit log for CSV bulk imports tracking row-by-row validation errors.

#### Q12. Why are compound indexes used in your database schemas?
**Answer:**  
In `Booking.js`, we established a compound index on `{ ground: 1, date: 1, status: 1 }` and `{ student: 1, status: 1 }`. When checking slot availability, queries filter by ground, date, and status simultaneously. Compound indexing allows MongoDB to satisfy these queries directly from memory in $O(\log N)$ time, avoiding expensive collection scans across historical bookings.

---

### Category 6: Implementation & Algorithmic Logic

#### Q13. How does the Timetable Conflict Detection algorithm work mathematically?
**Answer:**  
The algorithm converts textual time slots (e.g., "10–11 AM") into 24-hour military intervals (`10:00` to `11:00`). Given a booking interval $[startB, endB]$ and an academic class interval $[startS, endS]$, an overlap occurs if and only if:  
$$\text{overlap} = (startB < endS) \land (endB > startS)$$  
If $startB = endS$ or $endB = startS$ (e.g., a class ends at 11:00 and a booking starts at 11:00), the condition evaluates to `false`. This mathematically permits touching boundaries while detecting true overlaps.

#### Q14. How does the system handle multi-hour consecutive bookings?
**Answer:**  
Students can select up to two consecutive hourly slots (e.g., 2–3 PM and 3–4 PM). The helper `getBookingIntervals()` merges consecutive selections into a single continuous interval (e.g., 14:00 to 16:00) before evaluating overlaps against scheduled lectures, ensuring that multi-hour games are verified across their entire duration.

#### Q15. Explain your closed-loop equipment return reconciliation formula.
**Answer:**  
To prevent inventory loss, usable available stock is calculated dynamically:  
$$\text{UsableStock} = \text{TotalQuantity} - \text{DamagedQuantity} - \text{MissingQuantity} - \text{ActiveAllocations}$$  
where $\text{ActiveAllocations}$ represents equipment reserved, issued, or under return request. When gear is returned, the administrator inspects it and enters: $\text{quantityReturned}$ (usable), $\text{quantityDamaged}$, and $\text{quantityMissing}$. The controller strictly enforces:  
$$\text{quantityReturned} + \text{quantityDamaged} + \text{quantityMissing} == \text{quantityIssued}$$  
Usable stock is only incremented by $\text{quantityReturned}$, while damaged and missing tallies are permanently logged.

---

### Category 7: Security & Data Protection

#### Q16. How is user authentication secured in CampusPlay?
**Answer:**  
1. Passwords are never stored in plain text; they are hashed using `bcrypt` with a work factor of 10 salt rounds before database persistence.
2. Authentication tokens (JWT) are signed with a high-entropy secret (`JWT_SECRET`) and delivered exclusively via **HttpOnly cookies**. This makes tokens completely inaccessible to browser JavaScript, mitigating Cross-Site Scripting (XSS) token theft.
3. Strict email validation restricts student registration to the `@vit.edu.in` domain.
4. Role-Based Access Control (RBAC) middleware (`protect` and `adminOnly`) validates token claims before allowing administrative actions.

#### Q17. How does the system protect against malicious file uploads?
**Answer:**  
In `storageService.js`, uploaded timetable reference documents are inspected using **binary magic-byte validation**. The service opens the uploaded file and inspects the first 4 bytes directly:
- PDF files must start with `%PDF-` (`0x25, 0x50, 0x44, 0x46`).
- PNG files must start with `0x89, 0x50, 0x4E, 0x47`.
- JPEG files must start with `0xFF, 0xD8, 0xFF`.  
Renamed text files or disguised executables are rejected immediately regardless of their file extension. Additionally, storage paths are sanitized to prevent directory traversal attacks (`../`).

---

### Category 8: Testing & Verification

#### Q18. How did you test CampusPlay, and what were the verified results?
**Answer:**  
We developed an automated test suite executed via Node's native test runner (`node:test`, `node:assert/strict`). A total of **49 automated unit and integration tests** were written across three test files:
- `timetableConflict.test.js`: 24 tests covering overlap math, touching boundaries, CSV validation, magic bytes, and anti-traversal.
- `equipmentReturn.test.js`: 10 tests covering full returns, partial returns, damage reconciliation, idempotency, and cancellation integrity.
- `studentAcademicContact.test.js`: 15 tests covering phone normalization, profile immutability, stream combinations, and RBAC data privacy.  
**All 49 tests passed with a 100% success rate (0 failures).**

#### Q19. Can you give an example of a defect caught by your automated tests?
**Answer:**  
Yes. In an early iteration of our equipment return logic, if an administrator accidentally clicked the "Confirm Return" button twice in rapid succession, two concurrent HTTP requests entered the controller, causing the returned stock to be added twice to inventory. Test `EQ-04 (Duplicate Return)` and `EQ-07 (Concurrent Returns)` caught this race condition. We resolved it by implementing **check-and-set idempotency**: the controller checks whether the booking status is strictly `Issued` or `Return Requested` before applying stock adjustments, immediately returning a 400 error for subsequent duplicate requests.

---

### Category 9: User Interface & User Experience (UI/UX)

#### Q20. What is the 'Sport & Nature Harmony' design system?
**Answer:**  
It is our custom UI theme defined in `frontend/constants/theme.ts`. It pairs sporty athletic energy with clean academic clarity:
- **Primary Blue (`#2563EB`):** High-contrast action color for primary CTAs and active tabs.
- **Emerald Green (`#10B981`):** Represents sports turf, vitality, and successful approvals.
- **Slate Dark (`#0F172A`):** Deep navy background ensuring strong visual hierarchy.
- **Typography:** Poppins (600/700) for energetic headings and Inter (400/500) for dense tabular data.

#### Q21. How does the interface prevent user errors?
**Answer:**  
1. **Disabled Past Dates:** The date picker automatically disables past dates using `min={getTodayDate()}`.
2. **Roll Number Masking:** Enforces alphanumeric validation (`/^[A-Za-z0-9]{1,10}$/`).
3. **Single In-Flight Submissions:** Submit buttons disable and show animated spinners during API requests.
4. **Pre-Submission Review:** A confirmation modal presents all squad and slot data before final database write.

---

### Category 10: Limitations & Future Scope

#### Q22. What are the current limitations of CampusPlay?
**Answer:**  
1. **Physical Access Enforcement:** The software manages digital reservation permissions, but physical ground access still relies on gymkhana attendants to unlock gates.
2. **Scanned PDF OCR:** Reference timetables uploaded as scanned images require visual human review rather than automated OCR text extraction.
3. **Single Institution Scope:** Academic divisions and email domains are tailored specifically to Vidyalankar Institute of Technology.

#### Q23. What is your prioritized future roadmap?
**Answer:**  
- **Phase 1 (High Impact):** IoT Smart Turnstiles — installing QR-code or RFID card scanners at ground gates to unlock turnstiles automatically upon scanning a valid booking token on the student's mobile device.
- **Phase 2 (Medium Impact):** Inter-College Tournament Module — automated bracket generation, match fixtures, and live score tracking for annual collegiate sports fests.
- **Phase 3 (Medium Impact):** Automated Equipment Fines — integrating with student institutional fee accounts to assess replacement fines automatically for unreturned or damaged sports gear.

#### Q24. Is the project deployed and verifiable in a production environment?
**Answer:**  
Yes. The backend REST API and WebSocket server are deployed live on **Render** at `https://campusplay-4g0z.onrender.com`. Health checks can be verified at `https://campusplay-4g0z.onrender.com/api/health`. The database is hosted on a cloud **MongoDB Atlas** replica set. The frontend is fully configured for deployment on Vercel with environment variable linkages.

#### Q25. What was your most valuable learning experience from this project?
**Answer:**  
Applying Design Thinking alongside rigorous software engineering taught us that real-world problems require more than just a generic database CRUD interface. By conducting empathy research, we discovered the hidden tension between student recreation and academic lecture schedules. Translating that insight into an automated interval conflict detection engine and verifiable inventory governance taught us the true value of human-centered engineering.

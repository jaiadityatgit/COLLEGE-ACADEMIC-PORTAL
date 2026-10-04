import { connectDatabase, disconnectDatabase } from "./config/database";
import User from "./models/User.model";
import Student from "./models/Student.model";
import Department from "./models/Department.model";
import Course from "./models/Course.model";
import Semester from "./models/Semester.model";
import Batch from "./models/Batch.model";
import Lab from "./models/Lab.model";
import FacultyProfile from "./models/FacultyProfile.model";
import Notebook from "./models/Notebook.model";
import Timetable from "./models/Timetable.model";
import Assignment from "./models/Assignment.model";
import Submission from "./models/Submission.model";
import Attendance from "./models/Attendance.model";
import Announcement from "./models/Announcement.model";
import Exam from "./models/Exam.model";
import Grade from "./models/Grade.model";
import CalendarEvent from "./models/CalendarEvent.model";
import Notification from "./models/Notification.model";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// Helpers

function futureDate(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

function pastDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

/** Deterministic seeded random using roll index for reproducible demo data */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Upsert a user by email. Returns the user document. */
async function upsertUser(data: any) {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    // Update fields except password if already exists
    await User.updateOne({ email: data.email }, {
      $set: {
        name: data.name,
        role: data.role,
        collegeId: data.collegeId,
        departmentId: data.departmentId,
        designation: data.designation,
        isActive: data.isActive ?? true
      }
    });
    return (await User.findOne({ email: data.email }))!;
  }
  return await User.create(data);
}

/** Upsert a student by rollNumber within a college. */
async function upsertStudent(data: any) {
  const existing = await Student.findOne({ collegeId: data.collegeId, rollNumber: data.rollNumber });
  if (existing) {
    await Student.updateOne({ _id: existing._id }, { $set: data });
    return (await Student.findOne({ _id: existing._id }))!;
  }
  return await Student.create(data);
}

// Seed Function

export async function seedDatabase() {
  console.log("🌱 Starting EE-VDT Department OS seeding (III EE-VDT 2026-27)...");

  try {
    const bcrypt = await import("bcryptjs");
    const defaultPasswordHash = await bcrypt.default.hash("Password123!", 10);

    // Mock College ID (stable for multi-tenant)
    const collegeId = new mongoose.Types.ObjectId("650c1f1e1c9d440000a1b2c3");

    // Clear existing demo data (idempotent reset)
    console.log("🧹 Clearing existing seed data...");
    // Remove only data belonging to this college to avoid affecting other tenants
    const models = [
      Student, FacultyProfile, Notebook, Timetable, Assignment, Submission,
      Attendance, Announcement, Exam, Grade, CalendarEvent, Notification
    ];
    for (const model of models) {
      await (model as any).deleteMany({ collegeId });
    }
    // Clean up users, courses, labs, semesters, batches for this college
    await User.deleteMany({ collegeId });
    await Course.deleteMany({ collegeId });
    await Lab.deleteMany({ collegeId });
    await Semester.deleteMany({ collegeId });
    await Batch.deleteMany({ collegeId });
    await Department.deleteMany({ collegeId });

    // Department
    console.log("🏛️ Creating EE-VDT Department...");
    const eceDept = await Department.create({
      collegeId,
      departmentCode: "EE-VDT",
      departmentName: "Electronics Engineering (VLSI Design and Technology)",
      description: "Department of Electronics Engineering (VLSI Design and Technology) focuses on analog & digital VLSI design, semiconductor devices, HDL modeling, ASIC/FPGA design, embedded systems, and IC technology.",
      vision: "To be a centre of excellence in Electronics Engineering (VLSI Design and Technology) education and research.",
      mission: "To produce competent engineers with strong fundamentals and innovative mindset.",
      facultyCount: 9,
      courseCount: 11
    });

    // Semesters
    console.log("📅 Creating Semesters...");
    const semesters = [];
    for (let i = 1; i <= 8; i++) {
      const sem = await Semester.create({
        collegeId,
        departmentId: eceDept._id,
        name: `Semester ${["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][i - 1]}`,
        number: i,
        academicYear: "2026-2027",
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-11-30"),
        isActive: i === 5, // Semester V is active for III year
        regulationYear: "R2021"
      });
      semesters.push(sem);
    }
    const activeSemester = semesters[4]; // Semester V

    // Batch
    console.log("👥 Creating III EE-VDT Batch...");
    const batch = await Batch.create({
      collegeId,
      departmentId: eceDept._id,
      name: "2024-2028 III EE-VDT",
      code: "EE-VDT-III-2024",
      startYear: 2024,
      endYear: 2028,
      section: "A",
      currentSemesterId: activeSemester._id,
      studentCount: 56,
      isActive: true
    });

    // ═══════════════════════════════════════════════════════════════════════
    // USERS — Admin, HOD, Faculty, Students
    // ═══════════════════════════════════════════════════════════════════════
    console.log("👤 Creating users...");

    // Admin
    const adminUser = await upsertUser({
      name: "Dr. K. Ramesh",
      email: "admin@ece.edu",
      passwordHash: defaultPasswordHash,
      role: "college_admin",
      collegeId,
      departmentId: eceDept._id,
      designation: "Principal",
      isActive: true
    });

    // HOD: Dr. P. Dhilipkumar
    const hodUser = await upsertUser({
      name: "Dr. P. Dhilipkumar",
      email: "dhilipkumar@ece.edu",
      passwordHash: defaultPasswordHash,
      role: "hod",
      collegeId,
      departmentId: eceDept._id,
      designation: "AP/EE-VDT",
      isActive: true
    });
    // Update department HOD reference
    await Department.findByIdAndUpdate(eceDept._id, { hodUserId: hodUser._id });

    // Faculty
    const facultyData = [
      { name: "Dr. Beryl EN Bink R", email: "beryl@ece.edu", designation: "AP/Maths" },
      { name: "Mrs. R. V. Jasanthi", email: "jasanthi@ece.edu", designation: "AP/EE-VDT" },
      { name: "Mrs. C. Prema", email: "prema@ece.edu", designation: "AP/EE-VDT" },
      { name: "Mrs. S. Hemalatha", email: "hemalatha@ece.edu", designation: "AP/EE-VDT" },
      { name: "Mr. S. Boopathy", email: "boopathy@ece.edu", designation: "AP/EE-VDT" },
      { name: "Mrs. P. Eswari", email: "eswari@ece.edu", designation: "AP/EE-VDT" },
      { name: "Ms. Padmani", email: "padmani@ece.edu", designation: "AP/English" },
      { name: "Mr. Manoj Kumar", email: "manojkumar@ece.edu", designation: "Quant" },
    ];

    const facultyUsers: any[] = [];
    for (const f of facultyData) {
      const user = await upsertUser({
        name: f.name,
        email: f.email,
        passwordHash: defaultPasswordHash,
        role: "faculty",
        collegeId,
        departmentId: eceDept._id,
        designation: f.designation,
        isActive: true
      });
      facultyUsers.push(user);
    }

    // Named references for convenience
    const [beryl, jasanthi, prema, hemalatha, boopathy, eswari, padmani, manojKumar] = facultyUsers;

    // Students (56 total: 54 regular + 2 lateral)
    console.log("🎓 Creating 56 III EE-VDT students...");
    const studentList = [
      // Regular Entry (54)
      { roll: "714024169001", name: "Abirami", entry: "regular" as const },
      { roll: "714024169002", name: "AJAIKUMAR G", entry: "regular" as const },
      { roll: "714024169003", name: "ANAND K", entry: "regular" as const },
      { roll: "714024169004", name: "ASHWIN S", entry: "regular" as const },
      { roll: "714024169005", name: "DARSHAN R A", entry: "regular" as const },
      { roll: "714024169006", name: "DHARANEESH A M", entry: "regular" as const },
      { roll: "714024169007", name: "DHIVYA G B", entry: "regular" as const },
      { roll: "714024169008", name: "GOKUL P", entry: "regular" as const },
      { roll: "714024169009", name: "HARINI D", entry: "regular" as const },
      { roll: "714024169010", name: "HARINI K S", entry: "regular" as const },
      { roll: "714024169011", name: "JAI ADITYA T", entry: "regular" as const },
      { roll: "714024169012", name: "JAIABINAV T", entry: "regular" as const },
      { roll: "714024169013", name: "JITHIN RIO R", entry: "regular" as const },
      { roll: "714024169014", name: "KAMALESH V K", entry: "regular" as const },
      { roll: "714024169015", name: "KAVIESHWARA M", entry: "regular" as const },
      { roll: "714024169016", name: "KAVYA M", entry: "regular" as const },
      { roll: "714024169017", name: "KIRUTHIKA S", entry: "regular" as const },
      { roll: "714024169018", name: "MANOVA M", entry: "regular" as const },
      { roll: "714024169019", name: "MIRUTHULA S", entry: "regular" as const },
      { roll: "714024169020", name: "MOHAMED JAIM M", entry: "regular" as const },
      { roll: "714024169021", name: "MOHAMMED AYMAN M", entry: "regular" as const },
      { roll: "714024169022", name: "MONIKA M", entry: "regular" as const },
      { roll: "714024169023", name: "MUKILAN R", entry: "regular" as const },
      { roll: "714024169024", name: "NITHIKKANNAN JS", entry: "regular" as const },
      { roll: "714024169025", name: "NITIN K R", entry: "regular" as const },
      { roll: "714024169026", name: "PRATHEEP D", entry: "regular" as const },
      { roll: "714024169027", name: "PRITHIKA P", entry: "regular" as const },
      { roll: "714024169028", name: "PUGAAZHENDHI S", entry: "regular" as const },
      { roll: "714024169029", name: "RAGHUL VASUN V T", entry: "regular" as const },
      { roll: "714024169030", name: "RAHUL PRASATH S", entry: "regular" as const },
      { roll: "714024169031", name: "RETHIKA S", entry: "regular" as const },
      { roll: "714024169032", name: "ROOBASHRI S", entry: "regular" as const },
      { roll: "714024169033", name: "SAKTHISHREE D", entry: "regular" as const },
      { roll: "714024169034", name: "SANJEEV G H", entry: "regular" as const },
      { roll: "714024169035", name: "SANJEYKRISHNA V", entry: "regular" as const },
      { roll: "714024169036", name: "SANKAMES V S", entry: "regular" as const },
      { roll: "714024169037", name: "SANTHOSH KUMAR S", entry: "regular" as const },
      { roll: "714024169038", name: "SASMITHA S P", entry: "regular" as const },
      { roll: "714024169039", name: "SHANMATHI S", entry: "regular" as const },
      { roll: "714024169040", name: "SOORYA VELAA P", entry: "regular" as const },
      { roll: "714024169041", name: "SRI VATSAN P", entry: "regular" as const },
      { roll: "714024169042", name: "SRIRAM M R", entry: "regular" as const },
      { roll: "714024169043", name: "SUBHASHINI N", entry: "regular" as const },
      { roll: "714024169044", name: "SUBIKSHA L", entry: "regular" as const },
      { roll: "714024169045", name: "SUMAN S", entry: "regular" as const },
      { roll: "714024169046", name: "SWETHA R", entry: "regular" as const },
      { roll: "714024169047", name: "THARUN M", entry: "regular" as const },
      { roll: "714024169048", name: "THARUN R", entry: "regular" as const },
      { roll: "714024169049", name: "THARUN R M", entry: "regular" as const },
      { roll: "714024169050", name: "THIRUMURUGAN S", entry: "regular" as const },
      { roll: "714024169051", name: "UDHAYA R", entry: "regular" as const },
      { roll: "714024169052", name: "VARSHA V R", entry: "regular" as const },
      { roll: "714024169053", name: "WINSTON CHURCHIL", entry: "regular" as const },
      { roll: "714024169054", name: "YOGESH S", entry: "regular" as const },
      // Lateral Entry (2)
      { roll: "714024169301", name: "ABHISHEK P", entry: "lateral_entry" as const },
      { roll: "714024169302", name: "KAUSHIK R", entry: "lateral_entry" as const },
    ];

    const studentUsers: any[] = [];
    const studentRecords: any[] = [];

    for (const s of studentList) {
      const email = `${s.roll}@ece.edu`;
      const user = await upsertUser({
        name: s.name,
        email,
        passwordHash: defaultPasswordHash,
        role: "student",
        collegeId,
        departmentId: eceDept._id,
        isActive: true
      });
      studentUsers.push(user);

      const studentRecord = await upsertStudent({
        userId: user._id,
        collegeId,
        departmentId: eceDept._id,
        batchId: batch._id,
        currentSemesterId: activeSemester._id,
        rollNumber: s.roll,
        entryType: s.entry,
        enrolledCourseIds: [], // will be populated after courses
        studyStreak: Math.floor(seededRandom(parseInt(s.roll.slice(-3))) * 15)
      });
      studentRecords.push(studentRecord);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FACULTY PROFILES
    // ═══════════════════════════════════════════════════════════════════════
    console.log("📋 Creating Faculty Profiles...");

    const profilesData = [
      {
        userId: hodUser._id, employeeId: "ECE-FAC-001", designation: "AP/EE-VDT (HOD)",
        qualification: "Ph.D. in VLSI Design", specialization: ["VLSI", "FPGA", "Scripting Languages"],
        experience: 18, officeRoom: "HOD Room, EE-VDT Block", officeHours: "Mon-Fri 10 AM-12 PM", publications: 45
      },
      {
        userId: beryl._id, employeeId: "ECE-FAC-002", designation: "AP/Maths",
        qualification: "Ph.D. in Mathematics", specialization: ["Graph Theory", "Discrete Mathematics"],
        experience: 12, officeRoom: "Room 201, Maths Block", officeHours: "Tue & Thu 2-4 PM", publications: 28
      },
      {
        userId: jasanthi._id, employeeId: "ECE-FAC-003", designation: "AP/EE-VDT",
        qualification: "M.Tech in Environmental Engineering", specialization: ["Environmental Science", "Sustainable Systems"],
        experience: 8, officeRoom: "Room 204, EE-VDT Block", officeHours: "Mon & Wed 3-5 PM", publications: 12
      },
      {
        userId: prema._id, employeeId: "ECE-FAC-004", designation: "AP/EE-VDT",
        qualification: "M.Tech in Communication Systems", specialization: ["Static Timing Analysis", "VLSI Design"],
        experience: 10, officeRoom: "Room 205, EE-VDT Block", officeHours: "Wed & Fri 10 AM-12 PM", publications: 15
      },
      {
        userId: hemalatha._id, employeeId: "ECE-FAC-005", designation: "AP/EE-VDT",
        qualification: "Ph.D. in Signal Processing", specialization: ["DSP", "Image Processing", "MATLAB"],
        experience: 14, officeRoom: "Room 206, EE-VDT Block", officeHours: "Mon & Thu 2-4 PM", publications: 32
      },
      {
        userId: boopathy._id, employeeId: "ECE-FAC-006", designation: "AP/EE-VDT",
        qualification: "M.Tech in Embedded Systems", specialization: ["Embedded Systems", "IoT", "ARM"],
        experience: 9, officeRoom: "Room 207, EE-VDT Block", officeHours: "Tue & Fri 11 AM-1 PM", publications: 18
      },
      {
        userId: eswari._id, employeeId: "ECE-FAC-007", designation: "AP/EE-VDT",
        qualification: "M.Tech in Communication Engineering", specialization: ["DSP Lab", "Communication Systems"],
        experience: 7, officeRoom: "Room 208, EE-VDT Block", officeHours: "Mon & Wed 2-4 PM", publications: 10
      },
      {
        userId: padmani._id, employeeId: "ECE-FAC-008", designation: "AP/English",
        qualification: "M.A. in English Literature", specialization: ["Verbal Communication", "Technical Writing"],
        experience: 6, officeRoom: "Room 102, English Block", officeHours: "Tue & Thu 3-5 PM", publications: 5
      },
      {
        userId: manojKumar._id, employeeId: "ECE-FAC-009", designation: "Quant Faculty",
        qualification: "M.Sc. in Mathematics", specialization: ["Quantitative Aptitude", "Reasoning"],
        experience: 5, officeRoom: "Room 103, Placement Block", officeHours: "Mon-Fri 4-5 PM", publications: 3
      }
    ];

    for (const p of profilesData) {
      await FacultyProfile.create({ ...p, collegeId, departmentId: eceDept._id });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COURSES (Semester V — III ECE)
    // ═══════════════════════════════════════════════════════════════════════
    console.log("📚 Creating Courses...");

    const courseDefinitions = [
      { code: "21MA501", name: "Graph Theory", shortCode: "GT", credits: 4, type: "theory" as const, faculty: beryl, syllabus: ["Graph Fundamentals", "Trees & Connectivity", "Euler and Hamilton Graphs", "Graph Coloring", "Planar Graphs"] },
      { code: "21CE501", name: "Environmental Science and Engineering", shortCode: "EVS", credits: 3, type: "theory" as const, faculty: jasanthi, syllabus: ["Environment & Ecosystems", "Natural Resources", "Environmental Pollution", "Social Issues", "Human Population & Environment"] },
      { code: "21VL501", name: "Scripting Languages for FPGA", shortCode: "SL", credits: 4, type: "theory" as const, faculty: hodUser, syllabus: ["Python Basics", "Tcl Scripting", "VHDL/Verilog Scripting", "FPGA Design Flow", "Hardware Description Languages"] },
      { code: "21PCE05", name: "Scripting and STA (Professional Elective 2)", shortCode: "STA", credits: 3, type: "theory" as const, faculty: prema, syllabus: ["Static Timing Analysis", "Timing Constraints", "Clock Domain Crossing", "Timing Reports", "Optimization Techniques"] },
      { code: "21EC521", name: "Digital Signal Processing", shortCode: "DSP", credits: 4, type: "theory" as const, faculty: hemalatha, syllabus: ["Discrete-Time Signals & Systems", "DFT and FFT Algorithms", "FIR Filter Design", "IIR Filter Design", "Multi-rate Signal Processing"] },
      { code: "21VL522", name: "Embedded System Design", shortCode: "ESD", credits: 4, type: "theory" as const, faculty: boopathy, syllabus: ["Embedded System Architecture", "ARM Processor", "RTOS Concepts", "Interfacing Techniques", "Embedded C Programming"] },
      { code: "21EC522", name: "Digital Signal Processing Lab", shortCode: "DSP LAB", credits: 2, type: "lab" as const, faculty: eswari, syllabus: ["MATLAB Basics", "DFT Implementation", "FIR Filter Implementation", "IIR Filter Implementation", "Real-time DSP"] },
      { code: "21VL512", name: "Embedded System Design Lab", shortCode: "ESD LAB", credits: 2, type: "lab" as const, faculty: boopathy, syllabus: ["LED & Switch Interfacing", "Timer Programming", "Serial Communication", "ADC/DAC Interfacing", "Motor Control"] },
      { code: "21VL502", name: "Scripting Languages Laboratory", shortCode: "SL LAB", credits: 2, type: "lab" as const, faculty: hodUser, syllabus: ["Python Lab Exercises", "Tcl Scripts", "FPGA Simulation", "Hardware Testing", "Design Verification"] },
      { code: "21VL511", name: "Engineering Exploration V", shortCode: "EE-V", credits: 1, type: "theory" as const, faculty: boopathy, syllabus: ["Industry Awareness", "Mini Project", "Technical Presentation", "Professional Ethics", "Emerging Technologies"] },
      { code: "21EN501", name: "Career Enhancement Program III", shortCode: "CEP III", credits: 2, type: "theory" as const, faculty: padmani, syllabus: ["Verbal Aptitude", "Reading Comprehension", "Quantitative Reasoning", "Logical Reasoning", "Group Discussion"] },
    ];

    const courses: any[] = [];
    for (const c of courseDefinitions) {
      // Determine faculty IDs - CEP III has two faculty
      let facIds: any[];
      if (c.shortCode === "CEP III") {
        facIds = [padmani._id, manojKumar._id];
      } else {
        facIds = [c.faculty._id];
      }

      const course = await Course.create({
        collegeId,
        departmentId: eceDept._id,
        courseCode: c.code,
        name: c.name,
        semester: "V",
        academicYear: "2026-2027",
        description: `${c.name} (${c.shortCode}) — Semester V, III EE-VDT`,
        credits: c.credits,
        courseType: c.type,
        syllabus: c.syllabus,
        regulationYear: "R2021",
        facultyIds: facIds,
        studentIds: studentUsers.map(s => s._id),
        status: "active"
      });
      courses.push(course);
    }

    // Map course short codes to course objects for easy reference
    const courseMap: Record<string, any> = {};
    courseDefinitions.forEach((def, i) => {
      courseMap[def.shortCode] = courses[i];
    });

    // Enroll all students in all courses
    const allCourseIds = courses.map(c => c._id);
    for (const student of studentRecords) {
      await Student.findByIdAndUpdate(student._id, { enrolledCourseIds: allCourseIds });
    }

    // Assign courses to faculty users (assignedCourseIds on User)
    // HOD: SL + SL LAB
    await User.findByIdAndUpdate(hodUser._id, {
      assignedCourseIds: [courseMap["SL"]._id, courseMap["SL LAB"]._id]
    });
    await User.findByIdAndUpdate(beryl._id, { assignedCourseIds: [courseMap["GT"]._id] });
    await User.findByIdAndUpdate(jasanthi._id, { assignedCourseIds: [courseMap["EVS"]._id] });
    await User.findByIdAndUpdate(prema._id, { assignedCourseIds: [courseMap["STA"]._id] });
    await User.findByIdAndUpdate(hemalatha._id, { assignedCourseIds: [courseMap["DSP"]._id] });
    await User.findByIdAndUpdate(boopathy._id, {
      assignedCourseIds: [courseMap["ESD"]._id, courseMap["ESD LAB"]._id, courseMap["EE-V"]._id]
    });
    await User.findByIdAndUpdate(eswari._id, { assignedCourseIds: [courseMap["DSP LAB"]._id] });
    await User.findByIdAndUpdate(padmani._id, { assignedCourseIds: [courseMap["CEP III"]._id] });
    await User.findByIdAndUpdate(manojKumar._id, { assignedCourseIds: [courseMap["CEP III"]._id] });

    // ═══════════════════════════════════════════════════════════════════════
    // LABS
    // ═══════════════════════════════════════════════════════════════════════
    console.log("🔬 Creating Labs...");
    const labData = [
      {
        name: "VLSI Lab", labCode: "VDT-LAB-01", room: "VLSI Lab",
        capacity: 30,
        equipment: ["DSP Trainer Kit", "CRO", "Function Generator", "MATLAB Workstations"],
        labInchargeId: eswari._id,
        courseIds: [courseMap["DSP LAB"]._id]
      },
      {
        name: "Optical Lab", labCode: "ECE-LAB-02", room: "Optical Lab",
        capacity: 30,
        equipment: ["FPGA Boards", "Xilinx Tools", "Verilog Workstations", "Logic Analyzer"],
        labInchargeId: hodUser._id,
        courseIds: [courseMap["SL LAB"]._id]
      },
      {
        name: "E-Lab (Embedded Lab)", labCode: "ECE-LAB-03", room: "E-Lab",
        capacity: 30,
        equipment: ["ARM Development Board", "8051 Kit", "Logic Analyzer", "DSO", "Motor Interface Kits"],
        labInchargeId: boopathy._id,
        courseIds: [courseMap["ESD LAB"]._id]
      },
      {
        name: "Communication Lab", labCode: "ECE-LAB-04", room: "Communication Lab",
        capacity: 25,
        equipment: ["Signal Generators", "Spectrum Analyzer", "DSP Boards", "MATLAB Workstations"],
        labInchargeId: eswari._id,
        courseIds: [courseMap["DSP LAB"]._id]
      },
    ];

    for (const l of labData) {
      await Lab.create({
        collegeId, departmentId: eceDept._id,
        ...l,
        labStaffIds: [],
        isActive: true
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUBJECT WORKSPACES (Notebooks) — one per course per student
    // ═══════════════════════════════════════════════════════════════════════
    console.log("📓 Creating Subject Workspaces...");
    const notebookDocs: any[] = [];
    for (const course of courses) {
      for (const student of studentUsers) {
        notebookDocs.push({
          name: course.name,
          description: `${course.courseCode} — ${course.name} workspace`,
          courseId: course._id,
          userId: student._id,
          collegeId,
          template: "blank",
          isActive: true
        });
      }
    }
    await Notebook.insertMany(notebookDocs);

    // ═══════════════════════════════════════════════════════════════════════
    // TIMETABLE — Actual III ECE timetable
    // ═══════════════════════════════════════════════════════════════════════
    console.log("🗓️ Creating Actual III ECE Timetable...");

    // Helper to resolve faculty for a course shortcode
    const getFacultyForCourse = (shortCode: string) => {
      const def = courseDefinitions.find(c => c.shortCode === shortCode);
      return def ? def.faculty._id : hodUser._id;
    };

    const timetableEntries = [
      // Monday (dayOfWeek: 1)
      { shortCode: "EVS", day: 1, start: "08:30", end: "09:15", room: "Room 101", type: "lecture" as const },
      { shortCode: "STA", day: 1, start: "09:15", end: "10:00", room: "Room 101", type: "lecture" as const },
      { shortCode: "STA", day: 1, start: "10:00", end: "10:45", room: "Room 101", type: "lecture" as const },
      { shortCode: "GT", day: 1, start: "11:00", end: "11:45", room: "Room 101", type: "lecture" as const },
      { shortCode: "SL", day: 1, start: "11:45", end: "12:30", room: "Room 101", type: "lecture" as const },
      { shortCode: "SL LAB", day: 1, start: "12:30", end: "13:15", room: "Optical Lab", type: "lab" as const },
      { shortCode: "SL", day: 1, start: "14:00", end: "14:45", room: "Room 101", type: "lecture" as const },
      { shortCode: "DSP", day: 1, start: "14:45", end: "15:30", room: "Room 101", type: "lecture" as const },
      { shortCode: "DSP", day: 1, start: "15:45", end: "16:30", room: "Room 101", type: "lecture" as const },

      // Tuesday (dayOfWeek: 2)
      { shortCode: "STA", day: 2, start: "08:30", end: "09:15", room: "Room 101", type: "lecture" as const },
      { shortCode: "ESD", day: 2, start: "09:15", end: "10:00", room: "Room 101", type: "lecture" as const },
      { shortCode: "GT", day: 2, start: "10:00", end: "10:45", room: "Room 101", type: "lecture" as const },
      { shortCode: "DSP", day: 2, start: "11:00", end: "11:45", room: "Room 101", type: "lecture" as const },
      { shortCode: "DSP", day: 2, start: "11:45", end: "12:30", room: "Room 101", type: "lecture" as const },
      { shortCode: "EVS", day: 2, start: "12:30", end: "13:15", room: "Room 101", type: "lecture" as const },
      { shortCode: "SL", day: 2, start: "14:00", end: "14:45", room: "Room 101", type: "lecture" as const },
      { shortCode: "CEP III", day: 2, start: "14:45", end: "15:30", room: "Room 101", type: "lecture" as const },
      { shortCode: "CEP III", day: 2, start: "15:45", end: "16:30", room: "Room 101", type: "lecture" as const },

      // Wednesday (dayOfWeek: 3)
      { shortCode: "ESD", day: 3, start: "08:30", end: "09:15", room: "Room 101", type: "lecture" as const },
      { shortCode: "EVS", day: 3, start: "09:15", end: "10:00", room: "Room 101", type: "lecture" as const },
      { shortCode: "GT", day: 3, start: "10:00", end: "10:45", room: "Room 101", type: "lecture" as const },
      // ESD LAB / DSP LAB (Batch split) — ECE Lab / Optical Lab
      { shortCode: "ESD LAB", day: 3, start: "11:00", end: "13:15", room: "ECE Lab", type: "lab" as const },
      { shortCode: "DSP LAB", day: 3, start: "11:00", end: "13:15", room: "Optical Lab", type: "lab" as const },
      { shortCode: "DSP", day: 3, start: "14:00", end: "14:45", room: "Room 101", type: "lecture" as const },
      { shortCode: "SL", day: 3, start: "14:45", end: "15:30", room: "Room 101", type: "lecture" as const },
      { shortCode: "EVS", day: 3, start: "15:45", end: "16:30", room: "Room 101", type: "lecture" as const },

      // Thursday (dayOfWeek: 4)
      { shortCode: "ESD", day: 4, start: "08:30", end: "09:15", room: "Room 101", type: "lecture" as const },
      { shortCode: "SL", day: 4, start: "09:15", end: "10:00", room: "Room 101", type: "lecture" as const },
      { shortCode: "STA", day: 4, start: "10:00", end: "10:45", room: "Room 101", type: "lecture" as const },
      // CEP III (11:00 - 13:15)
      { shortCode: "CEP III", day: 4, start: "11:00", end: "13:15", room: "Room 101", type: "lecture" as const },
      // SL LAB / ESD LAB (Batch split) — Optical Lab / E-Lab
      { shortCode: "SL LAB", day: 4, start: "14:00", end: "16:30", room: "Optical Lab", type: "lab" as const },
      { shortCode: "ESD LAB", day: 4, start: "14:00", end: "16:30", room: "E-Lab", type: "lab" as const },

      // Friday (dayOfWeek: 5)
      { shortCode: "EVS", day: 5, start: "08:30", end: "09:15", room: "Room 101", type: "lecture" as const },
      { shortCode: "GT", day: 5, start: "09:15", end: "10:00", room: "Room 101", type: "lecture" as const },
      { shortCode: "GT", day: 5, start: "10:00", end: "10:45", room: "Room 101", type: "lecture" as const },
      { shortCode: "STA", day: 5, start: "11:00", end: "11:45", room: "Room 101", type: "lecture" as const },
      { shortCode: "ESD", day: 5, start: "11:45", end: "12:30", room: "Room 101", type: "lecture" as const },
      { shortCode: "ESD", day: 5, start: "12:30", end: "13:15", room: "Room 101", type: "lecture" as const },
      // SL LAB / DSP LAB (Batch split) — Optical Lab / Communication Lab
      { shortCode: "SL LAB", day: 5, start: "14:00", end: "16:30", room: "Optical Lab", type: "lab" as const },
      { shortCode: "DSP LAB", day: 5, start: "14:00", end: "16:30", room: "Communication Lab", type: "lab" as const },

      // Saturday (dayOfWeek: 6)
      { shortCode: "EE-V", day: 6, start: "09:00", end: "12:00", room: "Room 101", type: "lecture" as const },
    ];

    for (const entry of timetableEntries) {
      const course = courseMap[entry.shortCode];
      if (!course) continue;
      await Timetable.create({
        collegeId,
        departmentId: eceDept._id,
        courseId: course._id,
        facultyId: getFacultyForCourse(entry.shortCode),
        dayOfWeek: entry.day,
        startTime: entry.start,
        endTime: entry.end,
        room: entry.room,
        type: entry.type
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ASSIGNMENTS — Realistic across subjects
    // ═══════════════════════════════════════════════════════════════════════
    console.log("📝 Creating Assignments...");

    const assignmentData = [
      { sc: "GT", title: "Graph Coloring Problem Set", desc: "Solve the following problems on chromatic number, edge coloring, and map coloring. Show all steps.", marks: 25, due: 7 },
      { sc: "GT", title: "Euler & Hamilton Path Analysis", desc: "Analyze the given graphs for Euler paths/circuits and Hamilton paths. Provide formal proofs where required.", marks: 20, due: 14 },
      { sc: "EVS", title: "Environmental Impact Assessment Report", desc: "Prepare an EIA report for a proposed industrial project in your locality. Include environmental components, impact prediction, and mitigation measures.", marks: 30, due: 21 },
      { sc: "SL", title: "Python Scripting for FPGA Automation", desc: "Write Python scripts to automate FPGA pin assignment and bitstream generation. Submit code and documentation.", marks: 25, due: 10 },
      { sc: "SL", title: "Tcl Script for Timing Closure", desc: "Develop a Tcl script that reads a timing report, identifies critical paths, and generates optimization suggestions.", marks: 20, due: 18 },
      { sc: "STA", title: "Static Timing Analysis Lab Report", desc: "Perform STA on the provided netlist using Synopsys PrimeTime. Document setup/hold violations and suggest fixes.", marks: 25, due: 12 },
      { sc: "DSP", title: "DFT Implementation Report", desc: "Implement 8-point DFT using direct computation and compare with FFT. Submit MATLAB code and results.", marks: 25, due: 8 },
      { sc: "DSP", title: "FIR Filter Design Assignment", desc: "Design a lowpass FIR filter using window method and frequency sampling. Compare filter characteristics.", marks: 20, due: 16 },
      { sc: "ESD", title: "ARM Cortex-M4 Timer Programming", desc: "Program the SysTick timer and General Purpose Timers on STM32. Implement PWM generation for LED dimming.", marks: 25, due: 9 },
      { sc: "ESD", title: "RTOS Task Scheduling Report", desc: "Implement rate monotonic and earliest deadline first scheduling on FreeRTOS. Compare performance and explain results.", marks: 30, due: 20 },
      { sc: "CEP III", title: "Mock Aptitude Test - Verbal", desc: "Complete the verbal aptitude practice test covering reading comprehension, sentence correction, and para jumbles. Time limit: 45 minutes.", marks: 50, due: 5 },
      { sc: "CEP III", title: "Quantitative Problem Set 3", desc: "Solve problems on permutations, combinations, probability, and data interpretation. Show working for each answer.", marks: 50, due: 11 },
    ];

    const createdAssignments: any[] = [];
    for (const a of assignmentData) {
      const course = courseMap[a.sc];
      if (!course) continue;
      const faculty = getFacultyForCourse(a.sc);
      const assignment = await Assignment.create({
        collegeId,
        courseId: course._id,
        title: a.title,
        description: a.desc,
        dueDate: futureDate(a.due),
        totalMarks: a.marks,
        status: "published",
        createdBy: faculty
      });
      createdAssignments.push({ ...a, assignment });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUBMISSIONS — Mix of submitted/pending/graded
    // ═══════════════════════════════════════════════════════════════════════
    console.log("📥 Creating Submissions...");
    const submissionDocs: any[] = [];
    for (const aData of createdAssignments) {
      const { assignment } = aData;
      // ~60-80% of students submit
      for (let i = 0; i < studentUsers.length; i++) {
        const submitChance = seededRandom(i * 100 + parseInt(assignment._id.toString().slice(-4), 16));
        if (submitChance > 0.7) continue; // ~30% haven't submitted

        const isLate = seededRandom(i * 200 + 7) > 0.85; // ~15% late
        const isGraded = seededRandom(i * 300 + 11) < 0.5; // ~50% graded
        const marks = isGraded ? Math.round(assignment.totalMarks * (0.4 + seededRandom(i * 400 + 13) * 0.55)) : undefined;

        submissionDocs.push({
          collegeId,
          assignmentId: assignment._id,
          studentId: studentUsers[i]._id,
          files: [],
          notes: isGraded ? "Submitted work" : "Pending review",
          submittedAt: isLate ? futureDate(assignment.dueDate > new Date() ? 1 : -1) : pastDate(Math.floor(seededRandom(i) * 5) + 1),
          version: 1,
          submissionHistory: [],
          marks,
          feedback: isGraded ? (marks! >= assignment.totalMarks * 0.8 ? "Excellent work!" : marks! >= assignment.totalMarks * 0.6 ? "Good effort. Some improvements needed." : "Needs significant improvement. Please review the concepts.") : undefined,
          status: isGraded ? "graded" : (isLate ? "late" : "submitted")
        });
      }
    }
    if (submissionDocs.length > 0) {
      await Submission.insertMany(submissionDocs, { ordered: false });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ATTENDANCE — Last 30 days, realistic variation
    // ═══════════════════════════════════════════════════════════════════════
    console.log("📊 Creating Attendance Records (30 days)...");

    // Map day-of-week to the courses that occur on that day (from timetable)
    const dayToCourses: Record<number, string[]> = {
      1: ["EVS", "STA", "GT", "SL", "DSP"],     // Monday
      2: ["STA", "ESD", "GT", "DSP", "EVS", "SL", "CEP III"],  // Tuesday
      3: ["ESD", "EVS", "GT", "DSP", "SL"],      // Wednesday
      4: ["ESD", "SL", "STA", "CEP III"],         // Thursday
      5: ["EVS", "GT", "STA", "ESD"],             // Friday
    };

    // Students with intentionally lower attendance (below 75%)
    const lowAttendanceStudentIndices = [4, 12, 19, 23, 33, 45, 54]; // ~7 students
    // Students with very low attendance (below 60%)
    const veryLowAttendanceIndices = [19, 45];

    const attendanceDocs: any[] = [];
    for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
      const date = pastDate(dayOffset);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip Sun/Sat

      const dayCourseShortCodes = dayToCourses[dayOfWeek] || [];
      if (dayCourseShortCodes.length === 0) continue;

      // Pick 3-4 courses for attendance each day (realistic — not all periods have roll call)
      const sampled = dayCourseShortCodes.slice(0, Math.min(4, dayCourseShortCodes.length));

      for (const sc of sampled) {
        const course = courseMap[sc];
        if (!course) continue;
        const faculty = getFacultyForCourse(sc);

        for (let si = 0; si < studentUsers.length; si++) {
          // Determine attendance status with realistic variation
          let status: "present" | "absent" | "od" = "present";
          const rng = seededRandom(dayOffset * 1000 + si * 50 + sc.charCodeAt(0));

          if (veryLowAttendanceIndices.includes(si)) {
            // Very low attendance: ~45% present
            status = rng < 0.45 ? "present" : (rng < 0.92 ? "absent" : "od");
          } else if (lowAttendanceStudentIndices.includes(si)) {
            // Low attendance: ~65% present
            status = rng < 0.65 ? "present" : (rng < 0.95 ? "absent" : "od");
          } else {
            // Normal: ~88% present, ~9% absent, ~3% OD
            status = rng < 0.88 ? "present" : (rng < 0.97 ? "absent" : "od");
          }

          attendanceDocs.push({
            studentId: studentUsers[si]._id,
            courseId: course._id,
            batchId: batch._id,
            facultyId: faculty,
            collegeId,
            date: date.toISOString().split("T")[0],
            sessionType: course.courseType === "lab" ? "lab" : "lecture",
            status
          });
        }
      }
    }
    if (attendanceDocs.length > 0) {
      await Attendance.insertMany(attendanceDocs, { ordered: false });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GRADES — Internal assessment marks
    // ═══════════════════════════════════════════════════════════════════════
    console.log("📈 Creating Internal Assessment Marks...");

    const gradeDocs: any[] = [];
    const theoryCourses = ["GT", "EVS", "SL", "STA", "DSP", "ESD"];
    for (const sc of theoryCourses) {
      const course = courseMap[sc];
      if (!course) continue;
      const faculty = getFacultyForCourse(sc);

      for (let si = 0; si < studentUsers.length; si++) {
        // Internal Test 1
        const it1Marks = Math.round(10 + seededRandom(si * 7 + sc.charCodeAt(0)) * 15); // 10-25
        gradeDocs.push({
          collegeId,
          studentId: studentUsers[si]._id,
          courseId: course._id,
          type: "internal",
          title: "Internal Test 1",
          marksObtained: it1Marks,
          maxMarks: 25,
          weightage: 15,
          gradedBy: faculty
        });

        // Internal Test 2 (slightly different distribution)
        const it2Marks = Math.round(8 + seededRandom(si * 11 + sc.charCodeAt(1)) * 17); // 8-25
        gradeDocs.push({
          collegeId,
          studentId: studentUsers[si]._id,
          courseId: course._id,
          type: "internal",
          title: "Internal Test 2",
          marksObtained: it2Marks,
          maxMarks: 25,
          weightage: 15,
          gradedBy: faculty
        });
      }
    }
    if (gradeDocs.length > 0) {
      await Grade.insertMany(gradeDocs, { ordered: false });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXAMS — Upcoming end semester examinations
    // ═══════════════════════════════════════════════════════════════════════
    console.log("🎓 Creating Exam Schedule...");

    const examCourses = ["GT", "EVS", "SL", "STA", "DSP", "ESD"];
    for (let i = 0; i < examCourses.length; i++) {
      const course = courseMap[examCourses[i]];
      if (!course) continue;
      await Exam.create({
        collegeId,
        courseId: course._id,
        title: `${course.name} — End Semester Examination`,
        type: "final",
        date: futureDate(45 + i * 2).toISOString().split("T")[0],
        startTime: "09:30",
        endTime: "12:30",
        room: `Exam Hall ${i + 1}`,
        facultyId: getFacultyForCourse(examCourses[i]),
        totalMarks: 100,
        status: "scheduled"
      });
    }

    // Lab practical exams
    const labExams = ["DSP LAB", "ESD LAB", "SL LAB"];
    for (let i = 0; i < labExams.length; i++) {
      const course = courseMap[labExams[i]];
      if (!course) continue;
      await Exam.create({
        collegeId,
        courseId: course._id,
        title: `${course.name} — Practical Examination`,
        type: "practical",
        date: futureDate(40 + i * 2).toISOString().split("T")[0],
        startTime: "09:00",
        endTime: "13:00",
        room: course.courseType === "lab" ? "Lab" : `Exam Hall ${i + 7}`,
        facultyId: getFacultyForCourse(labExams[i]),
        totalMarks: 50,
        status: "scheduled"
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ANNOUNCEMENTS — Realistic academic notices
    // ═══════════════════════════════════════════════════════════════════════
    console.log("📢 Creating Announcements...");

    await Announcement.create([
      {
        title: "End Semester Exam Schedule Released",
        body: "The end semester examination schedule for Semester V has been released. Students are advised to check the exam section for detailed dates, timings, and hall allocations. Hall tickets will be available from the department office one week before the exams.",
        type: "notice", priority: "normal",
        authorId: hodUser._id, collegeId,
        departmentId: eceDept._id,
        audience: "department"
      },
      {
        title: "Internal Test 2 — Schedule Reminder",
        body: "Internal Test 2 for all Semester V subjects will be conducted in the 3rd week of September 2026. Syllabus coverage for each subject has been shared by the respective faculty members. Students are advised to prepare accordingly.",
        type: "reminder", priority: "normal",
        authorId: hodUser._id, collegeId,
        departmentId: eceDept._id,
        audience: "department"
      },
      {
        title: "DSP Lab — Equipment Maintenance Notice",
        body: "Due to equipment maintenance in ECE Lab, DSP Lab sessions for Batch A will be held in Communication Lab for the next two weeks. Timings remain unchanged. Students should bring their lab records.",
        type: "reminder", priority: "normal",
        authorId: eswari._id, collegeId,
        departmentId: eceDept._id,
        courseId: courseMap["DSP LAB"]._id,
        audience: "course"
      },
      {
        title: "Guest Lecture: FPGA Design Methodology",
        body: "A guest lecture on 'Modern FPGA Design Methodology using Python and Tcl' will be conducted by Dr. S. Ramachandran from Intel on Friday, 3 PM in the EE-VDT Seminar Hall. All III EE-VDT students are encouraged to attend.",
        type: "general", priority: "normal",
        authorId: hodUser._id, collegeId,
        departmentId: eceDept._id,
        audience: "department"
      },
      {
        title: "Graph Theory — Extra Problem Session",
        body: "An extra problem-solving session on Graph Coloring and Planar Graphs will be conducted this Saturday from 10 AM to 12 PM in Room 101. Attendance is optional but highly recommended for students who need additional practice.",
        type: "general", priority: "normal",
        authorId: beryl._id, collegeId,
        departmentId: eceDept._id,
        courseId: courseMap["GT"]._id,
        audience: "course"
      },
      {
        title: "Embedded System Design Lab — Project Submission",
        body: "The ESD Lab mini-project submission deadline is extended by one week. Teams should submit their project reports along with working prototypes. Viva voce will be conducted during the following lab session.",
        type: "notice", priority: "normal",
        authorId: boopathy._id, collegeId,
        departmentId: eceDept._id,
        courseId: courseMap["ESD LAB"]._id,
        audience: "course"
      },
      {
        title: "Attendance Below 75% — Warning",
        body: "Students whose attendance is below 75% in any subject are requested to meet the respective faculty and HOD immediately. Continued absence may result in being debarred from end semester examinations as per university regulations.",
        type: "notice", priority: "normal",
        authorId: hodUser._id, collegeId,
        departmentId: eceDept._id,
        audience: "department"
      },
    ]);

    // ═══════════════════════════════════════════════════════════════════════
    // CALENDAR EVENTS
    // ═══════════════════════════════════════════════════════════════════════
    console.log("📆 Creating Calendar Events...");

    await CalendarEvent.create([
      {
        collegeId, title: "Independence Day — Holiday",
        type: "holiday", startDate: new Date("2026-08-15"),
        audience: "global"
      },
      {
        collegeId, title: "Internal Test 2 Week",
        type: "exam", startDate: new Date("2026-09-14"), endDate: new Date("2026-09-18"),
        audience: "department", audienceId: eceDept._id
      },
      {
        collegeId, title: "EE-VDT Department Day",
        description: "Annual department celebrations with technical events, project exhibitions, and cultural activities.",
        type: "event", startDate: new Date("2026-09-25"),
        audience: "department", audienceId: eceDept._id
      },
      {
        collegeId, title: "End Semester Examinations Begin",
        type: "exam", startDate: futureDate(45), endDate: futureDate(60),
        audience: "global"
      },
      {
        collegeId, title: "Gandhi Jayanti — Holiday",
        type: "holiday", startDate: new Date("2026-10-02"),
        audience: "global"
      },
      {
        collegeId, title: "Lab Practical Examinations",
        type: "exam", startDate: futureDate(40), endDate: futureDate(44),
        audience: "department", audienceId: eceDept._id
      },
      {
        collegeId, title: "CEP III Mock Interview Round",
        description: "Mock interview sessions for Career Enhancement Program III.",
        type: "event", startDate: futureDate(25),
        audience: "department", audienceId: eceDept._id
      },
    ]);

    // ═══════════════════════════════════════════════════════════════════════
    // NOTIFICATIONS — Generated from academic events
    // ═══════════════════════════════════════════════════════════════════════
    console.log("🔔 Creating Notifications...");

    // Notifications for all students
    const notifTemplates = [
      { title: "Exam Schedule Published", message: "End semester examination schedule for Semester V is now available. Check the exam section.", type: "exam" as const },
      { title: "New Assignment: DFT Implementation Report", message: "New assignment posted for Digital Signal Processing. Due in 8 days.", type: "assignment" as const },
      { title: "Graph Theory Extra Session", message: "Extra problem-solving session on Saturday 10 AM in Room 101.", type: "announcement" as const },
    ];

    // Batch insert notifications (more efficient)
    const notifDocs: any[] = [];
    for (const student of studentUsers) {
      for (const tmpl of notifTemplates) {
        notifDocs.push({
          collegeId,
          userId: student._id,
          title: tmpl.title,
          message: tmpl.message,
          type: tmpl.type,
          isRead: seededRandom(notifDocs.length) > 0.6 // ~40% read
        });
      }
    }

    // Add targeted notifications for low-attendance students
    for (const idx of lowAttendanceStudentIndices) {
      if (idx < studentUsers.length) {
        notifDocs.push({
          collegeId,
          userId: studentUsers[idx]._id,
          title: "Attendance Alert",
          message: "Your attendance in one or more subjects is below 75%. Please attend classes regularly to avoid being debarred.",
          type: "attendance" as const,
          isRead: false
        });
      }
    }

    // Notify HOD about department events
    notifDocs.push({
      collegeId,
      userId: hodUser._id,
      title: "Department Analytics Updated",
      message: "New attendance and grade data available. 7 students flagged for low attendance.",
      type: "system" as const,
      isRead: false
    });

    await Notification.insertMany(notifDocs);

    // ═══════════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n✅ EE-VDT Department OS seeding completed! (III EE-VDT 2026-27)");
    console.log("─────────────────────────────────────────");
    console.log("📧 Login Credentials:");
    console.log("   Admin:           admin@ece.edu             / Password123!");
    console.log("   HOD:             dhilipkumar@ece.edu       / Password123!");
    console.log("   Faculty (Beryl): beryl@ece.edu             / Password123!");
    console.log("   Faculty (Jasanthi): jasanthi@ece.edu       / Password123!");
    console.log("   Faculty (Prema): prema@ece.edu             / Password123!");
    console.log("   Faculty (Hemalatha): hemalatha@ece.edu     / Password123!");
    console.log("   Faculty (Boopathy): boopathy@ece.edu       / Password123!");
    console.log("   Faculty (Eswari): eswari@ece.edu           / Password123!");
    console.log("   Faculty (Padmani): padmani@ece.edu         / Password123!");
    console.log("   Faculty (Manoj): manojkumar@ece.edu        / Password123!");
    console.log("   Students:        {rollNumber}@ece.edu      / Password123!");
    console.log("   Example Student: 714024169011@ece.edu      / Password123!");
    console.log("─────────────────────────────────────────");
    console.log("📊 Created:");
    console.log("   1 Department (EE-VDT), 8 Semesters, 1 Batch (III EE-VDT)");
    console.log(`   11 Courses, ${timetableEntries.length} Timetable Entries`);
    console.log(`   4 Labs, 10 Faculty/Staff (incl. HOD)`);
    console.log(`   56 Students (54 Regular + 2 Lateral Entry)`);
    console.log(`   ${createdAssignments.length} Assignments`);
    console.log(`   ${courses.length * studentUsers.length} Subject Workspaces`);
    console.log("   Attendance Records (30 days × subjects × 56 students)");
    console.log("   Internal Marks (IT1 + IT2 × 6 theory courses × 56 students)");
    console.log(`   ${examCourses.length + labExams.length} Exams Scheduled`);
    console.log("   7 Announcements, 7 Calendar Events");
    console.log(`   ${notifDocs.length} Notifications`);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

if (process.argv[1] && (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed.js"))) {
  (async () => {
    await connectDatabase();
    await seedDatabase();
    await disconnectDatabase();
  })();
}

const bcrypt = require("bcryptjs");
const QRCode = require('qrcode');

const Admin = require("./models/Admin");
const Attendance = require("./models/Attendance");
const Student = require("./models/Student");
const Courses = require("./models/Courses");
const Classes = require("./models/Classes");

const CLASS_DURATION = 10*60*1000;   // 10 Minutes
// const QR_VALID = 50*60*1000;    // 50 Minutes

exports.landing_page = (req, res) => {
  res.render("home");
};

// Admin Login:
exports.adminLoginPost = async (req, res) => {
  const { Id, password } = req.body;
  const admin = await Admin.findOne({ Id });

  if (!admin) {
    req.session.error = "Invalid Credentials";
    return res.redirect("/");
  };

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    req.session.error = "Invalid Credentials";
    return res.redirect("/");
  }

  // req.session.isAuth = true;
  req.session.Id = admin.Id;
  req.session.program = admin.program;
  req.session.isAdmin = true;

  res.redirect("/admin-panel");

};

exports.adminLoginGet = async (req, res) => {
  const id = req.session.Id;
  const program = req.session.program;

  const coursesList = await Courses.find({ program }, { _id: 0 });

  res.render("adminPanel", { Id: id, program: program, coursesList });
};

// Generate and Save QR:
exports.qrCodePost = (req, res) => {
  const { course_id, section } = req.body;
  const program = req.session.program;
  req.session.course_id = course_id;
  req.session.section = section;

  const timeStamp = Date.now();
  const text = `http://localhost:5000/updating?course_id=${course_id}&section=${section}&program=${program}&time=${timeStamp}`;

  // Generate QR code
  QRCode.toDataURL(text, (err, url) => {
    if (err) {
      res.status(500).send('Internal Server Error');
    } else {

      res.render("qrcode", { qrurl: url, course_id, section, program });
    }
  });
};

exports.saveQR = async (req, res) => {
  try {
    const course_id = req.session.course_id;
    const program = req.session.program;
    const section = req.session.section;

    let currentClass = new Classes({
      program,
      course_id,
      section,
    });

    await currentClass.save();
    res.status(200).send('Class marked successfully.');
  } catch (error) {
    console.error('Error saving class:', error);
    res.status(500).send('Internal Server Error');
  }
};

// REgister Account:
exports.register_get = (req, res) => {
  const error = req.session.error;
  delete req.session.error;
  res.render("register", { err: error });
};

exports.register_post = async (req, res) => {

  if (req.body.userType === "admin") {
    const { program, Id, password } = req.body;

    let admin = await Admin.findOne({ Id });

    if (admin) {
      req.session.error = "User already exists";
      return res.redirect("/register");
    }

    const hasdPsw = await bcrypt.hash(password, 12);

    try {
      admin = new Admin({
        program,
        Id,
        password: hasdPsw,

      });

      await admin.save();
    } catch (error) {
      res.send(error)
    }
  }

  if (req.body.userType === "student") {
    const { program, name, section, admissionNumber, password } = req.body;
    // console.log(req.body)

    let student = await Student.findOne({ admissionNumber });

    if (student) {
      req.session.error = "User already exists";
      return res.redirect("/register");
    }

    const hasdPsw = await bcrypt.hash(password, 12);

    try {
      student = new Student({
        program,
        name,
        AdmissionNo: admissionNumber,
        password: hasdPsw,
        section
      });

      await student.save();
    } catch (error) {
      res.send(error)
    }
  }


  res.redirect("/");
};


// Login STUDENT ACCOUNT:
exports.student_post = async (req, res) => {
  const { admissionNo, password } = req.body;
  delete req.session.error;
  let student = await Student.findOne({ AdmissionNo: admissionNo });

  if (!student) {
    req.session.error = "Student not registered!"
    return res.redirect("/")
  };

  const isMatch = await bcrypt.compare(password, student.password);

  if (!isMatch) {
    req.session.error = "Invalid credential!";
    return res.redirect("/")
  };

  req.session.isStudent = true;
  req.session.profile = {
    admissionNo,
    name: student.name,
    program: student.program,
    section: student.section,
  };

  res.redirect("/studentDashboard");
};

exports.student_get = async (req, res) => {
  const profile = req.session.profile;

  let courses = await Courses.find({ program: profile.program }, { _id: 0 });
  let attendance = {};
  let totalClasses = {};
  for (let course of courses) {
    let courseId = course.courseId;
    let count = await Attendance.count({ AdmissionNo: profile.admissionNo, course_id: courseId });
    attendance[courseId] = count
    let classCount = await Classes.count({ program: profile.program, section: profile.section, course_id: courseId });
    totalClasses[courseId] = classCount;
  }

  res.render("student_dashboard", { profile, courses, attendance, totalClasses });
};

// Update Attendance:
exports.update = async (req, res) => {
  const admissionNo = req.session.profile.admissionNo;
  const userSection = req.session.profile.section;
  const userProgram = req.session.profile.program;
  const { course_id, section, program ,timeStamp} = req.query;

  if (userProgram !== program) {
    req.session.error = "QR is not for your program!";
    res.redirect("/studentDashboard")
  };

  if (userSection !== section) {
    req.session.error = "Section doesn't match!";
    res.redirect("/studentDashboard")
  };

  let totalClasses = await Classes.count({ program, section, course_id });
  let count = await Attendance.count({ AdmissionNo: admissionNo, course_id, program });

  let recentRecord = await Attendance.findOne({ AdmissionNo: admissionNo }, { date: 1, _id: 0 }).sort({ date: -1 });
  let recentRecDate = recentRecord.date;
  let currentDate = new Date();
  let currentTime = currentDate.getTime();
  

  if (totalClasses <= count) {
    req.session.error = "Attendance Overloaded!";
    res.redirect("/studentDashboard")

  } else if (currentDate - recentRecDate < CLASS_DURATION || currentTime - timeStamp > CLASS_DURATION) {
    req.session.error = "QR INVALID!.";
    res.redirect("/studentDashboard")

  } else {

    let attendance = new Attendance({
      AdmissionNo: admissionNo,
      program,
      course_id,
      section,
      isPresent: true
    })

    await attendance.save();
    delete req.session.error;
    res.redirect("/studentDashboard")
  }

};

// View Attendance:
exports.viewAttendance = async (req, res) => {
  const { course_id, section } = req.query;
  const program = req.session.program;

  let records = await Attendance.aggregate([
    { $match: { course_id, section } },
    {
      $group: {
        _id: "$AdmissionNo",
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        AdmissionNo: "$_id",
        count: 1
      }
    }
  ]);

  let totalClasses = await Classes.count({ program, section, course_id });

  res.render("attendanceRecords", { records, course_id, section, totalClasses });
};

exports.logOut = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err)
    }
  })

  res.redirect("/");
};







// index.js
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Nodemailer

// Configure Nodemailer for Gmail + Render
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === "true", // true for SSL (465)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Optional: Verify connection (to catch errors early)
transporter.verify((error, success) => {
  if (error) {
    console.error("Email server connection failed:", error);
  } else {
    console.log("Email transporter ready to send messages");
  }
});




// Optional: Verify connection (to catch errors early)
transporter.verify((error, success) => {
  if (error) {
    console.error(' Email server connection failed:', error);
  } else {
    console.log(' Email transporter ready to send messages');
  }
});


// ===== Notification helpers =====
async function sendAttendanceStatusEmail(toEmail, studentName, subjectTitle, sessionDate, status, currentPercentage, oneMissRisk=false) {
  try {
    const subject = `Attendance Update: ${subjectTitle} — ${status}`;
    let text = `Hi ${studentName},\n\n` +
               `Your attendance for "${subjectTitle}" on ${sessionDate} was recorded as: ${status}.\n\n` +
               `Current attendance in ${subjectTitle}: ${currentPercentage}%.\n`;

    if (oneMissRisk) {
      text += `\n Notice: Missing one more lecture will drop you below 75% in this subject. Please try to attend upcoming classes.\n`;
    }

    text += `\n— SAMS Notification`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject,
      text
    });

    console.log(` Sent attendance-status email to ${toEmail} (${studentName}) - ${subjectTitle} - ${status}`);
  } catch (err) {
    console.error(` Failed to send status email to ${toEmail}:`, err.message || err);
  }
}

async function sendMonthlyAlertEmail(toEmail, studentName, subjectTitle, percentage, note='') {
  try {
    const subject = `Monthly Attendance Alert: ${subjectTitle} — ${percentage}%`;
    let text = `Hi ${studentName},\n\n` +
               `Your monthly attendance in "${subjectTitle}" is ${percentage}%.\n` +
               `Minimum required: 75%.\n\n`;

    if (note) text += note + '\n\n';

    text += `Please contact the teacher if you have queries.\n\n— SAMS Support`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject,
      text
    });

    console.log(` Sent monthly alert to ${toEmail} (${studentName}) - ${subjectTitle} - ${percentage}%`);
  } catch (err) {
    console.error(` Failed to send monthly alert to ${toEmail}:`, err.message || err);
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//  PostgreSQL connection pool (works locally + Render)
const connectionString = process.env.DATABASE_URL;

let poolConfig;
if (connectionString) {
  // When deploying on Render
  poolConfig = {
    connectionString,
    ssl: { rejectUnauthorized: false }
  };
} else {
  // When running locally
  poolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'sams_db',
    password: process.env.DB_PASSWORD || '12345',
    port: process.env.DB_PORT || 5432,
  };
}

const pool = new Pool(poolConfig);


// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Database connection error:', err);
  else console.log(' Database connected successfully');
});


// Middleware - Authentication & Authorization

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.query.token;
  const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader);
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const authorizeRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role_name)) return res.status(403).json({ error: 'Access denied' });
  next();
};

// TEMPORARY OTP STORE (email -> otp info)

// Helpers
async function getTeacherIdByUserId(user_id) {
  const result = await pool.query('SELECT teacher_id FROM teachers WHERE user_id = $1', [user_id]);
  return result.rows[0] ? result.rows[0].teacher_id : null;
}
async function getStudentIdByUserId(user_id) {
  const result = await pool.query('SELECT student_id FROM students WHERE user_id = $1', [user_id]);
  return result.rows[0] ? result.rows[0].student_id : null;
}

// Public Routes

app.get('/', (req, res) => res.render('index'));
app.get('/admin', (req, res) => res.render('admin-auth'));
app.get('/teacher', (req, res) => res.render('teacher-auth'));
app.get('/student', (req, res) => res.render('student-auth'));
app.get('/admin/portal', (req, res) => res.render('admin-portal'));
app.get('/student/portal', (req, res) => res.render('student-portal'));



// Admin Registration
/*app.post('/api/admin/register', async (req, res) => {
  const { username, password, name } = req.body;
  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    if (userCheck.rows.length > 0) return res.status(400).json({ error: 'Username already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const role = await pool.query('SELECT role_id FROM roles WHERE role_name=$1', ['Admin']);
    const roleId = role.rows[0].role_id;

    const user = await pool.query(
      'INSERT INTO users (username, password, role_id) VALUES ($1, $2, $3) RETURNING user_id',
      [username, hashed, roleId]
    );
    res.status(201).json({ message: 'Admin registered successfully', user_id: user.rows[0].user_id });
  } catch (err) {
    console.error('Admin register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});
*/

// Login
app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;
  console.log("🟢 Login attempt:", username, password, role);

  try {
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.password, r.role_name, r.role_id
       FROM users u JOIN roles r ON u.role_id=r.role_id
       WHERE LOWER(u.username)=LOWER($1) AND LOWER(r.role_name)=LOWER($2)`,
      [username, role]
    );
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, role_name: user.role_name, role_id: user.role_id },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ message: 'Login successful', token, user: { user_id: user.user_id, username: user.username, role: user.role_name } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});


//  FORGOT PASSWORD (Teacher + Student)

const otpStore = {}; // Temporary OTP storage

// Send OTP
app.post('/api/forgot-password', async (req, res) => {
  const { email, role } = req.body;
  try {
    if (!email || !role) return res.status(400).json({ error: 'Email and role are required' });

    // Check if user exists for that role
    const userRes = await pool.query(`
      SELECT u.user_id, u.username, u.email, r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE LOWER(u.email)=LOWER($1) AND LOWER(r.role_name)=LOWER($2)
    `, [email, role]);

    if (!userRes.rows.length) {
      return res.status(404).json({ error: 'No user found with this email and role' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `SAMS Password Reset OTP`,
      text: `Hello ${role},\n\nYour OTP for password reset is: ${otp}\nIt expires in 5 minutes.\n\n- SAMS Support`
    });

    console.log(` OTP for ${email}: ${otp}`);
    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error(' Forgot Password Error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP & Reset Password
app.post('/api/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const record = otpStore[email];
    if (!record) return res.status(400).json({ error: 'No OTP request found' });
    if (Date.now() > record.expires) return res.status(400).json({ error: 'OTP expired' });
    if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password=$1 WHERE LOWER(email)=LOWER($2)', [hashed, email]);

    delete otpStore[email];
    res.json({ message: 'Password reset successful!' });
  } catch (err) {
    console.error(' Reset Password Error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// =====================
// Admin Dashboard Routes
// =====================
app.get('/api/admin/stats', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const counts = await Promise.all([
      pool.query('SELECT COUNT(*) FROM students'),
      pool.query('SELECT COUNT(*) FROM teachers'),
      pool.query('SELECT COUNT(*) FROM classes'),
      pool.query('SELECT COUNT(*) FROM subjects'),
    ]);
    res.json({
      students: +counts[0].rows[0].count,
      teachers: +counts[1].rows[0].count,
      classes: +counts[2].rows[0].count,
      subjects: +counts[3].rows[0].count,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// CRUD - Teachers

app.post('/api/admin/teachers', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const { username, password, name, department, email } = req.body;
  try {
    const exists = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    if (exists.rows.length) return res.status(400).json({ error: 'Username already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const role = await pool.query('SELECT role_id FROM roles WHERE role_name=$1', ['Teacher']);
    const roleId = role.rows[0].role_id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const user = await client.query(
        'INSERT INTO users (username, password, role_id, email) VALUES ($1,$2,$3,$4) RETURNING user_id',
        [username, hashed, roleId, email]
      );
      await client.query(
        'INSERT INTO teachers (user_id, name, department, email) VALUES ($1,$2,$3,$4)',
        [user.rows[0].user_id, name, department, email]
      );
      await client.query('COMMIT');
      res.status(201).json({ message: 'Teacher registered successfully' });
    } catch (e) {
      await client.query('ROLLBACK'); throw e;
    } finally { client.release(); }
  } catch (err) {
    console.error('Teacher register error:', err);
    res.status(500).json({ error: 'Failed to register teacher' });
  }
});

app.get('/api/admin/teachers', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT t.teacher_id, t.name, t.department, t.email, u.username
      FROM teachers t JOIN users u ON t.user_id=u.user_id ORDER BY t.name
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch teachers' }); }
});

app.get('/api/admin/teachers/:teacher_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.teacher_id;
  try {
    const r = await pool.query(`
      SELECT t.teacher_id, t.name, t.department, t.email, u.username
      FROM teachers t JOIN users u ON t.user_id=u.user_id WHERE t.teacher_id=$1
    `, [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Teacher not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch teacher' }); }
});

app.put('/api/admin/teachers/:teacher_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.teacher_id;
  const { name, department, email } = req.body;
  try {
    await pool.query('UPDATE teachers SET name=$1, department=$2, email=$3 WHERE teacher_id=$4', [name, department, email, id]);
    res.json({ message: 'Teacher updated successfully' });
  } catch (err) { res.status(500).json({ error: 'Failed to update teacher' }); }
});

app.delete('/api/admin/teachers/:teacher_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.teacher_id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get linked user_id
    const teacherRes = await client.query('SELECT user_id FROM teachers WHERE teacher_id=$1', [id]);
    if (!teacherRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Teacher not found' });
    }
    const user_id = teacherRes.rows[0].user_id;

    // Delete dependent timetable entries
    await client.query(`
      DELETE FROM timetable
      WHERE ts_id IN (SELECT ts_id FROM teachersubject WHERE teacher_id=$1)
    `, [id]);

    // Delete from teachersubject
    await client.query('DELETE FROM teachersubject WHERE teacher_id=$1', [id]);

    // Delete teacher
    await client.query('DELETE FROM teachers WHERE teacher_id=$1', [id]);

    // Delete from users
    await client.query('DELETE FROM users WHERE user_id=$1', [user_id]);

    await client.query('COMMIT');
    res.json({ message: 'Teacher deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(' Teacher delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete teacher (check dependencies)' });
  } finally {
    client.release();
  }
});






// CRUD - Students

app.post('/api/admin/students', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  console.log(" Incoming request to /api/admin/students");
  console.log("Request body:", req.body);

  const { name, roll_no, batch, dept, email, class_id } = req.body;
  try {
    console.log(" Step 1: Checking roll number...");
    const checkR = await pool.query('SELECT * FROM students WHERE roll_no=$1', [roll_no]);
    if (checkR.rows.length) return res.status(400).json({ error: 'Roll number already exists' });

    // Auto-generate username & password
    const username = roll_no.toLowerCase();
    const password = 'student@123';
    const hashed = await bcrypt.hash(password, 10);

    console.log(" Step 2: Fetching Student role_id...");
    const role = await pool.query('SELECT role_id FROM roles WHERE role_name=$1', ['Student']);
    if (role.rows.length === 0) {
      console.error(" 'Student' role not found in roles table");
      return res.status(500).json({ error: "Role 'Student' not found. Please insert roles into DB." });
    }
    const roleId = role.rows[0].role_id;

    const client = await pool.connect();
    try {
      console.log(" Step 3: Starting transaction...");
      await client.query('BEGIN');

      console.log(" Step 4: Creating user entry...");
      const u = await client.query(
        'INSERT INTO users (username, password, role_id, email) VALUES ($1,$2,$3,$4) RETURNING user_id',
        [username, hashed, roleId, email]
      );
      const userId = u.rows[0].user_id;
      console.log(" User created:", userId);

      console.log(" Step 5: Inserting into students...");
      await client.query(
        'INSERT INTO students (user_id, name, roll_no, batch, email, dept, class_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [userId, name, roll_no, batch, email, dept, class_id]
      );
      console.log(" Student inserted successfully.");

      

      await client.query('COMMIT');
      console.log(" Transaction committed successfully.");

      res.status(201).json({
        message: `Student registered successfully! Username: ${username}, Password: ${password}`
      });
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(" Transaction error:", e.message);
      console.error(e.stack);
      res.status(500).json({ error: e.message || 'Transaction failed' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(' Outer Student register error:', err.message);
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Failed to register student' });
  }
});



app.get('/api/admin/students', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT s.student_id, s.name, s.roll_no, s.batch, s.dept, s.email, u.username,
       c.name AS class_name, s.class_id
FROM students s
JOIN users u ON s.user_id=u.user_id
LEFT JOIN classes c ON s.class_id=c.class_id
ORDER BY s.roll_no;
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch students' }); }
});

app.get('/api/admin/students/:student_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.student_id;
  try {
    const r = await pool.query(`
      SELECT s.student_id, s.name, s.roll_no, s.batch, s.dept, s.email, u.username
      FROM students s JOIN users u ON s.user_id=u.user_id WHERE s.student_id=$1
    `, [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Student not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch student' }); }
});

//  FIXED — Update Student (no enrollment logic)
app.put('/api/admin/students/:student_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.student_id;
  const { name, roll_no, batch, dept, email, class_id } = req.body;

  try {
    console.log("🛠 Updating student:", id, name, roll_no, batch, dept, email, class_id);

    const result = await pool.query(
      'UPDATE students SET name=$1, roll_no=$2, batch=$3, dept=$4, email=$5, class_id=$6 WHERE student_id=$7 RETURNING *',
      [name, roll_no, batch, dept, email, class_id, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    console.log(" Student updated successfully!");
    res.json({ message: 'Student updated successfully', student: result.rows[0] });
  } catch (err) {
    console.error(' Error updating student:', err.message);
    res.status(500).json({ error: 'Failed to update student' });
  }
});


app.delete('/api/admin/students/:student_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.student_id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get linked user_id
    const studentRes = await client.query('SELECT user_id FROM students WHERE student_id=$1', [id]);
    if (!studentRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Student not found' });
    }
    const user_id = studentRes.rows[0].user_id;

    // Delete from students
    await client.query('DELETE FROM students WHERE student_id=$1', [id]);

    // Delete corresponding user record
    await client.query('DELETE FROM users WHERE user_id=$1', [user_id]);

    await client.query('COMMIT');
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(' Student delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete student (check dependencies)' });
  } finally {
    client.release();
  }
});



// CRUD - Classes

app.post('/api/admin/classes', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const { name, term, section } = req.body;
  try {
    const r = await pool.query('INSERT INTO classes (name,term,section) VALUES ($1,$2,$3) RETURNING *', [name, term, section]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to create class' }); }
});

app.get('/api/admin/classes', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM classes ORDER BY name');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch classes' }); }
});

app.get('/api/admin/classes/:class_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.class_id;
  try {
    const r = await pool.query('SELECT * FROM classes WHERE class_id=$1', [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Class not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch class' }); }
});

app.put('/api/admin/classes/:class_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.class_id;
  const { name, term, section } = req.body;
  try {
    await pool.query('UPDATE classes SET name=$1, term=$2, section=$3 WHERE class_id=$4', [name, term, section, id]);
    res.json({ message: 'Class updated successfully' });
  } catch (err) { res.status(500).json({ error: 'Failed to update class' }); }
});

app.delete('/api/admin/classes/:class_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.class_id;
  try {
    await pool.query('DELETE FROM classes WHERE class_id=$1', [id]);
    res.json({ message: 'Class deleted successfully' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete class' }); }
});


// CRUD - Subjects

app.post('/api/admin/subjects', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const { code, title } = req.body;
  try {
    const r = await pool.query('INSERT INTO subjects (code,title) VALUES ($1,$2) RETURNING *', [code, title]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to create subject' }); }
});

app.get('/api/admin/subjects', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM subjects ORDER BY code');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch subjects' }); }
});

app.get('/api/admin/subjects/:subject_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.subject_id;
  try {
    const r = await pool.query('SELECT * FROM subjects WHERE subject_id=$1', [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Subject not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch subject' }); }
});

app.put('/api/admin/subjects/:subject_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.subject_id;
  const { code, title } = req.body;
  try {
    await pool.query('UPDATE subjects SET code=$1, title=$2 WHERE subject_id=$3', [code, title, id]);
    res.json({ message: 'Subject updated successfully' });
  } catch (err) { res.status(500).json({ error: 'Failed to update subject' }); }
});

app.delete('/api/admin/subjects/:subject_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.subject_id;
  try {
    await pool.query('DELETE FROM subjects WHERE subject_id=$1', [id]);
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete subject' }); }
});


// CLASS–SUBJECT ROUTES

app.post('/api/admin/classsubject', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const { class_id, subject_id } = req.body;
  try {
    const exists = await pool.query('SELECT * FROM classsubject WHERE class_id=$1 AND subject_id=$2', [class_id, subject_id]);
    if (exists.rows.length) return res.status(400).json({ error: 'Class–Subject already exists' });
    const result = await pool.query('INSERT INTO classsubject (class_id, subject_id) VALUES ($1,$2) RETURNING *', [class_id, subject_id]);
    res.status(201).json({ message: 'Class–Subject added successfully', record: result.rows[0] });
  } catch (err) {
    console.error('Class–Subject error:', err);
    res.status(500).json({ error: 'Failed to create Class–Subject' });
  }
});

app.get('/api/admin/classsubject', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cs.cs_id, c.name AS class_name, c.term, c.section, s.title AS subject_title
      FROM classsubject cs
      JOIN classes c ON cs.class_id=c.class_id
      JOIN subjects s ON cs.subject_id=s.subject_id
      ORDER BY cs.cs_id;
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch class-subjects' });
  }
});

app.put('/api/admin/classsubject/:cs_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.cs_id;
  const { class_id, subject_id } = req.body;
  try {
    await pool.query('UPDATE classsubject SET class_id=$1, subject_id=$2 WHERE cs_id=$3', [class_id, subject_id, id]);
    res.json({ message: 'Class–Subject updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update Class–Subject' });
  }
});

app.delete('/api/admin/classsubject/:cs_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.cs_id;
  try {
    await pool.query('DELETE FROM classsubject WHERE cs_id=$1', [id]);
    res.json({ message: 'Class–Subject deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete Class–Subject' });
  }
});


// TEACHER–SUBJECT ROUTES

app.post('/api/admin/teachersubject', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const { teacher_id, cs_id } = req.body;
  try {
    const exists = await pool.query('SELECT * FROM teachersubject WHERE teacher_id=$1 AND cs_id=$2', [teacher_id, cs_id]);
    if (exists.rows.length) return res.status(400).json({ error: 'Teacher already assigned' });
    const result = await pool.query('INSERT INTO teachersubject (teacher_id, cs_id) VALUES ($1,$2) RETURNING *', [teacher_id, cs_id]);
    res.status(201).json({ message: 'Teacher–Subject added successfully', record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add Teacher–Subject' });
  }
});

app.get('/api/admin/teachersubject', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ts.ts_id, t.name AS teacher_name, c.name AS class_name, s.title AS subject_title
      FROM teachersubject ts
      JOIN teachers t ON ts.teacher_id=t.teacher_id
      JOIN classsubject cs ON ts.cs_id=cs.cs_id
      JOIN classes c ON cs.class_id=c.class_id
      JOIN subjects s ON cs.subject_id=s.subject_id;
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Teacher–Subject data' });
  }
});

app.put('/api/admin/teachersubject/:ts_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.ts_id;
  const { teacher_id, cs_id } = req.body;
  try {
    await pool.query('UPDATE teachersubject SET teacher_id=$1, cs_id=$2 WHERE ts_id=$3', [teacher_id, cs_id, id]);
    res.json({ message: 'Teacher–Subject updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update Teacher–Subject' });
  }
});

app.delete('/api/admin/teachersubject/:ts_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.ts_id;
  try {
    await pool.query('DELETE FROM teachersubject WHERE ts_id=$1', [id]);
    res.json({ message: 'Teacher–Subject deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete Teacher–Subject' });
  }
});



//  WEEKLY TIMETABLE ROUTES


// Create timetable entry
app.post('/api/admin/timetable', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const { ts_id, day_of_week, start_time, end_time, mode, topic } = req.body;

  try {
    // Step 1: Get teacher_id and class_id for this ts_id
    const tsRes = await pool.query(`
      SELECT ts.teacher_id, cs.class_id
      FROM teachersubject ts
      JOIN classsubject cs ON ts.cs_id = cs.cs_id
      WHERE ts.ts_id = $1
    `, [ts_id]);

    if (tsRes.rows.length === 0) {
      return res.status(400).json({ error: "Invalid Teacher–Subject assignment" });
    }

    const { teacher_id, class_id } = tsRes.rows[0];

    // Step 2: Check for overlap — teacher or class already busy in this time
    const conflict = await pool.query(`
      SELECT tt.*
      FROM timetable tt
      JOIN teachersubject ts ON tt.ts_id = ts.ts_id
      JOIN classsubject cs ON ts.cs_id = cs.cs_id
      WHERE tt.day_of_week = $1
        AND (
              (ts.teacher_id = $2 OR cs.class_id = $3)
          )
        AND NOT ($4 >= tt.end_time OR $5 <= tt.start_time)
    `, [day_of_week, teacher_id, class_id, start_time, end_time]);

    if (conflict.rows.length > 0) {
      console.log(" Conflict found:", conflict.rows);
      return res.status(400).json({
        error: "Time conflict detected! The teacher or class already has another lecture in this slot.",
      });
    }

    // Step 3: Insert if no conflict
    const result = await pool.query(
      'INSERT INTO timetable (ts_id, day_of_week, start_time, end_time, mode, topic) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [ts_id, day_of_week, start_time, end_time, mode, topic]
    );

    res.status(201).json({ message: 'Timetable entry added successfully', record: result.rows[0] });
  } catch (err) {
    console.error('Timetable creation error:', err);
    res.status(500).json({ error: 'Failed to create timetable entry' });
  }
});


// Fetch all timetable entries
app.get('/api/admin/timetable', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tt.timetable_id, tt.day_of_week, tt.start_time, tt.end_time, tt.mode, tt.topic,
             t.name AS teacher_name, c.name AS class_name, s.title AS subject_title
      FROM timetable tt
      JOIN teachersubject ts ON tt.ts_id=ts.ts_id
      JOIN teachers t ON ts.teacher_id=t.teacher_id
      JOIN classsubject cs ON ts.cs_id=cs.cs_id
      JOIN classes c ON cs.class_id=c.class_id
      JOIN subjects s ON cs.subject_id=s.subject_id
      ORDER BY 
        CASE 
          WHEN tt.day_of_week='Monday' THEN 1
          WHEN tt.day_of_week='Tuesday' THEN 2
          WHEN tt.day_of_week='Wednesday' THEN 3
          WHEN tt.day_of_week='Thursday' THEN 4
          WHEN tt.day_of_week='Friday' THEN 5
          WHEN tt.day_of_week='Saturday' THEN 6
          WHEN tt.day_of_week='Sunday' THEN 7
        END,
        tt.start_time;
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});
// Fetch a single timetable entry by ID
app.get('/api/admin/timetable/:timetable_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.timetable_id;
  try {
    const result = await pool.query(
      `SELECT tt.*, ts.ts_id, t.name AS teacher_name, c.name AS class_name, s.title AS subject_title
       FROM timetable tt
       JOIN teachersubject ts ON tt.ts_id = ts.ts_id
       JOIN teachers t ON ts.teacher_id = t.teacher_id
       JOIN classsubject cs ON ts.cs_id = cs.cs_id
       JOIN classes c ON cs.class_id = c.class_id
       JOIN subjects s ON cs.subject_id = s.subject_id
       WHERE tt.timetable_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Timetable entry not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Timetable fetch by ID error:', err);
    res.status(500).json({ error: 'Failed to fetch timetable entry' });
  }
});

// Update entry
app.put('/api/admin/timetable/:timetable_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.timetable_id;
  const { day_of_week, start_time, end_time, mode, topic } = req.body;
  try {
    await pool.query(
      'UPDATE timetable SET day_of_week=$1, start_time=$2, end_time=$3, mode=$4, topic=$5 WHERE timetable_id=$6',
      [day_of_week, start_time, end_time, mode, topic, id]
    );
    res.json({ message: 'Timetable updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update timetable entry' });
  }
});

// Delete entry
app.delete('/api/admin/timetable/:timetable_id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const id = +req.params.timetable_id;
  try {
    await pool.query('DELETE FROM timetable WHERE timetable_id=$1', [id]);
    res.json({ message: 'Timetable deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete timetable entry' });
  }
});


// TEACHER - CHANGE PASSWORD

app.put('/api/teacher/change-password', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  const { old_password, new_password } = req.body;
  const userId = req.user.user_id;

  try {
    const userRes = await pool.query('SELECT password FROM users WHERE user_id=$1', [userId]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(old_password, userRes.rows[0].password);
    if (!valid) return res.status(400).json({ error: 'Incorrect current password' });

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password=$1 WHERE user_id=$2', [hashed, userId]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});



// TEACHER PORTAL - AUTO SESSION CREATION FLOW


// Step 1: Show only currently valid classes (based on timetable & current time)
app.get('/api/teacher/valid-classes', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const teacherId = await getTeacherIdByUserId(req.user.user_id);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const now = new Date();
    const dayOfWeek = now.toLocaleString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

    const result = await pool.query(`
      SELECT ts.ts_id, c.name AS class_name, s.title AS subject_title, tt.start_time, tt.end_time, tt.mode, tt.topic
      FROM timetable tt
      JOIN teachersubject ts ON tt.ts_id = ts.ts_id
      JOIN classsubject cs ON ts.cs_id = cs.cs_id
      JOIN classes c ON cs.class_id = c.class_id
      JOIN subjects s ON cs.subject_id = s.subject_id
      WHERE ts.teacher_id = $1
        AND tt.day_of_week = $2
        AND $3 BETWEEN tt.start_time AND tt.end_time
    `, [teacherId, dayOfWeek, currentTime]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No active class right now.' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching valid classes:', err);
    res.status(500).json({ error: 'Failed to fetch valid classes' });
  }
});

app.post('/api/teacher/start-session', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  const { ts_id } = req.body;

  try {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(' ')[0]; // HH:MM:SS

    const existing = await pool.query(`
      SELECT session_id FROM session
      WHERE ts_id = $1 AND date = $2
    `, [ts_id, date]);

    if (existing.rows.length > 0) {
      return res.json({ message: 'Session already exists', session_id: existing.rows[0].session_id });
    }

    const newSession = await pool.query(`
      INSERT INTO session (ts_id, date, time, mode, status)
      VALUES ($1, $2, $3, 'Ongoing', 'Active')
      RETURNING session_id
    `, [ts_id, date, time]);

    res.status(201).json({ message: 'Session started', session_id: newSession.rows[0].session_id });
  } catch (err) {
    console.error('Error starting session:', err);
    res.status(500).json({ error: 'Failed to start session' });
  }
});


app.get('/api/teacher/session/:session_id/students', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  const { session_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT st.student_id, st.name, st.roll_no,
             COALESCE(a.status, NULL) AS status, a.attendance_id
      FROM session s
      JOIN teachersubject ts ON s.ts_id = ts.ts_id
      JOIN classsubject cs ON ts.cs_id = cs.cs_id
      JOIN classes c ON cs.class_id = c.class_id
      JOIN students st ON st.class_id = c.class_id
      LEFT JOIN attendance a 
        ON a.student_id = st.student_id AND a.session_id = s.session_id
      WHERE s.session_id = $1
      ORDER BY st.roll_no
    `, [session_id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to fetch students for session' });
  }
});


app.post('/api/teacher/session/:session_id/attendance', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  const { session_id } = req.params;
  const { records } = req.body; // [{ student_id, status: true/false }]

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const r of records) {
      await client.query(`
        INSERT INTO attendance (session_id, student_id, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (session_id, student_id)
        DO UPDATE SET status = EXCLUDED.status, marked_at = CURRENT_TIMESTAMP
      `, [session_id, r.student_id, r.status]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Attendance marked successfully' });

    // --- AFTER COMMIT: send immediate emails (non-blocking for client)
    (async () => {
      try {
        // Get session subject title & date once
        const sessionInfoRes = await pool.query(`
          SELECT s.date, sub.title AS subject_title
          FROM session s
          JOIN teachersubject ts ON s.ts_id = ts.ts_id
          JOIN classsubject cs ON ts.cs_id = cs.cs_id
          JOIN subjects sub ON cs.subject_id = sub.subject_id
          WHERE s.session_id = $1
        `, [session_id]);

        const sessionInfo = sessionInfoRes.rows[0] || {};
        const subjectTitle = sessionInfo.subject_title || 'Unknown Subject';
        const sessionDate = sessionInfo.date 
  ? new Date(sessionInfo.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
  : new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

        for (const r of records) {
          const studentId = r.student_id;
          // Fetch student record (name + email)
          const stuRes = await pool.query('SELECT name, email FROM students WHERE student_id = $1', [studentId]);
          if (!stuRes.rows.length) continue;
          const { name: studentName, email: studentEmail } = stuRes.rows[0];

          // Calculate current attendance percent for this subject
          const attRes = await pool.query(`
            SELECT 
              SUM(CASE WHEN a.status THEN 1 ELSE 0 END) AS present_count,
              COUNT(*) AS total_count
            FROM attendance a
            JOIN session s ON a.session_id = s.session_id
            JOIN teachersubject ts ON s.ts_id = ts.ts_id
            JOIN classsubject cs ON ts.cs_id = cs.cs_id
            JOIN subjects sub ON cs.subject_id = sub.subject_id
            WHERE a.student_id = $1 AND sub.title = $2
          `, [studentId, subjectTitle]);

          const present = +attRes.rows[0].present_count || 0;
          const total = +attRes.rows[0].total_count || 1;
          const percentage = Math.round((present / total) * 100);

          // ONE-MISS RISK: if missing one more lecture will drop below 75%
          const wouldDropIfMissOne = ((present) / (total + 1)) * 100 < 75;

          // Send immediate status email
          const statusText = r.status ? 'Present' : 'Absent';
          await sendAttendanceStatusEmail(studentEmail, studentName, subjectTitle, sessionDate, statusText, percentage, wouldDropIfMissOne);
        }
      } catch (err) {
        console.error('Error sending immediate attendance emails:', err);
      }
    })();

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error marking attendance:', err);
    res.status(500).json({ error: 'Failed to mark attendance' });
  } finally {
    client.release();
  }
});


app.put('/api/teacher/attendance/:attendance_id', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  const { attendance_id } = req.params;
  const { status } = req.body;

  try {
    await pool.query('UPDATE attendance SET status=$1, marked_at=CURRENT_TIMESTAMP WHERE attendance_id=$2', [status, attendance_id]);
    res.json({ message: 'Attendance updated successfully' });
  } catch (err) {
    console.error('Error updating attendance:', err);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

app.get('/teacher/portal', (req, res) => res.render('teacher-portal'));

// TEACHER - MODIFY ATTENDANCE


// Get all past sessions for this teacher
app.get('/api/teacher/sessions', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const teacherId = await getTeacherIdByUserId(req.user.user_id);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const result = await pool.query(`
      SELECT s.session_id, s.date, c.name AS class_name, sub.title AS subject_title
      FROM session s
      JOIN teachersubject ts ON s.ts_id = ts.ts_id
      JOIN classsubject cs ON ts.cs_id = cs.cs_id
      JOIN classes c ON cs.class_id = c.class_id
      JOIN subjects sub ON cs.subject_id = sub.subject_id
      WHERE ts.teacher_id = $1
      ORDER BY s.date DESC;
    `, [teacherId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Fetch sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch past sessions' });
  }
});

// Get attendance for a specific session
app.get('/api/teacher/sessions/:session_id/attendance', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  const sessionId = +req.params.session_id;
  try {
    const result = await pool.query(`
      SELECT a.attendance_id, a.student_id, s.name, s.roll_no, a.status
      FROM attendance a
      JOIN students s ON a.student_id = s.student_id
      WHERE a.session_id = $1
      ORDER BY s.roll_no;
    `, [sessionId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Fetch attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Update attendance status for a specific student
app.put('/api/teacher/attendance/:attendance_id', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  const id = +req.params.attendance_id;
  const { status } = req.body;
  try {
    await pool.query('UPDATE attendance SET status=$1 WHERE attendance_id=$2', [status, id]);
    res.json({ message: 'Attendance updated successfully' });
  } catch (err) {
    console.error('Update attendance error:', err);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});


//  TEACHER - ATTENDANCE STATISTICS

// Get attendance summary per session
app.get('/api/teacher/attendance/stats', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const teacherId = await getTeacherIdByUserId(req.user.user_id);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const result = await pool.query(`
      SELECT 
        s.session_id,
        s.date,
        c.name AS class_name,
        sub.title AS subject_title,
        ROUND(AVG(CASE WHEN a.status THEN 1 ELSE 0 END) * 100, 2) AS attendance_percentage
      FROM session s
      JOIN teachersubject ts ON s.ts_id = ts.ts_id
      JOIN classsubject cs ON ts.cs_id = cs.cs_id
      JOIN classes c ON cs.class_id = c.class_id
      JOIN subjects sub ON cs.subject_id = sub.subject_id
      JOIN attendance a ON s.session_id = a.session_id
      WHERE ts.teacher_id = $1
      GROUP BY s.session_id, s.date, c.name, sub.title
      ORDER BY s.date ASC;
    `, [teacherId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Attendance stats error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance statistics' });
  }
});


// TEACHER - FILTERED ATTENDANCE STATISTICS

// Get all classes & subjects assigned to this teacher
app.get('/api/teacher/assigned', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const teacherId = await getTeacherIdByUserId(req.user.user_id);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const result = await pool.query(`
      SELECT 
        ts.ts_id,
        c.class_id, c.name AS class_name,
        s.subject_id, s.title AS subject_title
      FROM teachersubject ts
      JOIN classsubject cs ON ts.cs_id = cs.cs_id
      JOIN classes c ON cs.class_id = c.class_id
      JOIN subjects s ON cs.subject_id = s.subject_id
      WHERE ts.teacher_id = $1
      ORDER BY c.name;
    `, [teacherId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Teacher assigned fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch assigned classes & subjects' });
  }
});

// Fetch attendance stats for a selected class-subject
app.get('/api/teacher/attendance/stats/:ts_id', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  const ts_id = +req.params.ts_id;
  try {
    const result = await pool.query(`
      SELECT 
        s.session_id,
        s.date,
        ROUND(AVG(CASE WHEN a.status THEN 1 ELSE 0 END) * 100, 2) AS attendance_percentage
      FROM session s
      JOIN attendance a ON s.session_id = a.session_id
      WHERE s.ts_id = $1
      GROUP BY s.session_id, s.date
      ORDER BY s.date ASC;
    `, [ts_id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Filtered attendance stats error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance stats' });
  }
});




//  STUDENT - VIEW TIMETABLE

app.get('/api/student/timetable', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const studentId = await getStudentIdByUserId(req.user.user_id);
    if (!studentId) return res.status(404).json({ error: 'Student not found' });

    // Fetch class_id for this student
    const classRes = await pool.query('SELECT class_id FROM students WHERE student_id=$1', [studentId]);
    if (!classRes.rows.length) return res.status(404).json({ error: 'Class not found' });
    const classId = classRes.rows[0].class_id;

    // Fetch timetable
    const result = await pool.query(`
      SELECT 
        tt.day_of_week, tt.start_time, tt.end_time, tt.mode, tt.topic,
        s.title AS subject_title, t.name AS teacher_name
      FROM timetable tt
      JOIN teachersubject ts ON tt.ts_id = ts.ts_id
      JOIN teachers t ON ts.teacher_id = t.teacher_id
      JOIN classsubject cs ON ts.cs_id = cs.cs_id
      JOIN subjects s ON cs.subject_id = s.subject_id
      WHERE cs.class_id = $1
      ORDER BY 
        CASE 
          WHEN tt.day_of_week='Monday' THEN 1
          WHEN tt.day_of_week='Tuesday' THEN 2
          WHEN tt.day_of_week='Wednesday' THEN 3
          WHEN tt.day_of_week='Thursday' THEN 4
          WHEN tt.day_of_week='Friday' THEN 5
          WHEN tt.day_of_week='Saturday' THEN 6
          WHEN tt.day_of_week='Sunday' THEN 7
        END,
        tt.start_time;
    `, [classId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Student timetable fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});


//  STUDENT - SUBJECTWISE ATTENDANCE

app.get('/api/student/attendance/subjectwise', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const studentId = await getStudentIdByUserId(req.user.user_id);
    if (!studentId) return res.status(404).json({ error: 'Student not found' });

    const result = await pool.query(`
      SELECT 
        subj.title AS subject_title,
        ROUND(AVG(CASE WHEN a.status THEN 1 ELSE 0 END) * 100, 2) AS attendance_percentage
      FROM attendance a
      JOIN session s ON a.session_id = s.session_id
      JOIN teachersubject ts ON s.ts_id = ts.ts_id
      JOIN classsubject cs ON ts.cs_id = cs.cs_id
      JOIN subjects subj ON cs.subject_id = subj.subject_id
      WHERE a.student_id = $1
      GROUP BY subj.title
      ORDER BY subj.title;
    `, [studentId]);

    res.json(result.rows);
  } catch (err) {
    console.error(' Student subjectwise attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch subjectwise attendance' });
  }
});

// STUDENT - MONTHWISE ATTENDANCE
app.get('/api/student/attendance/monthwise', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const studentId = await getStudentIdByUserId(req.user.user_id);
    if (!studentId) return res.status(404).json({ error: 'Student not found' });

    const result = await pool.query(`
      SELECT 
        TO_CHAR(s.date, 'Month') AS month,
        ROUND(AVG(CASE WHEN a.status THEN 1 ELSE 0 END) * 100, 2) AS attendance_percentage
      FROM attendance a
      JOIN session s ON a.session_id = s.session_id
      WHERE a.student_id = $1
      GROUP BY month
      ORDER BY MIN(s.date);
    `, [studentId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Student monthwise attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch monthwise attendance' });
  }
});

// =====================
// STUDENT - OVERALL ATTENDANCE SUMMARY
// =====================
app.get('/api/student/attendance/summary', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const studentId = await getStudentIdByUserId(req.user.user_id);
    if (!studentId) return res.status(404).json({ error: 'Student not found' });

    const result = await pool.query(`
      SELECT 
        SUM(CASE WHEN a.status THEN 1 ELSE 0 END) AS present_count,
        COUNT(*) AS total_classes,
        ROUND(AVG(CASE WHEN a.status THEN 1 ELSE 0 END) * 100, 2) AS attendance_percentage
      FROM attendance a
      WHERE a.student_id = $1;
    `, [studentId]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(' Student attendance summary error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});


//  (1) STUDENT - DAY-WISE ATTENDANCE
app.get('/api/student/attendance/daywise', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const studentId = await getStudentIdByUserId(req.user.user_id);
    if (!studentId) return res.status(404).json({ error: 'Student not found' });

    const result = await pool.query(`
      SELECT 
        TO_CHAR(s.date, 'Day') AS day_name,
        ROUND(AVG(CASE WHEN a.status THEN 1 ELSE 0 END) * 100, 2) AS attendance_percentage
      FROM attendance a
      JOIN session s ON a.session_id = s.session_id
      WHERE a.student_id = $1
      GROUP BY day_name
      ORDER BY MIN(s.date);
    `, [studentId]);

    res.json(result.rows);
  } catch (err) {
    console.error(' Day-wise attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch day-wise attendance' });
  }
});


//  (2) STUDENT - TEACHER-WISE ATTENDANCE

app.get('/api/student/attendance/teacherwise', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const studentId = await getStudentIdByUserId(req.user.user_id);
    if (!studentId) return res.status(404).json({ error: 'Student not found' });

    const result = await pool.query(`
      SELECT 
        t.name AS teacher_name,
        ROUND(AVG(CASE WHEN a.status THEN 1 ELSE 0 END) * 100, 2) AS attendance_percentage
      FROM attendance a
      JOIN session s ON a.session_id = s.session_id
      JOIN teachersubject ts ON s.ts_id = ts.ts_id
      JOIN teachers t ON ts.teacher_id = t.teacher_id
      WHERE a.student_id = $1
      GROUP BY t.name
      ORDER BY t.name;
    `, [studentId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Teacher-wise attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch teacher-wise attendance' });
  }
});



// (3) STUDENT - WEEKLY ATTENDANCE TREND
app.get('/api/student/attendance/trend', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const studentId = await getStudentIdByUserId(req.user.user_id);
    if (!studentId) return res.status(404).json({ error: 'Student not found' });

    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('week', s.date), 'DD Mon') AS week_start,
        ROUND(AVG(CASE WHEN a.status THEN 1 ELSE 0 END) * 100, 2) AS attendance_percentage
      FROM attendance a
      JOIN session s ON a.session_id = s.session_id
      WHERE a.student_id = $1
      GROUP BY week_start
      ORDER BY MIN(s.date);
    `, [studentId]);

    res.json(result.rows);
  } catch (err) {
    console.error(' Weekly trend attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch weekly attendance trend' });
  }
});


//  (4) STUDENT - DEFAULTER RISK ANALYSIS
app.get('/api/student/attendance/defaulter', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const studentId = await getStudentIdByUserId(req.user.user_id);
    if (!studentId) return res.status(404).json({ error: 'Student not found' });

    // Current stats
    const stats = await pool.query(`
      SELECT 
        SUM(CASE WHEN a.status THEN 1 ELSE 0 END) AS present_count,
        COUNT(*) AS total_classes
      FROM attendance a
      WHERE a.student_id = $1;
    `, [studentId]);

    const { present_count, total_classes } = stats.rows[0];
    const present = +present_count || 0;
    const total = +total_classes || 1;
    const attendancePercentage = Math.round((present / total) * 100);

    // Simulate next 5 classes — predict safe or defaulter
    const target = 75;
    let future = 0;
    while (((present + future) / (total + future)) * 100 < target) future++;

    res.json({
      attendance_percentage: attendancePercentage,
      lectures_to_attend: future,
      target_percentage: target
    });
  } catch (err) {
    console.error('Defaulter analysis error:', err);
    res.status(500).json({ error: 'Failed to calculate defaulter analysis' });
  }
});


//  (5) SUBJECT-WISE DEFAULTER ANALYSIS
app.get('/api/student/attendance/defaulter/subjectwise', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const studentId = await getStudentIdByUserId(req.user.user_id);
    if (!studentId) return res.status(404).json({ error: 'Student not found' });

    // Calculate per-subject attendance
    const result = await pool.query(`
      SELECT 
        sub.title AS subject_name,
        SUM(CASE WHEN a.status THEN 1 ELSE 0 END) AS present_count,
        COUNT(*) AS total_classes
      FROM attendance a
      JOIN session s ON a.session_id = s.session_id
      JOIN teachersubject ts ON s.ts_id = ts.ts_id
      JOIN classsubject cs ON ts.cs_id = cs.cs_id
      JOIN subjects sub ON cs.subject_id = sub.subject_id
      WHERE a.student_id = $1
      GROUP BY sub.title
      ORDER BY sub.title;
    `, [studentId]);

    // Compute lectures needed to stay safe
    const target = 75;
    const data = result.rows.map(row => {
      const present = +row.present_count || 0;
      const total = +row.total_classes || 1;
      const percentage = Math.round((present / total) * 100);
      let future = 0;
      while (((present + future) / (total + future)) * 100 < target) future++;
      return {
        subject_name: row.subject_name,
        attendance_percentage: percentage,
        lectures_to_attend: future
      };
    });

    res.json(data);
  } catch (err) {
    console.error(' Subject-wise defaulter error:', err);
    res.status(500).json({ error: 'Failed to fetch subject-wise defaulter analysis' });
  }
});


// =====================
// 📥 STUDENT - EXPORT ATTENDANCE REPORT AS CSV
// =====================
app.get('/api/student/attendance/export', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const studentId = await getStudentIdByUserId(req.user.user_id);
    if (!studentId) return res.status(404).json({ error: 'Student not found' });

    // Fetch full attendance records
    const result = await pool.query(`
      SELECT 
        subj.title AS subject,
        s.date,
        CASE WHEN a.status THEN 'Present' ELSE 'Absent' END AS attendance_status,
        t.name AS teacher_name
      FROM attendance a
      JOIN session s ON a.session_id = s.session_id
      JOIN teachersubject ts ON s.ts_id = ts.ts_id
      JOIN teachers t ON ts.teacher_id = t.teacher_id
      JOIN classsubject cs ON ts.cs_id = cs.cs_id
      JOIN subjects subj ON cs.subject_id = subj.subject_id
      WHERE a.student_id = $1
      ORDER BY s.date;
    `, [studentId]);

    // Create CSV data
    let csv = 'Subject,Date,Status,Teacher\n';
    result.rows.forEach(row => {
      csv += `${row.subject},${row.date},${row.attendance_status},${row.teacher_name}\n`;
    });

    // Set headers for download
    res.header('Content-Type', 'text/csv');
    res.attachment('Attendance_Report.csv');
    res.send(csv);

  } catch (err) {
    console.error('CSV Export Error:', err);
    res.status(500).json({ error: 'Failed to export attendance report' });
  }
});


// AI Chatbot Assistant (Powered by GROQ)
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/student/chatbot', authenticateToken, authorizeRole('Student'), async (req, res) => {
  const { question } = req.body;
  const studentId = await getStudentIdByUserId(req.user.user_id); // fixed ID fetch

  try {
    // 1️⃣ Fetch personalized context for the student
    const studentQuery = `
      SELECT s.student_id, s.name, c.name AS class_name
      FROM students s
      JOIN classes c ON s.class_id = c.class_id
      WHERE s.student_id = $1
    `;
    const studentData = await pool.query(studentQuery, [studentId]);
    const student = studentData.rows[0];

    const teacherQuery = `
      SELECT sub.title AS subject_title, t.name AS teacher_name
      FROM teachersubject ts
      JOIN teachers t ON ts.teacher_id = t.teacher_id
      JOIN classsubject cs ON ts.cs_id = cs.cs_id
      JOIN subjects sub ON cs.subject_id = sub.subject_id
      JOIN students st ON st.class_id = cs.class_id
      WHERE st.student_id = $1
    `;
    const teacherData = await pool.query(teacherQuery, [studentId]);

    const attendanceQuery = `
      SELECT sub.title AS subject_title, 
             ROUND(SUM(CASE WHEN a.status THEN 1 ELSE 0 END)::decimal / COUNT(*) * 100, 2) AS attendance_percentage
      FROM attendance a
      JOIN session sess ON a.session_id = sess.session_id
      JOIN teachersubject ts ON sess.ts_id = ts.ts_id
      JOIN classsubject cs ON ts.cs_id = cs.cs_id
      JOIN subjects sub ON cs.subject_id = sub.subject_id
      WHERE a.student_id = $1
      GROUP BY sub.title
    `;
    const attendanceData = await pool.query(attendanceQuery, [studentId]);

    // Build readable text for AI
    const teacherList = teacherData.rows.map(t => `${t.subject_title} - ${t.teacher_name}`).join(', ') || "No subjects found.";
    const attendanceList = attendanceData.rows.map(a => `${a.subject_title}: ${a.attendance_percentage}%`).join(', ') || "No attendance records available.";

    // 2️⃣ Create dynamic context
    const context = `
    You are the SAMS AI Assistant for ${student.name}, a student of ${student.class_name}.
    The student's subjects and instructors are: ${teacherList}.
    Attendance record: ${attendanceList}.
    Your role: Help the student with attendance-related queries like "How many more lectures do I need to attend to reach 75% in DC?" or "Who teaches Math?"
    Always respond in a friendly, short, and precise way.
    `;

    // 3️⃣ Call Groq API
    let reply;
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: context },
          { role: "user", content: question }
        ],
        max_tokens: 200
      });
      reply = completion.choices[0].message.content;
    } catch (err) {
      console.error("Primary model failed:", err.message);
      const fallback = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: context },
          { role: "user", content: question }
        ],
        max_tokens: 200
      });
      reply = fallback.choices[0].message.content;
    }

    res.json({ reply });
  } catch (error) {
    console.error("Chatbot Error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});


const cron = require('node-cron');

// Monthly check: run at 08:00 on day 1 of every month
cron.schedule('0 8 1 * *', async () => {
  console.log(' Running monthly attendance alerts job');

  try {
    // Fetch all students with their per-subject stats
    const rows = await pool.query(`
      SELECT s.student_id, s.name AS student_name, s.email AS student_email,
             sub.subject_id, sub.title AS subject_title,
             SUM(CASE WHEN a.status THEN 1 ELSE 0 END)::int AS present_count,
             COUNT(*)::int AS total_count
      FROM students s
      JOIN attendance a ON a.student_id = s.student_id
      JOIN session sess ON a.session_id = sess.session_id
      JOIN teachersubject ts ON sess.ts_id = ts.ts_id
      JOIN classsubject cs ON ts.cs_id = cs.cs_id
      JOIN subjects sub ON cs.subject_id = sub.subject_id
      GROUP BY s.student_id, s.name, s.email, sub.subject_id, sub.title
      ORDER BY s.student_id;
    `);

    for (const row of rows.rows) {
      const present = +row.present_count || 0;
      const total = +row.total_count || 1;
      const percentage = Math.round((present / total) * 100);

      // send if below 75%
      if (percentage < 75) {
        const note = `You are currently below the required 75% attendance for this subject. Please reach out to your teacher and attend the upcoming lectures.`;
        await sendMonthlyAlertEmail(row.student_email, row.student_name, row.subject_title, percentage, note);
      } else {
        // Check one-miss risk: if missing one more would drop below 75%
        if (((present) / (total + 1)) * 100 < 75) {
          const note = `⚠️ Warning: If you miss one more lecture in this subject this month, your attendance will drop below 75%. Please prioritize attendance.`;
          await sendMonthlyAlertEmail(row.student_email, row.student_name, row.subject_title, percentage, note);
        }
      }
      // optional: small sleep to avoid SMTP throttling / DB burst
      // await new Promise(r => setTimeout(r, 200));
    }

    console.log('Monthly attendance alerts job completed');
  } catch (err) {
    console.error('Monthly attendance job error:', err);
  }
});





// Error Handlers
app.use((req, res) => res.status(404).send('Page not found'));
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).send('Something went wrong!'); });


// ---- TEMPORARY EMAIL TEST ROUTE ----
app.get("/test-email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // sends to yourself for testing
      subject: "Render Email Test - SAMS",
      text: "Your Render app can now send emails successfully!"
    });
    console.log("Test email sent successfully!");
    res.send("Email sent successfully!");
  } catch (err) {
    console.error(" Email test failed:", err);
    res.status(500).send("Failed: " + err.message);
  }
});


// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

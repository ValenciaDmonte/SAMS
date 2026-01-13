

<img width="796" height="533" alt="image" src="https://github.com/user-attachments/assets/a4474db6-e57a-490c-bd0d-379c0ed227ae" />


## Overview

The **Smart Attendance Management System (SAMS)** is a full-stack web application designed to simplify and automate attendance management in educational institutions. It enables administrators, teachers, and students to efficiently manage classes, schedules, and attendance records, with intelligent notifications and chatbot support for assistance.

The system is built with **Node.js**, **Express**, **PostgreSQL**, and **EJS** for the backend and templating. It integrates **Groq API** for AI-driven chatbot interaction and **Nodemailer** for automated email notifications.

---

## Features

### Admin

* Manage students, teachers, classes, and subjects
* Map teachers to subjects and classes
* Generate and view timetables
* View system statistics
* Secure login and role-based access control

### Teacher

* Mark and update attendance for each session
* View and manage subject-wise attendance reports
* Export attendance reports as CSV
* Receive smart alerts for attendance submissions

### Student

* View personalized attendance summaries
* Interact with the AI-powered SAMS chatbot for attendance queries (e.g., “How many more lectures do I need to reach 75%?”)
* Receive email notifications when marked absent or when attendance falls below 75%

---

## Notifications

* **Attendance Update Notification:** Students receive an email whenever a teacher marks attendance (Present/Absent).
* **Low Attendance Alert:** Monthly email alert if a student’s attendance in any subject falls below 75%.
* **Defaulter Alert:** Students receive a warning if missing even one lecture would drop attendance below 75%.

---

## AI Chatbot Integration

The chatbot is powered by the **Groq API** using the **LLaMA-3.3-70B Versatile** model.
It provides personalized responses based on the student’s attendance, subjects, and teachers.
Example queries include:

* “What is my attendance in DC?”
* “Who teaches DBMS?”
* “How many more lectures do I need to reach 75% in CN?”

---

## Tech Stack

| Layer           | Technology                  |
| --------------- | --------------------------- |
| Backend         | Node.js, Express.js         |
| Frontend        | EJS Templates, Tailwind CSS |
| Database        | PostgreSQL                  |
| AI Chatbot      | Groq API (LLaMA-3.3-70B)    |
| Notifications   | Nodemailer (SMTP)           |
| Hosting         | Render                      |
| Version Control | Git & GitHub                |

---

## Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/<your-username>/SAMS.git
cd SAMS
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root with the following:

```env
PORT=10000
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>
JWT_SECRET=<your_secret_key>
EMAIL_USER=<your_email>
EMAIL_PASS=<your_email_password>
GROQ_API_KEY=<your_groq_api_key>
```

### 4. Run Locally

```bash
node index.js
```

Visit: [http://localhost:10000](http://localhost:10000)

---



## Future Enhancements

* Integration with biometric or RFID-based attendance
* Mobile app version
* Push notifications and mobile alerts

---





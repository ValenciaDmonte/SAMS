--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    attendance_id integer NOT NULL,
    session_id integer,
    student_id integer,
    status boolean NOT NULL,
    marked_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- Name: attendance_attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_attendance_id_seq OWNER TO postgres;

--
-- Name: attendance_attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_attendance_id_seq OWNED BY public.attendance.attendance_id;


--
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classes (
    class_id integer NOT NULL,
    name character varying(50) NOT NULL,
    term character varying(20),
    section character varying(5)
);


ALTER TABLE public.classes OWNER TO postgres;

--
-- Name: classes_class_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.classes_class_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.classes_class_id_seq OWNER TO postgres;

--
-- Name: classes_class_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.classes_class_id_seq OWNED BY public.classes.class_id;


--
-- Name: classsubject; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classsubject (
    cs_id integer NOT NULL,
    class_id integer,
    subject_id integer
);


ALTER TABLE public.classsubject OWNER TO postgres;

--
-- Name: classsubject_cs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.classsubject_cs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.classsubject_cs_id_seq OWNER TO postgres;

--
-- Name: classsubject_cs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.classsubject_cs_id_seq OWNED BY public.classsubject.cs_id;


--
-- Name: enrollment_backup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollment_backup (
    enroll_id integer NOT NULL,
    class_id integer,
    cs_id integer
);


ALTER TABLE public.enrollment_backup OWNER TO postgres;

--
-- Name: enrollment_enroll_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.enrollment_enroll_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enrollment_enroll_id_seq OWNER TO postgres;

--
-- Name: enrollment_enroll_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.enrollment_enroll_id_seq OWNED BY public.enrollment_backup.enroll_id;


--
-- Name: notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification (
    notif_id integer NOT NULL,
    student_id integer,
    type character varying(50),
    message text,
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notification OWNER TO postgres;

--
-- Name: notification_notif_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_notif_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_notif_id_seq OWNER TO postgres;

--
-- Name: notification_notif_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_notif_id_seq OWNED BY public.notification.notif_id;


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.push_subscriptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL
);


ALTER TABLE public.push_subscriptions OWNER TO postgres;

--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.push_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.push_subscriptions_id_seq OWNER TO postgres;

--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.push_subscriptions_id_seq OWNED BY public.push_subscriptions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_role_id_seq OWNER TO postgres;

--
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    session_id integer NOT NULL,
    ts_id integer,
    date date NOT NULL,
    "time" time without time zone,
    mode character varying(20),
    status character varying(20),
    topic character varying(255)
);


ALTER TABLE public.session OWNER TO postgres;

--
-- Name: session_session_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.session_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.session_session_id_seq OWNER TO postgres;

--
-- Name: session_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.session_session_id_seq OWNED BY public.session.session_id;


--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    student_id integer NOT NULL,
    user_id integer,
    name character varying(100) NOT NULL,
    roll_no character varying(20),
    batch character varying(20),
    email character varying(100),
    dept character varying(100),
    class_id integer
);


ALTER TABLE public.students OWNER TO postgres;

--
-- Name: students_student_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.students_student_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_student_id_seq OWNER TO postgres;

--
-- Name: students_student_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.students_student_id_seq OWNED BY public.students.student_id;


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subjects (
    subject_id integer NOT NULL,
    code character varying(20),
    title character varying(100) NOT NULL
);


ALTER TABLE public.subjects OWNER TO postgres;

--
-- Name: subjects_subject_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subjects_subject_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subjects_subject_id_seq OWNER TO postgres;

--
-- Name: subjects_subject_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subjects_subject_id_seq OWNED BY public.subjects.subject_id;


--
-- Name: teachers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teachers (
    teacher_id integer NOT NULL,
    user_id integer,
    name character varying(100) NOT NULL,
    department character varying(50),
    email character varying(100)
);


ALTER TABLE public.teachers OWNER TO postgres;

--
-- Name: teachers_teacher_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teachers_teacher_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teachers_teacher_id_seq OWNER TO postgres;

--
-- Name: teachers_teacher_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teachers_teacher_id_seq OWNED BY public.teachers.teacher_id;


--
-- Name: teachersubject; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teachersubject (
    ts_id integer NOT NULL,
    teacher_id integer,
    cs_id integer
);


ALTER TABLE public.teachersubject OWNER TO postgres;

--
-- Name: teachersubject_ts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teachersubject_ts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teachersubject_ts_id_seq OWNER TO postgres;

--
-- Name: teachersubject_ts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teachersubject_ts_id_seq OWNED BY public.teachersubject.ts_id;


--
-- Name: timetable; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.timetable (
    timetable_id integer NOT NULL,
    ts_id integer,
    day_of_week character varying(15) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    mode character varying(20),
    topic character varying(255)
);


ALTER TABLE public.timetable OWNER TO postgres;

--
-- Name: timetable_timetable_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.timetable_timetable_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.timetable_timetable_id_seq OWNER TO postgres;

--
-- Name: timetable_timetable_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.timetable_timetable_id_seq OWNED BY public.timetable.timetable_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    role_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    email character varying(100)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: attendance attendance_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance ALTER COLUMN attendance_id SET DEFAULT nextval('public.attendance_attendance_id_seq'::regclass);


--
-- Name: classes class_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes ALTER COLUMN class_id SET DEFAULT nextval('public.classes_class_id_seq'::regclass);


--
-- Name: classsubject cs_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classsubject ALTER COLUMN cs_id SET DEFAULT nextval('public.classsubject_cs_id_seq'::regclass);


--
-- Name: enrollment_backup enroll_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollment_backup ALTER COLUMN enroll_id SET DEFAULT nextval('public.enrollment_enroll_id_seq'::regclass);


--
-- Name: notification notif_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification ALTER COLUMN notif_id SET DEFAULT nextval('public.notification_notif_id_seq'::regclass);


--
-- Name: push_subscriptions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);


--
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- Name: session session_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session ALTER COLUMN session_id SET DEFAULT nextval('public.session_session_id_seq'::regclass);


--
-- Name: students student_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students ALTER COLUMN student_id SET DEFAULT nextval('public.students_student_id_seq'::regclass);


--
-- Name: subjects subject_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects ALTER COLUMN subject_id SET DEFAULT nextval('public.subjects_subject_id_seq'::regclass);


--
-- Name: teachers teacher_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers ALTER COLUMN teacher_id SET DEFAULT nextval('public.teachers_teacher_id_seq'::regclass);


--
-- Name: teachersubject ts_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachersubject ALTER COLUMN ts_id SET DEFAULT nextval('public.teachersubject_ts_id_seq'::regclass);


--
-- Name: timetable timetable_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timetable ALTER COLUMN timetable_id SET DEFAULT nextval('public.timetable_timetable_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (attendance_id, session_id, student_id, status, marked_at) FROM stdin;
24	7	17	t	2025-10-27 23:41:40.250236
25	7	18	t	2025-10-27 23:41:40.250236
26	7	19	f	2025-10-27 23:41:40.250236
27	7	20	t	2025-10-27 23:41:40.250236
17	5	17	t	2025-10-28 00:06:20.117847
18	5	18	t	2025-10-28 00:06:20.117847
19	5	19	f	2025-10-28 00:06:20.117847
23	5	20	t	2025-10-28 00:07:55.485383
34	8	19	t	2025-10-28 00:23:20.927728
35	8	20	t	2025-10-28 00:23:20.927728
32	8	17	t	2025-10-28 00:23:34.968922
33	8	18	f	2025-10-28 00:23:38.530154
36	9	17	t	2025-10-28 09:10:39.90339
37	9	18	t	2025-10-28 09:10:39.90339
38	9	19	t	2025-10-28 09:10:39.90339
39	9	20	t	2025-10-28 09:10:39.90339
40	10	17	t	2025-10-28 09:24:11.070297
41	10	18	t	2025-10-28 09:24:11.070297
42	10	19	t	2025-10-28 09:24:11.070297
43	10	20	f	2025-10-28 09:24:11.070297
44	11	17	t	2025-10-28 13:55:36.354413
45	11	18	t	2025-10-28 13:55:36.354413
47	11	20	f	2025-10-28 13:55:36.354413
46	11	19	f	2025-10-28 13:55:48.305472
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classes (class_id, name, term, section) FROM stdin;
11	TE-A	5	A
12	TE-B	5	B
14	TE-C	5	C
15	TE-D	5	D
\.


--
-- Data for Name: classsubject; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classsubject (cs_id, class_id, subject_id) FROM stdin;
13	11	8
14	11	7
15	11	9
16	11	10
17	12	7
20	12	13
\.


--
-- Data for Name: enrollment_backup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollment_backup (enroll_id, class_id, cs_id) FROM stdin;
\.


--
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification (notif_id, student_id, type, message, sent_at) FROM stdin;
\.


--
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.push_subscriptions (id, user_id, endpoint, p256dh, auth) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, role_name) FROM stdin;
1	Admin
2	Teacher
3	Student
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session (session_id, ts_id, date, "time", mode, status, topic) FROM stdin;
5	13	2025-10-27	22:50:44	Ongoing	Active	\N
7	16	2025-10-27	23:31:55	Ongoing	Active	\N
8	18	2025-10-27	00:23:08	Ongoing	Active	\N
9	17	2025-10-28	09:10:24	Ongoing	Active	\N
10	18	2025-10-28	09:24:03	Ongoing	Active	\N
11	13	2025-10-28	13:55:24	Ongoing	Active	\N
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (student_id, user_id, name, roll_no, batch, email, dept, class_id) FROM stdin;
17	46	Naman P	1	2027	naman@abc	CE	11
18	47	Arush K	2	2027	arush@abc	CE	11
19	48	Ananya P	3	2027	ananya@abc	CE	11
20	49	Valencia  D	4	2027	valencia.dmonte23@spit.ac.in	CE	11
25	54	Arpana G	5	2027	arpana@abc	CE	12
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subjects (subject_id, code, title) FROM stdin;
7	AISC123	AISC
8	DC123	DC
9	SE123	SE
10	TOC123	TOC
13	DSA123	DSA
\.


--
-- Data for Name: teachers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teachers (teacher_id, user_id, name, department, email) FROM stdin;
8	40	Dr. Pritam Joshi	CE	pritam@abc
11	43	Dr. Reena M	CE	reena@abc
12	44	Dr. Nita D	CE	nita@abc
13	45	Dr. Arvind K	CE	arvind@abc
\.


--
-- Data for Name: teachersubject; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teachersubject (ts_id, teacher_id, cs_id) FROM stdin;
13	8	14
16	11	16
17	13	15
18	12	13
20	13	17
22	12	20
\.


--
-- Data for Name: timetable; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.timetable (timetable_id, ts_id, day_of_week, start_time, end_time, mode, topic) FROM stdin;
34	13	Monday	23:30:00	23:40:00	online	
35	16	Monday	23:40:00	23:50:00	online	
46	18	Tuesday	00:05:00	00:30:00	online	
47	17	Tuesday	09:10:00	09:20:00	in-person	
48	18	Tuesday	09:20:00	09:30:00	in-person	
50	13	Tuesday	13:55:00	14:05:00	in-person	
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, password, role_id, created_at, email) FROM stdin;
29	spit_admin	$2b$10$11gLSTTI/vE/GN4Q0drn/OSBhlk1CLSnlkFmQD3NvD90c0vtSumcq	1	2025-10-24 18:45:24.391452	admin@spit.edu
40	pritam123	$2b$10$KFlKuKwzY3hqafrHeKZE/Oii.H2tKNXSZ3DS2atl3mBWjYiCx2TGW	2	2025-10-27 22:48:57.018436	pritam@abc
43	reena123	$2b$10$4qFg/5jzN/Ybj/6r2ek8OOudDNp6oLD4OnZZli./95x/zqE3TwWC.	2	2025-10-27 23:11:27.71386	reena@abc
44	nita123	$2b$10$fh2R33XYhLlg0q46FvvYTO1W/lDDbOYkir4kNxknHIkgV.he6lxWO	2	2025-10-27 23:14:33.504085	nita@abc
45	arvind123	$2b$10$MhGpRLzsVLGOFjz1mmSlKuuGR6Z0Znd2oANl6LO/jWHoEYCINcgwu	2	2025-10-27 23:15:42.450268	arvind@abc
46	1	$2b$10$88lXbzrYHyWAejiPQEW9Z.1XUgVc068pSaplzCoqgu0fDuT8a5RZK	3	2025-10-27 23:17:35.77284	naman@abc
47	2	$2b$10$/Z69e7cxcI9H5X8sVhFkKeU1QYIKD3hSSAL6Cjbt1tJQjhBbRvzUa	3	2025-10-27 23:17:55.982949	arush@abc
48	3	$2b$10$qXFBWZS0gqJOAD4opJdq8Ol1gIlUT0f4yaXKwvG0HGGNS3RA53sUS	3	2025-10-27 23:18:14.665571	ananya@abc
54	5	$2b$10$26LgIWL49fanG4gW6b0UuefFv6xucPsJUIBppnp7nE8L.SFRL6cwO	3	2025-10-28 13:51:31.718124	arpana@abc
49	4	$2b$10$BoSbXN3btZZM3mnMmk7CtOsdvnzjZ7TwnEjrDfEdPuGArd0p6EvwO	3	2025-10-27 23:33:21.115047	valencia.dmonte23@spit.ac.in
\.


--
-- Name: attendance_attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_attendance_id_seq', 47, true);


--
-- Name: classes_class_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.classes_class_id_seq', 15, true);


--
-- Name: classsubject_cs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.classsubject_cs_id_seq', 20, true);


--
-- Name: enrollment_enroll_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enrollment_enroll_id_seq', 2, true);


--
-- Name: notification_notif_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_notif_id_seq', 1, false);


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.push_subscriptions_id_seq', 1, false);


--
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 3, true);


--
-- Name: session_session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.session_session_id_seq', 11, true);


--
-- Name: students_student_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_student_id_seq', 25, true);


--
-- Name: subjects_subject_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subjects_subject_id_seq', 13, true);


--
-- Name: teachers_teacher_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teachers_teacher_id_seq', 13, true);


--
-- Name: teachersubject_ts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teachersubject_ts_id_seq', 22, true);


--
-- Name: timetable_timetable_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.timetable_timetable_id_seq', 50, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 54, true);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (attendance_id);


--
-- Name: attendance attendance_session_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_session_id_student_id_key UNIQUE (session_id, student_id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (class_id);


--
-- Name: classsubject classsubject_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classsubject
    ADD CONSTRAINT classsubject_pkey PRIMARY KEY (cs_id);


--
-- Name: enrollment_backup enrollment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollment_backup
    ADD CONSTRAINT enrollment_pkey PRIMARY KEY (enroll_id);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (notif_id);


--
-- Name: push_subscriptions push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (session_id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (student_id);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (subject_id);


--
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (teacher_id);


--
-- Name: teachersubject teachersubject_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachersubject
    ADD CONSTRAINT teachersubject_pkey PRIMARY KEY (ts_id);


--
-- Name: timetable timetable_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timetable
    ADD CONSTRAINT timetable_pkey PRIMARY KEY (timetable_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: attendance attendance_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.session(session_id) ON DELETE CASCADE;


--
-- Name: attendance attendance_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;


--
-- Name: classsubject classsubject_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classsubject
    ADD CONSTRAINT classsubject_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(class_id) ON DELETE CASCADE;


--
-- Name: classsubject classsubject_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classsubject
    ADD CONSTRAINT classsubject_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(subject_id) ON DELETE CASCADE;


--
-- Name: enrollment_backup enrollment_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollment_backup
    ADD CONSTRAINT enrollment_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(class_id) ON DELETE CASCADE;


--
-- Name: enrollment_backup enrollment_cs_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollment_backup
    ADD CONSTRAINT enrollment_cs_id_fkey FOREIGN KEY (cs_id) REFERENCES public.classsubject(cs_id) ON DELETE CASCADE;


--
-- Name: notification notification_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: session session_ts_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_ts_id_fkey FOREIGN KEY (ts_id) REFERENCES public.teachersubject(ts_id) ON DELETE CASCADE;


--
-- Name: students students_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(class_id);


--
-- Name: students students_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: teachers teachers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: teachersubject teachersubject_cs_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachersubject
    ADD CONSTRAINT teachersubject_cs_id_fkey FOREIGN KEY (cs_id) REFERENCES public.classsubject(cs_id) ON DELETE CASCADE;


--
-- Name: teachersubject teachersubject_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachersubject
    ADD CONSTRAINT teachersubject_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(teacher_id) ON DELETE CASCADE;


--
-- Name: timetable timetable_ts_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timetable
    ADD CONSTRAINT timetable_ts_id_fkey FOREIGN KEY (ts_id) REFERENCES public.teachersubject(ts_id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id);


--
-- PostgreSQL database dump complete
--


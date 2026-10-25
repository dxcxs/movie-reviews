# Marquee – ระบบรีวิวภาพยนตร์ออนไลน์

Web Application สำหรับค้นหาและดูข้อมูลภาพยนตร์ ให้คะแนนและเขียนรีวิว เพิ่มภาพยนตร์ในรายการโปรด และให้ผู้ดูแลระบบจัดการข้อมูลภาพยนตร์ รีวิว และสมาชิก ข้อมูลทั้งหมดเก็บในฐานข้อมูล MongoDB

## สมาชิก
- Rapeephat Lanthong (รหัสนักศึกษา 674245030)

## วัตถุประสงค์
รวบรวมข้อมูลภาพยนตร์ คะแนน และความคิดเห็นของผู้ใช้งานไว้ในระบบเดียว เพื่อให้ค้นหาและเปรียบเทียบภาพยนตร์ได้สะดวกขึ้น

## ผู้ใช้งานระบบ
| บทบาท | สิ่งที่ทำได้ |
|---|---|
| ผู้ใช้ทั่วไป (Guest) | ดูรายการภาพยนตร์ ค้นหา กรองตามประเภท เรียงลำดับ ดูรายละเอียด ตัวอย่างหนัง คะแนน และรีวิว |
| สมาชิก (User) | ทำได้ทุกอย่างของผู้ใช้ทั่วไป + ให้คะแนน เขียน/แก้ไข/ลบรีวิวของตนเอง เพิ่มหนังในรายการโปรด ดูรายการโปรดและประวัติรีวิวของตนเอง |
| ผู้ดูแลระบบ (Admin) | เพิ่ม/แก้ไข/ลบภาพยนตร์ ลบรีวิว เปลี่ยนสิทธิ์/ลบสมาชิก ดู Dashboard สถิติ |

## Features
- แสดงรายการภาพยนตร์เป็นแถว (Top rated, New releases, แยกตามประเภท) และแบนเนอร์หนังแนะนำ
- ค้นหาตามชื่อ, กรองตามประเภท (Action, Horror, Comedy ฯลฯ), เรียงตามคะแนน / วันที่ออกฉาย / ชื่อ
- แสดงคะแนนเฉลี่ย จำนวนรีวิว และความยาวหนัง
- หน้ารายละเอียด: โปสเตอร์/แบนเนอร์ ผู้กำกับ นักแสดง สโลแกน ตัวอย่างหนัง (YouTube หรือไฟล์วิดีโอของเราเอง) และ "More like this"
- สมัครสมาชิก / เข้าสู่ระบบ / ออกจากระบบ (รหัสผ่านเข้ารหัสด้วย bcrypt)
- ให้คะแนน 1–5 ดาว และเขียนรีวิว (1 คนต่อ 1 หนัง) แก้ไขหรือลบรีวิวของตนเอง
- รายการโปรด (My list) และประวัติรีวิวของตนเอง
- แถว "Recently viewed" จำหนังที่เปิดดูล่าสุดด้วย Cookie
- โหมดสว่าง/มืด จำค่าด้วย Cookie
- Admin: Dashboard (จำนวนหนัง สมาชิก รีวิว กราฟคะแนน ประเภท หนังคะแนนสูงสุด หนังที่ถูกใจที่สุด), จัดการหนัง รีวิว และสมาชิก

## เทคโนโลยีที่ใช้
| เทคโนโลยี | ใช้ทำอะไร |
|---|---|
| HTML5 | โครงสร้างหน้าเว็บ |
| CSS3 | ออกแบบ UI, การ์ดหนัง, แถวเลื่อน, โหมดสว่าง/มืด (CSS Variables) |
| JavaScript + DOM | ค้นหา/กรอง, แสดงการ์ดหนังแบบ Dynamic, ให้ดาว, Dialog ตัวอย่างหนัง, ตรวจสอบฟอร์ม |
| Node.js + Express.js | Server, Routing, REST API, Middleware |
| MongoDB + Mongoose | ฐานข้อมูล users / movies / reviews |
| express-session + connect-mongo | Session เก็บสถานะการเข้าสู่ระบบ (เก็บใน MongoDB) |
| cookie-parser | อ่าน/เขียน Cookies |
| bcryptjs | เข้ารหัสรหัสผ่าน |
| HTTP (GET, POST, PUT, PATCH, DELETE) | การสื่อสาร Client–Server |

## วิธีติดตั้ง
1. ติดตั้ง [Node.js](https://nodejs.org) เวอร์ชัน 18 ขึ้นไป และ MongoDB (ดูหัวข้อ "เชื่อมต่อ MongoDB")
2. ติดตั้งแพ็กเกจ
   ```bash
   npm install
   ```
3. คัดลอก `.env.example` เป็น `.env` แล้วแก้ค่า
   ```
   PORT=3000
   SESSION_SECRET=ข้อความยาวๆสุ่มๆ
   MONGO_URI=mongodb://127.0.0.1:27017/movie_review
   ```
4. สร้างข้อมูลตัวอย่างและบัญชีทดสอบ
   ```bash
   npm run seed
   ```
   > คำสั่งนี้ล้างข้อมูลเดิมทั้งหมดก่อนสร้างใหม่

## เชื่อมต่อ MongoDB
**แบบ A – ติดตั้งในเครื่อง:** ติดตั้ง MongoDB Community Server และเปิดบริการให้ทำงาน แล้วใช้
```
MONGO_URI=mongodb://127.0.0.1:27017/movie_review
```

**แบบ B – MongoDB Atlas (ฟรี ไม่ต้องติดตั้ง):**
1. สมัครและสร้าง Cluster ฟรีที่ mongodb.com/atlas
2. สร้าง Database User (ชื่อผู้ใช้/รหัสผ่าน)
3. Network Access → อนุญาต IP ของคุณ
4. กด Connect → Drivers → คัดลอก Connection String ใส่ใน `.env`
   ```
   MONGO_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/movie_review?retryWrites=true&w=majority
   ```

ฐานข้อมูลและ Collection จะถูกสร้างอัตโนมัติเมื่อมีการบันทึกข้อมูลครั้งแรก

## วิธี Run
```bash
npm start        # เปิดที่ http://localhost:3000
npm run dev      # รีสตาร์ทอัตโนมัติเมื่อแก้ไฟล์
```

## Username / Password สำหรับทดสอบ
| บทบาท | Username | Password |
|---|---|---|
| Admin | admin | admin123 |
| สมาชิก | user1 | user123 |
| สมาชิก | user2 | user123 |

(มีเมื่อรัน `npm run seed` แล้ว)

## การเพิ่มรูปและวิดีโอ
แก้ไขภาพยนตร์ได้ที่ **Admin → Movies → Edit**
- **Poster image URL**: รูปแนวตั้ง 2:3 (ประมาณ 600×900 px) ใช้แสดงในการ์ด
- **Backdrop image URL**: รูปแนวนอน 16:9 (อย่างน้อย 1280×720 px) ใช้ที่แบนเนอร์และหน้ารายละเอียด
- **Trailer**: ลิงก์ YouTube หรือไฟล์ของเราเอง เช่น `/videos/inception.mp4` (วางไฟล์ไว้ใน `public/videos/`)
- **Runtime**: พิมพ์เป็นข้อความได้ เช่น `1h 30m`
- วางรูปในเครื่องไว้ที่ `public/images/` แล้วใช้ path เช่น `/images/inception-poster.jpg`

(ทางเลือก) ดึงโปสเตอร์/แบนเนอร์/ความยาวจาก TMDB อัตโนมัติ: ใส่ `TMDB_API_KEY` ใน `.env` แล้วรัน `npm run posters` และเพิ่มผู้กำกับ/นักแสดงตัวอย่างด้วย `npm run details`

## โครงสร้างฐานข้อมูล (MongoDB)
| Collection | ฟิลด์สำคัญ |
|---|---|
| `users` | username (ไม่ซ้ำ), password (bcrypt hash), role (`user` / `admin`), favorites[] (id หนัง) |
| `movies` | title, genre, releaseDate, runtime, director, cast[], tagline, trailerUrl, description, posterUrl, backdropUrl |
| `reviews` | user, movie, rating (1–5), comment, createdAt — มี unique index (user, movie) เพื่อรีวิวได้ 1 ครั้งต่อ 1 หนัง |
| `sessions` | จัดการโดย connect-mongo |

คะแนนเฉลี่ยคำนวณด้วย MongoDB Aggregation (`$lookup`, `$avg`) ใน `lib/movieStats.js`

## Cookies และ Session
**Session (เก็บที่ Server)**
- หลังเข้าสู่ระบบ Server เก็บ `{ id, username, role }` ไว้ใน `req.session.user` และบันทึกใน MongoDB (collection `sessions`) หมดอายุใน 2 ชั่วโมง
- Browser เก็บเพียง Cookie `connect.sid` (Session ID)
- ใช้ตรวจสอบสถานะ Login และสิทธิ์ Admin ผ่าน Middleware `requireLogin` / `requireAdmin`

**Cookies (เก็บที่ Browser)**
| Cookie | ค่าที่เก็บ | อายุ | ใช้ทำอะไร |
|---|---|---|---|
| `connect.sid` | Session ID (เซ็นรหัส) | 2 ชั่วโมง | ระบุว่าเป็น Session ของใคร |
| `theme` | `dark` / `light` | 30 วัน | จำโหมดสว่าง/มืด |
| `recent` | id หนังที่เปิดดูล่าสุด (สูงสุด 10) | 30 วัน | แสดงแถว "Recently viewed" |

## REST API
| Method | Route | สิทธิ์ |
|---|---|---|
| POST | /api/auth/register, /api/auth/login, /api/auth/logout | ทุกคน |
| GET | /api/auth/me | ทุกคน |
| POST | /api/theme | ทุกคน |
| GET | /api/movies?q=&genre=&sort= | ทุกคน |
| GET | /api/movies/genres, /api/movies/recent, /api/movies/:id, /api/movies/:id/reviews | ทุกคน |
| POST | /api/movies/:id/reviews | สมาชิก |
| PUT / DELETE | /api/reviews/:id | เจ้าของรีวิว (DELETE: Admin ลบได้ด้วย) |
| GET | /api/me/reviews, /api/me/favorites | สมาชิก |
| PUT / DELETE | /api/me/favorites/:id | สมาชิก |
| POST / PUT / DELETE | /api/movies, /api/movies/:id | Admin |
| GET | /api/admin/stats, /api/admin/users, /api/admin/reviews | Admin |
| PATCH / DELETE | /api/admin/users/:id/role, /api/admin/users/:id | Admin |

## โครงสร้างโปรเจกต์
```
app.js              ตั้งค่า Server, Session, Routes
seed.js             สร้างข้อมูลตัวอย่าง
fetch-posters.js    (ทางเลือก) ดึงรูปจาก TMDB
fill-details.js     เพิ่มผู้กำกับ/นักแสดงตัวอย่าง
config/db.js        เชื่อมต่อ MongoDB
models/             User, Movie, Review (Mongoose)
routes/             auth, movies, reviews, me, admin
middleware/         requireLogin, requireAdmin
lib/                movieStats.js, movieDetails.js
public/             HTML, css/, js/, images/, videos/
```

## Site Map
```
/ (หน้าแรก)
├── /movie.html?id=…   รายละเอียด + รีวิว + ตัวอย่างหนัง
├── /login.html        เข้าสู่ระบบ / สมัครสมาชิก
├── /profile.html      My list + รีวิวของฉัน (ต้อง Login)
└── /admin.html        Dashboard / Movies / Reviews / Members (Admin เท่านั้น)
```

## หมายเหตุ
- ก่อนใช้งานจริงควรเปลี่ยน `SESSION_SECRET` และรหัสผ่าน Admin
- ห้ามอัปโหลดไฟล์ `.env` ขึ้น GitHub (อยู่ใน `.gitignore` แล้ว)
- README ภาษาอังกฤษอยู่ที่ `README.en.md`
- เอกสารระบบฉบับเต็ม (User Flow, Site Map, Screenshots ฯลฯ) อยู่ที่ `docs/SYSTEM_DOCUMENTATION.md`

# ก๋วยจั๊บ ศ.อุบล — เว็บสั่งอาหารในหมู่บ้าน 🍲

เว็บแอปสั่งก๋วยจั๊บญวนแบบหน้าเดียว (static site) ทำตามสไตล์ smoky-bite เดิม
เปิดผ่านมือถือ เลือกเมนู กดเพิ่มลงตะกร้า กรอกที่อยู่ในหมู่บ้าน แล้วส่งออเดอร์
เข้า Google Sheet + แจ้งเตือนเข้า LINE ของร้านอัตโนมัติ — **ไม่ต้องมี server เอง**
รันบน GitHub Pages ได้ฟรี

## ไฟล์ในโปรเจกต์

| ไฟล์ | หน้าที่ |
|---|---|
| `index.html` | โครงหน้าเว็บ |
| `styles.css` | ธีมสี/ดีไซน์ (โทนแดง-ทอง ตามโลโก้ร้าน) |
| `main.js` | เมนู, ตะกร้า, การส่งออเดอร์ |
| `AppsScript_Code.gs` | โค้ด backend (วางใน Google Apps Script) |
| `logo.png`, `hero_bowl.jpg`, `addon_*.png` | รูปภาพที่ตัดมาจากรูปโปรโมทที่แนบมา |

## ขั้นตอนติดตั้ง

### 1. ตั้งค่า Google Sheet + Apps Script (รับออเดอร์)

1. เปิด [sheets.google.com](https://sheets.google.com) สร้าง Sheet ใหม่ 1 อัน
2. เมนู **ส่วนขยาย (Extensions) → Apps Script**
3. ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดจากไฟล์ `AppsScript_Code.gs` แทน
4. (ถ้าต้องการแจ้งเตือนเข้า LINE) สร้าง LINE Official Account ที่
   [LINE Developers Console](https://developers.line.biz/) → คัดลอก
   **Channel access token** มาแทนที่ `PASTE_YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE`
   ในไฟล์ `.gs` (ถ้าไม่ต้องการแจ้งเตือน LINE ก็ข้ามได้ ระบบจะยังบันทึกลง
   Sheet ตามปกติ)
5. กด **Deploy → New deployment → เลือก Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - กด Deploy แล้วคัดลอก URL (ลงท้ายด้วย `/exec`)
6. (ถ้าใช้ LINE) เอา URL เดียวกันไปตั้งเป็น Webhook URL ใน
   LINE Official Account Manager → Settings → Messaging API → Webhook
   settings → เปิด "Use webhook" แล้วแอดมินพิมพ์ทักหา OA ตัวเอง 1 ครั้ง
   เพื่อให้ระบบจำ userId ไว้ส่งแจ้งเตือน

### 2. ผูก URL เข้ากับเว็บ

เปิดไฟล์ `main.js` หา:
```js
const APPS_SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
```
แล้วแทนที่ด้วย URL ที่ได้จากขั้นตอน Deploy ด้านบน

### 3. แก้ข้อมูลร้าน

ในไฟล์ `index.html` และ `main.js` แก้ตรงนี้ให้เป็นของร้านจริง:
- เบอร์โทร: `<a href="tel:0000000000">` ในไฟล์ `index.html`
- ลิงก์ LINE OA: `LINE_OA_LINK` ในไฟล์ `main.js` และ `href` ของปุ่ม LINE
  ลอยมุมขวาล่าง (`.line-fab`) ในไฟล์ `index.html`
- ถ้าราคา/เมนูเปลี่ยน แก้ที่ตัวแปร `bowlMenus` และ `addonMenus` ใน `main.js`

### 4. รันบน GitHub Pages

1. สร้าง repo ใหม่บน GitHub แล้วอัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้นไป
2. ไปที่ **Settings → Pages**
3. Source เลือก **Deploy from a branch** → Branch เลือก `main` และโฟลเดอร์
   `/ (root)` → Save
4. รอ 1-2 นาที จะได้ลิงก์เว็บรูปแบบ
   `https://ชื่อบัญชี.github.io/ชื่อ-repo/`
5. แชร์ลิงก์นี้ในกลุ่มไลน์หมู่บ้าน หรือทำเป็น QR Code ติดหน้าร้านได้เลย

## เมนูที่ตั้งไว้ (แก้ได้ใน `main.js`)

**ชามก๋วยจั๊บ**
- ธรรมดา 45 บาท
- ใส่ไข่ 50 บาท
- จั้มโบ้ 60 บาท

**เพิ่มเครื่อง** (10 บาท/อย่าง)
- หมูเด้ง
- หมูยอ
- ซี่โครงหมู

## หมายเหตุเรื่องรูปภาพ

รูป `hero_bowl.jpg` และ `addon_*.png` ตัดมาจากรูปโปรโมทที่แนบมาให้
คุณภาพอาจไม่คมมาก แนะนำให้ถ่ายรูปเมนูจริงของร้านมาแทนไฟล์เหล่านี้
(ใช้ชื่อไฟล์เดิม หรือแก้ path ใน `main.js` ตัวแปร `IMG`) เพื่อความสวยงามสูงสุด

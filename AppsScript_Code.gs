/*
 * ═══════════════════════════════════════════════════════════
 *  ศ.อุบล ก๋วยจั๊บญวน - ระบบรับออเดอร์ (Google Apps Script)
 * ═══════════════════════════════════════════════════════════
 *  วิธีใช้:
 *  1. เปิด https://sheets.google.com สร้าง Sheet ใหม่ (ตั้งชื่อ Orders ก็ได้)
 *  2. เมนู ส่วนขยาย (Extensions) > Apps Script
 *  3. ลบโค้ดเดิมในไฟล์ Code.gs ทิ้งทั้งหมด แล้วแปะโค้ดนี้แทน
 *  4. แก้ค่า CHANNEL_ACCESS_TOKEN ด้านล่างให้เป็นของจริง
 *     (จาก LINE Developers Console > Messaging API > Channel access token)
 *  5. กด Deploy > New deployment > เลือก Web app
 *       - Execute as: Me
 *       - Who has access: Anyone
 *     กด Deploy แล้วคัดลอก URL ที่ได้ (ลงท้ายด้วย /exec)
 *  6. เอา URL นั้นไปวางในไฟล์ main.js ตัวแปร APPS_SCRIPT_URL
 *  7. (ถ้าต้องการแจ้งเตือนเข้า LINE ของแอดมิน) เอา URL เดียวกันไปตั้งเป็น
 *     Webhook URL ใน LINE Official Account Manager
 *     (Settings > Messaging API > Webhook settings) แล้วเปิด "Use webhook"
 *     จากนั้นแอดมินพิมพ์คุยกับ OA ตัวเอง 1 ครั้งเพื่อให้ระบบจำ userId ไว้
 * ═══════════════════════════════════════════════════════════
 */

const CHANNEL_ACCESS_TOKEN = 'PASTE_YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE';
const SHEET_NAME = 'Orders';

/* ── รับข้อมูลเข้ามาทาง POST (ทั้งจากเว็บไซต์ และจาก LINE Webhook) ── */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // กรณีที่ 1: LINE ส่ง Webhook event เข้ามา (ตอนแอดมินแอดเพื่อน/พิมพ์คุยกับ OA)
    if (data.events) {
      handleLineWebhook(data);
      return jsonOutput({ status: 'ok' });
    }

    // กรณีที่ 2: ออเดอร์จากหน้าเว็บ
    if (data.orderId) {
      handleOrder(data);
      return jsonOutput({ status: 'ok' });
    }

    return jsonOutput({ status: 'unknown_payload' });
  } catch (err) {
    return jsonOutput({ status: 'error', message: err.message });
  }
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ── จับ userId ของแอดมิน (ครั้งแรกที่แอดมินแอดเพื่อน/พิมพ์หา OA ตัวเอง) ── */
function handleLineWebhook(data) {
  const props = PropertiesService.getScriptProperties();
  data.events.forEach(function (ev) {
    if (ev.source && ev.source.userId) {
      props.setProperty('ADMIN_USER_ID', ev.source.userId);
      if (ev.replyToken) {
        replyLine(ev.replyToken, '✅ บันทึก LINE ของแอดมินเรียบร้อยแล้วครับ\nระบบจะส่งแจ้งเตือนออเดอร์ใหม่มาที่แชทนี้ทุกครั้ง 🔔');
      }
    }
  });
}

function replyLine(replyToken, text) {
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN },
    payload: JSON.stringify({ replyToken: replyToken, messages: [{ type: 'text', text: text }] })
  });
}

function pushLine(text) {
  const userId = PropertiesService.getScriptProperties().getProperty('ADMIN_USER_ID');
  if (!userId) return; // ยังไม่เคยแอดเพื่อน/ทักหา OA เลยยังไม่มี userId ให้ push
  try {
    const res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN },
      payload: JSON.stringify({ to: userId, messages: [{ type: 'text', text: text }] }),
      muteHttpExceptions: true
    });
    const code = res.getResponseCode();
    if (code !== 200) {
      logLineError(code, res.getContentText());
    }
  } catch (err) {
    logLineError('exception', err.message);
  }
}

/* ── บันทึก error ตอนส่งเข้า LINE ไม่สำเร็จ ลงชีตแยก ── */
function logLineError(code, body) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('LINE_Errors');
  if (!sheet) {
    sheet = ss.insertSheet('LINE_Errors');
    sheet.appendRow(['เวลา', 'HTTP Status / Error', 'รายละเอียดจาก LINE']);
  }
  sheet.appendRow([new Date(), code, body]);
}

/* ── บันทึกออเดอร์ลง Sheet + แจ้งเตือนเข้า LINE แอดมิน ── */
function handleOrder(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['เวลาที่บันทึก', 'เลขออเดอร์', 'วันที่', 'เวลา', 'ที่อยู่จัดส่ง', 'รายการสินค้า', 'หมายเหตุ', 'ยอดรวม (บาท)']);
  }

  const itemsText = data.items.map(function (it) {
    return it.name + ' x' + it.qty + ' (฿' + it.price + ')';
  }).join(', ');

  sheet.appendRow([
    new Date(),
    data.orderId,
    data.date,
    data.time,
    data.address,
    itemsText,
    data.note || '',
    data.total
  ]);

  const lines = [];
  lines.push('🔥 มีออเดอร์ใหม่เข้ามา!');
  lines.push('🆔 ' + data.orderId);
  lines.push('📅 ' + data.date + '  🕐 ' + data.time);
  lines.push('📍 ' + data.address);
  lines.push('━━━━━━━━━━━━━━');
  data.items.forEach(function (it) {
    lines.push('• ' + it.name + '  x' + it.qty + '  = ฿' + it.price);
  });
  lines.push('━━━━━━━━━━━━━━');
  if (data.note) {
    lines.push('📝 หมายเหตุ: ' + data.note);
  }
  lines.push('💰 ยอดรวม: ฿' + data.total);

  pushLine(lines.join('\n'));
}

function testAuth() {
  SpreadsheetApp.getActiveSpreadsheet().getName();
  PropertiesService.getScriptProperties().setProperty('test', '1');
  UrlFetchApp.fetch('https://api.line.me/v2/bot/info', {
    method: 'get',
    headers: { Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN }
  });
}

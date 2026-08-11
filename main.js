/* ══════════════════════════════════════════════════
   ฅ.อุบล ก๋วยจั๊บญวน — ระบบสั่งอาหารในหมู่บ้าน
   ══════════════════════════════════════════════════ */

const IMG = {
  b1: "bowl_45.jpg",
  b2: "bowl_50.jpg",
  b3: "bowl_60.jpg",
  a1: "addon_pork_balls.png",
  a2: "addon_pork_loaf.png",
  a3: "addon_pork_ribs.png",
};

/* ── เมนูหลัก: ชามก๋วยจั๊บ ── */
const bowlMenus = [
  { id: "b1", num: 1, name: "ธรรมดา", price: 45, icon: "🍲", desc: "ก๋วยจั๊บญวน สูตรดั้งเดิม" },
  { id: "b2", num: 2, name: "ใส่ไข่", price: 50, icon: "🥚", desc: "เพิ่มไข่ต้ม 1 ฟอง" },
  { id: "b3", num: 3, name: "จั้มโบ้", price: 60, icon: "👑", desc: "จัดเต็มทุกเครื่อง", tag: "ขายดีประจำร้าน" },
];

/* ── เพิ่มเครื่อง (topping เสริม) ── */
const addonMenus = [
  { id: "a1", num: 1, name: "หมูเด้ง", price: 10 },
  { id: "a2", num: 2, name: "หมูยอ", price: 10 },
  { id: "a3", num: 3, name: "ซี่โครงหมู", price: 10 },
];

let cart = [];

/* ── ช่องทางติดต่อ LINE ของร้าน ──
   LINE_OA_LINK   = ลิงก์เพิ่มเพื่อน LINE OA ของร้าน (@710wahdw)
   LINE_ADMIN_LINK = ลิงก์ทักแชทหาแอดมินโดยตรง (LINE ID ส่วนตัว: sarun_2018) */
const LINE_OA_LINK = "https://line.me/R/ti/p/@710wahdw";
const LINE_ADMIN_LINK = "https://line.me/ti/~pijittra1309";

function connectLine() {
  window.open(LINE_OA_LINK, "_blank");
}

function connectLineAdmin() {
  window.open(LINE_ADMIN_LINK, "_blank");
}

/* ── Build product card ── */
function buildCard(m, isAddon) {
  const best = m.tag ? `<div class="best-tag">${m.tag}</div>` : "";
  const desc = m.desc ? `<div class="card-desc">${m.desc}</div>` : "";
  const imgWrap = isAddon
    ? `<div class="card-img-wrap"><div class="card-num">${m.num}</div><img src="${IMG[m.id]}" alt="${m.name}" loading="lazy">${best}</div>`
    : `<div class="card-img-wrap"><div class="card-num">${m.num}</div><img src="${IMG[m.id]}" alt="${m.name}" loading="lazy">${best}</div>`;
  return `<div class="card">
    ${imgWrap}
    <div class="card-body">
      <h3>${m.icon ? m.icon + " " : ""}${m.name}</h3>
      ${desc}
      <div class="card-price">${m.price} บาท</div>
      <div class="qty-row">
        <label>จำนวน</label>
        <div class="qty-ctrl">
          <button class="qty-btn" onclick="chgQty('qty_${m.id}',-1)">−</button>
          <span class="qty-num" id="qty_${m.id}">1</span>
          <button class="qty-btn" onclick="chgQty('qty_${m.id}',1)">+</button>
        </div>
      </div>
      <button class="btn-add" id="btn_${m.id}" onclick="addToCart('${m.id}','${m.name}',${m.price})">+ เพิ่มลงตะกร้า</button>
    </div>
  </div>`;
}

document.getElementById("grid-bowl").innerHTML = bowlMenus.map(m => buildCard(m, false)).join("");
document.getElementById("grid-addon").innerHTML = addonMenus.map(m => buildCard(m, true)).join("");

/* ── Quantity controls ── */
function chgQty(id, d) {
  const el = document.getElementById(id);
  el.textContent = Math.max(1, Math.min(99, parseInt(el.textContent) + d));
}

/* ── Add to cart ── */
function addToCart(id, name, price) {
  const qty = parseInt(document.getElementById("qty_" + id).textContent);
  const ex = cart.find(c => c.id === id);
  if (ex) { ex.qty += qty; }
  else { cart.push({ id, name, price, qty, img: IMG[id] }); }
  updateCartBar();
  flashBtn(id);
  showToast("✅ เพิ่ม " + name + " x" + qty + " แล้ว!");
}

function flashBtn(id) {
  const b = document.getElementById("btn_" + id);
  b.classList.add("added");
  b.textContent = "✅ เพิ่มแล้ว!";
  setTimeout(() => { b.classList.remove("added"); b.textContent = "+ เพิ่มลงตะกร้า"; }, 1500);
}

/* ── Price calculations ── */
function itemTotal(c) { return c.price * c.qty; }
function cartGrandTotal() { return cart.reduce((s, c) => s + itemTotal(c), 0); }
function totalCount() { return cart.reduce((s, c) => s + c.qty, 0); }

/* ── Cart bar ── */
function updateCartBar() {
  const total = cartGrandTotal();
  const count = totalCount();
  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartTotal").textContent = "฿" + total;
  document.getElementById("cartSummary").textContent = count > 0 ? cart.map(c => c.name + " x" + c.qty).join(", ") : "ยังไม่มีรายการ";
  const btn = document.getElementById("btnCheckout");
  btn.disabled = count === 0;
  btn.textContent = count > 0 ? "ดูตะกร้า (" + count + ")" : "ดูตะกร้า";
}

/* ── Modal controls ── */
let isOrderSuccess = false;

function openCart() { renderModal(); document.getElementById("modalBg").classList.add("open"); document.body.style.overflow = "hidden"; }

function closeCart() {
  document.getElementById("modalBg").classList.remove("open");
  document.body.style.overflow = "";
  if (isOrderSuccess) {
    isOrderSuccess = false;
    const btnLine = document.getElementById("btnLine");
    cart = [];
    btnLine.disabled = false;
    btnLine.innerHTML = `<span>💬</span><span>สั่งผ่าน LINE ทันที!<span class="btn-line-sub">กดเพื่อส่งออเดอร์ไปหาร้าน</span></span>`;
    btnLine.style.display = "";
    updateCartBar();
  }
}

function closeCartOutside(e) { if (e.target === document.getElementById("modalBg")) closeCart(); }

/* ── Render modal ── */
function renderModal() {
  const count = totalCount();
  const total = cartGrandTotal();
  const sub = document.getElementById("modalHeadSub");
  sub.textContent = count > 0 ? count + " รายการ • ยอดรวม ฿" + total : "ยังไม่มีสินค้าในตะกร้า";
  const body = document.getElementById("modalBody");
  const hasItems = cart.length > 0;
  const btnLine = document.getElementById("btnLine");
  btnLine.style.display = hasItems ? "flex" : "none";

  if (!hasItems) {
    body.innerHTML = `<div class="cart-empty">
      <div class="cart-empty-icon">🛒</div>
      <div class="cart-empty-text">ตะกร้าว่างอยู่ครับ</div>
      <div class="cart-empty-sub">กดเพิ่มสินค้าก่อนนะครับ</div>
    </div>`;
    return;
  }

  const itemsHTML = `<div class="cart-items-section">${cart.map((c, i) => `
    <div class="cart-item">
      <img class="ci-img" src="${c.img}" alt="${c.name}">
      <div class="ci-info">
        <div class="ci-name">${c.name}</div>
        <div class="ci-controls">
          <button class="ci-qbtn" onclick="cartChg(${i},-1)">−</button>
          <span class="ci-qnum">${c.qty}</span>
          <button class="ci-qbtn" onclick="cartChg(${i},1)">+</button>
        </div>
      </div>
      <div class="ci-right">
        <div class="ci-price">฿${itemTotal(c)}</div>
        <button class="ci-del" onclick="cartDel(${i})" title="ลบ">🗑</button>
      </div>
    </div>`).join("")}</div>`;

  const summaryItems = cart.map(c => `
    <div class="os-item">
      <div class="os-item-left">
        <div class="os-item-name">${c.name}</div>
        <div class="os-item-detail">จำนวน ${c.qty} ชาม/ที่</div>
      </div>
      <div class="os-item-price">฿${itemTotal(c)}</div>
    </div>`).join("");

  const summaryHTML = `
  <div class="section-divider"><span>สรุปรายการ</span></div>
  <div class="order-summary">
    <div class="os-header">🧾 รายการสั่งซื้อ <span class="count-chip">${count} รายการ</span></div>
    ${summaryItems}
    <div class="os-total-row">
      <div>
        <div class="os-total-label">ยอดรวมทั้งหมด</div>
      </div>
      <div class="os-total-amount">฿${total}</div>
    </div>
  </div>`;

  const formHTML = `
  <div class="section-divider"><span>ที่อยู่จัดส่งในหมู่บ้าน</span></div>
  <div class="delivery-section">
    <div class="ds-header">📍 ระบุที่อยู่จัดส่ง</div>
    <div class="ds-body">
      <div class="field-row">
        <div class="field-wrap">
          <label class="field-label">บ้านเลขที่<span class="field-required">*</span></label>
          <input class="field-input" id="fldHouseNo" type="text" placeholder="เช่น 306" maxlength="30">
          <span class="field-err">กรุณากรอกบ้านเลขที่</span>
        </div>
        <div class="field-wrap">
          <label class="field-label">ซอย / โซน</label>
          <input class="field-input" id="fldSoi" type="text" placeholder="เช่น 3" maxlength="60">
        </div>
      </div>
      <div class="field-row full">
        <div class="field-wrap">
          <label class="field-label">หมายเหตุ</label>
          <textarea class="field-input field-textarea" id="fldNote" rows="2" placeholder="เช่น ไม่ใส่ผัก, สแกน 60/40" maxlength="200"></textarea>
        </div>
      </div>
    </div>
  </div>`;

  body.innerHTML = itemsHTML + summaryHTML + formHTML;
  document.getElementById("fldHouseNo").addEventListener("input", function () {
    if (this.value.trim()) this.classList.remove("err");
  });
}

/* ── Cart item controls ── */
function cartChg(i, d) { cart[i].qty = Math.max(1, cart[i].qty + d); updateCartBar(); renderModal(); }
function cartDel(i) { cart.splice(i, 1); updateCartBar(); renderModal(); }

/* ── Form validation ── */
function validateForm() {
  const el = document.getElementById("fldHouseNo");
  if (!el || !el.value.trim()) { if (el) el.classList.add("err"); return false; }
  el.classList.remove("err");
  return true;
}

/* ── Thai date/time ── */
function getThaiDateTime() {
  const now = new Date();
  const thDate = now.toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const thTime = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return { date: thDate, time: thTime };
}

/* ── Generate Order ID ── */
function genOrderId() {
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
  return "KJ-" + ts + rnd;
}

/* ── ตั้งค่า Apps Script Web App URL (ได้จากขั้นตอน Deploy) ── */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwdBCcwekO5O0prdBLqLvTnlyEFMLHCZilpsZq5lfFCNpMLWKEZNgJ1PVbNUJW1Zvwd2g/exec";

/* ── ส่งออเดอร์ ── */
async function sendToLine() {
  if (cart.length === 0) return;
  if (!validateForm()) { showToast("⚠️ กรุณากรอกบ้านเลขที่"); return; }

  const houseNo = document.getElementById("fldHouseNo").value.trim();
  const soi = document.getElementById("fldSoi").value.trim();
  const note = document.getElementById("fldNote").value.trim();
  const total = cartGrandTotal();
  const count = totalCount();
  const addrLine = soi ? `บ้านเลขที่ ${houseNo}  ${soi}` : `บ้านเลขที่ ${houseNo}`;
  const { date, time } = getThaiDateTime();
  const orderId = genOrderId();

  const orderPayload = {
    orderId,
    date,
    time,
    address: addrLine,
    items: cart.map(c => ({ name: c.name, qty: c.qty, price: itemTotal(c) })),
    note,
    total,
    count
  };

  const btnLine = document.getElementById("btnLine");
  btnLine.disabled = true;
  const originalHTML = btnLine.innerHTML;
  btnLine.innerHTML = "<span>⏳</span><span>กำลังส่งออเดอร์...</span>";

  try {
    // ใช้ mode: no-cors เพราะ Apps Script Web App ไม่ส่ง CORS header กลับมา
    // (ทำให้อ่าน response ไม่ได้ แต่ request ยังถูกส่งและประมวลผลตามปกติ)
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(orderPayload)
    });
    showSuccess(orderPayload);
  } catch (err) {
    console.error("ส่งออเดอร์ไม่สำเร็จ:", err);
    showToast("⚠️ ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่ หรือโทรสั่งโดยตรง");
    btnLine.disabled = false;
    btnLine.innerHTML = originalHTML;
  }
}

/* ── Success screen ── */
function showSuccess(order) {
  const body = document.getElementById("modalBody");
  const btnLine = document.getElementById("btnLine");
  btnLine.style.display = "none";
  isOrderSuccess = true;
  const sub = document.getElementById("modalHeadSub");
  sub.textContent = "ส่งออเดอร์เสร็จแล้ว 🎉";

  const itemsHTML = order.items.map(it => `
    <div class="os-item">
      <div class="os-item-left">
        <div class="os-item-name">${it.name}</div>
        <div class="os-item-detail">จำนวน ${it.qty}</div>
      </div>
      <div class="os-item-price">฿${it.price}</div>
    </div>`).join("");

  body.innerHTML = `<div class="success-screen">
    <div class="success-glow">✅</div>
    <div class="success-title">ส่งออเดอร์เรียบร้อยแล้ว!</div>
    <div class="success-sub">ร้านได้รับรายการสั่งซื้อแล้วครับ<br>สามารถกดปิดได้เลย</div>
  </div>

  <div class="section-divider"><span>เลขที่ออเดอร์</span></div>
  <div class="order-summary" style="text-align:center;padding:14px;">
    <div style="font-size:18px;font-weight:900;letter-spacing:0.5px;color:var(--gold);">${order.orderId}</div>
    <div style="font-size:12px;color:var(--muted);margin-top:4px;">${order.date} • ${order.time}</div>
  </div>

  <div class="section-divider"><span>ทวนรายการสั่งซื้อ</span></div>
  <div class="order-summary">
    <div class="os-header">🧾 รายการสินค้า <span class="count-chip">${order.count} รายการ</span></div>
    ${itemsHTML}
    <div class="os-total-row">
      <div>
        <div class="os-total-label">ยอดรวมทั้งหมด</div>
        ${order.note ? `<div class="os-total-note">📝 ${order.note}</div>` : ""}
      </div>
      <div class="os-total-amount">฿${order.total}</div>
    </div>
  </div>

  <div class="section-divider"><span>จัดส่งไปที่</span></div>
  <div class="order-summary" style="padding:12px 14px;">
    <div style="font-size:14px;">📍 ${order.address}</div>
  </div>

  <div class="success-screen" style="padding-top:20px;padding-bottom:8px;min-height:auto;">
    <div class="success-countdown">กดปุ่ม ✕ ด้านบนเพื่อปิดหน้าต่างนี้ได้เลยครับ</div>
  </div>`;
}

/* ── Toast notification ── */
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

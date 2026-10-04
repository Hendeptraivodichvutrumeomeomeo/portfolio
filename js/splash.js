/*
 * MÀN MỞ ĐẦU — kiểu Red Dead Redemption 2, dựng như một đoạn motion graphic collage:
 *   1. đếm ngược phim cũ 3·2·1
 *   2. tờ báo "The Đà Nẵng Gazette" xoay vù vào; polaroid dự án, con dấu, huy hiệu, vé, nhãn định vị,
 *      vòng mực khoanh tiêu đề lần lượt bật ra kiểu stop-motion
 *   3. camera lao vào tiêu đề → màn tiêu đề: tia nắng, PORTFOLIO chữ in gỗ đập xuống từng chữ, ruy băng
 *   4. "Nhấn phím bất kỳ" → vào catalogue
 * Chỉ chạy lần đầu mỗi phiên; bỏ qua khi mở link thẳng vào một trang (#du-an) hoặc thêm ?nointro.
 * Bấm chuột, chạm hoặc nhấn phím lúc nào cũng bỏ qua được. Kiểu dáng: css/splash.css
 */
(function () {
  "use strict";
  const C = window.CATALOGUE, P = C.profile;
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } },
  };
  const hash = location.hash.slice(1);
  if (ss.get("nl-intro") || (hash && hash !== "bia") || /[?&]nointro/.test(location.search)) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const now = new Date();
  const shown = C.items.filter((it) => !it.hidden).length;
  const V = "assets/video/", ENG = "assets/engravings/web/";
  // thứ tự xuất hiện của các mảnh collage (giây, tính từ đầu)
  const at = (s) => `style="--at:${s}s"`;
  // dải phim chạy ngang ở đáy màn tiêu đề: khung hình từ các dự án
  const STRIP = ["lv1", "b4", "fn1", "led4", "bt1", "lv4", "b5", "fn3", "d1", "th1", "br5", "fn2", "ocb"];

  const polaroid = (img, cls, t, cap) => `
    <figure class="sp-pol ${cls}" ${at(t)}><span class="sp-tape"></span><img src="${V}${img}.jpg" alt=""><figcaption>${esc(cap)}</figcaption></figure>`;

  const rays = Array.from({ length: 36 }, (_, i) => `<path d="M500 500 L${(500 + 900 * Math.cos((i * 10 - 1.6) * Math.PI / 180)).toFixed(1)} ${(500 + 900 * Math.sin((i * 10 - 1.6) * Math.PI / 180)).toFixed(1)} L${(500 + 900 * Math.cos((i * 10 + 1.6) * Math.PI / 180)).toFixed(1)} ${(500 + 900 * Math.sin((i * 10 + 1.6) * Math.PI / 180)).toFixed(1)} Z"/>`).join("");

  const el = document.createElement("div");
  el.className = "splash" + (reduce ? " is-reduced" : "");
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Màn mở đầu portfolio");
  el.innerHTML = `
    <div class="sp-leader" aria-hidden="true">
      <svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88"/><circle cx="100" cy="100" r="70"/><line x1="0" y1="100" x2="200" y2="100"/><line x1="100" y1="0" x2="100" y2="200"/><line class="sp-sweep" x1="100" y1="100" x2="100" y2="14"/></svg>
      <b style="--n:0">3</b><b style="--n:1">2</b><b style="--n:2">1</b>
    </div>

    <img class="sp-bg" src="${V}b4.jpg" alt="">
    <div class="sp-stage">
      <div class="sp-board">
        <article class="sp-paper" aria-hidden="true">
          <header class="sp-mast">
            <p class="sp-ear">Ấn bản đặc biệt<br>Số ${now.getFullYear()}</p>
            <h2>The Đà Nẵng Gazette</h2>
            <p class="sp-ear">Giá: Miễn phí<br>Phát hành tại Đà Nẵng</p>
          </header>
          <p class="sp-dateline"><span>Ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}</span><span>★ Tin nóng ★</span><span>Ngoc Long &amp; Co.</span></p>
          <h3 class="sp-head">Portfolio</h3>
          <p class="sp-deck">Video editor ${esc(P.name)} ra mắt catalogue ${shown} dự án</p>
          <div class="sp-cols">
            <figure class="sp-photo"><img src="${esc(P.portrait)}" alt=""><figcaption>${esc(P.name)} tại ${esc(P.city)}</figcaption></figure>
            <div class="sp-text"><p>${esc(P.bio[0])}</p><p>${esc(P.bio[1])}</p></div>
            <div class="sp-text sp-side">
              <p class="sp-side-h">Trong số này</p>
              <ul>${C.departments.map((d) => `<li><b>${esc(d.no)}.</b> ${esc(d.name)}</li>`).join("")}</ul>
            </div>
          </div>
          <svg class="sp-ink" viewBox="0 0 100 40" preserveAspectRatio="none" ${at(2.55)}><path pathLength="1" d="M8 22 C 6 6, 40 2, 70 4 S 99 14, 94 26 S 60 39, 30 37 S 2 30, 12 12 S 50 0, 78 6"/></svg>
        </article>

        ${polaroid("b4", "p1", 2.15, "Regal × Kohler")}
        ${polaroid("lv1", "p2", 2.3, "Lợi Trần")}
        ${polaroid("led4", "p3", 2.45, "Visual QQ")}
        ${polaroid("sv1", "p4 is-v", 2.6, "Sơn Tinh Thủy Tinh")}

        <div class="sp-stamp" ${at(2.75)}><b>Đã kiểm duyệt</b><span>Catalogue · ${now.getFullYear()}</span></div>
        <div class="sp-burst b1" ${at(2.9)}><span><b>${shown}</b>dự án</span></div>
        <div class="sp-burst b2" ${at(3.0)}><span><b>40tr+</b>lượt xem</span></div>
        <div class="sp-ticket" ${at(2.85)}><span>Vé vào cửa</span><b>Nº ${String(now.getFullYear()).slice(-2)}${String(shown).padStart(2, "0")}</b><span>Miễn phí</span></div>
        <div class="sp-pin" ${at(3.1)}><svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>${esc(P.city)} · 16°04′B 108°13′Đ</div>
        <div class="sp-note" ${at(3.15)}><svg viewBox="0 0 120 60"><path pathLength="1" d="M110 8 C 80 10, 50 22, 22 46 M22 46 l4 -14 M22 46 l14 -3"/></svg><span>đây rồi!</span></div>
      </div>
    </div>

    <div class="sp-title">
      <svg class="sp-rays" viewBox="0 0 1000 1000" aria-hidden="true">${rays}</svg>
      <div class="sp-frame" aria-hidden="true"><i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i></div>
      <p class="sp-est">Ngoc Long <em>&amp;</em> Co. · Est. 2022</p>
      <img class="sp-eng l" src="${ENG}camera-carte.webp" alt="">
      <img class="sp-eng r" src="${ENG}kinetoscope.webp" alt="">
      <p class="sp-by"><i>✦</i>${esc(P.name)}<i>✦</i></p>
      <h1 class="sp-logo" aria-label="Portfolio">${"PORTFOLIO".split("").map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join("")}</h1>
      <div class="sp-ribbon"><span>Video Editor · Motion Designer · Graphic Designer</span></div>
      <p class="sp-edition"><span></span>★ Ấn bản MMXXVI · ${esc(P.city)} ★<span></span></p>
      <ul class="sp-facts">
        <li><b>${shown}</b>dự án</li>
        <li><b>${C.departments.length}</b>thể loại</li>
        <li><b>40tr+</b>lượt xem</li>
        <li><b>${C.clients.length}</b>khách hàng</li>
      </ul>
      <p class="sp-press"><kbd>↵</kbd>Nhấn phím bất kỳ để mở catalogue</p>
      <div class="sp-strip" aria-hidden="true"><div class="sp-strip-track">${[0, 1].map(() => STRIP.map((id) => `<img src="${V}${id}.jpg" alt="">`).join("")).join("")}</div></div>
    </div>

    <div class="sp-grain"></div>
    <button class="sp-skip" type="button">Bỏ qua ▸</button>`;
  document.body.classList.add("splash-on");
  document.body.appendChild(el);

  const TITLE_AT = reduce ? 0 : 3900;
  const timer = setTimeout(() => el.classList.add("show-title"), TITLE_AT);

  let closing = false;
  function close(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (closing) return;
    closing = true;
    clearTimeout(timer);
    ss.set("nl-intro", "1");
    el.classList.add("show-title", "closing");
    document.removeEventListener("keydown", close, true);
    setTimeout(() => {
      el.remove();
      document.body.classList.remove("splash-on");
      document.dispatchEvent(new Event("splashdone"));
    }, reduce ? 0 : 650);
  }
  document.addEventListener("keydown", close, true);
  el.addEventListener("click", close);
  el.addEventListener("touchend", close, { passive: false });
})();

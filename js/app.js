(function () {
  "use strict";

  const C = window.CATALOGUE;
  // tranh khắc public domain (assets/engravings/web, nguồn: credits.json)
  const ENG = "assets/engravings/web/";
  const ill = (name, cls = "", alt = "") => `<img class="ill ${cls}" src="${ENG}${name}.webp" alt="${alt}" loading="lazy">`;
  // chỉ dùng tranh nét mực nền trong (không dùng bản in chữ nhật nền tối)
  const DEPT_ART = {
    lv: ["tel-gentleman", "tel-phonograph-use"], fn: ["praxinoscope-1879", "tel-lambrigot"],
    sv: ["kinetoscope", "mutoscope"], br: ["camera-carte", "tel-phonograph-sheet"], led: ["tel-phonautograph", "praxinoscope-1879"],
    fd: ["tel-earpiece", "tel-bell"], nw: ["tel-couple", "tel-gentleman"], rv: ["tel-lambrigot", "tel-phonograph-sheet"],
  };
  const P = C.profile;
  const STAT_LABELS = ["Nhịp dựng", "Màu sắc", "Motion", "Âm thanh", "Kể chuyện"];
  const TURN_MS = 720;
  const VIDEO_DIR = "assets/video/";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } },
  };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isNarrow = () => window.matchMedia("(max-width: 899px)").matches;
  const itemById = Object.fromEntries(C.items.map((it) => [it.id, it]));
  const SHOWN = C.items.filter((it) => !it.hidden); // dự án có mục riêng (không tính video trong gallery)
  const deptOf = (key) => C.departments.find((d) => d.key === key);

  // tỉ lệ rộng/cao của một dự án
  const ratioOf = (it) => it.ratio || (it.orient === "v" ? "9/16" : "16/9");
  const aspect = (it) => { const [w, h] = ratioOf(it).split("/").map(Number); return w / h; };
  // dự án đăng trên YouTube (it.yt = mã video): ảnh bìa lấy từ YouTube, xem bằng trình phát nhúng
  const ytImg = (id, q = "maxresdefault") => `https://i.ytimg.com/vi/${id}/${q}.jpg`;
  const ytFallback = (id) => `onerror="this.onerror=null;this.src='${ytImg(id, "mqdefault")}'"`;
  const poster = (it) => (it.yt ? ytImg(it.yt) : VIDEO_DIR + it.id + ".jpg");
  // làm tròn xuống để không phóng đại: 3.951.854 → "3,9 triệu"
  const fmtViews = (n) => (n >= 1e6 ? `${String(Math.floor(n / 1e5) / 10).replace(".", ",")} triệu` : `${Math.floor(n / 1e3)} nghìn`);

  /* ───────────── Danh sách trang ───────────── */
  const pages = [];
  const itemPage = {}; // id → index trang chứa dự án
  const itemNo = {};   // id → số thứ tự trong mục

  pages.push({ type: "cover", slug: "bia", label: "Trang bìa", section: "Trang bìa" });
  pages.push({ type: "about", slug: "gioi-thieu", label: "Giới thiệu", section: "Giới thiệu" });
  pages.push({ type: "record", slug: "ho-so", label: "Kinh nghiệm làm việc", section: "Kinh nghiệm" });
  pages.push({ type: "skills", slug: "ky-nang", label: "Học vấn & Kỹ năng", section: "Kỹ năng" });
  pages.push({ type: "index", slug: "muc-luc", label: "Mục lục", section: "Mục lục" });

  // chia danh sách còn lại thành trang 3 video dọc / 4 video ngang / 2 video lẫn lộn
  const chunk = (items) => {
    if (!items.length) return [];
    const allV = items.every((it) => it.orient === "v");
    const allH = items.every((it) => it.orient === "h");
    // tối đa 3 dự án mỗi trang, chia đều để không có trang chỉ một dự án (4 → 2 + 2)
    const pagesN = Math.ceil(items.length / 3);
    const out = [];
    let i = 0;
    for (let k = 0; k < pagesN; k++) {
      const n = Math.ceil((items.length - i) / (pagesN - k));
      out.push(items.slice(i, i + n));
      i += n;
    }
    return out;
  };

  let illus = 0;
  C.departments.forEach((d) => {
    const its = C.items.filter((it) => it.dept === d.key);
    its.filter((it) => !it.hidden).forEach((it, k) => (itemNo[it.id] = k + 1));
    pages.push({ type: "dept", dept: d, items: its.filter((it) => !it.hidden), slug: "muc-" + d.key, label: d.name, section: d.name });
    its.filter((it) => it.featured).forEach((it) => {
      itemPage[it.id] = pages.length;
      pages.push({ type: "item", item: it, dept: d, n: itemNo[it.id], illus: ++illus, slug: it.id, label: it.title, section: d.name });
    });
    // dự án "hidden" nằm trong gallery của một dự án khác → trỏ về trang của dự án đó
    its.filter((it) => it.gallery).forEach((it) => it.gallery.forEach((g) => (itemPage[g] = itemPage[it.id])));
    chunk(its.filter((it) => !it.featured && !it.hidden)).forEach((group, g, all) => {
      group.forEach((it) => (itemPage[it.id] = pages.length));
      pages.push({ type: "list", dept: d, items: group, part: g + 1, parts: all.length, slug: `muc-${d.key}-${g + 1}`, label: `${d.name} · trang ${g + 1}`, section: d.name });
    });
  });
  pages.push({ type: "clients", slug: "khach-hang", label: "Khách hàng", section: "Khách hàng" });
  pages.push({ type: "contact", slug: "lien-he", label: "Liên hệ", section: "Liên hệ" });
  pages.push({ type: "back", slug: "bia-sau", label: "Bìa sau", section: "Bìa sau" });

  const indexOf = (slug) => pages.findIndex((p) => p.slug === slug);
  const pageOfDept = (key) => indexOf("muc-" + key);

  /* ───────────── Mảnh trang trí ───────────── */
  const flourish = (cls) => `
    <svg class="flourish ${cls}" viewBox="0 0 120 40" aria-hidden="true">
      <path d="M4 20c14-14 28-14 36 0s22 14 30 0 18-12 26-4c6 6 2 14-4 12-5-2-4-8 1-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M40 20c-6 8-16 10-22 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="4" cy="20" r="3" fill="currentColor"/>
    </svg>`;

  const globe = `
    <svg class="globe" viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 90 Q200 -10 400 90" fill="none" stroke="currentColor" stroke-width="1.4"/>
      ${[0.22, 0.42, 0.62].map((t) => `<path d="M${40 * t * 2.5} 90 Q200 ${-10 + 90 * t} ${400 - 40 * t * 2.5} 90" fill="none" stroke="currentColor" stroke-width=".7"/>`).join("")}
      ${[-150, -95, -45, 0, 45, 95, 150].map((x) => `<path d="M${200 + x} 90 Q${200 + x * 0.55} 30 ${200 + x * 0.25} ${40 - Math.abs(x) * 0.02}" fill="none" stroke="currentColor" stroke-width=".7"/>`).join("")}
    </svg>`;

  // tiêu đề bìa: tên tác giả nhỏ uốn vòm + chữ PORTFOLIO lớn, đỏ khối nổi với bóng gạch chéo vàng (như "WHEELER, RAWSON")
  const coverName = () => {
    // một dòng chữ gồm nhiều lớp: bóng gạch chéo → khối nổi → chữ chính → viền sáng
    const layers = (attrs, content, depth) => `
      <text ${attrs} class="cn-hatch" transform="translate(${depth + 5} ${depth + 4})">${content}</text>
      ${Array.from({ length: depth / 2 }, (_, k) => (k + 1) * 2).reverse().map((o) => `<text ${attrs} class="cn-depth" transform="translate(${o} ${o})">${content}</text>`).join("")}
      <text ${attrs} class="cn-main">${content}</text>
      <text ${attrs} class="cn-shine" transform="translate(-1.6 -1.6)">${content}</text>`;
    const rays = Array.from({ length: 23 }, (_, i) => {
      const a = Math.PI * (i / 22), r = 500;
      return `<line x1="400" y1="360" x2="${(400 - Math.cos(a) * r).toFixed(1)}" y2="${(360 - Math.sin(a) * r).toFixed(1)}"/>`;
    }).join("");
    return `
      <svg class="cn" viewBox="0 0 800 360" aria-hidden="true">
        <defs>
          <pattern id="cnHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="3.8" height="7" fill="#a67c3a"/>
          </pattern>
          <path id="cnArc" d="M 150 160 Q 400 44 650 160"/>
          <clipPath id="cnClip"><rect x="0" y="0" width="800" height="360"/></clipPath>
        </defs>
        <g class="cn-rays" clip-path="url(#cnClip)">${rays}</g>
        <g class="cn-by"><text font-size="22" text-anchor="middle" x="400" y="22" class="cn-small">— một tuyển tập của —</text></g>
        <g class="cn-first">${layers('font-size="60" text-anchor="middle"', `<textPath href="#cnArc" startOffset="50%">${esc(P.name.toUpperCase())}</textPath>`, 4)}</g>
        <g class="cn-last">${layers('x="400" y="330" font-size="178" text-anchor="middle" textLength="720" lengthAdjust="spacingAndGlyphs"', "PORTFOLIO", 8)}</g>
      </svg>`;
  };

  const seal = (text) => `
    <div class="seal" aria-hidden="true">
      <span class="seal-top">NL</span><span class="seal-amp">&amp; Co.</span><span class="seal-bot">${esc(text)}</span>
    </div>`;

  const topmarks = `<div class="topmarks" aria-hidden="true"><span></span><span></span></div>`;


  // dải phim nhựa với khung hình từ các dự án tiêu biểu
  const filmstrip = (ids = ["sv1", "lv1", "fn1", "b1", "led4", "fd2"]) => {
    const picks = ids.map((id) => itemById[id]).filter(Boolean);
    return `
      <div class="filmstrip">
        ${picks.map((it) => `<button class="film-cell" data-go="${itemPage[it.id]}" aria-label="${esc(it.title)}"><img src="${poster(it)}" alt="" loading="lazy"></button>`).join("")}
      </div>
      <p class="film-cap">Một vài khung hình từ các dự án gần đây — bấm để xem</p>`;
  };

  const facts = `
    <div class="facts">
      <div><b>2022</b><span>Bắt đầu làm chuyên nghiệp</span></div>
      <div><b>${SHOWN.length}</b><span>Dự án trong portfolio</span></div>
      <div><b>${C.departments.length}</b><span>Thể loại video</span></div>
      <div><b>${C.clients.length}+</b><span>Khách hàng đã hợp tác</span></div>
    </div>`;

  const loopVideo = (it, style = "") => it.yt
    ? `<img class="yt-thumb" src="${poster(it)}" ${ytFallback(it.yt)} style="${style}" alt="" loading="lazy">`
    : `<video muted loop playsinline preload="none" style="${style}" data-src="${VIDEO_DIR}${esc(it.id)}-loop.mp4" poster="${poster(it)}"></video>`;

  const video = (it, cls = "") => `
    <figure class="illus ${cls}" data-play="${esc(it.id)}" tabindex="0" role="button" aria-label="Xem video ${esc(it.title)}">
      <span class="frame">${loopVideo(it, `aspect-ratio:${esc(ratioOf(it))}`)}</span>
      <span class="play-badge">▶ Xem video</span>
    </figure>`;


  /* ───────────── Các mẫu trang ───────────── */
  const tpl = {
    cover() {
      return `
      <div class="sheet cover">
        <div class="cover-frame">
          <div class="cover-top">${flourish("l")}<div class="the-original">Since 2022</div>${flourish("r")}</div>
          <h1 class="cover-name"><span class="sr">${esc(P.name)}</span>${coverName()}</h1>
          <div class="cover-band">
            <div class="cover-co"><small>and</small>Co.</div>
            <div class="cover-catalogue">Video Catalogue</div>
            <div class="cover-edition">Edition Nº 2026</div>
          </div>
          <div class="cover-mid">
            <p class="cover-tag">Video Editor · Motion Designer</p>
            <div class="cover-art"><span>${ill("camera-carte")}</span><p class="cover-city">${esc(P.city)}</p><span>${ill("kinetoscope")}</span></div>
            <p class="cover-reach">${C.departments.map((d) => esc(d.name)).join(" · ")}</p>
            ${globe}
          </div>
          <div class="cover-foot">Vui lòng cho bạn bè <i>&amp;</i> đồng nghiệp xem cuốn catalogue này</div>
        </div>
      </div>`;
    },

    about() {
      return `
      <div class="sheet about">
        ${topmarks}
        <p class="kicker">Giới thiệu</p>
        <div class="hello"><h2 class="headline xl">Xin chào,</h2>${flourish("hello-orn")}<span class="hello-rule"></span></div>
        <div class="about-grid">
          <figure class="portrait">
            <span class="postmark" aria-hidden="true"><b>${esc(P.city)}</b><i>★ 2026 ★</i><b>Portfolio</b></span>
            <span class="tape t1"></span><span class="tape t2"></span>
            <img src="${esc(P.portrait)}" alt="Chân dung ${esc(P.name)}">
            <figcaption><b>${esc(P.name)}</b>${esc(P.role)}</figcaption>
          </figure>
          <div class="copy">
            ${P.bio.map((b, i) => `<p class="${i === 0 ? "lead dropcap" : ""}">${esc(b)}</p>`).join("")}
            <div class="dots"></div>
            <dl class="contact">
              <div><dt>Email</dt><dd><a href="mailto:${esc(P.email)}">${esc(P.email)}</a></dd></div>
              <div><dt>Điện thoại</dt><dd><a href="tel:${esc(P.phone.replace(/\s/g, ""))}">${esc(P.phone)}</a></dd></div>
              <div><dt>Nơi làm việc</dt><dd>${esc(P.city)}, Việt Nam</dd></div>
              <div><dt>Quê quán</dt><dd>${esc(P.hometown)}</dd></div>
              <div><dt>Ngôn ngữ</dt><dd>${esc(P.languages)}</dd></div>
            </dl>
            <p class="sign">${esc(P.name)}</p>
          </div>
        </div>
        ${filmstrip()}
        ${facts}
      </div>`;
    },

    record() {
      const half = Math.ceil(C.record.length / 2);
      const row = (r) => `<li><span class="what"><b>${esc(r.what)}</b><span class="when">${esc(r.when)}</span></span><span class="where">${esc(r.where)}</span></li>`;
      return `
      <div class="sheet record">
        ${topmarks}
        <p class="kicker">Hồ sơ · Mốc thời gian tính từ video đầu tiên đến video cuối cùng</p>
        <h2 class="headline">Kinh nghiệm làm việc</h2>
        <div class="xp">
          <ol class="xp-col">${C.record.slice(0, half).map(row).join("")}</ol>
          <ol class="xp-col">${C.record.slice(half).map(row).join("")}</ol>
        </div>
        <p class="xp-foot">Freelance Video Editor · Motion Designer · Graphic Designer từ 2022 · ${C.record.length} khách hàng &amp; đơn vị</p>
      </div>`;
    },

    skills() {
      const row = (r) => `<li><span class="when">${esc(r.when)}</span><b>${esc(r.what)}</b><span class="where">${esc(r.where)}</span></li>`;
      return `
      <div class="sheet record skills">
        ${topmarks}
        <p class="kicker">Hồ sơ</p>
        <h2 class="headline">Học vấn &amp; kỹ năng</h2>
        <div class="record-grid">
          <div class="record-col">
            <h3 class="sub">Học vấn</h3>
            <ol class="timeline">${C.education.map(row).join("")}</ol>
            <h3 class="sub">Ngôn ngữ</h3>
            <p>${esc(P.languages)}</p>
            <h3 class="sub">Quê quán</h3>
            <p>${esc(P.hometown)}</p>          </div>
          <div class="record-col">
            <h3 class="sub">Phần mềm</h3>
            <p class="chip-label">Thành thạo</p>
            <div class="chips">${C.software.main.map((s) => `<span class="chip strong">${esc(s)}</span>`).join("")}</div>
            <p class="chip-label">Sử dụng tốt</p>
            <div class="chips">${C.software.more.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>
            <h3 class="sub">Kỹ năng mềm</h3>
            <div class="chips">${P.softSkills.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>
            <h3 class="sub">Quan tâm</h3>
            <p class="small">${esc(P.interests)}</p>
          </div>
        </div>
        ${filmstrip(["fn2", "d1", "lv2", "fn3", "b4", "a5"])}
        ${facts}
      </div>`;
    },

    index() {
      const line = (no, title, sub, i) => `
        <li><button data-go="${i}">
          <span class="no">${esc(no)}</span>
          <span class="t">${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ""}</span>
          <span class="leader"></span>
          <span class="pg">${pad(i + 1)}</span>
        </button></li>`;
      return `
      <div class="sheet index">
        ${topmarks}
        <div class="index-head">
          <span class="index-art l" aria-hidden="true">${ill("praxinoscope-1879")}</span>
          <div>
            <h2 class="headline xl center">Mục lục</h2>
            <p class="center italic">${SHOWN.length} dự án trong ${C.departments.length} mục. Lật trang bằng phím Q và E, hoặc chọn mục bên dưới.</p>
          </div>
          <span class="index-art r" aria-hidden="true">${ill("tel-phonautograph")}</span>
        </div>
        <ul class="contents">
          ${line("§", "Giới thiệu", "", indexOf("gioi-thieu"))}
          ${line("§", "Kinh nghiệm làm việc", "", indexOf("ho-so"))}
          ${line("§", "Học vấn & kỹ năng", "", indexOf("ky-nang"))}
          ${C.departments.map((d) => line(d.no + ".", d.name, `${d.sub} · ${SHOWN.filter((it) => it.dept === d.key).length} dự án`, pageOfDept(d.key))).join("")}
          ${line("§", "Khách hàng", "", indexOf("khach-hang"))}
          ${line("§", "Liên hệ", "", indexOf("lien-he"))}
        </ul>
      </div>`;
    },

    dept(p) {
      const d = p.dept;
      // mục có video ngang: một ảnh lớn; mục video dọc: dải 4 ảnh
      const lead = p.items[0];
      const media = lead.orient === "h"
        ? `<button class="dept-band" data-go="${itemPage[lead.id]}" aria-label="${esc(lead.title)}"><img src="${poster(lead)}" alt=""><span>Nº 01 · ${esc(lead.title)}</span></button>`
        : `<div class="dept-gallery">${p.items.slice(0, 4).map((it, k) => `
            <button class="dg" data-go="${itemPage[it.id]}" style="--r:${[-4, 3, -2, 4][k]}deg;--ar:${aspect(it).toFixed(3)}" aria-label="${esc(it.title)}">
              <img src="${poster(it)}" alt="" loading="lazy"><span>Nº ${pad(k + 1)}</span>
            </button>`).join("")}</div>`;
      return `
      <div class="sheet dept">
        <div class="dept-hero">
          <div class="dept-brand">Ngoc Long <i>&amp;</i> Co.</div>
          <span class="dept-art l" aria-hidden="true">${ill((DEPT_ART[d.key] || ["kinetoscope"])[0])}</span>
          <div class="dept-title">
          <div class="dept-room">Mục ${esc(d.no)}</div>
          <div class="dept-name" style="--dn:${Math.min(8.6, 44 / (d.name.length * 0.52)).toFixed(2)}">${esc(d.name)}</div>
          <div class="dept-ribbon">${esc(d.sub)}</div>
          </div>
          <span class="dept-art r" aria-hidden="true">${ill((DEPT_ART[d.key] || ["", "camera-carte"])[1])}</span>
        </div>
        <div class="dept-cols">
          <div>
            <p class="lead dropcap">${esc(d.intro)}</p>
            <p class="note">${esc(d.note)}</p>
          </div>
          <div>
            <h3 class="sub">Dự án trong mục</h3>
            <ol class="dept-list${p.items.length > 6 ? " many" : ""}">
              ${p.items.slice(0, 9).map((it) => `<li><button data-go="${itemPage[it.id]}"><span>${esc(it.title)}</span><span class="leader"></span><span class="pg">${esc(it.duration)}</span></button></li>`).join("")}
            </ol>
            ${p.items.length > 9 ? `<p class="note">… và ${p.items.length - 9} dự án khác ở các trang sau.</p>` : ""}
          </div>
        </div>
        ${media}
      </div>`;
    },

    item(p) {
      const it = p.item, d = p.dept;
      const flip = p.n % 2 === 0 ? " flip" : "";
      return `
      <div class="sheet item ${it.orient}${flip}${it.gallery ? " has-gallery" : ""}">
        ${topmarks}
        <header class="item-head">
          <p class="kicker">${esc(d.name)} · Nº ${pad(p.n)}</p>
          <h2 class="headline">${esc(it.headline)}</h2>
          <p class="by">${esc(it.client)} — ${esc(it.year)}</p>
        </header>
        <div class="item-body">
          ${video(it)}
          <div class="copy">
            <p class="lead dropcap">${esc(it.lead)}</p>
            ${it.sections.map((s, i) => `${i ? '<div class="dots"></div>' : ""}<h3 class="sub">${esc(s.h)}</h3><p>${esc(s.p)}</p>`).join("")}
          </div>
        </div>
        ${it.channel ? `
        <div class="channel-stats">${it.channel.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("")}</div>` : ""}
        ${it.gallery ? `
        <div class="gallery" style="--n:${it.gallery.length + 1}">
          ${[it.id, ...it.gallery].map((id, k) => itemById[id]).map((g, k) => `
            <figure class="gal${k ? "" : " is-main"}" data-play="${esc(g.id)}" tabindex="0" role="button" aria-label="Xem video ${esc(g.title)}">
              <span class="gal-img"><img src="${poster(g)}" ${g.yt ? ytFallback(g.yt) : ""} style="aspect-ratio:${esc(ratioOf(g))}" alt="" loading="lazy"><b>▶</b></span>
              <figcaption><span>Nº ${pad(k + 1)}</span> ${esc(g.title.split("·").pop().trim())} <i>${g.views ? `${fmtViews(g.views)} lượt xem` : esc(g.duration)}</i></figcaption>
            </figure>`).join("")}
        </div>` : ""}
        <div class="specs">
          ${seal(it.year.slice(-4))}
          <div class="specs-body">
            <p class="specs-title">Thông tin dự án <span>Hình minh hoạ số ${p.illus}</span></p>
            <dl>
              <div><dt>Khách hàng</dt><dd>${esc(it.client)}</dd></div>
              <div><dt>Thời gian</dt><dd>${esc(it.year)}</dd></div>
              <div><dt>Thời lượng</dt><dd>${esc(it.duration)}</dd></div>
              ${it.views
                ? `<div><dt>Lượt xem</dt><dd>${fmtViews(it.views)}</dd></div>`
                : `<div><dt>Khung hình</dt><dd>${it.ratio ? esc(it.ratio.replace("/", "×")) : it.orient === "v" ? "Dọc 9:16" : "Ngang 16:9"}</dd></div>`}
              <div><dt>Vai trò</dt><dd>${esc(it.role)}</dd></div>
              <div><dt>Công cụ</dt><dd>${it.tools.map(esc).join(", ")}</dd></div>
            </dl>
          </div>
        </div>
      </div>`;
    },

    list(p) {
      const d = p.dept;
      return `
      <div class="sheet list">
        ${topmarks}
        <p class="kicker">${esc(d.name)} · Danh sách ${p.parts > 1 ? `${p.part}/${p.parts}` : ""}</p>
        <h2 class="headline">${esc(d.name)} <span class="light">— ${esc(d.sub)}</span></h2>
        <div class="cards${p.items.length === 2 ? " two" : ""}">
          ${p.items.map((it, k) => `
            <article class="card ${it.orient}${k % 2 ? " alt" : ""}" data-card="${esc(it.id)}">
              ${video(it, "small")}
              <div class="card-text">
                <p class="card-no">Nº ${pad(itemNo[it.id])} · ${esc(it.client)} · ${esc(it.year)}</p>
                <h3 class="card-title">${esc(it.title)}</h3>
                <p class="card-desc">${esc(it.panel)}</p>
                <ul class="mini-stats">
                  ${STAT_LABELS.map((l, i) => `<li><span>${l}</span><i style="--v:${it.stats[i]}%"></i></li>`).join("")}
                </ul>
                <p class="card-meta"><span>${it.views ? `<b class="views">${fmtViews(it.views)} lượt xem</b>` : esc(it.role)}</span><button data-play="${esc(it.id)}">▶ Xem video · ${esc(it.duration)}</button></p>
              </div>
            </article>`).join("")}
        </div>
        <p class="list-foot">${esc(d.note)}</p>
      </div>`;
    },

    clients() {
      return `
      <div class="sheet clients-page">
        ${topmarks}
        <p class="kicker">Khách hàng</p>
        <h2 class="headline">Đã hợp tác cùng</h2>
        <div class="clients">
          ${C.clients.map((c) => `<div class="ad s-${esc(c.style)}"><span class="nm">${esc(c.name)}</span><span class="note">${esc(c.note)}</span></div>`).join("")}
        </div>
        <p class="center italic">Cùng nhiều nghệ sĩ, nhà hàng và doanh nghiệp khác.</p>
      </div>`;
    },

    contact() {
      return `
      <div class="sheet contact-page">
        <div class="order-tab">Liên hệ hợp tác</div>
        <div class="contact-head">
          <div>
            <h2 class="headline">Gửi lời nhắn</h2>
            <p>Bạn cần dựng video, làm motion hay visual sân khấu? Để lại thông tin, tôi sẽ phản hồi trong vòng 24 giờ.</p>
          </div>
          <span class="contact-art" aria-hidden="true">${ill("tel-bell")}</span>
        </div>
        <form class="order-form" id="orderForm" novalidate>
          <label><span>Tên của bạn</span><input name="name" autocomplete="name" required></label>
          <label><span>Email hoặc điện thoại</span><input name="contact" autocomplete="email" required></label>
          <fieldset>
            <legend>Loại video</legend>
            ${C.departments.map((d) => `<label class="check"><input type="checkbox" name="kind" value="${esc(d.name)}"><span>${esc(d.name)} <small>${esc(d.sub)}</small></span></label>`).join("")}
          </fieldset>
          <label><span>Mô tả dự án</span><textarea name="note" rows="4"></textarea></label>
          <div class="order-row">
            <button type="submit" class="order-btn">Gửi lời nhắn</button>
            <p class="order-msg" id="orderMsg" role="status"></p>
          </div>
        </form>
        <div class="order-direct">
          <span>Hoặc liên hệ trực tiếp:</span>
          <a href="mailto:${esc(P.email)}">${esc(P.email)}</a>
          <a href="tel:${esc(P.phone.replace(/\s/g, ""))}">${esc(P.phone)}</a>
        </div>
      </div>`;
    },

    back() {
      return `
      <div class="sheet back">
        <div class="back-frame">
          ${flourish("l")}
          <p class="back-line">Cảm ơn bạn</p>
          <p class="back-line">đã xem đến trang cuối.</p>
          <p class="back-small">${C.departments.map((d) => esc(d.name)).join(" · ")}</p>
          <div class="back-emblem"><span>Ngoc Long</span><i>&amp;</i><span>Co.</span></div>
          <p class="back-contact"><a href="mailto:${esc(P.email)}">${esc(P.email)}</a><br>${esc(P.phone)} · ${esc(P.city)}</p>
          ${flourish("r")}
        </div>
        <p class="fineprint">© 2026 ${esc(P.name)}. Thiết kế lấy cảm hứng từ catalogue Wheeler, Rawson &amp; Co. trong Red Dead Redemption 2. Trang do người hâm mộ tự làm, không liên kết với Rockstar Games. Tranh khắc và khung chạm khắc thế kỷ 17–19 thuộc phạm vi công cộng, nguồn Wikimedia Commons (MET, Rijksmuseum, La Nature, Th. du Moncel).</p>
      </div>`;
    },
  };

  /* ───────────── Bảng thông tin (kiểu RDR2) ───────────── */
  const statsHtml = (vals) => `
    <ul class="p-stats">
      ${STAT_LABELS.map((l, i) => `<li><span class="lbl">${l}</span><span class="bar"><i style="--v:${vals[i]}%"></i></span></li>`).join("")}
    </ul>`;

  const itemPanel = (it) => {
    const d = deptOf(it.dept);
    return `
      <div class="p-head"><p class="p-class">${esc(d.name)} · Nº ${pad(itemNo[it.id])}</p><h2 class="p-title">${esc(it.title)}</h2></div>
      <p class="p-desc">${esc(it.panel)}</p>
      ${statsHtml(it.stats)}
      <dl class="p-info">
        <div><dt>Khách hàng</dt><dd>${esc(it.client)}</dd></div>
        <div><dt>Thời gian</dt><dd>${esc(it.year)}</dd></div>
        ${it.views ? `<div><dt>Lượt xem</dt><dd>${fmtViews(it.views)} · YouTube</dd></div>` : ""}
        <div><dt>Khung hình</dt><dd>${it.ratio ? esc(it.ratio.replace("/", "×")) : it.orient === "v" ? "Dọc 9:16" : "Ngang 16:9"}</dd></div>
        <div><dt>Vai trò</dt><dd>${esc(it.role)}</dd></div>
        <div><dt>Công cụ</dt><dd>${it.tools.map(esc).join(", ")}</dd></div>
      </dl>
      <button class="p-buy" data-play="${esc(it.id)}"><span>${it.yt ? "Xem trên YouTube" : "Xem video"}</span><b>${esc(it.duration)}</b></button>
      ${it.drive || it.youtube ? `<a class="p-buy ghost" href="${esc(it.drive || it.youtube)}" target="_blank" rel="noopener"><span>Xem bản đầy đủ</span><b>↗</b></a>` : ""}`;
  };

  const panelTpl = {
    cover: () => `
      <div class="p-head"><p class="p-class">Portfolio · 2026</p><h2 class="p-title">${esc(P.name)}</h2></div>
      <p class="p-desc">${esc(P.role)}. Mỗi trang là một dự án kèm video xem thử, thông tin và chỉ số.</p>
      <div class="p-guide">
        <div><kbd>Q</kbd><kbd>E</kbd><span>Lật trang trước / sau</span></div>
        <div><kbd>↵</kbd><span>Xem video</span></div>
        <div><kbd>M</kbd><span>Mở mục lục</span></div>
      </div>
      <button class="p-buy" data-go="${indexOf("muc-luc")}"><span>Mở mục lục</span><b>tr. ${pad(indexOf("muc-luc") + 1)}</b></button>
      <button class="p-buy ghost" data-go="${pageOfDept(C.departments[0].key)}"><span>Xem dự án</span><b>›</b></button>`,

    about: () => `
      <div class="p-head"><p class="p-class">Giới thiệu</p><h2 class="p-title">${esc(P.name)}</h2></div>
      <p class="p-desc">${esc(P.role)}</p>
      <dl class="p-info">
        <div><dt>Email</dt><dd><a href="mailto:${esc(P.email)}">${esc(P.email)}</a></dd></div>
        <div><dt>Điện thoại</dt><dd>${esc(P.phone)}</dd></div>
        <div><dt>Nơi làm việc</dt><dd>${esc(P.city)}</dd></div>
        <div><dt>Ngôn ngữ</dt><dd>${esc(P.languages)}</dd></div>
      </dl>
      <button class="p-buy" data-go="${indexOf("lien-he")}"><span>Liên hệ</span><b>tr. ${pad(indexOf("lien-he") + 1)}</b></button>`,

    skills: () => `
      <div class="p-head"><p class="p-class">Hồ sơ</p><h2 class="p-title">Kỹ năng</h2></div>
      <p class="p-desc">Phần mềm chính: ${C.software.main.map(esc).join(", ")}. Ngoài ra: ${C.software.more.map(esc).join(", ")}.</p>
      <dl class="p-info">
        <div><dt>Ngôn ngữ</dt><dd>${esc(P.languages)}</dd></div>
        <div><dt>Quê quán</dt><dd>${esc(P.hometown)}</dd></div>
      </dl>`,

    record: () => `
      <div class="p-head"><p class="p-class">Hồ sơ</p><h2 class="p-title">Kinh nghiệm</h2></div>
      <div class="p-figures">
        <div><b>2022</b><span>Bắt đầu làm chuyên nghiệp</span></div>
        <div><b>${SHOWN.length}</b><span>Dự án trong portfolio</span></div>
        <div><b>${C.clients.length}+</b><span>Khách hàng</span></div>
      </div>
      <p class="p-desc">Phần mềm chính: ${C.software.main.map(esc).join(", ")}. Ngoài ra: ${C.software.more.map(esc).join(", ")}.</p>`,

    index: () => `
      <div class="p-head"><p class="p-class">Tra cứu</p><h2 class="p-title">Mục lục</h2></div>
      <p class="p-desc">${C.departments.length} mục, ${SHOWN.length} dự án. Dự án mới được xếp trước.</p>
      <ul class="p-list">
        ${C.departments.map((d) => `<li><button data-go="${pageOfDept(d.key)}"><span>${esc(d.no)}. ${esc(d.name)}</span><small>${esc(d.sub)}</small></button></li>`).join("")}
      </ul>`,

    dept: (p) => {
      const avg = STAT_LABELS.map((_, i) => Math.round(p.items.reduce((s, it) => s + it.stats[i], 0) / p.items.length));
      return `
      <div class="p-head"><p class="p-class">Mục ${esc(p.dept.no)} · ${p.items.length} dự án</p><h2 class="p-title">${esc(p.dept.name)}</h2></div>
      <p class="p-desc">${esc(p.dept.intro)}</p>
      ${statsHtml(avg)}
      <p class="p-note">Chỉ số trung bình của ${p.items.length} dự án</p>
      <button class="p-buy" data-go="${itemPage[p.items[0].id]}"><span>Xem dự án đầu tiên</span><b>›</b></button>`;
    },

    item: (p) => itemPanel(p.item),
    list: (p, sel) => itemPanel(itemById[sel || p.items[0].id]),

    clients: () => `
      <div class="p-head"><p class="p-class">Khách hàng</p><h2 class="p-title">Đã hợp tác</h2></div>
      <p class="p-desc">Kênh YouTube, đài truyền hình, bất động sản, nhà hàng, agency và nghệ sĩ.</p>
      <div class="p-figures"><div><b>${C.clients.length}+</b><span>Thương hiệu</span></div><div><b>${SHOWN.length}</b><span>Dự án tiêu biểu</span></div></div>`,

    contact: () => `
      <div class="p-head"><p class="p-class">Liên hệ</p><h2 class="p-title">Hợp tác</h2></div>
      <p class="p-desc">Nhận dự án freelance và làm việc từ xa. Báo giá theo từng dự án.</p>
      <dl class="p-info">
        <div><dt>Email</dt><dd><a href="mailto:${esc(P.email)}">${esc(P.email)}</a></dd></div>
        <div><dt>Điện thoại</dt><dd><a href="tel:${esc(P.phone.replace(/\s/g, ""))}">${esc(P.phone)}</a></dd></div>
        <div><dt>Nơi làm việc</dt><dd>${esc(P.city)}</dd></div>
      </dl>
      <a class="p-buy" href="mailto:${esc(P.email)}"><span>Gửi email</span><b>✉</b></a>`,

    back: () => `
      <div class="p-head"><p class="p-class">Hết catalogue</p><h2 class="p-title">Cảm ơn bạn</h2></div>
      <p class="p-desc">Hẹn gặp lại ở ấn bản tiếp theo.</p>
      <button class="p-buy" data-go="0"><span>Về trang bìa</span><b>tr. 01</b></button>`,
  };

  /* ───────────── Dựng DOM ───────────── */
  const book = $("#book"), panel = $("#panel"), toc = $("#toc");
  book.innerHTML = pages.map((p, i) => `<article class="page page--${p.type}" data-i="${i}" aria-label="Trang ${i + 1}: ${esc(p.label)}">${tpl[p.type](p)}<span class="folio">${pad(i + 1)}</span></article>`).join("");
  const pageEls = $$(".page", book);
  $("#pageTotal").textContent = pad(pages.length);

  // mục lục bên trái: liệt kê từng dự án, trỏ tới trang chứa nó
  const tocRows = [];
  pages.forEach((p, i) => {
    if (p.type === "back" || p.type === "item" || p.type === "list") return;
    tocRows.push(`<li><button class="toc-item ${p.type === "dept" ? "is-dept" : ""}" data-go="${i}"><span class="no">${p.type === "dept" ? esc(p.dept.no) : ""}</span><span class="t">${esc(p.label)}</span></button></li>`);
    if (p.type === "dept") p.items.filter((it) => !it.hidden).forEach((it) => tocRows.push(`<li><button class="toc-item is-sub" data-go="${itemPage[it.id]}" data-item="${esc(it.id)}"><span class="no">${pad(itemNo[it.id])}</span><span class="t">${esc(it.title)}</span></button></li>`));
  });
  toc.innerHTML = `<div class="toc-head"><span>Mục lục</span><button class="toc-close" data-act="toc" aria-label="Đóng mục lục">✕</button></div><ul>${tocRows.join("")}</ul>`;
  const tocBtns = $$(".toc-item", toc);

  /* ───────────── Nền mờ phía sau (như thế giới game sau menu) ───────────── */
  const bgImg = $("#bgImg");
  const pageBg = (p) => {
    if (p.item) return poster(p.item);
    if (p.items) return poster(p.items[0]);
    if (p.type === "about") return P.portrait;
    return poster(C.items[0]);
  };
  function setBackdrop(src) {
    if (!bgImg || bgImg.dataset.src === src) return;
    bgImg.dataset.src = src;
    bgImg.classList.remove("on");
    const img = new Image();
    img.onload = () => { bgImg.src = src; requestAnimationFrame(() => bgImg.classList.add("on")); };
    img.src = src;
  }

  /* ───────────── Âm thanh lật trang ───────────── */
  let soundOn = store.get("nl-sound") !== "off";
  let actx = null;
  const soundBtn = $("#soundBtn");
  const syncSoundBtn = () => { soundBtn.setAttribute("aria-pressed", String(soundOn)); soundBtn.classList.toggle("off", !soundOn); };
  syncSoundBtn();
  soundBtn.addEventListener("click", () => { soundOn = !soundOn; store.set("nl-sound", soundOn ? "on" : "off"); syncSoundBtn(); });

  function flipSound() {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const sr = actx.sampleRate, dur = 0.42, n = Math.floor(sr * dur);
      const buf = actx.createBuffer(1, n, sr), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const env = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 1.6) * (1 - t * 0.6);
        d[i] = (Math.random() * 2 - 1) * env * (0.6 + 0.4 * Math.random());
      }
      const src = actx.createBufferSource(); src.buffer = buf;
      const bp = actx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.8;
      bp.frequency.setValueAtTime(2600, actx.currentTime);
      bp.frequency.exponentialRampToValueAtTime(700, actx.currentTime + dur);
      const g = actx.createGain(); g.gain.value = 0.22;
      src.connect(bp).connect(g).connect(actx.destination);
      src.start();
    } catch (e) { /* trình duyệt không hỗ trợ */ }
  }

  /* ───────────── Video ───────────── */
  function playLoops(el) {
    $$("video[data-src]", el).forEach((v) => {
      if (!v.getAttribute("src")) v.src = v.dataset.src;
      const pr = v.play(); if (pr && pr.catch) pr.catch(() => {});
    });
  }
  function pauseLoops(el) { $$("video", el).forEach((v) => v.pause()); }

  /* ───────────── Điều hướng ───────────── */
  let cur = -1, busy = false, queued = null, selected = null;

  // trang dài hơn khung (màn thấp) → hiện dải "Cuộn xuống" cho tới khi cuộn hết
  function markOverflow(el) {
    const s = el && el.querySelector(".sheet");
    if (!s) return;
    const more = !isNarrow() && s.scrollHeight - s.clientHeight - s.scrollTop > 4;
    el.classList.toggle("has-more", more);
  }
  $$(".sheet", book).forEach((s) => s.addEventListener("scroll", () => markOverflow(s.parentElement), { passive: true }));
  window.addEventListener("resize", () => markOverflow(pageEls[cur]));

  function renderPanel(p, sel) {
    panel.classList.remove("ready");
    panel.innerHTML = `<div class="panel-inner">${panelTpl[p.type](p, sel)}</div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add("ready")));
  }

  // chọn một thẻ trong trang danh sách → bảng bên phải hiện dự án đó
  function selectCard(id) {
    const p = pages[cur];
    if (p.type !== "list" || selected === id) return;
    selected = id;
    $$(".card", pageEls[cur]).forEach((c) => c.classList.toggle("is-selected", c.dataset.card === id));
    tocBtns.forEach((b) => b.classList.toggle("is-current", b.dataset.item === id));
    renderPanel(p, id);
  }

  function updateChrome() {
    const p = pages[cur];
    $("#pageNo").textContent = pad(cur + 1);
    $("#sectionTitle").textContent = p.section;
    document.title = (cur === 0 ? "" : p.label + " · ") + `${P.name} · Portfolio`;
    $("#promptPlay").hidden = !(p.type === "item" || p.type === "list");
    $$(".turn-prev, [data-act=prev]").forEach((b) => (b.disabled = cur === 0));
    $$(".turn-next, [data-act=next]").forEach((b) => (b.disabled = cur === pages.length - 1));
    selected = p.type === "list" ? p.items[0].id : null;
    $$(".card", pageEls[cur]).forEach((c) => c.classList.toggle("is-selected", c.dataset.card === selected));
    tocBtns.forEach((b) => b.classList.toggle("is-current", b.dataset.item ? b.dataset.item === (selected || (p.item && p.item.id)) : +b.dataset.go === cur));
    const active = tocBtns.find((b) => b.classList.contains("is-current"));
    if (active) active.scrollIntoView({ block: "nearest" });
    renderPanel(p, selected);
    setBackdrop(pageBg(p));
    try { history.replaceState(null, "", "#" + p.slug); } catch (e) { /* file:// */ }
  }

  /* ── Lần đầu mở một trang: "trang báo sống dậy" ──
     camera zoom vụt ra, từng khối bật lên kiểu stop-motion, vòng mực khoanh tiêu đề. Mỗi trang một lần. */
  const seen = new Set();
  const REVEAL_SEL = "h1,h2,h3,p,li,figure,label,fieldset,dl,img,svg.cn,.chips,.client,.dept-room,.dept-name,.dept-ribbon,.dept-art,.index-art,.contact-art,.filmstrip,.facts > div,.specs,.seal,.card,.gal,.order-tab,.order-row,.order-direct,.cover-top,.cover-band,.cover-foot,.globe,.dept-band,.dept-gallery,.dots";
  function inkOval(s, delay) {
    const h = s.querySelector(".dept-name, .headline.xl, .headline");
    if (!h) return;
    const r = document.createRange();
    r.selectNodeContents(h);
    const b = r.getBoundingClientRect(), sb = s.getBoundingClientRect();
    if (!b.width) return;
    const px = b.height * 0.45, py = b.height * 0.3;
    const pts = [];
    for (let k = 0; k <= 60; k++) {
      const t = -3.4 + (k / 60) * Math.PI * 2.24;
      const rx = 50 + 2.2 * Math.sin(k * 0.8), ry = 50 + 4 * Math.cos(k * 0.55);
      pts.push(`${(50 + rx * Math.cos(t)).toFixed(1)} ${(50 + ry * Math.sin(t) + k * 0.08).toFixed(1)}`);
    }
    s.insertAdjacentHTML("beforeend", `
      <svg class="ink-oval" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"
        style="left:${b.left - sb.left - px}px;top:${b.top - sb.top + s.scrollTop - py}px;width:${b.width + px * 2}px;height:${b.height + py * 2}px;--ink-d:${delay + 850}ms">
        <path d="M${pts.join(" L")}" pathLength="1"/>
      </svg>`);
  }
  function reveal(i, delay) {
    if (seen.has(i)) return;
    // đang chiếu màn mở đầu (js/splash.js): đợi nó đóng rồi mới cho trang sống dậy
    if (document.body.classList.contains("splash-on")) {
      document.addEventListener("splashdone", () => reveal(i, 80), { once: true });
      return;
    }
    seen.add(i);
    if (reduceMotion) return;
    const el = pageEls[i], s = el.querySelector(".sheet");
    const all = $$(REVEAL_SEL, s);
    const blocks = all.filter((n) => !all.some((m) => m !== n && m.contains(n)));
    blocks.forEach((n, k) => {
      n.classList.add("rv");
      n.style.setProperty("--d", Math.min(k, 24));
      n.style.setProperty("--jx", `${((k * 37) % 11) - 5}px`);
      n.style.setProperty("--jy", `${((k * 23) % 9) - 4}px`);
      n.style.setProperty("--jr", `${((k * 53) % 7) - 3}deg`);
    });
    inkOval(s, delay); // đo vị trí tiêu đề trước khi trang bị phóng to
    s.style.setProperty("--rv0", `${delay}ms`);
    el.classList.add("revealing");
    s.classList.add("reveal");
    setTimeout(() => {
      s.classList.remove("reveal");
      el.classList.remove("revealing");
      blocks.forEach((n) => n.classList.remove("rv"));
      const o = s.querySelector(".ink-oval"); if (o) o.remove();
      fitSheet(s);      // hiệu ứng xong → canh cỡ chữ và nhãn "Cuộn xuống" theo bố cục thật
      markOverflow(el);
    }, delay + 300 + Math.min(blocks.length, 24) * 60 + 3600);
  }

  function go(i, opts = {}) {
    i = Math.max(0, Math.min(pages.length - 1, i));
    if (i === cur) return;
    if (busy) { queued = i; return; }
    const from = pageEls[cur], to = pageEls[i];
    const dir = i > cur ? 1 : -1;
    const animate = from && !opts.instant && !reduceMotion && !isNarrow();

    if (from) pauseLoops(from);
    to.classList.add("is-current");
    reveal(i, animate ? (dir > 0 ? 360 : 460) : 120);
    cur = i;
    updateChrome();
    if (document.body.classList.contains("zoomed")) $(".book-wrap").scrollTop = 0;
    playLoops(to);
    markOverflow(to);
    if (document.fonts) document.fonts.ready.then(() => markOverflow(to));

    if (!from) return;
    if (isNarrow()) window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    if (!animate) {
      from.classList.remove("is-current");
      if (isNarrow() && !reduceMotion) { to.classList.remove("slide-in-l", "slide-in-r"); void to.offsetWidth; to.classList.add(dir > 0 ? "slide-in-r" : "slide-in-l"); }
      if (!opts.silent) flipSound();
      return;
    }
    busy = true;
    flipSound();
    if (dir > 0) from.classList.add("turn-out");
    else to.classList.add("turn-in");
    setTimeout(() => {
      from.classList.remove("is-current", "turn-out");
      to.classList.remove("turn-in");
      busy = false;
      if (queued !== null) { const q = queued; queued = null; go(q); }
    }, TURN_MS);
  }

  const next = () => go(cur + 1);
  const prev = () => go(cur - 1);

  function toggleToc(force) {
    const open = force ?? !document.body.classList.contains("toc-open");
    document.body.classList.toggle("toc-open", open);
  }

  /* ───────────── Cửa sổ xem video ───────────── */
  const modal = $("#modal"), mVideo = $("#modalVideo"), mYt = $("#modalYt");
  let lastFocus = null;
  function openFilm(id) {
    const p = pages[cur];
    const it = itemById[id] || p.item || (p.type === "list" && itemById[selected]);
    if (!it) return;
    lastFocus = document.activeElement;
    pauseLoops(pageEls[cur]);
    $("#modalTitle").textContent = it.title;
    // video trên web có thể là trích đoạn (tools/excerpt.py) → ghi rõ, kèm nút mở bản đầy đủ trên Drive nếu có
    const ex = (window.EXCERPTS || {})[it.id];
    const full = it.drive || it.youtube;
    const len = ex ? `Trích đoạn ${ex.len} giây / bản đầy đủ ${it.duration}` : it.duration;
    $("#modalMeta").textContent = `${it.client} · ${it.year} · ${len}${it.views ? ` · ${fmtViews(it.views)} lượt xem` : ""} · ${it.role}`;
    const fl = $("#modalFull");
    fl.hidden = !full;
    if (full) fl.href = full;
    modal.classList.toggle("is-v", it.orient === "v");
    modal.classList.toggle("is-yt", !!it.yt);
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("open"));
    if (it.yt) {
      mYt.src = `https://www.youtube-nocookie.com/embed/${it.yt}?autoplay=1&rel=0`;
    } else {
      mVideo.poster = poster(it);
      mVideo.src = VIDEO_DIR + it.id + ".mp4";
      const pr = mVideo.play(); if (pr && pr.catch) pr.catch(() => {});
    }
    $(".modal-close", modal).focus();
  }
  function closeFilm() {
    if (modal.hidden) return;
    mVideo.pause();
    mVideo.removeAttribute("src"); mVideo.load();
    mYt.removeAttribute("src");
    modal.classList.remove("open");
    modal.hidden = true;
    playLoops(pageEls[cur]);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  modal.addEventListener("click", (e) => { if (e.target === modal) closeFilm(); });

  /* ───────────── Sự kiện ───────────── */
  // chế độ phóng to để đọc: ẩn mục lục & bảng bên, trang sách dàn lại lớn hơn, cuộn để đọc
  const wrap = $(".book-wrap");
  function toggleZoom(force) {
    const on = force ?? !document.body.classList.contains("zoomed");
    document.body.classList.toggle("zoomed", on);
    const b = $("#promptZoom span"); if (b) b.textContent = on ? "Thu nhỏ" : "Phóng to";
    toggleToc(false);
    wrap.scrollTop = 0;
    requestAnimationFrame(() => markOverflow(pageEls[cur]));
  }

  const actions = { prev, next, play: () => openFilm(), toc: () => toggleToc(), close: closeFilm, zoom: () => toggleZoom() };

  document.addEventListener("click", (e) => {
    const pl = e.target.closest("[data-play]");
    if (pl) { e.preventDefault(); openFilm(pl.dataset.play); return; }
    const g = e.target.closest("[data-go]");
    if (g) { e.preventDefault(); go(+g.dataset.go); if (g.dataset.item) selectCard(g.dataset.item); toggleToc(false); return; }
    const a = e.target.closest("[data-act]");
    if (a && actions[a.dataset.act]) { e.preventDefault(); actions[a.dataset.act](); }
  });

  // rê chuột / focus vào thẻ trong trang danh sách
  book.addEventListener("mouseover", (e) => { const c = e.target.closest(".card"); if (c) selectCard(c.dataset.card); });
  book.addEventListener("focusin", (e) => { const c = e.target.closest(".card"); if (c) selectCard(c.dataset.card); });

  document.addEventListener("keydown", (e) => {
    const target = e.target instanceof Element ? e.target : document.body;
    if (target.closest("input, textarea, select")) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!modal.hidden) { if (e.key === "Escape") closeFilm(); return; }
    const k = e.key.toLowerCase();
    if (k === "q" || k === "arrowleft" || k === "pageup") { e.preventDefault(); prev(); }
    else if (k === "e" || k === "arrowright" || k === "pagedown") { e.preventDefault(); next(); }
    else if (k === "enter") {
      const t = target.closest("button, a, [data-play]");
      if (t && t.dataset.play) { e.preventDefault(); openFilm(t.dataset.play); return; }
      if (t) return; // để nút tự xử lý
      e.preventDefault(); openFilm();
    }
    else if (k === "m") toggleToc();
    else if (k === "z") toggleZoom();
    else if (k === "escape") { toggleToc(false); toggleZoom(false); }
    else if (k === "home") go(0);
    else if (k === "end") go(pages.length - 1);
  });

  // vuốt trên điện thoại
  let tx = 0, ty = 0;
  book.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  book.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) (dx < 0 ? next : prev)();
  }, { passive: true });

  // đường dẫn #id: trang, hoặc id dự án (mở trang chứa nó)
  const slugToIndex = (s) => { const i = indexOf(s); return i >= 0 ? i : (itemPage[s] ?? -1); };
  window.addEventListener("hashchange", () => {
    const s = location.hash.slice(1), i = slugToIndex(s);
    if (i >= 0 && i !== cur) { go(i); if (itemById[s]) selectCard(s); }
  });

  // form liên hệ → mở ứng dụng email
  const form = $("#orderForm");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const name = (f.get("name") || "").trim(), contact = (f.get("contact") || "").trim();
    const msg = $("#orderMsg");
    if (!name || !contact) { msg.textContent = "Bạn vui lòng điền tên và cách liên lạc."; return; }
    const kinds = f.getAll("kind");
    const body = [`Tên: ${name}`, `Liên lạc: ${contact}`, `Loại video: ${kinds.join(", ") || "(chưa chọn)"}`, "", f.get("note") || ""].join("\n");
    window.location.href = `mailto:${P.email}?subject=${encodeURIComponent("Hợp tác video: " + name)}&body=${encodeURIComponent(body)}`;
    msg.textContent = "Đang mở ứng dụng email…";
  });

  /* ───────────── Khởi động ───────────── */
  const startSlug = location.hash.slice(1);
  // desktop: mỗi trang tự phóng chữ (hệ số --k) lớn nhất có thể mà vẫn vừa trang — trang thưa chữ to hơn, trang dày giữ nguyên
  const K_STEPS = [1.16, 1.12, 1.08, 1.04, 1];
  function fitSheet(s) {
    if (isNarrow()) { s.style.removeProperty("--k"); return; }
    for (const k of K_STEPS) {
      s.style.setProperty("--k", k);
      if (s.scrollHeight <= s.clientHeight + 1) break;
    }
  }
  function fitText() {
    // trang đang chạy hiệu ứng mở (khối phóng to tạm thời) sẽ được canh lại khi hiệu ứng xong
    $$(".sheet", book).forEach((s) => { if (!s.classList.contains("reveal")) fitSheet(s); });
    markOverflow(pageEls[cur]);
  }
  let fitTimer = 0;
  window.addEventListener("resize", () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitText, 200); });
  if (document.fonts) document.fonts.ready.then(fitText); else fitText();
  // ảnh tải xong có thể đổi chiều cao trang → canh chữ và nhãn "Cuộn xuống" lại
  window.addEventListener("load", fitText);
  book.addEventListener("load", (e) => { if (e.target.tagName === "IMG") { clearTimeout(fitTimer); fitTimer = setTimeout(fitText, 150); } }, true);

  const start = slugToIndex(startSlug);
  go(start >= 0 ? start : 0, { instant: true, silent: true });
  if (itemById[startSlug]) selectCard(startSlug);
  document.body.classList.add("is-ready");
})();

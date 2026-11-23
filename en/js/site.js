/* English portfolio (collage style): renders everything from data-en.js. Videos are shared with the Vietnamese site in ../assets/video. */
(() => {
  const D = window.PORTFOLIO, P = D.profile;
  const VIDEO = "../assets/video/";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = Object.fromEntries(D.items.map((it) => [it.id, it]));
  const ratioOf = (it) => it.ratio || (it.orient === "v" ? "9/16" : "16/9");
  const ytImg = (id, q = "maxresdefault") => `https://i.ytimg.com/vi/${id}/${q}.jpg`;
  const poster = (it) => (it.yt ? ytImg(it.yt) : VIDEO + it.id + ".jpg");
  const ytFallback = (it) => (it.yt ? ` onerror="this.onerror=null;this.src='${ytImg(it.yt, "hqdefault")}'"` : "");
  const fmtViews = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : Math.round(n / 1e3) + "K") + " views";
  const PLAY = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;

  /* ---------- mép giấy xé (SVG ngẫu nhiên nhưng cố định) ---------- */
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const tear = (color, jaggedTop) => {
    const pts = [];
    for (let x = 0; x <= 600; x += 6 + rnd() * 14) pts.push(`${x.toFixed(0)} ${(jaggedTop ? 4 + rnd() * 20 : 26 - rnd() * 20).toFixed(1)}`);
    pts.push(`600 ${jaggedTop ? 12 : 14}`);
    const base = jaggedTop ? 30 : 0;
    const d = `M0 ${base}L${pts.join("L")}L600 ${base}Z`;
    return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 30' preserveAspectRatio='none'><path d='${d}' fill='${color}'/></svg>`)}")`;
  };
  const root = document.documentElement.style;
  root.setProperty("--tear-top", tear("#f4f0e6", true));
  root.setProperty("--tear-bot", tear("#f4f0e6", false));
  root.setProperty("--tear-ink-top", tear("#0c0c14", true));
  root.setProperty("--tear-ink-bot", tear("#0c0c14", false));

  /* ---------- dải chữ chạy ---------- */
  document.querySelectorAll(".ribbon-track").forEach((t) => {
    const parts = t.dataset.text.split("✦").map((s) => s.trim()).filter(Boolean);
    const run = parts.map((p) => `<span>${esc(p)}</span><span>✦</span>`).join("");
    t.innerHTML = run.repeat(3) + run.repeat(3);
  });

  /* ---------- giới thiệu ---------- */
  $("#bio").innerHTML = P.bio.map((p) => `<p>${esc(p)}</p>`).join("");
  $("#edu").innerHTML = D.education.map((e) => `<li><time>${esc(e.when)}</time><b>${esc(e.what)}</b><span>${esc(e.where)}</span></li>`).join("");
  const abbr = { "Premiere Pro": "Pr", "After Effects": "Ae", Photoshop: "Ps", Illustrator: "Ai", "DaVinci Resolve": "DaVinci", Lightroom: "Lr", Blender: "Blender", Figma: "Figma" };
  $("#soft").innerHTML = D.software.main.map((t) => `<span class="main" title="${esc(t)}">${esc(abbr[t] || t)}</span>`).join("")
    + D.software.more.map((t) => `<span title="${esc(t)}">${esc(abbr[t] || t)}</span>`).join("");
  const SHOW = 6;
  $("#exp").innerHTML = D.record.map((r, i) => `<li${i >= SHOW ? ' class="more"' : ""}><time>${esc(r.when)}</time><b>${esc(r.what)}</b><span>${esc(r.where)}</span></li>`).join("");
  const expMore = $("#expMore");
  expMore.addEventListener("click", () => {
    const open = $("#exp").classList.toggle("open");
    expMore.textContent = open ? "Show less ↑" : "See all experience ↓";
  });
  $("#interests").innerHTML = [...P.interests.split("·"), ...P.softSkills].map((s) => `<li>✦ ${esc(s.trim())}</li>`).join("")
    + `<li>✦ ${esc(P.languages)}</li>`;
  const avg = D.statLabels.map((_, k) => Math.round(D.items.reduce((s, it) => s + it.stats[k], 0) / D.items.length));
  $("#stats").innerHTML = D.statLabels.map((l, k) => `<div class="stat"><span>${esc(l)}</span><i style="--v:${avg[k]}%"></i><b>${avg[k]}</b></div>`).join("");

  /* ---------- mục lục + từng mục ---------- */
  const depts = D.departments.filter((d) => D.items.some((it) => it.dept === d.key && !it.hidden));
  $("#indexGrid").innerHTML = depts.map((d) => `<a href="#d-${d.key}"><b>${esc(d.no)}</b><span>${esc(d.name)}</span></a>`).join("");

  // 2 sticker + 1 nét vẽ cho mỗi mục
  const DECO = {
    lv: ["micP", "camB"], fn: ["cat", "controller"], rv: ["cat2", "megaphone"], sv: ["joycon", "vhs2"],
    br: ["droneP", "lensB"], led: ["projP", "laughBuddha"], fd: ["coffee", "buddhaGold"], nw: ["helmetHorn", "micRadio"],
  };
  const ROT = [-3, 2.2, -1.4, 3, -2.4, 1.2, -2, 2.6];
  const DY = ["0px", "34px", "10px", "46px", "18px", "4px"];
  const frame = (it) => `
    <span class="frame" style="aspect-ratio:${esc(ratioOf(it))}">
      ${it.yt ? `<img src="${poster(it)}"${ytFallback(it)} alt="" loading="lazy">`
             : `<video muted loop playsinline preload="none" poster="${poster(it)}" data-src="${VIDEO}${esc(it.id)}-loop.mp4"></video>`}
      <span class="play">${PLAY}</span><span class="dur">${esc(it.duration)}</span>
    </span>`;

  $("#depts").innerHTML = depts.map((d, di) => {
    const items = D.items.filter((it) => it.dept === d.key && !it.hidden);
    const feats = items.filter((it) => it.featured), rest = items.filter((it) => !it.featured);
    const tone = di % 2 ? "paper" : "blue";
    const words = d.name.split(" ");
    const last = words.pop();
    const [a, b] = DECO[d.key] || DECO.lv;
    const allV = rest.length && rest.every((it) => it.orient === "v");
    return `
    <section class="dept" id="d-${d.key}">
      <header class="dept-band">
        <span class="no">${esc(d.no)}</span>
        <h2>${words.length ? esc(words.join(" ")) + " " : ""}<em>${esc(last)}</em></h2>
        <p>${esc(d.sub)}</p>
      </header>
      <div class="dept-body ${tone}">
        <img class="sticker float" src="media/stickers/${a}.webp" alt="" style="right:2%;top:40px;--r:10deg">
        <img class="sticker float" src="media/stickers/${b}.webp" alt="" style="left:1%;bottom:40px;--r:-9deg">
        <svg class="dd" style="width:${di % 2 ? 160 : 60}px;left:${di % 2 ? 8 : 88}%;top:${di % 2 ? 30 : 55}%;color:${tone === "paper" ? "var(--blue)" : "var(--yellow)"}"><use href="#${di % 2 ? "d-loop" : "d-star"}"/></svg>
        <p class="dept-intro reveal">${esc(d.intro)}<i>${esc(d.note)}</i></p>
        ${feats.map((it, k) => `
        <article class="feature ${it.orient === "v" || ratioOf(it) === "1376/1080" ? "v" : ""}${k % 2 ? " flip" : ""} reveal">
          <div class="f-text">
            <p class="f-client">${esc(it.client)} · ${esc(it.year)}</p><br>
            <h3 class="f-title">${esc(it.headline || it.title)}</h3>
            <p class="f-lead">${esc(it.lead || it.panel)}</p>
            ${it.channel ? `<div class="channel">${it.channel.map(([n, l]) => `<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join("")}</div>` : ""}
            ${(it.sections || []).map((s) => `<h4>${esc(s.h)}</h4><p>${esc(s.p)}</p>`).join("")}
            <div class="f-tools">${it.views ? `<span class="hot">${fmtViews(it.views)}</span>` : ""}<span>${esc(it.role)}</span>${it.tools.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
            ${it.gallery ? `<div class="gallery">${it.gallery.map((g) => byId[g]).filter(Boolean).map((g) => `
              <button class="${g.orient}" data-play="${esc(g.id)}"><img src="${poster(g)}"${ytFallback(g)} alt="" loading="lazy"><span>${esc(g.title.split("·").pop().trim())} · ${g.views ? fmtViews(g.views) : esc(g.duration)}</span></button>`).join("")}</div>` : ""}
          </div>
          <button class="poster" data-play="${esc(it.id)}" aria-label="Play ${esc(it.title)}" style="--tilt:${k % 2 ? -2 : 2}deg">
            <span class="clip c-l"></span><span class="clip c-r"></span>${frame(it)}
          </button>
        </article>`).join("")}
        ${rest.length ? `<div class="wall ${allV ? "v" : ""}">${rest.map((it, k) => `
          <div class="card reveal" role="button" tabindex="0" data-play="${esc(it.id)}" aria-label="Play ${esc(it.title)}" style="--rot:${ROT[k % ROT.length]}deg;--dy:${DY[k % DY.length]}">
            ${frame(it)}
            <h4>${esc(it.title)}</h4>
            <p class="meta">${esc(it.client)} · ${it.views ? fmtViews(it.views) : esc(it.duration)}</p>
            <p>${esc(it.panel)}</p>
          </div>`).join("")}</div>` : ""}
      </div>
    </section>`;
  }).join("");

  /* ---------- nghề nghiệp: con số nổi bật dán trên bảng ---------- */
  const TAPE = ["rgba(217,242,74,.9)", "rgba(255,61,110,.85)", "rgba(255,226,58,.9)", "rgba(184,168,255,.9)"];
  const NUMBERS = [["40M+", "Views on videos I edited", "since 2022"], ["1.25M", "Subscribers on the Vui Vẻ channel", "2023 — 2025"], ["100+", "Product videos for IMUNDEX", "2026"],
    ["20+", "Episodes of the VTC food show", "2026"], [String(D.clients.length), "Clients & channels worked with", "2019 — 2026"], ["4K", "Brand films delivered up to", "Regal · Kohler · Bravo"]];
  $("#careerBoard").innerHTML = NUMBERS.map(([n, l, w], i) => `<div class="note reveal" style="--rot:${ROT[i]}deg;--tapec:${TAPE[i % TAPE.length]}"><time>${esc(w)}</time><h4>${esc(n)}</h4><p>${esc(l)}</p></div>`).join("");
  $("#clients").innerHTML = D.clients.map((c) => `<span title="${esc(c.note)}">${esc(c.name)}</span>`).join("");
  $("#contactLinks").innerHTML = `<a class="pill lime" href="mailto:${esc(P.email)}">✉ ${esc(P.email)}</a><a class="pill white" href="tel:${esc(P.phone.replace(/\s/g, ""))}">☎ ${esc(P.phone)}</a><a class="pill pink" href="../">Tiếng Việt ↗</a>`;

  /* ---------- thanh trên nền đặc khi cuộn ---------- */
  const top = $("#top");
  const onScroll = () => top.classList.toggle("solid", window.scrollY > window.innerHeight * 0.6);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- hiện dần khi cuộn tới + video xem trước chỉ chạy khi đang thấy ---------- */
  const revealIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => revealIO.observe(el));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const loopIO = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting && !reduce) {
      if (!v.src) v.src = v.dataset.src;
      v.play().catch(() => {});
    } else v.pause();
  }), { threshold: 0.35 });
  document.querySelectorAll("video[data-src]").forEach((v) => loopIO.observe(v));

  /* ---------- trình phát ---------- */
  const modal = $("#modal"), mv = $("#modalVideo"), myt = $("#modalYt"), mFull = $("#modalFull");
  const show = () => { modal.hidden = false; document.body.style.overflow = "hidden"; $("#modalClose").focus(); };
  const open = (id) => {
    const it = byId[id];
    if (!it) return;
    const ex = (window.EXCERPTS || {})[it.id];
    $("#modalTitle").textContent = it.title;
    $("#modalMeta").textContent = `${it.client} · ${it.year} · ${ex ? `${ex.len}-second excerpt of the ${it.duration} full version` : it.duration}`;
    const full = it.drive || it.youtube;
    mFull.hidden = !full;
    if (full) mFull.href = full;
    modal.classList.toggle("is-v", it.orient === "v");
    modal.classList.toggle("is-yt", !!it.yt);
    if (it.yt) myt.src = `https://www.youtube-nocookie.com/embed/${it.yt}?autoplay=1&rel=0`;
    else { mv.src = VIDEO + it.id + ".mp4"; mv.poster = poster(it); mv.play().catch(() => {}); }
    show();
  };
  // showreel = intro kiểu GTA VI, phát có tiếng
  $("#reelPlay").addEventListener("click", () => {
    $("#modalTitle").textContent = "Showreel · the intro";
    $("#modalMeta").textContent = "15 seconds · a GTA VI-style collage intro, built in code";
    mFull.hidden = true;
    modal.classList.remove("is-v", "is-yt");
    mv.src = "media/intro.mp4"; mv.poster = "media/poster.jpg"; mv.muted = false;
    mv.play().catch(() => {});
    show();
  });
  const close = () => {
    modal.hidden = true;
    mv.pause(); mv.removeAttribute("src"); mv.load();
    myt.src = "about:blank";
    document.body.style.overflow = "";
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-play]");
    if (b) { open(b.dataset.play); return; }
    if (e.target === modal) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
    else if ((e.key === "Enter" || e.key === " ") && e.target.matches?.(".card[data-play]")) { e.preventDefault(); open(e.target.dataset.play); }
  });
  $("#modalClose").addEventListener("click", close);
})();

/*
 * MÀN MỞ ĐẦU bản EN (kiểu màn khởi động game):
 *   1. màn chờ: logo NL, thanh tải intro, "Press any key" (cần 1 cú bấm để trình duyệt cho phát tiếng)
 *   2. intro GTA-style chạy toàn màn hình CÓ TIẾNG, nút Skip
 *   3. hết intro / Skip → mờ dần vào trang (hero hiện ảnh nền + tên)
 * Chỉ chạy lần đầu mỗi phiên; bỏ qua khi mở link thẳng vào một mục (#...) hoặc thêm ?nointro.
 */
(() => {
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } },
  };
  if (ss.get("nl-en-intro") || location.hash.length > 1 || /[?&]nointro/.test(location.search)) return;
  window.EN_INTRO = true;   // site.js: không tự phát intro ở hero nữa

  const el = document.createElement("div");
  el.className = "boot";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Intro");
  el.innerHTML = `
    <div class="boot-wait">
      <svg class="boot-badge" aria-hidden="true"><use href="#badge"/></svg>
      <p class="boot-name">Doan Ngoc Long</p>
      <div class="boot-bar"><i></i></div>
      <p class="boot-press"><span class="boot-loading">Loading intro…</span><span class="boot-ready"><kbd>Press any key</kbd> or tap to start <small>sound on</small></span></p>
    </div>
    <video class="boot-video" playsinline webkit-playsinline preload="auto"></video>
    <button class="boot-skip" type="button">Skip ▸</button>`;
  document.body.classList.add("boot-on");
  document.body.prepend(el);

  const v = el.querySelector(".boot-video"), bar = el.querySelector(".boot-bar i");
  // màn dọc (điện thoại cầm dọc): bản intro DỌC xếp lại bố cục; màn nhỏ nằm ngang: bản 720p nhẹ; máy tính: bản 1080p
  const portrait = matchMedia("(orientation: portrait)").matches;
  const small = matchMedia("(max-width: 900px), (pointer: coarse)").matches;
  v.src = portrait ? "media/intro-v.mp4" : small ? "media/intro-m.mp4" : "media/intro.mp4";
  // thanh tải theo phần video đã tải về; đủ để chạy mượt (hoặc sau 4 s) thì cho bấm
  const progress = () => {
    if (!v.duration || !v.buffered.length) return;
    const p = Math.min(1, v.buffered.end(v.buffered.length - 1) / v.duration);
    bar.style.width = (p * 100).toFixed(1) + "%";
  };
  const ready = () => { bar.style.width = "100%"; el.classList.add("is-ready"); };
  v.addEventListener("progress", progress);
  v.addEventListener("canplaythrough", ready, { once: true });
  setTimeout(ready, 4000);

  let started = false, closing = false;
  const start = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (started) return;
    started = true;
    el.classList.add("is-playing");
    v.muted = false;
    // play() phải gọi ngay trong cú chạm thì điện thoại mới cho phát có tiếng
    const p = v.play();
    if (p) p.catch(() => { v.muted = true; v.play().catch(finish); });   // nếu vẫn bị chặn tiếng thì phát không tiếng
  };
  v.addEventListener("playing", () => el.classList.add("is-rolling"));   // hình đã chạy: tắt chữ "Loading"
  function finish() {
    if (closing) return;
    closing = true;
    ss.set("nl-en-intro", "1");
    document.removeEventListener("keydown", onKey, true);
    el.classList.add("is-closing");
    document.dispatchEvent(new Event("introdone"));
    setTimeout(() => { v.pause(); el.remove(); document.body.classList.remove("boot-on"); }, 900);
  }
  function onKey(e) {
    if (["Shift", "Control", "Alt", "Meta", "Tab"].includes(e.key)) return;
    if (!started) start(e); else if (e.key === "Escape" || e.key === "Enter" || e.key === " ") { e.preventDefault(); finish(); }
  }
  document.addEventListener("keydown", onKey, true);
  // bấm/chạm bất kỳ đâu trên màn chờ: bắt cả touchend (điện thoại) lẫn click (chuột)
  const tap = (e) => { if (!e.target.closest(".boot-skip")) start(e); };
  el.addEventListener("touchend", tap, { passive: false });
  el.addEventListener("click", tap);
  el.querySelector(".boot-skip").addEventListener("click", (e) => { e.stopPropagation(); finish(); });
  v.addEventListener("ended", finish);
})();

/* ==========================================================================
   Vingelis Studio — script.js
   Vanilla JS: particles, reveals, hero eye, before/after, nav, form
   ========================================================================== */

(function () {
  "use strict";

  document.documentElement.classList.add("js");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- Helpers ---------- */
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const lerp = (a, b, t) => a + (b - a) * t;

  const throttleRaf = (fn) => {
    let ticking = false;
    return function (...args) {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        fn.apply(this, args);
        ticking = false;
      });
    };
  };

  /* ---------- 1. Header scroll state ---------- */
  const header = document.getElementById("siteHeader");

  const onHeaderScroll = throttleRaf(() => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  });

  window.addEventListener("scroll", onHeaderScroll, { passive: true });
  onHeaderScroll();

  /* ---------- 2. Burger menu ---------- */
  const burger = document.getElementById("burgerBtn");
  const nav = document.getElementById("mainNav");

  const closeMenu = () => {
    if (!burger || !nav) return;
    burger.classList.remove("is-active");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Открыть меню");
    nav.classList.remove("is-open");
    document.body.classList.remove("is-locked");
  };

  const toggleMenu = () => {
    if (!burger || !nav) return;
    const isOpen = nav.classList.toggle("is-open");
    burger.classList.toggle("is-active", isOpen);
    burger.setAttribute("aria-expanded", String(isOpen));
    burger.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    document.body.classList.toggle("is-locked", isOpen);
  };

  if (burger) burger.addEventListener("click", toggleMenu);

  if (nav) {
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) closeMenu();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  window.addEventListener(
    "resize",
    throttleRaf(() => {
      if (window.innerWidth > 980) closeMenu();
    })
  );

  /* ---------- 3. Active nav link on scroll ---------- */
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = navLinks
    .map((link) => {
      const id = link.getAttribute("href");
      if (!id || !id.startsWith("#")) return null;
      return document.querySelector(id);
    })
    .filter(Boolean);

  const onActiveLink = throttleRaf(() => {
    if (!sections.length) return;
    const pos = window.scrollY + window.innerHeight * 0.35;

    let current = null;
    for (const sec of sections) {
      if (sec.offsetTop <= pos) current = sec.id;
    }

    navLinks.forEach((link) => {
      link.classList.toggle(
        "is-active",
        current && link.getAttribute("href") === `#${current}`
      );
    });
  });

  window.addEventListener("scroll", onActiveLink, { passive: true });
  onActiveLink();

  /* ---------- 4. Reveal on scroll (IntersectionObserver) ---------- */
  const revealEls = document.querySelectorAll(".reveal, .reveal-stagger");

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- 5. Hero eye — scroll-driven transformation ---------- */
  const hero = document.getElementById("hero");
  const eyeNatural = document.querySelector("[data-eye-layer='natural']");
  const eyeVoluminous = document.querySelector("[data-eye-layer='voluminous']");

  const onEyeScroll = throttleRaf(() => {
    if (!hero || !eyeNatural || !eyeVoluminous) return;

    const rect = hero.getBoundingClientRect();
    const vh = window.innerHeight || 1;

    // 0 when hero top is at viewport top, 1 when hero scrolled past
    const progress = clamp(-rect.top / (rect.height || vh), 0, 1);

    eyeVoluminous.style.opacity = String(progress);
    eyeNatural.style.opacity = String(1 - progress * 0.9);

    // subtle parallax scale for "living gaze"
    eyeNatural.style.transform = `scale(${1.04 + progress * 0.04})`;
    eyeVoluminous.style.transform = `scale(${1.08 - progress * 0.03})`;
  });

  window.addEventListener("scroll", onEyeScroll, { passive: true });
  window.addEventListener("resize", onEyeScroll);
  onEyeScroll();

  /* ---------- 6. Gold particles canvas ---------- */
  const canvas = document.getElementById("gold-particles");

  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext("2d");
    let particles = [];
    let rafId = null;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const COLORS = ["#cda24d", "#e8cd93", "#9a7530"];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawn();
    };

    const spawn = () => {
      const count = clamp(Math.floor((width * height) / 26000), 28, 90);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -(Math.random() * 0.18 + 0.05),
        alpha: Math.random() * 0.35 + 0.08,
        pulse: Math.random() * Math.PI * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.012;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const glow = 0.5 + Math.sin(p.pulse) * 0.5;
        const a = p.alpha * (0.6 + glow * 0.4);

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grad.addColorStop(0, hexToRgba(p.color, a));
        grad.addColorStop(1, hexToRgba(p.color, 0));

        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = hexToRgba(p.color, a * 0.9);
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(tick);
    };

    const hexToRgba = (hex, alpha) => {
      const n = parseInt(hex.slice(1), 16);
      const r = (n >> 16) & 255;
      const g = (n >> 8) & 255;
      const b = n & 255;
      return `rgba(${r},${g},${b},${alpha})`;
    };

    resize();
    window.addEventListener("resize", throttleRaf(resize));
    rafId = requestAnimationFrame(tick);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    });
  }

  /* ---------- 7. Before / After slider ---------- */
  const baFrames = document.querySelectorAll("[data-ba]");

  baFrames.forEach((frame) => {
    const range = frame.querySelector("[data-ba-range]");
    const section = frame.closest("[data-sync-scroll]") || frame;

    let userInteracted = false;
    let dragging = false;

    const setPos = (percent) => {
      const v = clamp(percent, 0, 100);
      frame.style.setProperty("--ba", v + "%");
      if (range && range.value !== String(Math.round(v))) {
        range.value = String(Math.round(v));
      }
    };

    const posFromEvent = (e) => {
      const rect = frame.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      return (x / rect.width) * 100;
    };

    // Pointer drag
    frame.addEventListener("pointerdown", (e) => {
      userInteracted = true;
      dragging = true;
      frame.setPointerCapture?.(e.pointerId);
      setPos(posFromEvent(e));
    });

    frame.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      setPos(posFromEvent(e));
    });

    const stopDrag = () => {
      dragging = false;
    };

    frame.addEventListener("pointerup", stopDrag);
    frame.addEventListener("pointercancel", stopDrag);
    frame.addEventListener("pointerleave", stopDrag);

    // Keyboard / range input
    if (range) {
      range.addEventListener("input", () => {
        userInteracted = true;
        setPos(parseFloat(range.value) || 0);
      });
    }

    // Scroll sync — only until user touches the slider
    const onScrollSync = throttleRaf(() => {
      if (userInteracted) return;

      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 when section enters from bottom, 1 when it leaves to top
      const progress = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
      setPos(progress * 100);
    });

    window.addEventListener("scroll", onScrollSync, { passive: true });
    window.addEventListener("resize", onScrollSync);
    onScrollSync();
  });

  /* ---------- 8. Appointment form ---------- */
  const form = document.querySelector(".appointment-form");

  if (form) {
    const phoneInput = form.querySelector('input[type="tel"]');

    // Light phone mask: +7 (___) ___-__-__
    if (phoneInput) {
      phoneInput.addEventListener("input", () => {
        let digits = phoneInput.value.replace(/\D/g, "");

        if (digits.startsWith("8")) digits = "7" + digits.slice(1);
        if (!digits.startsWith("7")) digits = "7" + digits;
        digits = digits.slice(0, 11);

        let out = "+7";
        if (digits.length > 1) out += " (" + digits.slice(1, 4);
        if (digits.length >= 5) out += ") " + digits.slice(4, 7);
        if (digits.length >= 8) out += "-" + digits.slice(7, 9);
        if (digits.length >= 10) out += "-" + digits.slice(9, 11);

        phoneInput.value = out;
      });
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = form.querySelector('input[name="name"]');
      const phone = form.querySelector('input[name="phone"]');
      const service = form.querySelector('select[name="service"]');
      const consent = form.querySelector('input[name="consent"]');

      let valid = true;

      const markInvalid = (el, isInvalid) => {
        if (!el) return;
        el.style.borderColor = isInvalid ? "#7c2430" : "";
        if (isInvalid) valid = false;
      };

      markInvalid(name, !name.value.trim());
      markInvalid(
        phone,
        !phone.value || phone.value.replace(/\D/g, "").length < 11
      );
      markInvalid(service, !service.value);
      markInvalid(consent, !consent.checked);

      if (!valid) return;

      const submitBtn = form.querySelector(".btn-submit");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Отправляем…";
      }

      // Имитация отправки (без бэкенда)
      setTimeout(() => {
        form.innerHTML =
          '<div class="form-success" role="status">' +
          "Спасибо, " +
          escapeHtml(name.value.trim()) +
          "! Ваша заявка принята. " +
          "Мы свяжемся с вами в ближайшее время для подтверждения записи." +
          "</div>";
      }, 900);
    });
  }

  function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

  /* ---------- 9. Footer year ---------- */
  const yearEl = document.getElementById("currentYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 10. Smooth anchor offset for fixed header ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;

      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      closeMenu();

      const headerH = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH + 1;

      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  });
})();

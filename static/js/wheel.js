(function () {
  const COLORS = ["#b98ae0", "#e0399a", "#f5b98a", "#7fdcc4", "#f6d878", "#f6c9de", "#8ad0e0", "#f2a6c7", "#ffcf9e", "#d9b3f0"];
  const canvas = document.getElementById("wheel-canvas");
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const center = size / 2;
  const radius = size / 2;
  const segmentAngle = (2 * Math.PI) / PRIZES.length;
  const segDeg = 360 / PRIZES.length;

  function fontSizeFor(count) {
    if (count <= 4) return 30;
    if (count <= 6) return 26;
    if (count <= 8) return 21;
    return 17;
  }

  function drawWheel() {
    ctx.clearRect(0, 0, size, size);
    const fSize = fontSizeFor(PRIZES.length);
    PRIZES.forEach((prize, i) => {
      const start = i * segmentAngle - Math.PI / 2;
      const end = start + segmentAngle;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#f0c869";
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(start + segmentAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#5a1240";
      ctx.font = `700 ${fSize}px 'Baloo 2', sans-serif`;
      ctx.fillText(prize, radius - 34, fSize / 3);
      ctx.restore();
    });
  }

  function placeBulbs() {
    const wrap = document.getElementById("bulbs");
    const count = 24;
    const r = 49;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI;
      const bulb = document.createElement("div");
      bulb.className = "bulb";
      bulb.style.left = 50 + r * Math.cos(angle) + "%";
      bulb.style.top = 50 + r * Math.sin(angle) + "%";
      bulb.style.animationDelay = (i % 6) * 0.15 + "s";
      wrap.appendChild(bulb);
    }
  }

  // ---------- Confetti ringan tanpa library eksternal ----------
  const confettiCanvas = document.getElementById("confetti-canvas");
  const cctx = confettiCanvas.getContext("2d");
  let confettiParticles = [];

  function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeConfettiCanvas);
  resizeConfettiCanvas();

  function burstConfetti() {
    confettiParticles = [];
    const colors = ["#ff2f8f", "#f0c869", "#b98ae0", "#7fdcc4", "#f6d878"];
    for (let i = 0; i < 140; i++) {
      confettiParticles.push({
        x: confettiCanvas.width / 2,
        y: confettiCanvas.height / 3,
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * -10 - 4,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.35,
        life: 130,
      });
    }
    requestAnimationFrame(animateConfetti);
  }

  function animateConfetti() {
    cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let alive = false;
    confettiParticles.forEach((p) => {
      if (p.life <= 0) return;
      alive = true;
      p.vy += p.gravity * 0.1;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.life -= 1;

      cctx.save();
      cctx.translate(p.x, p.y);
      cctx.rotate((p.rotation * Math.PI) / 180);
      cctx.fillStyle = p.color;
      cctx.globalAlpha = Math.max(p.life / 130, 0);
      cctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      cctx.restore();
    });
    if (alive) requestAnimationFrame(animateConfetti);
    else cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }

  // ================= AUDIO ENGINE =================
  let audioCtx;
  function getAudioCtx() {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  // tik roda — pitch & volume ikut kecepatan sesaat (speedFactor: 1 = kencang, 0 = hampir berhenti)
  function playTick(speedFactor) {
    try {
      const ac = getAudioCtx();
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "square";
      const freq = 620 + speedFactor * 480;
      osc.frequency.setValueAtTime(freq, now);
      const vol = 0.045 + speedFactor * 0.09;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045 + (1 - speedFactor) * 0.05);
      osc.connect(gain).connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) { /* abaikan */ }
  }

  // whoosh angin selama roda berputar kencang, meredup & menurun nadanya seiring melambat
  function startWhoosh(durationSec) {
    try {
      const ac = getAudioCtx();
      const bufferSize = Math.floor(ac.sampleRate * 2);
      const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = ac.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ac.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 900;
      filter.Q.value = 0.8;

      const gain = ac.createGain();
      gain.gain.value = 0.0001;

      noise.connect(filter).connect(gain).connect(ac.destination);

      const now = ac.currentTime;
      gain.gain.linearRampToValueAtTime(0.045, now + 0.35);
      filter.frequency.linearRampToValueAtTime(2200, now + 0.5);
      filter.frequency.linearRampToValueAtTime(280, now + durationSec);
      gain.gain.linearRampToValueAtTime(0.0001, now + durationSec);

      noise.start(now);
      noise.stop(now + durationSec + 0.2);

      return {
        stop: (fadeSec = 0.15) => {
          try {
            const t = ac.currentTime;
            gain.gain.cancelScheduledValues(t);
            gain.gain.setValueAtTime(gain.gain.value, t);
            gain.gain.linearRampToValueAtTime(0.0001, t + fadeSec);
            noise.stop(t + fadeSec + 0.05);
          } catch (e) { /* abaikan */ }
        },
      };
    } catch (e) {
      return { stop: () => {} };
    }
  }

  // "thunk" pas roda benar-benar berhenti (fase overshoot selesai)
  function playStopThunk() {
    try {
      const ac = getAudioCtx();
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.2);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
      osc.connect(gain).connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) { /* abaikan */ }
  }

  // klik lembut pas roda settle sempurna di posisi akhir (habis efek mantul)
  function playSettleClick() {
    try {
      const ac = getAudioCtx();
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "triangle";
      osc.frequency.value = 520;
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.connect(gain).connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) { /* abaikan */ }
  }

  function playChime() {
    try {
      const ac = getAudioCtx();
      const now = ac.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.4);
        osc.connect(gain).connect(ac.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.45);
      });
    } catch (e) { /* abaikan */ }
  }

  // ================= POINTER ANIMATION (Web Animations API) =================
  const pointerSvg = document.getElementById("pointer-svg");

  function flickPointer(intensity = 1) {
    if (!pointerSvg.animate) return;
    const amp = 7 * intensity;
    pointerSvg.getAnimations().forEach((a) => { if (a.id === "flick") a.cancel(); });
    const anim = pointerSvg.animate(
      [
        { transform: "rotate(0deg)" },
        { transform: `rotate(${-amp}deg)`, offset: 0.35 },
        { transform: `rotate(${amp * 0.35}deg)`, offset: 0.65 },
        { transform: "rotate(0deg)" },
      ],
      { duration: 240, easing: "cubic-bezier(.36,.07,.19,.97)" }
    );
    anim.id = "flick";
  }

  function pointerStopWiggle() {
    if (!pointerSvg.animate) return;
    pointerSvg.animate(
      [
        { transform: "rotate(0deg)" },
        { transform: "rotate(-17deg)", offset: 0.15 },
        { transform: "rotate(11deg)", offset: 0.35 },
        { transform: "rotate(-7deg)", offset: 0.55 },
        { transform: "rotate(3deg)", offset: 0.75 },
        { transform: "rotate(0deg)" },
      ],
      { duration: 600, easing: "cubic-bezier(.36,.07,.19,.97)" }
    );
  }

  // idle: gerakan kecil halus tiap beberapa detik biar jarum kerasa "hidup" walau gak lagi spin
  function idlePointerBreath() {
    if (spinning) { setTimeout(idlePointerBreath, 3000); return; }
    if (pointerSvg.animate) {
      pointerSvg.animate(
        [
          { transform: "rotate(0deg)" },
          { transform: "rotate(-2.5deg)", offset: 0.5 },
          { transform: "rotate(0deg)" },
        ],
        { duration: 1400, easing: "ease-in-out" }
      );
    }
    setTimeout(idlePointerBreath, 3400 + Math.random() * 2000);
  }

  // ================= EASING =================
  function easeOutQuint(t) { return 1 - Math.pow(1 - t, 5); }
  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function tween(fromDeg, toDeg, duration, easingFn, onUpdate, onComplete) {
    const start = performance.now();
    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = easingFn(t);
      const deg = fromDeg + (toDeg - fromDeg) * eased;
      onUpdate(deg, t);
      if (t < 1) requestAnimationFrame(frame);
      else onComplete();
    }
    requestAnimationFrame(frame);
  }

  // ================= SPIN LOGIC =================
  const spinBtn = document.getElementById("spin-btn");
  const overlay = document.getElementById("result-overlay");
  const resultPrize = document.getElementById("result-prize");
  const closeBtn = document.getElementById("close-result");

  let currentRotation = 0;
  let spinning = false;

  async function handleSpin() {
    if (spinning) return;
    spinning = true;
    spinBtn.disabled = true;
    spinBtn.textContent = "MEMUTAR...";

    let index, prize;
    try {
      const res = await fetch("/api/spin", { method: "POST" });
      const data = await res.json();
      index = data.index;
      prize = data.prize;
    } catch (e) {
      index = Math.floor(Math.random() * PRIZES.length);
      prize = PRIZES[index];
    }

    const targetCenterDeg = index * segDeg + segDeg / 2;
    const extraSpins = 6 + Math.floor(Math.random() * 3); // 6-8 putaran penuh, acak tiap kali
    const fullSpins = extraSpins * 360;
    const normalizedCurrent = currentRotation % 360;
    const delta = (360 - targetCenterDeg - normalizedCurrent + 360) % 360;
    const mainTargetRotation = currentRotation + fullSpins + delta;

    const overshoot = 5 + Math.random() * 4; // 5-9 derajat "kelebihan" sebelum mantul balik
    const overshotRotation = mainTargetRotation + overshoot;
    const mainDuration = 4700 + Math.random() * 700; // 4.7-5.4 detik, sedikit acak biar gak monoton

    const whoosh = startWhoosh(mainDuration / 1000);
    let lastSeg = Math.floor(currentRotation / segDeg);

    tween(
      currentRotation,
      overshotRotation,
      mainDuration,
      easeOutQuint,
      (deg, t) => {
        canvas.style.transform = `rotate(${deg}deg)`;
        const segNow = Math.floor(deg / segDeg);
        if (segNow !== lastSeg) {
          lastSeg = segNow;
          const speedFactor = Math.max(0, 1 - t); // makin mendekati akhir, makin lambat & makin dalam nadanya
          playTick(speedFactor);
          flickPointer(0.5 + speedFactor * 0.9);
        }
      },
      () => {
        whoosh.stop(0.12);
        playStopThunk();
        pointerStopWiggle();

        // fase settle: roda mantul balik pelan dari posisi overshoot ke posisi final yang benar
        tween(
          overshotRotation,
          mainTargetRotation,
          380,
          easeOutBack,
          (deg) => {
            canvas.style.transform = `rotate(${deg}deg)`;
          },
          () => {
            currentRotation = mainTargetRotation;
            spinning = false;
            spinBtn.disabled = false;
            spinBtn.textContent = "SPIN";
            playSettleClick();
            resultPrize.textContent = prize;

            setTimeout(() => {
              overlay.classList.add("show");
              burstConfetti();
              playChime();
            }, 180);
          }
        );
      }
    );
  }

  closeBtn.addEventListener("click", () => overlay.classList.remove("show"));
  spinBtn.addEventListener("click", handleSpin);

  drawWheel();
  placeBulbs();
  setTimeout(idlePointerBreath, 2500);
})();

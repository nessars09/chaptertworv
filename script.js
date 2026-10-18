const slides = [...document.querySelectorAll(".slide")];
const musicBtn = document.getElementById("musicBtn");
const musicIcon = document.getElementById("musicIcon");
const musicLabel = document.getElementById("musicLabel");
const bgMusic = document.getElementById("bgMusic");
const heartsContainer = document.getElementById("hearts");
const replayBtn = document.getElementById("replayBtn");
const letterContent = document.getElementById("typewriterContent");

// Duplicate the photo sequence once so the marquee can loop without a visible jump.
const photoMarqueeTrack = document.querySelector(".photo-marquee-track");
if (photoMarqueeTrack && !photoMarqueeTrack.dataset.loopReady) {
  [...photoMarqueeTrack.children].forEach((figure) => {
    const clone = figure.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("img").forEach((img) => img.setAttribute("alt", ""));
    photoMarqueeTrack.appendChild(clone);
  });
  photoMarqueeTrack.dataset.loopReady = "true";
}

let currentSlide = 0;
let musicPlaying = false;
let typingRunId = 0;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function showSlide(index) {
  currentSlide = Math.max(0, Math.min(index, slides.length - 1));

  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === currentSlide);
    slide.setAttribute("aria-hidden", i === currentSlide ? "false" : "true");
  });

  if (currentSlide === 5) {
    startTypewriter();
  } else {
    typingRunId++;
  }

  if (currentSlide === slides.length - 1) createHeartBurst();
}

function nextSlide() {
  if (currentSlide < slides.length - 1) showSlide(currentSlide + 1);
}

function prevSlide() {
  if (currentSlide > 0) showSlide(currentSlide - 1);
}

// Click the right half of a slide to go forward, left half to go back.
// Interactive controls keep their own behavior and don't trigger slide changes.
document.querySelector(".presentation").addEventListener("click", (event) => {
  if (event.target.closest("button, a, input, textarea, select, .photo-marquee")) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  const clickX = event.clientX - bounds.left;
  if (clickX >= bounds.width * 0.5) nextSlide();
  else prevSlide();
});

// Cover button still advances the story.
document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    nextSlide();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.target.matches("input, textarea, select")) return;
  if (["ArrowRight", "PageDown", " "].includes(event.key)) {
    event.preventDefault();
    nextSlide();
  }
  if (["ArrowLeft", "PageUp"].includes(event.key)) {
    event.preventDefault();
    prevSlide();
  }
  if (event.key === "Home") showSlide(0);
  if (event.key === "End") showSlide(slides.length - 1);
});

// Music player
async function toggleMusic() {
  if (musicPlaying) {
    bgMusic.pause();
    musicPlaying = false;
    updateMusicUI();
    return;
  }

  try {
    await bgMusic.play();
    musicPlaying = true;
    updateMusicUI();
  } catch (error) {
    musicPlaying = false;
    updateMusicUI();
    musicLabel.textContent = "cek file song.mp3";
    console.warn("Musik belum bisa diputar:", error);
  }
}

function updateMusicUI() {
  musicIcon.textContent = musicPlaying ? "Ⅱ" : "♫";
  musicLabel.textContent = musicPlaying ? "now playing" : "play our song";
}

musicBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleMusic();
});
bgMusic.addEventListener("play", () => {
  musicPlaying = true;
  updateMusicUI();
});
bgMusic.addEventListener("pause", () => {
  musicPlaying = false;
  updateMusicUI();
});
bgMusic.addEventListener("error", () => {
  musicPlaying = false;
  musicLabel.textContent = "song not found";
});

// Word-by-word letter animation
function startTypewriter() {
  if (!letterContent) return;
  const runId = ++typingRunId;
  const paragraphs = [...letterContent.querySelectorAll("p")];

  paragraphs.forEach((paragraph) => {
    if (!paragraph.dataset.originalText) {
      paragraph.dataset.originalText = paragraph.textContent.trim();
    }
    paragraph.classList.remove("typing-visible", "typing-cursor");
    paragraph.innerHTML = "";
    const words = paragraph.dataset.originalText.split(/\s+/);
    words.forEach((word, index) => {
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = word + (index < words.length - 1 ? " " : "");
      paragraph.appendChild(span);
    });
  });

  if (reduceMotion) {
    paragraphs.forEach((p) => {
      p.classList.add("typing-visible");
      p.querySelectorAll(".word").forEach((word) => word.classList.add("word-visible"));
    });
    return;
  }

  const allWords = paragraphs.flatMap((paragraph) =>
    [...paragraph.querySelectorAll(".word")].map((word) => ({ paragraph, word }))
  );

  let index = 0;
  const step = () => {
    if (runId !== typingRunId || currentSlide !== 5) return;
    if (index >= allWords.length) {
      paragraphs.forEach((p) => p.classList.remove("typing-cursor"));
      return;
    }

    const { paragraph, word } = allWords[index];
    paragraph.classList.add("typing-visible", "typing-cursor");
    if (index > 0) allWords[index - 1].paragraph.classList.remove("typing-cursor");
    word.classList.add("word-visible");
    index++;

    const pause = /[.!?♡]$/.test(word.textContent.trim()) ? 230 : 52;
    window.setTimeout(step, pause);
  };

  step();
}

// Floating hearts
function createHeart() {
  if (reduceMotion || !heartsContainer) return;
  const heart = document.createElement("span");
  heart.className = "heart-particle";
  const symbols = ["♡", "♥", "✧"];
  heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
  heart.style.left = `${Math.random() * 100}%`;
  heart.style.fontSize = `${12 + Math.random() * 15}px`;
  heart.style.animationDuration = `${7 + Math.random() * 7}s`;
  heartsContainer.appendChild(heart);
  heart.addEventListener("animationend", () => heart.remove());
}

function createHeartBurst() {
  if (reduceMotion) return;
  for (let i = 0; i < 14; i++) window.setTimeout(createHeart, i * 100);
}

if (!reduceMotion) {
  window.setInterval(() => {
    if (document.visibilityState === "visible") createHeart();
  }, 1800);
}

replayBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  showSlide(0);
});

showSlide(0);

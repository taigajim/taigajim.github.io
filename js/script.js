window.addEventListener("load", () => {
  const DEFAULT_PERCENTAGE = 50;

  class Slider {
    constructor(sliderElement) {
      this.slider = sliderElement;
      this.beforeImage = this.slider.querySelector(".before");
      this.afterImage = this.slider.querySelector(".after");
      this.percentage = parseInt(this.slider.dataset.percentage) || DEFAULT_PERCENTAGE;
      this.isDragging = false;
      this.animationFrame = null;
      this.isHovering = false;
      this.lastPercentage = this.percentage;

      this.initBoundMethods();
      this.init();
    }

    initBoundMethods() {
      this.handleDragStart = this.handleDragStart.bind(this);
      this.handleMove = this.handleMove.bind(this);
      this.handleDragEnd = this.handleDragEnd.bind(this);
      this.handleMouseEnter = this.handleMouseEnter.bind(this);
      this.handleMouseLeave = this.handleMouseLeave.bind(this);
      this.handleResize = this.debounce(this.updateSlider.bind(this), 100);
    }

    init() {
      this.setupElements();
      this.waitForImages()
        .then(() => {
          this.isReady = true;
          this.updateSlider();
          this.attachEvents();
          console.log("Slider initialized successfully");
        })
        .catch((error) => {
          console.error("Error loading images:", error);
          this.displayError();
        });
    }

    setupElements() {
      this.sliderLine = document.createElement("div");
      this.sliderLine.classList.add("slider-line");
      this.slider.appendChild(this.sliderLine);
    }

    updateSlider() {
      this.afterImage.style.clipPath = `inset(0 ${100 - this.percentage}% 0 0)`;
      this.sliderLine.style.left = `${this.percentage}%`;
    }

    attachEvents() {
      this.beforeImage.draggable = false;
      this.afterImage.draggable = false;

      this.addEvent(this.slider, "mousedown touchstart", this.handleDragStart);
      this.addEvent(this.slider, "mousemove touchmove", this.handleMove, { passive: false });
      this.addEvent(this.slider, "mouseenter", this.handleMouseEnter);
      this.addEvent(this.slider, "mouseleave", this.handleMouseLeave);
      this.addEvent(document, "mouseup touchend", this.handleDragEnd);
      this.addEvent(window, "resize", this.handleResize);

      this.slider.dataset.initialPercentage = this.slider.dataset.percentage || DEFAULT_PERCENTAGE;
    }

    addEvent(element, events, handler, options = {}) {
      events.split(" ").forEach((event) => {
        element.addEventListener(event, handler, options);
      });
    }

    handleDragStart(e) {
      e.preventDefault();
      this.isDragging = true;
      if (e.pointerId) this.slider.setPointerCapture(e.pointerId);
      this.handleMove(e);
    }

    handleMove(e) {
      if (e.type !== "mousemove" && !this.isDragging) return;
      e.preventDefault();

      const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
      const rect = this.slider.getBoundingClientRect();
      let percentage = ((clientX - rect.left) / rect.width) * 100;
      percentage = Math.max(0, Math.min(100, percentage));

      this.percentage = this.lastPercentage = percentage;
      this.slider.dataset.percentage = percentage;
      this.updateSlider();
    }

    handleMouseEnter() {
      this.isHovering = true;
    }

    handleMouseLeave() {
      this.isHovering = false;
    }

    handleDragEnd(e) {
      this.isDragging = false;
      if (e.pointerId) this.slider.releasePointerCapture(e.pointerId);
    }

    animateTo(targetPercentage, duration = 150) {
      const startPercentage = this.percentage;
      const change = targetPercentage - startPercentage;
      const startTime = performance.now();
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);
        this.percentage = startPercentage + change * easedProgress;
        this.slider.dataset.percentage = this.percentage;
        this.updateSlider();

        if (progress < 1) {
          this.animationFrame = requestAnimationFrame(animate);
        } else {
          cancelAnimationFrame(this.animationFrame);
          this.animationFrame = null;
        }
      };

      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      this.animationFrame = requestAnimationFrame(animate);
    }

    waitForImages() {
      return new Promise((resolve) => {
        const checkImages = () => {
          const beforeLoaded = this.beforeImage.complete && this.beforeImage.naturalHeight !== 0;
          const afterLoaded = this.afterImage.complete && this.afterImage.naturalHeight !== 0;

          if (beforeLoaded && afterLoaded) {
            resolve();
          } else {
            requestAnimationFrame(checkImages);
          }
        };
        checkImages();
      });
    }

    displayError() {
      console.error("Error loading images for slider");
      this.slider.innerHTML += "<p style='color: red;'>Error loading images. Please refresh the page.</p>";
    }

    debounce(func, wait) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }

    destroy() {
      this.removeEvent(this.slider, "mousedown touchstart", this.handleDragStart);
      this.removeEvent(this.slider, "mousemove touchmove", this.handleMove);
      this.removeEvent(this.slider, "mouseenter", this.handleMouseEnter);
      this.removeEvent(this.slider, "mouseleave", this.handleMouseLeave);
      this.removeEvent(document, "mouseup touchend", this.handleDragEnd);
      this.removeEvent(window, "resize", this.handleResize);
    }

    removeEvent(element, events, handler) {
      events.split(" ").forEach((event) => {
        element.removeEventListener(event, handler);
      });
    }
  }

  function initializeSliders() {
    console.log("Initializing sliders");
    const sliders = document.querySelectorAll(".image-slider");
    sliders.forEach((slider, index) => {
      console.log(`Initializing slider ${index + 1}`);
      slider.__slider = new Slider(slider);
    });
  }

  console.log("Window loaded, calling initializeSliders");
  initializeSliders();
});

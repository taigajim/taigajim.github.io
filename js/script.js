window.addEventListener("load", () => {
  const slidersContainer = document.getElementById("sliders-container");

  class Slider {
    constructor(sliderElement) {
      this.slider = sliderElement;
      this.beforeImage = this.slider.querySelector(".before");
      this.afterImage = this.slider.querySelector(".after");
      this.percentage = parseInt(this.slider.dataset.percentage) || 50;
      this.isDragging = false;
      this.animationFrame = null;

      // Use a single bound method for both mouse and touch events
      this.handleDragStartBound = this.handleDragStart.bind(this);
      this.handleDragMoveBound = this.handleDragMove.bind(this);
      this.handleDragEndBound = this.handleDragEnd.bind(this);
      this.handleMouseMove = this.handleDragMove.bind(this);
      this.handleMouseUp = this.handleDragEnd.bind(this);
      this.handleResize = this.debounce(this.updateSlider.bind(this), 100);

      this.init();
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
        })
        .finally(() => {
          this.checkAllSlidersReady(); //only for logging
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

      [this.slider, this.sliderLine].forEach((element) => {
        element.addEventListener("mousedown", this.handleDragStartBound);
        element.addEventListener("touchstart", this.handleDragStartBound);
      });

      window.addEventListener("mousemove", this.handleDragMoveBound);
      window.addEventListener("touchmove", this.handleDragMoveBound);
      window.addEventListener("mouseup", this.handleDragEndBound);
      window.addEventListener("touchend", this.handleDragEndBound);
      window.addEventListener("resize", this.handleResize);
    }

    handleDragStart(e) {
      e.preventDefault(); // Prevent default behavior for both mouse and touch
      this.isDragging = true;

      const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
      const rect = this.slider.getBoundingClientRect();
      let percentage = ((clientX - rect.left) / rect.width) * 100;
      percentage = Math.max(0, Math.min(100, percentage));

      this.animateTo(percentage, 150);
    }

    handleDragMove(e) {
      if (!this.isDragging) return;

      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }

      const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
      const rect = this.slider.getBoundingClientRect();
      let percentage = ((clientX - rect.left) / rect.width) * 100;
      percentage = Math.max(0, Math.min(100, percentage));
      this.percentage = percentage;
      this.slider.dataset.percentage = percentage;
      this.updateSlider();
    }

    handleDragEnd() {
      this.isDragging = false;
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

      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
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

    // Debounce utility function
    debounce(func, wait) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }

    destroy() {
      [this.slider, this.sliderLine].forEach((element) => {
        element.removeEventListener("mousedown", this.handleDragStartBound);
        element.removeEventListener("touchstart", this.handleDragStartBound);
      });

      window.removeEventListener("mousemove", this.handleDragMoveBound);
      window.removeEventListener("touchmove", this.handleDragMoveBound);
      window.removeEventListener("mouseup", this.handleDragEndBound);
      window.removeEventListener("touchend", this.handleDragEndBound);

      window.removeEventListener("resize", this.handleResize);
    }
  }

  // Initialize Sliders
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

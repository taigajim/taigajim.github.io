window.addEventListener("load", () => {
  const slidersContainer = document.getElementById("sliders-container");
  const loadingElement = document.getElementById("loading");

  class Slider {
    constructor(sliderElement) {
      this.slider = sliderElement;
      this.beforeImage = this.slider.querySelector(".before");
      this.afterImage = this.slider.querySelector(".after");
      this.percentage = parseInt(this.slider.dataset.percentage) || 50;
      this.isDragging = false;
      this.animationFrame = null;

      // Bind event handlers once and store references for later removal
      this.startDragBound = this.startDrag.bind(this);
      this.handleMouseMove = this.onDrag.bind(this);
      this.handleTouchMove = this.onDrag.bind(this);
      this.handleMouseUp = this.stopDrag.bind(this);
      this.handleTouchEnd = this.stopDrag.bind(this);
      this.handleResize = this.debounce(this.updateSlider.bind(this), 100);

      this.init();
    }

    init() {
      this.setupElements();
      this.waitForImages()
        .then(() => {
          this.updateSlider();
          this.attachEvents();
          this.showContent();
          console.log("Slider initialized successfully");
        })
        .catch((error) => {
          console.error("Error loading images:", error);
          this.displayError();
        });
    }

    setupElements() {
      // Create slider line
      this.sliderLine = document.createElement("div");
      this.sliderLine.classList.add("slider-line");
      this.slider.appendChild(this.sliderLine);

      // Create left mark
      this.leftMark = document.createElement("span");
      this.leftMark.classList.add("slider-mark", "left");
      this.slider.appendChild(this.leftMark);

      // Create right mark
      this.rightMark = document.createElement("span");
      this.rightMark.classList.add("slider-mark", "right");
      this.slider.appendChild(this.rightMark);
    }

    updateSlider() {
      this.afterImage.style.clipPath = `inset(0 ${100 - this.percentage}% 0 0)`;
      this.sliderLine.style.left = `${this.percentage}%`;
      this.leftMark.style.left = `${this.percentage}%`;
      this.rightMark.style.left = `${this.percentage}%`;
    }

    attachEvents() {
      // Disable image dragging
      this.beforeImage.draggable = false;
      this.afterImage.draggable = false;

      // Consolidate Drag Initiators: Manage with an array
      const dragInitiators = [
        this.sliderLine,
        this.leftMark,
        this.rightMark,
        this.slider,
      ];
      dragInitiators.forEach((element) => {
        element.addEventListener("mousedown", this.startDragBound);
        element.addEventListener("touchstart", this.startDragBound);
      });

      // Event listeners for dragging
      window.addEventListener("mousemove", this.handleMouseMove);
      window.addEventListener("touchmove", this.handleTouchMove);

      // Event listeners for stopping drag
      window.addEventListener("mouseup", this.handleMouseUp);
      window.addEventListener("touchend", this.handleTouchEnd);

      // Prevent click on marks from triggering the slider click event
      [this.leftMark, this.rightMark].forEach((mark) => {
        mark.addEventListener("click", (e) => e.stopPropagation());
      });

      // Debounce Resize Events
      window.addEventListener("resize", this.handleResize);
    }

    showContent() {
      console.log("Showing content for a slider");
      this.slider.style.visibility = "visible";
      if (
        Array.from(document.querySelectorAll(".image-slider")).every(
          (slider) => slider.style.visibility === "visible"
        )
      ) {
        console.log("All sliders visible, hiding loading element");
        loadingElement.style.display = "none";
        slidersContainer.style.visibility = "visible";
      }
    }

    startDrag(e) {
      e.preventDefault();
      this.isDragging = true;

      let clientX;
      if (e.type.startsWith("touch")) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }

      const rect = this.slider.getBoundingClientRect();
      let percentage = ((clientX - rect.left) / rect.width) * 100;
      percentage = Math.max(0, Math.min(100, percentage));

      // Animate smoothly to the new position
      this.animateTo(percentage, 150);
    }

    onDrag(e) {
      if (!this.isDragging) return;

      // Prevent jumpiness by canceling ongoing animations
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }

      let clientX;
      if (e.type.startsWith("touch")) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }

      const rect = this.slider.getBoundingClientRect();
      let percentage = ((clientX - rect.left) / rect.width) * 100;
      percentage = Math.max(0, Math.min(100, percentage));
      this.percentage = percentage;
      this.slider.dataset.percentage = percentage;
      this.updateSlider();
    }

    stopDrag() {
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
      return new Promise((resolve, reject) => {
        const checkImages = () => {
          const beforeLoaded =
            this.beforeImage.complete && this.beforeImage.naturalHeight !== 0;
          const afterLoaded =
            this.afterImage.complete && this.afterImage.naturalHeight !== 0;

          console.log(
            `Before image loaded: ${beforeLoaded}, After image loaded: ${afterLoaded}`
          );

          if (beforeLoaded && afterLoaded) {
            resolve();
          } else {
            setTimeout(checkImages, 100); // Check again after 100ms
          }
        };

        checkImages();
      });
    }

    displayError() {
      this.slider.innerHTML = "<p>Error loading images.</p>";
      this.slider.style.display = "none";
    }

    // Debounce utility function
    debounce(func, wait) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }

    // Prevent Memory Leaks: Add destroy method to remove event listeners
    destroy() {
      // Consolidate Drag Initiators: Remove event listeners
      const dragInitiators = [
        this.sliderLine,
        this.leftMark,
        this.rightMark,
        this.slider,
      ];
      dragInitiators.forEach((element) => {
        element.removeEventListener("mousedown", this.startDragBound);
        element.removeEventListener("touchstart", this.startDragBound);
      });

      // Remove dragging event listeners
      window.removeEventListener("mousemove", this.handleMouseMove);
      window.removeEventListener("touchmove", this.handleTouchMove);
      window.removeEventListener("mouseup", this.handleMouseUp);
      window.removeEventListener("touchend", this.handleTouchEnd);

      // Remove resize event listener
      window.removeEventListener("resize", this.handleResize);
    }
  }

  // Initialize Sliders
  function initializeSliders() {
    console.log("Initializing sliders");
    const sliders = document.querySelectorAll(".image-slider");
    sliders.forEach((slider, index) => {
      console.log(`Initializing slider ${index + 1}`);
      new Slider(slider);
    });
  }

  console.log("Window loaded, calling initializeSliders");
  initializeSliders();
});

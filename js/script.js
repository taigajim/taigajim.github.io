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
      this.touchStartY = 0;
      this.touchMoveY = 0;
      this.isReady = false;

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
      this.showContent(); // Show content immediately
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
          this.checkAllSlidersReady();
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
      const dragInitiators = [this.sliderLine, this.leftMark, this.rightMark, this.slider];
      dragInitiators.forEach((element) => {
        element.addEventListener("mousedown", this.startDragBound);
        element.addEventListener("touchstart", this.handleTouchStart.bind(this));
      });

      // Event listeners for dragging
      window.addEventListener("mousemove", this.handleMouseMove);
      window.addEventListener("touchmove", this.handleTouchMove.bind(this));

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
      this.slider.style.visibility = "visible";
    }

    checkAllSlidersReady() {
      if (Array.from(document.querySelectorAll(".image-slider")).every((slider) => slider.__slider && slider.__slider.isReady)) {
        console.log("All sliders ready, hiding loading element");
        loadingElement.style.display = "none";
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

    // Prevent Memory Leaks: Add destroy method to remove event listeners
    destroy() {
      // Consolidate Drag Initiators: Remove event listeners
      const dragInitiators = [this.sliderLine, this.leftMark, this.rightMark, this.slider];
      dragInitiators.forEach((element) => {
        element.removeEventListener("mousedown", this.startDragBound);
        element.removeEventListener("touchstart", this.handleTouchStart);
      });

      // Remove dragging event listeners
      window.removeEventListener("mousemove", this.handleMouseMove);
      window.removeEventListener("touchmove", this.handleTouchMove);
      window.removeEventListener("mouseup", this.handleMouseUp);
      window.removeEventListener("touchend", this.handleTouchEnd);

      // Remove resize event listener
      window.removeEventListener("resize", this.handleResize);
    }

    handleTouchStart(e) {
      this.touchStartY = e.touches[0].clientY;
      this.startDrag(e);
    }

    handleTouchMove(e) {
      if (!this.isDragging) return;

      this.touchMoveY = e.touches[0].clientY;
      const touchDeltaY = Math.abs(this.touchMoveY - this.touchStartY);

      if (touchDeltaY > 10) {
        // If vertical movement is significant, stop dragging and allow scrolling
        this.stopDrag();
      } else {
        // Otherwise, handle the drag
        this.onDrag(e);
      }
    }
  }

  // Initialize Sliders
  function initializeSliders() {
    console.log("Initializing sliders");
    slidersContainer.style.visibility = "visible";
    const sliders = document.querySelectorAll(".image-slider");
    sliders.forEach((slider, index) => {
      console.log(`Initializing slider ${index + 1}`);
      slider.__slider = new Slider(slider);
    });
  }

  console.log("Window loaded, calling initializeSliders");
  initializeSliders();
});

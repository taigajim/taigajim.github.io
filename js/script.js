window.addEventListener("load", () => {
  const slidersContainer = document.getElementById("sliders-container");
  const loadingElement = document.getElementById("loading");
  const buttonContainer = document.createElement("div");
  buttonContainer.id = "button-container";
  document.body.insertBefore(buttonContainer, slidersContainer);

  let imagePairs = [];

  async function init() {
    try {
      await loadImageList();
      await preloadImages();
      createSliders();
      showContent();
    } catch (error) {
      handleError(error);
    }
  }

  async function loadImageList() {
    try {
      console.log("Fetching image list...");
      const response = await fetch("imgSlider/image_list.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Loaded image list:", data);
      imagePairs = data;
      if (!Array.isArray(imagePairs) || imagePairs.length === 0) {
        throw new Error("Invalid or empty image list");
      }
    } catch (error) {
      console.error("Error loading image list:", error);
      throw error;
    }
  }

  async function preloadImages() {
    try {
      await Promise.all(
        imagePairs.flatMap((pair) => [
          loadImage(pair.before),
          loadImage(pair.after),
        ])
      );
      console.log("All images preloaded successfully");
    } catch (error) {
      console.error("Error preloading images:", error);
      throw error;
    }
  }

  async function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        console.log(`Image loaded successfully: ${src}`);
        resolve(img);
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${src}`);
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });
  }

  function createSliders() {
    slidersContainer.innerHTML = imagePairs.map(createSliderHTML).join("");
    setupAllSliders();
  }

  function createSliderHTML(pair) {
    if (!pair?.name || !pair.before || !pair.after) {
      console.error("Invalid pair object", pair);
      return "";
    }

    const imageName = pair.name
      .split("/")
      .pop()
      .replace(/\.(jpg|jpeg|png|gif)$/i, "");
    return `
      <div class="container">
        <div class="slider" data-before="${pair.before}" data-after="${pair.after}">
          <div class="slider-label">${imageName}</div>
          <img src="${pair.before}" class="slider-image slider-image-before" alt="Before image">
          <img src="${pair.after}" class="slider-image slider-image-after" alt="After image">
          <div class="slider-line"></div>
          <div class="slider-button">
            <span class="left-arrow"></span>
            <span class="right-arrow"></span>
          </div>
        </div>
      </div>
    `;
  }

  function setupAllSliders() {
    document.querySelectorAll(".slider").forEach((slider) => {
      const sliderInstance = new Slider(slider);
      slider.__sliderInstance__ = sliderInstance; // Store instance for later access
    });
  }

  class Slider {
    constructor(sliderElement) {
      this.slider = sliderElement;
      this.sliderBefore = this.slider.querySelector(".slider-image-before");
      this.sliderAfter = this.slider.querySelector(".slider-image-after");
      this.sliderLine = this.slider.querySelector(".slider-line");
      this.sliderButton = this.slider.querySelector(".slider-button");
      this.isResizing = false;
      this.animationFrameId = null;
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.touchStartTime = 0;
      this.percentage = 50; // Initialize slider position to 50%

      this.init();
    }

    async init() {
      try {
        await this.preloadImages();
        this.setSliderDimensions();
        this.attachEventListeners();
      } catch (error) {
        console.error("Error initializing slider:", error);
        this.displayError();
      }
    }

    async preloadImages() {
      await Promise.all([
        this.loadImage(this.sliderBefore.src),
        this.loadImage(this.sliderAfter.src),
      ]);
    }

    loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log(`Image loaded successfully: ${src}`);
          resolve(img);
        };
        img.onerror = () => {
          console.error(`Failed to load image: ${src}`);
          reject(new Error(`Failed to load image: ${src}`));
        };
        img.src = src;
      });
    }

    setSliderDimensions() {
      const containerRect = this.slider.parentElement.getBoundingClientRect();
      const aspectRatio =
        this.sliderBefore.naturalWidth / this.sliderBefore.naturalHeight;

      let newWidth, newHeight;

      if (window.innerWidth > window.innerHeight) {
        // Landscape
        newHeight = containerRect.height;
        newWidth = newHeight * aspectRatio;
        if (newWidth > containerRect.width) {
          newWidth = containerRect.width;
          newHeight = newWidth / aspectRatio;
        }
      } else {
        // Portrait
        newWidth = containerRect.width;
        newHeight = newWidth / aspectRatio;
        if (newHeight > containerRect.height) {
          newHeight = containerRect.height;
          newWidth = newHeight * aspectRatio;
        }
      }

      this.slider.style.width = `${newWidth}px`;
      this.slider.style.height = `${newHeight}px`;

      // Update clip path based on current percentage
      const newX =
        this.slider.getBoundingClientRect().left +
        newWidth * (this.percentage / 100);
      this.updateClipPath(newX);
    }

    updateClipPath(x) {
      const imageRect = this.sliderBefore.getBoundingClientRect();
      const percentage = ((x - imageRect.left) / imageRect.width) * 100;
      this.percentage = Math.max(0, Math.min(100, percentage)); // Update percentage
      this.sliderAfter.style.clipPath = `inset(0 ${
        100 - this.percentage
      }% 0 0)`;
      this.sliderLine.style.left = `${this.percentage}%`;
      this.sliderButton.style.left = `${this.percentage}%`;
    }

    updateCursor(e) {
      const sliderRect = this.slider.getBoundingClientRect();
      const buttonRect = this.sliderButton.getBoundingClientRect();
      const x = e.clientX || (e.touches && e.touches[0].clientX);
      const y = e.clientY || (e.touches && e.touches[0].clientY);

      // Calculate the hit area (10% of slider width on each side of the button)
      const hitAreaWidth = sliderRect.width * 0.1;
      const hitAreaLeft = buttonRect.left - hitAreaWidth;
      const hitAreaRight = buttonRect.right + hitAreaWidth;

      if (
        x >= hitAreaLeft &&
        x <= hitAreaRight &&
        y >= sliderRect.top &&
        y <= sliderRect.bottom
      ) {
        this.slider.style.cursor = "col-resize";
      } else {
        this.slider.style.cursor = "default";
      }
    }

    handleStart(e) {
      if (e.touches && e.touches.length > 1) return; // Ignore multi-touch
      this.updateCursor(e);
      if (this.slider.style.cursor === "col-resize") {
        e.preventDefault();
        this.isResizing = true;
        this.updateClipPath(e.clientX || e.touches[0].clientX);
      }
    }

    handleMove(e) {
      if (e.touches && e.touches.length > 1) return; // Ignore multi-touch
      this.updateCursor(e);
      if (!this.isResizing) return;
      e.preventDefault();
      this.updateClipPath(e.clientX || e.touches[0].clientX);
    }

    handleEnd(e) {
      if (this.isResizing) e.preventDefault();
      this.isResizing = false;
    }

    handleTouchStart(e) {
      if (e.touches.length > 1) return;
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.touchStartTime = Date.now();
    }

    handleTouchEnd(e) {
      if (this.isResizing) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();

      const distanceX = Math.abs(touchEndX - this.touchStartX);
      const distanceY = Math.abs(touchEndY - this.touchStartY);
      const duration = touchEndTime - this.touchStartTime;

      if (distanceX < 10 && distanceY < 10 && duration < 200) {
        this.handleClick(e.changedTouches[0]);
      }
    }

    handleClick(e) {
      if (this.isResizing) return;
      const sliderRect = this.slider.getBoundingClientRect();
      const clickX = e.clientX || (e.touches && e.touches[0].clientX);
      const startX =
        (parseFloat(this.sliderButton.style.left) / 100) * sliderRect.width +
        sliderRect.left;
      const endX = clickX;

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }

      this.animateSlider(startX, endX, Date.now(), 300); // 300ms duration for the animation
    }

    easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    animateSlider(startX, endX, startTime, duration) {
      const currentTime = Date.now() - startTime;
      const progress = Math.min(currentTime / duration, 1);
      const easedProgress = this.easeOutCubic(progress);
      const currentX = startX + (endX - startX) * easedProgress;

      this.updateClipPath(currentX);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(() =>
          this.animateSlider(startX, endX, startTime, duration)
        );
      } else {
        this.animationFrameId = null;
      }
    }

    attachEventListeners() {
      // Mouse events
      this.slider.addEventListener("mousedown", this.handleStart.bind(this));
      this.slider.addEventListener("mousemove", this.handleMove.bind(this));
      document.addEventListener("mouseup", this.handleEnd.bind(this));

      // Touch events
      this.slider.addEventListener("touchstart", this.handleStart.bind(this), {
        passive: false,
      });
      this.slider.addEventListener("touchmove", this.handleMove.bind(this), {
        passive: false,
      });
      document.addEventListener("touchend", this.handleEnd.bind(this));

      // Tap detection for mobile
      this.slider.addEventListener(
        "touchstart",
        this.handleTouchStart.bind(this),
        { passive: true }
      );
      this.slider.addEventListener("touchend", this.handleTouchEnd.bind(this), {
        passive: true,
      });

      // Click event
      this.slider.addEventListener("click", this.handleClick.bind(this));

      // Mouse leave
      this.slider.addEventListener("mouseleave", () => {
        this.slider.style.cursor = "default";
      });
    }

    displayError() {
      this.slider.innerHTML = "<p>Error loading images.</p>";
      this.slider.style.display = "none";
    }
  }

  function showContent() {
    loadingElement.style.display = "none";
    slidersContainer.style.display = "flex";
  }

  function handleError(error) {
    console.error("Error during initialization:", error);
    loadingElement.textContent =
      "Error loading images. Please check your internet connection or contact support.";
    loadingElement.style.display = "block";
    buttonContainer.style.display = "none";
    slidersContainer.style.display = "none";
  }

  function resizeAllSliders() {
    document.querySelectorAll(".slider").forEach((slider) => {
      const sliderInstance = slider.__sliderInstance__;
      if (sliderInstance) {
        sliderInstance.setSliderDimensions();
      }
    });
  }

  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      window.location.reload(); // Refresh the page after resize
    }, 250); // Debounce for 250ms
  }

  window.addEventListener("resize", handleResize);
  window.addEventListener("orientationchange", handleResize);

  init();
});

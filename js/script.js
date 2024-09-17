window.addEventListener("load", () => {
  const slidersContainer = document.getElementById("sliders-container");
  const loadingElement = document.getElementById("loading");
  const buttonContainer = document.createElement("div");
  buttonContainer.id = "button-container";
  document.body.insertBefore(buttonContainer, slidersContainer);

  let imagePairs = [];
  let currentPairIndex = 0;

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
    await Promise.all(
      imagePairs.flatMap((pair) => [
        loadImage(pair.before),
        loadImage(pair.after),
      ])
    );
  }

  function createSliders() {
    slidersContainer.innerHTML = ""; // Clear existing sliders
    imagePairs.forEach((pair) => {
      const slider = createSlider(pair);
      slidersContainer.appendChild(slider);
    });
    resizeAllSliders();
  }

  function createSlider(pair) {
    if (!pair || !pair.name || !pair.before || !pair.after) {
      console.error("Invalid pair object", pair);
      handleError(new Error("Invalid pair object"));
      return document.createElement("div"); // Return an empty div to avoid further errors
    }

    const container = document.createElement("div");
    container.className = "container";
    const imageName = pair.name
      .split("/")
      .pop()
      .replace(/\.(jpg|jpeg|png|gif)$/i, "");
    container.innerHTML = `
      <div class="slider">
        <div class="slider-label">${imageName}</div>
        <img src="${pair.before}" class="slider-image slider-image-before" alt="Before image">
        <img src="${pair.after}" class="slider-image slider-image-after" alt="After image">
        <div class="slider-line"></div>
        <div class="slider-button">
          <span class="left-arrow"></span>
          <span class="right-arrow"></span>
        </div>
      </div>
    `;

    const slider = container.querySelector(".slider");
    const sliderBefore = container.querySelector(".slider-image-before");
    const sliderAfter = container.querySelector(".slider-image-after");
    const sliderLine = container.querySelector(".slider-line");
    const sliderButton = container.querySelector(".slider-button");

    setupSliderEvents(
      slider,
      sliderBefore,
      sliderAfter,
      sliderLine,
      sliderButton
    );
    return container;
  }

  function setupSliderEvents(
    slider,
    sliderBefore,
    sliderAfter,
    sliderLine,
    sliderButton
  ) {
    let isResizing = false;
    let animationFrameId = null;

    const updateClipPath = (x) => {
      const imageRect = sliderBefore.getBoundingClientRect();
      const percentage = ((x - imageRect.left) / imageRect.width) * 100;
      const clampedPercentage = Math.max(0, Math.min(100, percentage));
      sliderAfter.style.clipPath = `inset(0 ${100 - clampedPercentage}% 0 0)`;
      sliderLine.style.left = `${clampedPercentage}%`;
      sliderButton.style.left = `${clampedPercentage}%`;
    };

    const setSliderDimensions = () => {
      const containerRect = slider.parentElement.getBoundingClientRect();
      const naturalWidth = sliderBefore.naturalWidth;
      const naturalHeight = sliderBefore.naturalHeight;
      const aspectRatio = naturalWidth / naturalHeight;

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

      slider.style.width = `${newWidth}px`;
      slider.style.height = `${newHeight}px`;

      // Update clip path after resizing
      updateClipPath(slider.getBoundingClientRect().left + newWidth / 2);
    };

    const updateCursor = (e) => {
      const sliderRect = slider.getBoundingClientRect();
      const buttonRect = sliderButton.getBoundingClientRect();
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
        slider.style.cursor = "col-resize";
      } else {
        slider.style.cursor = "default";
      }
    };

    const handleStart = (e) => {
      if (e.touches && e.touches.length > 1) return; // Ignore multi-touch
      updateCursor(e);
      if (slider.style.cursor === "col-resize") {
        e.preventDefault();
        isResizing = true;
        updateClipPath(e.clientX || e.touches[0].clientX);
      }
    };

    const handleMove = (e) => {
      if (e.touches && e.touches.length > 1) return; // Ignore multi-touch
      updateCursor(e);
      if (!isResizing) return;
      e.preventDefault();
      updateClipPath(e.clientX || e.touches[0].clientX);
    };

    const handleEnd = (e) => {
      if (isResizing) e.preventDefault();
      isResizing = false;
    };

    slider.addEventListener("mousedown", handleStart);
    slider.addEventListener("touchstart", handleStart, { passive: false });
    slider.addEventListener("mousemove", handleMove);
    slider.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchend", handleEnd);
    slider.addEventListener("mouseleave", () => {
      slider.style.cursor = "default";
    });

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const animateSlider = (startX, endX, startTime, duration) => {
      const currentTime = Date.now() - startTime;
      const progress = Math.min(currentTime / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const currentX = startX + (endX - startX) * easedProgress;

      updateClipPath(currentX);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(() =>
          animateSlider(startX, endX, startTime, duration)
        );
      } else {
        animationFrameId = null;
      }
    };

    let touchStartX, touchStartY, touchStartTime;

    const handleTouchStart = (e) => {
      if (e.touches.length > 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e) => {
      if (isResizing) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();

      const distanceX = Math.abs(touchEndX - touchStartX);
      const distanceY = Math.abs(touchEndY - touchStartY);
      const duration = touchEndTime - touchStartTime;

      if (distanceX < 10 && distanceY < 10 && duration < 200) {
        handleClick(e.changedTouches[0]);
      }
    };

    slider.addEventListener("touchstart", handleTouchStart, { passive: true });
    slider.addEventListener("touchend", handleTouchEnd, { passive: true });
    // Remove the click event listener
    // slider.removeEventListener("click", handleClick);

    const handleClick = (e) => {
      if (isResizing) return;
      const sliderRect = slider.getBoundingClientRect();
      const clickX = e.clientX || e.touches[0].clientX;
      const startX =
        (parseFloat(sliderButton.style.left) / 100) * sliderRect.width +
        sliderRect.left;
      const endX = clickX;

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animateSlider(startX, endX, Date.now(), 300); // 300ms duration for the animation
    };

    slider.addEventListener("click", handleClick);

    Promise.all([
      new Promise((resolve) => (sliderBefore.onload = resolve)),
      new Promise((resolve) => (sliderAfter.onload = resolve)),
    ]).then(() => {
      setSliderDimensions();
      updateClipPath(
        slider.getBoundingClientRect().left +
          slider.getBoundingClientRect().width / 2
      );
    });

    window.addEventListener("resize", setSliderDimensions);
    window.addEventListener("orientationchange", setSliderDimensions);

    return () => {
      window.removeEventListener("resize", setSliderDimensions);
      window.removeEventListener("orientationchange", setSliderDimensions);
    };
  }

  function resizeAllSliders() {
    const sliders = document.querySelectorAll(".slider");
    sliders.forEach((slider) => {
      const sliderBefore = slider.querySelector(".slider-image-before");
      const sliderAfter = slider.querySelector(".slider-image-after");
      const sliderLine = slider.querySelector(".slider-line");
      const sliderButton = slider.querySelector(".slider-button");

      setupSliderEvents(
        slider,
        sliderBefore,
        sliderAfter,
        sliderLine,
        sliderButton
      );
    });
  }

  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resizeAllSliders(); // Resize instead of recreate
    }, 250); // Debounce for 250ms
  }

  window.addEventListener("resize", handleResize);
  window.addEventListener("orientationchange", handleResize);

  async function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  function showContent() {
    loadingElement.style.display = "none";
    slidersContainer.style.display = "flex";
  }

  function handleError(error) {
    console.error("Error during initialization:", error);
    loadingElement.textContent =
      "Error loading images. Please check the console for details.";
    loadingElement.style.display = "block";
    buttonContainer.style.display = "none";
    slidersContainer.style.display = "none";
  }

  init();
});

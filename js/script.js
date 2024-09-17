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
      createButtons();
      updateSlider(currentPairIndex);
      showContent();
    } catch (error) {
      handleError(error);
    }
  }

  async function loadImageList() {
    try {
      const response = await fetch("imgSlider/image_list.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      imagePairs = await response.json();
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

  function createButtons() {
    imagePairs.forEach((pair, index) => {
      const button = document.createElement("button");
      button.textContent = pair.name.split("/").pop();
      button.addEventListener("click", () => updateSlider(index));
      buttonContainer.appendChild(button);
    });
  }

  function updateSlider(index) {
    currentPairIndex = index;
    slidersContainer.innerHTML = "";
    const slider = createSlider(imagePairs[index]);
    slidersContainer.appendChild(slider);

    // Store the cleanup function
    if (window.currentSliderCleanup) {
      window.currentSliderCleanup();
    }
    window.currentSliderCleanup = setupSliderEvents(
      slider.querySelector(".slider"),
      slider.querySelector(".slider-image-before"),
      slider.querySelector(".slider-image-after"),
      slider.querySelector(".slider-line"),
      slider.querySelector(".slider-button")
    );
  }

  function createSlider(pair) {
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
          <span class="left-arrow">&lt;&lt;</span>
          <span class="right-arrow">&gt;&gt;</span>
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

      if (containerRect.width / containerRect.height > aspectRatio) {
        newHeight = Math.min(containerRect.height, naturalHeight);
        newWidth = newHeight * aspectRatio;
      } else {
        newWidth = Math.min(containerRect.width, naturalWidth);
        newHeight = newWidth / aspectRatio;
      }

      slider.style.width = `${newWidth}px`;
      slider.style.height = `${newHeight}px`;

      // Update clip path after resizing
      updateClipPath(slider.getBoundingClientRect().left + newWidth / 2);
    };

    const handleStart = (e) => {
      e.preventDefault();
      isResizing = true;
      updateClipPath(e.clientX || e.touches[0].clientX);
    };

    const handleMove = (e) => {
      if (!isResizing) return;
      e.preventDefault();
      updateClipPath(e.clientX || e.touches[0].clientX);
    };

    const handleEnd = (e) => {
      if (isResizing) e.preventDefault();
      isResizing = false;
    };

    // Modified handleWheel function to prevent resetting
    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY;
      const step = 0.99; // Reduced step size for slower movement
      const currentLeft = parseFloat(sliderButton.style.left);
      // If currentLeft is NaN (initial state), set it to 50
      const startLeft = isNaN(currentLeft) ? 50 : currentLeft;
      const newLeft = Math.max(
        0,
        Math.min(100, startLeft - (delta * step) / 100)
      );
      updateClipPath(
        slider.getBoundingClientRect().left +
          (slider.offsetWidth * newLeft) / 100
      );
    };

    slider.addEventListener("mousedown", handleStart);
    slider.addEventListener("touchstart", handleStart);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchend", handleEnd);
    slider.addEventListener("wheel", handleWheel, { passive: false });

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

    return () => {
      window.removeEventListener("resize", setSliderDimensions);
      slider.removeEventListener("wheel", handleWheel);
    };
  }

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
    buttonContainer.style.display = "flex";
    slidersContainer.style.display = "block";
  }

  function handleError(error) {
    console.error("Error during initialization:", error);
    loadingElement.textContent =
      "Error loading images. Please check the console for details.";
  }

  init();
});

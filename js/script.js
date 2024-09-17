const sliderRange = document.querySelector(".slider-range");
const sliderAfter = document.querySelector(".slider-image-after");

sliderRange.addEventListener("input", (event) => {
  const value = event.target.value;
  // Adjust the clip-path based on the slider value
  sliderAfter.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
});

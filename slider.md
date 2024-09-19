# Image Slider Project - Standard Operating Procedure (SOP)

## 1. Introduction

The Image Slider Project is a web application that allows users to compare before-and-after images using interactive sliders.

## 2. Development Guidelines

### HTML (`index.html`)

- Maintain the existing structure of slider containers.
- Each slider should have a unique `id` and `data-percentage` attribute.
- Use semantic HTML elements where appropriate.

### CSS (`css/style.css`)

- Follow the existing naming conventions for classes and IDs.
- Use responsive design principles to ensure compatibility across devices.
- Minimize the use of !important declarations.

### JavaScript (`js/script.js`)

- Adhere to ES6+ standards and best practices.
- Use meaningful variable and function names.
- Comment complex logic for better understanding.
- Implement error handling for robust functionality.
- Use the `debounce` function to optimize performance.

### Image Requirements

- Before and after images should be of the same size.
- Images should be named in a way that indicates their pair, e.g., `before_image_1.jpg` and `after_image_1.jpg`.

### Adding New Sliders

1. Add new image pairs to the `imgSlider/` directory.
2. Create a new slider container in `index.html` following the existing pattern.
3. Ensure the `data-percentage` attribute is set to the desired initial position. Default is 50%.

## 3. Usage Instructions

### For End Users

1. Open the application in a web browser.
2. Wait for the sliders to load completely.
3. Interact with sliders:
   - Drag the slider line to compare images.
   - Click anywhere on the slider to move it to that position.
4. Observe the before and after images as you move the slider.

### For Developers

1. Modify `index.html` to add or remove sliders.
2. Update `style.css` for styling changes.
3. Enhance `script.js` for additional functionality or optimizations.
4. Test thoroughly on various devices and browsers after making changes.

## 4. Maintenance and Updates

### Updating the Project

1. Pull the latest changes from the repository.
2. Review the changelog for any breaking changes.
3. Test the application thoroughly after updates.
4. Deploy updates to the production environment.

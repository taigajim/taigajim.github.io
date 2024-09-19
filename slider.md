# Image Slider Project - Standard Operating Procedure (SOP)

## Table of Contents

- [Introduction](#introduction)
- [File Structure](#file-structure)
- [Detailed File Descriptions](#detailed-file-descriptions)
  - [HTML](#html)
  - [CSS](#css)
  - [JavaScript](#javascript)
- [Application Workflow](#application-workflow)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Introduction

The Image Slider Project is a web application that displays before-and-after image comparisons using interactive sliders. Users can adjust the slider to reveal different portions of the images, providing an intuitive way to compare visual changes.

## File Structure

```
project-root/
├── css/
│   └── style.css
├── imgSlider/
│   ├── hanasaaren_voimalaitos_a.jpg
│   ├── hanasaaren_voimalaitos_b.jpg
│   ├── rautatieasema_a.jpg
│   ├── rautatieasema_b.jpg
│   ├── sompasaari_a.jpg
│   └── sompasaari_b.jpg
├── js/
│   └── script.js
└── index.html
```

## Detailed File Descriptions

### HTML

#### `index.html`

- **Path:** `index.html`
- **Description:** The main HTML file that structures the web page. It includes references to the CSS for styling and JavaScript for functionality.
- **Key Elements:**
  - **Loading Indicator:** `<div id="loading">` displays a loading message until images are ready.
  - **Sliders Container:** `<div id="sliders-container">` where all image sliders are dynamically inserted.
  - **Slider Components:** Each slider is defined using a `<div class="image-slider" data-percentage="50">` containing two images with classes `before` and `after`, and visual marks `<` and `>` on either side of the slider line.
  - **Script Inclusion:** Links to `js/script.js` for interactive behavior.

### CSS

#### `css/style.css`

- **Path:** `css/style.css`
- **Description:** Contains all the styles for the web application, ensuring a responsive and visually appealing layout.
- **Key Styles:**
  - **Reset Styles:** Removes default margins and paddings.
  - **Layout:** Flexbox is used for structuring the body and sliders container.
  - **Slider Components:**
    - `.image-slider`: Styles the slider container with relative positioning and overflow handling.
    - `.before` & `.after`: Ensures images fit appropriately within the slider. The `.after` image is positioned absolutely over the `.before` image and clipped based on the slider percentage.
    - `.slider-line` & `.slider-mark`: Visual indicators for adjusting the slider.
      - **Expanded Hit Area:** The `.slider-line` has an expanded invisible hit area on both sides for easier grabbing and dragging.
    - `.slider-mark`: `<` and `>` indicators positioned on either side of the slider line for visual purposes.
  - **Loading Indicator:** Styles the loading message to appear centered with a semi-transparent background.

### JavaScript

#### `js/script.js`

- **Path:** `js/script.js`
- **Description:** Handles the dynamic functionality of the image sliders, including loading images, initializing sliders, and managing user interactions.
- **Main Components:**
  - **Initialization:**
    - `initializeSliders()`: Initializes sliders based on the `.image-slider` divs present in the HTML.
  - **Slider Class:**
    - Manages individual slider behavior, including dragging, clicking, and responsive adjustments.
    - **Key Methods:**
      - `init()`: Initializes the slider by setting up elements and attaching events.
      - `setupElements()`: Creates the slider line and visual marks `<` and `>`.
      - `updateSlider()`: Adjusts the visible portion of images based on slider position.
      - `attachEvents()`: Sets up event listeners for user interactions, including drag and click.
      - `waitForImages()`: Ensures both images are loaded before initializing the slider.
      - `onClick()`: Handles click events to move the slider to the clicked position with easing.
      - `animateTo()`: Animates the slider movement with an easing function.
      - `displayError()`: Handles scenarios where images fail to load.
  - **Utility Functions:**
    - `showContent()`: Displays sliders and hides the loading indicator.

## Application Workflow

1. **Page Load:**

   - The `index.html` loads and displays the loading indicator.
   - `js/script.js` initializes and begins the setup process.

2. **Creating Sliders:**

   - Initializes sliders based on the `.image-slider` divs present in the HTML.
   - Sets up slider instances to handle user interactions.

3. **Displaying Content:**

   - Hides the loading indicator and displays the sliders once all images are loaded.

4. **User Interaction:**

   - **Dragging:** Users can drag the slider line or the expanded hit area to compare 'before' and 'after' images.
   - **Clicking:** Users can click anywhere on the slider to move the slider smoothly to that position with easing.
   - The slider responds to both mouse and touch events for compatibility.

5. **Responsive Behavior:**
   - Sliders adjust their dimensions based on the viewport size.
   - Handles window resize and orientation changes to maintain layout integrity.

## Setup Instructions

1. **Prerequisites:**

   - A web server to serve the files, such as [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for VS Code or [http-server](https://www.npmjs.com/package/http-server) via Node.js.

2. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-repo/image-slider-project.git
   cd image-slider-project
   ```

3. **Start the Web Server:**

   - Using Python's built-in server:
     ```bash
     python -m http.server
     ```
   - Or using Node.js `http-server`:
     ```bash
     npx http-server
     ```

4. **Access the Application:**
   - Open your browser and navigate to `http://localhost:8000` (port may vary based on the server used).

## Usage

- **Viewing Sliders:**

  - Once the application loads, you'll see multiple sliders representing different image pairs.
  - **Drag** the slider line or the expanded hit area horizontally to reveal more or less of the 'before' and 'after' images.
  - **Click** anywhere on the slider to move the slider smoothly to that position with easing.

- **Responsive Design:**

  - The sliders adjust their size based on the device's orientation and screen size.

- **Interacting on Mobile:**

  - Touch gestures are supported for dragging the slider line.

## Troubleshooting

- **Images Not Loading:**

  - Ensure all image paths in the HTML are correct.
  - Verify that images exist in the specified `imgSlider/` directory.

- **Slider Not Appearing:**

  - Check the browser console for any JavaScript errors.
  - Ensure that the web server is correctly serving all files.

- **Responsive Issues:**

  - Make sure the CSS in `style.css` is properly linked and no syntax errors exist.

- **JavaScript Errors:**
  - Verify that all image elements have the correct classes (`before` and `after`).
  - Ensure that `data-percentage` attributes are set correctly on `.image-slider` divs.

## Contributing

Contributions are welcome! Follow these steps to contribute:

1. **Fork the Repository**
2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit Your Changes**
   ```bash
   git commit -m "Add your message"
   ```
4. **Push to Branch**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request**

## License

This project is licensed under the [MIT License](LICENSE).

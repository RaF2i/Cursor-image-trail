document.addEventListener("DOMContentLoaded", () => {
  const lenis = new Lenis({
    autoRaf: true,
  });

  const container = document.querySelector(".trail-container");

  const config = {
    imageCount: 8, //total number of images that can appear, at a time number of images that can appear
    imageLifespan: 750, //image lifespan remove after this ms
    removalDelay: 50, //out images delay
    mouseThreshold: 100, //minimum mouse move to display next image
    scrollThreshold: 50, // same as mouseThreshold but for scrolling
    idleCursorInterval: 300, // how often the image are added to the trail
    inDuration: 750, // fade in and out for images
    outDuration: 1000,
    inEasing: "cubic-bezier(.07, .5, .5,1)", //easing for in and out
    outEasing: "cubic-bezier(.87, 0, .13,1)",
  };

  const images = Array.from(
    { length: config.imageCount },
    (_, i) => `assets/0${i + 1}.jpg`
  );

  const trail = [];

  let mouseX = 0, // current mouse positions
    mouseY = 0,
    lastMouseX = 0, //previous positions of mouse
    lastMouseY = 0;

  let isMoving = false,
    isCursorInContainer = 0; //if the cursor in only in the trail container

  let lastRemovalTime = 0, //for image  added or remove preventing unwanted  animation
    lastSteadyImageTime = 0,
    lastScrollTime = 0;

  let isScrolling = false, //tracking scrolling behavior
    scrollTicking = false;

  const isInContainer = (x, y) => {
    const rect = container.getBoundingClientRect();
    return (
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    );
  };

  const setInitialMousePos = (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    isCursorInContainer = isInContainer(mouseX, mouseY);
    document.removeEventListener("mousemove", setInitialMousePos, false);
  };
  document.addEventListener("mousemove", setInitialMousePos, false);

  const hasMovedEnough = () => {
    //cursor travel from last recorded position
    const distance = Math.sqrt(
      Math.pow(mouseX - lastMouseX, 2) + Math.pow(mouseY - lastMouseY, 2)
    );
    return distance > config.mouseThreshold; // cursor has moved far enough to trigger the next image
  };

  const createTrailImage = () => {
    const now = Date.now();

    if (!isCursorInContainer) return;

    if (isMoving && hasMovedEnough()) {
      lastMouseX = mouseX;
      lastMouseY = mouseY;
      createImage();
      return;
    }

    if (!isMoving && now - lastSteadyImageTime >= config.idleCursorInterval) {
      lastSteadyImageTime = now;
      createImage();
    }
  };

  const createImage = () => {
    const img = document.createElement("img");
    img.classList.add("trail-img");

    const randomIndex = Math.floor(Math.random() * images.length);
    const rotation = (Math.random() - 0.5) * 50;
    img.src = images[randomIndex];

    const rect = container.getBoundingClientRect();
    const relativeX = mouseX - rect.left;
    const relativeY = mouseY - rect.top;

    img.style.left = `${relativeX}px`;
    img.style.top = `${relativeY}px`;
    img.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(0)`;

    img.style.transition = `transform ${config.inDuration}ms ${config.inEasing}`;

    container.appendChild(img);

    setTimeout(() => {
      img.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(1)`;
    }, 10);

    trail.push({
      element: img,
      rotation: rotation,
      removeTime: Date.now() + config.imageLifespan,
    });
  };

  const createScrollTrailImage = () => {
    //creates images when scrolling even if the mouse cursor moves
    if (!isCursorInContainer) return;

    lastMouseX += (config.mouseThreshold + 10) * (Math.random() > 0.5 ? 1 : -1); //small random offset than direct straight line when scrolling ,
    lastMouseY += (config.mouseThreshold + 10) * (Math.random() > 0.5 ? 1 : -1); // so images are a little scattered not in a straight line

    createImage();

    lastMouseX = mouseX;
    lastMouseY = mouseY;
  };

  const removeOldImages = () => {
    const now = Date.now();
    if (now - lastRemovalTime < config.removalDelay || trail.length === 0)
      return; // if not enough time passed of size of trail is 0 nothing to remove

    const oldestImage = trail[0];

    if (now >= oldestImage.removeTime) {
      const imgToRemove = trail.shift();

      imgToRemove.element.style.transition = `transform ${config.outDuration}ms ${config.outEasing}`;
      imgToRemove.element.style.transform = `translate(-50%, -50%) rotate(${imgToRemove.rotation}deg) scale(0)`;

      lastRemovalTime = now;

      setTimeout(() => {
        if (imgToRemove.element.parentNode) {
          imgToRemove.element.parentNode.removeChild(imgToRemove.element);
        }
      }, config.outDuration);
    }
  };

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    isCursorInContainer = isInContainer(mouseX, mouseY);

    if (isCursorInContainer) {
      isMoving = true;
      clearTimeout(window.moveTimeout);
      window.moveTimeout = setTimeout(() => {
        isMoving = false;
      }, 100);
    }
  });

  window.addEventListener(
    "scroll",
    () => {
      isCursorInContainer = isInContainer(mouseX, mouseY);

      if (isCursorInContainer) {
        isMoving = true;
        lastMouseX += (Math.random() - 0.5) * 10;

        clearTimeout(window.moveTimeout);
        window.scrollTimeout = setTimeout(() => {
          isMoving = false;
        }, 100);
      }
    },
    { passive: false }
  );

  window.addEventListener('scroll', () => {
    const now = Date.now();
    isScrolling = true;

    if (now - lastScrollTime < config.scrollThreshold) return;

    lastScrollTime = now;
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(() => {
        createScrollTrailImage();
        isScrolling = false;
        scrollTicking = false;
      });
    }
  }, { passive: true });

  const animate = () => {
    createTrailImage();
    removeOldImages();
    requestAnimationFrame(animate)
  };
  animate()
});

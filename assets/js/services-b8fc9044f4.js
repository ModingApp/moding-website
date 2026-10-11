(()=>{const serviceSearchLens =
      document.getElementById("serviceSearchLens");

    const serviceSearchTargetIds = [
      "serviceSearchFish",
      "serviceSearchMeat",
      "serviceSearchSauce",
      "serviceSearchShell"
    ];

    const SERVICE_LENS_BASE_X = 220;
    const SERVICE_LENS_BASE_Y = 222;

    let serviceSearchTargets = [];
    let serviceSearchTimer = null;
    let serviceSearchFrame = null;
    let serviceSearchIndex = 0;
    let serviceLensOffsetX = 0;
    let serviceLensOffsetY = 0;

    function refreshServiceSearchTargets() {
      serviceSearchTargets = serviceSearchTargetIds
        .map((id) => {
          const node = document.getElementById(id);
          if (!node) return null;

          const box = node.getBBox();

          return {
            id,
            x: box.x + box.width / 2,
            y: box.y + box.height / 2
          };
        })
        .filter(Boolean);
    }

    function clearServiceSearchFocus() {
      serviceSearchTargetIds.forEach((id) => {
        const node = document.getElementById(id);
        if (node) node.classList.remove("is-focus");
      });
    }

    function focusServiceSearchItem(index) {
      clearServiceSearchFocus();

      const target = serviceSearchTargets[index];
      if (!target) return;

      const node = document.getElementById(target.id);
      if (node) node.classList.add("is-focus");
    }

    function setServiceLensOffset(x, y) {
      if (!serviceSearchLens) return;

      serviceSearchLens.setAttribute(
        "transform",
        `translate(${x.toFixed(2)} ${y.toFixed(2)})`
      );
    }

    function serviceSearchEase(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function moveServiceLensTo(index, immediate = false) {
      if (
        !serviceSearchLens ||
        !serviceSearchTargets.length ||
        !serviceSearchTargets[index]
      ) {
        return;
      }

      const target = serviceSearchTargets[index];

      const targetOffsetX =
        target.x - SERVICE_LENS_BASE_X;

      const targetOffsetY =
        target.y - SERVICE_LENS_BASE_Y;

      if (serviceSearchFrame) {
        cancelAnimationFrame(serviceSearchFrame);
        serviceSearchFrame = null;
      }

      if (immediate) {
        serviceLensOffsetX = targetOffsetX;
        serviceLensOffsetY = targetOffsetY;
        setServiceLensOffset(
          serviceLensOffsetX,
          serviceLensOffsetY
        );
        focusServiceSearchItem(index);
        return;
      }

      clearServiceSearchFocus();

      const startX = serviceLensOffsetX;
      const startY = serviceLensOffsetY;
      const controlLift = index % 2 === 0 ? -28 : 24;
      const duration = 820;
      const startTime = performance.now();

      function frame(now) {
        const raw =
          Math.min(1, (now - startTime) / duration);

        const t = serviceSearchEase(raw);

        const curve =
          Math.sin(Math.PI * raw) * controlLift;

        serviceLensOffsetX =
          startX + (targetOffsetX - startX) * t;

        serviceLensOffsetY =
          startY +
          (targetOffsetY - startY) * t +
          curve;

        setServiceLensOffset(
          serviceLensOffsetX,
          serviceLensOffsetY
        );

        if (raw < 1) {
          serviceSearchFrame =
            requestAnimationFrame(frame);
        } else {
          serviceLensOffsetX = targetOffsetX;
          serviceLensOffsetY = targetOffsetY;

          setServiceLensOffset(
            serviceLensOffsetX,
            serviceLensOffsetY
          );

          focusServiceSearchItem(index);
          serviceSearchFrame = null;
        }
      }

      serviceSearchFrame =
        requestAnimationFrame(frame);
    }

    function stopServiceSearchMotion() {
      if (serviceSearchTimer) {
        clearTimeout(serviceSearchTimer);
        serviceSearchTimer = null;
      }

      if (serviceSearchFrame) {
        cancelAnimationFrame(serviceSearchFrame);
        serviceSearchFrame = null;
      }

      clearServiceSearchFocus();
    }

    function runServiceSearchMotion() {
      refreshServiceSearchTargets();

      if (
        !serviceSearchLens ||
        !serviceSearchTargets.length
      ) {
        return;
      }

      if (
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
      ) {
        moveServiceLensTo(0, true);
        return;
      }

      stopServiceSearchMotion();

      serviceSearchIndex = 0;
      moveServiceLensTo(serviceSearchIndex, true);

      function nextServiceSearchTarget() {
        serviceSearchTimer = setTimeout(() => {
          serviceSearchIndex =
            (serviceSearchIndex + 1) %
            serviceSearchTargets.length;

          moveServiceLensTo(serviceSearchIndex);
          nextServiceSearchTarget();
        }, 1750);
      }

      nextServiceSearchTarget();
    }

    requestAnimationFrame(() => {
      runServiceSearchMotion();
    });

    window.addEventListener("resize", () => {
      window.clearTimeout(
        window.__serviceSearchResizeTimer
      );

      window.__serviceSearchResizeTimer =
        window.setTimeout(() => {
          refreshServiceSearchTargets();

          if (serviceSearchTargets.length) {
            moveServiceLensTo(
              serviceSearchIndex,
              true
            );
          }
        }, 120);
    });

})();
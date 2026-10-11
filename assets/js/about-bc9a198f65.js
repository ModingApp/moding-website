(()=>{const experiencePath =
      document.getElementById("experiencePath");

    const experienceLivePath =
      document.getElementById("experienceLivePath");

    const experienceRunner =
      document.getElementById("experienceRunner");

    const experienceStages =
      Array.from(document.querySelectorAll(".experience-stage"));

    const mobileExperienceStages =
      Array.from(document.querySelectorAll(".experience-mobile-card"));

    const mobileJourneyLive =
      document.getElementById("mobileJourneyLive");

    const mobileJourneyRunner =
      document.getElementById("mobileJourneyRunner");

    const reduceMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)");

    let experienceRAF = null;
    let experienceStart = null;

    function easeInOutCubic(t) {
      return t < .5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function stagedProgress(t) {
      /*
        0.00 ~ 0.16 : 01 머무름
        0.16 ~ 0.36 : 01 → 02
        0.36 ~ 0.52 : 02 머무름
        0.52 ~ 0.72 : 02 → 03
        0.72 ~ 1.00 : 03 머무름
      */
      if (t < .16) return 0;

      if (t < .36) {
        const p = (t - .16) / .20;
        return .5 * easeInOutCubic(p);
      }

      if (t < .52) return .5;

      if (t < .72) {
        const p = (t - .52) / .20;
        return .5 + .5 * easeInOutCubic(p);
      }

      return 1;
    }

    function activeExperienceStage(t) {
      if (t < .36) return 0;
      if (t < .72) return 1;
      return 2;
    }

    function setExperienceStage(index) {
      experienceStages.forEach((stage, i) => {
        stage.classList.toggle(
          "is-stage-active",
          i === index
        );
      });

      mobileExperienceStages.forEach((stage, i) => {
        stage.classList.toggle(
          "is-stage-active",
          i === index
        );
      });
    }

    function syncMobileJourney(progress) {
      if (!mobileJourneyLive || !mobileJourneyRunner) return;

      const track =
        mobileJourneyLive.parentElement;

      if (!track) return;

      const trackTop = 42;
      const trackBottom = 42;
      const usable =
        Math.max(
          0,
          track.clientHeight - trackTop - trackBottom
        );

      const current =
        usable * progress;

      mobileJourneyLive.style.height =
        `${current}px`;

      mobileJourneyRunner.style.top =
        `${trackTop + current}px`;
    }

    function prepareExperiencePath() {
      if (
        !experiencePath ||
        !experienceLivePath ||
        !experienceRunner
      ) return null;

      const total =
        experiencePath.getTotalLength();

      experienceLivePath.style.strokeDasharray =
        `${total} ${total}`;

      experienceLivePath.style.strokeDashoffset =
        `${total}`;

      const startPoint =
        experiencePath.getPointAtLength(0);

      experienceRunner.setAttribute(
        "transform",
        `translate(${startPoint.x} ${startPoint.y})`
      );

      return total;
    }

    function runExperienceAnimation(timestamp) {
      const total =
        prepareExperiencePath();

      if (!total) return;

      if (reduceMotion.matches) {
        experienceLivePath.style.strokeDashoffset = "0";

        const endPoint =
          experiencePath.getPointAtLength(total);

        experienceRunner.setAttribute(
          "transform",
          `translate(${endPoint.x} ${endPoint.y})`
        );

        experienceStages.forEach((stage) => {
          stage.classList.add("is-stage-active");
        });

        mobileExperienceStages.forEach((stage) => {
          stage.classList.add("is-stage-active");
        });

        syncMobileJourney(1);
        return;
      }

      if (experienceStart === null) {
        experienceStart = timestamp;
      }

      const duration = 9000;
      const elapsed =
        (timestamp - experienceStart) % duration;

      const phase =
        elapsed / duration;

      const progress =
        stagedProgress(phase);

      const currentLength =
        total * progress;

      /* 같은 currentLength를 사용하므로
         선 끝과 포인트가 절대 분리되지 않음 */
      experienceLivePath.style.strokeDashoffset =
        `${total - currentLength}`;

      const point =
        experiencePath.getPointAtLength(
          currentLength
        );

      experienceRunner.setAttribute(
        "transform",
        `translate(${point.x} ${point.y})`
      );

      syncMobileJourney(progress);

      setExperienceStage(
        activeExperienceStage(phase)
      );

      experienceRAF =
        requestAnimationFrame(
          runExperienceAnimation
        );
    }

    function startExperienceAnimation() {
      if (!experiencePath) return;

      if (experienceRAF) {
        cancelAnimationFrame(experienceRAF);
      }

      experienceStart = null;
      experienceRAF =
        requestAnimationFrame(
          runExperienceAnimation
        );
    }

    startExperienceAnimation();

    reduceMotion.addEventListener?.(
      "change",
      startExperienceAnimation
    );

    })();
document.addEventListener('DOMContentLoaded', () => {
  var progressPath = document.querySelector('.button__back-to-top .progress-circle path');
  if (!progressPath) return;
  var pathLength = progressPath.getTotalLength();

  progressPath.style.transition = progressPath.style.WebkitTransition = 'none';
  progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
  progressPath.style.strokeDashoffset = pathLength;
  progressPath.style.transition = progressPath.style.WebkitTransition = 'none';

  var lastProgress = null;

  function getScrollY() {
    return window.scrollY || window.pageYOffset;
  }

  function updateProgress() {
    var scroll = getScrollY();
    var height = document.documentElement.scrollHeight - window.innerHeight;
    if (height <= 0) height = 1;
    var progress = pathLength - (scroll * pathLength) / height;
    if (lastProgress !== progress) {
      progressPath.style.strokeDashoffset = progress;
      lastProgress = progress;
    }
  }

  var frame = 0;
  function scheduleUpdate() {
    if (frame) return;
    frame = window.requestAnimationFrame(function () {
      frame = 0;
      updateProgress();
    });
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  updateProgress();
});

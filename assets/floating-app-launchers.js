(function () {
  var launcherClass = 'floating-app-launcher';
  var selectors = [
    '[aria-label*="assistance" i]',
    '[title*="assistance" i]',
    'button',
    'a',
    'iframe[title*="assistance" i]'
  ];

  function hasAssistanceText(element) {
    var text = (element.getAttribute('aria-label') || '') + ' ' +
      (element.getAttribute('title') || '') + ' ' +
      (element.textContent || '');
    return /assistance/i.test(text);
  }

  function findFixedLauncher(element) {
    var current = element;
    for (var i = 0; current && i < 6; i += 1) {
      var style = window.getComputedStyle(current);
      if (style.position === 'fixed') return current;
      current = current.parentElement;
    }
    return element;
  }

  function markLaunchers() {
    selectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (element) {
        if (!hasAssistanceText(element)) return;
        findFixedLauncher(element).classList.add(launcherClass, 'floating-app-launcher--chat');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markLaunchers);
  } else {
    markLaunchers();
  }

  window.setTimeout(markLaunchers, 1000);
  window.setTimeout(markLaunchers, 3000);
})();

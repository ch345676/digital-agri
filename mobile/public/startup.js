/* Deliberately ES5: this screen must work even when an app bundle cannot parse. */
(function () {
  var lastError = '';
  var timer;
  window.__HUINONG_READY__ = false;
  window.__HUINONG_BOOT_FAILED__ = false;
  function fail(reason) {
    window.__HUINONG_BOOT_FAILED__ = true;
    clearTimeout(timer);
    var panel = document.getElementById('app-startup');
    panel.style.display = 'flex';
    panel.setAttribute('role', 'alert');
    document.getElementById('startup-title').textContent = '页面暂时无法打开';
    document.getElementById('startup-message').textContent = '请重新打开，或先使用网页版。已有的本地记录会保留。';
    document.getElementById('startup-actions').hidden = false;
    document.getElementById('startup-detail').textContent = '惠农 1.0.2\n' + (reason || lastError || '启动超时') + '\n' + navigator.userAgent;
  }
  window.__huinongBoot = {
    ready: function () {
      clearTimeout(timer);
      window.__HUINONG_READY__ = true;
      window.__HUINONG_BOOT_FAILED__ = false;
      document.getElementById('app-startup').style.display = 'none';
    },
    fail: fail
  };
  window.addEventListener('error', function (event) {
    if (event.message) lastError = String(event.message).slice(0, 300);
    else if (event.target && event.target.tagName === 'SCRIPT') lastError = '页面脚本加载失败';
  }, true);
  window.addEventListener('unhandledrejection', function (event) {
    lastError = String(event.reason && event.reason.message || event.reason || '页面运行失败').slice(0, 300);
  });
  document.getElementById('startup-retry').onclick = function () { window.location.reload(); };
  timer = setTimeout(function () { if (!window.__HUINONG_READY__) fail(); }, 20000);
}());

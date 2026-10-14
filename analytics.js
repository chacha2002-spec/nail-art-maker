/* Optional page-view statistics; nail designs and files are never sent by this code. */
(function () {
  'use strict';
  var config = window.NAIL_ANALYTICS || {}, id = config.measurementId;
  if (typeof id !== 'string' || !/^G-[A-Z0-9]+$/.test(id)) return;
  if (location.protocol !== 'https:' || location.hostname !== 'chacha2002-spec.github.io') return;
  if (!location.pathname.startsWith('/nail-art-maker/')) return;
  var choiceKey = 'nail-statistics-consent-v1', banner;
  function readChoice() { try { return localStorage.getItem(choiceKey); } catch (_) { return null; } }
  function record(value) { try { localStorage.setItem(choiceKey, value); } catch (_) {} }
  function load() {
    if (window['ga-disable-' + id] || window.__nailAnalyticsLoaded) return;
    window.__nailAnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, {
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 2419200,
      cookie_update: false,
      page_location: location.origin + location.pathname,
      page_referrer: document.referrer ? document.referrer.split(/[?#]/)[0] : '',
      page_title: document.title
    });
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);
  }
  function removeBanner() { if (banner) { banner.remove(); banner = null; } }
  function decline() {
    record('denied');
    window['ga-disable-' + id] = true;
    if (window.gtag) window.gtag('consent', 'update', {analytics_storage:'denied'});
    var path = location.pathname.substring(0, location.pathname.lastIndexOf('/') + 1);
    document.cookie.split(';').forEach(function (part) {
      var name = part.trim().split('=')[0];
      if (name !== '_ga' && !name.startsWith('_ga_')) return;
      ['/', '/nail-art-maker/', path].forEach(function (p) {
        document.cookie = name + '=; Max-Age=0; Path=' + p;
        document.cookie = name + '=; Max-Age=0; Path=' + p + '; Domain=' + location.hostname;
      });
    });
    removeBanner();
  }
  function grant() {
    record('granted');
    window['ga-disable-' + id] = false;
    if (window.gtag) window.gtag('consent', 'update', {analytics_storage:'granted'});
    load(); removeBanner();
  }
  function button(text, action) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = text;
    b.style.cssText = 'font:inherit;font-size:13px;padding:9px 16px;border:1px solid #cfc7c2;border-radius:5px;background:#fff;color:#332d2b;cursor:pointer;min-height:40px';
    b.addEventListener('click', action); return b;
  }
  function show() {
    if (banner) return;
    banner = document.createElement('section');
    banner.setAttribute('role', 'region'); banner.setAttribute('aria-label', '방문 통계 선택');
    banner.style.cssText = 'position:fixed;z-index:1000;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));max-width:560px;margin:auto;padding:16px;box-sizing:border-box;background:#fffdfb;color:#332d2b;border:1px solid #ddd5cf;border-radius:8px;box-shadow:0 4px 22px #0002;font:14px/1.6 system-ui,sans-serif';
    var text = document.createElement('p');
    text.textContent = '방문 통계를 수집해도 될까요? Google Analytics로 이용 현황을 확인합니다. 거부해도 모든 편집 기능을 사용할 수 있어요.';
    text.style.cssText = 'margin:0 0 12px'; banner.appendChild(text);
    var actions = document.createElement('div'); actions.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap';
    actions.appendChild(button('허용', grant)); actions.appendChild(button('거부', decline));
    var link = document.createElement('a'); link.href = '/nail-art-maker/privacy.html'; link.textContent = '자세히'; link.style.cssText = 'margin-left:auto;color:#665650;font-size:13px'; actions.appendChild(link);
    banner.appendChild(actions); document.body.appendChild(banner);
  }
  window.nailStatisticsSettings = show;
  document.querySelectorAll('[data-statistics-settings]').forEach(function (b) { b.addEventListener('click', show); });
  var choice = readChoice();
  if (choice === 'granted') load();
  else if (choice !== 'denied') show();
}());

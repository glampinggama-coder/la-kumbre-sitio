/* La Kumbre — runtime mínimo para las plantillas del sitio.
   Lee <template id="tpl">, ejecuta la lógica de la página (Component.renderVals)
   y pinta #app. Soporta {{holes}}, <sc-for>, <sc-if>, onClick/onChange y value. */
(function () {
  'use strict';
  var tpl = document.getElementById('tpl');
  var app = document.getElementById('app');
  var logicSrc = document.getElementById('logic').textContent;

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (o) { Object.assign(this.state, o); schedule(); };
  DCLogic.prototype.forceUpdate = function () { schedule(); };

  var Component = new Function('DCLogic', logicSrc + '\nreturn Component;')(DCLogic);
  var comp = new Component({});
  if (!comp.state) comp.state = {};

  var pending = false;
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(function () { pending = false; render(); }); } }

  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var WHOLE = /^\{\{\s*([^}]+?)\s*\}\}$/;

  function lookup(path, scope) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.');
    var v;
    for (var i = scope.length - 1; i >= 0; i--) {
      if (scope[i] && Object.prototype.hasOwnProperty.call(scope[i], parts[0])) { v = scope[i][parts[0]]; break; }
    }
    for (var j = 1; j < parts.length; j++) { if (v == null) return undefined; v = v[parts[j]]; }
    return v;
  }
  function interp(str, scope) {
    return str.replace(HOLE, function (_, p) { var v = lookup(p, scope); return v == null || v === false ? '' : String(v); });
  }

  function renderChildren(src, out, scope) {
    for (var n = src.firstChild; n; n = n.nextSibling) renderNode(n, out, scope);
  }

  function renderNode(n, out, scope) {
    if (n.nodeType === 3) { out.appendChild(document.createTextNode(interp(n.nodeValue, scope))); return; }
    if (n.nodeType !== 1) return;
    var tag = n.tagName.toLowerCase();
    if (tag === 'sc-for') {
      var m = WHOLE.exec(n.getAttribute('list') || '');
      var list = m ? lookup(m[1], scope) : [];
      var as = n.getAttribute('as') || 'item';
      (list || []).forEach(function (item, idx) {
        var s = {}; s[as] = item; s.$index = idx;
        renderChildren(n, out, scope.concat([s]));
      });
      return;
    }
    if (tag === 'sc-if') {
      var mv = WHOLE.exec(n.getAttribute('value') || '');
      if (mv && lookup(mv[1], scope)) renderChildren(n, out, scope);
      return;
    }
    var el = document.createElementNS(n.namespaceURI, n.localName);
    var valueToSet;
    for (var i = 0; i < n.attributes.length; i++) {
      var a = n.attributes[i];
      var name = a.name;
      if (name.indexOf('hint-') === 0) continue;
      var whole = WHOLE.exec(a.value);
      if (name.indexOf('on') === 0 && whole) {
        var fn = lookup(whole[1], scope);
        if (typeof fn === 'function') {
          var evt = name.slice(2);
          if (evt === 'change' && (tag === 'input' || tag === 'textarea')) evt = 'input';
          el.addEventListener(evt, fn);
          if (evt === 'input') el.addEventListener('change', fn);
        }
        continue;
      }
      if (name === 'value' && (tag === 'input' || tag === 'select' || tag === 'textarea')) {
        valueToSet = whole ? lookup(whole[1], scope) : interp(a.value, scope);
        continue;
      }
      var val = whole ? lookup(whole[1], scope) : interp(a.value, scope);
      if (val === false || val == null) {
        if (name.indexOf('aria-') === 0) el.setAttribute(name, 'false');
        continue;
      }
      el.setAttribute(name, val === true ? (name.indexOf('aria-') === 0 ? 'true' : '') : String(val));
    }
    renderChildren(n.content || n, el, scope);
    if (valueToSet !== undefined) el.value = valueToSet == null ? '' : valueToSet;
    out.appendChild(el);
  }

  function render() {
    var openDetails = [], scrolls = [];
    app.querySelectorAll('details').forEach(function (d, i) { if (d.open) openDetails.push(i); });
    app.querySelectorAll('[data-keep-scroll]').forEach(function (d, i) { scrolls[i] = d.scrollLeft; });
    var vals = comp.renderVals();
    var frag = document.createDocumentFragment();
    renderChildren(tpl.content, frag, [vals]);
    app.textContent = '';
    app.appendChild(frag);
    var ds = app.querySelectorAll('details');
    openDetails.forEach(function (i) { if (ds[i]) ds[i].open = true; });
    app.querySelectorAll('[data-keep-scroll]').forEach(function (d, i) { if (scrolls[i]) d.scrollLeft = scrolls[i]; });
  }

  render();
})();

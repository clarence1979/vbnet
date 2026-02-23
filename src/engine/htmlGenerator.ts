import type { FormComponent, EventHandler, FormSettings } from '../types/component.types';

export function generateStandaloneHTML(
  formSettings: FormSettings,
  components: FormComponent[],
  eventHandlers: EventHandler[]
): string {
  const componentDefs = JSON.stringify(components);
  const handlerDefs = JSON.stringify(eventHandlers);
  const settingsDefs = JSON.stringify(formSettings);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${formSettings.text}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #2D2D2D; }
  .form-window { background: ${formSettings.backColor}; position: relative; box-shadow: 0 8px 32px rgba(0,0,0,0.3); border-radius: 0 0 4px 4px; }
  .title-bar { background: #0078D4; height: 32px; display: flex; align-items: center; padding: 0 12px; border-radius: 8px 8px 0 0; }
  .title-bar span { color: white; font-size: 12px; font-weight: 500; }
  .title-bar .controls { margin-left: auto; display: flex; align-items: center; }
  .title-bar .ctrl-btn { width: 46px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: default; transition: background 0.15s; }
  .title-bar .ctrl-btn:hover { background: rgba(255,255,255,0.1); }
  .title-bar .ctrl-btn.close:hover { background: #E81123; border-radius: 0 8px 0 0; }
  .title-bar .ctrl-btn svg { stroke: white; fill: none; stroke-width: 1.5; }
  button.vb-btn { background: linear-gradient(180deg, #F0F0F0, #E5E5E5); border: 1px solid #ADADAD; border-radius: 2px; cursor: pointer; font-family: inherit; }
  button.vb-btn:hover { background: linear-gradient(180deg, #E8E8E8, #DDDDDD); }
  button.vb-btn:active { background: #D0D0D0; }
  input.vb-input, textarea.vb-input { border: 1px solid #7A7A7A; padding: 2px 4px; font-family: inherit; outline: none; }
  input.vb-input:focus, textarea.vb-input:focus { border-color: #0078D4; }
  select.vb-select { border: 1px solid #7A7A7A; font-family: inherit; outline: none; }
  .msgbox-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .msgbox { background: white; border-radius: 4px; box-shadow: 0 4px 16px rgba(0,0,0,0.2); min-width: 300px; }
  .msgbox-title { background: #F0F0F0; padding: 8px 16px; border-bottom: 1px solid #CCC; font-size: 12px; font-weight: 500; }
  .msgbox-body { padding: 20px 24px; font-size: 13px; }
  .msgbox-footer { padding: 12px 16px; border-top: 1px solid #E0E0E0; display: flex; justify-content: flex-end; }
  .msgbox-footer button { padding: 6px 24px; font-size: 12px; }
</style>
</head>
<body>
<div>
  <div class="title-bar" style="width:${formSettings.width}px">
    <span>${formSettings.text}</span>
    <div class="controls">
      <button class="ctrl-btn" title="Minimize"><svg width="12" height="12" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
      <button class="ctrl-btn" title="Maximize"><svg width="10" height="10" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></button>
      <button class="ctrl-btn close" title="Close"><svg width="14" height="14" viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg></button>
    </div>
  </div>
  <div class="form-window" id="formCanvas" style="width:${formSettings.width}px;height:${formSettings.height}px;"></div>
</div>
<div id="msgboxContainer"></div>

<script>
(function() {
  var components = ${componentDefs};
  var handlers = ${handlerDefs};
  var settings = ${settingsDefs};
  var vars = {};
  var comps = {};
  var timerIds = {};

  function getComp(name) { return comps[name]; }
  function getProp(name, prop) {
    var c = comps[name];
    if (!c) return undefined;
    return c.props[prop];
  }
  function setProp(name, prop, val) {
    var c = comps[name];
    if (!c) return;
    c.props[prop] = val;
    updateDOM(name, prop, val);
  }

  function showMessageBox(msg) {
    var overlay = document.createElement('div');
    overlay.className = 'msgbox-overlay';
    overlay.innerHTML = '<div class="msgbox"><div class="msgbox-title">' + settings.text + '</div><div class="msgbox-body">' + escapeHtml(msg) + '</div><div class="msgbox-footer"><button class="vb-btn" onclick="this.closest(\\'.msgbox-overlay\\').remove()">OK</button></div></div>';
    document.getElementById('msgboxContainer').appendChild(overlay);
  }

  function escapeHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function updateDOM(name, prop, val) {
    var c = comps[name];
    if (!c || !c.el) return;
    var el = c.el;
    if (prop === 'text') {
      if (c.type === 'Button') el.textContent = val;
      else if (c.type === 'TextBox' || c.type === 'MaskedTextBox' || c.type === 'RichTextBox') el.value = val;
      else if (c.type === 'Label' || c.type === 'LinkLabel') el.textContent = val;
      else if (c.type === 'CheckBox' || c.type === 'RadioButton') { var span = el.querySelector('span'); if (span) span.textContent = val; }
      else if (c.type === 'GroupBox') { var legend = el.querySelector('legend'); if (legend) legend.textContent = val; }
      else if (c.type === 'StatusStrip') { var st = el.querySelector('.status-text'); if (st) st.textContent = val; }
      else if (c.type === 'NumericUpDown') { var ni = el.querySelector('input'); if (ni) ni.value = val; }
    }
    if (prop === 'visible') el.style.display = val ? '' : 'none';
    if (prop === 'enabled') {
      if (el.tagName === 'BUTTON' || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') el.disabled = !val;
    }
    if (prop === 'checked') { var inp = el.querySelector('input'); if (inp) inp.checked = val; }
    if (prop === 'value') {
      if (c.type === 'ProgressBar') {
        var bar = el.querySelector('.pb-fill');
        if (bar) bar.style.width = Math.min(100, Math.max(0, (val / (c.props.maximum || 100)) * 100)) + '%';
      }
      if (c.type === 'NumericUpDown') { var numIn = el.querySelector('input'); if (numIn) numIn.value = val; }
    }
    if (prop === 'backColor') el.style.backgroundColor = val;
    if (prop === 'foreColor') el.style.color = val;
    if (prop === 'items' && (c.type === 'ListBox' || c.type === 'ComboBox' || c.type === 'CheckedListBox')) {
      el.innerHTML = '';
      (val || []).forEach(function(item, i) {
        if (c.type === 'CheckedListBox') {
          var lbl = document.createElement('label');
          lbl.style.cssText = 'display:flex;align-items:center;gap:4px;padding:1px 2px;font-size:inherit';
          var chk = document.createElement('input'); chk.type = 'checkbox';
          var sp = document.createElement('span'); sp.textContent = item;
          lbl.appendChild(chk); lbl.appendChild(sp); el.appendChild(lbl);
        } else {
          var opt = document.createElement('option');
          opt.value = i;
          opt.textContent = item;
          el.appendChild(opt);
        }
      });
    }
    if (prop === 'selectedIndex' && (c.type === 'ListBox' || c.type === 'ComboBox')) {
      el.selectedIndex = val;
    }
    if (prop === 'statusText' && c.type === 'StatusStrip') {
      var stxt = el.querySelector('.status-text');
      if (stxt) stxt.textContent = val;
    }
  }

  function executeHandler(name) {
    var h = null;
    handlers.forEach(function(hh) {
      if (hh.componentName + '_' + hh.eventName === name) h = hh;
    });
    if (!h || !h.code) return;
    try {
      var fn = buildFunction(h.code);
      fn();
    } catch(e) { console.error('Runtime error in ' + name + ':', e); }
  }

  function buildFunction(code) {
    var lines = code.split('\\n');
    var jsLines = lines.map(function(line) { return translateLine(line.trim()); }).filter(Boolean);
    var body = jsLines.join('\\n');
    return new Function(body);
  }

  function translateLine(line) {
    if (!line || line.startsWith("'")) return '';
    var lower = line.toLowerCase();

    var msgMatch = line.match(/^MessageBox\\.Show\\((.+)\\)$/i);
    if (msgMatch) return 'showMessageBox(' + translateExpr(msgMatch[1]) + ');';

    var msgMatch2 = line.match(/^MsgBox\\((.+)\\)$/i);
    if (msgMatch2) return 'showMessageBox(' + translateExpr(msgMatch2[1]) + ');';

    var dimMatch = line.match(/^Dim\\s+(\\w+)\\s+As\\s+(\\w+)(?:\\s*=\\s*(.+))?$/i);
    if (dimMatch) {
      var init = dimMatch[3] ? translateExpr(dimMatch[3]) : defaultForType(dimMatch[2]);
      return 'vars["' + dimMatch[1] + '"] = ' + init + ';';
    }

    var assignMatch = line.match(/^(\\w+)\\.(\\w+)\\s*=\\s*(.+)$/);
    if (assignMatch) return 'setProp("' + assignMatch[1] + '","' + mapProp(assignMatch[2]) + '",' + translateExpr(assignMatch[3]) + ');';

    var varAssign = line.match(/^(\\w+)\\s*=\\s*(.+)$/);
    if (varAssign && !lower.startsWith('if') && !lower.startsWith('for')) {
      return 'vars["' + varAssign[1] + '"] = ' + translateExpr(varAssign[2]) + ';';
    }

    var ifMatch = line.match(/^If\\s+(.+)\\s+Then$/i);
    if (ifMatch) return 'if (' + translateExpr(ifMatch[1]) + ') {';
    if (lower === 'else') return '} else {';
    if (lower.startsWith('elseif')) {
      var eifM = line.match(/^ElseIf\\s+(.+)\\s+Then$/i);
      return '} else if (' + (eifM ? translateExpr(eifM[1]) : 'true') + ') {';
    }
    if (lower === 'end if') return '}';

    var forMatch = line.match(/^For\\s+(\\w+)\\s*=\\s*(.+)\\s+To\\s+(.+?)(?:\\s+Step\\s+(.+))?$/i);
    if (forMatch) {
      var v = forMatch[1], s = translateExpr(forMatch[2]), e = translateExpr(forMatch[3]), st = forMatch[4] ? translateExpr(forMatch[4]) : '1';
      return 'for (vars["'+v+'"] = '+s+'; vars["'+v+'"] <= '+e+'; vars["'+v+'"] += '+st+') {';
    }
    if (lower.startsWith('next')) return '}';

    return '';
  }

  function translateExpr(expr) {
    if (!expr) return '""';
    expr = expr.trim();
    expr = expr.replace(/\\bAnd\\b/gi, '&&').replace(/\\bOr\\b/gi, '||').replace(/\\bNot\\b/gi, '!');
    expr = expr.replace(/\\bMod\\b/gi, '%');
    expr = expr.replace(/<>/g, '!==').replace(/(^|[^<>!])=/g, '$1===');
    expr = expr.replace(/&/g, '+');
    expr = expr.replace(/(\\w+)\\.(\\w+)/g, function(m, obj, prop) {
      if (obj === 'MessageBox' || obj === 'Console') return m;
      return 'getProp("'+obj+'","'+mapProp(prop)+'")';
    });
    expr = expr.replace(/\\bInputBox\\(/gi, 'prompt(');
    expr = expr.replace(/\\bCInt\\(/gi, 'parseInt(').replace(/\\bCStr\\(/gi, 'String(').replace(/\\bCDbl\\(/gi, 'parseFloat(').replace(/\\bVal\\(/gi, 'parseFloat(');
    expr = expr.replace(/\\bTrue\\b/gi, 'true').replace(/\\bFalse\\b/gi, 'false');
    expr = expr.replace(/\\b([A-Z]\\w+)(?!\\(|\\.)\\b/g, function(m, name) {
      if (comps[name]) return 'getProp("'+name+'","text")';
      if (['true','false','null','undefined','parseInt','parseFloat','String','Math'].indexOf(name) >= 0) return m;
      return 'vars["'+name+'"]';
    });
    return expr;
  }

  function mapProp(p) {
    var m = {text:'text',value:'value',enabled:'enabled',visible:'visible',checked:'checked',backcolor:'backColor',forecolor:'foreColor',left:'left',top:'top',width:'width',height:'height',selectedindex:'selectedIndex',maximum:'maximum',minimum:'minimum',items:'items',increment:'increment',decimalplaces:'decimalPlaces',statustext:'statusText',linkcolor:'linkColor',url:'url',interval:'interval',mask:'mask'};
    return m[p.toLowerCase()] || p;
  }

  function defaultForType(t) {
    t = t.toLowerCase();
    if (t === 'integer' || t === 'long' || t === 'double' || t === 'single') return '0';
    if (t === 'boolean') return 'false';
    return '""';
  }

  function createElements() {
    var canvas = document.getElementById('formCanvas');
    components.forEach(function(comp) {
      var el;
      var s = {
        position: 'absolute', left: comp.left+'px', top: comp.top+'px',
        width: comp.width+'px', height: comp.height+'px',
        fontFamily: comp.font.family, fontSize: comp.font.size+'pt',
        fontWeight: comp.font.bold ? 'bold' : 'normal',
        fontStyle: comp.font.italic ? 'italic' : 'normal',
        color: comp.foreColor, zIndex: comp.zIndex
      };

      switch(comp.type) {
        case 'Button':
          el = document.createElement('button');
          el.className = 'vb-btn';
          el.textContent = comp.text;
          el.onclick = function() { executeHandler(comp.name + '_Click'); };
          break;
        case 'TextBox':
          el = comp.multiline ? document.createElement('textarea') : document.createElement('input');
          el.className = 'vb-input';
          el.value = comp.text;
          if (comp.passwordChar) el.type = 'password';
          if (comp.readOnly) el.readOnly = true;
          if (comp.maxLength) el.maxLength = comp.maxLength;
          el.oninput = function() {
            comps[comp.name].props.text = el.value;
            executeHandler(comp.name + '_TextChanged');
          };
          break;
        case 'MaskedTextBox':
          el = document.createElement('input');
          el.className = 'vb-input';
          el.value = comp.text;
          if (comp.mask) el.placeholder = comp.mask;
          el.oninput = function() {
            comps[comp.name].props.text = el.value;
            executeHandler(comp.name + '_TextChanged');
          };
          break;
        case 'RichTextBox':
          el = document.createElement('textarea');
          el.className = 'vb-input';
          el.value = comp.text;
          if (comp.readOnly) el.readOnly = true;
          el.oninput = function() {
            comps[comp.name].props.text = el.value;
            executeHandler(comp.name + '_TextChanged');
          };
          break;
        case 'Label':
          el = document.createElement('div');
          el.textContent = comp.text;
          Object.assign(s, { display: 'flex', alignItems: 'center' });
          break;
        case 'LinkLabel':
          el = document.createElement('a');
          el.textContent = comp.text;
          el.href = '#';
          el.style.color = comp.linkColor || '#0066CC';
          el.style.textDecoration = 'underline';
          el.style.cursor = 'pointer';
          Object.assign(s, { display: 'flex', alignItems: 'center' });
          el.onclick = function(e) { e.preventDefault(); executeHandler(comp.name + '_LinkClicked'); };
          break;
        case 'CheckBox':
          el = document.createElement('label');
          var cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = comp.checked || false;
          var cbSpan = document.createElement('span');
          cbSpan.textContent = comp.text;
          cbSpan.style.marginLeft = '4px';
          el.appendChild(cb);
          el.appendChild(cbSpan);
          Object.assign(s, { display: 'flex', alignItems: 'center', cursor: 'pointer' });
          cb.onchange = function() { comps[comp.name].props.checked = cb.checked; executeHandler(comp.name + '_CheckedChanged'); };
          break;
        case 'RadioButton':
          el = document.createElement('label');
          var rb = document.createElement('input');
          rb.type = 'radio';
          rb.checked = comp.checked || false;
          var rbSpan = document.createElement('span');
          rbSpan.textContent = comp.text;
          rbSpan.style.marginLeft = '4px';
          el.appendChild(rb);
          el.appendChild(rbSpan);
          Object.assign(s, { display: 'flex', alignItems: 'center', cursor: 'pointer' });
          rb.onchange = function() { comps[comp.name].props.checked = rb.checked; executeHandler(comp.name + '_CheckedChanged'); };
          break;
        case 'ComboBox':
          el = document.createElement('select');
          el.className = 'vb-select';
          (comp.items||[]).forEach(function(item,i) { var o=document.createElement('option'); o.value=i; o.textContent=item; el.appendChild(o); });
          if (comp.selectedIndex >= 0) el.selectedIndex = comp.selectedIndex;
          el.onchange = function() { comps[comp.name].props.selectedIndex = el.selectedIndex; executeHandler(comp.name + '_SelectedIndexChanged'); };
          break;
        case 'ListBox':
          el = document.createElement('select');
          el.className = 'vb-select';
          el.multiple = true;
          (comp.items||[]).forEach(function(item,i) { var o=document.createElement('option'); o.value=i; o.textContent=item; el.appendChild(o); });
          el.onchange = function() { comps[comp.name].props.selectedIndex = el.selectedIndex; executeHandler(comp.name + '_SelectedIndexChanged'); };
          break;
        case 'CheckedListBox':
          el = document.createElement('div');
          Object.assign(s, { border: '1px solid #7A7A7A', background: '#FFFFFF', overflowY: 'auto' });
          (comp.items||[]).forEach(function(item,i) {
            var lbl = document.createElement('label');
            lbl.style.cssText = 'display:flex;align-items:center;gap:4px;padding:1px 4px;cursor:pointer;font-size:inherit';
            var chk = document.createElement('input'); chk.type = 'checkbox';
            chk.onchange = function() { executeHandler(comp.name + '_SelectedIndexChanged'); };
            var sp = document.createElement('span'); sp.textContent = item;
            lbl.appendChild(chk); lbl.appendChild(sp); el.appendChild(lbl);
          });
          break;
        case 'NumericUpDown':
          el = document.createElement('input');
          el.type = 'number';
          el.className = 'vb-input';
          el.value = comp.value || 0;
          el.min = comp.minimum || 0;
          el.max = comp.maximum || 100;
          el.step = comp.increment || 1;
          el.oninput = function() {
            comps[comp.name].props.value = parseFloat(el.value);
            executeHandler(comp.name + '_ValueChanged');
          };
          break;
        case 'DateTimePicker':
          el = document.createElement('input');
          el.type = 'date';
          el.className = 'vb-input';
          el.oninput = function() {
            comps[comp.name].props.text = el.value;
            executeHandler(comp.name + '_ValueChanged');
          };
          break;
        case 'MonthCalendar':
          el = document.createElement('input');
          el.type = 'date';
          el.className = 'vb-input';
          el.oninput = function() { executeHandler(comp.name + '_ValueChanged'); };
          break;
        case 'ProgressBar':
          el = document.createElement('div');
          Object.assign(s, { border: '1px solid #ADADAD', background: '#E6E6E6', overflow: 'hidden' });
          var fill = document.createElement('div');
          fill.className = 'pb-fill';
          fill.style.cssText = 'height:100%;background:#06B025;width:' + Math.min(100, Math.max(0, ((comp.value||0)/(comp.maximum||100))*100)) + '%;transition:width 200ms';
          el.appendChild(fill);
          break;
        case 'GroupBox':
          el = document.createElement('fieldset');
          el.style.border = '1px solid #ADADAD';
          el.style.borderRadius = '4px';
          var legend = document.createElement('legend');
          legend.textContent = comp.text;
          legend.style.padding = '0 4px';
          el.appendChild(legend);
          break;
        case 'Panel':
          el = document.createElement('div');
          if (comp.borderStyle === 'FixedSingle') s.border = '1px solid #7A7A7A';
          break;
        case 'PictureBox':
          el = document.createElement('div');
          Object.assign(s, { border: '1px solid #7A7A7A', background: comp.backColor, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' });
          if (comp.imageUrl) { var img = document.createElement('img'); img.src = comp.imageUrl; img.style.cssText='width:100%;height:100%;object-fit:contain'; el.appendChild(img); }
          break;
        case 'ListView':
          el = document.createElement('div');
          Object.assign(s, { border: '1px solid #7A7A7A', background: '#FFFFFF', overflow: 'auto' });
          if (comp.columns) {
            var hdr = document.createElement('div');
            hdr.style.cssText = 'display:flex;background:#F0F0F0;border-bottom:1px solid #CCC;font-size:11px';
            comp.columns.forEach(function(col) {
              var c = document.createElement('div');
              c.style.cssText = 'flex:1;padding:2px 6px;border-right:1px solid #CCC';
              c.textContent = col;
              hdr.appendChild(c);
            });
            el.appendChild(hdr);
          }
          break;
        case 'TreeView':
          el = document.createElement('div');
          Object.assign(s, { border: '1px solid #7A7A7A', background: '#FFFFFF', overflow: 'auto', padding: '2px' });
          (comp.nodes||[]).forEach(function(node) {
            var d = document.createElement('div');
            d.style.cssText = 'padding:1px 4px;cursor:pointer;font-size:inherit';
            d.textContent = node;
            d.onclick = function() { executeHandler(comp.name + '_AfterSelect'); };
            el.appendChild(d);
          });
          break;
        case 'WebBrowser':
          el = document.createElement('div');
          Object.assign(s, { border: '1px solid #7A7A7A', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#999' });
          el.textContent = comp.url || 'WebBrowser';
          break;
        case 'TabControl':
          el = document.createElement('div');
          Object.assign(s, { border: '1px solid #7A7A7A', display: 'flex', flexDirection: 'column' });
          var tabBar = document.createElement('div');
          tabBar.style.cssText = 'display:flex;background:#F0F0F0;border-bottom:1px solid #CCC';
          (comp.tabs||[]).forEach(function(tab, ti) {
            var t = document.createElement('div');
            t.style.cssText = 'padding:4px 12px;cursor:pointer;font-size:11px;border-right:1px solid #CCC';
            if (ti === (comp.selectedIndex||0)) t.style.background = '#FFFFFF';
            t.textContent = tab;
            t.onclick = function() { comps[comp.name].props.selectedIndex = ti; executeHandler(comp.name + '_SelectedIndexChanged'); };
            tabBar.appendChild(t);
          });
          el.appendChild(tabBar);
          break;
        case 'SplitContainer':
          el = document.createElement('div');
          Object.assign(s, { border: '1px solid #CCC', display: 'flex', flexDirection: comp.orientation === 'Horizontal' ? 'column' : 'row' });
          var p1 = document.createElement('div'); p1.style.cssText = 'flex:1;border:1px dashed #CCC';
          var p2 = document.createElement('div'); p2.style.cssText = 'flex:1;border:1px dashed #CCC';
          el.appendChild(p1); el.appendChild(p2);
          break;
        case 'FlowLayoutPanel':
          el = document.createElement('div');
          var fd = comp.flowDirection === 'TopDown' ? 'column' : comp.flowDirection === 'RightToLeft' ? 'row-reverse' : comp.flowDirection === 'BottomUp' ? 'column-reverse' : 'row';
          Object.assign(s, { display: 'flex', flexDirection: fd, flexWrap: 'wrap' });
          if (comp.borderStyle === 'FixedSingle') s.border = '1px solid #7A7A7A';
          break;
        case 'TableLayoutPanel':
          el = document.createElement('div');
          Object.assign(s, { display: 'grid', gridTemplateColumns: '1fr 1fr' });
          if (comp.borderStyle === 'FixedSingle') s.border = '1px solid #7A7A7A';
          break;
        case 'MenuStrip':
          el = document.createElement('div');
          Object.assign(s, { display: 'flex', alignItems: 'center', background: '#F0F0F0', borderBottom: '1px solid #CCC', position: 'absolute', left: '0', top: '0', width: '100%', height: comp.height + 'px' });
          (comp.menuItems||[]).forEach(function(mi) {
            var m = document.createElement('div');
            m.style.cssText = 'padding:4px 10px;cursor:pointer;font-size:12px';
            m.textContent = mi;
            m.onmouseover = function() { m.style.background = '#E0E0E0'; };
            m.onmouseout = function() { m.style.background = ''; };
            m.onclick = function() { executeHandler(comp.name + '_ItemClicked'); };
            el.appendChild(m);
          });
          break;
        case 'ToolStrip':
          el = document.createElement('div');
          Object.assign(s, { display: 'flex', alignItems: 'center', gap: '2px', background: '#F0F0F0', borderBottom: '1px solid #CCC', padding: '2px' });
          (comp.menuItems||[]).forEach(function(mi) {
            var b = document.createElement('button');
            b.className = 'vb-btn';
            b.style.cssText = 'padding:2px 8px;font-size:11px';
            b.textContent = mi;
            b.onclick = function() { executeHandler(comp.name + '_ItemClicked'); };
            el.appendChild(b);
          });
          break;
        case 'StatusStrip':
          el = document.createElement('div');
          Object.assign(s, { display: 'flex', alignItems: 'center', background: comp.backColor || '#007ACC', position: 'absolute', left: '0', bottom: '0', width: '100%', height: comp.height + 'px', padding: '0 8px' });
          var stSpan = document.createElement('span');
          stSpan.className = 'status-text';
          stSpan.style.cssText = 'font-size:11px;color:' + (comp.foreColor || '#FFFFFF');
          stSpan.textContent = comp.statusText || 'Ready';
          el.appendChild(stSpan);
          break;
        case 'Chart':
          el = document.createElement('div');
          Object.assign(s, { border: '1px solid #CCC', background: '#FFFFFF', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', padding: '8px' });
          var colors = ['#4472C4','#ED7D31','#A5A5A5','#FFC000','#5B9BD5'];
          [60,80,45,90,55].forEach(function(h, i) {
            var bar = document.createElement('div');
            bar.style.cssText = 'width:20px;background:' + colors[i%5] + ';height:' + h + '%;border-radius:2px 2px 0 0';
            el.appendChild(bar);
          });
          break;
        case 'BindingNavigator':
          el = document.createElement('div');
          Object.assign(s, { display: 'flex', alignItems: 'center', gap: '4px', background: '#F0F0F0', border: '1px solid #CCC', padding: '2px 4px' });
          ['|<','<','1 of 1','>','>|'].forEach(function(t) {
            var b = document.createElement('button');
            b.className = 'vb-btn';
            b.style.cssText = 'padding:1px 6px;font-size:10px;min-width:24px';
            b.textContent = t;
            el.appendChild(b);
          });
          break;
        case 'Timer':
        case 'NotifyIcon':
        case 'ToolTip':
        case 'ContextMenuStrip':
        case 'ToolStripContainer':
          el = null;
          break;
        default:
          el = document.createElement('div');
      }

      if (el) {
        if (comp.type !== 'ProgressBar' && comp.type !== 'GroupBox') {
          if (comp.backColor !== 'transparent') s.backgroundColor = comp.backColor;
        }

        Object.assign(el.style, s);
        if (!comp.enabled) el.disabled = true;
        if (!comp.visible) el.style.display = 'none';

        canvas.appendChild(el);
      }

      comps[comp.name] = {
        type: comp.type,
        el: el,
        props: {
          text: comp.text, enabled: comp.enabled, visible: comp.visible,
          checked: comp.checked, backColor: comp.backColor, foreColor: comp.foreColor,
          left: comp.left, top: comp.top, width: comp.width, height: comp.height,
          items: comp.items ? comp.items.slice() : undefined,
          selectedIndex: comp.selectedIndex, value: comp.value,
          maximum: comp.maximum, minimum: comp.minimum, imageUrl: comp.imageUrl,
          increment: comp.increment, statusText: comp.statusText,
          linkColor: comp.linkColor, url: comp.url
        }
      };

      if (comp.type === 'Timer' && comp.enabled && comp.interval) {
        timerIds[comp.name] = setInterval(function() { executeHandler(comp.name + '_Tick'); }, comp.interval);
      }
    });
  }

  createElements();
  executeHandler(settings.name + '_Load');
})();
</script>
</body>
</html>`;
}

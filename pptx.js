/* pptx.js — Présentation PowerPoint de la soutenance (20 diapositives), ANIMÉE, construite sur le même plan et les mêmes chiffres
 *  que le rapport Word (report.js) : enquête → étude de marché → prototype → hypothèses financières → faisabilité → conclusion.
 *  - Style « HUD technologique » : anneaux qui tournent en continu, transitions Morphing (repli : fondu), entrées animées
 *    (fondu, zoom, volée, balayage), pulsations et flottements — l'esprit des présentations professionnelles animées.
 *  - Le thème de la présentation SUIT celui de la plateforme au moment de l'export (clair ou sombre), de même que les captures
 *    d'écran du prototype (prises en direct, voir docs-common.js).
 *  - Graphiques PowerPoint NATIFS (modifiables) ; mêmes chiffres que le rapport Word.
 *  - Les bibliothèques PptxGenJS et JSZip sont chargées à la demande (dossier vendor/, repli sur un CDN).
 *  - Ne modifie aucune formule ni aucune autre fonction du site. */
(function (root) {
  'use strict';
  const D = root.PaygDocs, R = root.PaygReport;
  const { num, mru, pct, pctRaw } = D;
  const W = 13.333, H = 7.5, FONT = 'Arial', MONO = 'Consolas';
  const noEmoji = (s) => String(s == null ? '' : s).replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').replace(/\s+/g, ' ').trim();
  const b64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };

  /* ---------- Palettes (selon le thème de la plateforme) ---------- */
  const PALETTES = {
    dark: { bg: '050B14', slate: 'DCE9F7', gray: '93A9C3', light: '0A1828', line: '1E4A63', green: '34D399', greenDark: '5EEAD4', lime: '0E2A2A', gold: 'FBBF24', orange: 'FBBF24', orangeDark: 'FB923C', blue: '38BDF8', blueDark: '818CF8', red: 'F87171', white: 'FFFFFF', cream: '1F2937', navy: '050B14', thead: '0E3B4F', rowA: '0A1828', rowB: '0D2236', okFill: '0F766E', warnFill: 'B45309', badFill: 'B91C1C', grid: '1E3447', a1: '22D3EE', a2: '34D399', a3: 'FBBF24', ringT: 45, cardT: 12 },
    light: { bg: 'F4F8FB', slate: '334155', gray: '64748B', light: 'FFFFFF', line: 'BFD3E0', green: '16803A', greenDark: '14532D', lime: 'DCFCE7', gold: 'D4AF37', orange: 'D97706', orangeDark: 'EA580C', blue: '1D6FE0', blueDark: '1E3A8A', red: 'DC2626', white: 'FFFFFF', cream: 'FEF3C7', navy: '0F172A', thead: '14532D', rowA: 'FFFFFF', rowB: 'F1F5F9', okFill: '14532D', warnFill: 'C2410C', badFill: 'B91C1C', grid: 'E2E8F0', a1: '0E7490', a2: '16803A', a3: 'D97706', ringT: 58, cardT: 0 }
  };

  /* ---------- Chargement des bibliothèques ---------- */
  async function loadLibs() {
    if (!root.PptxGenJS) await D.loadScript('vendor/pptxgen.bundle.js', 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js');
    if (!root.PptxGenJS) throw new Error('pptx load');
    try { if (!root.JSZip) await D.loadScript('vendor/jszip.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'); } catch (e) { /* animations facultatives */ }
  }

  /* ---------- Arrière-plans (SVG -> JPEG) ---------- */
  function bgSvg(mode, kind) {
    const dark = mode === 'dark', base = dark ? '#050B14' : '#F4F8FB', c1 = dark ? '#0E7490' : '#38BDF8', c2 = dark ? '#047857' : '#34D399', c3 = dark ? '#1E3A8A' : '#FBBF24';
    const o1 = dark ? 0.55 : 0.22, o2 = dark ? 0.4 : 0.2, grid = dark ? '#22D3EE' : '#0E7490', go = dark ? 0.06 : 0.05;
    const pos = { cover: [[0.2, 0.5, 0.75, c1, o1], [0.85, 0.15, 0.5, c2, o2], [0.7, 0.95, 0.5, c3, o2 * 0.7]], a: [[0.92, 0.1, 0.55, c1, o1], [0.05, 0.98, 0.5, c2, o2], [0.5, 1.05, 0.4, c3, o2 * 0.5]], b: [[0.08, 0.1, 0.5, c2, o2], [0.95, 0.95, 0.6, c1, o1], [0.6, -0.1, 0.4, c3, o2 * 0.5]] }[kind];
    const g = pos.map((p, i) => '<radialGradient id="g' + i + '" cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '"><stop offset="0" stop-color="' + p[3] + '" stop-opacity="' + p[4] + '"/><stop offset="1" stop-color="' + p[3] + '" stop-opacity="0"/></radialGradient>').join('');
    let s = '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><defs>' + g + '<pattern id="gr" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M64 0H0V64" fill="none" stroke="' + grid + '" stroke-opacity="' + go + '" stroke-width="1"/></pattern></defs><rect width="1600" height="900" fill="' + base + '"/>';
    pos.forEach((p, i) => { s += '<rect width="1600" height="900" fill="url(#g' + i + ')"/>'; });
    s += '<rect width="1600" height="900" fill="url(#gr)"/>';
    if (dark) for (let i = 0; i < 60; i++) { const x = (i * 193) % 1600, y = (i * 389) % 900; s += '<circle cx="' + x + '" cy="' + y + '" r="' + (1 + (i % 3) * 0.6) + '" fill="#9BE7FF" opacity="' + (0.12 + (i % 5) * 0.05) + '"/>'; }
    return s + '</svg>';
  }

  /* ---------- Animations : post-traitement du fichier .pptx ---------- */
  const NSP = 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
  const MORPH = '<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main"><mc:Choice Requires="p159"><p:transition spd="slow" xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" p14:dur="1600"><p159:morph option="byObject"/></p:transition></mc:Choice><mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>';
  const TRANS = {
    morph: MORPH,
    fade: '<p:transition spd="slow"><p:fade/></p:transition>',
    push: '<p:transition spd="med"><p:push dir="u"/></p:transition>',
    wipe: '<p:transition spd="med"><p:wipe dir="r"/></p:transition>',
    zoom: '<p:transition spd="med"><p:zoom dir="in"/></p:transition>',
    split: '<p:transition spd="med"><p:split orient="vert" dir="out"/></p:transition>',
    cover: '<p:transition spd="med"><p:cover dir="l"/></p:transition>'
  };
  function timingXml(items, slideKind) {
    let id = 4; const nid = () => ++id;
    const tg = (sp) => '<p:tgtEl><p:spTgt spid="' + sp + '"/></p:tgtEl>';
    const vis = (sp) => '<p:set><p:cBhvr><p:cTn id="' + nid() + '" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>' + tg(sp) + '<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>';
    const fadeEff = (sp, dur) => '<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="' + nid() + '" dur="' + dur + '"/>' + tg(sp) + '</p:cBhvr></p:animEffect>';
    const anim = (sp, attr, v0, v1, dur) => '<p:anim calcmode="lin" valueType="num"><p:cBhvr additive="base"><p:cTn id="' + nid() + '" dur="' + dur + '" fill="hold"/>' + tg(sp) + '<p:attrNameLst><p:attrName>' + attr + '</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:strVal val="' + v0 + '"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="' + v1 + '"/></p:val></p:tav></p:tavLst></p:anim>';
    const animF = (sp, attr, f0, dur) => '<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="' + nid() + '" dur="' + dur + '" fill="hold"/>' + tg(sp) + '<p:attrNameLst><p:attrName>' + attr + '</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:fltVal val="' + f0 + '"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="#' + attr + '"/></p:val></p:tav></p:tavLst></p:anim>';
    const EFF = {
      fade: (sp, d) => ({ pid: 10, sub: 0, body: vis(sp) + fadeEff(sp, d) }),
      zoom: (sp, d) => ({ pid: 53, sub: 16, body: vis(sp) + animF(sp, 'ppt_w', 0, d) + animF(sp, 'ppt_h', 0, d) + fadeEff(sp, d) }),
      'fly-b': (sp, d) => ({ pid: 2, sub: 4, body: vis(sp) + anim(sp, 'ppt_x', '#ppt_x', '#ppt_x', d) + anim(sp, 'ppt_y', '1+#ppt_h/2', '#ppt_y', d) }),
      'fly-l': (sp, d) => ({ pid: 2, sub: 8, body: vis(sp) + anim(sp, 'ppt_x', '0-#ppt_w/2', '#ppt_x', d) + anim(sp, 'ppt_y', '#ppt_y', '#ppt_y', d) }),
      'fly-r': (sp, d) => ({ pid: 2, sub: 2, body: vis(sp) + anim(sp, 'ppt_x', '1+#ppt_w/2', '#ppt_x', d) + anim(sp, 'ppt_y', '#ppt_y', '#ppt_y', d) }),
      'fly-t': (sp, d) => ({ pid: 2, sub: 1, body: vis(sp) + anim(sp, 'ppt_x', '#ppt_x', '#ppt_x', d) + anim(sp, 'ppt_y', '0-#ppt_h/2', '#ppt_y', d) }),
      'wipe-l': (sp, d) => ({ pid: 22, sub: 8, body: vis(sp) + '<p:animEffect transition="in" filter="wipe(left)"><p:cBhvr><p:cTn id="' + nid() + '" dur="' + d + '"/>' + tg(sp) + '</p:cBhvr></p:animEffect>' }),
      'wipe-b': (sp, d) => ({ pid: 22, sub: 4, body: vis(sp) + '<p:animEffect transition="in" filter="wipe(down)"><p:cBhvr><p:cTn id="' + nid() + '" dur="' + d + '"/>' + tg(sp) + '</p:cBhvr></p:animEffect>' })
    };
    const par = (cls, pid, sub, delay, body, attrs, node, end) => '<p:par><p:cTn id="' + nid() + '" presetID="' + pid + '" presetClass="' + cls + '" presetSubtype="' + sub + '"' + (attrs || '') + ' fill="hold" nodeType="' + node + '"><p:stCondLst><p:cond delay="' + delay + '"/></p:stCondLst>' + (end ? '<p:endCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:endCondLst>' : '') + '<p:childTnLst>' + body + '</p:childTnLst></p:cTn></p:par>';
    let first = true; const pars = [];
    items.forEach((it) => {
      const node = first ? 'afterEffect' : 'withEffect'; first = false; const g = it.kind === 'sp' ? ' grpId="0"' : '';
      if (it.type === 'in') { const e = (EFF[it.eff] || EFF.fade)(it.spid, it.dur || 600); pars.push(par('entr', e.pid, e.sub, it.delay, e.body, g, node, false)); }
      else if (it.type === 'spin') {
        const by = it.eff === 'spinr' ? '-21600000' : '21600000';
        pars.push(par('emph', 8, 0, it.delay, '<p:animRot by="' + by + '"><p:cBhvr><p:cTn id="' + nid() + '" dur="' + it.dur + '" fill="hold"/>' + tg(it.spid) + '<p:attrNameLst><p:attrName>r</p:attrName></p:attrNameLst></p:cBhvr></p:animRot>', ' repeatCount="indefinite"', node, true));
      } else if (it.type === 'pulse') {
        pars.push(par('emph', 6, 0, it.delay, '<p:animScale><p:cBhvr><p:cTn id="' + nid() + '" dur="' + it.dur + '" autoRev="1" fill="hold"/>' + tg(it.spid) + '</p:cBhvr><p:by x="108000" y="108000"/></p:animScale>', ' repeatCount="indefinite"' + g, node, true));
      } else if (it.type === 'float') {
        pars.push(par('path', 63, 0, it.delay, '<p:animMotion origin="layout" path="M 0 0 L 0 ' + (it.dy || 0.03) + ' " pathEditMode="relative" rAng="0" ptsTypes="AA"><p:cBhvr><p:cTn id="' + nid() + '" dur="' + it.dur + '" fill="hold"/>' + tg(it.spid) + '<p:attrNameLst><p:attrName>ppt_x</p:attrName><p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr><p:rCtr x="0" y="' + Math.round((it.dy || 0.03) * 50000) + '"/></p:animMotion>', ' repeatCount="indefinite" accel="50000" decel="50000" autoRev="1"' + g, node, false));
      }
    });
    const bld = []; const seen = {};
    items.forEach((it) => { if (seen[it.spid]) return; seen[it.spid] = 1; if (it.kind === 'sp') bld.push('<p:bldP spid="' + it.spid + '" grpId="0" animBg="1"/>'); else if (it.kind === 'chart') bld.push('<p:bldGraphic spid="' + it.spid + '" grpId="0"><p:bldAsOne/></p:bldGraphic>'); });
    return '<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst><p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst><p:par><p:cTn id="4" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>' + pars.join('') + '</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst>' + (bld.length ? '<p:bldLst>' + bld.join('') + '</p:bldLst>' : '') + '</p:timing>';
  }

  /* Lit les noms d'objets « @effet:délai:durée » / « ~spin:durée » posés par le générateur, renumérote les identifiants (uniques), puis ajoute transition + animations. */
  async function animateDeck(buf, trans) {
    if (!root.JSZip) return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    const zip = await root.JSZip.loadAsync(buf);
    const names = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
    for (const n of names) {
      const idx = +n.match(/slide(\d+)\.xml/)[1];
      let xml = await zip.file(n).async('string');
      // 1) identifiants uniques (PptxGenJS peut en répéter pour les tableaux / graphiques)
      let next = 1; const seq = [];
      xml = xml.replace(/<p:cNvPr id="\d+"/g, () => { next++; seq.push(next); return '<p:cNvPr id="' + next + '"'; });
      xml = xml.replace(/(<p:nvGrpSpPr><p:cNvPr id=")\d+(")/, '$11$2'); // le groupe racine garde l'id 1
      // 2) objets animés
      const items = []; let k = 0;
      const re = /<p:(sp|pic|graphicFrame|cxnSp)>[\s\S]*?<\/p:\1>/g; let m;
      while ((m = re.exec(xml))) {
        const blk = m[0], nm = blk.match(/<p:cNvPr id="(\d+)" name="([^"]*)"/); if (!nm) continue;
        const spid = nm[1], spec = nm[2].replace(/&amp;/g, '&');
        const kind = m[1] === 'graphicFrame' ? (/<a:tbl>|<a:tbl /.test(blk) ? 'tbl' : 'chart') : (m[1] === 'pic' ? 'pic' : 'sp');
        spec.split(/(?=[@~])/).forEach((tok) => {
          const mm = tok.match(/^([@~])([\w-]+):?(\d*):?(\d*)/); if (!mm) return;
          if (mm[1] === '@') items.push({ type: 'in', eff: mm[2], spid, kind, delay: +mm[3] || 0, dur: +mm[4] || 600 });
          else { const dur = +mm[3] || 30000; items.push({ type: mm[2].indexOf('spin') === 0 ? 'spin' : mm[2], eff: mm[2], spid, kind, delay: +mm[4] || 0, dur, dy: 0.03 }); }
        });
        k++;
      }
      const tr = trans[idx - 1] || 'fade';
      const insert = (TRANS[tr] || TRANS.fade) + (items.length ? timingXml(items) : '');
      xml = xml.replace('</p:clrMapOvr>', '</p:clrMapOvr>' + insert);
      zip.file(n, xml);
    }
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 }, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  }
  function save(blob, name) { const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 4000); }

  /* =====================================================================
   *  CONSTRUCTION DE LA PRÉSENTATION
   * ===================================================================== */
  async function write(ctx, fileName) {
    await loadLibs();
    const mode = (ctx.shots && ctx.shots.theme) || D.theme();
    const K = Object.assign({}, PALETTES[mode]);
    const dark = mode === 'dark';
    const a = R.analyze(ctx), E = a.E, g = a.g, sc = a.sc, res = a.res, ind = a.ind, has = a.has;
    const cen = res.central, pru = res.prudent, dyn = res.dynamique, SC = R.SC;
    const SCOL = dark ? ['FBBF24', '38BDF8', '34D399'] : ['D97706', '1D6FE0', '16803A'];
    const pres = new root.PptxGenJS();
    pres.layout = 'LAYOUT_WIDE';
    pres.title = 'Étude de faisabilité — Solar PAYG Mauritanie'; pres.author = 'Solar PAYG Mauritanie'; pres.company = 'Solar PAYG Mauritanie';
    const assets = root.PAYG_ASSETS || {};
    const shots = (ctx.shots && ctx.shots.shots) || {};
    const shotAt = (ctx.shots && ctx.shots.at) || a.date || '';
    let logo = null;
    try { if (assets.logoSvg) { const lp = await D.svgToPngTransparent(assets.logoSvg, 1092, 1092, 0.6); logo = 'image/png;base64,' + b64(lp.bytes); } } catch (e) { /* logo facultatif */ }
    const imgData = (m) => (m ? (m.ext === 'png' ? 'image/png;base64,' : 'image/jpeg;base64,') + b64(m.bytes) : null);

    // Arrière-plans (une seule copie dans le fichier : maîtres de diapositives)
    for (const kd of ['cover', 'a', 'b']) {
      try { const j = await D.svgToJpeg(bgSvg(mode, kd), 1600, 900, 1, 0.82); pres.defineSlideMaster({ title: 'HUD_' + kd.toUpperCase(), background: { data: 'image/jpeg;base64,' + b64(j.bytes) }, objects: kd === 'cover' ? [] : [{ line: { x: 0.5, y: H - 0.5, w: W - 1, h: 0, line: { color: K.line, width: 0.75 } } }], slideNumber: kd === 'cover' ? undefined : { x: W - 1.1, y: H - 0.45, w: 0.6, h: 0.3, color: K.gray, fontFace: FONT, fontSize: 10, align: 'right' } }); }
      catch (e) { pres.defineSlideMaster({ title: 'HUD_' + kd.toUpperCase(), background: { color: K.bg } }); }
    }

    const STEPS = { 1: 'ÉTAPE 1/7 · PROBLÈME EN MAURITANIE', 2: 'ÉTAPE 2/7 · ENQUÊTE → PREUVE DU BESOIN', 3: 'ÉTAPE 3/7 · ÉTUDE DE MARCHÉ → DEMANDE', 4: 'ÉTAPE 4/7 · PROTOTYPE → DÉMONSTRATION', 5: 'ÉTAPE 5/7 · HYPOTHÈSES FINANCIÈRES', 6: 'ÉTAPE 6/7 · FAISABILITÉ → RENTABILITÉ ET RISQUES', 7: 'ÉTAPE 7/7 · CONCLUSION' };
    const nTxt = has ? num(a.n) + ' répondant' + (a.n > 1 ? 's' : '') : null;
    const L = noEmoji;
    const trans = []; let count = 0, TOTAL = 20;
    const TYPES = { fade: 1, morph: 1 };

    /* ---------- Éléments HUD (anneaux) : formes natives, animées en rotation continue ---------- */
    function hud(s, cx, cy, R0, o) {
      o = o || {}; const t = K.ringT, sp = o.speed || 1;
      const ring = (r, name, line, extra) => s.addShape(pres.ShapeType.ellipse, Object.assign({ x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, fill: { type: 'none' }, line, objectName: name }, extra || {}));
      ring(R0, '!!hudA~spin:' + Math.round(90000 / sp), { color: K.a1, width: 1.25, dashType: 'sysDash', transparency: t });
      ring(R0 * 0.86, '!!hudB~spinr:' + Math.round(60000 / sp), { color: K.a2, width: 5, dashType: 'dash', transparency: t + 10 });
      s.addShape(pres.ShapeType.blockArc, { x: cx - R0 * 0.72, y: cy - R0 * 0.72, w: R0 * 1.44, h: R0 * 1.44, fill: { color: K.a1, transparency: t - 15 }, line: { type: 'none' }, angleRange: [200, 340], arcThicknessRatio: 0.07, objectName: '!!hudC~spin:' + Math.round(40000 / sp) });
      s.addShape(pres.ShapeType.blockArc, { x: cx - R0 * 0.62, y: cy - R0 * 0.62, w: R0 * 1.24, h: R0 * 1.24, fill: { color: K.a3, transparency: t - 5 }, line: { type: 'none' }, angleRange: [20, 110], arcThicknessRatio: 0.05, objectName: '!!hudD~spinr:' + Math.round(30000 / sp) });
      ring(R0 * 0.5, '!!hudE~spin:' + Math.round(50000 / sp), { color: K.a3, width: 1, dashType: 'sysDot', transparency: t });
      s.addShape(pres.ShapeType.ellipse, { x: cx - R0 * 0.34, y: cy - R0 * 0.34, w: R0 * 0.68, h: R0 * 0.68, fill: { color: K.a1, transparency: dark ? 88 : 90 }, line: { color: K.a1, width: 1.5, transparency: t - 20 }, objectName: '!!hudF~pulse:2600' });
      if (o.logo && logo) s.addImage({ data: logo, x: cx - R0 * 0.27, y: cy - R0 * 0.27, w: R0 * 0.54, h: R0 * 0.54, objectName: '!!hudLogo~pulse:2200' });
    }

    /* ---------- Gabarit de diapositive ---------- */
    let master = 0;
    function slide(title, step, notes, o) {
      o = o || {};
      count++; const kd = master++ % 2 ? 'b' : 'a';
      const s = pres.addSlide({ masterName: 'HUD_' + kd.toUpperCase() });
      s._dl = 380; s._i = 0;
      trans[count - 1] = o.trans || 'morph';
      // anneaux en filigrane : leur position change d'une diapositive à l'autre (le Morphing les fait glisser)
      const spots = [[W - 1.0, H + 0.2, 3.3], [0.6, H + 0.4, 3.0], [W - 0.3, -0.2, 3.1], [-0.2, 1.2, 2.9]];
      const sp = spots[(count - 2) % spots.length]; hud(s, sp[0], sp[1], sp[2], { speed: 0.8 });
      // titre : pastille numérotée + titre + filet lumineux
      s.addText(String(count - 1).padStart(2, '0'), { x: 0.5, y: 0.36, w: 0.9, h: 0.7, fontFace: MONO, fontSize: 30, bold: true, color: K.a1, margin: 0, valign: 'middle', isTextBox: true, objectName: '@fly-l:0:500' });
      s.addText(title, { x: 1.45, y: 0.34, w: 10.6, h: 0.74, fontFace: FONT, fontSize: 28, bold: true, color: K.white === 'FFFFFF' && dark ? 'FFFFFF' : K.greenDark, margin: 0, valign: 'middle', isTextBox: true, fit: 'shrink', objectName: '@wipe-l:120:700' });
      s.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.1, w: 1.5, h: 0.05, fill: { color: K.a1 }, line: { type: 'none' }, objectName: '@wipe-l:350:600' });
      s.addShape(pres.ShapeType.rect, { x: 2.0, y: 1.115, w: 0.5, h: 0.02, fill: { color: K.a3 }, line: { type: 'none' }, objectName: '@wipe-l:600:500' });
      if (step) s.addText(STEPS[step], { x: 2.7, y: 1.04, w: 9, h: 0.2, fontFace: FONT, fontSize: 10, bold: true, color: K.gray, charSpacing: 2, margin: 0, isTextBox: true, objectName: '@fade:700:500' });
      // pied de page + barre de progression
      s.addText('© 2027 Solar PAYG Mauritanie — MDA — Tous droits réservés   |   Département Management, Economie et Droit', { x: 0.5, y: H - 0.45, w: 10.5, h: 0.3, fontFace: FONT, fontSize: 10, color: K.gray, margin: 0, isTextBox: true });
      s.addShape(pres.ShapeType.rect, { x: 0.5, y: H - 0.52, w: (W - 1) * (count / TOTAL), h: 0.03, fill: { color: K.a2 }, line: { type: 'none' }, objectName: '@wipe-l:200:900' });
      if (notes) s.addNotes(notes);
      return s;
    }
    const nd = (s, step) => { const d = s._dl; s._dl += step || 230; return d; };
    const A = (s, eff, dur, delay) => '@' + eff + ':' + (delay == null ? nd(s) : delay) + ':' + (dur || 650);

    const txt = (s, t, o) => s.addText(t, Object.assign({ fontFace: FONT, fontSize: 16, color: K.slate, margin: 0, valign: 'top', isTextBox: true, objectName: A(s, 'fade', 600) }, o));
    const bullets = (s, items, o) => {
      const arr = items.map((t, i) => ({ text: t, options: { bullet: { code: '25B8', indent: 18 }, breakLine: i < items.length - 1, paraSpaceAfter: 8 } }));
      s.addText(arr, Object.assign({ fontFace: FONT, fontSize: 16, color: K.slate, margin: 0, valign: 'top', isTextBox: true, objectName: A(s, 'fly-l', 650) }, o));
    };
    const FRAME = pres.ShapeType.snip2DiagRect;
    function card(s, x, y, w, h, head, body, color, o) {
      o = o || {};
      s.addShape(FRAME, { x, y, w, h, fill: { color: o.fill || K.light, transparency: o.fill ? 0 : K.cardT }, line: { color: o.line || color || K.a1, width: 1.25, transparency: 35 }, rectRadius: 0.08, shadow: dark ? { type: 'outer', color: color || K.a1, blur: 10, offset: 0, angle: 45, opacity: 0.28 } : { type: 'outer', color: '94A3B8', blur: 8, offset: 2, angle: 90, opacity: 0.25 }, objectName: A(s, o.eff || 'fly-b', 650) });
      s.addShape(pres.ShapeType.rect, { x: x + 0.14, y: y + 0.2, w: 0.07, h: Math.min(0.5, h - 0.4), fill: { color: color || K.a1 }, line: { type: 'none' } });
      s.addText(head, { x: x + 0.34, y: y + 0.1, w: w - 0.5, h: 0.5, fontFace: FONT, fontSize: o.hs || 16, bold: true, color: color || K.a1, margin: 0, valign: 'middle', isTextBox: true, fit: 'shrink' });
      if (body) s.addText(body, { x: x + 0.34, y: y + 0.62, w: w - 0.55, h: h - 0.78, fontFace: FONT, fontSize: o.bs || 13, color: K.slate, margin: 0, valign: 'top', isTextBox: true, fit: 'shrink' });
    }
    function kpi(s, x, y, w, h, value, label, color) {
      s.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: K.light, transparency: K.cardT }, line: { color: color || K.a1, width: 1.75, transparency: 20 }, rectRadius: 0.12, shadow: dark ? { type: 'outer', color: color || K.a1, blur: 14, offset: 0, angle: 45, opacity: 0.4 } : { type: 'outer', color: '94A3B8', blur: 8, offset: 2, angle: 90, opacity: 0.25 }, objectName: A(s, 'zoom', 600) });
      s.addText(value, { x: x + 0.1, y: y + 0.12, w: w - 0.2, h: h * 0.52, fontFace: FONT, fontSize: 26, bold: true, color: color || K.a1, align: 'center', valign: 'middle', margin: 0, isTextBox: true, fit: 'shrink' });
      s.addText(label, { x: x + 0.12, y: y + h * 0.58, w: w - 0.24, h: h * 0.38, fontFace: FONT, fontSize: 12, color: K.slate, align: 'center', valign: 'top', margin: 0, isTextBox: true, fit: 'shrink' });
    }
    const tableOpts = (o) => Object.assign({ fontFace: FONT, fontSize: 12, color: K.slate, border: { type: 'solid', color: K.line, pt: 0.75 }, valign: 'middle', margin: [0.04, 0.08, 0.04, 0.08], fill: { color: K.rowA }, objectName: undefined }, o);
    const th = (t) => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: K.thead }, align: 'center' } });
    const td = (t, o) => ({ text: String(t), options: Object.assign({ fill: { color: K.rowA }, color: K.slate }, o) });
    const body = (rows, left) => rows.map((r, i) => (i === 0 ? r : r.map((c, j) => { const base = typeof c === 'string' ? { text: c, options: {} } : c; base.options = Object.assign({ fill: { color: i % 2 ? K.rowA : K.rowB }, color: K.slate, align: j >= (left == null ? 1 : left) ? 'right' : 'left' }, base.options); return base; })));
    const addTable = (s, rows, o, eff) => s.addTable(rows, Object.assign(tableOpts(o), { objectName: A(s, eff || 'fade', 800) }));
    const noData = (s, x, y, w, h) => card(s, x, y, w, h, 'Données de l’enquête à venir', 'Aucune réponse n’est encore enregistrée sur la plateforme Les Enquêtes. Cette diapositive se complétera automatiquement dès que des réponses seront disponibles (il suffit de régénérer la présentation).', K.gold, { bs: 14 });
    function chartBar(s, labels, series, pos, o) {
      o = o || {};
      const data = series.map((x) => ({ name: x.name, labels, values: x.values }));
      s.addChart(o.line ? pres.charts.LINE : pres.charts.BAR, data, Object.assign({
        x: pos.x, y: pos.y, w: pos.w, h: pos.h, barDir: o.horizontal ? 'bar' : 'col', barGrouping: 'clustered',
        chartColors: series.map((x) => x.color), showLegend: series.length > 1, legendPos: 'b', legendFontSize: 11, legendFontFace: FONT, legendColor: K.slate,
        catAxisLabelFontSize: 11, catAxisLabelFontFace: FONT, catAxisLabelColor: K.slate, valAxisLabelFontSize: 10, valAxisLabelColor: K.gray, valAxisLabelFontFace: FONT,
        valGridLine: { color: K.grid, size: 0.5 }, catGridLine: { style: 'none' }, valAxisLineShow: false,
        showValue: !!o.values, dataLabelFontSize: 10, dataLabelColor: K.slate, dataLabelFormatCode: o.fmt || '#,##0', dataLabelPosition: 'outEnd',
        valAxisLabelFormatCode: o.axisFmt || '#,##0', showTitle: !!o.title, title: o.title || '', titleFontSize: 13, titleColor: K.slate, titleFontFace: FONT, barGapWidthPct: 55,
        plotArea: { fill: { color: K.light, transparency: 100 } }, objectName: A(s, o.eff || 'wipe-b', 900)
      }, o.extra || {}));
    }
    const distChart = (s, key, pos, title) => {
      const d = a.dist(key); if (!d) return false;
      const items = d.items.filter((i) => i.label_fr);
      chartBar(s, items.map((i) => L(i.label_fr)), [{ name: '%', color: K.a1, values: items.map((i) => +i.pct.toFixed(1)) }], pos, { horizontal: true, values: true, fmt: '0.0"%"', axisFmt: '0"%"', title: title + ' (n = ' + d.total + ')', extra: { valAxisMaxVal: 100, catAxisOrientation: 'maxMin' } });
      return true;
    };
    const frameImg = (s, m, x, y, w, h, eff) => { // capture encadrée, lueur dans la couleur du thème
      const dta = imgData(m); if (!dta) return;
      const ar = m.w / m.h; let iw = w, ih = w / ar; if (ih > h) { ih = h; iw = h * ar; }
      s.addShape(pres.ShapeType.roundRect, { x: x + (w - iw) / 2 - 0.06, y: y + (h - ih) / 2 - 0.06, w: iw + 0.12, h: ih + 0.12, fill: { color: K.light, transparency: 0 }, line: { color: K.a1, width: 1.5, transparency: 20 }, rectRadius: 0.05, shadow: { type: 'outer', color: K.a1, blur: 14, offset: 0, angle: 45, opacity: dark ? 0.45 : 0.25 }, objectName: A(s, 'fade', 500, s._dl) });
      s.addImage({ data: dta, x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih, objectName: '@' + (eff || 'zoom') + ':' + (s._dl) + ':700' });
      s._dl += 260;
    };

    /* =========================== 1. PAGE DE GARDE =========================== */
    {
      const s = pres.addSlide({ masterName: 'HUD_COVER' }); count++; s._dl = 500; trans[0] = 'fade';
      hud(s, 3.35, 3.75, 3.0, { speed: 1, logo: true });
      s.addText('SOUTENANCE · ÉTUDE DE FAISABILITÉ', { x: 6.9, y: 1.15, w: 6.0, h: 0.4, fontFace: MONO, fontSize: 15, bold: true, color: K.a3, charSpacing: 3, margin: 0, isTextBox: true, objectName: '@fly-r:300:700' });
      s.addText('Financement PAYG de l’énergie solaire en Mauritanie', { x: 6.9, y: 1.7, w: 6.1, h: 2.2, fontFace: FONT, fontSize: 36, bold: true, color: dark ? 'FFFFFF' : K.greenDark, margin: 0, valign: 'top', isTextBox: true, fit: 'shrink', objectName: '@wipe-l:600:900' });
      s.addShape(pres.ShapeType.rect, { x: 6.9, y: 4.0, w: 1.8, h: 0.06, fill: { color: K.a1 }, line: { type: 'none' }, objectName: '@wipe-l:1200:600' });
      s.addText('Scoring de crédit · Micro-assurance · Paiement mobile · Verrouillage à distance (IoT)', { x: 6.9, y: 4.2, w: 6.1, h: 0.7, fontFace: FONT, fontSize: 15, color: K.slate, margin: 0, valign: 'top', isTextBox: true, objectName: '@fade:1400:700' });
      s.addText('Solar PAYG Mauritanie 2027', { x: 6.9, y: 5.1, w: 6.1, h: 0.45, fontFace: FONT, fontSize: 20, bold: true, color: K.a1, margin: 0, isTextBox: true, objectName: '@fly-b:1700:600' });
      const team = (a.team && a.team.length ? a.team : []).join('  ·  ');
      if (team) s.addText(team, { x: 6.9, y: 5.6, w: 6.1, h: 0.45, fontFace: FONT, fontSize: 16, color: K.a3, margin: 0, isTextBox: true, objectName: '@fly-b:1950:600' });
      s.addText('Département Management, Economie et Droit', { x: 0.7, y: 6.75, w: 7.5, h: 0.3, fontFace: FONT, fontSize: 13, bold: true, color: K.slate, margin: 0, isTextBox: true, objectName: '@fade:2200:600' });
      s.addText('© 2027 Solar PAYG Mauritanie — MDA — Tous droits réservés  ·  Généré le ' + (a.date || '') + '  ·  thème ' + (dark ? 'sombre' : 'clair'), { x: 0.7, y: 7.05, w: 11.5, h: 0.25, fontFace: FONT, fontSize: 10, color: K.gray, margin: 0, isTextBox: true, objectName: '@fade:2300:600' });
      s.addNotes('Présenter le projet en une phrase : une entreprise qui finance des kits solaires et se fait rembourser par petits paiements mobiles. Annoncer le fil de la soutenance : problème, enquête, marché, prototype, finance, faisabilité, conclusion.');
    }

    /* =========================== 2. CONTEXTE =========================== */
    {
      const s = slide('Contexte', 1, 'Insister sur le contraste : fort besoin d’énergie, fort ensoleillement, paiement mobile déjà répandu, mais peu de financement adapté.');
      card(s, 0.5, 1.7, 3.9, 2.0, 'Un besoin d’énergie non satisfait', 'Beaucoup de ménages, commerces et exploitations sont hors réseau ou subissent des coupures : pétrole, bougies, piles, groupes électrogènes.', K.orangeDark, { eff: 'fly-l' });
      card(s, 4.72, 1.7, 3.9, 2.0, 'Un atout naturel', 'Un ensoleillement parmi les plus élevés au monde : l’énergie solaire est la solution évidente.', K.orange, { eff: 'fly-b' });
      card(s, 8.94, 1.7, 3.9, 2.0, 'Paiement mobile en essor', 'Bankily, Masrivi, Sedad, Click : des millions de transactions qui permettent de payer en petites sommes.', K.blue, { eff: 'fly-r' });
      txt(s, 'Le modèle PAYG (Pay-As-You-Go), déjà éprouvé en Afrique, transforme un achat comptant hors de portée en une série de petits paiements adaptés aux revenus irréguliers.', { x: 0.5, y: 4.15, w: 12.3, h: 0.9, fontSize: 18, bold: true, color: K.greenDark });
      bullets(s, ['Cible : ménages et petites entreprises sans accès fiable au réseau électrique', 'Offre : kit solaire installé, payé par échéances depuis un portefeuille mobile', 'Sécurité : verrouillage à distance en cas d’impayé, micro-assurance de l’équipement'], { x: 0.5, y: 5.05, w: 8.6, h: 1.7, fontSize: 16 });
    }

    /* =========================== 3. PROBLÉMATIQUE =========================== */
    {
      const s = slide('Problématique', 1, 'Lire la question centrale, puis annoncer que le reste de la présentation y répond point par point.');
      s.addShape(FRAME, { x: 0.5, y: 1.65, w: 12.33, h: 1.55, fill: { color: dark ? '0B3A4A' : K.greenDark, transparency: dark ? 10 : 0 }, line: { color: K.a1, width: 1.75, transparency: 20 }, shadow: { type: 'outer', color: K.a1, blur: 16, offset: 0, angle: 45, opacity: dark ? 0.45 : 0.2 }, objectName: A(s, 'zoom', 700) });
      s.addText('Dans quelle mesure une entreprise de financement PAYG de systèmes solaires, appuyée sur le scoring alternatif, la micro-assurance et le paiement mobile, est-elle faisable et rentable en Mauritanie ?', { x: 0.85, y: 1.7, w: 11.6, h: 1.45, fontFace: FONT, fontSize: 22, bold: true, color: 'FFFFFF', margin: 0, valign: 'middle', isTextBox: true, fit: 'shrink' });
      txt(s, 'Cinq sous-questions, cinq réponses dans cette soutenance', { x: 0.5, y: 3.45, w: 12, h: 0.4, fontSize: 16, bold: true, color: K.greenDark });
      const qs = [['Le besoin existe-t-il ?', 'Enquête', K.orangeDark], ['Quels prix, quelle demande ?', 'Étude de marché', K.blue], ['La solution est-elle réalisable ?', 'Prototype', K.green], ['Le modèle est-il rentable ?', 'Étude financière', K.blueDark], ['Quels risques ?', 'Faisabilité', K.red]];
      qs.forEach((q, i) => { const x = 0.5 + i * 2.5; card(s, x, 3.95, 2.35, 2.4, q[1], q[0], q[2], { hs: 15, bs: 14, eff: i % 2 ? 'fly-t' : 'fly-b' }); });
    }

    /* =========================== 4. SOLUTION PROPOSÉE =========================== */
    {
      const s = slide('Solution proposée', 4, 'Expliquer chaque service en une phrase : financer, installer, encaisser par mobile, sécuriser par IoT et assurance.');
      const sv = [['Kit solaire à crédit', 'Acompte puis échéances : le client accède à l’énergie sans capital important', K.orangeDark], ['Installation et SAV', 'Pose par une équipe formée, maintenance et assistance', K.green], ['Paiement mobile', 'Bankily, Masrivi, Sedad, Click : échéances simples et sans déplacement', K.blue], ['Verrouillage IoT', 'Module GSM : verrouillage en cas d’impayé, déverrouillage immédiat après paiement', K.blueDark], ['Micro-assurance', 'Casse, vol, panne : l’équipement et l’investissement sont protégés', K.orange], ['Scoring alternatif', 'Mauri-Score : acompte et plafond adaptés au profil, sans historique bancaire', K.greenDark]];
      sv.forEach((v, i) => card(s, 0.5 + (i % 3) * 4.18, 1.7 + Math.floor(i / 3) * 2.3, 3.95, 2.1, v[0], v[1], v[2], { bs: 14, eff: ['fly-l', 'fly-b', 'fly-r'][i % 3] }));
      txt(s, 'Trois kits : ' + mru(g.kit1_cash) + ' (éclairage) · ' + mru(g.kit2_cash) + ' (confort familial) · ' + mru(g.kit3_cash) + ' (productif) — prix comptants de référence, hypothèses à confirmer par devis.', { x: 0.5, y: 6.35, w: 12.3, h: 0.5, fontSize: 13, italic: true, color: K.gray });
    }

    /* =========================== 5. BUSINESS MODEL =========================== */
    {
      const s = slide('Business Model', 4, 'Présenter la logique : on achète un kit, on le finance, on se fait rembourser par petites échéances, et le risque est géré par le scoring, l’IoT et l’assurance.');
      const bm = [['Clients', 'Ménages et petites entreprises hors réseau ou mal desservis', K.orangeDark], ['Proposition de valeur', 'Énergie solaire sans capital initial important ; prix transparent ; SAV inclus', K.green], ['Canaux', 'Agents de terrain, partenaires, opérateurs, réseaux sociaux', K.blue], ['Revenus', 'Acompte + échéances (prix PAYG = coût + financement + assurance + marge)', K.greenDark], ['Coûts', 'Achat des kits, installation, IoT, financement, salaires, marketing, SAV', K.red], ['Partenaires', 'Paiement mobile, opérateurs télécoms, banques / IMF, assureurs, fournisseurs', K.blueDark]];
      bm.forEach((v, i) => card(s, 0.5 + (i % 3) * 4.18, 1.7 + Math.floor(i / 3) * 2.3, 3.95, 2.1, v[0], v[1], v[2], { bs: 14, eff: i < 3 ? 'fly-t' : 'fly-b' }));
      txt(s, 'Prix PAYG = coût du kit + installation + IoT + financement + assurance + coûts opérationnels + provision pour risque + marge', { x: 0.5, y: 6.35, w: 12.3, h: 0.5, fontSize: 14, bold: true, color: K.greenDark });
    }

    /* =========================== 6. FONCTIONNEMENT DU PAYG =========================== */
    {
      const s = slide('Fonctionnement du PAYG', 4, 'Montrer que le prix n’est pas arbitraire : il est construit composante par composante. Donner l’exemple chiffré du scénario Réaliste.');
      const pi = cen.priceInsured, lines = pi.lines.filter((l) => l.value > 0);
      chartBar(s, lines.map((l) => l.fr), [{ name: 'MRU', color: K.a2, values: lines.map((l) => Math.round(l.value)) }], { x: 0.4, y: 1.55, w: 7.6, h: 5.2 }, { horizontal: true, values: true, title: 'Composition du prix PAYG (MRU) — kit à ' + mru(sc.central.cashPrice) + ' comptant', extra: { catAxisOrientation: 'maxMin' } });
      card(s, 8.3, 1.7, 4.55, 1.5, 'Acompte', pctRaw(g.deposit_pct, 0) + ' du prix, soit ' + mru(pi.deposit), K.orange, { bs: 16, eff: 'fly-r' });
      card(s, 8.3, 3.35, 4.55, 1.5, 'Échéances', pi.periods + (g.freq === 'daily' ? ' paiements quotidiens' : g.freq === 'weekly' ? ' paiements hebdomadaires' : ' paiements mensuels') + ' d’environ ' + mru(pi.installment), K.blue, { bs: 16, eff: 'fly-r' });
      card(s, 8.3, 5.0, 4.55, 1.5, 'Prix PAYG total', mru(pi.total) + ' · équivalent mensuel ' + mru(pi.monthlyEquivalent), K.greenDark, { bs: 16, eff: 'fly-r' });
    }

    /* =========================== 7. PROTOTYPE =========================== */
    {
      const s = slide('Prototype', 4, 'Présenter le prototype : application web bilingue qui rend le modèle démontrable. Les modules paiement et IoT sont des simulations. Les captures sont prises en direct, au thème de la plateforme.');
      frameImg(s, shots.scoring, 0.5, 1.5, 6.0, 4.3, 'fly-l'); frameImg(s, shots.pricing, 6.83, 1.5, 6.0, 4.3, 'fly-r');
      txt(s, 'Module 1 — Scoring de crédit (Mauri-Score)', { x: 0.5, y: 5.95, w: 6, h: 0.3, fontSize: 13, bold: true, color: K.greenDark, align: 'center' });
      txt(s, 'Module 2 — Tarification transparente & micro-assurance', { x: 6.83, y: 5.95, w: 6, h: 0.3, fontSize: 13, bold: true, color: K.greenDark, align: 'center' });
      txt(s, 'Captures de la plateforme, thème ' + (dark ? 'sombre' : 'clair') + ' · ' + shotAt + ' · sept modules : scoring · tarification · IoT & paiement mobile · modèle financier · enquête · hypothèses & export · équipe', { x: 0.5, y: 6.4, w: 12.3, h: 0.5, fontSize: 12, italic: true, color: K.gray, align: 'center' });
    }

    /* =========================== 8. DÉMONSTRATION DU PARCOURS CLIENT =========================== */
    {
      const s = slide('Démonstration du parcours client', 4, 'Dérouler la démonstration en direct : 1) scoring, 2) offre, 3) acompte, 4) paiement mobile, 5) verrouillage / déverrouillage.');
      const st = [['1', 'Évaluation', 'Mauri-Score : acompte et plafond'], ['2', 'Offre', 'Kit, durée, prix transparent'], ['3', 'Installation', 'Acompte, pose, activation IoT'], ['4', 'Paiements', 'Échéances par portefeuille mobile'], ['5', 'Suivi', 'Rappels, verrouillage, déverrouillage'], ['6', 'Propriété', 'Dernière échéance : le kit est au client']];
      const cols = dark ? ['FB923C', 'FBBF24', '34D399', '38BDF8', '818CF8', '2DD4BF'] : ['EA580C', 'D97706', '16803A', '1D6FE0', '1E3A8A', '14532D'];
      st.forEach((x, i) => {
        const px = 0.5 + i * 2.07;
        s.addShape(pres.ShapeType.homePlate, { x: px, y: 1.55, w: 2.0, h: 0.8, fill: { color: cols[i] }, line: { color: dark ? '050B14' : 'FFFFFF', width: 1 }, objectName: A(s, 'wipe-l', 500, 380 + i * 170) });
        s.addText(x[0] + '. ' + x[1], { x: px + 0.1, y: 1.55, w: 1.7, h: 0.8, fontFace: FONT, fontSize: 14, bold: true, color: dark ? '04121C' : 'FFFFFF', margin: 0, valign: 'middle', isTextBox: true });
        s.addText(x[2], { x: px, y: 2.4, w: 2.0, h: 0.7, fontFace: FONT, fontSize: 11, color: K.slate, margin: 0, valign: 'top', isTextBox: true, objectName: '@fade:' + (600 + i * 170) + ':500' });
      });
      s._dl = 1700;
      frameImg(s, shots.iot, 0.7, 3.25, 5.8, 3.15, 'fly-l'); frameImg(s, shots.iot_unlocked || shots.iot, 6.83, 3.25, 5.8, 3.15, 'fly-r');
      txt(s, 'État du simulateur à l’export (thème ' + (dark ? 'sombre' : 'clair') + ', ' + shotAt + ')', { x: 0.7, y: 6.5, w: 5.8, h: 0.3, fontSize: 12, bold: true, color: K.a1, align: 'center' });
      txt(s, 'Équipement déverrouillé après paiement mobile (simulation de référence)', { x: 6.83, y: 6.5, w: 5.8, h: 0.3, fontSize: 12, bold: true, color: K.green, align: 'center' });
    }

    /* =========================== 9. MÉTHODOLOGIE DE L'ENQUÊTE =========================== */
    {
      const s = slide('Méthodologie de l’enquête', 2, 'Rappeler que l’enquête fournit la preuve du besoin, et que l’échantillon n’est pas probabiliste : les résultats décrivent les répondants.');
      card(s, 0.5, 1.7, 6.0, 2.45, 'Plateforme Les Enquêtes', 'Questionnaire bilingue (français / arabe) à questions fermées ; réponses stockées dans une base sécurisée et lues en direct par le prototype.', K.blue, { bs: 14, eff: 'fly-l' });
      card(s, 6.83, 1.7, 6.0, 2.45, 'Indicateurs calculés', 'Proportions avec intervalle de confiance de Wilson à 95 % · médiane et moyenne par interpolation sur tranches · modes (durée, fréquence).', K.green, { bs: 14, eff: 'fly-r' });
      kpi(s, 0.5, 4.5, 3.9, 1.6, has ? num(a.n) : '—', 'répondants à ce jour', K.orangeDark);
      kpi(s, 4.72, 4.5, 3.9, 1.6, has ? String(a.quality) : '—', 'qualité de l’échantillon (30 / 100)', K.blue);
      card(s, 8.94, 4.5, 3.9, 1.6, 'Limite', 'Échantillon non probabiliste : résultats indicatifs, non généralisables.', K.red, { bs: 13, eff: 'fly-b' });
    }

    /* =========================== 10. PROFIL DES RÉPONDANTS =========================== */
    {
      const s = slide('Profil des répondants', 2, 'Décrire qui a répondu : profil, activité, zone géographique. Relier à la population cible.');
      if (!has) noData(s, 0.5, 1.7, 12.3, 2.4);
      else {
        const keys = ['profile', 'activity', 'wilaya'].filter((k) => a.dist(k));
        const w = keys.length ? 12.3 / keys.length : 12.3;
        keys.forEach((k, i) => distChart(s, k, { x: 0.5 + i * w, y: 1.6, w: w - 0.1, h: 4.4 }, { profile: 'Profil principal', activity: 'Activité principale', wilaya: 'Wilaya' }[k]));
        const m = []; const mode2 = (k) => { const d = a.dist(k); if (!d) return null; const t = d.items.reduce((b, i) => (i.count > (b ? b.count : -1) ? i : b), null); return t && t.count ? L(t.label_fr) + ' (' + num(t.pct, 0) + ' %)' : null; };
        if (mode2('profile')) m.push('Profil dominant : ' + mode2('profile')); if (mode2('wilaya')) m.push('Wilaya dominante : ' + mode2('wilaya')); if (mode2('household')) m.push('Taille de foyer la plus fréquente : ' + mode2('household'));
        if (m.length) bullets(s, m, { x: 0.5, y: 6.05, w: 9.5, h: 0.9, fontSize: 13 });
      }
    }

    /* =========================== 11. RÉSULTATS CLÉS DE L'ENQUÊTE =========================== */
    {
      const s = slide('Résultats clés de l’enquête', 2, 'Donner les trois chiffres à retenir : intérêt, prix mensuel acceptable, acceptation du verrouillage. Préciser les intervalles de confiance.');
      if (!has) noData(s, 0.5, 1.7, 12.3, 2.4);
      else {
        kpi(s, 0.5, 1.65, 2.9, 1.5, pct(ind.payg_interest_rate, 0), 'prêts à acquérir un kit en PAYG (oui + peut-être)', K.green);
        kpi(s, 3.6, 1.65, 2.9, 1.5, pct(ind.purchase_intention_rate, 0), 'intention ferme (« oui »)', K.blue);
        kpi(s, 6.7, 1.65, 2.9, 1.5, ind.median_monthly_payment != null ? mru(ind.median_monthly_payment) : '—', 'montant mensuel acceptable (médiane)', K.orangeDark);
        kpi(s, 9.8, 1.65, 3.0, 1.5, ind.insurance_interest_rate != null ? pct(ind.insurance_interest_rate, 0) : '—', 'intéressés par la micro-assurance', K.blueDark);
        const ok = distChart(s, 'interest', { x: 0.5, y: 3.35, w: 6.1, h: 3.45 }, 'Intérêt pour un kit PAYG');
        const ok2 = distChart(s, 'monthlyPrice', { x: 6.75, y: 3.35, w: 6.1, h: 3.45 }, 'Montant mensuel maximum');
        if (!ok && !ok2) txt(s, 'Distributions détaillées : voir annexe B du rapport.', { x: 0.5, y: 3.5, w: 12, h: 0.5 });
      }
    }

    /* =========================== 12. ANALYSE DE LA DEMANDE =========================== */
    {
      const s = slide('Analyse de la demande', 3, 'Expliquer la formule : intention ferme + (peut-être × conversion), appliquée au marché adressable. Comparer au volume du scénario Réaliste.');
      if (a.demand) {
        const rows = [[th('Élément'), th('Valeur'), th('Source')], ['Intention d’achat ferme', pct(ind.purchase_intention_rate, 1), 'Enquête'], ['Réponses « peut-être »', pct(ind.maybe_rate, 1), 'Enquête'], ['Conversion des « peut-être »', pctRaw(g.maybe_conv, 0), 'Hypothèse'], ['Taux de demande plausible', pct(a.demand.rate, 1), 'Calcul'], ['Marché adressable', num(g.addressable), 'Hypothèse'], [td('Demande plausible', { bold: true }), td(num(a.demand.customers) + ' clients', { bold: true, align: 'right' }), td('Calcul', { bold: true })]];
        addTable(s, body(rows, 1).map((r, i) => (i === 0 ? r : r.map((c, j) => { c.options.align = j === 1 ? 'right' : 'left'; return c; }))), { x: 0.5, y: 1.7, w: 6.4, colW: [3.0, 1.9, 1.5], fontSize: 13, rowH: 0.45 }, 'fly-l');
        chartBar(s, SC.map((x) => x.short), [{ name: 'Nouveaux clients, année 1', color: K.a1, values: SC.map((x) => res[x.k].years[0].clients) }, { name: 'Demande plausible', color: K.a3, values: SC.map(() => Math.round(a.demand.customers)) }], { x: 7.1, y: 1.6, w: 5.8, h: 4.0 }, { values: true, title: 'Volume du modèle vs demande estimée' });
        txt(s, 'Le volume du scénario Réaliste (' + num(cen.years[0].clients) + ' clients en année 1) représente ' + pct(cen.years[0].clients / a.demand.customers, 1) + ' de la demande plausible.', { x: 0.5, y: 5.95, w: 12.3, h: 0.8, fontSize: 16, bold: true, color: K.greenDark });
      } else {
        noData(s, 0.5, 1.7, 7.0, 2.6);
        kpi(s, 8.0, 1.7, 4.8, 1.6, num(g.addressable), 'marché adressable retenu (hypothèse)', K.blue);
        kpi(s, 8.0, 3.5, 4.8, 1.6, pct(cen.years[0].clients / g.addressable, 1), 'pénétration supposée en année 1 (Réaliste)', K.orangeDark);
        txt(s, 'La demande plausible sera calculée dès que l’enquête fournira le taux d’intention ferme et la part de « peut-être ».', { x: 0.5, y: 5.6, w: 12.3, h: 0.8, fontSize: 15, color: K.slate });
      }
    }

    /* =========================== 13. ÉTUDE DE LA CONCURRENCE =========================== */
    {
      const s = slide('Étude de la concurrence', 3, 'Analyse qualitative : la présence et les prix des acteurs régionaux doivent être vérifiés sur le terrain avant décision.');
      const rows = [[th('Alternative'), th('Faiblesse principale'), th('Notre réponse')],
        ['Pétrole, bougies, piles', 'Dépense récurrente élevée, danger, faible qualité', 'Éclairage solaire à coût mensuel comparable'],
        ['Groupes électrogènes', 'Carburant coûteux, bruit, pannes, pollution', 'Kits familiaux et productifs sans carburant'],
        ['Kits solaires comptant', 'Prix initial hors de portée, pas de SAV', 'Paiement échelonné + installation + SAV'],
        ['Acteurs PAYG régionaux', 'Présence locale à vérifier, peu d’adaptation au contexte', 'Proximité, portefeuilles locaux, scoring adapté'],
        ['Programmes publics / ONG', 'Capacité limitée, pas de modèle récurrent', 'Complémentarité, subventions pour réduire le prix']];
      addTable(s, rows.map((r, i) => (i === 0 ? r : r.map((c, j) => td(c, { bold: j === 0, fill: { color: i % 2 ? K.rowA : K.rowB } })))), { x: 0.5, y: 1.65, w: 12.33, colW: [2.9, 4.8, 4.63], fontSize: 13, rowH: 0.62 }, 'fly-b');
      txt(s, 'Avantage recherché : la combinaison scoring + paiement mobile + IoT + assurance, adaptée au marché mauritanien.', { x: 0.5, y: 6.0, w: 12.3, h: 0.7, fontSize: 16, bold: true, color: K.greenDark });
    }

    /* =========================== 14. MODÈLE ÉCONOMIQUE =========================== */
    {
      const s = slide('Modèle économique', 5, 'Montrer l’économie d’un client : ce qu’il paie, ce qu’il coûte, ce qui reste. Puis les trois scénarios de volume.');
      const u = cen.unit;
      const rows = [[th('Économie unitaire — scénario Réaliste'), th('MRU')], ['Prix PAYG moyen par client', num(u.price, 0)], ['dont acompte moyen', num(u.deposit, 0)], ['Coût d’acquisition (kit + installation + IoT)', num(u.acqCost, 0)], ['Assurance (par mois)', num(u.insMonthly, 0)], ['Suivi client (par mois)', num(u.servMonthly, 0)], [td('Contribution par client (cycle de vie)', { bold: true }), td(num(cen.contributionPerClient, 0), { bold: true, align: 'right' })]];
      addTable(s, body(rows, 1), { x: 0.5, y: 1.65, w: 6.6, colW: [4.9, 1.7], fontSize: 13, rowH: 0.5 }, 'fly-l');
      const hy = [[th('Hypothèse'), th('Pessimiste'), th('Réaliste'), th('Optimiste')], ['Clients, année 1'].concat(SC.map((x) => num(sc[x.k].clients1))), ['Croissance annuelle'].concat(SC.map((x) => pctRaw(sc[x.k].growth, 0))), ['Taux d’impayés'].concat(SC.map((x) => pctRaw(sc[x.k].defaultRate, 1))), ['Durée (mois)'].concat(SC.map((x) => String(sc[x.k].tenure))), ['Coûts opérationnels'].concat(SC.map((x) => '× ' + num(sc[x.k].opexMult, 2)))];
      addTable(s, body(hy, 1), { x: 7.4, y: 1.65, w: 5.45, colW: [2.0, 1.15, 1.15, 1.15], fontSize: 12, rowH: 0.5 }, 'fly-r');
      txt(s, 'Tous les paramètres sont classés (enquête / estimation / hypothèse / simulation) dans le registre des hypothèses du prototype.', { x: 0.5, y: 5.6, w: 9.0, h: 0.8, fontSize: 14, italic: true, color: K.gray });
    }

    /* =========================== 15. INVESTISSEMENT INITIAL =========================== */
    {
      const s = slide('Investissement initial', 5, 'Détailler les postes principaux de l’investissement ; rappeler que le montant est une hypothèse à confirmer par devis.');
      const items = E.CAPEX_ITEMS.map((it) => ({ l: it[1], v: g[it[0]] || 0 })).filter((x) => x.v > 0);
      chartBar(s, items.map((x) => x.l), [{ name: 'MRU', color: K.a2, values: items.map((x) => Math.round(x.v)) }], { x: 0.4, y: 1.55, w: 8.2, h: 5.2 }, { horizontal: true, values: true, title: 'Investissement initial par poste (MRU)', extra: { catAxisOrientation: 'maxMin' } });
      kpi(s, 8.9, 1.7, 3.9, 1.6, mru(cen.capex), 'investissement initial total', K.greenDark);
      kpi(s, 8.9, 3.5, 3.9, 1.6, mru(cen.fundingNeed), 'besoin de financement maximal (Réaliste)', K.orangeDark);
      card(s, 8.9, 5.3, 3.9, 1.35, 'Subvention', 'Optimiste : ' + mru(sc.dynamique.grant) + ' (non acquise).', K.blue, { bs: 13, eff: 'fly-r' });
    }

    /* =========================== 16. COÛTS ET REVENUS PRÉVISIONNELS =========================== */
    {
      const s = slide('Coûts et revenus prévisionnels', 5, 'Montrer l’évolution sur 5 ans : encaissements, coûts, résultat net. Comparer ensuite les trois scénarios.');
      const yrs = ['Année 1', 'Année 2', 'Année 3', 'Année 4', 'Année 5'];
      chartBar(s, yrs, [{ name: 'Encaissements (CA)', color: K.a1, values: cen.years.map((y) => Math.round(y.revenue)) }, { name: 'Coûts totaux', color: K.a3, values: cen.years.map((y) => Math.round(y.totalCosts)) }, { name: 'Résultat net', color: K.a2, values: cen.years.map((y) => Math.round(y.netResult)) }], { x: 0.4, y: 1.55, w: 7.5, h: 5.2 }, { title: 'Scénario Réaliste (MRU)' });
      const rows = [[th('Cumul 5 ans'), th('Pessimiste'), th('Réaliste'), th('Optimiste')], ['Clients'].concat(SC.map((x) => num(res[x.k].totals.clients))), ['CA (MRU)'].concat(SC.map((x) => num(res[x.k].totals.revenue))), ['Résultat net (MRU)'].concat(SC.map((x) => num(res[x.k].totals.netResult)))];
      addTable(s, body(rows, 1), { x: 8.1, y: 1.7, w: 4.75, colW: [1.45, 1.1, 1.1, 1.1], fontSize: 10, rowH: 0.5 }, 'fly-r');
      txt(s, 'Le « chiffre d’affaires » désigne les encaissements (acomptes et échéances, nets des impayés), en base de trésorerie.', { x: 8.1, y: 4.1, w: 4.75, h: 1.2, fontSize: 12, italic: true, color: K.gray });
    }

    /* =========================== 17. RENTABILITÉ / SEUIL =========================== */
    {
      const s = slide('Rentabilité et seuil de rentabilité', 6, 'Donner VAN, TRI, délai de récupération et seuil de rentabilité pour chaque scénario. Montrer la courbe de trésorerie cumulée.');
      kpi(s, 0.5, 1.65, 2.95, 1.45, mru(cen.npv), 'VAN — Réaliste', cen.npv >= 0 ? K.green : K.red);
      kpi(s, 3.6, 1.65, 2.95, 1.45, cen.irr == null ? 'n/d' : pct(cen.irr, 1), 'TRI — Réaliste', K.blue);
      kpi(s, 6.7, 1.65, 2.95, 1.45, cen.paybackMonths == null ? '> 60 mois' : cen.paybackMonths + ' mois', 'récupération de l’investissement', K.orangeDark);
      kpi(s, 9.8, 1.65, 3.0, 1.45, cen.breakEvenClients == null ? 'impossible' : num(cen.breakEvenClients), 'seuil de rentabilité (clients / an)', K.blueDark);
      try { const cs = R.chartSpecs(a).cash; const png = await D.render(cs); const ar = cs.h / cs.w; s.addShape(pres.ShapeType.roundRect, { x: 0.4, y: 3.25, w: 7.7, h: 7.5 * ar + 0.1, fill: { color: 'FFFFFF' }, line: { color: K.a1, width: 1.25, transparency: 30 }, rectRadius: 0.05, objectName: A(s, 'fade', 500) }); s.addImage({ data: 'image/png;base64,' + b64(png.bytes), x: 0.45, y: 3.3, w: 7.6, h: 7.6 * ar, objectName: '@wipe-l:' + (s._dl - 100) + ':900' }); s._dl += 200; } catch (e) { console.warn('[pptx] courbe', e); }
      const rows = [[th(''), th('Pess.'), th('Réal.'), th('Opt.')], ['VAN (MRU)'].concat(SC.map((x) => num(res[x.k].npv))), ['TRI'].concat(SC.map((x) => (res[x.k].irr == null ? 'n/d' : pct(res[x.k].irr, 0)))), ['Récupération'].concat(SC.map((x) => (res[x.k].paybackMonths == null ? '> 60 m' : res[x.k].paybackMonths + ' m'))), ['Financement max.'].concat(SC.map((x) => num(res[x.k].fundingNeed)))];
      addTable(s, body(rows, 1), { x: 8.3, y: 3.4, w: 4.55, colW: [1.4, 1.05, 1.05, 1.05], fontSize: 10, rowH: 0.5 }, 'fly-r');
    }

    /* =========================== 18. RISQUES ET SOLUTIONS =========================== */
    {
      const s = slide('Risques et solutions', 6, 'Présenter les risques par famille et la mesure de mitigation associée ; appuyer sur la sensibilité : la VAN dépend surtout du volume et des impayés.');
      const rows = [[th('Risque'), th('Niveau'), th('Mesure de mitigation')],
        ['Impayés supérieurs aux prévisions', 'Élevé', 'Verrouillage IoT, acompte selon le score, provision, calibrage sur pilote'],
        ['Volumes de ventes insuffisants', 'Élevé', 'Partenariats, agents commissionnés, démarrage par zone'],
        ['Financement non couvert', 'Élevé', 'Lignes de refinancement, subventions, investissement phasé'],
        ['Hausse des coûts / change', 'Moyen', 'Contrats fournisseurs, ajustement du prix'],
        ['Réseau, pannes, réglementation', 'Moyen', 'Code OTP hors ligne, garantie + assurance, veille juridique']];
      addTable(s, rows.map((r, i) => (i === 0 ? r : r.map((c, j) => td(c, { bold: j === 0, color: j === 1 ? (c === 'Élevé' ? K.red : K.orangeDark) : K.slate, align: j === 1 ? 'center' : 'left', fill: { color: i % 2 ? K.rowA : K.rowB } })))), { x: 0.5, y: 1.65, w: 7.3, colW: [2.6, 0.9, 3.8], fontSize: 11, rowH: 0.62 }, 'fly-l');
      const sv = a.sens;
      chartBar(s, sv.map((x) => x.label), [{ name: 'VAN (MRU)', color: K.a2, values: sv.map((x) => Math.round(x.npv)) }], { x: 8.0, y: 1.55, w: 4.9, h: 5.2 }, { horizontal: true, values: true, fmt: '#,##0', title: 'Sensibilité de la VAN (Réaliste)', extra: { catAxisOrientation: 'maxMin', catAxisLabelFontSize: 9, dataLabelFontSize: 9 } });
    }

    /* =========================== 19. IMPACT ATTENDU EN MAURITANIE =========================== */
    {
      const s = slide('Impact attendu en Mauritanie', 7, 'Rester factuel : les nombres de foyers viennent du modèle (scénarios), les autres impacts sont des effets attendus à mesurer après un pilote.');
      kpi(s, 0.5, 1.65, 3.9, 1.6, num(pru.totals.clients) + ' à ' + num(dyn.totals.clients), 'ménages / entreprises équipés en 5 ans (scénarios Pessimiste à Optimiste)', K.green);
      kpi(s, 4.72, 1.65, 3.9, 1.6, num(cen.totals.clients), 'clients équipés en 5 ans (Réaliste)', K.blue);
      kpi(s, 8.94, 1.65, 3.9, 1.6, mru(cen.totals.revenue), 'encaissements cumulés (Réaliste)', K.orangeDark);
      card(s, 0.5, 3.65, 3.95, 2.9, 'Social', 'Accès à l’éclairage, à la recharge, à la réfrigération ; sécurité et études facilitées ; inclusion financière des ménages sans historique bancaire.', K.orangeDark, { bs: 13, eff: 'fly-l' });
      card(s, 4.69, 3.65, 3.95, 2.9, 'Économique', 'Baisse des dépenses d’énergie, activités productives (froid, commerce), emplois locaux : installateurs, agents, techniciens.', K.blue, { bs: 13, eff: 'fly-b' });
      card(s, 8.88, 3.65, 3.95, 2.9, 'Environnemental', 'Substitution du pétrole, des piles et des groupes électrogènes par une énergie renouvelable ; collecte et recyclage des batteries à prévoir.', K.green, { bs: 13, eff: 'fly-r' });
    }

    /* =========================== 20. CONCLUSION =========================== */
    {
      const s = slide('Conclusion', 7, 'Conclure par la décision, les conditions de réussite et les prochaines étapes. Terminer en reliant les 7 étapes du fil conducteur.', { trans: 'fade' });
      const v = a.verdict.level;
      const vt = v === 'favorable' ? 'Faisabilité financière favorable sous les hypothèses retenues : VAN positive et investissement récupéré en ' + cen.paybackMonths + ' mois (Réaliste).' : v === 'conditionnelle' ? 'Faisabilité conditionnelle : le scénario Réaliste n’atteint pas simultanément une VAN positive et la récupération dans les 60 mois.' : 'Sous les hypothèses actuelles, le projet n’est pas rentable dans l’horizon de 60 mois ; des leviers existent (prix, coûts, impayés, subvention).';
      s.addShape(FRAME, { x: 0.5, y: 1.65, w: 12.33, h: 1.2, fill: { color: v === 'favorable' ? K.okFill : v === 'conditionnelle' ? K.warnFill : K.badFill }, line: { color: K.a1, width: 1.5, transparency: 25 }, shadow: { type: 'outer', color: K.a1, blur: 14, offset: 0, angle: 45, opacity: dark ? 0.45 : 0.2 }, objectName: A(s, 'zoom', 700) });
      s.addText(vt, { x: 0.85, y: 1.68, w: 11.6, h: 1.14, fontFace: FONT, fontSize: 17, bold: true, color: 'FFFFFF', margin: 0, valign: 'middle', isTextBox: true, fit: 'shrink' });
      const pts = [(has ? 'Besoin : ' + pct(ind.payg_interest_rate, 0) + ' des ' + nTxt + ' sont intéressés par un kit PAYG' : 'Besoin : à confirmer dès que l’enquête aura des réponses'), 'Solution : prototype démontrant le parcours complet (paiement et IoT simulés)', 'Rentabilité : VAN ' + mru(cen.npv) + (cen.irr != null ? ', TRI ' + pct(cen.irr, 1) : '') + ' (Réaliste)'];
      bullets(s, pts, { x: 0.5, y: 3.05, w: 6.2, h: 2.0, fontSize: 14 });
      txt(s, 'Recommandations', { x: 7.0, y: 3.0, w: 5.8, h: 0.35, fontSize: 15, bold: true, color: K.greenDark });
      bullets(s, ['Remplacer les hypothèses par des devis réels', 'Élargir l’enquête (100 répondants minimum)', 'Mener un projet pilote (scoring, impayés réels)', 'Sécuriser refinancement et subventions', 'Valider le cadre juridique'], { x: 7.0, y: 3.4, w: 5.8, h: 2.0, fontSize: 13 });
      try { const st = D.story(-1); const png = await D.render(st); s.addShape(pres.ShapeType.roundRect, { x: 1.75, y: 5.1, w: 9.85, h: 9.6 * st.h / st.w + 0.1, fill: { color: 'FFFFFF' }, line: { color: K.a1, width: 1.25, transparency: 30 }, rectRadius: 0.06, objectName: A(s, 'fade', 500, 1500) }); s.addImage({ data: 'image/png;base64,' + b64(png.bytes), x: 1.85, y: 5.15, w: 9.6, h: 9.6 * st.h / st.w, objectName: '@wipe-l:1700:1100' }); } catch (e) { /* facultatif */ }
    }

    const buf = await pres.write({ outputType: 'arraybuffer' });
    const blob = await animateDeck(buf, trans);
    save(blob, fileName || 'soutenance_etude_faisabilite_payg.pptx');
    return count;
  }

  root.PaygPptx = { write };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PaygPptx;
})(typeof window !== 'undefined' ? window : globalThis);

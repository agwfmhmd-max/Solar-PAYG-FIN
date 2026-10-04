/* =====================================================================
 * study.js — Interface de l'étude de faisabilité (utilise engine.js)
 * Enquête (Supabase) → indicateurs → prix PAYG → scénarios → hypothèses → exports
 * ===================================================================== */
(function () {
  'use strict';
  const E = window.PaygEngine;
  const LS_KEY = 'payg_study_state_v1';
  const lang = () => (typeof currentLang !== 'undefined' ? currentLang : 'fr');
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = (x, d) => (x == null || !isFinite(x) ? '—' : Number(x).toLocaleString('fr-FR', { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d == null ? 0 : d }));
  const mru = (x) => (x == null || !isFinite(x) ? '—' : nf(Math.round(x)) + ' MRU');
  const mm = (x) => (x == null || !isFinite(x) ? '—' : (x / 1e6 >= 0 ? '' : '') + nf(x / 1e6, 2) + ' M MRU');
  const pc = (x, d) => (x == null || !isFinite(x) ? '—' : nf(x * 100, d == null ? 1 : d) + ' %');

  /* ---------- Textes ---------- */
  const T = {
    fr: {
      simBanner: 'SIMULATION / PROTOTYPE — aucun paiement réel : aucune API Bankily, Masrivi, Sedad ou Click n’est connectée. Les montants et codes affichés sont fictifs.',
      scoreBanner: 'Mécanisme expérimental proposé dans le cadre de l’étude — ce n’est PAS un score bancaire officiel. Les pondérations sont des hypothèses académiques non calibrées sur des données de remboursement réelles.',
      scoreVarsTitle: 'Variables envisagées pour le scoring', scoreVarName: 'Variable', scoreVarStatus: 'Statut dans le prototype',
      sv: [
        ['Capacité de paiement', 'Utilisée (revenu mensuel du foyer, curseur ci-dessus)'],
        ['Stabilité des revenus', 'Non implémentée — à mesurer (question « nature du revenu » de l’enquête)'],
        ['Historique de paiement', 'Simulée via le volume de paiement mobile — nécessite des données réelles'],
        ['Niveau d’endettement', 'Non disponible — nécessiterait une source externe (ex. centrale des risques)'],
        ['Comportement de paiement PAYG', 'Disponible seulement après lancement (données de remboursement réelles)'],
        ['Profil du client', 'Utilisée (wilaya, actifs et garanties locales)']
      ],
      lblPriceSection: 'Construction transparente du prix PAYG', lblCompo: 'Composante', lblAmount: 'Montant', lblShare: 'Part du total', lblPaidBy: 'Ce que paie le client',
      totalPayg: 'Prix total PAYG (acompte inclus)', perPeriod: 'Échéance PAYG', nPeriods: 'Nombre d’échéances', monthlyEq: 'Équivalent mensuel',
      lblInsShare: 'Part de l’assurance dans chaque échéance', priceTypeNote: 'Tous les coûts de ce tableau sont des HYPOTHÈSES modifiables (module 4) ; seules les valeurs issues de l’enquête sont des données réelles.',
      marketRef: 'Repère de l’enquête (échantillon)', refMonthly: 'Montant mensuel que ≥ {c} % des répondants déclarent pouvoir payer', afford: 'Part des répondants dont le budget déclaré couvre cet équivalent mensuel',
      noSurveyYet: 'Indicateurs d’enquête indisponibles pour le moment (base non connectée, pas encore de réponses ou questions d’étude de marché non ajoutées).',
      tenureAdvice: 'Durée minimale respectant le budget de référence :', noTenure: 'Aucune durée proposée (6–24 mois) ne ramène l’équivalent mensuel sous le budget de référence : le prix du kit ou le modèle doit être revu.',
      applySurvey: 'Appliquer les résultats de l’enquête au modèle', applied: 'Appliqué : durée et fréquence préférées de l’échantillon.',
      sampleResults: 'Résultats de l’échantillon', usedHyp: 'Hypothèse utilisée dans le modèle financier',
      kSample: 'Nombre de répondants', kInterest: 'Taux d’intérêt PAYG', kIntent: 'Intention d’achat', kPrice: 'Prix mensuel acceptable', kDuration: 'Durée préférée', kFreq: 'Fréquence de paiement', kIns: 'Intérêt micro-assurance',
      interestSub: 'oui + peut-être', intentSub: 'réponse « oui » ferme', priceSub: 'médiane · moyenne', modeSub: 'réponse la plus fréquente', insSub: 'oui + oui si prime faible', potential: 'Clients potentiellement intéressés (échantillon)',
      icLabel: 'IC 95 %', quality: { insuffisant: 'Échantillon insuffisant (<30)', indicatif: 'Échantillon indicatif (<100)', acceptable: 'Taille d’échantillon acceptable' },
      chPrice: 'Montant mensuel acceptable', chInterest: 'Intérêt pour le PAYG', chDuration: 'Durée de financement préférée', chFreq: 'Fréquence de paiement préférée', chWilaya: 'Répartition géographique (wilaya)', chActivity: 'Répartition par activité', chIncome: 'Répartition par tranche de revenu', chProfile: 'Profil des répondants',
      hypTable: 'De l’enquête aux hypothèses du modèle', hCol: ['Résultat de l’échantillon', 'Hypothèse du modèle', 'Valeur utilisée'],
      hRows: ['Prix mensuel acceptable → hypothèse de prix client', 'Durée préférée → hypothèse de durée de financement', 'Fréquence préférée → hypothèse de paiement', 'Intention d’achat → hypothèse de demande'],
      missingQs: 'Questions d’étude de marché absentes de la base : exécutez MARKET_STUDY_QUESTIONS.sql (revenu, activité, budget mensuel, prix total…). Les indicateurs concernés sont masqués.',
      generalize: 'Échantillon non probabiliste : ces résultats décrivent les répondants, pas l’ensemble de la population mauritanienne.',
      detail: 'Détail question par question (résultats bruts)',
      scen: 'Scénario', tabIn: 'Hypothèses du scénario', globalIn: 'Hypothèses communes', capexT: 'A. Investissement initial', fixedT: 'B. Coûts fixes annuels', varT: 'C. Coûts variables (par client)', revT: 'D. Revenus', yearT: 'Résultats annuels — scénario sélectionné', compT: 'Comparaison des trois scénarios',
      hyp: 'Hypothèse', reset: 'Rétablir les valeurs par défaut',
      varDrivers: { install_pct: 'Installation (% prix comptant)', iot_cost: 'Équipement paiement/IoT (MRU/kit)', funding_rate: 'Coût de financement (% / an)', commission_pct: 'Commission paiement mobile (%)', servicing: 'Suivi client (MRU/mois)', deposit_pct: 'Acompte (% du prix total)', insurance_takeup: 'Clients assurés (%)', coverage: 'Couverture du prix de référence (% répondants)', addressable: 'Marché adressable (nb. de clients potentiels)', maybe_conv: 'Conversion des « peut-être » (%)' },
      sc: ['Nouveaux clients, année 1', 'Croissance annuelle (%)', 'Prix comptant moyen du kit (MRU)', 'Coût d’achat du kit (% du prix comptant)', 'Durée de financement (mois)', 'Taux d’impayés (%)', 'Prime d’assurance (% prix comptant / an)', 'Marge visée (% des coûts)', 'Coefficient coûts opérationnels', 'Subvention non acquise (MRU)', 'Taux d’actualisation (%)'],
      rowsYear: ['Nouveaux clients', 'Chiffre d’affaires (encaissements)', 'Coûts variables', 'Coûts fixes', 'Coûts totaux', 'Marge brute', 'Amortissement (CAPEX/5)', 'Résultat prévisionnel', 'Cash-flow net'],
      rowsComp: ['CA cumulé 5 ans', 'Coûts cumulés 5 ans', 'Marge brute cumulée', 'Résultat cumulé 5 ans', 'Cash-flow cumulé 5 ans', 'VAN', 'TRI', 'Payback', 'Besoin de financement max', 'Seuil de rentabilité', 'Prix PAYG total (assuré)', 'Équivalent mensuel'],
      kVAN: 'VAN (60 mois)', kTRI: 'TRI annualisé', kPB: 'Payback', kBE: 'Seuil de rentabilité',
      why: { van: 'Flux mensuels sur 60 mois actualisés à {r} % ; investissement initial : {capex}.', tri: 'Taux qui annule la VAN des mêmes flux.', pb: 'Premier mois où le cash-flow cumulé devient positif.', be: 'Coûts fixes annuels ({fixed}) ÷ contribution par client ({contrib}) sur toute la durée de financement.' },
      months: 'mois', clientsYr: 'clients / an', over60: '> 60 mois', na: 'non calculable',
      demandT: 'Confrontation à la demande de l’enquête', demandTxt: 'Marché adressable (hypothèse) {a} × taux de demande {r} (intentions « oui » + {m} % des « peut-être », hypothèse) ≈ {n} clients ; le scénario vise {s} clients sur 5 ans, soit {p} de cette demande.',
      noDemand: 'Pas encore de taux d’intention d’achat issu de l’enquête.',
      verdict: 'Lecture des résultats', vPos: 'VAN positive dans {k} scénario(s) sur 3.', vNeg: 'VAN négative dans le scénario sélectionné : sous ces hypothèses, le projet ne crée pas de valeur.', vPos2: 'VAN positive dans le scénario sélectionné sous ces hypothèses.',
      vCaveat: 'Ces résultats dépendent d’hypothèses non encore validées (coûts, impayés, financement) : ils servent à tester la faisabilité, ils ne la prouvent pas.',
      vAfford: 'Attention : l’équivalent mensuel du kit ({m}) dépasse le budget que déclarent pouvoir payer la plupart des répondants ({p} seulement le couvrent).',
      asmTitle: 'Hypothèses du modèle', asmCols: ['Paramètre', 'Valeur', 'Unité', 'Source', 'Date', 'Type'], filterAll: 'Tous', export: 'Exporter les résultats', exCSV: 'CSV', exXLSX: 'Excel', exPDF: 'PDF (impression)', exJSON: 'Paramètres Enquête → Prototype (JSON)',
      params: 'Paramètres transmis au prototype', navAsm: 'Hypothèses & Export', asmDesc: 'Chaque donnée est classée : donnée réelle de l’enquête, estimation, donnée externe vérifiée, hypothèse ou simulation. Les mêmes chiffres alimentent le rapport Word et le PowerPoint.', legend: 'Classification des données', printTitle: 'Étude de faisabilité — synthèse des résultats'
    },
    ar: {
      simBanner: 'محاكاة / نموذج أولي — لا توجد عملية دفع حقيقية: لا يوجد ربط فعلي بواجهات Bankily أو Masrivi أو Sedad أو Click. المبالغ والرموز المعروضة وهمية.',
      scoreBanner: 'آلية تجريبية مقترحة في إطار الدراسة — وهي ليست تنقيطا بنكيا رسميا. الأوزان فرضيات أكاديمية غير معايَرة على بيانات سداد فعلية.',
      scoreVarsTitle: 'المتغيرات المقترحة للتنقيط', scoreVarName: 'المتغير', scoreVarStatus: 'الحالة في النموذج',
      sv: [['القدرة على الدفع', 'مستخدمة (دخل الأسرة الشهري)'], ['استقرار الدخل', 'غير منفذة — تُقاس عبر سؤال طبيعة الدخل'], ['سجل الدفع', 'محاكاة عبر حجم الدفع بالهاتف — تتطلب بيانات حقيقية'], ['مستوى المديونية', 'غير متاح — يتطلب مصدرا خارجيا'], ['سلوك الدفع في PAYG', 'متاح بعد الإطلاق فقط'], ['ملف العميل', 'مستخدم (الولاية، الأصول والضمانات)']],
      lblPriceSection: 'بناء شفاف لسعر PAYG', lblCompo: 'المكوّن', lblAmount: 'المبلغ', lblShare: 'النسبة', lblPaidBy: 'ما يدفعه العميل',
      totalPayg: 'السعر الإجمالي PAYG (مع الدفعة المقدمة)', perPeriod: 'القسط PAYG', nPeriods: 'عدد الأقساط', monthlyEq: 'المعادل الشهري',
      lblInsShare: 'حصة التأمين في كل قسط', priceTypeNote: 'جميع تكاليف هذا الجدول فرضيات قابلة للتعديل (الوحدة 4)؛ والقيم الوحيدة الفعلية هي المستخرجة من الاستبيان.',
      marketRef: 'مرجع الاستبيان (العينة)', refMonthly: 'مبلغ شهري يصرّح ≥ {c}% من المجيبين بقدرتهم على دفعه', afford: 'نسبة المجيبين الذين تغطي ميزانيتهم هذا المعادل الشهري',
      noSurveyYet: 'مؤشرات الاستبيان غير متاحة حاليا (قاعدة غير متصلة، لا إجابات، أو أسئلة دراسة السوق غير مضافة).',
      tenureAdvice: 'أقل مدة تحترم الميزانية المرجعية:', noTenure: 'لا توجد مدة (6–24 شهرا) تُنزل المعادل الشهري تحت الميزانية المرجعية: يجب مراجعة سعر النظام أو النموذج.',
      applySurvey: 'تطبيق نتائج الاستبيان على النموذج', applied: 'تم التطبيق: المدة والوتيرة المفضلتان في العينة.',
      sampleResults: 'نتائج العينة', usedHyp: 'الفرضية المعتمدة في النموذج المالي',
      kSample: 'عدد المجيبين', kInterest: 'نسبة الاهتمام بـ PAYG', kIntent: 'نية الشراء', kPrice: 'المبلغ الشهري المقبول', kDuration: 'المدة المفضلة', kFreq: 'وتيرة الدفع', kIns: 'الاهتمام بالتأمين الأصغر',
      interestSub: 'نعم + ربما', intentSub: 'إجابة «نعم» قاطعة', priceSub: 'الوسيط · المتوسط', modeSub: 'الإجابة الأكثر تكرارا', insSub: 'نعم + نعم إذا كان القسط منخفضا', potential: 'العملاء المهتمون المحتملون (العينة)',
      icLabel: 'فاصل ثقة 95%', quality: { insuffisant: 'عينة غير كافية (<30)', indicatif: 'عينة إرشادية (<100)', acceptable: 'حجم عينة مقبول' },
      chPrice: 'المبلغ الشهري المقبول', chInterest: 'الاهتمام بـ PAYG', chDuration: 'مدة التمويل المفضلة', chFreq: 'وتيرة الدفع المفضلة', chWilaya: 'التوزيع الجغرافي (الولاية)', chActivity: 'التوزيع حسب النشاط', chIncome: 'التوزيع حسب شريحة الدخل', chProfile: 'ملف المجيبين',
      hypTable: 'من الاستبيان إلى فرضيات النموذج', hCol: ['نتيجة العينة', 'فرضية النموذج', 'القيمة المعتمدة'],
      hRows: ['المبلغ الشهري المقبول ← فرضية سعر العميل', 'المدة المفضلة ← فرضية مدة التمويل', 'الوتيرة المفضلة ← فرضية الدفع', 'نية الشراء ← فرضية الطلب'],
      missingQs: 'أسئلة دراسة السوق غير موجودة في القاعدة: شغّل MARKET_STUDY_QUESTIONS.sql. المؤشرات المعنية مخفية.',
      generalize: 'عينة غير احتمالية: هذه النتائج تصف المجيبين وليس كل سكان موريتانيا.',
      detail: 'التفصيل سؤالا بسؤال (النتائج الخام)',
      scen: 'السيناريو', tabIn: 'فرضيات السيناريو', globalIn: 'فرضيات مشتركة', capexT: 'أ. الاستثمار الأولي', fixedT: 'ب. التكاليف الثابتة السنوية', varT: 'ج. التكاليف المتغيرة (لكل عميل)', revT: 'د. الإيرادات', yearT: 'النتائج السنوية — السيناريو المختار', compT: 'مقارنة السيناريوهات الثلاثة',
      hyp: 'فرضية', reset: 'استعادة القيم الافتراضية',
      varDrivers: { install_pct: 'التركيب (% من السعر النقدي)', iot_cost: 'جهاز الدفع (أوقية/نظام)', funding_rate: 'تكلفة التمويل (% سنويا)', commission_pct: 'عمولة الدفع (%)', servicing: 'متابعة العميل (أوقية/شهر)', deposit_pct: 'الدفعة المقدمة (%)', insurance_takeup: 'العملاء المؤمَّنون (%)', coverage: 'تغطية السعر المرجعي (% المجيبين)', addressable: 'السوق المستهدف (عدد العملاء)', maybe_conv: 'تحويل «ربما» (%)' },
      sc: ['عملاء جدد، السنة 1', 'النمو السنوي (%)', 'متوسط السعر النقدي (أوقية)', 'تكلفة شراء النظام (%)', 'مدة التمويل (أشهر)', 'نسبة التعثر (%)', 'قسط التأمين (% سنويا)', 'الهامش (% من التكاليف)', 'معامل التكاليف التشغيلية', 'منحة غير مؤكدة (أوقية)', 'معدل الخصم (%)'],
      rowsYear: ['عملاء جدد', 'رقم المعاملات (المقبوضات)', 'تكاليف متغيرة', 'تكاليف ثابتة', 'إجمالي التكاليف', 'الهامش الإجمالي', 'الاهتلاك', 'النتيجة التقديرية', 'التدفق النقدي الصافي'],
      rowsComp: ['رقم المعاملات 5 سنوات', 'التكاليف 5 سنوات', 'الهامش الإجمالي', 'النتيجة 5 سنوات', 'التدفق النقدي 5 سنوات', 'القيمة الحالية الصافية', 'معدل العائد الداخلي', 'فترة الاسترداد', 'أقصى حاجة تمويل', 'عتبة المردودية', 'السعر الإجمالي PAYG', 'المعادل الشهري'],
      kVAN: 'القيمة الحالية الصافية (60 شهرا)', kTRI: 'معدل العائد الداخلي', kPB: 'فترة الاسترداد', kBE: 'عتبة المردودية',
      why: { van: 'تدفقات شهرية على 60 شهرا مخصومة بمعدل {r}%؛ الاستثمار الأولي: {capex}.', tri: 'المعدل الذي يجعل القيمة الحالية صفرا.', pb: 'أول شهر يصبح فيه التدفق التراكمي موجبا.', be: 'التكاليف الثابتة السنوية ({fixed}) ÷ مساهمة العميل ({contrib}).' },
      months: 'شهرا', clientsYr: 'عميل / سنة', over60: '> 60 شهرا', na: 'غير قابل للحساب',
      demandT: 'مقارنة بالطلب المستخلص من الاستبيان', demandTxt: 'السوق المستهدف (فرضية) {a} × نسبة الطلب {r} ≈ {n} عميلا؛ السيناريو يستهدف {s} عميلا خلال 5 سنوات أي {p} من هذا الطلب.',
      noDemand: 'لا توجد بعد نسبة نية شراء من الاستبيان.',
      verdict: 'قراءة النتائج', vPos: 'قيمة حالية صافية موجبة في {k} سيناريو من 3.', vNeg: 'القيمة الحالية الصافية سالبة في السيناريو المختار: وفق هذه الفرضيات لا يخلق المشروع قيمة.', vPos2: 'القيمة الحالية الصافية موجبة في السيناريو المختار وفق هذه الفرضيات.',
      vCaveat: 'تعتمد هذه النتائج على فرضيات لم تُثبت بعد: فهي تختبر الجدوى ولا تثبتها.',
      vAfford: 'تنبيه: المعادل الشهري ({m}) يتجاوز ما يصرّح معظم المجيبين بقدرتهم على دفعه ({p} فقط يغطونه).',
      asmTitle: 'فرضيات النموذج', asmCols: ['المعامل', 'القيمة', 'الوحدة', 'المصدر', 'التاريخ', 'النوع'], filterAll: 'الكل', export: 'تصدير النتائج', exCSV: 'CSV', exXLSX: 'Excel', exPDF: 'PDF (طباعة)', exJSON: 'معاملات الاستبيان ← النموذج (JSON)',
      params: 'المعاملات المنقولة إلى النموذج', navAsm: 'الفرضيات والتصدير', asmDesc: 'كل معطى مصنف: فعلي من الاستبيان، تقدير، معطى خارجي موثق، فرضية أو محاكاة. الأرقام نفسها تغذي تقرير Word وعرض PowerPoint.', legend: 'تصنيف البيانات', printTitle: 'دراسة الجدوى — ملخص النتائج'
    }
  };
  const t = () => T[lang()];
  const TYPE_STYLE = { enquete: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', estimation: 'bg-sky-500/15 text-sky-300 border-sky-500/30', externe: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', hypothese: 'bg-amber-500/15 text-amber-300 border-amber-500/30', simulation: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
  const badge = (type) => '<span class="inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold ' + TYPE_STYLE[type] + '">' + esc(E.TYPE_LABELS[type][lang()]) + '</span>';
  const tag = (type, short) => '<span class="inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold ' + TYPE_STYLE[type] + '">' + esc(short) + '</span>';

  /* ---------- État ---------- */
  let state = E.defaultState();
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (saved && saved.g && saved.sc) { Object.assign(state.g, saved.g); Object.keys(state.sc).forEach((k) => Object.assign(state.sc[k], saved.sc[k] || {})); }
  } catch (e) { /* stockage indisponible : on garde les valeurs par défaut */ }
  const save = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } };

  let indicators = null, surveyStatus = 'loading', surveyMeta = null, activeScenario = 'central', results = {}, charts = [];
  const KIT_KEYS = { kit1: 'kit1_cash', kit2: 'kit2_cash', kit3: 'kit3_cash' };

  const recomputeAll = () => { ['prudent', 'central', 'dynamique'].forEach((k) => { results[k] = E.runScenario(state.g, state.sc[k]); }); };
  const surveyDate = () => (surveyMeta && surveyMeta.updatedAt ? surveyMeta.updatedAt.toISOString().slice(0, 10) : E.MODEL_DATE);

  /* ---------- Graphiques ---------- */
  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#06b6d4', '#ec4899', '#84cc16', '#f97316'];
  function killCharts() { charts.forEach((c) => { try { c.destroy(); } catch (e) { /* ignore */ } }); charts = []; }
  // Couleurs des graphiques selon le thème (sombre = valeurs d'origine)
  const isLight = () => document.documentElement.classList.contains('light');
  const chartColors = () => (isLight() ? { tick: '#475569', grid: 'rgba(15,23,42,.10)', sep: '#ffffff' } : { tick: '#94a3b8', grid: 'rgba(255,255,255,.05)', sep: '#0f172a' });
  function chart(id, type, labels, data, title) {
    const el = $(id); if (!el || typeof Chart === 'undefined') return;
    const isPie = type === 'doughnut', cc = chartColors();
    charts.push(new Chart(el.getContext('2d'), {
      type, data: { labels, datasets: [{ data, backgroundColor: isPie ? COLORS : COLORS[0] + 'cc', borderColor: isPie ? cc.sep : COLORS[0], borderWidth: isPie ? 2 : 1, borderRadius: isPie ? 0 : 6 }] },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: type === 'bar' && labels.length > 5 ? 'y' : 'x',
        plugins: { legend: { display: isPie, position: 'bottom', labels: { color: cc.tick, font: { size: 10 }, boxWidth: 10 } }, tooltip: { callbacks: { label: (c) => ' ' + nf(c.parsed.y != null && !isPie ? (c.chart.options.indexAxis === 'y' ? c.parsed.x : c.parsed.y) : c.parsed, 1) + ' %' } } },
        scales: isPie ? {} : { x: { grid: { display: false }, ticks: { color: cc.tick, font: { size: 10 } } }, y: { grid: { color: cc.grid }, ticks: { color: cc.tick, font: { size: 10 } } } }
      }
    }));
  }

  /* ---------- Module 5 : synthèse de l’étude de marché ---------- */
  const lab = (i) => (lang() === 'ar' && i.label_ar ? i.label_ar : i.label_fr);
  const kpiCard = (label, value, sub, color) => '<div class="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center shadow"><span class="text-[11px] text-slate-400 block mb-1">' + esc(label) + '</span><span class="text-xl sm:text-2xl font-extrabold font-mono ' + color + '">' + value + '</span><span class="text-[10px] text-slate-500 block mt-1">' + sub + '</span></div>';

  function renderMarket() {
    const root = $('marketStudyRoot'); if (!root) return;
    killCharts();
    const L = t();
    if (!indicators) { root.innerHTML = '<div class="p-3 rounded-lg border border-slate-700 bg-slate-950 text-xs text-slate-400">' + esc(L.noSurveyYet) + '</div>'; return; }
    const I = indicators, D = I.distributions;
    const ci = (c) => (c ? ' · ' + L.icLabel + ' ' + nf(c[0] * 100, 0) + '–' + nf(c[1] * 100, 0) + ' %' : '');
    let h = '<div class="flex flex-wrap items-center gap-2 text-[11px]">' + tag('enquete', L.sampleResults) + '<span class="px-2 py-0.5 rounded border border-slate-700 text-slate-300">' + esc(L.quality[I.sample_quality]) + '</span></div>';
    h += '<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">';
    h += kpiCard(L.kSample, nf(I.market_sample_size), esc(L.potential) + ' : ' + (I.interested_count != null ? nf(I.interested_count) : '—'), 'text-cyan-400');
    h += kpiCard(L.kInterest, pc(I.payg_interest_rate, 0), esc(L.interestSub) + ci(I.payg_interest_ci), 'text-emerald-400');
    h += kpiCard(L.kIntent, pc(I.purchase_intention_rate, 0), esc(L.intentSub) + ci(I.purchase_intention_ci), 'text-amber-400');
    h += kpiCard(L.kPrice, I.median_monthly_payment != null ? nf(I.median_monthly_payment) + ' · ' + nf(I.average_monthly_payment) : '—', 'MRU / ' + (lang() === 'ar' ? 'شهر' : 'mois') + ' — ' + esc(L.priceSub), 'text-purple-400');
    h += kpiCard(L.kDuration, I.preferred_financing_label ? esc(I.preferred_financing_label) : '—', esc(L.modeSub), 'text-blue-400');
    h += kpiCard(L.kFreq, I.preferred_payment_label ? esc(I.preferred_payment_label) : '—', esc(L.modeSub), 'text-rose-400');
    h += kpiCard(L.kIns, pc(I.insurance_interest_rate, 0), esc(L.insSub) + ci(I.insurance_interest_ci), 'text-teal-400');
    h += '</div>';
    h += '<div class="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-200"><i class="fa-solid fa-triangle-exclamation mx-1"></i>' + esc(I.warnings.join(' ')) + '</div>';
    if (!D.monthlyPrice || !D.income) h += '<div class="p-3 rounded-lg border border-slate-700 bg-slate-950 text-[11px] text-slate-400"><i class="fa-solid fa-circle-info mx-1"></i>' + esc(L.missingQs) + '</div>';

    const defs = [['monthlyPrice', 'chPrice', 'bar'], ['interest', 'chInterest', 'doughnut'], ['duration', 'chDuration', 'bar'], ['frequency', 'chFreq', 'bar'], ['wilaya', 'chWilaya', 'bar'], ['activity', 'chActivity', 'doughnut'], ['income', 'chIncome', 'bar'], ['profile', 'chProfile', 'doughnut']];
    h += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
    const todo = [];
    defs.forEach(([k, title, type], i) => {
      const d = D[k]; if (!d || !d.total) return;
      let items = d.items.slice();
      if (k === 'wilaya') items = items.filter((x) => x.count > 0).sort((a, b) => b.count - a.count).slice(0, 8);
      if (type === 'doughnut') items = items.filter((x) => x.count > 0);
      todo.push(['mchart' + i, type, items.map(lab), items.map((x) => +x.pct.toFixed(1))]);
      h += '<div class="bg-slate-950 border border-slate-800 p-4 rounded-xl"><h5 class="text-xs font-bold text-slate-300 mb-1">' + esc(L[title]) + '</h5><p class="text-[10px] text-slate-500 mb-2">n = ' + nf(d.total) + '</p><div class="h-52"><canvas id="mchart' + i + '"></canvas></div></div>';
    });
    h += '</div>';

    // Résultats de l'échantillon → hypothèses du modèle
    const ref = I.reference_monthly_price;
    h += '<div class="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"><div class="flex flex-wrap justify-between items-center gap-2"><h5 class="text-xs font-bold text-amber-400">' + esc(L.hypTable) + '</h5><button type="button" id="btnApplySurvey" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs">' + esc(L.applySurvey) + '</button></div>';
    h += '<div class="overflow-x-auto"><table class="w-full text-[11px] text-slate-300"><thead><tr class="text-slate-500 text-start">' + L.hCol.map((c) => '<th class="py-1 px-2 text-start">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>';
    const dem = E.demandHypothesis(I, state.g);
    const rowsH = [
      [I.median_monthly_payment != null ? 'médiane ' + nf(I.median_monthly_payment) + ' · moy. ' + nf(I.average_monthly_payment) + ' MRU/mois' : '—', ref != null ? nf(ref) + ' MRU / ' + (lang() === 'ar' ? 'شهر' : 'mois') + ' (' + state.g.coverage + ' % ' + (lang() === 'ar' ? 'يقدرون' : 'peuvent payer') + ')' : '—'],
      [I.preferred_financing_label || '—', I.preferred_financing_months != null ? I.preferred_financing_months + ' ' + t().months : '—'],
      [I.preferred_payment_label || '—', I.preferred_payment_code || '—'],
      [I.purchase_intention_rate != null ? pc(I.purchase_intention_rate, 0) + ' oui · ' + pc(I.maybe_rate, 0) + ' peut-être' : '—', dem ? pc(dem.rate, 1) + ' (' + state.g.maybe_conv + ' % des « peut-être »)' : '—']
    ];
    rowsH.forEach((r, i) => { h += '<tr class="border-t border-slate-800"><td class="py-1.5 px-2">' + esc(L.hRows[i]) + '</td><td class="py-1.5 px-2">' + tag('enquete', L.sampleResults) + ' ' + esc(r[0]) + '</td><td class="py-1.5 px-2">' + tag('hypothese', L.usedHyp) + ' ' + esc(r[1]) + '</td></tr>'; });
    h += '</tbody></table></div><p class="text-[10px] text-slate-500">' + esc(L.generalize) + '</p><p id="appliedMsg" class="text-[11px] text-emerald-400 hidden">' + esc(L.applied) + '</p></div>';
    root.innerHTML = h;
    todo.forEach((a) => chart.apply(null, a));
    const b = $('btnApplySurvey'); if (b) b.onclick = applySurvey;
  }

  function applySurvey() {
    const I = indicators; if (!I) return;
    if (I.preferred_payment_code) { state.g.freq = I.preferred_payment_code; const f = $('freqInput'); if (f) f.value = I.preferred_payment_code; }
    if (I.preferred_financing_months) { Object.keys(state.sc).forEach((k) => { state.sc[k].tenure = I.preferred_financing_months; }); const te = $('tenureInput'); if (te) te.value = String(I.preferred_financing_months); }
    save(); renderAll();
    const m = $('appliedMsg'); if (m) m.classList.remove('hidden');
  }

  /* ---------- Module 2 : tarification ---------- */
  function currentPriceInputs() {
    const kit = (document.querySelector('input[name="productKit"]:checked') || {}).value || 'kit1';
    const cash = state.g[KIT_KEYS[kit]];
    const s = Object.assign({}, state.sc.central, { cashPrice: cash, tenure: parseInt(($('tenureInput') || {}).value, 10) || 12 });
    const g = Object.assign({}, state.g, { freq: ($('freqInput') || {}).value || 'weekly', deposit_pct: parseInt(($('resAcomptePct') || {}).innerText, 10) || state.g.deposit_pct });
    const insured = !!($('insuranceToggle') || {}).checked;
    return { p: E.priceParams(g, s, insured), kit, g, s };
  }

  function renderPricing() {
    if (!$('outInstallment')) return;
    const L = t(), { p, g, s } = currentPriceInputs(), pr = E.buildPrice(p), P = pr.parts;
    const freqNames = { daily: lang() === 'ar' ? 'القسط اليومي :' : 'Échéance quotidienne :', weekly: lang() === 'ar' ? 'القسط الأسبوعي :' : 'Échéance hebdomadaire :', monthly: lang() === 'ar' ? 'القسط الشهري :' : 'Échéance mensuelle :' };
    $('outAcompte').innerText = mru(pr.deposit);
    $('outInstallment').innerText = mru(pr.installment);
    $('outTotalCost').innerText = mru(pr.total);
    $('freqLabelDisplay').innerText = freqNames[p.freq];
    const base = P.kit + P.install + P.iot, ins = P.insurance, other = pr.total - base - ins;
    const w = (x) => Math.max(0, Math.round((x / pr.total) * 100));
    $('barPrincipal').style.width = w(base) + '%'; $('barInterest').style.width = w(other) + '%'; $('barInsurance').style.width = Math.max(0, 100 - w(base) - w(other)) + '%';
    $('lblCapVal').innerText = mru(base); $('lblIntVal').innerText = mru(other); $('lblInsVal').innerText = mru(ins);
    window.__lastInstallment = pr.installment; window.__lastPeriods = pr.periods; window.__freq = p.freq;
    refreshPayButtons();
    renderPriceMethod();

    const root = $('pricingStudyRoot'); if (!root) return;
    let h = '<div class="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4"><h4 class="text-xs text-emerald-400 font-bold uppercase tracking-wider">' + esc(L.lblPriceSection) + '</h4>';
    h += '<div class="overflow-x-auto"><table class="w-full text-xs text-slate-300"><thead><tr class="text-slate-500"><th class="py-1 text-start">' + esc(L.lblCompo) + '</th><th class="py-1 text-end">' + esc(L.lblAmount) + '</th><th class="py-1 text-end">' + esc(L.lblShare) + '</th></tr></thead><tbody>';
    pr.lines.forEach((l) => { const isIns = l.id === 'insurance'; h += '<tr class="border-t border-slate-800' + (isIns ? ' bg-emerald-500/10' : '') + '"><td class="py-1.5">' + esc(lang() === 'ar' ? l.ar : l.fr) + ' ' + tag('hypothese', L.hyp) + '</td><td class="py-1.5 text-end font-mono">' + mru(l.value) + '</td><td class="py-1.5 text-end font-mono">' + pc(l.value / pr.total, 1) + '</td></tr>'; });
    h += '<tr class="border-t-2 border-slate-600 font-bold text-white"><td class="py-2">' + esc(L.totalPayg) + '</td><td class="py-2 text-end font-mono">' + mru(pr.total) + '</td><td class="py-2 text-end font-mono">100 %</td></tr>';
    h += '<tr class="text-slate-400"><td class="py-1">' + esc(L.nPeriods) + ' (' + p.freq + ')</td><td class="py-1 text-end font-mono">' + nf(pr.periods) + '</td><td></td></tr>';
    h += '<tr class="text-emerald-300"><td class="py-1">' + esc(L.perPeriod) + ' = (' + esc(L.totalPayg) + ' − ' + (lang() === 'ar' ? 'المقدمة' : 'acompte') + ') ÷ ' + esc(L.nPeriods) + '</td><td class="py-1 text-end font-mono">' + mru(pr.installment) + '</td><td></td></tr>';
    h += '<tr class="text-slate-400"><td class="py-1">' + esc(L.monthlyEq) + '</td><td class="py-1 text-end font-mono">' + mru(pr.monthlyEquivalent) + '</td><td></td></tr>';
    h += '<tr class="text-emerald-400"><td class="py-1">' + esc(L.lblInsShare) + '</td><td class="py-1 text-end font-mono">' + mru(p.insured ? (P.insurance) / pr.periods : 0) + '</td><td></td></tr>';
    h += '</tbody></table></div><p class="text-[10px] text-slate-500">' + esc(L.priceTypeNote) + '</p>';

    // Repère enquête
    h += '<div class="border-t border-slate-800 pt-3 space-y-2"><div class="text-xs font-bold text-cyan-300">' + esc(L.marketRef) + ' ' + tag('enquete', L.sampleResults) + '</div>';
    const I = indicators, aff = I ? E.affordability(I, pr) : null;
    if (I && I.reference_monthly_price != null) {
      h += '<div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs"><div class="bg-slate-900 border border-slate-800 rounded-lg p-2.5"><span class="text-slate-400 block text-[11px]">' + esc(L.refMonthly.replace('{c}', Math.round((I.reference_coverage || 0.5) * 100))) + '</span><strong class="font-mono text-cyan-300">' + mru(I.reference_monthly_price) + '</strong></div>';
      h += '<div class="bg-slate-900 border border-slate-800 rounded-lg p-2.5"><span class="text-slate-400 block text-[11px]">' + esc(L.monthlyEq) + '</span><strong class="font-mono text-white">' + mru(pr.monthlyEquivalent) + '</strong></div>';
      h += '<div class="bg-slate-900 border border-slate-800 rounded-lg p-2.5"><span class="text-slate-400 block text-[11px]">' + esc(L.afford) + '</span><strong class="font-mono ' + (aff && aff.share >= 0.5 ? 'text-emerald-400' : 'text-red-400') + '">' + (aff ? pc(aff.share, 0) : '—') + '</strong></div></div>';
      if (pr.monthlyEquivalent > I.reference_monthly_price) {
        const sg = E.suggestTenure(I, p, I.reference_monthly_price);
        h += '<p class="text-[11px] text-amber-300"><i class="fa-solid fa-triangle-exclamation mx-1"></i>' + (sg ? esc(L.tenureAdvice) + ' <strong>' + sg.tenure + ' ' + esc(L.months) + '</strong> (' + mru(sg.monthly) + ' / ' + (lang() === 'ar' ? 'شهر' : 'mois') + ')' : esc(L.noTenure)) + '</p>';
      }
    } else h += '<p class="text-[11px] text-slate-500">' + esc(L.noSurveyYet) + '</p>';
    h += '</div></div>';
    root.innerHTML = h;
  }

  function refreshPayButtons() {
    const b = document.querySelectorAll('#module-iot button[onclick^="simulatePaymentWithAmount"]');
    const inst = window.__lastInstallment; if (!b.length || !inst || !isFinite(inst)) return;
    const per = { daily: lang() === 'ar' ? 'يوم' : 'jour', weekly: lang() === 'ar' ? 'أسبوع' : 'sem.', monthly: lang() === 'ar' ? 'شهر' : 'mois' }[window.__freq] || '';
    const a1 = Math.round(inst), a2 = Math.round(inst * (window.__freq === 'daily' ? 30 : window.__freq === 'weekly' ? 4 : 1));
    b[0].setAttribute('onclick', 'simulatePaymentWithAmount(' + a1 + ')'); b[0].textContent = nf(a1) + ' MRU (1 ' + per + ')';
    b[1].setAttribute('onclick', 'simulatePaymentWithAmount(' + a2 + ')'); b[1].textContent = nf(a2) + ' MRU (' + (lang() === 'ar' ? 'شهر' : '1 mois') + ')';
  }

  /* =====================================================================
   * Sections « Méthode de calcul » (modules 2, 4 et 5)
   * Explications pas à pas, bilingues, recalculées en direct : tous les nombres affichés
   * viennent du moteur (engine.js) et de l'état courant — rien n'est écrit en dur.
   * Modifier un kit, une durée, une hypothèse ou une réponse d'enquête met ces textes à jour.
   * ===================================================================== */
  const tx = (fr, ar) => (lang() === 'ar' ? ar : fr);
  const sumA = (a) => a.reduce((x, y) => x + y, 0);
  const dec = (x, d) => (x == null || !isFinite(x) ? '—' : Number(x).toLocaleString('fr-FR', { maximumFractionDigits: d == null ? 2 : d }));
  const pp = (x) => dec(x, 2) + ' %'; // x est déjà exprimé en % (ex. 12 → « 12 % »)
  const near = (a, b, tol) => isFinite(a) && isFinite(b) && Math.abs(a - b) <= (tol == null ? Math.max(1, Math.abs(b) * 1e-9) : tol);
  const okMark = (b) => (b ? '<span class="text-emerald-400 font-bold">✓</span>' : '<span class="text-red-400 font-bold">✗</span>');
  const fx = (h) => '<span class="fx">' + h + '</span>';
  const fi = (h) => '<span class="fxi">' + h + '</span>'; // expression chiffrée isolée (reste de gauche à droite dans une phrase arabe)
  const mPlain = (x) => (x == null || !isFinite(x) ? '—' : nf(Math.round(x))); // nombre sans unité
  // En arabe, un nombre suivi de « MRU » ou « % » est isolé (sinon l'ordre visuel s'inverse dans une phrase de droite à gauche)
  const bidiNum = (h) => (lang() === 'ar' ? h.replace(/-?\d[\d\u202f\u00a0]*(?:,\d+)?(?: MRU| %)/g, (m) => '<span class="fxi">' + m + '</span>') : h);
  const mP = (html, cls) => '<p class="text-[11px] ' + (cls || 'text-slate-300') + ' leading-relaxed">' + bidiNum(html) + '</p>';
  const mF = (html) => '<div class="text-[11px] text-amber-300 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 overflow-x-auto"><span class="fx">' + html + '</span></div>';
  const mW = (html) => '<div class="text-[11px] text-amber-300 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 overflow-x-auto">' + html + '</div>';
  const mNeg = (x, html) => (x < 0 ? '<span class="text-red-400">' + html + '</span>' : html);
  const mOpen = {}; // état ouvert/fermé de chaque bloc (conservé d'un recalcul à l'autre)
  const mTable = (heads, rows, aligns, hi) => {
    const al = (i) => (aligns && aligns[i] === 'e' ? 'text-end' : 'text-start');
    return '<div class="overflow-x-auto"><table class="w-full text-[11px] text-slate-300"><thead><tr class="text-slate-500">' +
      heads.map((h, i) => '<th class="py-1 px-2 ' + al(i) + '">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map((r, ri) => '<tr class="border-t border-slate-800' + (hi && hi.indexOf(ri) >= 0 ? ' font-bold text-white' : '') + '">' + r.map((c, i) => '<td class="py-1.5 px-2 align-top ' + al(i) + '">' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  };
  const mDet = (key, title, body, tone, nested) =>
    '<details data-m="' + key + '"' + (mOpen[key] === false ? '' : ' open') + ' class="' + (nested ? 'bg-slate-900 border border-slate-800 rounded-lg p-3' : 'bg-slate-950 border border-slate-800 rounded-xl p-4') + '"><summary class="cursor-pointer text-xs font-bold ' + (tone || 'text-amber-400') + '">' + esc(title) + '</summary><div class="mt-3 space-y-3">' + body + '</div></details>';
  document.addEventListener('toggle', (e) => { const d = e.target; if (d && d.tagName === 'DETAILS' && d.dataset && d.dataset.m) mOpen[d.dataset.m] = d.open; }, true);

  /* ---------- Module 2 : comment le prix PAYG est calculé ---------- */
  function renderPriceMethod() {
    const root = $('pricingMethodRoot'); if (!root) return;
    const { p, kit, g, s } = currentPriceInputs(), pr = E.buildPrice(p), P = pr.parts, I = indicators;
    const ki = E.KITS.find((k) => k.id === kit), kitName = ki ? ki[lang()] : kit;
    const freqName = { daily: tx('quotidien', 'يومي'), weekly: tx('hebdomadaire', 'أسبوعي'), monthly: tx('mensuel', 'شهري') }[p.freq];
    const ppy = E.PERIODS_PER_YEAR[p.freq], cash = p.cashPrice, n = Math.max(1, p.tenure);
    const base = P.kit + P.install + P.iot, financed = base * (1 - p.depositPct / 100), fct = (n + 1) / (2 * n);
    const c0 = pr.costs - P.commission, mg = p.marginPct, cm = p.commissionPct, dn = 1 - (cm / 100) * (1 + mg / 100);
    const insTxt = p.insured ? tx('avec micro-assurance', 'مع التأمين الأصغر') : tx('sans micro-assurance', 'دون تأمين');
    let body = mP(tx(
      'Le prix part des coûts, pas d’un taux arbitraire : on additionne tout ce que l’entreprise doit couvrir (kit, installation, équipement IoT, financement, assurance, suivi client, risque d’impayé, commission du paiement mobile), puis on ajoute une marge. Les valeurs ci-dessous correspondent exactement à votre sélection actuelle — <strong>' + esc(kitName) + '</strong> · ' + p.tenure + ' mois · paiement ' + freqName + ' · ' + insTxt + ' — et se recalculent à chaque modification (kit, durée, fréquence, assurance, score, hypothèses du module 4).',
      'ينطلق السعر من التكاليف لا من نسبة اعتباطية: نجمع كل ما يجب على الشركة تغطيته (النظام، التركيب، جهاز IoT، التمويل، التأمين، متابعة العميل، مخاطر التعثر، عمولة الدفع عبر الهاتف) ثم نضيف الهامش. القيم أدناه تطابق اختياركم الحالي تماما — <strong>' + esc(kitName) + '</strong> · ' + p.tenure + ' شهرا · دفع ' + freqName + ' · ' + insTxt + ' — وتُعاد حسابتها عند كل تعديل (النظام، المدة، الوتيرة، التأمين، التنقيط، فرضيات الوحدة 4).'));

    if (!isFinite(pr.total)) {
      body += mP(tx('Prix non calculable : commission × (1 + marge) ≥ 100 % (dénominateur ' + dec(dn, 4) + ' ≤ 0). Réduisez la commission ou la marge.', 'السعر غير قابل للحساب: العمولة × (1 + الهامش) ≥ 100% (المقام ' + dec(dn, 4) + ' ≤ 0). خفّضوا العمولة أو الهامش.'), 'text-red-300');
      root.innerHTML = mDet('price', tx('Méthode de calcul du prix PAYG', 'طريقة حساب سعر PAYG'), body, 'text-emerald-400');
      return;
    }
    // Étapes
    const R = [], H = [];
    const add = (lbl, formula, app, res, hi) => { R.push([esc(lbl), formula, fx(app), '<span class="fx font-bold text-white">' + res + '</span>']); if (hi) H.push(R.length - 1); };
    add(tx('Coût d’achat du kit', 'تكلفة شراء النظام'), esc(tx('Prix comptant × ratio d’achat', 'السعر النقدي × نسبة الشراء')), mru(cash) + ' × ' + pp(p.costRatio), mru(P.kit));
    add(tx('Installation', 'التركيب'), esc(tx('Prix comptant × % d’installation', 'السعر النقدي × نسبة التركيب')), mru(cash) + ' × ' + pp(p.installPct), mru(P.install));
    add(tx('Équipement de paiement / IoT', 'جهاز الدفع / إنترنت الأشياء'), esc(tx('Montant fixe par kit', 'مبلغ ثابت لكل نظام')), mru(p.iotCost), mru(P.iot));
    add(tx('Base de coût d’acquisition B', 'قاعدة تكلفة الاقتناء B'), esc(tx('Kit + installation + IoT', 'النظام + التركيب + الجهاز')), mru(P.kit) + ' + ' + mru(P.install) + ' + ' + mru(P.iot), mru(base), true);
    add(tx('Capital engagé F (après acompte)', 'رأس المال الموظَّف F (بعد الدفعة المقدمة)'), fx('F = B × (1 − d)'), mru(base) + ' × (1 − ' + pp(p.depositPct) + ')', mru(financed));
    add(tx('Coût de financement', 'تكلفة التمويل'), fx('F × i × (n ÷ 12) × (n+1) ÷ 2n'), mru(financed) + ' × ' + pp(p.fundingRate) + ' × (' + n + ' ÷ 12) × ' + dec(fct, 4), mru(P.financing));
    if (p.insured) add(tx('Micro-assurance', 'التأمين الأصغر'), esc(tx('Prime % × prix comptant × (durée ÷ 12)', 'القسط % × السعر النقدي × (المدة ÷ 12)')), pp(p.insRate) + ' × ' + mru(cash) + ' × (' + p.tenure + ' ÷ 12)', mru(P.insurance));
    else add(tx('Micro-assurance', 'التأمين الأصغر'), esc(tx('Client non assuré → 0', 'عميل غير مؤمَّن ← 0')), '—', mru(0));
    add(tx('Suivi client (SAV, recouvrement, SMS)', 'متابعة العميل'), esc(tx('Coût mensuel × coefficient opex × durée', 'التكلفة الشهرية × معامل التكاليف × المدة')), mru(g.servicing) + ' × ' + dec(s.opexMult) + ' × ' + p.tenure, mru(P.servicing));
    add(tx('Provision pour risque de crédit', 'مخصص مخاطر الائتمان'), fx('F × p'), mru(financed) + ' × ' + pp(p.defaultRate), mru(P.risk));
    add(tx('Coûts hors commission C₀', 'التكاليف دون العمولة C₀'), esc(tx('B + financement + assurance + suivi + risque', 'B + التمويل + التأمين + المتابعة + المخاطر')), [base, P.financing, P.insurance, P.servicing, P.risk].map(mru).join(' + '), mru(c0), true);
    add(tx('Prix total PAYG', 'السعر الإجمالي PAYG'), fx('T = C₀ × (1 + m) ÷ [1 − c × (1 + m)]'), mru(c0) + ' × (1 + ' + pp(mg) + ') ÷ [1 − ' + pp(cm) + ' × (1 + ' + pp(mg) + ')]', mru(pr.total), true);
    add(tx('Commission du paiement mobile', 'عمولة الدفع عبر الهاتف'), fx('c × T'), pp(cm) + ' × ' + mru(pr.total), mru(P.commission));
    add(tx('Marge', 'الهامش'), fx('m × (C₀ + c × T)'), pp(mg) + ' × (' + mru(c0) + ' + ' + mru(P.commission) + ')', mru(P.margin));
    add(tx('Contrôle', 'تحقق'), esc(tx('Somme des 8 composantes = prix total', 'مجموع المكوّنات الثمانية = السعر الإجمالي')), mru(pr.checksum) + ' = ' + mru(pr.total), okMark(near(pr.checksum, pr.total)));
    add(tx('Acompte', 'الدفعة المقدمة'), fx('d × T'), pp(p.depositPct) + ' × ' + mru(pr.total), mru(pr.deposit));
    add(tx('Montant à échelonner', 'المبلغ المقسَّط'), esc(tx('Prix total − acompte', 'السعر الإجمالي − الدفعة المقدمة')), mru(pr.total) + ' − ' + mru(pr.deposit), mru(pr.financedAmount));
    add(tx('Nombre d’échéances', 'عدد الأقساط'), esc(tx('arrondi(durée × périodes par an ÷ 12)', 'تقريب(المدة × عدد الفترات سنويا ÷ 12)')), 'round(' + p.tenure + ' × ' + ppy + ' ÷ 12)', mPlain(pr.periods));
    add(tx('Échéance PAYG', 'القسط PAYG'), esc(tx('Montant à échelonner ÷ nombre d’échéances', 'المبلغ المقسَّط ÷ عدد الأقساط')), mru(pr.financedAmount) + ' ÷ ' + mPlain(pr.periods), mru(pr.installment), true);
    add(tx('Équivalent mensuel', 'المعادل الشهري'), esc(tx('Montant à échelonner ÷ durée (mois)', 'المبلغ المقسَّط ÷ المدة (أشهر)')), mru(pr.financedAmount) + ' ÷ ' + p.tenure, mru(pr.monthlyEquivalent));
    if (p.insured) add(tx('Part de l’assurance dans chaque échéance', 'حصة التأمين في كل قسط'), esc(tx('Assurance ÷ nombre d’échéances', 'التأمين ÷ عدد الأقساط')), mru(P.insurance) + ' ÷ ' + mPlain(pr.periods), mru(P.insurance / pr.periods));
    body += mTable([tx('Étape', 'الخطوة'), tx('Formule', 'الصيغة'), tx('Application numérique', 'التطبيق العددي'), tx('Résultat', 'النتيجة')], R, ['s', 's', 's', 'e'], H);
    body += mP(tx('Légende : B = base de coût d’acquisition · F = capital engagé · i = coût de financement annuel (' + pp(p.fundingRate) + ') · p = taux d’impayés (' + pp(p.defaultRate) + ') · m = marge visée (' + pp(mg) + ') · c = commission mobile (' + pp(cm) + ') · d = acompte (' + pp(p.depositPct) + ') · T = prix total · n = durée en mois (' + n + ').', 'مفتاح الرموز: B = قاعدة تكلفة الاقتناء · F = رأس المال الموظَّف · i = تكلفة التمويل السنوية (' + pp(p.fundingRate) + ') · p = نسبة التعثر (' + pp(p.defaultRate) + ') · m = الهامش المستهدف (' + pp(mg) + ') · c = عمولة الدفع (' + pp(cm) + ') · d = الدفعة المقدمة (' + pp(p.depositPct) + ') · T = السعر الإجمالي · n = المدة بالأشهر (' + n + ').'), 'text-slate-400');
    body += mP(tx(
      '<strong>Coût de financement.</strong> Le facteur (n+1) ÷ 2n = ' + dec(fct, 4) + ' est la part moyenne du capital encore due pendant le crédit lorsqu’il est remboursé en n mensualités égales de capital : le financement est donc facturé sur le solde moyen restant dû, et non sur le capital entier.',
      '<strong>تكلفة التمويل.</strong> المعامل (n+1) ÷ 2n = ' + dec(fct, 4) + ' هو متوسط حصة رأس المال التي تبقى مستحقة طوال مدة القرض عند سداده على n أقساط شهرية متساوية من رأس المال؛ لذا يُحسب التمويل على متوسط الرصيد المتبقي لا على رأس المال كاملا.'), 'text-slate-400');
    body += mP(tx(
      '<strong>Prix total (résolution fermée).</strong> La commission dépend elle-même du prix total (c × Total). On résout donc l’équation Total = (C₀ + c × Total) × (1 + m), ce qui donne Total = C₀ × (1 + m) ÷ [1 − c × (1 + m)]. Ici le dénominateur vaut ' + dec(dn, 4) + '.',
      '<strong>السعر الإجمالي (حل جبري).</strong> العمولة تعتمد نفسها على السعر الإجمالي (c × الإجمالي). لذلك نحل المعادلة الإجمالي = (C₀ + c × الإجمالي) × (1 + m) فنحصل على الإجمالي = C₀ × (1 + m) ÷ [1 − c × (1 + m)]. المقام هنا يساوي ' + dec(dn, 4) + '.'), 'text-slate-400');

    // Barre « Structure de l'échéance »
    const other = pr.total - base - P.insurance, w = (x) => Math.max(0, Math.round((x / pr.total) * 100)), wb = w(base), wo = w(other), wi = Math.max(0, 100 - wb - wo);
    body += mDet('price-bar', tx('Lecture de la barre « Structure de l’échéance »', 'قراءة شريط «هيكلة القسط»'), mP(tx(
      'Capital = B = ' + mru(base) + ' (' + wb + ' %) · Financement, coûts & marge = Prix total − B − assurance = ' + mru(pr.total) + ' − ' + mru(base) + ' − ' + mru(P.insurance) + ' = ' + mru(other) + ' (' + wo + ' %) · Assurance = ' + mru(P.insurance) + ' (' + wi + ' %). Chaque largeur est le montant rapporté au prix total, arrondi à l’entier.',
      'رأس المال = B = ' + mru(base) + ' (' + wb + '%) · التمويل والتكاليف والهامش = السعر الإجمالي − B − التأمين = ' + mru(pr.total) + ' − ' + mru(base) + ' − ' + mru(P.insurance) + ' = ' + mru(other) + ' (' + wo + '%) · التأمين = ' + mru(P.insurance) + ' (' + wi + '%). عرض كل جزء هو مبلغه مقسوما على السعر الإجمالي ومقرَّبا إلى عدد صحيح.')), 'text-slate-200', true);

    // Paramètres utilisés et où les modifier
    const mod4 = tx('Module 4', 'الوحدة 4'), sc = tx('Scénario Central', 'السيناريو الأساسي');
    const PR = [
      [tx('Prix comptant du kit choisi', 'السعر النقدي للنظام المختار'), mru(cash), mod4 + ' › ' + tx('D. Revenus (un prix par kit)', 'د. الإيرادات (سعر لكل نظام)')],
      [tx('Ratio d’achat du kit', 'نسبة شراء النظام'), pp(p.costRatio), mod4 + ' › ' + sc],
      [tx('Installation', 'التركيب'), pp(p.installPct), mod4 + ' › ' + tx('C. Coûts variables', 'ج. التكاليف المتغيرة')],
      [tx('Équipement paiement / IoT', 'جهاز الدفع'), mru(p.iotCost), mod4 + ' › ' + tx('C. Coûts variables', 'ج. التكاليف المتغيرة')],
      [tx('Acompte', 'الدفعة المقدمة'), pp(p.depositPct), tx('Module 1 (Mauri-Score) : 10 %, 20 % ou 30 % selon le score', 'الوحدة 1 (Mauri-Score): 10% أو 20% أو 30% حسب النقاط')],
      [tx('Durée', 'المدة'), p.tenure + ' ' + tx('mois', 'شهرا'), tx('Module 2 › Durée du financement', 'الوحدة 2 › مدة التمويل')],
      [tx('Fréquence de paiement', 'وتيرة الدفع'), freqName, tx('Module 2 › Fréquence des paiements', 'الوحدة 2 › تكرار الدفعات')],
      [tx('Micro-assurance', 'التأمين الأصغر'), p.insured ? tx('Oui', 'نعم') : tx('Non', 'لا'), tx('Module 2 › interrupteur micro-assurance', 'الوحدة 2 › مفتاح التأمين الأصغر')],
      [tx('Prime d’assurance (par an)', 'قسط التأمين (سنويا)'), pp(p.insRate), mod4 + ' › ' + sc],
      [tx('Coût de financement (par an)', 'تكلفة التمويل (سنويا)'), pp(p.fundingRate), mod4 + ' › ' + tx('C. Coûts variables', 'ج. التكاليف المتغيرة')],
      [tx('Taux d’impayés', 'نسبة التعثر'), pp(p.defaultRate), mod4 + ' › ' + sc],
      [tx('Commission paiement mobile', 'عمولة الدفع عبر الهاتف'), pp(p.commissionPct), mod4 + ' › ' + tx('C. Coûts variables', 'ج. التكاليف المتغيرة')],
      [tx('Suivi client × coefficient opex', 'متابعة العميل × معامل التكاليف'), mru(g.servicing) + ' × ' + dec(s.opexMult), mod4 + ' › C. × ' + sc],
      [tx('Marge visée', 'الهامش المستهدف'), pp(p.marginPct), mod4 + ' › ' + sc]
    ];
    body += mDet('price-params', tx('Paramètres utilisés et où les modifier', 'المعاملات المستخدمة وأين تُعدَّل'), mTable([tx('Paramètre', 'المعامل'), tx('Valeur actuelle', 'القيمة الحالية'), tx('Où la modifier', 'أين تُعدَّل')], PR.map((r) => [esc(r[0]), fx(esc(r[1])), esc(r[2])]), ['s', 's', 's']) +
      mP(tx('Le prix du module 2 utilise les hypothèses du scénario « Central » ; l’acompte vient du Mauri-Score (module 1), pas du champ « Acompte » du module 4 (qui sert au modèle financier).', 'يعتمد سعر الوحدة 2 فرضيات السيناريو «الأساسي»؛ وتأتي الدفعة المقدمة من Mauri-Score (الوحدة 1) لا من حقل «الدفعة المقدمة» في الوحدة 4 (الذي يخدم النموذج المالي).'), 'text-slate-400'), 'text-slate-200', true);

    // Lien avec l'enquête : test d'accessibilité
    let aff = '';
    if (I && I.reference_monthly_price != null) {
      const a = E.affordability(I, pr), ref = I.reference_monthly_price, cov = Math.round((I.reference_coverage || 0.5) * 100);
      aff += mP(tx(
        '<strong>Test d’accessibilité (lien avec l’enquête).</strong> Budget de référence = montant mensuel que ' + cov + ' % des répondants déclarent pouvoir payer = <strong>' + mru(ref) + '</strong>. Équivalent mensuel du kit = (prix total − acompte) ÷ durée = <strong>' + mru(pr.monthlyEquivalent) + '</strong>. Part des répondants dont le budget couvre cet équivalent = Σ (effectif de la tranche × fraction de la tranche dont le budget ≥ équivalent) ÷ répondants = <strong>' + (a ? pc(a.share, 0) : '—') + '</strong> (répartition uniforme supposée dans chaque tranche ; détail dans le module 5).',
        '<strong>اختبار القدرة على الدفع (الربط بالاستبيان).</strong> الميزانية المرجعية = المبلغ الشهري الذي يصرّح ' + cov + '% من المجيبين بقدرتهم على دفعه = <strong>' + mru(ref) + '</strong>. المعادل الشهري للنظام = (السعر الإجمالي − الدفعة المقدمة) ÷ المدة = <strong>' + mru(pr.monthlyEquivalent) + '</strong>. نسبة المجيبين الذين تغطي ميزانيتهم هذا المعادل = Σ (عدد المجيبين في الشريحة × الجزء من الشريحة الذي تبلغ ميزانيته ≥ المعادل) ÷ عدد المجيبين = <strong>' + (a ? pc(a.share, 0) : '—') + '</strong> (توزيع منتظم داخل كل شريحة؛ التفصيل في الوحدة 5).'));
      if (pr.monthlyEquivalent > ref) {
        const sg = E.suggestTenure(I, p, ref);
        aff += mP(tx('Alerte active : l’équivalent dépasse le budget de référence. Le site teste 6, 12, 18 puis 24 mois et retient la première durée dont l’équivalent mensuel passe sous le budget : ', 'التنبيه مفعَّل: المعادل يتجاوز الميزانية المرجعية. يجرّب الموقع 6 ثم 12 ثم 18 ثم 24 شهرا ويقترح أول مدة ينزل معادلها الشهري تحت الميزانية: ') + (sg ? '<strong>' + sg.tenure + ' ' + tx('mois', 'شهرا') + '</strong> (' + mru(sg.monthly) + ')' : tx('aucune durée de 6 à 24 mois ne suffit.', 'لا توجد مدة من 6 إلى 24 شهرا تكفي.')), 'text-amber-300');
      } else aff += mP(tx('Aucune alerte : l’équivalent mensuel est inférieur ou égal au budget de référence.', 'لا يوجد تنبيه: المعادل الشهري أقل من الميزانية المرجعية أو يساويها.'), 'text-emerald-400');
    } else aff += mP(esc(t().noSurveyYet), 'text-slate-400');
    body += mDet('price-aff', tx('Lien avec l’enquête : accessibilité du prix', 'الربط بالاستبيان: القدرة على تحمّل السعر'), aff, 'text-cyan-300', true);

    root.innerHTML = mDet('price', tx('Méthode de calcul du prix PAYG (pas à pas, valeurs en direct)', 'طريقة حساب سعر PAYG (خطوة بخطوة، بالقيم الحالية)'), body, 'text-emerald-400');
  }

  /* ---------- Module 4 : VAN, TRI et autres indicateurs ---------- */
  function renderFinMethod() {
    const root = $('finMethodRoot'); if (!root) return;
    const r = results[activeScenario]; if (!r) { root.innerHTML = ''; return; }
    const s = state.sc[activeScenario], g = state.g, scName = E.SCENARIO_NAMES[activeScenario][lang()];
    const flows = r.flows, U = r.unit, PI = r.priceInsured, PN = r.priceUninsured;
    const D = Math.max(1, Math.round(s.tenure)), def = s.defaultRate / 100, cm = g.commission_pct / 100;
    const rm = Math.pow(1 + s.discount / 100, 1 / 12) - 1, grant = s.grant || 0, F0 = flows[0];
    const fixedBase = sumA(E.FIXED_ITEMS.map(([k]) => g[k] || 0));
    const cum = []; let acc = 0; flows.forEach((cf, t) => { acc += cf; cum.push(acc); });
    const yr = (i) => r.years[i];
    let body = mP(tx(
      'Tous les indicateurs découlent d’une même série de <strong>61 flux de trésorerie</strong> : un flux initial à t = 0 (investissement) puis 60 flux mensuels (5 ans). Chaque chiffre ci-dessous est recalculé à partir des hypothèses actuellement saisies (scénario <strong>' + esc(scName) + '</strong>) : modifiez une hypothèse, le scénario ou la langue et tout se met à jour.',
      'تنبثق كل المؤشرات من سلسلة واحدة من <strong>61 تدفقا نقديا</strong>: تدفق أولي عند t = 0 (الاستثمار) ثم 60 تدفقا شهريا (5 سنوات). كل رقم أدناه يُعاد حسابه من الفرضيات المُدخلة حاليا (السيناريو <strong>' + esc(scName) + '</strong>): غيّروا أي فرضية أو السيناريو أو اللغة فيتحدّث كل شيء.'));

    /* 1. Flux de trésorerie */
    let b1 = mP(tx('Le modèle est un modèle de trésorerie mensuel sur 60 mois (base « encaissements / décaissements », sans créances comptables).', 'النموذج نموذج نقدي شهري على 60 شهرا (أساس المقبوضات والمدفوعات دون ذمم محاسبية).'));
    b1 += mF('F<sub>0</sub> = − CAPEX + S<br>F<sub>t</sub> = E<sub>t</sub> − V<sub>t</sub> − C<sub>t</sub> &nbsp; (t = 1 … 60)<br>E<sub>t</sub> = N<sub>t</sub> × A + Σ<sub>a=t−D…t−1</sub> N<sub>a</sub> × M × (1 − d)<br>V<sub>t</sub> = N<sub>t</sub> × K + Σ<sub>a=t−D…t−1</sub> N<sub>a</sub> × (I + U) + c × E<sub>t</sub><br>C<sub>t</sub> = B × k ÷ 12');
    b1 += mP(tx(
      'Un client acquis au mois a verse son acompte au mois a, puis une mensualité pendant D mois (mois a+1 à a+D), dont seule la part (1 − d) est réellement encaissée. La somme Σ porte sur les cohortes encore en cours de remboursement (a ≥ 1).',
      'العميل المُكتسَب في الشهر a يدفع دفعته المقدمة في الشهر a ثم قسطا شهريا طوال D شهرا (من الشهر a+1 إلى a+D)، ولا يُحصَّل فعليا منه إلا الجزء (1 − d). ويشمل المجموع Σ الدفعات التي ما زالت قيد السداد (a ≥ 1).'), 'text-slate-400');
    const SY = [
      ['F₀', esc(tx('Flux initial', 'التدفق الأولي')), fx('−CAPEX + S'), fx(mru(-r.capex) + ' + ' + mru(grant)), fx('<strong>' + mru(F0) + '</strong>')],
      ['CAPEX', esc(tx('Investissement initial = somme des 6 postes de la section A', 'الاستثمار الأولي = مجموع البنود الستة في القسم أ')), esc(tx('Σ section A', 'Σ القسم أ')), fx(E.CAPEX_ITEMS.map(([k]) => mPlain(g[k] || 0)).join(' + ')), fx(mru(r.capex))],
      ['S', esc(tx('Subvention (non acquise)', 'المنحة (غير مؤكدة)')), fx('S'), fx('—'), fx(mru(grant))],
      ['A', esc(tx('Acompte moyen par client', 'متوسط الدفعة المقدمة لكل عميل')), fx('t × A<sub>ass.</sub> + (1−t) × A<sub>non</sub>'), fx(pp(g.insurance_takeup) + ' × ' + mru(PI.deposit) + ' + ' + pp(100 - g.insurance_takeup) + ' × ' + mru(PN.deposit)), fx(mru(U.deposit))],
      ['M', esc(tx('Mensualité moyenne (équivalent mensuel)', 'متوسط القسط الشهري (المعادل الشهري)')), fx('t × M<sub>ass.</sub> + (1−t) × M<sub>non</sub>'), fx(pp(g.insurance_takeup) + ' × ' + mru(PI.monthlyEquivalent) + ' + ' + pp(100 - g.insurance_takeup) + ' × ' + mru(PN.monthlyEquivalent)), fx(mru(U.instMonthly))],
      ['K', esc(tx('Coût d’acquisition (kit + installation + IoT)', 'تكلفة الاقتناء (النظام + التركيب + الجهاز)')), esc(tx('kit + installation + IoT', 'النظام + التركيب + الجهاز')), fx(mru(PI.parts.kit) + ' + ' + mru(PI.parts.install) + ' + ' + mru(PI.parts.iot)), fx(mru(U.acqCost))],
      ['I', esc(tx('Assurance mensuelle moyenne', 'متوسط التأمين الشهري')), esc(tx('t × prix comptant × prime ÷ 12', 't × السعر النقدي × القسط ÷ 12')), fx(pp(g.insurance_takeup) + ' × ' + mru(s.cashPrice) + ' × ' + pp(s.insRate) + ' ÷ 12'), fx(mru(U.insMonthly))],
      ['U', esc(tx('Suivi client mensuel', 'متابعة العميل شهريا')), esc(tx('suivi × coefficient k', 'المتابعة × المعامل k')), fx(mru(g.servicing) + ' × ' + dec(s.opexMult)), fx(mru(U.servMonthly))],
      ['d', esc(tx('Taux d’impayés', 'نسبة التعثر')), fx('d'), fx('—'), fx(pp(s.defaultRate))],
      ['c', esc(tx('Commission du paiement mobile', 'عمولة الدفع عبر الهاتف')), fx('c'), fx('—'), fx(pp(g.commission_pct))],
      ['D', esc(tx('Durée de financement', 'مدة التمويل')), fx('D'), fx('—'), fx(D + ' ' + tx('mois', 'شهرا'))],
      ['C<sub>t</sub>', esc(tx('Coûts fixes mensuels (B = coûts fixes annuels de la section B ; k = coefficient des coûts opérationnels)', 'التكاليف الثابتة الشهرية (B = التكاليف الثابتة السنوية في القسم ب ؛ k = معامل التكاليف التشغيلية)')), fx('B × k ÷ 12'), fx(mru(fixedBase) + ' × ' + dec(s.opexMult) + ' ÷ 12'), fx(mru(r.fixedAnnual / 12))]
    ];
    b1 += mTable([tx('Symbole', 'الرمز'), tx('Signification', 'المعنى'), tx('Formule', 'الصيغة'), tx('Application numérique', 'التطبيق العددي'), tx('Valeur actuelle', 'القيمة الحالية')], SY.map((x) => ['<span class="font-mono">' + x[0] + '</span>', x[1], x[2], x[3], x[4]]), ['s', 's', 's', 's', 'e']) +
      mP(tx('t = part des clients assurés (' + pp(g.insurance_takeup) + '). Les valeurs « ass. » et « non » viennent des deux prix PAYG calculés comme dans le module 2 (avec et sans assurance).', 't = حصة العملاء المؤمَّنين (' + pp(g.insurance_takeup) + '). القيمتان «ass.» و«non» من سعري PAYG المحسوبين كما في الوحدة 2 (مع التأمين ودونه).'), 'text-slate-400');
    b1 += mTable([tx('Année', 'السنة'), tx('Nouveaux clients', 'عملاء جدد'), tx('Par mois (÷ 12)', 'شهريا (÷ 12)'), tx('Formule', 'الصيغة')],
      r.years.map((y, i) => [esc((lang() === 'ar' ? 'سنة ' : 'An ') + y.year), fx(mPlain(y.clients)), fx(dec(y.clients / 12, 1)), fx(mPlain(s.clients1) + ' × (1 + ' + pp(s.growth) + ')<sup>' + i + '</sup>')]), ['s', 'e', 'e', 's']);
    // Contrôle détaillé : mois 1 et mois 13 recalculés à partir des formules ci-dessus
    const newM = (mm) => yr(Math.floor((mm - 1) / 12)).clients / 12;
    const detail = (m) => {
      const nm = newM(m); let cl = 0, inst = 0, run = 0;
      for (let a = Math.max(1, m - D); a < m; a++) { const x = newM(a); cl += x; inst += x * U.instMonthly * (1 - def); run += x * (U.insMonthly + U.servMonthly); }
      const dep = nm * U.deposit, coll = dep + inst, acq = nm * U.acqCost, com = cm * coll, vr = acq + run + com, fxd = r.fixedAnnual / 12;
      return { nm, cl, dep, inst, coll, acq, run, com, vr, fxd, flow: coll - vr - fxd };
    };
    const M1 = detail(1), M2 = detail(13), mk = (f) => [fx(f(M1)), fx(f(M2))];
    const DR = [
      [tx('Nouveaux clients du mois (N)', 'العملاء الجدد في الشهر (N)')].concat(mk((x) => dec(x.nm, 1))),
      [tx('Clients en cours de remboursement (Σ N<sub>a</sub>)', 'العملاء قيد السداد (Σ N<sub>a</sub>)')].concat(mk((x) => dec(x.cl, 1))),
      [tx('Acomptes encaissés = N × A', 'الدفعات المقدمة = N × A')].concat(mk((x) => mPlain(x.dep))),
      [tx('Échéances encaissées = Σ N<sub>a</sub> × M × (1 − d)', 'الأقساط المحصَّلة = Σ N<sub>a</sub> × M × (1 − d)')].concat(mk((x) => mPlain(x.inst))),
      [tx('Encaissements E', 'المقبوضات E')].concat(mk((x) => mPlain(x.coll))),
      [tx('Coût d’acquisition = N × K', 'تكلفة الاقتناء = N × K')].concat(mk((x) => mPlain(x.acq))),
      [tx('Assurance + suivi = Σ N<sub>a</sub> × (I + U)', 'التأمين + المتابعة = Σ N<sub>a</sub> × (I + U)')].concat(mk((x) => mPlain(x.run))),
      [tx('Commission mobile = c × E', 'عمولة الدفع = c × E')].concat(mk((x) => mPlain(x.com))),
      [tx('Coûts variables V', 'التكاليف المتغيرة V')].concat(mk((x) => mPlain(x.vr))),
      [tx('Coûts fixes C', 'التكاليف الثابتة C')].concat(mk((x) => mPlain(x.fxd))),
      [tx('Flux net F = E − V − C', 'التدفق الصافي F = E − V − C')].concat(mk((x) => mNeg(x.flow, mPlain(x.flow)))),
      [tx('Contrôle : flux du moteur', 'تحقق: تدفق المحرك')].concat([fx(mPlain(flows[1]) + ' ' + okMark(near(M1.flow, flows[1]))), fx(mPlain(flows[13]) + ' ' + okMark(near(M2.flow, flows[13])))])
    ];
    b1 += mDet('fin-month', tx('Exemple détaillé : mois 1 et mois 13 (MRU)', 'مثال مفصّل: الشهر 1 والشهر 13 (أوقية)'), mTable([tx('Composante', 'المكوّن'), tx('Mois 1', 'الشهر 1'), tx('Mois 13', 'الشهر 13')], DR, ['s', 'e', 'e'], [4, 8, 10]) +
      mP(tx('Ces deux mois sont recalculés ici à la main à partir des symboles ci-dessus puis comparés au flux calculé par le moteur : la coche confirme que les deux concordent.', 'يُعاد هنا حساب هذين الشهرين يدويا انطلاقا من الرموز أعلاه ثم يُقارَن بتدفق المحرك: تؤكد العلامة ✓ تطابقهما.'), 'text-slate-400'), 'text-slate-200', true);
    body += mDet('fin-flows', tx('1. Base commune : les flux de trésorerie', '1. الأساس المشترك: التدفقات النقدية'), b1, 'text-amber-400', true);

    /* 2. VAN */
    const yrFlow = [], yrDisc = [];
    for (let y = 0; y < 5; y++) { let a = 0, b = 0; for (let t = 1 + 12 * y; t <= 12 * (y + 1); t++) { a += flows[t]; b += flows[t] / Math.pow(1 + rm, t); } yrFlow.push(a); yrDisc.push(b); }
    const npvCheck = F0 + sumA(yrDisc);
    let b2 = mP(tx(
      'La VAN mesure la valeur créée, en MRU d’aujourd’hui, une fois chaque flux futur ramené à sa valeur actuelle (un montant reçu plus tard vaut moins). L’actualisation est mensuelle : le taux annuel r = <strong>' + pp(s.discount) + '</strong> est converti en taux mensuel équivalent ' + fi('r<sub>m</sub> = (1 + r)<sup>1/12</sup> − 1 = <strong>' + dec(rm * 100, 4) + ' %</strong>') + '.',
      'تقيس VAN القيمة المُنشأة بأوقية اليوم بعد إرجاع كل تدفق مستقبلي إلى قيمته الحالية (المبلغ المتأخر قيمته أقل). الخصم شهري: يُحوَّل المعدل السنوي r = <strong>' + pp(s.discount) + '</strong> إلى معدل شهري مكافئ ' + fi('r<sub>m</sub> = (1 + r)<sup>1/12</sup> − 1 = <strong>' + dec(rm * 100, 4) + ' %</strong>') + '.'));
    b2 += mF('VAN = Σ<sub>t=0…60</sub> F<sub>t</sub> ÷ (1 + r<sub>m</sub>)<sup>t</sup>');
    const VR = [[esc('t = 0 (' + tx('investissement', 'الاستثمار') + ')'), fx(mNeg(F0, mPlain(F0))), fx(mNeg(F0, mPlain(F0)))]];
    yrFlow.forEach((v, i) => VR.push([esc((lang() === 'ar' ? 'سنة ' : 'An ') + (i + 1) + ' (t = ' + (12 * i + 1) + ' … ' + 12 * (i + 1) + ')'), fx(mNeg(v, mPlain(v))), fx(mNeg(yrDisc[i], mPlain(yrDisc[i])))]));
    VR.push([esc(tx('Total (la VAN = colonne de droite)', 'المجموع (VAN = العمود الأخير)')), fx(mNeg(sumA(flows), mPlain(sumA(flows)))), fx(mNeg(npvCheck, mPlain(npvCheck)))]);
    b2 += mTable([tx('Période', 'الفترة'), tx('Σ flux F', 'Σ التدفقات F'), tx('Σ flux actualisés', 'Σ التدفقات المخصومة')], VR, ['s', 'e', 'e'], [VR.length - 1]);
    b2 += mP(tx('Contrôle : somme recalculée = ' + mru(npvCheck) + ' ; VAN du moteur = ' + mru(r.npv) + ' ', 'تحقق: المجموع المُعاد حسابه ' + fi(mru(npvCheck)) + ' ؛ VAN المحرك ' + fi(mru(r.npv)) + ' ') + okMark(near(npvCheck, r.npv)), 'text-slate-400');
    b2 += mP(r.npv >= 0
      ? tx('<strong>Lecture :</strong> VAN = ' + mru(r.npv) + ' &gt; 0 : au taux d’actualisation de ' + pp(s.discount) + ', le projet récupère l’investissement initial et crée de la valeur. Entre scénarios, on préfère la VAN la plus élevée (graphique de comparaison).', '<strong>القراءة:</strong> ' + fi('VAN = ' + mru(r.npv) + ' &gt; 0') + ': عند معدل خصم ' + pp(s.discount) + ' يسترد المشروع الاستثمار الأولي ويخلق قيمة. وبين السيناريوهات تُفضَّل أعلى VAN (رسم المقارنة).')
      : tx('<strong>Lecture :</strong> VAN = ' + mru(r.npv) + ' &lt; 0 : au taux d’actualisation de ' + pp(s.discount) + ', le projet ne récupère pas l’investissement initial : sous ces hypothèses il détruit de la valeur.', '<strong>القراءة:</strong> ' + fi('VAN = ' + mru(r.npv) + ' &lt; 0') + ': عند معدل خصم ' + pp(s.discount) + ' لا يسترد المشروع الاستثمار الأولي، وبهذه الفرضيات يُتلف قيمة.'), r.npv >= 0 ? 'text-emerald-400' : 'text-red-300');
    body += mDet('fin-van', tx('2. VAN — Valeur Actuelle Nette', '2. VAN — القيمة الحالية الصافية'), b2, 'text-emerald-400', true);

    /* 3. TRI */
    const irrM = r.irr == null ? null : Math.pow(1 + r.irr, 1 / 12) - 1;
    let b3 = mP(tx(
      'Le TRI est le taux d’actualisation qui annule la VAN : c’est le rendement annuel du projet sur ses 60 mois. Il n’existe pas de formule fermée : le moteur le cherche par dichotomie (200 itérations) sur le taux mensuel i<sub>m</sub> entre −99 % et +100 %, puis l’annualise.',
      'معدل العائد الداخلي هو معدل الخصم الذي يجعل VAN صفرا، أي العائد السنوي للمشروع على 60 شهرا. لا توجد صيغة مغلقة له: يبحث عنه المحرك بالتنصيف (200 تكرار) على المعدل الشهري i<sub>m</sub> بين −99% و+100% ثم يحوّله إلى معدل سنوي.'));
    b3 += mF('Σ<sub>t=0…60</sub> F<sub>t</sub> ÷ (1 + i<sub>m</sub>)<sup>t</sup> = 0 &nbsp;⇒&nbsp; TRI = (1 + i<sub>m</sub>)<sup>12</sup> − 1');
    if (irrM == null) {
      b3 += mP(tx('<strong>TRI non calculable :</strong> la VAN ne change pas de signe entre −99 % et +100 % par mois (cas typique : les flux restent tous négatifs ; somme des flux sur 60 mois = ' + mru(sumA(flows)) + ').', '<strong>TRI غير قابل للحساب:</strong> لا تغيّر VAN إشارتها بين −99% و+100% شهريا (حالة نموذجية: تبقى التدفقات كلها سالبة؛ مجموع التدفقات على 60 شهرا = ' + mru(sumA(flows)) + ').'), 'text-red-300');
    } else {
      const chk = flows.reduce((a, cf, t) => a + cf / Math.pow(1 + irrM, t), 0);
      b3 += mTable([tx('Élément', 'العنصر'), tx('Valeur', 'القيمة')], [
        [esc(tx('Taux mensuel i_m trouvé', 'المعدل الشهري i_m المُستخرج')), fx(dec(irrM * 100, 4) + ' % / ' + tx('mois', 'شهر'))],
        [esc(tx('TRI annualisé = (1 + i_m)^12 − 1', 'TRI السنوي = (1 + i_m)^12 − 1')), fx('(1 + ' + dec(irrM, 6) + ')^12 − 1 = <strong>' + dec(r.irr * 100, 2) + ' %</strong>')],
        [esc(tx('Contrôle : VAN recalculée au taux i_m (≈ 0)', 'تحقق: VAN المُعاد حسابها عند المعدل i_m (≈ 0)')), fx(dec(chk, 2) + ' MRU ' + okMark(Math.abs(chk) <= 1))],
        [esc(tx('Taux d’actualisation r du scénario', 'معدل الخصم r للسيناريو')), fx(pp(s.discount))]
      ], ['s', 'e']);
      b3 += mP(r.irr > s.discount / 100
        ? tx('<strong>Lecture :</strong> TRI ' + pp(r.irr * 100) + ' &gt; taux d’actualisation ' + pp(s.discount) + ' : le rendement du projet dépasse le coût d’opportunité du capital — même verdict que la VAN positive.', '<strong>القراءة:</strong> ' + fi('TRI ' + pp(r.irr * 100)) + ' أكبر من معدل الخصم ' + fi(pp(s.discount)) + ': عائد المشروع يفوق تكلفة الفرصة البديلة لرأس المال — وهو الحكم نفسه لـ VAN الموجبة.')
        : tx('<strong>Lecture :</strong> TRI ' + pp(r.irr * 100) + ' ≤ taux d’actualisation ' + pp(s.discount) + ' : le rendement du projet est insuffisant — même verdict que la VAN négative' + (r.irr < 0 ? ' (TRI négatif : le capital investi n’est pas intégralement récupéré en 60 mois).' : '.'), '<strong>القراءة:</strong> ' + fi('TRI ' + pp(r.irr * 100)) + ' لا يتجاوز معدل الخصم ' + fi(pp(s.discount)) + ': عائد المشروع غير كاف — وهو الحكم نفسه لـ VAN السالبة' + (r.irr < 0 ? ' (TRI سالب: لا يُسترد رأس المال المستثمر كاملا خلال 60 شهرا).' : '.')), r.irr > s.discount / 100 ? 'text-emerald-400' : 'text-red-300');
    }
    body += mDet('fin-tri', tx('3. TRI — Taux de Rendement Interne', '3. TRI — معدل العائد الداخلي'), b3, 'text-purple-400', true);

    /* 4. Payback */
    const pb = r.paybackMonths;
    let b4 = mP(tx('Le payback (délai de récupération) est le premier mois t &gt; 0 où le cash-flow <strong>cumulé</strong> devient positif ou nul. Contrairement à la VAN, il n’est pas actualisé.', 'فترة الاسترداد (Payback) هي أول شهر t &gt; 0 يصبح فيه التدفق النقدي <strong>التراكمي</strong> موجبا أو صفرا. وهي، بخلاف VAN، غير مخصومة.'));
    b4 += mF('Payback = min { t &gt; 0 : Σ<sub>k=0…t</sub> F<sub>k</sub> ≥ 0 }');
    b4 += mTable([tx('Mois t', 'الشهر t'), tx('Cash-flow cumulé', 'التدفق النقدي التراكمي')], [0, 12, 24, 36, 48, 60].map((t) => [esc(t === 0 ? 't = 0' : 't = ' + t + ' (' + (lang() === 'ar' ? 'نهاية سنة ' : 'fin An ') + t / 12 + ')'), fx(mNeg(cum[t], mPlain(cum[t])))]), ['s', 'e']);
    b4 += mP(pb != null
      ? tx('<strong>Résultat :</strong> le cumul devient positif au mois <strong>' + pb + '</strong> (= ' + Math.floor(pb / 12) + ' an(s) et ' + (pb % 12) + ' mois).', '<strong>النتيجة:</strong> يصبح التراكمي موجبا في الشهر <strong>' + pb + '</strong> (= ' + Math.floor(pb / 12) + ' سنة و' + (pb % 12) + ' شهرا).')
      : tx('<strong>Résultat :</strong> le cumul reste négatif sur les 60 mois (cumul au mois 60 = ' + mru(cum[60]) + ') : payback déclaré « &gt; 60 mois ».', '<strong>النتيجة:</strong> يبقى التراكمي سالبا طوال 60 شهرا (التراكمي في الشهر 60 = ' + mru(cum[60]) + '): تُعلَن الفترة «&gt; 60 شهرا».'), pb != null ? 'text-slate-300' : 'text-red-300');
    body += mDet('fin-pb', tx('4. Délai de récupération (Payback)', '4. فترة الاسترداد (Payback)'), b4, 'text-amber-400', true);

    /* 5. Besoin de financement */
    let trough = 0, troughT = 0; cum.forEach((v, t) => { if (v < trough) { trough = v; troughT = t; } });
    const netInvest = r.capex - grant;
    let b5 = mP(tx('Le besoin de financement maximal est le creux le plus profond du cash-flow cumulé : la somme que les actionnaires ou bailleurs doivent mobiliser pour que la trésorerie ne devienne jamais négative.', 'أقصى حاجة تمويل هي أعمق نقطة في التدفق النقدي التراكمي: المبلغ الذي يجب أن يوفره المساهمون أو الممولون كي لا تصبح الخزينة سالبة أبدا.'));
    b5 += mF('Besoin = − min<sub>t=0…60</sub> ( Σ<sub>k=0…t</sub> F<sub>k</sub> )');
    b5 += mTable([tx('Élément', 'العنصر'), tx('Valeur', 'القيمة')], [
      [esc(tx('Point bas du cumul (mois ' + troughT + ')', 'أدنى تراكمي (الشهر ' + troughT + ')')), fx(mNeg(trough, mru(trough)))],
      [esc(tx('Besoin de financement maximal', 'أقصى حاجة تمويل')), fx('<strong>' + mru(r.fundingNeed) + '</strong>')],
      [esc(tx('dont investissement net = CAPEX − subvention', 'منها الاستثمار الصافي = CAPEX − المنحة')), fx(mru(r.capex) + ' − ' + mru(grant) + ' = ' + mru(netInvest))],
      [esc(tx('dont besoin supplémentaire (kits achetés avant d’être payés, coûts fixes en montée en charge)', 'منها حاجة إضافية (أنظمة تُشترى قبل تحصيل ثمنها، وتكاليف ثابتة أثناء التوسع)')), fx(mru(r.fundingNeed - netInvest))]
    ], ['s', 'e']);
    body += mDet('fin-need', tx('5. Besoin de financement maximal', '5. أقصى حاجة تمويل'), b5, 'text-cyan-300', true);

    /* 6. Seuil de rentabilité */
    const Rc = r.revenuePerClient, Vc = Rc - r.contributionPerClient;
    let b6 = mP(tx('Le seuil de rentabilité est le nombre de <strong>nouveaux clients par an</strong> dont la contribution, sur toute leur durée de financement, couvre les coûts fixes annuels.', 'عتبة المردودية هي عدد <strong>العملاء الجدد في السنة</strong> الذين تغطي مساهمتهم، على امتداد مدة تمويلهم، التكاليف الثابتة السنوية.'));
    b6 += mF('R<sub>c</sub> = A + M × D × (1 − d)<br>V<sub>c</sub> = K + (I + U) × D + c × R<sub>c</sub><br>Contribution = R<sub>c</sub> − V<sub>c</sub><br>Seuil = ⌈ B × k ÷ Contribution ⌉');
    b6 += mTable([tx('Élément', 'العنصر'), tx('Application numérique', 'التطبيق العددي'), tx('Valeur', 'القيمة')], [
      [esc(tx('Revenu encaissé par client R_c', 'الإيراد المُحصَّل لكل عميل R_c')), fx(mru(U.deposit) + ' + ' + mru(U.instMonthly) + ' × ' + D + ' × (1 − ' + pp(s.defaultRate) + ')'), fx(mru(Rc))],
      [esc(tx('Coûts variables par client V_c', 'التكاليف المتغيرة لكل عميل V_c')), fx(mru(U.acqCost) + ' + (' + mru(U.insMonthly) + ' + ' + mru(U.servMonthly) + ') × ' + D + ' + ' + pp(g.commission_pct) + ' × ' + mru(Rc)), fx(mru(Vc))],
      [esc(tx('Contribution par client', 'المساهمة لكل عميل')), fx(mru(Rc) + ' − ' + mru(Vc)), fx(mNeg(r.contributionPerClient, mru(r.contributionPerClient)))],
      [esc(tx('Coûts fixes annuels', 'التكاليف الثابتة السنوية')), fx(mru(fixedBase) + ' × ' + dec(s.opexMult)), fx(mru(r.fixedAnnual))],
      [esc(tx('Seuil de rentabilité', 'عتبة المردودية')), fx('⌈ ' + mru(r.fixedAnnual) + ' ÷ ' + mru(r.contributionPerClient) + ' ⌉'), fx('<strong>' + (r.breakEvenClients == null ? tx('impossible', 'مستحيل') : nf(r.breakEvenClients) + ' ' + tx('clients / an', 'عميل / سنة')) + '</strong>')],
      [esc(tx('Variante en ajoutant l’amortissement (CAPEX ÷ 5)', 'صيغة بإضافة الاهتلاك (CAPEX ÷ 5)')), fx(r.breakEvenWithCapex == null ? '—' : '⌈ (' + mru(r.fixedAnnual) + ' + ' + mru(r.capex / 5) + ') ÷ ' + mru(r.contributionPerClient) + ' ⌉'), fx(r.breakEvenWithCapex == null ? '—' : nf(r.breakEvenWithCapex) + ' ' + tx('clients / an', 'عميل / سنة'))]
    ], ['s', 's', 'e']);
    b6 += mP(r.breakEvenClients == null
      ? tx('<strong>Lecture :</strong> la contribution par client est négative ou nulle : chaque client coûte plus qu’il ne rapporte, aucun volume ne couvre les coûts fixes. Revoyez le prix, les impayés ou les coûts.', '<strong>القراءة:</strong> مساهمة العميل سالبة أو معدومة: كل عميل يكلّف أكثر مما يدرّ، ولا يغطي أي حجم التكاليف الثابتة. راجعوا السعر أو التعثر أو التكاليف.')
      : tx('<strong>Lecture :</strong> le scénario prévoit ' + mPlain(yr(0).clients) + ' nouveaux clients en année 1 et ' + mPlain(yr(4).clients) + ' en année 5, contre un seuil de ' + nf(r.breakEvenClients) + ' : ' + (yr(0).clients >= r.breakEvenClients ? 'le seuil est dépassé dès l’année 1.' : (yr(4).clients >= r.breakEvenClients ? 'le seuil n’est atteint qu’avec la croissance (année ' + (r.years.findIndex((y) => y.clients >= r.breakEvenClients) + 1) + ').' : 'le seuil n’est jamais atteint sur 5 ans.')),
        '<strong>القراءة:</strong> يتوقع السيناريو ' + mPlain(yr(0).clients) + ' عميلا جديدا في السنة 1 و' + mPlain(yr(4).clients) + ' في السنة 5، مقابل عتبة قدرها ' + nf(r.breakEvenClients) + ': ' + (yr(0).clients >= r.breakEvenClients ? 'العتبة متجاوزة منذ السنة 1.' : (yr(4).clients >= r.breakEvenClients ? 'لا تُبلغ العتبة إلا بفضل النمو (السنة ' + (r.years.findIndex((y) => y.clients >= r.breakEvenClients) + 1) + ').' : 'لا تُبلغ العتبة أبدا خلال 5 سنوات.'))), r.breakEvenClients != null && yr(0).clients >= r.breakEvenClients ? 'text-emerald-400' : 'text-amber-300');
    body += mDet('fin-be', tx('6. Seuil de rentabilité (break-even)', '6. عتبة المردودية (Break-even)'), b6, 'text-blue-400', true);

    /* 7. Indicateurs annuels et cumulés */
    const Y1 = yr(0), cumul = (k) => sumA(r.years.map((y) => y[k]));
    const AR = [
      [tx('Nouveaux clients', 'عملاء جدد'), fx(mPlain(s.clients1) + ' × (1 + ' + pp(s.growth) + ')<sup>y−1</sup>'), fx(mPlain(Y1.clients)), fx(mPlain(cumul('clients')))],
      [tx('Chiffre d’affaires (encaissements)', 'رقم المعاملات (المقبوضات)'), esc(tx('Σ E_t de l’année', 'Σ E_t للسنة')), fx(mPlain(Y1.revenue)), fx(mPlain(cumul('revenue')))],
      [tx('Coûts variables', 'التكاليف المتغيرة'), esc(tx('Σ V_t de l’année', 'Σ V_t للسنة')), fx(mPlain(Y1.variable)), fx(mPlain(cumul('variable')))],
      [tx('Coûts fixes', 'التكاليف الثابتة'), fx(mPlain(fixedBase) + ' × ' + dec(s.opexMult)), fx(mPlain(Y1.fixed)), fx(mPlain(cumul('fixed')))],
      [tx('Coûts totaux', 'إجمالي التكاليف'), esc(tx('variables + fixes', 'متغيرة + ثابتة')), fx(mPlain(Y1.totalCosts)), fx(mPlain(cumul('totalCosts')))],
      [tx('Marge brute', 'الهامش الإجمالي'), esc(tx('CA − coûts variables', 'المعاملات − المتغيرة')) + ' ' + fx('= ' + mPlain(Y1.revenue) + ' − ' + mPlain(Y1.variable)), fx(mNeg(Y1.grossMargin, mPlain(Y1.grossMargin))), fx(mNeg(cumul('grossMargin'), mPlain(cumul('grossMargin'))))],
      [tx('Amortissement', 'الاهتلاك'), fx('CAPEX ÷ 5 = ' + mPlain(r.capex) + ' ÷ 5'), fx(mPlain(Y1.deprec)), fx(mPlain(cumul('deprec')))],
      [tx('Résultat prévisionnel', 'النتيجة التقديرية'), esc(tx('marge brute − fixes − amortissement', 'الهامش − الثابتة − الاهتلاك')) + ' ' + fx('= ' + mPlain(Y1.grossMargin) + ' − ' + mPlain(Y1.fixed) + ' − ' + mPlain(Y1.deprec)), fx(mNeg(Y1.result, mPlain(Y1.result))), fx(mNeg(cumul('result'), mPlain(cumul('result'))))],
      [tx('Cash-flow net', 'التدفق النقدي الصافي'), esc(tx('Σ F_t de l’année (+ F₀ en An 1)', 'Σ F_t للسنة (+ F₀ في السنة 1)')), fx(mNeg(Y1.cash, mPlain(Y1.cash))), fx(mNeg(cumul('cash'), mPlain(cumul('cash'))))]
    ];
    let b7 = mTable([tx('Indicateur', 'المؤشر'), tx('Formule (application : année 1)', 'الصيغة (التطبيق: السنة 1)'), tx('An 1', 'سنة 1'), tx('Cumul 5 ans', 'مجموع 5 سنوات')], AR, ['s', 's', 'e', 'e'], [1, 7, 8]);
    b7 += mP(tx('Revenu moyen par client R_c = ' + mru(Rc) + ' (acompte + mensualités × (1 − impayés), voir bloc 6). Le « résultat » est établi sur base de trésorerie : il compte les encaissements réels, pas les créances, et amortit le CAPEX linéairement sur 5 ans. Les trois scénarios utilisent la même méthode avec leurs propres hypothèses (tableau de comparaison ci-dessus).', 'متوسط الإيراد لكل عميل R_c = ' + mru(Rc) + ' (الدفعة المقدمة + الأقساط × (1 − التعثر)، انظر الكتلة 6). تُحسب «النتيجة» على أساس نقدي: أي المقبوضات الفعلية لا الذمم، ويُهتلك CAPEX خطيا على 5 سنوات. وتعتمد السيناريوهات الثلاثة الطريقة نفسها بفرضياتها الخاصة (جدول المقارنة أعلاه).'), 'text-slate-400');
    body += mDet('fin-annual', tx('7. Résultats annuels : CA, marges, amortissement, résultat, cash-flow', '7. النتائج السنوية: المعاملات، الهوامش، الاهتلاك، النتيجة، التدفق النقدي'), b7, 'text-slate-200', true);

    /* 8. Demande et lecture automatique */
    const dem = E.demandHypothesis(indicators, g), names = ['prudent', 'central', 'dynamique'], pos = names.filter((k) => results[k].npv > 0).length;
    const aff = indicators ? E.affordability(indicators, PI) : null;
    let b8 = '';
    if (dem && indicators) {
      const need = r.totals.clients;
      b8 += mW(esc(tx('Demande = marché adressable × [intention + (peut-être × conversion)]', 'الطلب = السوق المستهدف × [نية الشراء + (ربما × معدل التحويل)]')));
      b8 += mP(tx('Taux de demande = ' + fi(pc(indicators.purchase_intention_rate, 1) + ' + ' + pc(indicators.maybe_rate || 0, 1) + ' × ' + pp(g.maybe_conv) + ' = <strong>' + pc(dem.rate, 1) + '</strong>') + ' ; demande = ' + fi(nf(g.addressable) + ' × ' + pc(dem.rate, 1) + ' ≈ <strong>' + nf(dem.customers) + '</strong>') + ' clients ; le scénario vise ' + nf(need) + ' clients sur 5 ans, soit <strong>' + pc(need / Math.max(1, dem.customers), 0) + '</strong> de cette demande.', 'معدل الطلب ' + fi(pc(indicators.purchase_intention_rate, 1) + ' + ' + pc(indicators.maybe_rate || 0, 1) + ' × ' + pp(g.maybe_conv) + ' = <strong>' + pc(dem.rate, 1) + '</strong>') + ' ؛ الطلب ' + fi(nf(g.addressable) + ' × ' + pc(dem.rate, 1) + ' ≈ <strong>' + nf(dem.customers) + '</strong>') + ' عميلا؛ ويستهدف السيناريو ' + nf(need) + ' عميلا خلال 5 سنوات أي <strong>' + pc(need / Math.max(1, dem.customers), 0) + '</strong> من هذا الطلب.'));
    } else b8 += mP(tx('Pas encore de taux d’intention d’achat issu de l’enquête : la confrontation à la demande n’est pas calculée.', 'لا توجد بعد نسبة نية شراء من الاستبيان: لا تُحسب المقارنة بالطلب.'), 'text-slate-400');
    b8 += mP(tx('<strong>Lecture automatique.</strong> « VAN positive dans k scénario(s) sur 3 » compte les scénarios dont la VAN &gt; 0 : ici k = <strong>' + pos + '</strong> (' + names.map((k) => E.SCENARIO_NAMES[k][lang()] + ' : ' + mru(results[k].npv)).join(' · ') + ').', '<strong>القراءة التلقائية.</strong> عبارة «VAN موجبة في k سيناريو من 3» تحصي السيناريوهات ذات VAN &gt; 0: هنا k = <strong>' + pos + '</strong> (' + names.map((k) => E.SCENARIO_NAMES[k][lang()] + ': ' + mru(results[k].npv)).join(' · ') + ').'));
    b8 += mP(aff
      ? tx('Alerte d’accessibilité : elle s’affiche si la part des répondants dont le budget couvre l’équivalent mensuel du prix assuré du scénario est inférieure à 50 %. Ici : équivalent ' + mru(aff.monthly) + ' → part = <strong>' + pc(aff.share, 0) + '</strong> ' + (aff.share < 0.5 ? '(&lt; 50 % : alerte affichée).' : '(≥ 50 % : pas d’alerte).'), 'تنبيه القدرة على الدفع: يظهر إذا كانت نسبة المجيبين الذين تغطي ميزانيتهم المعادل الشهري للسعر المؤمَّن في السيناريو أقل من 50%. هنا: المعادل ' + mru(aff.monthly) + ' ← النسبة = <strong>' + pc(aff.share, 0) + '</strong> ' + (aff.share < 0.5 ? '(&lt; 50%: التنبيه ظاهر).' : '(≥ 50%: لا تنبيه).'))
      : tx('Alerte d’accessibilité : non évaluée (pas encore de budget mensuel issu de l’enquête).', 'تنبيه القدرة على الدفع: غير مُقيَّم (لا توجد بعد ميزانية شهرية من الاستبيان).'), 'text-slate-300');
    body += mDet('fin-read', tx('8. Demande et lecture automatique des résultats', '8. الطلب والقراءة التلقائية للنتائج'), b8, 'text-cyan-300', true);

    root.innerHTML = mDet('fin', tx('Méthode de calcul de la VAN, du TRI et des autres indicateurs (scénario ' + scName + ')', 'طريقة حساب VAN وTRI وباقي المؤشرات (السيناريو ' + scName + ')'), body, 'text-purple-400');
  }

  /* ---------- Module 5 : comment sont calculés les indicateurs de l'enquête ---------- */
  function renderMarketMethod() {
    const root = $('marketMethodRoot'); if (!root) return;
    const I = indicators; if (!I) { root.innerHTML = ''; return; }
    const D = I.distributions, z = 1.96, cnt = (d, ...v) => (d ? sumA(d.items.filter((i) => v.indexOf(i.value) >= 0).map((i) => i.count)) : 0);
    const cov = Math.round((I.reference_coverage || 0.5) * 100);
    let body = mP(tx(
      'Les indicateurs ci-dessous sont calculés uniquement à partir des réponses enregistrées dans la base (comptes par option). Rien n’est inventé : si une question n’a pas de réponse, l’indicateur est masqué. Ils se mettent à jour à chaque actualisation de l’enquête et à chaque changement de la couverture du prix de référence (module 4).',
      'تُحسب المؤشرات أدناه فقط من الإجابات المسجلة في قاعدة البيانات (عدد الإجابات لكل خيار). لا شيء مُختلَق: إذا لم تكن لسؤال إجابات يُخفى المؤشر. وتتحدّث مع كل تحديث للاستبيان ومع كل تغيير لتغطية السعر المرجعي (الوحدة 4).'));

    // a) Échantillon
    const q = I.sample_quality;
    body += mDet('mk-n', tx('Taille et qualité de l’échantillon', 'حجم العينة وجودتها'), mP(tx(
      'n = nombre de participants ayant terminé le sondage (à défaut, plus grand nombre de réponses à une question). Règle de qualité : n &lt; 30 → insuffisant ; 30 ≤ n &lt; 100 → indicatif ; n ≥ 100 → acceptable. Ici : n = <strong>' + nf(I.market_sample_size) + '</strong> → <strong>' + esc(t().quality[q]) + '</strong>. L’échantillon n’est pas probabiliste : les résultats décrivent les répondants, pas la population.',
      'n = عدد المشاركين الذين أكملوا الاستبيان (وإلا فأكبر عدد إجابات على سؤال). قاعدة الجودة: n &lt; 30 ← غير كاف؛ 30 ≤ n &lt; 100 ← إرشادي؛ n ≥ 100 ← مقبول. هنا: n = <strong>' + nf(I.market_sample_size) + '</strong> ← <strong>' + esc(t().quality[q]) + '</strong>. العينة غير احتمالية: النتائج تصف المجيبين لا السكان.')), 'text-cyan-300', true);

    // b) Proportions et intervalle de Wilson
    const props = [];
    if (D.interest && D.interest.total) {
      props.push([tx('Taux d’intérêt PAYG (oui + peut-être)', 'نسبة الاهتمام بـ PAYG (نعم + ربما)'), cnt(D.interest, 'oui', 'peut_etre'), D.interest.total, I.payg_interest_ci, I.payg_interest_rate]);
      props.push([tx('Intention d’achat (oui ferme)', 'نية الشراء (نعم قاطعة)'), cnt(D.interest, 'oui'), D.interest.total, I.purchase_intention_ci, I.purchase_intention_rate]);
    }
    if (D.insurance && D.insurance.total) props.push([tx('Intérêt micro-assurance (oui + oui si prime faible)', 'الاهتمام بالتأمين الأصغر (نعم + نعم إذا كان القسط منخفضا)'), cnt(D.insurance, 'oui', 'oui_si_prix'), D.insurance.total, I.insurance_interest_ci, I.insurance_interest_rate]);
    if (props.length) {
      const wl = (k, n) => { const p0 = k / n, d0 = 1 + (z * z) / n; return { c: (p0 + (z * z) / (2 * n)) / d0, h: (z * Math.sqrt((p0 * (1 - p0)) / n + (z * z) / (4 * n * n))) / d0 }; };
      const rows = props.map((x) => { const w = wl(x[1], x[2]), ci = x[3]; return [esc(x[0]), fx(nf(x[1]) + ' ÷ ' + nf(x[2])), fx('<strong>' + pc(x[4], 1) + '</strong>'), fx(ci ? pc(ci[0], 1) + ' – ' + pc(ci[1], 1) : '—'), fx(okMark(!!ci && near(Math.max(0, w.c - w.h), ci[0], 1e-9) && near(Math.min(1, w.c + w.h), ci[1], 1e-9)))]; });
      body += mDet('mk-prop', tx('Taux d’intérêt, intention d’achat, micro-assurance et intervalle de confiance', 'نسب الاهتمام ونية الشراء والتأمين الأصغر وفاصل الثقة'),
        mP(tx('Taux = nombre de réponses concernées ÷ nombre de répondants à la question. L’intervalle de confiance à 95 % utilise la méthode de Wilson (adaptée aux petits échantillons) :', 'النسبة = عدد الإجابات المعنية ÷ عدد المجيبين على السؤال. ويستخدم فاصل الثقة 95% طريقة Wilson (المناسبة للعينات الصغيرة):')) +
        mF('p = k ÷ n<br>c = (p + z²÷2n) ÷ (1 + z²÷n)<br>h = z × √( p(1−p)÷n + z²÷4n² ) ÷ (1 + z²÷n)<br>IC = [ c − h ; c + h ] &nbsp; (z = 1,96)') +
        mP(tx('k = nombre de réponses concernées · n = nombre de répondants · c = centre · h = demi-largeur de l’intervalle.', 'k = عدد الإجابات المعنية · n = عدد المجيبين · c = مركز الفاصل · h = نصف عرض الفاصل.'), 'text-slate-400') +
        mTable([tx('Indicateur', 'المؤشر'), 'k ÷ n', tx('Taux p', 'النسبة p'), tx('IC 95 % (Wilson)', 'فاصل الثقة 95% (Wilson)'), tx('Contrôle', 'تحقق')], rows, ['s', 'e', 'e', 'e', 'e']) +
        mP(tx('Plus n est petit, plus l’intervalle est large : c’est pourquoi il est affiché à côté de chaque taux.', 'كلما صغر n اتسع الفاصل: لذلك يُعرض بجانب كل نسبة.'), 'text-slate-400'), 'text-emerald-400', true);
    }

    // c) Montant mensuel : tranches, moyenne, médiane, prix de référence
    const mp = D.monthlyPrice;
    if (mp && mp.total) {
      const N = mp.total, rows = [], rows2 = [], xr = I.reference_monthly_price;
      let accMid = 0, accShare = 0;
      mp.items.forEach((i) => {
        const bd = E.bandRange('monthlyPrice', i.value), open = E.BANDS.monthlyPrice[i.value] && E.BANDS.monthlyPrice[i.value][1] == null;
        if (!bd) return;
        const mid = (bd[0] + bd[1]) / 2; accMid += i.count * mid;
        const fr = xr <= bd[0] ? 1 : xr >= bd[1] ? 0 : (bd[1] - xr) / (bd[1] - bd[0]); accShare += i.count * fr;
        rows.push([esc(lab(i)), fx(mPlain(bd[0])), fx(mPlain(bd[1]) + (open ? ' (×' + E.OPEN_BAND_FACTOR + ')' : '')), fx(nf(i.count)), fx(mPlain(mid)), fx(mPlain(i.count * mid))]);
        rows2.push([esc(lab(i)), fx(dec(fr, 3)), fx(nf(i.count) + ' × ' + dec(fr, 3)), fx(dec(i.count * fr, 2))]);
      });
      rows.push([esc(tx('Total', 'المجموع')), '', '', fx(nf(N)), '', fx(mPlain(accMid))]);
      rows2.push([esc(tx('Total', 'المجموع')), '', '', fx(dec(accShare, 2))]);
      const shareChk = E.shareAtLeast(mp, 'monthlyPrice', xr), sMed = E.shareAtLeast(mp, 'monthlyPrice', I.median_monthly_payment), s75 = E.shareAtLeast(mp, 'monthlyPrice', I.monthly_price_p75);
      let b = mP(tx(
        'La question donne le <strong>budget mensuel maximum</strong> sous forme de tranches. Pour obtenir des montants, on suppose une répartition uniforme à l’intérieur de chaque tranche ; la tranche ouverte « &gt; 8 000 » est bornée à [8 000 ; 8 000 × ' + E.OPEN_BAND_FACTOR + '] (hypothèse).',
        'يعطي السؤال <strong>أقصى ميزانية شهرية</strong> على شكل شرائح. وللحصول على مبالغ نفترض توزيعا منتظما داخل كل شريحة؛ أما الشريحة المفتوحة «&gt; 8 000» فتُحدَّد بـ [8 000 ؛ 8 000 × ' + E.OPEN_BAND_FACTOR + '] (فرضية).'));
      b += mTable([tx('Tranche', 'الشريحة'), tx('Borne basse', 'الحد الأدنى'), tx('Borne haute', 'الحد الأعلى'), tx('Effectif', 'العدد'), tx('Milieu', 'المنتصف'), tx('Effectif × milieu', 'العدد × المنتصف')], rows, ['s', 'e', 'e', 'e', 'e', 'e'], [rows.length - 1]);
      b += mW(esc(tx('Moyenne : ', 'المتوسط: ')) + fx('Σ (n<sub>i</sub> × m<sub>i</sub>) ÷ N = ' + nf(Math.round(accMid)) + ' ÷ ' + nf(N) + ' = ' + nf(Math.round(accMid / N))) + ' ' + okMark(Math.round(accMid / N) === I.average_monthly_payment));
      b += mP(tx('n<sub>i</sub> = effectif de la tranche · m<sub>i</sub> = milieu de la tranche · N = nombre de répondants.', 'n<sub>i</sub> = عدد المجيبين في الشريحة · m<sub>i</sub> = منتصف الشريحة · N = عدد المجيبين.'), 'text-slate-400');
      b += mP(tx(
        '<strong>Médiane et prix de référence.</strong> On définit Part(x) = Σ effectif × f(x) ÷ N, où f(x) = 1 si x ≤ borne basse, 0 si x ≥ borne haute, sinon (borne haute − x) ÷ (borne haute − borne basse). Le montant cherché est le x tel que Part(x) = couverture ; le moteur le trouve par dichotomie (60 itérations) puis l’arrondit à l’unité.',
        '<strong>الوسيط والسعر المرجعي.</strong> نعرّف Part(x) = Σ العدد × f(x) ÷ N حيث f(x) = 1 إذا x ≤ الحد الأدنى، و0 إذا x ≥ الحد الأعلى، وإلا (الحد الأعلى − x) ÷ (الحد الأعلى − الحد الأدنى). المبلغ المطلوب هو x الذي يحقق Part(x) = التغطية؛ يجده المحرك بالتنصيف (60 تكرارا) ثم يقرّبه إلى وحدة.'));
      b += mTable([tx('Indicateur', 'المؤشر'), tx('Couverture visée', 'التغطية المستهدفة'), tx('Montant x trouvé', 'المبلغ x المُستخرج'), tx('Contrôle Part(x)', 'تحقق Part(x)')], [
        [esc(tx('Médiane', 'الوسيط')), fx('50 %'), fx('<strong>' + mru(I.median_monthly_payment) + '</strong>'), fx(pc(sMed, 1))],
        [esc(tx('Prix mensuel de référence (utilisé par les modules 2 et 4)', 'السعر الشهري المرجعي (تستخدمه الوحدتان 2 و4)')), fx(cov + ' %'), fx('<strong>' + mru(xr) + '</strong>'), fx(pc(shareChk, 1))],
        [esc(tx('75 % peuvent payer au moins', '75% يستطيعون دفع هذا المبلغ على الأقل')), fx('75 %'), fx('<strong>' + mru(I.monthly_price_p75) + '</strong>'), fx(pc(s75, 1))]
      ], ['s', 'e', 'e', 'e']);
      b += mDet('mk-ref', tx('Exemple : Part(x) au prix de référence ' + mru(xr), 'مثال: Part(x) عند السعر المرجعي'), mTable([tx('Tranche', 'الشريحة'), 'f(x)', tx('Effectif × f(x)', 'العدد × f(x)'), tx('Contribution', 'المساهمة')], rows2, ['s', 'e', 'e', 'e'], [rows2.length - 1]) +
        mP(fi('Part(x) = ' + dec(accShare, 2) + ' ÷ ' + nf(N) + ' = ' + pc(accShare / N, 1)) + ' ' + okMark(near(accShare / N, shareChk, 1e-9)) + ' — ' + tx('c’est cette même fonction qui sert au test d’accessibilité du module 2.', 'وهذه الدالة نفسها تُستعمل في اختبار القدرة على الدفع في الوحدة 2.'), 'text-slate-400'), 'text-slate-200', true);
      body += mDet('mk-price', tx('Montant mensuel acceptable : moyenne, médiane, prix de référence', 'المبلغ الشهري المقبول: المتوسط والوسيط والسعر المرجعي'), b, 'text-purple-400', true);
    }

    // d) Modes
    const mode = (d, label) => { if (!d || !d.total) return null; const best = d.items.reduce((a, i) => (i.count > (a ? a.count : -1) ? i : a), null); return best ? [esc(label), esc(lab(best)), fx(nf(best.count) + ' ÷ ' + nf(d.total) + ' = ' + pc(best.count / d.total, 1))] : null; };
    const modes = [mode(D.duration, tx('Durée de financement préférée', 'مدة التمويل المفضلة')), mode(D.frequency, tx('Fréquence de paiement préférée', 'وتيرة الدفع المفضلة')), mode(D.profile, tx('Profil le plus représenté', 'الملف الأكثر تمثيلا'))].filter(Boolean);
    if (modes.length) body += mDet('mk-mode', tx('Durée, fréquence et profil les plus fréquents (mode)', 'المدة والوتيرة والملف الأكثر تكرارا (المنوال)'), mP(tx('Le mode est la réponse choisie par le plus grand nombre de répondants (en cas d’égalité, la première option).', 'المنوال هو الإجابة التي اختارها أكبر عدد من المجيبين (وعند التساوي الخيار الأول).')) + mTable([tx('Indicateur', 'المؤشر'), tx('Réponse la plus fréquente', 'الإجابة الأكثر تكرارا'), tx('Effectif ÷ répondants', 'العدد ÷ المجيبين')], modes, ['s', 's', 'e']) + mP(tx('Durée et fréquence préférées sont reprises dans le modèle par le bouton « Appliquer les résultats de l’enquête au modèle ».', 'تُنقل المدة والوتيرة المفضلتان إلى النموذج بزر «تطبيق نتائج الاستبيان على النموذج».'), 'text-slate-400'), 'text-blue-400', true);

    // e) Demande
    const dem = E.demandHypothesis(I, state.g);
    if (dem) body += mDet('mk-dem', tx('Demande plausible issue de l’enquête', 'الطلب المحتمل المستخلص من الاستبيان'), mW(esc(tx('Taux de demande = intention + (peut-être × conversion) ; Demande = marché adressable × taux', 'معدل الطلب = نية الشراء + (ربما × التحويل) ؛ الطلب = السوق المستهدف × المعدل'))) + mP(fi(pc(I.purchase_intention_rate, 1) + ' + ' + pc(I.maybe_rate || 0, 1) + ' × ' + pp(state.g.maybe_conv) + ' = <strong>' + pc(dem.rate, 1) + '</strong>') + ' ; ' + fi(nf(state.g.addressable) + ' × ' + pc(dem.rate, 1) + ' ≈ <strong>' + nf(dem.customers) + '</strong>') + ' ' + tx('clients', 'عميل')) + mP(tx('Le marché adressable et le taux de conversion des « peut-être » sont des hypothèses modifiables (module 4) ; seules les parts « oui » et « peut-être » viennent de l’enquête.', 'السوق المستهدف ومعدل تحويل «ربما» فرضيتان قابلتان للتعديل (الوحدة 4)؛ أما نسبتا «نعم» و«ربما» فمن الاستبيان.'), 'text-slate-400'), 'text-amber-400', true);

    root.innerHTML = mDet('mk', tx('Méthode de calcul des indicateurs de l’enquête (valeurs en direct)', 'طريقة حساب مؤشرات الاستبيان (بالقيم الحالية)'), body, 'text-cyan-300');
  }

  /* ---------- Module 4 : modèle financier ---------- */
  const scField = (key, label, val) => '<label class="block"><span class="block text-[11px] text-slate-300 mb-1">' + esc(label) + '</span><input type="number" step="any" data-sc="' + key + '" value="' + val + '" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"></label>';
  const gField = (key, label, val, type) => '<label class="block"><span class="block text-[11px] text-slate-300 mb-1">' + esc(label) + ' ' + tag(type || 'hypothese', t().hyp) + '</span><input type="number" step="any" data-g="' + key + '" value="' + val + '" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"></label>';

  function renderFinInputs() {
    const root = $('finInputsRoot'); if (!root) return;
    const L = t(), s = state.sc[activeScenario];
    let h = '<div class="flex flex-wrap gap-2 mb-3">';
    ['prudent', 'central', 'dynamique'].forEach((k) => { h += '<button type="button" data-tab="' + k + '" class="px-3 py-1.5 rounded-lg text-xs font-bold border ' + (k === activeScenario ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300') + '">' + esc(E.SCENARIO_NAMES[k][lang()]) + '</button>'; });
    h += '<button type="button" id="btnResetState" class="ms-auto px-3 py-1.5 rounded-lg text-xs border border-slate-700 text-slate-400 hover:text-white">' + esc(L.reset) + '</button></div>';
    h += '<h5 class="text-[11px] font-bold text-amber-400 mb-2">' + esc(L.tabIn) + ' — ' + esc(E.SCENARIO_NAMES[activeScenario][lang()]) + '</h5><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">';
    E.SCENARIO_FIELDS.forEach(([key], i) => { h += scField(key, L.sc[i], s[key]); });
    h += '</div><h5 class="text-[11px] font-bold text-amber-400 mb-2">' + esc(L.varT) + '</h5><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">';
    Object.keys(L.varDrivers).forEach((k) => { h += gField(k, L.varDrivers[k], state.g[k]); });
    h += '</div><div class="grid grid-cols-1 lg:grid-cols-2 gap-5"><div><h5 class="text-[11px] font-bold text-amber-400 mb-2">' + esc(L.capexT) + '</h5><div class="grid grid-cols-1 sm:grid-cols-2 gap-3">';
    E.CAPEX_ITEMS.forEach(([k, fr, ar]) => { h += gField(k, lang() === 'ar' ? ar : fr, state.g[k]); });
    h += '</div></div><div><h5 class="text-[11px] font-bold text-amber-400 mb-2">' + esc(L.fixedT) + '</h5><div class="grid grid-cols-1 sm:grid-cols-2 gap-3">';
    E.FIXED_ITEMS.forEach(([k, fr, ar]) => { h += gField(k, lang() === 'ar' ? ar : fr, state.g[k]); });
    h += '</div></div></div><h5 class="text-[11px] font-bold text-amber-400 mt-5 mb-2">' + esc(L.revT) + '</h5><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">';
    ['kit1_cash', 'kit2_cash', 'kit3_cash'].forEach((k) => { h += gField(k, lang() === 'ar' ? E.GLOBAL_DEFAULTS[k].ar : E.GLOBAL_DEFAULTS[k].fr, state.g[k]); });
    h += '</div><p class="text-[10px] text-slate-500 mt-2">' + esc(lang() === 'ar' ? 'الإيرادات = عدد العملاء × متوسط الإيراد لكل عميل (الدفعة المقدمة + الأقساط × (1 − التعثر)).' : 'Revenus = nombre de clients × revenu moyen par client (acompte + échéances × (1 − impayés)). Le prix de chaque kit alimente le module 2.') + '</p>';
    root.innerHTML = h;
  }

  function renderFinOutputs() {
    const L = t(); recomputeAll();
    const r = results[activeScenario], s = state.sc[activeScenario], P = r.priceInsured;
    const hi = $('headerInsolvencyRate'); if (hi) hi.innerText = nf(state.sc.central.defaultRate, 1) + '%';
    const set = (id, txt, ok) => { const el = $(id); if (!el) return; el.innerText = txt; if (ok != null && id === 'outVAN') el.className = 'text-lg sm:text-xl font-extrabold font-mono ' + (ok ? 'text-emerald-400' : 'text-red-400'); };
    set('outVAN', (r.npv >= 0 ? '+' : '') + nf(r.npv / 1e6, 2) + ' M MRU', r.npv >= 0);
    set('outTRI', r.irr == null ? L.na : nf(r.irr * 100, 1) + ' %');
    set('outPayback', r.paybackMonths == null ? L.over60 : r.paybackMonths + ' ' + L.months);
    set('outBreakEven', r.breakEvenClients == null ? L.na : nf(r.breakEvenClients) + ' ' + L.clientsYr);
    const why = (id, txt) => { const el = $(id); if (el) el.innerText = txt; };
    why('whyVAN', L.why.van.replace('{r}', s.discount).replace('{capex}', mru(r.capex) + (s.grant ? ' − ' + mru(s.grant) : '')));
    why('whyTRI', L.why.tri); why('whyPB', L.why.pb);
    why('whyBE', L.why.be.replace('{fixed}', mru(r.fixedAnnual)).replace('{contrib}', mru(r.contributionPerClient)));

    // Tableaux
    const Y = r.years;
    let h = '<h5 class="text-xs font-bold text-slate-300 mb-2">' + esc(L.yearT) + '</h5><div class="overflow-x-auto"><table class="w-full text-[11px] text-slate-300"><thead><tr class="text-slate-500"><th class="text-start py-1"></th>' + Y.map((y) => '<th class="text-end py-1 px-2">' + (lang() === 'ar' ? 'سنة ' : 'An ') + y.year + '</th>').join('') + '</tr></thead><tbody>';
    const keys = ['clients', 'revenue', 'variable', 'fixed', 'totalCosts', 'grossMargin', 'deprec', 'result', 'cash'];
    keys.forEach((k, i) => { h += '<tr class="border-t border-slate-800 ' + (['revenue', 'result', 'cash'].includes(k) ? 'font-bold text-white' : '') + '"><td class="py-1">' + esc(L.rowsYear[i]) + '</td>' + Y.map((y) => '<td class="text-end px-2 font-mono ' + (y[k] < 0 ? 'text-red-400' : '') + '">' + nf(y[k]) + '</td>').join('') + '</tr>'; });
    h += '</tbody></table></div><p class="text-[10px] text-slate-500 mt-1">MRU — ' + esc(lang() === 'ar' ? 'جميع الأرقام ناتجة عن الفرضيات أعلاه.' : 'tous ces chiffres découlent des hypothèses ci-dessus (aucune n’est une donnée d’enquête, sauf mention contraire).') + '</p>';
    $('finYearTable').innerHTML = h;

    const names = ['prudent', 'central', 'dynamique'];
    let c = '<h5 class="text-xs font-bold text-slate-300 mb-2">' + esc(L.compT) + '</h5><div class="overflow-x-auto"><table class="w-full text-[11px] text-slate-300"><thead><tr class="text-slate-500"><th></th>' + names.map((k) => '<th class="text-end py-1 px-2">' + esc(E.SCENARIO_NAMES[k][lang()]) + '</th>').join('') + '</tr></thead><tbody>';
    const comp = [(x) => nf(x.totals.revenue), (x) => nf(x.totals.costs), (x) => nf(x.totals.grossMargin), (x) => nf(x.totals.result), (x) => nf(x.totals.cash), (x) => nf(x.npv), (x) => (x.irr == null ? '—' : nf(x.irr * 100, 1) + ' %'), (x) => (x.paybackMonths == null ? L.over60 : x.paybackMonths + ' ' + L.months), (x) => nf(x.fundingNeed), (x) => (x.breakEvenClients == null ? '—' : nf(x.breakEvenClients)), (x) => nf(x.priceInsured.total), (x) => nf(x.priceInsured.monthlyEquivalent)];
    L.rowsComp.forEach((lbl, i) => { c += '<tr class="border-t border-slate-800"><td class="py-1">' + esc(lbl) + '</td>' + names.map((k) => '<td class="text-end px-2 font-mono">' + comp[i](results[k]) + '</td>').join('') + '</tr>'; });
    c += '</tbody></table></div>';
    $('finCompTable').innerHTML = c;

    // Demande & lecture
    const dem = E.demandHypothesis(indicators, state.g);
    let d = '<h5 class="text-xs font-bold text-cyan-300 mb-1">' + esc(L.demandT) + '</h5>';
    if (dem) { const need = r.totals.clients; d += '<p class="text-[11px] text-slate-300">' + esc(L.demandTxt.replace('{a}', nf(state.g.addressable)).replace('{r}', pc(dem.rate, 1)).replace('{m}', state.g.maybe_conv).replace('{n}', nf(dem.customers)).replace('{s}', nf(need)).replace('{p}', pc(need / Math.max(1, dem.customers), 0))) + '</p>'; }
    else d += '<p class="text-[11px] text-slate-500">' + esc(L.noDemand) + '</p>';
    $('finDemand').innerHTML = d;

    const pos = names.filter((k) => results[k].npv > 0).length, aff = indicators ? E.affordability(indicators, P) : null;
    let v = '<p class="text-xs text-slate-300">' + esc(r.npv >= 0 ? L.vPos2 : L.vNeg) + ' ' + esc(L.vPos.replace('{k}', pos)) + '</p>';
    if (aff && aff.share < 0.5) v += '<p class="text-xs text-red-300 mt-1">' + esc(L.vAfford.replace('{m}', mru(aff.monthly)).replace('{p}', pc(aff.share, 0))) + '</p>';
    v += '<p class="text-[11px] text-slate-500 mt-1">' + esc(L.vCaveat) + '</p>';
    $('finVerdict').innerHTML = v;

    // Graphique VAN des trois scénarios (valeurs calculées)
    if (typeof vanChartInstance !== 'undefined' && vanChartInstance) {
      vanChartInstance.data.labels = names.map((k) => E.SCENARIO_NAMES[k][lang()]);
      const ds = vanChartInstance.data.datasets[0];
      ds.data = names.map((k) => +(results[k].npv / 1e6).toFixed(2));
      ds.backgroundColor = names.map((k) => (results[k].npv >= 0 ? 'rgba(16,185,129,.7)' : 'rgba(239,68,68,.6)'));
      ds.borderColor = names.map((k) => (results[k].npv >= 0 ? '#10b981' : '#ef4444'));
      vanChartInstance.update();
    }
    renderPricing(); renderAssumptions(); renderMarketDemandOnly();
  }
  // Hook (réservé à l'origine) : sections « Méthode de calcul » du module 4 et du module 5, recalculées à chaque changement
  function renderMarketDemandOnly() { renderFinMethod(); renderMarketMethod(); }

  /* ---------- Hypothèses & export ---------- */
  let asmFilter = 'all';
  function renderAssumptions() {
    const root = $('assumptionsRoot'); if (!root) return;
    const L = t(), reg = E.assumptionRegister(state, indicators, surveyDate());
    const rows = reg.filter((r) => asmFilter === 'all' || r.type === asmFilter);
    let h = '<div class="flex flex-wrap gap-2 mb-3 text-[11px]"><button data-filter="all" class="px-2.5 py-1 rounded border ' + (asmFilter === 'all' ? 'border-amber-500 text-amber-300' : 'border-slate-700 text-slate-400') + '">' + esc(L.filterAll) + '</button>';
    Object.keys(E.TYPE_LABELS).forEach((k) => { h += '<button data-filter="' + k + '" class="px-2.5 py-1 rounded border ' + (asmFilter === k ? 'border-amber-500 text-amber-300' : 'border-slate-700 text-slate-400') + '">' + esc(E.TYPE_LABELS[k][lang()].split(' (')[0]) + '</button>'; });
    h += '</div><div class="overflow-x-auto"><table class="w-full text-[11px] text-slate-300"><thead><tr class="text-slate-500">' + L.asmCols.map((c) => '<th class="py-1 px-2 text-start">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>';
    rows.forEach((r) => { h += '<tr class="border-t border-slate-800"><td class="py-1.5 px-2">' + esc(lang() === 'ar' ? r.ar : r.fr) + '</td><td class="py-1.5 px-2 font-mono text-white">' + esc(typeof r.value === 'number' ? nf(r.value, r.value % 1 ? 1 : 0) : r.value) + '</td><td class="py-1.5 px-2 text-slate-400">' + esc(r.unit) + '</td><td class="py-1.5 px-2 text-slate-400">' + esc(r.source) + '</td><td class="py-1.5 px-2 font-mono text-slate-500">' + esc(r.date) + '</td><td class="py-1.5 px-2">' + badge(r.type) + '</td></tr>'; });
    h += '</tbody></table></div>';
    root.innerHTML = h;
    const pj = $('paramsJson'); if (pj) pj.textContent = JSON.stringify(paramsObject(), null, 2);
  }
  function paramsObject() {
    const I = indicators || {};
    const o = { generated_on: E.MODEL_DATE, source: 'Supabase – public_survey_results (agrégats anonymes)', data_type: 'Donnée réelle de l’enquête / estimation sur tranches',
      market_sample_size: I.market_sample_size == null ? null : I.market_sample_size, payg_interest_rate: I.payg_interest_rate == null ? null : +I.payg_interest_rate.toFixed(4), purchase_intention_rate: I.purchase_intention_rate == null ? null : +I.purchase_intention_rate.toFixed(4),
      median_monthly_payment: I.median_monthly_payment == null ? null : I.median_monthly_payment, average_monthly_payment: I.average_monthly_payment == null ? null : I.average_monthly_payment, reference_monthly_price: I.reference_monthly_price == null ? null : I.reference_monthly_price,
      preferred_financing_duration: I.preferred_financing_duration || null, preferred_payment_frequency: I.preferred_payment_frequency || null, insurance_interest_rate: I.insurance_interest_rate == null ? null : +I.insurance_interest_rate.toFixed(4), target_customer_segment: I.target_customer_segment || null };
    return o;
  }
  function download(name, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  const stamp = () => new Date().toISOString().slice(0, 10);
  function doExport(kind) {
    recomputeAll();
    const sheets = E.buildExport(state, indicators, results, surveyDate());
    if (kind === 'csv') download('etude_faisabilite_payg_' + stamp() + '.csv', new Blob([E.toCSV(sheets)], { type: 'text/csv;charset=utf-8' }));
    else if (kind === 'json') download('parametres_enquete_prototype_' + stamp() + '.json', new Blob([JSON.stringify(paramsObject(), null, 2)], { type: 'application/json' }));
    else if (kind === 'xlsx') {
      const run = () => { const wb = XLSX.utils.book_new(); Object.keys(sheets).forEach((n) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheets[n]), n.slice(0, 31))); XLSX.writeFile(wb, 'etude_faisabilite_payg_' + stamp() + '.xlsx'); };
      if (window.XLSX) run(); else { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'; s.onload = run; s.onerror = () => alert('Excel indisponible hors connexion : utilisez le CSV.'); document.head.appendChild(s); }
    } else if (kind === 'pdf') {
      let h = '<h1 style="font-size:18px;margin:0 0 4px">' + esc(t().printTitle) + '</h1><p style="font-size:11px;margin:0 0 12px">' + esc(E.MODEL_DATE) + ' — ' + esc(lang() === 'ar' ? 'جميع البيانات مصنفة: فعلية / تقدير / فرضية / محاكاة.' : 'chaque donnée est classée : enquête / estimation / hypothèse / simulation.') + '</p>';
      Object.keys(sheets).forEach((n) => { h += '<h2 style="font-size:13px;margin:14px 0 4px">' + esc(n.replace(/_/g, ' ')) + '</h2><table style="border-collapse:collapse;width:100%;font-size:9px">' + sheets[n].map((row, i) => '<tr>' + row.map((c) => '<' + (i ? 'td' : 'th') + ' style="border:1px solid #999;padding:2px 4px;text-align:left">' + esc(c) + '</' + (i ? 'td' : 'th') + '>').join('') + '</tr>').join('') + '</table>'; });
      const pa = $('printArea'); pa.innerHTML = h; window.print();
    }
  }

  /* ---------- Cycle de vie ---------- */
  function renderStatic() {
    const L = t();
    document.querySelectorAll('[data-k2]').forEach((el) => { const k = el.getAttribute('data-k2'); if (L[k] != null && typeof L[k] === 'string') el.textContent = L[k]; });
    const sv = $('scoreVarsBody'); if (sv) sv.innerHTML = L.sv.map((r) => '<tr class="border-t border-slate-800"><td class="py-1.5 px-2 text-slate-200">' + esc(r[0]) + '</td><td class="py-1.5 px-2 text-slate-400">' + esc(r[1]) + '</td></tr>').join('');
  }
  function renderAll() { recomputeAll(); renderStatic(); renderMarket(); renderFinInputs(); renderFinOutputs(); }

  function onSurvey(s) {
    surveyStatus = s.status; surveyMeta = s;
    if (s.status === 'ok' && s.questions.length) {
      indicators = E.computeMarketIndicators(s.questions, s.rows, s.participants, { coverageTarget: state.g.coverage / 100 });
    } else indicators = null;
    renderMarket(); renderFinOutputs();
  }

  function bind() {
    const fin = $('finInputsRoot');
    if (fin) {
      fin.addEventListener('input', (e) => {
        const el = e.target, v = parseFloat(el.value); if (!isFinite(v)) return;
        if (el.dataset.g) { state.g[el.dataset.g] = v; if (el.dataset.g === 'coverage' && indicators) onSurvey(surveyMeta); }
        else if (el.dataset.sc) state.sc[activeScenario][el.dataset.sc] = v;
        save(); renderFinOutputs(); if (indicators) renderMarket();
      });
      fin.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.tab) { activeScenario = b.dataset.tab; renderFinInputs(); renderFinOutputs(); }
        if (b.id === 'btnResetState') { state = E.defaultState(); save(); if (surveyMeta) onSurvey(surveyMeta); renderAll(); }
      });
    }
    const asm = $('assumptionsRoot'); if (asm) asm.addEventListener('click', (e) => { const b = e.target.closest('[data-filter]'); if (b) { asmFilter = b.dataset.filter; renderAssumptions(); } });
    document.querySelectorAll('[data-export]').forEach((b) => b.addEventListener('click', () => doExport(b.dataset.export)));
  }

  window.StudyUI = {
    init() { bind(); renderAll(); },
    onLanguage() { renderAll(); },
    onSurvey, renderPricing, renderFinOutputs,
    onTheme() { renderMarket(); },
    getState: () => state, getIndicators: () => indicators, getResults: () => results
  };
})();

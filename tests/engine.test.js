// TEST SYNTHETIQUE : verifie uniquement les formules (jeu de donnees fictif, jamais affiche dans l application). Lancer : node tests/engine.test.js
const E=require('../engine.js');
// jeu de test SYNTHÉTIQUE (uniquement pour vérifier les formules, jamais affiché dans l'app)
const mk=(id,fr,opts)=>({id,question_fr:fr,question_type:'single_choice',options:opts.map(([v,l],i)=>({id:id+'_'+v,value:v,label_fr:l,label_ar:l}))});
const qs=[mk('q8','Seriez-vous prêt à acquérir un kit solaire en paiement échelonné PAYG ?',[['oui','Oui'],['peut_etre','Peut-être'],['non','Non']]),
 mk('q6','Quel montant mensuel maximum pourriez-vous payer pour un système solaire (assurance comprise) ?',[['lt_1000','a'],['1000_2000','b'],['2000_3500','c'],['3500_5000','d'],['5000_8000','e'],['gt_8000','f']]),
 mk('q11','Quelle durée de financement vous conviendrait le mieux ?',[['12_mois','12 mois'],['24_mois','24 mois']])];
const rows=[];const put=(q,v,c)=>rows.push({question_id:q,option_id:q+'_'+v,response_count:c,option_label_fr:''});
put('q8','oui',20);put('q8','peut_etre',15);put('q8','non',15);
put('q6','lt_1000',5);put('q6','1000_2000',15);put('q6','2000_3500',15);put('q6','3500_5000',10);put('q6','5000_8000',5);
put('q11','12_mois',30);put('q11','24_mois',10);
const ind=E.computeMarketIndicators(qs,rows,50);
console.log(JSON.stringify({n:ind.market_sample_size,pi:ind.payg_interest_rate,int:ind.purchase_intention_rate,med:ind.median_monthly_payment,avg:ind.average_monthly_payment,ref:ind.reference_monthly_price,dur:ind.preferred_financing_months,ci:ind.payg_interest_ci}));
const st=E.defaultState();
const r={};for(const k of ['prudent','central','dynamique']){r[k]=E.runScenario(st.g,st.sc[k]);const x=r[k];
 console.log(k,'total',Math.round(x.priceInsured.total),'chk',Math.round(x.priceInsured.checksum),'mens',Math.round(x.priceInsured.monthlyEquivalent),'VAN',Math.round(x.npv/1e6*100)/100,'TRI',x.irr&&(x.irr*100).toFixed(1),'PB',x.paybackMonths,'BE',x.breakEvenClients,'need',Math.round(x.fundingNeed/1e6),'CA5',Math.round(x.totals.revenue/1e6),'res5',Math.round(x.totals.result/1e6));}
console.log(E.affordability(ind,r.central.priceInsured));
const csv=E.toCSV(E.buildExport(st,ind,r));console.log(csv.length, csv.split('\n').slice(0,6).join('\n'));

// --- TEST SYNTHETIQUE : impôt sur le bénéfice (taux, report des déficits, pas d'impôt en cas de perte) ---
(function () {
  const st = E.defaultState();
  st.g.fx_salaries = 0; st.g.fx_premises = 0; st.g.fx_software = 0; st.g.fx_admin = 0; st.g.fx_comm = 0; st.g.fx_maint = 0; // coûts fixes nuls : le résultat devient positif
  st.g.capex_platform = 100000; st.g.capex_it = 0; st.g.capex_vehicles = 0; st.g.capex_tools = 0; st.g.capex_launch = 0; st.g.capex_stock = 0;
  st.sc.central.clients1 = 20000;
  const r = E.runScenario(st.g, st.sc.central);
  let carry = 0, ok = true;
  r.years.forEach((y) => {
    let base = 0; if (y.result < 0) carry += -y.result; else { const u = Math.min(carry, y.result); carry -= u; base = y.result - u; }
    const exp = base * 0.25;
    if (Math.abs(y.tax - exp) > 1e-6 || Math.abs(y.netResult - (y.result - y.tax)) > 1e-6 || (y.result < 0 && y.tax !== 0)) ok = false;
    console.log('IS an', y.year, 'avant impôt', Math.round(y.result), 'impôt', Math.round(y.tax), 'net', Math.round(y.netResult));
  });
  console.log('Test impôt :', ok ? 'OK' : 'ÉCHEC', '| impôts cumulés', Math.round(r.totals.tax), '= résultat avant impôt − net :', Math.round(r.totals.result - r.totals.netResult));
  if (!ok) process.exitCode = 1;
  // test report des déficits : année 1 perte, année suivante bénéfice partiellement absorbé
  const st2 = E.defaultState(); st2.g.tax_rate = 30;
  const r2 = E.runScenario(st2.g, st2.sc.dynamique);
  console.log('Taux 30 % appliqué, impôt cumulé dynamique =', Math.round(r2.totals.tax));
})();

// --- TEST : nouvelle ouguiya (un zéro retiré) + migration des anciennes valeurs enregistrées + résultats positifs ---
(function () {
  const st = E.defaultState(); let ok = true;
  const capex = E.CAPEX_ITEMS.reduce((a, [k]) => a + st.g[k], 0), fixed = E.FIXED_ITEMS.reduce((a, [k]) => a + st.g[k], 0);
  if (capex !== 1200000 || fixed !== 800000 || st.sc.dynamique.grant !== 600000) ok = false;
  ['prudent', 'central', 'dynamique'].forEach((k) => { const r = E.runScenario(st.g, st.sc[k]); if (!(r.totals.result > 0 && r.totals.netResult > 0)) ok = false; console.log('Résultat 5 ans', k, Math.round(r.totals.result)); });
  // ancien état enregistré (ancienne ouguiya) : converti ; valeur personnalisée : conservée ; idempotent
  const old = E.defaultState(); old.g.capex_platform = 3000000; old.g.fx_salaries = 4800000; old.g.capex_it = 777000; old.sc.dynamique.grant = 6000000;
  E.migrateLegacy(old.g, old.sc); E.migrateLegacy(old.g, old.sc);
  if (old.g.capex_platform !== 300000 || old.g.fx_salaries !== 480000 || old.g.capex_it !== 777000 || old.sc.dynamique.grant !== 600000) ok = false;
  console.log('Test nouvelle ouguiya + migration :', ok ? 'OK' : 'ÉCHEC'); if (!ok) process.exitCode = 1;
})();

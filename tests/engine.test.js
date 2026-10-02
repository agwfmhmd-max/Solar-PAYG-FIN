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

const $=id=>document.getElementById(id),J=p=>fetch(p).then(r=>{if(!r.ok)throw p;return r.json()});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let map;
function route(){const h=(location.hash||'#home').slice(1),id=$(h)?h:'home';
 document.querySelectorAll('.page').forEach(p=>p.classList.toggle('on',p.id===id));
 document.querySelectorAll('nav a').forEach(a=>a.toggleAttribute('aria-current',a.getAttribute('href')==='#'+id)&&a.setAttribute('aria-current','page'));
 $('nav').classList.remove('open');if(id==='report'&&map)setTimeout(()=>map.invalidateSize(),50);window.scrollTo(0,0)}
addEventListener('hashchange',route);$('burger').onclick=()=>{const o=$('nav').classList.toggle('open');$('burger').setAttribute('aria-expanded',o)};
const card=(c,k,v,sub)=>`<div class="card metric ${c}"><p class="k">${k}</p><p class="v">${v}</p><p class="cap" style="margin:0">${sub}</p></div>`;
Promise.all(['summary','quality_report','sources','team'].map(n=>J(`data/${n}.json`)).concat([J('data/candidate_flood_extent.geojson'),J('data/flood_boundary.geojson'),J('data/image_bounds.json')]))
.then(([s,q,src,team,cand,bound,ib])=>{
 const ha=(s.flooded_area_sqkm*100).toFixed(2);
 $('h-event').textContent=s.event_name;$('h-head').textContent=s.headline;
 $('metrics').innerHTML=card('water','Candidate water',`${ha} ha`,`${s.candidate_pixels} px at ${s.pixel_size_m} m`)
  +card('unc','Uncertain / high change',`${s.uncertain_area_sqkm.toFixed(2)} km²`,'Surface change, not confirmed as water')
  +card('plain','Confidence',esc(s.confidence),'Unvalidated, no ground truth')
  +card('plain','Scene pair',`<span class="badge ${s.pair_valid?'pass':'fail'}">${s.pair_valid?'PASS':'FAIL'}</span>`,`${esc(s.track)}, ${esc(s.direction)}`);
 $('r-title').textContent=s.event_name;$('r-conc').textContent=s.conclusion;
 const [a,b]=[s.scene_before.date,s.scene_after.date];$('tg-a').textContent='Before '+a;$('tg-b').textContent='After '+b;
 $('sw-cap').textContent=`${s.satellite}, ${s.polarization} polarisation.`;
 const sw=$('sw-in');sw.oninput=()=>{$('sw-top').style.clipPath=`inset(0 0 0 ${sw.value}%)`;$('sw-bar').style.left=sw.value+'%'};
 $('lims').innerHTML=s.limitations.map(t=>{const i=t.indexOf(': ');return `<details><summary>${esc(t.slice(0,i))}</summary><p>${esc(t.slice(i+2))}</p></details>`}).join('')
  +`<p class="cap" style="margin:12px 0 0">Validation: ${esc(s.validation.note)}</p>`;
 const t=q.thresholds_db;
 $('m-rule').textContent=s.rule_text;
 $('thr').innerHTML=card('plain','Decrease',`${t.decrease} dB`,'Minimum drop, post minus pre')+card('plain','Max post-event',`${t.max_post_water} dB`,'Post-event value must be at or below')+card('unc','High-increase anomaly',`+${t.high_increase_anomaly} dB`,'Held as uncertain');
 $('pair').innerHTML=`<span class="badge ${q.orbital_check==='PASSED'?'pass':'fail'}">${q.orbital_check==='PASSED'?'PASS':'FAIL'}</span> Same track (${esc(s.track)}), same direction (${esc(s.direction)}), same polarisation (${esc(s.polarization)}), same product type.`;
 const rows=[['Minimum mapping unit',q.mmu_threshold_pixels+' px'],['Speckle pixels removed',q.speckle_pixels_filtered.toLocaleString()],['Pixel size',s.pixel_size_m+' m'],['Complex term rejected',q.rejected_complex_terms.join(', ')],['Supervised ML','Bypassed: no independent ground truth'],['Method version',s.method_version]];
 $('qrows').innerHTML=rows.map(r=>`<tr><th>${r[0]}</th><td class="mono">${esc(r[1])}</td></tr>`).join('');
 $('team').innerHTML=team.map(m=>`<div class="card"><h3 style="margin:0">${esc(m.name)}</h3><p class="cap" style="margin:4px 0 0">${esc(m.role)}</p></div>`).join('');
 const lk=(n,u,note)=>`<div class="card" style="margin-bottom:12px"><h3 style="margin:0"><a href="${esc(u)}">${esc(n)}</a></h3><p class="cap" style="margin:4px 0 0">${esc(note||'')}</p></div>`;
 $('src').innerHTML=[...src.data_sources,...src.event_sources].map(x=>lk(x.name,x.url,x.note)).join('')+lk('Repository',src.repo_url,'Source code and processing pipeline');
 $('scenes').innerHTML=[['Before',s.scene_before],['After',s.scene_after]].map(([n,x])=>`<tr><th>${n} · ${x.date}</th><td class="mono" style="word-break:break-all">${esc(x.id)}</td></tr>`).join('');
 $('ack').textContent=src.acknowledgement;
 // map
 map=L.map('map').setView([s.map_center.lat,s.map_center.lon],s.map_center.zoom);
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap contributors'}).addTo(map);
 const change=L.imageOverlay('img/change.png',ib.bounds_latlon,{opacity:.7});
 const perm=L.geoJSON(bound,{filter:f=>f.properties.type!=='candidate_flood',style:{color:'#7E57C2',weight:1.5,fillColor:'#7E57C2',fillOpacity:.55}}).addTo(map);
 const water=L.geoJSON(cand,{style:{color:'#29B6F6',weight:1,fillColor:'#29B6F6',fillOpacity:.55},onEachFeature:(f,l)=>l.bindPopup(`${esc(f.properties.name)}<br>${f.properties.pixel_count} px · ${f.properties.area_m2} m²<br>${esc(f.properties.validation_status)}`)}).addTo(map);
 L.control.layers(null,{'Candidate water':water,'Permanent water':perm,'Backscatter change':change},{collapsed:false}).addTo(map);
 route();
}).catch(e=>{document.querySelector('main').innerHTML=`<div class="wrap" style="padding:48px 24px"><h1>Data failed to load</h1><p>Could not read <span class="mono">${esc(e)}</span>. Open the site through a local server (VS Code Live Server), not by double-clicking index.html.</p></div>`});

(function(){
  const form = document.getElementById('searchForm');
  const resultsEl = document.getElementById('results');
  const recentEl = document.getElementById('recentSearches');
  const clearBtn = document.getElementById('clearBtn');
  const themeToggle = document.getElementById('themeToggle');
  const chips = document.querySelectorAll('.chip');
  const PAGE_SIZE = 5;

  const sampleJobs = Array.from({length:30}).map((_,i)=>({
    id:i+1,
    title:["Desenvolvedor Front-end","Analista de QA","Designer UI","Engenheiro de Dados","Product Manager"][i%5] + (i>4?` ${i}`:''),
    company:["ACME","BetaTech","Gamma Labs","Delta Corp","Starto"][i%5],
    location: i%3===0? 'Remoto': (i%3===1? 'São Paulo':'Rio de Janeiro'),
    level: ['Júnior','Pleno','Sênior'][i%3],
    posted: `${(i%10)+1} dias atrás`
  }));

  let state = {query:'',location:'',page:1, results:[]};

  const userTheme = localStorage.getItem('job_theme') || 'light';
  if(userTheme==='dark') document.documentElement.setAttribute('data-theme','dark');
  updateThemeIcon();
  themeToggle.addEventListener('click',()=>{
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if(cur==='dark') document.documentElement.setAttribute('data-theme','dark'); else document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('job_theme',cur);
    updateThemeIcon();
  });
  function updateThemeIcon(){ themeToggle.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'; }

  const recent = JSON.parse(localStorage.getItem('job_recent')||'[]');
  renderRecent();

  chips.forEach(ch=>ch.addEventListener('click',()=>{
    const f = ch.dataset.filter;
    document.getElementById('query').value = f==='remoto'? 'Remoto' : f;
    form.dispatchEvent(new Event('submit'));
  }));

  form.addEventListener('submit',e=>{
    e.preventDefault();
    state.query = document.getElementById('query').value.trim();
    state.location = document.getElementById('location').value.trim();
    state.page = 1;
    performSearch();
    saveRecent(state.query, state.location);
  });

  clearBtn.addEventListener('click',()=>{
    document.getElementById('query').value='';
    document.getElementById('location').value='';
    state.query='';state.location='';state.page=1;performSearch();
  });

  function performSearch(){
    const q = state.query.toLowerCase();
    const loc = state.location.toLowerCase();
    let filtered = sampleJobs.filter(j=>{
      const matchQ = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
      const matchLoc = !loc || j.location.toLowerCase().includes(loc) || j.level.toLowerCase().includes(loc);
      return matchQ && matchLoc;
    });
    state.results = filtered;
    renderResults();
  }

  function renderResults(){
    resultsEl.innerHTML = '';
    const start = (state.page-1)*PAGE_SIZE;
    const pageItems = state.results.slice(start, start+PAGE_SIZE);

    if(state.results.length===0){
      resultsEl.innerHTML = `<div class="search-card"><p class="search-info">Nenhuma vaga encontrada — tente outra busca ou limpe os filtros.</p></div>`;
      renderPagination();
      return;
    }

    pageItems.forEach(j=>{
      const card = document.createElement('article');
      card.className = 'job-card';
      card.innerHTML = `
        <div class="job-left">
          <h3 class="job-title">${escapeHtml(j.title)}</h3>
          <div class="job-meta">${j.company} • ${j.location} • ${j.level} — ${j.posted}</div>
        </div>
        <div class="job-actions">
          <button class="btn" data-id="${j.id}">Ver detalhes</button>
          <button class="btn primary" data-id="${j.id}">Candidatar</button>
        </div>
      `;
      resultsEl.appendChild(card);
    });
    renderPagination();
  }

  function renderPagination(){
    const total = state.results.length;
    const pages = Math.ceil(total/PAGE_SIZE) || 1;
    const pager = document.getElementById('pagination');
    pager.innerHTML = '';
    for(let p=1;p<=pages;p++){
      const btn = document.createElement('button');
      btn.className = 'btn';
      if(p===state.page) btn.style.fontWeight='700';
      btn.textContent = p;
      btn.addEventListener('click',()=>{ state.page=p; renderResults(); window.scrollTo({top:0,behavior:'smooth'})});
      pager.appendChild(btn);
    }
  }

  function saveRecent(q,loc){
    const key = `${q} | ${loc}`.trim();
    if(!key) return;
    const arr = JSON.parse(localStorage.getItem('job_recent')||'[]');
    const exist = arr.find(x=>x===key);
    if(exist){
      const idx = arr.indexOf(exist); arr.splice(idx,1);
    }
    arr.unshift(key);
    if(arr.length>6) arr.pop();
    localStorage.setItem('job_recent', JSON.stringify(arr));
    renderRecent();
  }

  function renderRecent(){
    const arr = JSON.parse(localStorage.getItem('job_recent')||'[]');
    if(arr.length===0){ recentEl.innerHTML = '<small>Nenhuma busca recente.</small>'; return; }
    recentEl.innerHTML = '<strong>Buscas recentes:</strong><div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">'+ arr.map(r=>`<button class="chip recent-item">${escapeHtml(r)}</button>`).join('') +'</div>';
    document.querySelectorAll('.recent-item').forEach(btn=>btn.addEventListener('click',()=>{
      const [q,loc] = btn.textContent.split('|').map(s=>s.trim());
      document.getElementById('query').value = q || '';
      document.getElementById('location').value = loc || '';
      form.dispatchEvent(new Event('submit'));
    }));
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>\\u2018\\u2019\\u201C\\u201D\\\"]/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\\u2018':'&#8217;','\\u2019':'&#8217;','\\u201C':'&quot;','\\u201D':'&quot;'}[c] || c;
    });
  }

  performSearch();
})();

window.addEventListener('DOMContentLoaded', () => {
// ─── MENU LATERAL ───────────────────────────────────────────────────────────
const menuBtn   = document.getElementById('menuToggle');
const sideMenu  = document.getElementById('sideMenu');

// Abre/fecha menu lateral (mobile)
menuBtn.addEventListener('click', () => {
  sideMenu.classList.toggle('active');
});

// Mapa das seções
const sectionMap = {
  explorador:  'explorerSection',
  comparador:  'hexSection',
  timeline:    'timelineSection',
  conexoes:    'connectionsSection',
  process:     'processSection',
  pdf:         'pdfSection'
};

// ─── TELA DE BOAS-VINDAS ────────────────────────────────────────────────────
const startBtn = document.getElementById('startAppBtn'); // botão da tela de boas-vindas

// Oculta menu lateral e todas as seções no início
sideMenu.style.display = 'none';
Object.values(sectionMap).forEach(sectionId => {
  document.getElementById(sectionId).style.display = 'none';
});

// Quando clicar em "Iniciar"
startBtn.addEventListener('click', () => {
  // Esconde tela de boas-vindas
  document.getElementById('welcomeScreen').style.display = 'none';

  // Mostra menu lateral
  sideMenu.style.display = 'block';

  // Ativa a primeira seção (explorador)
  document.querySelector(`#sideMenu li[data-section="explorador"]`).click();
});

// ─── NAVEGAÇÃO ENTRE SEÇÕES ────────────────────────────────────────────────
document.querySelectorAll('#sideMenu li').forEach(li => {
  li.addEventListener('click', () => {
    // 1) marca o menu ativo
    document.querySelectorAll('#sideMenu li')
      .forEach(x => x.classList.remove('active'));
    li.classList.add('active');

    // 2) mostra só a seção correspondente
    Object.entries(sectionMap).forEach(([key, sectionId]) => {
      document.getElementById(sectionId).style.display =
        li.dataset.section === key ? 'flex' : 'none';
    });

    // 3) fecha o menu (mobile)
    sideMenu.classList.remove('active');
  });
});


  // ─── SPINNER ─────────────────────────────────────────────────────────────────
  const loadingEl = document.getElementById('loading')

  // ─── EXPLORADOR DE METADADOS ─────────────────────────────────────────────────
  const treeEl         = document.getElementById('tree')
  const backBtn        = document.getElementById('backBtn')
  const selectFolderBtn= document.getElementById('selectFolderBtn')
  const metadataEl     = document.getElementById('metadata')
  const attachBtn      = document.getElementById('attachBtn')
  const clearBtn       = document.getElementById('clearBtn')
  const exportBtn      = document.getElementById('exportBtn')
  const attachedMetaEl = document.getElementById('attachedMetadata')

  let historyStack   = []
  let currentPath    = null
  let currentMeta    = null
  let selectedList   = []
  let selectedLi     = null

  function formatMeta(m) {
    const labels = {
      name:'Nome', path:'Caminho', size:'Tamanho', blocks:'Blocos',
      blksize:'Tamanho do bloco', createdAt:'Criado em',
      modifiedAt:'Modificado em', accessedAt:'Último acesso',
      changedAt:'Alterado em', isDirectory:'É pasta?',
      mode:'Permissões', uid:'UID', gid:'GID',
      owner:'Usuário', group:'Grupo', mimeType:'Tipo MIME',
      md5:'MD5', sha256:'SHA-256'
    }
    let txt = ''
    Object.entries(m).forEach(([k,v]) => {
      if (v instanceof Date) v = v.toLocaleString('pt-BR')
      else if (typeof v === 'boolean') v = v ? 'Sim' : 'Não'
      else if (v == null) v = 'N/D'
      txt += `${labels[k]||k}: ${v}\n`
    })
    return txt
  }

  function updateAttachedMeta() {
    attachedMetaEl.innerHTML = ''
    selectedList.forEach((m,i) => {
      const div = document.createElement('div')
      const pre = document.createElement('pre')
      pre.textContent = formatMeta(m)
      const btn = document.createElement('button')
      btn.textContent = '🚫 Remover'
      btn.onclick = () => { selectedList.splice(i,1); updateAttachedMeta() }
      div.append(pre, btn)
      attachedMetaEl.appendChild(div)
    })
  }

  function renderTree(dir, container) {
    loadingEl.style.display = 'flex'
    window.electronAPI.listDir(dir).then(items => {
      const ul = document.createElement('ul')
      ul.classList.add('tree-list')
      items.forEach(item => {
        const li = document.createElement('li')
        li.textContent = `${item.isDirectory?'📁':'📄'} ${item.name}`
        li.classList.add('tree-item')
        li.onclick = e => {
          e.stopPropagation()
          // destaques
          if (selectedLi) selectedLi.classList.remove('selected')
          selectedLi = li
          li.classList.add('selected')

          if (item.isDirectory) {
            const child = li.querySelector('ul')
            if (child) li.removeChild(child)
            else {
              historyStack.push(currentPath)
              currentPath = item.path
              renderTree(item.path, li)
              backBtn.disabled = false
            }
          } else {
            window.electronAPI.getMetadata(item.path).then(m => {
              currentMeta = m
              metadataEl.textContent = formatMeta(m)
            })
          }
        }
        ul.appendChild(li)
      })
      container.append(ul)
      setTimeout(() => loadingEl.style.display = 'none', 200)
    })
  }

  selectFolderBtn.onclick = async () => {
    const dir = await window.electronAPI.selectFolder()
    if (!dir) return
    treeEl.innerHTML = ''
    metadataEl.textContent = ''
    historyStack = []
    currentPath = dir
    currentMeta = null
    selectedList = []
    updateAttachedMeta()
    renderTree(dir, treeEl)
    backBtn.disabled = true
  }

  backBtn.onclick = () => {
    if (!historyStack.length) return
    currentPath = historyStack.pop()
    treeEl.innerHTML = ''
    metadataEl.textContent = ''
    renderTree(currentPath, treeEl)
    backBtn.disabled = historyStack.length===0
  }

  attachBtn.onclick = () => {
    if (!currentMeta) return alert('Selecione um arquivo primeiro.')
    if (!selectedList.find(x=>x.path===currentMeta.path)) {
      selectedList.push(currentMeta)
      updateAttachedMeta()
    }
  }

  clearBtn.onclick = () => {
    selectedList = []
    updateAttachedMeta()
  }

  exportBtn.onclick = () => {
    if (!selectedList.length) return alert('Nenhum metadado anexado.')
    window.electronAPI.exportPDF(selectedList)
      .then(p => alert('PDF salvo em: ' + p))
  }


  // ─── VISUALIZADOR HEXADECIMAL ────────────────────────────────────────────────
  const hexTreeView  = document.getElementById('hexTreeView')
  const backHexBtn   = document.getElementById('backHexBtn')
  const selectHexBtn = document.getElementById('selectFolderHexBtn')
  const hexBox       = document.getElementById('hexBox')
  const attachHexBtn = document.getElementById('attachHexBtn')
  const clearHexBtn  = document.getElementById('clearHexBtn')
  const exportHexBtn = document.getElementById('exportHexBtn')
  const attachedHex  = document.getElementById('attachedHex')

  let hexHistory       = []
  let hexCurrent       = null
  let selectedHexLi    = null
  let selectedHexDumps = []
  let currentHex       = { name:null, content:null }

  function updateAttachedHexDisplay() {
    attachedHex.innerHTML = ''
    selectedHexDumps.forEach((d,i) => {
      const div = document.createElement('div')
      const pre = document.createElement('pre')
      pre.textContent = `📄 ${d.name}\n${d.content}`
      const btn = document.createElement('button')
      btn.textContent = '🚫 Remover'
      btn.onclick = () => { selectedHexDumps.splice(i,1); updateAttachedHexDisplay() }
      div.append(pre, btn)
      attachedHex.appendChild(div)
    })
  }

  function renderHexTree(dir, container) {
    loadingEl.style.display = 'flex'
    window.electronAPI.listDir(dir).then(items => {
      const ul = document.createElement('ul')
      ul.classList.add('tree-list')
      items.forEach(item => {
        const li = document.createElement('li')
        li.textContent = `${item.isDirectory?'📁':'📄'} ${item.name}`
        li.classList.add('tree-item')
        li.onclick = e => {
          e.stopPropagation()
          // destaque visual
          if (selectedHexLi) selectedHexLi.classList.remove('selected')
          selectedHexLi = li
          li.classList.add('selected')

          if (item.isDirectory) {
            const child = li.querySelector('ul')
            if (child) li.removeChild(child)
            else {
              hexHistory.push(hexCurrent)
              renderHexTree(item.path, li)
              backHexBtn.disabled = false
            }
            hexCurrent = item.path
          } else {
            window.electronAPI.readHex(item.path).then(dump => {
              hexBox.textContent = dump || 'Arquivo vazio.'
              currentHex = { name:item.name, content:dump }
            })
          }
        }
        ul.appendChild(li)
      })
      container.appendChild(ul)
      setTimeout(() => loadingEl.style.display = 'none', 200)
    })
  }

  selectHexBtn.onclick = async () => {
    const dir = await window.electronAPI.selectFolder()
    if (!dir) return
    hexTreeView.innerHTML = ''
    hexHistory = []
    hexCurrent = dir
    selectedHexDumps = []
    currentHex = { name:null, content:null }
    updateAttachedHexDisplay()
    renderHexTree(dir, hexTreeView)
    backHexBtn.disabled = true
  }

  backHexBtn.onclick = () => {
    if (!hexHistory.length) return
    hexCurrent = hexHistory.pop()
    hexTreeView.innerHTML = ''
    renderHexTree(hexCurrent, hexTreeView)
    backHexBtn.disabled = hexHistory.length===0
  }

  attachHexBtn.onclick = () => {
    if (!currentHex.content) return alert('Nenhum dump carregado.')
    if (!selectedHexDumps.find(x=>x.name===currentHex.name)) {
      selectedHexDumps.push({...currentHex})
      updateAttachedHexDisplay()
    }
  }

  clearHexBtn.onclick = () => {
    selectedHexDumps = []
    updateAttachedHexDisplay()
  }

  exportHexBtn.onclick = () => {
    if (!selectedHexDumps.length) return alert('Nenhum dump anexado.')
    window.electronAPI.exportHexPDF(selectedHexDumps)
      .then(p => alert('PDF salvo em: ' + p))
  }




 // ─── LINHA DO TEMPO DE ACESSOS ────────────────────────────────────────────────

   // ─── VARIÁVEIS E ELEMENTOS DE TIMELINE ────────────────────────────────────
  const selectTLBtn = document.getElementById('selectFolderTimelineBtn');
  const backTLBtn   = document.getElementById('backTimelineBtn');
  const fileListTL  = document.getElementById('timelineFileList');
  const canvasTL    = document.getElementById('timelineCanvas');
  const ctxTL       = canvasTL.getContext('2d');
  let timelineChart = null;
  let tlHistory     = [];
  let tlCurrent     = null;


// função recursiva para renderizar árvore de pastas/arquivos


 // ─── FUNÇÃO PARA MONTAR ÁRVORE DE TIMELINE ────────────────────────────────
  function renderTLTree(dir, container) {
  container.innerHTML = '';
  window.electronAPI.listDir(dir).then(async items => {
    const ul = document.createElement('ul');
    ul.classList.add('tree-list');

    // AQUI: ao entrar numa pasta, já puxamos e mostramos o gráfico dela
    // ––> antes de construir a árvore
    loadingEl.style.display = 'flex';
    const allStats = await window.electronAPI.getTimeline(dir);
    loadingEl.style.display = 'none';
    renderTimelineChart(allStats);

    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent  = `${item.isDirectory?'📁':'📄'} ${item.name}`;
      li.classList.add('tree-item');
      li.onclick = async e => {
        e.stopPropagation();
        container.querySelectorAll('.selected')
          .forEach(x => x.classList.remove('selected'));
        li.classList.add('selected');

        if (item.isDirectory) {
          tlHistory.push(tlCurrent);
          tlCurrent = item.path;
          renderTLTree(item.path, li);
          backTLBtn.disabled = false;
        } else {
          // arquivo individual: gráfico só com ele
          loadingEl.style.display = 'flex';
          const stat = await window.electronAPI.getTimeline(item.path);
          loadingEl.style.display = 'none';
          renderTimelineChart(Array.isArray(stat) ? stat : [stat]);
        }
      };
      ul.appendChild(li);
    });

    container.appendChild(ul);
  });
}




  // ─── HANDLER: SELECIONAR PASTA DE TIMELINE ────────────────────────────────
  selectTLBtn.addEventListener('click', async () => {
    const dir = await window.electronAPI.selectFolder();
    if (!dir) return;
    // inicializa estado
    tlHistory = [];
    tlCurrent = dir;
    backTLBtn.disabled = true;
    fileListTL.innerHTML = '';
    // árvore e gráfico de todos os filhos
    renderTLTree(dir, fileListTL);

    loadingEl.style.display = 'flex';
    const allStats = await window.electronAPI.getTimeline(dir);
    loadingEl.style.display = 'none';
    renderTimelineChart(allStats);
  });

  // ─── HANDLER: VOLTAR NA ÁRVORE ────────────────────────────────────────────
  backTLBtn.addEventListener('click', () => {
    if (!tlHistory.length) return;
    tlCurrent = tlHistory.pop();
    renderTLTree(tlCurrent, fileListTL);
    backTLBtn.disabled = tlHistory.length === 0;
  });


function renderTimelineChart(dados) {
    console.log('▶ renderTimelineChart', dados);
    const labels = dados.map(d => d.path.split(/[/\\]/).pop());
    const tipos  = [
      { key:'birthtime', label:'Criado',     color:'#4a90e2' },
      { key:'mtime',     label:'Modificado', color:'#f39c12' },
      { key:'atime',     label:'Acessado',   color:'#27ae60' }
    ];
    const datasets = tipos.map(({key,label,color}) => ({
      label,
      backgroundColor: color,
      pointRadius: 6,
      data: dados.map((item, idx) => ({
        x: new Date(item[key]).getTime(),
        y: idx
      }))
    }));

    if (timelineChart) timelineChart.destroy();
    timelineChart = new Chart(ctxTL, {
      type: 'scatter',
      data: { datasets },
      options: {
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: { unit: 'day' },
            title:{ display:true, text:'Data' }
          },
          y: {
            type: 'category',
            labels,
            title:{ display:true, text:'Arquivo' }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label(ctx) {
                return `${ctx.dataset.label}: `
                  + new Date(ctx.raw.x).toLocaleString();
              }
            }
          },
          legend:{ position:'top' }
        }
      }
    });
  }

  

  // CONEXOES SUPEITAS

// dentro de DOMContentLoaded...



  const connectionsMenuItem   = document.getElementById('connectionsMenuItem');
  const refreshBtn            = document.getElementById('refreshConnectionsBtn');
  const searchInput           = document.getElementById('connSearch');
  const filterRadios          = document.getElementsByName('connFilter');
  const connectionsSection    = document.getElementById('connectionsSection');
  const connList              = document.getElementById('connList');

  let allConnections = [];

  async function loadConnections() {
    connList.innerHTML = '<p>🔄 Carregando conexões…</p>';
    try {
      allConnections = await window.electronAPI.getNetworkConnections();
      renderConnections();
    } catch (err) {
      connList.innerHTML = `<p style="color:red;">Erro: ${err.message}</p>`;
    }
  }

  function renderConnections() {
    // aplica filtro (all / safe / sus)
    const selFilter = [...filterRadios].find(r => r.checked).value;
    let list = allConnections;
    if (selFilter === 'safe') {
      list = list.filter(c => !c.isSuspicious);
    } else if (selFilter === 'sus') {
      list = list.filter(c => c.isSuspicious);
    }

    // aplica busca
    const term = searchInput.value.toLowerCase();
    if (term) {
      list = list.filter(c =>
        `${c.proto} ${c.localAddr} ${c.localPort} ${c.remoteAddr} ${c.remotePort} ${c.pidProg}`
        .toLowerCase().includes(term)
      );
    }

    // renderiza
    if (list.length === 0) {
      connList.innerHTML = '<p>✅ Nenhuma conexão para exibir.</p>';
      return;
    }
    connList.innerHTML = list.map(c => {
      const icon = c.isSuspicious ? '⚠️' : '✅';
      const cls  = c.isSuspicious ? 'conn-item suspicious' : 'conn-item trusted';
      return `
        <div class="${cls}">
          <span class="icon">${icon}</span>
          <div>
            <strong>${c.proto}</strong>
            ${c.localAddr}:${c.localPort} → ${c.remoteAddr}:${c.remotePort}
            (${c.state}) — PID ${c.pidProg}
          </div>
        </div>`;
    }).join('');
  }

  // eventos
  connectionsMenuItem.addEventListener('click', () => {
    document.querySelectorAll('section.container').forEach(s => s.style.display = 'none');
    connectionsSection.style.display = 'flex';
    loadConnections();
  });

  refreshBtn.addEventListener('click', loadConnections);
  backBtn.addEventListener('click', () => {
    connectionsSection.style.display = 'none';
    document.getElementById('timelineSection').style.display = 'flex';
  });

  searchInput.addEventListener('input', renderConnections);
  filterRadios.forEach(r => r.addEventListener('change', renderConnections));







// PROCESSOS




const refreshBtnPRO  = document.getElementById('refreshProcessesBtn')
const procSearch  = document.getElementById('procSearch')
const highMemOnly = document.getElementById('highMemOnly')
const procTable   = document.querySelector('#procTable tbody')



// função de atualizar lista de processos
async function loadProcesses() {
  procTable.innerHTML = '<tr><td colspan="6">⏳ Carregando processos...</td></tr>'
  try {
    const allProcs = await window.electronAPI.listProcesses()
    const kw = procSearch.value.toLowerCase()
    const filtered = allProcs.filter(p => {
      const matchSearch = !kw ||
        p.name.toLowerCase().includes(kw) ||
        p.pid.includes(kw)
      const matchMem = !highMemOnly.checked || p.memMB > 100
      return matchSearch && matchMem
    })

    if (!filtered.length) {
      procTable.innerHTML = '<tr><td colspan="6">Nenhum processo encontrado</td></tr>'
      return
    }

    procTable.innerHTML = ''
    for (const p of filtered) {
      const det = await window.electronAPI.getProcessDetails(p.pid)
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${p.pid}</td>
        <td>${det.name}</td>
        <td>${det.user}</td>
        <td title="${det.path}">${det.path}</td>
        <td>${p.memMB.toFixed(1)}</td>
        <td><button data-pid="${p.pid}" class="kill-btn">🛑</button></td>
      `
      tr.querySelector('.kill-btn').onclick = async () => {
        if (!confirm(`Encerrar ${det.name} [${p.pid}]?`)) return
        const res = await window.electronAPI.killProcess(p.pid)
        alert(res.ok ? '✅ Processo encerrado' : `❌ Erro: ${res.error}`)
        loadProcesses()
      }
      procTable.appendChild(tr)
    }
  } catch (err) {
    procTable.innerHTML = `<tr><td colspan="6">❌ Erro: ${err.message}</td></tr>`
  }
}

// evento do botão e carregamento inicial
refreshBtnPRO.onclick   = loadProcesses
procSearch.oninput   = loadProcesses
highMemOnly.onchange = loadProcesses

// carrega ao entrar na seção pela primeira vez
loadProcesses()






//PDF


 // Elementos do módulo PDF
  const chooseBtn   = document.getElementById('choosePdfBtn')
  const chosenLabel = document.getElementById('chosenPdf')
  const analyzeBtn  = document.getElementById('analyzePdfBtn')
  const resultBody  = document.querySelector('#pdfResult tbody')
  let pdfPath = ''

  chooseBtn.addEventListener('click', async () => {
    const file = await window.electronAPI.selectPdf()
    if (!file) return
    pdfPath = file
    chosenLabel.textContent = file.split(/[/\\]/).pop()
  })

  analyzeBtn.addEventListener('click', async () => {
    if (!pdfPath) return alert('Selecione um PDF primeiro.')
    resultBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; padding:12px;">
          🔄 Analisando ${pdfPath.split(/[/\\]/).pop()}…
        </td>
      </tr>`
    const { title, author, encrypted, issues } = await window.electronAPI.analyzePdf(pdfPath)
    resultBody.innerHTML = `
      <tr>
        <td>${title}</td>
        <td>${author}</td>
        <td>${encrypted ? '🔒 Sim' : '🔓 Não'}</td>
        <td>${issues.length ? issues.join(', ') : '✅ Sem problemas detectados'}</td>
      </tr>`
  })




}); // fim do DOMContentLoaded




const { app, BrowserWindow, ipcMain, dialog, screen, Menu, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const PDFDocument = require('pdfkit')
const mime = require('mime-types')
const os = require('os');
const { spawn } = require('child_process');
const pdfParse= require('pdf-parse'); 

let userid = null
const isWin = process.platform === 'win32'

if (!isWin) {
  try {
    userid = require('userid')
  } catch (e) {
    console.warn('Módulo userid não pôde ser carregado:', e)
  }
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const win = new BrowserWindow({
    width, height,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })
  win.loadFile('index.html')
  Menu.setApplicationMenu(null)
}

app.whenReady().then(createWindow)

ipcMain.handle('list-dir', (_, dirPath) => {
  try {
    return fs.readdirSync(dirPath).map(name => {
      const fullPath = path.join(dirPath, name)
      const stats = fs.statSync(fullPath)
      return { name, path: fullPath, isDirectory: stats.isDirectory() }
    })
  } catch {
    return []
  }
})

ipcMain.handle('get-metadata', (_, filePath) => {
  try {
    const stats = fs.statSync(filePath)
    const isFile = stats.isFile()
    const buffer = isFile ? fs.readFileSync(filePath) : Buffer.alloc(0)
    return {
      name: path.basename(filePath),
      path: filePath,
      size: stats.size,
      blocks: stats.blocks,
      blksize: stats.blksize,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      accessedAt: stats.atime,
      changedAt: stats.ctime,
      isDirectory: stats.isDirectory(),
      mode: stats.mode,
      uid: isWin ? null : stats.uid,
      gid: isWin ? null : stats.gid,
      owner: isWin || !userid ? null : userid.username(stats.uid),
      group: isWin || !userid ? null : userid.groupname(stats.gid),
      mimeType: isFile ? (mime.lookup(filePath) || 'desconhecido') : '',
      md5: isFile ? crypto.createHash('md5').update(buffer).digest('hex') : '',
      sha256: isFile ? crypto.createHash('sha256').update(buffer).digest('hex') : ''
    }
  } catch {
    return {}
  }
})

ipcMain.handle('select-folder', async () => {
  const res = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return res.canceled ? null : res.filePaths[0]
})

ipcMain.handle('select-file', async () => {
  const res = await dialog.showOpenDialog({ properties: ['openFile'] })
  return res.canceled ? null : res.filePaths[0]
})

ipcMain.handle('export-pdf', async (_, metadataList) => {
  if (!Array.isArray(metadataList)) metadataList = [metadataList]
  const doc = new PDFDocument({ margin: 40 })
  const title = metadataList.length === 1 ? metadataList[0].name : 'arquivos-selecionados'
  const output = path.join(app.getPath('desktop'), `${title}-relatorio.pdf`)
  const stream = fs.createWriteStream(output)
  doc.pipe(stream)
  const fontPath = path.join(__dirname, 'Roboto-Regular.ttf')
  if (fs.existsSync(fontPath)) doc.registerFont('Roboto', fontPath).font('Roboto')
  doc.fillColor('#003366').fontSize(22).text('Relatório Forense de Arquivos', { align: 'center', underline: true })
  doc.moveDown(2)

  const labels = {
    name: 'Nome', path: 'Caminho', size: 'Tamanho (bytes)', blocks: 'Blocos',
    blksize: 'Tamanho do bloco', createdAt: 'Criado em', modifiedAt: 'Modificado em',
    accessedAt: 'Último acesso', changedAt: 'Alterado em (metadados)',
    isDirectory: 'É pasta?', mode: 'Permissões (modo)', uid: 'UID', gid: 'GID',
    owner: 'Usuário', group: 'Grupo', mimeType: 'Tipo MIME',
    md5: 'Hash MD5', sha256: 'Hash SHA-256'
  }

  metadataList.forEach((m, i) => {
    doc.fillColor('#222').fontSize(14).text(`Arquivo ${i+1}: ${m.name}`, { underline: true })
    doc.moveDown(0.5)
    Object.entries(m).forEach(([k, v]) => {
      let txt = v
      if (v instanceof Date) txt = v.toLocaleString('pt-BR')
      else if (typeof v === 'boolean') txt = v ? 'Sim' : 'Não'
      else if (v == null) txt = 'N/D'
      doc.fontSize(11).fillColor('#000').text(`${labels[k]||k}: `, { continued: true })
      doc.fillColor('#555').text(txt)
    })
    doc.moveDown(1)
    doc.strokeColor('#999').lineWidth(0.5)
       .moveTo(doc.page.margins.left, doc.y)
       .lineTo(doc.page.width - doc.page.margins.right, doc.y)
       .stroke()
    doc.moveDown(1)
  })

  doc.end()
  return new Promise(res => stream.on('finish', () => { shell.openPath(output); res(output) }))
})

ipcMain.handle('read-hex', async (_, filePath) => {
  try {
    const buf = fs.readFileSync(filePath)
    const lines = []
    for (let i = 0; i < Math.min(buf.length, 512); i += 16) {
      const slice = buf.slice(i, i + 16)
      const hex = slice.toString('hex').match(/.{1,2}/g).join(' ')
      const ascii = slice.toString().replace(/[^\x20-\x7E]/g, '.')
      lines.push(`${i.toString().padStart(4,'0')}: ${hex.padEnd(47)} ${ascii}`)
    }
    return lines.join('\n')
  } catch (err) {
    return `Erro ao ler HEX: ${err.message}`
  }
})

ipcMain.handle('export-hexpdf', async (_, dumps) => {
  const doc = new PDFDocument({ margin: 40 })
  const output = path.join(app.getPath('desktop'), 'relatorio-hexdumps.pdf')
  const stream = fs.createWriteStream(output)
  doc.pipe(stream)

  doc.fontSize(18).fillColor('#003366')
     .text('Relatório de Dumps HEX', { align: 'center', underline: true })
  doc.moveDown()

  dumps.forEach((d, i) => {
    doc.fontSize(14).fillColor('#000')
       .text(`Arquivo ${i+1}: ${d.name}`, { underline: true })
    doc.moveDown(0.5)
    doc.fontSize(9).fillColor('#111').text(d.content || '[vazio]')
    doc.moveDown()
    doc.strokeColor('#aaa').lineWidth(0.5)
       .moveTo(doc.page.margins.left, doc.y)
       .lineTo(doc.page.width - doc.page.margins.right, doc.y)
       .stroke()
    doc.moveDown()
  })

  doc.end()
  return new Promise(res => stream.on('finish', () => { shell.openPath(output); res(output) }))
})



// retorna timestamps de cada arquivo em uma pasta
ipcMain.handle('timeline:get', (_, dirPath) => {
  try {
    const names = fs.readdirSync(dirPath);
    return names.map(name => {
      const full = path.join(dirPath, name);
      const stats = fs.statSync(full);
      return {
        path:      full,
        birthtime: stats.birthtime,
        mtime:     stats.mtime,
        atime:     stats.atime
      };
    });
  } catch {
    return [];
  }
});


// escaner de rede : 


// Handler para coletar conexões de rede




// main.js
ipcMain.handle('network:get-connections', async () => {
  return new Promise((resolve, reject) => {
    const isWin = os.platform() === 'win32';
    const cmd   = isWin ? 'netstat' : 'ss';
    const args  = isWin 
      ? ['-ano'] 
      : ['-tunp'];

    const proc = spawn(cmd, args);
    let raw = '';

    proc.stdout.on('data', chunk => raw += chunk.toString('latin1'));
    proc.on('error', err => reject(err));

    proc.on('close', () => {
      const lines = raw
        .split('\n')
        .filter(l => l.trim() && !l.match(/^(Proto|Netid)\s/));

      const suspiciousPorts = [1337, 31337, 4444, 5555, 8888, 9000, 5985, 3389];

      const results = lines.map(line => {
        try {
          const cols = line.trim().split(/\s+/);
          let proto, state, local, remote, pidProg;

          if (isWin) {
            [proto, local, remote, state, pidProg] = cols;
          } else {
            [proto, state, , , local, remote, pidProg] = cols;
            const m = line.match(/pid=(\d+)/);
            pidProg = m ? m[1] : '';
          }

          // separa addr/port com segurança
          const [localAddr, localPort] =
            typeof local === 'string' && local.includes(':')
              ? local.split(/:(?=[^:]+$)/)
              : [local || 'N/D', null];

          const [remoteAddr, remotePort] =
            typeof remote === 'string' && remote.includes(':')
              ? remote.split(/:(?=[^:]+$)/)
              : [remote || 'N/D', null];

          // heurísticas de suspeita
          const isPublicIP = typeof remoteAddr === 'string' &&
            !/^(\*|0\.0\.0\.0|127\.)/.test(remoteAddr) &&
            !/^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[0-1])/.test(remoteAddr);

          const isSuspPort = suspiciousPorts.includes(parseInt(localPort));
          const isSusp     = isPublicIP || isSuspPort;

      return {
  proto,
  state,
  localAddr,
  localPort,
  remoteAddr,
  remotePort,
  pidProg, 
  isSuspicious: isSusp
};
        } catch (err) {
          console.warn('Erro ao processar linha de conexão:', line, err);
          return null;
        }
      }).filter(Boolean);

      resolve(results);
    });
  });
});






// PROCESSOS

// ---------------------------------------------------
// 1) Listar processos (ps no Linux/macOS, tasklist no Win)
// ---------------------------------------------------







// 3.3 Encerra processo pelo PID
ipcMain.handle('process:kill', async (_, pid) => {
  return new Promise(resolve => {
    exec(`taskkill /PID ${pid} /F`, (err, stdout, stderr) => {
      if (err) return resolve({ ok: false, error: stderr || err.message })
      resolve({ ok: true })
    })
  })
})


const { exec } = require('child_process')

// 🔍 Obter caminho do executável via PID
function getProcessInfo(pid) {
  return new Promise(resolve => {
    exec(`wmic process where ProcessId=${pid} get Name,ExecutablePath /format:list`, (err, stdout) => {
      if (err) return resolve({ name:'N/D', path:'N/D' })
      const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean)
      const name = lines.find(l => l.startsWith('Name='))?.split('=')[1] || 'N/D'
      const path = lines.find(l => l.startsWith('ExecutablePath='))?.split('=')[1] || 'N/D'
      resolve({ name, path })
    })
  })
}


// 🔎 Retorna nome e caminho do executável pelo PID
  
// 3.2 Retorna nome, caminho e usuário pelo PID
ipcMain.handle('process:get-details', async (_, pid) => {
  return new Promise(resolve => {
    let name = 'N/D', path = 'N/D', user = 'N/D'

    // obtém name e ExecutablePath
    exec(`wmic process where ProcessId=${pid} get Name,ExecutablePath /format:list`,
      (err1, out1) => {
        if (!err1 && out1) {
          const lines1 = out1.split('\n').map(l => l.trim()).filter(Boolean)
          name = lines1.find(l => l.startsWith('Name='))?.split('=')[1] || name
          path = lines1.find(l => l.startsWith('ExecutablePath='))?.split('=')[1] || path
        }

        // obtém usuário dono do processo
        exec(`wmic process where ProcessId=${pid} call getowner /format:list`,
          (err2, out2) => {
            if (!err2 && out2) {
              const lines2 = out2.split('\n').map(l => l.trim()).filter(Boolean)
              const u = lines2.find(l => l.startsWith('User='))?.split('=')[1]
              const d = lines2.find(l => l.startsWith('Domain='))?.split('=')[1]
              user = u ? (d ? `${d}\\${u}` : u) : user
            }
            resolve({ name, path, user })
          })
    })
  })
})




// 3.1 Lista processos via tasklist (Windows)
ipcMain.handle('process:list', () => {
  return new Promise(resolve => {
    exec('tasklist /FO CSV /NH', (err, stdout) => {
      if (err || !stdout) return resolve([])
      const procs = stdout
        .trim()
        .split('\n')
        .map(l => {
          const cols = l.split('","').map(p => p.replace(/(^"|"$)/g,''))
          const [name, pid,, , mem] = cols
          return { name, pid, memMB: parseInt(mem.replace(/[^\d]/g,'')) / 1024 }
        })
      resolve(procs)
    })
  })
})


ipcMain.handle('ram:dump', async () => {
  return new Promise(resolve => {
    const outputFile = path.join(app.getPath('desktop'), 'ram_dump.raw')

    // Exemplo com RAMCapture (você precisa ter ramcapture.exe na pasta do app)
    const dumpCmd = `"${__dirname}\\tools\\ramcapture.exe" /output "${outputFile}"`

    exec(dumpCmd, (err, stdout, stderr) => {
      if (err) return resolve({ ok: false, error: stderr || err.message })
      const exists = fs.existsSync(outputFile)
      resolve({ ok: exists, path: exists ? outputFile : null })
    })
  })
})


// PDF




// Handler para abrir seletor de PDF
ipcMain.handle('dialog:select-pdf', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })
  return canceled ? null : filePaths[0]
})

// Handler para análise leve de PDF
ipcMain.handle('pdf:analyze', async (_, filePath) => {
  // 1) Leitura rápida do início do arquivo (até 256 KB)
  const stream = fs.createReadStream(filePath, {
    encoding: 'latin1',
    highWaterMark: 256 * 1024
  })
  let snippet = ''
  for await (const chunk of stream) {
    snippet += chunk
    if (snippet.length >= 256 * 1024) {
      stream.destroy()
      break
    }
  }

  // 2) Detecção de padrões suspeitos
  const issues = []
  if (snippet.includes('/JavaScript') || snippet.includes('/JS')) issues.push('JavaScript Embutido 🚫')
  if (snippet.includes('/OpenAction'))                      issues.push('OpenAction 🚫')
  if (snippet.includes('/Encrypt'))                         issues.push('Arquivo Criptografado 🚫')
  if (snippet.includes('/EmbeddedFile') || snippet.includes('/RichMedia'))
    issues.push('Anexo/RichMedia 🚫')

  // 3) Extração leve de metadados via pdf-parse
  const dataBuffer = fs.readFileSync(filePath)
  const { info }    = await pdfParse(dataBuffer, { max: 1 })

  return {
    title:     info.Title  || '–',
    author:    info.Author || '–',
    encrypted: !!snippet.includes('/Encrypt'),
    issues
  }
})

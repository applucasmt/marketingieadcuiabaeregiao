/* ============================================================
 * PAINEL ADMINISTRATIVO - Marketing IEAD
 * Depende de: config.js
 * ============================================================ */

let estado = {
    config: {},
    arquivos: [],
    categorias: [],
    carrossel: [],
    menus: [],
    arquivoAtual: null
};

// ============================================================
// LOGIN
// ============================================================
function fazerLogin() {
    const senha = document.getElementById('adminPassword').value;
    if (senha === CONFIG.SENHA_ADMIN) {
        sessionStorage.setItem('adminLogged', 'true');
        mostrarCMS();
    } else {
        document.getElementById('loginError').textContent = 'Senha incorreta';
    }
}

function fazerLogout() {
    sessionStorage.removeItem('adminLogged');
    location.reload();
}

function mostrarCMS() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('cmsWrapper').style.display = 'grid';
    carregarTudo();
}

if (sessionStorage.getItem('adminLogged') === 'true') mostrarCMS();

document.getElementById('adminPassword')?.addEventListener('keypress', e => {
    if (e.key === 'Enter') fazerLogin();
});

// ============================================================
// NAVEGAÇÃO ENTRE ABAS
// ============================================================
document.querySelectorAll('.cms-nav a').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const tab = link.dataset.tab;
        document.querySelectorAll('.cms-nav a').forEach(a => a.classList.remove('active'));
        document.querySelectorAll('.cms-section').forEach(s => s.classList.remove('active'));
        link.classList.add('active');
        document.getElementById('tab-' + tab).classList.add('active');
        document.getElementById('pageTitle').textContent = link.textContent.trim();
    });
});

// ============================================================
// CARREGAR TUDO
// ============================================================
async function carregarTudo() {
    const dados = await apiGet('tudo');
    if (!dados) {
        document.getElementById('connectionStatus').textContent = '⚠️ Erro de conexão';
        return;
    }
    estado = { ...estado, ...dados };
    renderizarDashboard();
    renderizarArquivos();
    renderizarCategorias();
    renderizarCarrossel();
    renderizarMenus();
    preencherFormularios();
}

// ============================================================
// DASHBOARD
// ============================================================
function renderizarDashboard() {
    const totalMB = estado.arquivos.reduce((s, a) => s + (parseFloat(a.tamanho) || 0), 0).toFixed(1);
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card"><i class="fas fa-file"></i><h2>${estado.arquivos.length}</h2><p>Arquivos</p></div>
        <div class="stat-card"><i class="fas fa-database"></i><h2>${totalMB} MB</h2><p>Total</p></div>
        <div class="stat-card"><i class="fas fa-folder"></i><h2>${estado.categorias.length}</h2><p>Categorias</p></div>
    `;
    if (estado.config.Pasta_Drive_URL) {
        document.getElementById('linkPastaDrive').href = estado.config.Pasta_Drive_URL;
    }
}

// ============================================================
// ARQUIVOS
// ============================================================
function renderizarArquivos() {
    const container = document.getElementById('arquivosList');
    if (!estado.arquivos.length) {
        container.innerHTML = '<p class="empty">Nenhum arquivo ainda.</p>';
        return;
    }

    container.innerHTML = estado.arquivos.map(a => {
        const ext = (a.tipo || '').toUpperCase();
        const isImg = ['PNG','JPG','JPEG','GIF','WEBP','SVG'].includes(ext);
        const isVid = ['MP4','MOV','AVI','WEBM'].includes(ext);
        const isPdf = ext === 'PDF';

        let preview = '';
        if (isImg && a.preview) preview = `<img src="${a.preview}" class="preview-thumb">`;
        else if (isVid) preview = `<div class="preview-icon video"><i class="fas fa-play-circle"></i></div>`;
        else if (isPdf) preview = `<div class="preview-icon pdf"><i class="fas fa-file-pdf"></i></div>`;
        else preview = `<div class="preview-icon"><i class="fas fa-file"></i></div>`;

        return `
            <div class="arquivo-item">
                <div class="arquivo-preview">${preview}</div>
                <div class="arquivo-info">
                    <h4>${escapeHTML(a.nome)}</h4>
                    <p>${escapeHTML(a.descricao)}</p>
                    <div class="arquivo-meta">
                        <span class="tag">${a.tipo}</span>
                        <span class="tag">${a.categoria}</span>
                        ${a.tamanho ? `<span class="tag">${a.tamanho}</span>` : ''}
                    </div>
                </div>
                <div class="arquivo-actions">
                    <a href="${a.link}" target="_blank" class="btn-icon" title="Baixar"><i class="fas fa-download"></i></a>
                    <button onclick="removerArquivo(${a.id})" class="btn-icon danger"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

async function removerArquivo(id) {
    if (!confirm('Remover este arquivo?')) return;
    const r = await apiPost({ acao: 'remover', id });
    if (r.status === 'ok') carregarTudo();
}

document.getElementById('filtroArquivos')?.addEventListener('input', function() {
    const t = this.value.toLowerCase();
    document.querySelectorAll('.arquivo-item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(t) ? 'flex' : 'none';
    });
});

// ============================================================
// CATEGORIAS
// ============================================================
function renderizarCategorias() {
    const sel = document.getElementById('categoriaUpload');
    if (!sel) return;
    sel.innerHTML = estado.categorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
}

// ============================================================
// UPLOAD
// ============================================================
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

uploadArea?.addEventListener('click', () => fileInput.click());
uploadArea?.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea?.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; selecionarArquivo(e.dataTransfer.files[0]); }
});
fileInput?.addEventListener('change', () => { if (fileInput.files.length) selecionarArquivo(fileInput.files[0]); });

function selecionarArquivo(file) {
    estado.arquivoAtual = file;
    document.getElementById('uploadPreview').style.display = 'block';
    const previewContent = document.getElementById('previewContent');
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
            previewContent.innerHTML = `<img src="${e.target.result}" class="upload-thumb"><p><strong>${file.name}</strong> • ${sizeMB} MB</p>`;
        };
        reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
        previewContent.innerHTML = `<div class="preview-icon video big"><i class="fas fa-play-circle"></i></div><p><strong>${file.name}</strong> • ${sizeMB} MB • Vídeo</p>`;
    } else if (file.type === 'application/pdf') {
        previewContent.innerHTML = `<div class="preview-icon pdf big"><i class="fas fa-file-pdf"></i></div><p><strong>${file.name}</strong> • ${sizeMB} MB</p>`;
    } else {
        previewContent.innerHTML = `<div class="preview-icon big"><i class="fas fa-file"></i></div><p><strong>${file.name}</strong> • ${sizeMB} MB</p>`;
    }

    document.getElementById('nomeAmigavel').value = file.name.replace(/\.[^/.]+$/, '');
}

document.getElementById('uploadBtn')?.addEventListener('click', async () => {
    if (!estado.arquivoAtual) return alert('Selecione um arquivo!');
    
    const status = document.getElementById('uploadStatus');
    const btn = document.getElementById('uploadBtn');
    
    if (estado.arquivoAtual.size > CONFIG.LIMITE_UPLOAD_MB * 1024 * 1024) {
        status.innerHTML = `<p class="error-msg">Arquivo muito grande (máx: ${CONFIG.LIMITE_UPLOAD_MB} MB)</p>`;
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    status.innerHTML = '<p>⏳ Lendo arquivo...</p>';

    try {
        const base64 = await fileToBase64(estado.arquivoAtual);
        status.innerHTML = '<p>⏳ Enviando para o Drive...</p>';

        const result = await apiPost({
            acao: 'upload',
            nomeArquivo: estado.arquivoAtual.name,
            tipoMime: estado.arquivoAtual.type || 'application/octet-stream',
            dadosBase64: base64.split(',')[1],
            descricao: document.getElementById('descricaoUpload').value,
            categoria: document.getElementById('categoriaUpload').value,
            nomeAmigavel: document.getElementById('nomeAmigavel').value
        });

        if (result.status === 'ok') {
            status.innerHTML = `<p style="color:#28A745;">✅ ${result.mensagem}</p>`;
            estado.arquivoAtual = null;
            fileInput.value = '';
            document.getElementById('uploadPreview').style.display = 'none';
            document.getElementById('nomeAmigavel').value = '';
            document.getElementById('descricaoUpload').value = '';
            carregarTudo();
        } else {
            status.innerHTML = `<p class="error-msg">❌ ${result.mensagem}</p>`;
        }
    } catch (err) {
        status.innerHTML = `<p class="error-msg">❌ ${err.message}</p>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-upload"></i> Enviar para o Google Drive';
    }
});

// ============================================================
// CARROSSEL
// ============================================================
function renderizarCarrossel() {
    const c = document.getElementById('carrosselList');
    if (!estado.carrossel.length) {
        c.innerHTML = '<p class="empty">Nenhum slide ainda.</p>';
        return;
    }
    c.innerHTML = estado.carrossel.map(s => `
        <div class="slide-item">
            <div class="slide-info">
                ${s.badge ? `<span class="badge">${escapeHTML(s.badge)}</span>` : ''}
                <h4>${escapeHTML(s.titulo)}</h4>
                <p>${escapeHTML(s.descricao)}</p>
            </div>
            <div class="slide-actions">
                <button onclick='editarSlide(${JSON.stringify(s).replace(/'/g, "&#39;")})' class="btn-icon"><i class="fas fa-edit"></i></button>
                <button onclick="removerSlide(${s.id})" class="btn-icon danger"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function abrirModalSlide(slide = null) {
    document.getElementById('modalBox').innerHTML = `
        <h2>${slide ? 'Editar' : 'Novo'} Slide</h2>
        <div class="form-grid">
            <div class="form-group full"><label>Título</label><input id="slTitulo" value="${slide?.titulo || ''}"></div>
            <div class="form-group full"><label>Descrição</label><textarea id="slDescricao">${slide?.descricao || ''}</textarea></div>
            <div class="form-group"><label>Badge</label><input id="slBadge" value="${slide?.badge || ''}"></div>
            <div class="form-group"><label>Texto Botão</label><input id="slBotao" value="${slide?.textoBotao || ''}"></div>
            <div class="form-group full"><label>Link</label><input id="slLink" value="${slide?.link || '#downloads'}"></div>
            <div class="form-group"><label>Ordem</label><input type="number" id="slOrdem" value="${slide?.ordem || 1}"></div>
        </div>
        <div class="modal-actions">
            <button onclick="fecharModal()" class="btn-secondary">Cancelar</button>
            <button onclick="salvarSlide(${slide?.id || 'null'})" class="btn-primary">Salvar</button>
        </div>
    `;
    document.getElementById('modalOverlay').style.display = 'flex';
}

async function salvarSlide(id) {
    const dados = {
        titulo: document.getElementById('slTitulo').value,
        descricao: document.getElementById('slDescricao').value,
        badge: document.getElementById('slBadge').value,
        textoBotao: document.getElementById('slBotao').value,
        link: document.getElementById('slLink').value,
        ordem: parseInt(document.getElementById('slOrdem').value) || 1
    };
    await apiPost({ acao: 'carrossel_salvar', dados, id });
    fecharModal();
    carregarTudo();
}

async function removerSlide(id) {
    if (!confirm('Remover este slide?')) return;
    await apiPost({ acao: 'carrossel_remover', id });
    carregarTudo();
}

function editarSlide(s) { abrirModalSlide(s); }

// ============================================================
// MENUS / ABAS
// ============================================================
function renderizarMenus() {
    const c = document.getElementById('menusList');
    if (!estado.menus.length) {
        c.innerHTML = '<p class="empty">Nenhum menu ainda.</p>';
        return;
    }
    c.innerHTML = estado.menus.map(m => `
        <div class="menu-item">
            <div class="menu-info">
                <h4>${escapeHTML(m.nome)}</h4>
                <p>${escapeHTML(m.link)} ${m.novaAba ? '• nova aba' : ''}</p>
            </div>
            <div class="menu-actions">
                <button onclick='editarMenu(${JSON.stringify(m).replace(/'/g, "&#39;")})' class="btn-icon"><i class="fas fa-edit"></i></button>
                <button onclick="removerMenu(${m.id})" class="btn-icon danger"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function abrirModalMenu(menu = null) {
    document.getElementById('modalBox').innerHTML = `
        <h2>${menu ? 'Editar' : 'Nova'} Aba / Menu</h2>
        <div class="form-grid">
            <div class="form-group full"><label>Nome do Menu</label><input id="mnNome" value="${menu?.nome || ''}" placeholder="Ex: Downloads"></div>
            <div class="form-group full"><label>Link</label><input id="mnLink" value="${menu?.link || ''}" placeholder="#downloads ou https://..."></div>
            <div class="form-group"><label>Ordem</label><input type="number" id="mnOrdem" value="${menu?.ordem || 1}"></div>
            <div class="form-group"><label><input type="checkbox" id="mnNovaAba" ${menu?.novaAba ? 'checked' : ''}> Abrir em nova aba</label></div>
        </div>
        <div class="modal-actions">
            <button onclick="fecharModal()" class="btn-secondary">Cancelar</button>
            <button onclick="salvarMenu(${menu?.id || 'null'})" class="btn-primary">Salvar</button>
        </div>
    `;
    document.getElementById('modalOverlay').style.display = 'flex';
}

async function salvarMenu(id) {
    const dados = {
        nome: document.getElementById('mnNome').value,
        link: document.getElementById('mnLink').value,
        ordem: parseInt(document.getElementById('mnOrdem').value) || 1,
        novaAba: document.getElementById('mnNovaAba').checked
    };
    await apiPost({ acao: 'menu_salvar', dados, id });
    fecharModal();
    carregarTudo();
}

async function removerMenu(id) {
    if (!confirm('Remover este menu?')) return;
    await apiPost({ acao: 'menu_remover', id });
    carregarTudo();
}

function editarMenu(m) { abrirModalMenu(m); }

// ============================================================
// APARÊNCIA (LOGO E CORES)
// ============================================================
document.getElementById('logoInput')?.addEventListener('change', async function() {
    if (!this.files.length) return;
    const file = this.files[0];
    const base64 = await fileToBase64(file);
    
    const result = await apiPost({
        acao: 'upload_logo',
        nomeArquivo: file.name,
        tipoMime: file.type,
        dadosBase64: base64.split(',')[1]
    });
    
    if (result.status === 'ok') {
        document.getElementById('logoPreview').innerHTML = `<img src="${result.url}">`;
        alert('✅ Logo atualizada!');
        carregarTudo();
    }
});

async function salvarCores() {
    await apiPost({
        acao: 'atualizar_config',
        dados: {
            Cor_Primaria: document.getElementById('corPrimaria').value,
            Cor_Secundaria: document.getElementById('corSecundaria').value,
            Cor_Destaque: document.getElementById('corDestaque').value
        }
    });
    alert('✅ Cores salvas!');
    carregarTudo();
}

// ============================================================
// TEXTOS
// ============================================================
function preencherFormularios() {
    const c = estado.config;
    document.getElementById('txtTitulo').value = c.Titulo_Site || '';
    document.getElementById('txtSubtituloHero').value = c.Subtitulo_Hero || '';
    document.getElementById('txtDescricaoHero').value = c.Descricao_Hero || '';
    document.getElementById('txtBotaoHero').value = c.Texto_Botao_Hero || '';
    document.getElementById('txtInstagram').value = c.Instagram || '';
    document.getElementById('txtEmail').value = c.Email_Contato || '';
    document.getElementById('txtRodape').value = c.Texto_Rodape || '';
    
    document.getElementById('corPrimaria').value = c.Cor_Primaria || '#0A1C3A';
    document.getElementById('corSecundaria').value = c.Cor_Secundaria || '#1A3A6B';
    document.getElementById('corDestaque').value = c.Cor_Destaque || '#D4AF37';
    
    document.getElementById('optCarrossel').checked = c.Mostrar_Carrossel !== 'FALSE';
    document.getElementById('optBusca').checked = c.Mostrar_Busca !== 'FALSE';
    
    if (c.Logo_URL) {
        document.getElementById('logoPreview').innerHTML = `<img src="${c.Logo_URL}">`;
    }
}

async function salvarTextos() {
    await apiPost({
        acao: 'atualizar_config',
        dados: {
            Titulo_Site: document.getElementById('txtTitulo').value,
            Subtitulo_Hero: document.getElementById('txtSubtituloHero').value,
            Descricao_Hero: document.getElementById('txtDescricaoHero').value,
            Texto_Botao_Hero: document.getElementById('txtBotaoHero').value,
            Instagram: document.getElementById('txtInstagram').value,
            Email_Contato: document.getElementById('txtEmail').value,
            Texto_Rodape: document.getElementById('txtRodape').value
        }
    });
    alert('✅ Textos salvos!');
    carregarTudo();
}

async function salvarOpcoes() {
    await apiPost({
        acao: 'atualizar_config',
        dados: {
            Mostrar_Carrossel: document.getElementById('optCarrossel').checked ? 'TRUE' : 'FALSE',
            Mostrar_Busca: document.getElementById('optBusca').checked ? 'TRUE' : 'FALSE'
        }
    });
    alert('✅ Opções salvas!');
}

// ============================================================
// MODAL
// ============================================================
function fecharModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

document.getElementById('modalOverlay')?.addEventListener('click', e => {
    if (e.target.id === 'modalOverlay') fecharModal();
});

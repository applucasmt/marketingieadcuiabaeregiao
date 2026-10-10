/* ============================================================
 * PAINEL ADMINISTRATIVO - Marketing IEAD v22
 * Com upload múltiplo + categorias
 * ============================================================ */

console.log("🚀 admin.js carregando...");

// ============================================================
// HELPERS
// ============================================================
function escHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function base64FromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================================
// ESTADO
// ============================================================
let cmsEstado = {
    config: {},
    arquivos: [],
    categorias: [],
    carrossel: [],
    menus: [],
    arquivosAtuais: []  // ← array para múltiplos
};

// ============================================================
// LOGIN
// ============================================================
window.cmsFazerLogin = function() {
    console.log('🔐 Tentando login...');

    const inputSenha = document.getElementById('cmsPassword');
    const erroEl = document.getElementById('cmsLoginError');

    if (!inputSenha) {
        console.error('❌ Input #cmsPassword não encontrado');
        return;
    }

    const senha = inputSenha.value;

    if (!senha) {
        if (erroEl) erroEl.textContent = 'Digite a senha.';
        return;
    }

    if (typeof window.CONFIG === 'undefined' || !window.CONFIG.SENHA_ADMIN) {
        if (erroEl) erroEl.textContent = 'Erro: config.js não carregado corretamente.';
        console.error('❌ window.CONFIG indefinido ou sem SENHA_ADMIN');
        return;
    }

    if (senha === window.CONFIG.SENHA_ADMIN) {
        console.log('✅ Senha correta! Entrando...');
        sessionStorage.setItem('adminLogged', 'true');
        window.cmsMostrarPainel();
    } else {
        console.warn('❌ Senha incorreta');
        if (erroEl) erroEl.textContent = 'Senha incorreta. Tente novamente.';
        const box = document.querySelector('.cms-login-box');
        if (box) {
            box.style.animation = 'none';
            setTimeout(() => box.style.animation = 'cmsFadeIn 0.4s ease', 10);
        }
    }
};

window.cmsFazerLogout = function() {
    sessionStorage.removeItem('adminLogged');
    location.reload();
};

window.cmsMostrarPainel = function() {
    const loginScreen = document.getElementById('cmsLoginScreen');
    const wrapper = document.getElementById('cmsWrapper');

    if (!loginScreen || !wrapper) {
        console.error('❌ Elementos do painel não encontrados');
        return;
    }

    loginScreen.style.display = 'none';
    wrapper.style.display = 'grid';
    console.log('✅ Painel exibido');
    window.cmsCarregarTudo();
};

// ============================================================
// AUTO LOGIN + ENTER
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOMContentLoaded - admin.js ativo');

    if (sessionStorage.getItem('adminLogged') === 'true') {
        console.log('🔓 Sessão ativa — auto-login');
        window.cmsMostrarPainel();
    }

    const inputSenha = document.getElementById('cmsPassword');
    if (inputSenha) {
        inputSenha.addEventListener('keypress', e => {
            if (e.key === 'Enter') window.cmsFazerLogin();
        });
    }
});

// ============================================================
// NAVEGAÇÃO
// ============================================================
document.querySelectorAll('.cms-nav a').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const tab = link.dataset.tab;
        if (!tab) return;

        document.querySelectorAll('.cms-nav a').forEach(a => a.classList.remove('active'));
        document.querySelectorAll('.cms-section').forEach(s => s.classList.remove('active'));
        link.classList.add('active');
        const section = document.getElementById('cmsTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
        if (section) section.classList.add('active');
        const title = document.getElementById('cmsPageTitle');
        if (title) title.textContent = link.textContent.trim();
    });
});

// ============================================================
// CARREGAR TUDO
// ============================================================
window.cmsCarregarTudo = async function() {
    try {
        const dados = await window.apiGet('tudo');

        if (!dados) {
            const statusText = document.getElementById('cmsStatusText');
            if (statusText) statusText.textContent = '⚠️ Modo offline';
            window.cmsRenderizarDashboard();
            window.cmsRenderizarArquivos();
            window.cmsRenderizarCategoriasSelect();
            window.cmsRenderizarCategoriasAdmin();
            window.cmsRenderizarCarrossel();
            window.cmsRenderizarMenus();
            window.cmsPreencherFormularios();
            return;
        }

        cmsEstado.config = dados.config || {};
        cmsEstado.arquivos = dados.arquivos || [];
        cmsEstado.categorias = dados.categorias || [];
        cmsEstado.carrossel = dados.carrossel || [];
        cmsEstado.menus = dados.menus || [];

        cmsEstado.categorias.forEach(c => {
            c.total_arquivos = cmsEstado.arquivos.filter(a => (a.categoria || '').trim() === c.nome).length;
        });

        window.cmsRenderizarDashboard();
        window.cmsRenderizarArquivos();
        window.cmsRenderizarCategoriasSelect();
        window.cmsRenderizarCategoriasAdmin();
        window.cmsRenderizarCarrossel();
        window.cmsRenderizarMenus();
        window.cmsPreencherFormularios();
    } catch (err) {
        console.error('❌ Erro:', err);
        const statusText = document.getElementById('cmsStatusText');
        if (statusText) statusText.textContent = '⚠️ Erro';
    }
};

// ============================================================
// DASHBOARD
// ============================================================
window.cmsRenderizarDashboard = function() {
    const statsEl = document.getElementById('cmsStats');
    if (!statsEl) return;

    const totalMB = cmsEstado.arquivos.reduce((s, a) => s + (parseFloat(a.tamanho) || 0), 0).toFixed(1);
    statsEl.innerHTML = `
        <div class="cms-stat-card">
            <svg class="cms-icon"><use href="#i-file"></use></svg>
            <h2>${cmsEstado.arquivos.length}</h2>
            <p>Arquivos</p>
        </div>
        <div class="cms-stat-card">
            <svg class="cms-icon"><use href="#i-database"></use></svg>
            <h2>${totalMB} MB</h2>
            <p>Tamanho Total</p>
        </div>
        <div class="cms-stat-card">
            <svg class="cms-icon"><use href="#i-folder"></use></svg>
            <h2>${cmsEstado.categorias.length}</h2>
            <p>Categorias</p>
        </div>
    `;

    const linkDrive = document.getElementById('cmsLinkPastaDrive');
    if (linkDrive && cmsEstado.config.Pasta_Drive_URL) {
        linkDrive.href = cmsEstado.config.Pasta_Drive_URL;
    }
};

// ============================================================
// ARQUIVOS
// ============================================================
window.cmsRenderizarArquivos = function() {
    const container = document.getElementById('cmsArquivosList');
    if (!container) return;

    if (!cmsEstado.arquivos.length) {
        container.innerHTML = '<p class="cms-empty">Nenhum arquivo ainda.</p>';
        return;
    }

    container.innerHTML = cmsEstado.arquivos.map(a => {
        const ext = (a.tipo || '').toUpperCase();
        const isImg = ['PNG','JPG','JPEG','GIF','WEBP','SVG','BMP'].includes(ext);
        const isVid = ['MP4','MOV','AVI','WEBM','MKV'].includes(ext);
        const isPdf = ext === 'PDF';

        let preview = '';
        if (isImg && a.preview) {
            preview = `<img src="${a.preview}" class="cms-preview-thumb" alt="">`;
        } else if (isVid) {
            preview = `<svg class="cms-icon" style="width:36px;height:36px;color:#D4AF37;"><use href="#i-video"></use></svg>`;
        } else if (isPdf) {
            preview = `<svg class="cms-icon" style="width:36px;height:36px;color:#DC3545;"><use href="#i-pdf"></use></svg>`;
        } else {
            preview = `<svg class="cms-icon" style="width:36px;height:36px;"><use href="#i-file"></use></svg>`;
        }

        return `
            <div class="cms-arquivo-item">
                <div class="cms-arquivo-preview">${preview}</div>
                <div class="cms-arquivo-info">
                    <h4>${escHTML(a.nome)}</h4>
                    <p>${escHTML(a.descricao || '')}</p>
                    <div class="cms-arquivo-meta">
                        <span class="cms-tag">${escHTML(a.tipo || '')}</span>
                        ${a.categoria ? `<span class="cms-tag">${escHTML(a.categoria)}</span>` : ''}
                        ${a.tamanho ? `<span class="cms-tag">${escHTML(a.tamanho)}</span>` : ''}
                    </div>
                </div>
                <div class="cms-arquivo-actions">
                    <a href="${a.link}" target="_blank" rel="noopener" class="cms-btn-icon" title="Abrir">
                        <svg class="cms-icon"><use href="#i-external"></use></svg>
                    </a>
                    <button onclick="cmsRemoverArquivo(${a.id})" class="cms-btn-icon cms-danger" title="Excluir">
                        <svg class="cms-icon"><use href="#i-trash"></use></svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
};

window.cmsRemoverArquivo = async function(id) {
    if (!confirm('Remover este arquivo? Ele será movido para a lixeira do Drive.')) return;
    const r = await window.apiPost({ acao: 'remover', id });
    if (r && r.status === 'ok') window.cmsCarregarTudo();
};

document.getElementById('cmsFiltroArquivos')?.addEventListener('input', function () {
    const t = this.value.toLowerCase();
    document.querySelectorAll('.cms-arquivo-item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(t) ? 'flex' : 'none';
    });
});

// ============================================================
// CATEGORIAS
// ============================================================
window.cmsRenderizarCategoriasSelect = function() {
    const sel = document.getElementById('cmsCategoriaUpload');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Selecione --</option>' + cmsEstado.categorias.map(c =>
        `<option value="${escHTML(c.nome)}">${escHTML(c.nome)}</option>`
    ).join('');
};

window.cmsRenderizarCategoriasAdmin = function() {
    const container = document.getElementById('cmsCategoriasList');
    if (!container) return;

    if (!cmsEstado.categorias.length) {
        container.innerHTML = '<p class="cms-empty">Nenhuma categoria ainda. Clique em "Nova Categoria" para começar.</p>';
        return;
    }

    container.innerHTML = cmsEstado.categorias.map(c => {
        const total = cmsEstado.arquivos.filter(a => (a.categoria || '').trim() === c.nome).length;
        return `
            <div class="cms-item">
                <div class="cms-item-info">
                    <h4>${escHTML(c.nome)}</h4>
                    <p>${total} arquivo(s)</p>
                </div>
                <div class="cms-item-actions">
                    <button onclick='cmsEditarCategoria(${JSON.stringify(c).replace(/'/g, "&#39;")})' class="cms-btn-icon" title="Editar">
                        <svg class="cms-icon"><use href="#i-edit"></use></svg>
                    </button>
                    <button onclick="cmsRemoverCategoria(${c.id})" class="cms-btn-icon cms-danger" title="Excluir">
                        <svg class="cms-icon"><use href="#i-trash"></use></svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
};

window.cmsAbrirModalCategoria = function(cat = null) {
    const modal = document.getElementById('cmsModal');
    const box = document.getElementById('cmsModalBox');
    box.innerHTML = `
        <h2>${cat ? 'Editar' : 'Nova'} Categoria</h2>
        <div class="cms-form-grid">
            <div class="cms-form-group cms-full">
                <label>Nome da Categoria</label>
                <input id="cmsCatNome" value="${cat?.nome || ''}" placeholder="Ex: Logo IEAD">
            </div>
            <div class="cms-form-group cms-full">
                <label>Ícone (classe Font Awesome)</label>
                <input id="cmsCatIcone" value="${cat?.icone || 'fa-folder'}" placeholder="Ex: fa-image, fa-book">
                <small style="color:#86868B;font-size:0.75rem;margin-top:5px;">Sugestões: fa-image, fa-book, fa-file-pdf, fa-video, fa-music, fa-bullhorn, fa-folder</small>
            </div>
            <div class="cms-form-group">
                <label>Ordem</label>
                <input type="number" id="cmsCatOrdem" value="${cat?.ordem || cmsEstado.categorias.length + 1}">
            </div>
        </div>
        <div class="cms-modal-actions">
            <button onclick="cmsFecharModal()" class="cms-btn-secondary">Cancelar</button>
            <button onclick="cmsSalvarCategoria(${cat?.id || 'null'})" class="cms-btn-primary">
                <svg class="cms-icon"><use href="#i-save"></use></svg><span>Salvar</span>
            </button>
        </div>
    `;
    modal.classList.add('cms-active');
};

window.cmsSalvarCategoria = async function(id) {
    const nome = document.getElementById('cmsCatNome').value.trim();
    const icone = document.getElementById('cmsCatIcone').value.trim() || 'fa-folder';
    const ordem = parseInt(document.getElementById('cmsCatOrdem').value) || 1;

    if (!nome) {
        alert('Digite um nome para a categoria.');
        return;
    }

    const dados = { nome, icone, ordem };
    const r = await window.apiPost({ acao: 'categoria_salvar', dados, id });

    if (r && r.status === 'ok') {
        window.cmsFecharModal();
        window.cmsCarregarTudo();
        alert('✅ Categoria salva!');
    } else {
        alert('❌ Erro ao salvar categoria: ' + (r?.mensagem || 'desconhecido'));
    }
};

window.cmsRemoverCategoria = async function(id) {
    if (!confirm('Remover esta categoria? Os arquivos vinculados ficarão sem categoria.')) return;
    const r = await window.apiPost({ acao: 'categoria_remover', id });
    if (r && r.status === 'ok') window.cmsCarregarTudo();
};

window.cmsEditarCategoria = function(c) { window.cmsAbrirModalCategoria(c); };

// ============================================================
// UPLOAD MÚLTIPLO
// ============================================================
const cmsUploadArea = document.getElementById('cmsUploadArea');
const cmsFileInput = document.getElementById('cmsFileInput');

cmsUploadArea?.addEventListener('click', () => cmsFileInput.click());
cmsUploadArea?.addEventListener('dragover', e => { e.preventDefault(); cmsUploadArea.classList.add('cms-dragover'); });
cmsUploadArea?.addEventListener('dragleave', () => cmsUploadArea.classList.remove('cms-dragover'));
cmsUploadArea?.addEventListener('drop', e => {
    e.preventDefault();
    cmsUploadArea.classList.remove('cms-dragover');
    if (e.dataTransfer.files.length) {
        // ✅ Múltiplos arquivos via drag & drop
        cmsFileInput.files = e.dataTransfer.files;
        window.cmsSelecionarArquivos(Array.from(e.dataTransfer.files));
    }
});
cmsFileInput?.addEventListener('change', () => {
    if (cmsFileInput.files.length) {
        window.cmsSelecionarArquivos(Array.from(cmsFileInput.files));
    }
});

// ✅ NOVO: recebe ARRAY de arquivos
window.cmsSelecionarArquivos = function(files) {
    cmsEstado.arquivosAtuais = files;

    const previewDiv = document.getElementById('cmsUploadPreview');
    const previewContent = document.getElementById('cmsPreviewContent');
    
    if (!files.length) {
        previewDiv.style.display = 'none';
        return;
    }

    previewDiv.style.display = 'block';

    // Mostra cada arquivo com miniatura
    const itensHTML = files.map((file, idx) => {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        const isImg = file.type.startsWith('image/');
        const isVid = file.type.startsWith('video/');
        const isPdf = file.type === 'application/pdf';

        let icon = '📄';
        if (isImg) icon = '🖼️';
        else if (isVid) icon = '🎬';
        else if (isPdf) icon = '📕';

        return `
            <div style="display:flex; align-items:center; gap:12px; padding:10px; background:#F5F5F7; border-radius:10px; margin-bottom:8px;">
                <span style="font-size:1.5rem;">${icon}</span>
                <div style="flex:1; text-align:left;">
                    <p style="color:#0A1C3A; font-weight:600; font-size:0.9rem; margin-bottom:2px;">${escHTML(file.name)}</p>
                    <p style="color:#86868B; font-size:0.8rem;">${sizeMB} MB</p>
                </div>
                <span style="color:#D4AF37; font-weight:700; font-size:0.85rem;">#${idx + 1}</span>
            </div>
        `;
    }).join('');

    previewContent.innerHTML = `
        <p style="color:#0A1C3A; font-weight:700; margin-bottom:12px;">
            ${files.length} arquivo${files.length > 1 ? 's' : ''} selecionado${files.length > 1 ? 's' : ''}
        </p>
        <div style="max-height:220px; overflow-y:auto; text-align:left;">
            ${itensHTML}
        </div>
        <button onclick="cmsLimparSelecao()" class="cms-btn-secondary" style="margin-top:12px; font-size:0.85rem;">
            Limpar seleção
        </button>
    `;

    // Preenche o nome amigável apenas se for 1 arquivo
    if (files.length === 1) {
        const f = files[0];
        const nomeBase = f.name.replace(/\.[^/.]+$/, '');
        document.getElementById('cmsNomeAmigavel').value = nomeBase;
    } else {
        document.getElementById('cmsNomeAmigavel').value = '';
    }
};

window.cmsLimparSelecao = function() {
    cmsEstado.arquivosAtuais = [];
    cmsFileInput.value = '';
    document.getElementById('cmsUploadPreview').style.display = 'none';
    document.getElementById('cmsNomeAmigavel').value = '';
};

// ✅ UPLOAD EM LOTE
document.getElementById('cmsUploadBtn')?.addEventListener('click', async () => {
    const files = cmsEstado.arquivosAtuais || [];

    if (!files.length) {
        alert('Selecione pelo menos um arquivo!');
        return;
    }

    const status = document.getElementById('cmsUploadStatus');
    const btn = document.getElementById('cmsUploadBtn');
    const limiteMB = (window.CONFIG && window.CONFIG.LIMITE_UPLOAD_MB) || 25;
    const categoria = document.getElementById('cmsCategoriaUpload').value;
    const descricao = document.getElementById('cmsDescricaoUpload').value;
    const nomeAmigavel = document.getElementById('cmsNomeAmigavel').value;

    // Valida tamanho de todos
    const arquivosGrandes = files.filter(f => f.size > limiteMB * 1024 * 1024);
    if (arquivosGrandes.length) {
        status.innerHTML = `<div class="cms-status-msg cms-error">
            ❌ ${arquivosGrandes.length} arquivo(s) excedem o limite de ${limiteMB} MB:<br>
            ${arquivosGrandes.map(f => f.name).join(', ')}
        </div>`;
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<svg class="cms-icon cms-spin"><use href="#i-spinner"></use></svg><span>Enviando...</span>';

    let sucessos = 0;
    let falhas = 0;
    const erros = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const pct = Math.round(((i) / files.length) * 100);

        status.innerHTML = `<div class="cms-status-msg">
            ⏳ Enviando ${i + 1} de ${files.length} (${pct}%)<br>
            <strong>${escHTML(file.name)}</strong>
        </div>`;

        try {
            const base64 = await base64FromFile(file);
            const nomeFinal = files.length === 1 && nomeAmigavel
                ? nomeAmigavel
                : file.name.replace(/\.[^/.]+$/, '');

            const result = await window.apiPost({
                acao: 'upload',
                nomeArquivo: file.name,
                tipoMime: file.type || 'application/octet-stream',
                dadosBase64: base64.split(',')[1],
                descricao: descricao,
                categoria: categoria,
                nomeAmigavel: nomeFinal
            });

            if (result && result.status === 'ok') {
                sucessos++;
            } else {
                falhas++;
                erros.push(`${file.name}: ${result?.mensagem || 'erro'}`);
            }
        } catch (err) {
            falhas++;
            erros.push(`${file.name}: ${err.message}`);
        }
    }

    // Finalização
    if (falhas === 0) {
        status.innerHTML = `<div class="cms-status-msg cms-success">
            ✅ ${sucessos} arquivo${sucessos > 1 ? 's' : ''} enviado${sucessos > 1 ? 's' : ''} com sucesso!
        </div>`;
    } else if (sucessos === 0) {
        status.innerHTML = `<div class="cms-status-msg cms-error">
            ❌ Nenhum arquivo foi enviado.<br>
            ${erros.join('<br>')}
        </div>`;
    } else {
        status.innerHTML = `<div class="cms-status-msg cms-error">
            ⚠️ ${sucessos} enviado${sucessos > 1 ? 's' : ''}, ${falhas} falhou/falharam:<br>
            ${erros.join('<br>')}
        </div>`;
    }

    // Limpa
    cmsEstado.arquivosAtuais = [];
    cmsFileInput.value = '';
    document.getElementById('cmsUploadPreview').style.display = 'none';
    document.getElementById('cmsNomeAmigavel').value = '';
    document.getElementById('cmsDescricaoUpload').value = '';
    document.getElementById('cmsCategoriaUpload').value = '';
    btn.disabled = false;
    btn.innerHTML = '<svg class="cms-icon"><use href="#i-upload"></use></svg><span>Enviar para o Google Drive</span>';

    // Recarrega
    window.cmsCarregarTudo();
});

// ============================================================
// CARROSSEL
// ============================================================
window.cmsRenderizarCarrossel = function() {
    const c = document.getElementById('cmsCarrosselList');
    if (!c) return;

    if (!cmsEstado.carrossel.length) {
        c.innerHTML = '<p class="cms-empty">Nenhum slide ainda. Clique em "Novo Slide" para começar.</p>';
        return;
    }

    c.innerHTML = cmsEstado.carrossel.map(s => `
        <div class="cms-item">
            <div class="cms-item-info">
                ${s.badge ? `<span class="cms-badge">${escHTML(s.badge)}</span>` : ''}
                <h4>${escHTML(s.titulo)}</h4>
                <p>${escHTML(s.descricao || '')}</p>
            </div>
            <div class="cms-item-actions">
                <button onclick='cmsEditarSlide(${JSON.stringify(s).replace(/'/g, "&#39;")})' class="cms-btn-icon" title="Editar">
                    <svg class="cms-icon"><use href="#i-edit"></use></svg>
                </button>
                <button onclick="cmsRemoverSlide(${s.id})" class="cms-btn-icon cms-danger" title="Excluir">
                    <svg class="cms-icon"><use href="#i-trash"></use></svg>
                </button>
            </div>
        </div>
    `).join('');
};

window.cmsAbrirModalSlide = function(slide = null) {
    const modal = document.getElementById('cmsModal');
    const box = document.getElementById('cmsModalBox');
    box.innerHTML = `
        <h2>${slide ? 'Editar' : 'Novo'} Slide</h2>
        <div class="cms-form-grid">
            <div class="cms-form-group cms-full">
                <label>Título</label>
                <input id="cmsSlTitulo" value="${slide?.titulo || ''}" placeholder="Título do slide">
            </div>
            <div class="cms-form-group cms-full">
                <label>Descrição</label>
                <textarea id="cmsSlDescricao" placeholder="Descrição breve">${slide?.descricao || ''}</textarea>
            </div>
            <div class="cms-form-group">
                <label>Badge</label>
                <input id="cmsSlBadge" value="${slide?.badge || ''}" placeholder="Ex: Novo">
            </div>
            <div class="cms-form-group">
                <label>Texto do Botão</label>
                <input id="cmsSlBotao" value="${slide?.textoBotao || ''}" placeholder="Ver mais">
            </div>
            <div class="cms-form-group cms-full">
                <label>Link do Botão</label>
                <input id="cmsSlLink" value="${slide?.link || '#downloads'}" placeholder="#downloads">
            </div>
            <div class="cms-form-group">
                <label>Ordem</label>
                <input type="number" id="cmsSlOrdem" value="${slide?.ordem || 1}">
            </div>
        </div>
        <div class="cms-modal-actions">
            <button onclick="cmsFecharModal()" class="cms-btn-secondary">Cancelar</button>
            <button onclick="cmsSalvarSlide(${slide?.id || 'null'})" class="cms-btn-primary">
                <svg class="cms-icon"><use href="#i-save"></use></svg><span>Salvar</span>
            </button>
        </div>
    `;
    modal.classList.add('cms-active');
};

window.cmsSalvarSlide = async function(id) {
    const dados = {
        titulo: document.getElementById('cmsSlTitulo').value,
        descricao: document.getElementById('cmsSlDescricao').value,
        badge: document.getElementById('cmsSlBadge').value,
        textoBotao: document.getElementById('cmsSlBotao').value,
        link: document.getElementById('cmsSlLink').value,
        ordem: parseInt(document.getElementById('cmsSlOrdem').value) || 1
    };
    await window.apiPost({ acao: 'carrossel_salvar', dados, id });
    window.cmsFecharModal();
    window.cmsCarregarTudo();
};

window.cmsRemoverSlide = async function(id) {
    if (!confirm('Remover este slide?')) return;
    await window.apiPost({ acao: 'carrossel_remover', id });
    window.cmsCarregarTudo();
};

window.cmsEditarSlide = function(s) { window.cmsAbrirModalSlide(s); };

// ============================================================
// MENUS
// ============================================================
window.cmsRenderizarMenus = function() {
    const c = document.getElementById('cmsMenusList');
    if (!c) return;

    if (!cmsEstado.menus.length) {
        c.innerHTML = '<p class="cms-empty">Nenhum menu ainda. Clique em "Nova Aba" para começar.</p>';
        return;
    }

    c.innerHTML = cmsEstado.menus.map(m => `
        <div class="cms-item">
            <div class="cms-item-info">
                <h4>${escHTML(m.nome)}</h4>
                <p>${escHTML(m.link)} ${m.novaAba ? '• nova aba' : ''}</p>
            </div>
            <div class="cms-item-actions">
                <button onclick='cmsEditarMenu(${JSON.stringify(m).replace(/'/g, "&#39;")})' class="cms-btn-icon" title="Editar">
                    <svg class="cms-icon"><use href="#i-edit"></use></svg>
                </button>
                <button onclick="cmsRemoverMenu(${m.id})" class="cms-btn-icon cms-danger" title="Excluir">
                    <svg class="cms-icon"><use href="#i-trash"></use></svg>
                </button>
            </div>
        </div>
    `).join('');
};

window.cmsAbrirModalMenu = function(menu = null) {
    const modal = document.getElementById('cmsModal');
    const box = document.getElementById('cmsModalBox');
    box.innerHTML = `
        <h2>${menu ? 'Editar' : 'Nova'} Aba / Menu</h2>
        <div class="cms-form-grid">
            <div class="cms-form-group cms-full">
                <label>Nome do Menu</label>
                <input id="cmsMnNome" value="${menu?.nome || ''}" placeholder="Ex: Downloads">
            </div>
            <div class="cms-form-group cms-full">
                <label>Link</label>
                <input id="cmsMnLink" value="${menu?.link || ''}" placeholder="#downloads ou https://...">
            </div>
            <div class="cms-form-group">
                <label>Ordem</label>
                <input type="number" id="cmsMnOrdem" value="${menu?.ordem || 1}">
            </div>
            <div class="cms-form-group">
                <label>Abrir em nova aba?</label>
                <label class="cms-toggle">
                    <input type="checkbox" id="cmsMnNovaAba" ${menu?.novaAba ? 'checked' : ''}>
                    <span>Sim, nova aba</span>
                </label>
            </div>
        </div>
        <div class="cms-modal-actions">
            <button onclick="cmsFecharModal()" class="cms-btn-secondary">Cancelar</button>
            <button onclick="cmsSalvarMenu(${menu?.id || 'null'})" class="cms-btn-primary">
                <svg class="cms-icon"><use href="#i-save"></use></svg><span>Salvar</span>
            </button>
        </div>
    `;
    modal.classList.add('cms-active');
};

window.cmsSalvarMenu = async function(id) {
    const dados = {
        nome: document.getElementById('cmsMnNome').value,
        link: document.getElementById('cmsMnLink').value,
        ordem: parseInt(document.getElementById('cmsMnOrdem').value) || 1,
        novaAba: document.getElementById('cmsMnNovaAba').checked
    };
    await window.apiPost({ acao: 'menu_salvar', dados, id });
    window.cmsFecharModal();
    window.cmsCarregarTudo();
};

window.cmsRemoverMenu = async function(id) {
    if (!confirm('Remover este menu?')) return;
    await window.apiPost({ acao: 'menu_remover', id });
    window.cmsCarregarTudo();
};

window.cmsEditarMenu = function(m) { window.cmsAbrirModalMenu(m); };

// ============================================================
// APARÊNCIA
// ============================================================
document.getElementById('cmsLogoInput')?.addEventListener('change', async function () {
    if (!this.files.length) return;
    const file = this.files[0];
    const base64 = await base64FromFile(file);

    const result = await window.apiPost({
        acao: 'upload_logo',
        nomeArquivo: file.name,
        tipoMime: file.type,
        dadosBase64: base64.split(',')[1]
    });

    if (result && result.status === 'ok') {
        document.getElementById('cmsLogoPreview').innerHTML = `<img src="${result.url}" alt="Logo">`;
        alert('✅ Logo atualizada com sucesso!');
        window.cmsCarregarTudo();
    } else {
        alert('❌ Erro ao atualizar logo');
    }
});

window.cmsSalvarCores = async function() {
    const dados = {
        Cor_Primaria: document.getElementById('cmsCorPrimaria').value,
        Cor_Secundaria: document.getElementById('cmsCorSecundaria').value,
        Cor_Destaque: document.getElementById('cmsCorDestaque').value
    };
    const r = await window.apiPost({ acao: 'atualizar_config', dados });
    if (r && r.status === 'ok') {
        alert('✅ Cores salvas!');
        window.cmsCarregarTudo();
    }
};

// ============================================================
// TEXTOS
// ============================================================
window.cmsPreencherFormularios = function() {
    const c = cmsEstado.config;

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };
    const setCheck = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = val;
    };

    setVal('cmsTxtTitulo', c.Titulo_Site);
    setVal('cmsTxtSubtituloHero', c.Subtitulo_Hero);
    setVal('cmsTxtDescricaoHero', c.Descricao_Hero);
    setVal('cmsTxtBotaoHero', c.Texto_Botao_Hero);
    setVal('cmsTxtInstagram', c.Instagram);
    setVal('cmsTxtEmail', c.Email_Contato);
    setVal('cmsTxtRodape', c.Texto_Rodape);

    setVal('cmsCorPrimaria', c.Cor_Primaria || '#0A1C3A');
    setVal('cmsCorSecundaria', c.Cor_Secundaria || '#1A3A6B');
    setVal('cmsCorDestaque', c.Cor_Destaque || '#D4AF37');

    setCheck('cmsOptCarrossel', c.Mostrar_Carrossel !== 'FALSE');
    setCheck('cmsOptBusca', c.Mostrar_Busca !== 'FALSE');

    if (c.Logo_URL) {
        const preview = document.getElementById('cmsLogoPreview');
        if (preview) preview.innerHTML = `<img src="${c.Logo_URL}" alt="Logo">`;
    }
};

window.cmsSalvarTextos = async function() {
    const dados = {
        Titulo_Site: document.getElementById('cmsTxtTitulo').value,
        Subtitulo_Hero: document.getElementById('cmsTxtSubtituloHero').value,
        Descricao_Hero: document.getElementById('cmsTxtDescricaoHero').value,
        Texto_Botao_Hero: document.getElementById('cmsTxtBotaoHero').value,
        Instagram: document.getElementById('cmsTxtInstagram').value,
        Email_Contato: document.getElementById('cmsTxtEmail').value,
        Texto_Rodape: document.getElementById('cmsTxtRodape').value
    };
    const r = await window.apiPost({ acao: 'atualizar_config', dados });
    if (r && r.status === 'ok') {
        alert('✅ Textos salvos!');
        window.cmsCarregarTudo();
    }
};

window.cmsSalvarOpcoes = async function() {
    const dados = {
        Mostrar_Carrossel: document.getElementById('cmsOptCarrossel').checked ? 'TRUE' : 'FALSE',
        Mostrar_Busca: document.getElementById('cmsOptBusca').checked ? 'TRUE' : 'FALSE'
    };
    const r = await window.apiPost({ acao: 'atualizar_config', dados });
    if (r && r.status === 'ok') {
        alert('✅ Opções salvas!');
    }
};

// ============================================================
// MODAL
// ============================================================
window.cmsFecharModal = function() {
    const m = document.getElementById('cmsModal');
    if (m) m.classList.remove('cms-active');
};

document.getElementById('cmsModal')?.addEventListener('click', e => {
    if (e.target.id === 'cmsModal') window.cmsFecharModal();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') window.cmsFecharModal();
});

console.log("✅ admin.js carregado com sucesso - CONFIG:", window.CONFIG ? 'OK' : 'NÃO DEFINIDO');


// ============================================================
// IEAD CREATIVE - UPLOAD DE PSD
// ============================================================
let cmsCreativeArquivo = null;
let cmsCreativeThumb = null;

const cmsCreativeUploadArea = document.getElementById('cmsCreativeUploadArea');
const cmsCreativeFileInput = document.getElementById('cmsCreativeFileInput');

cmsCreativeUploadArea?.addEventListener('click', () => cmsCreativeFileInput.click());
cmsCreativeUploadArea?.addEventListener('dragover', e => { e.preventDefault(); cmsCreativeUploadArea.classList.add('cms-dragover'); });
cmsCreativeUploadArea?.addEventListener('dragleave', () => cmsCreativeUploadArea.classList.remove('cms-dragover'));
cmsCreativeUploadArea?.addEventListener('drop', e => {
    e.preventDefault();
    cmsCreativeUploadArea.classList.remove('cms-dragover');
    if (e.dataTransfer.files.length) {
        cmsCreativeFileInput.files = e.dataTransfer.files;
        window.cmsSelecionarCreative(e.dataTransfer.files[0]);
    }
});
cmsCreativeFileInput?.addEventListener('change', () => {
    if (cmsCreativeFileInput.files.length) window.cmsSelecionarCreative(cmsCreativeFileInput.files[0]);
});

document.getElementById('cmsCreativeThumb')?.addEventListener('change', function() {
    if (this.files.length) {
        cmsCreativeThumb = this.files[0];
        alert('✅ Miniatura selecionada: ' + this.files[0].name);
    }
});

window.cmsSelecionarCreative = function(file) {
    cmsCreativeArquivo = file;
    document.getElementById('cmsCreativeUploadPreview').style.display = 'block';
    const previewContent = document.getElementById('cmsCreativePreviewContent');
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);

    previewContent.innerHTML = `
        <svg class="cms-icon cms-icon-3xl" style="color:#D4AF37;"><use href="#i-magic"></use></svg>
        <p style="color:#0A1C3A;font-weight:600;">${file.name}</p>
        <p style="color:#86868B;font-size:0.85rem;">${sizeMB} MB • Arquivo PSD</p>
    `;

    document.getElementById('cmsCreativeNome').value = file.name.replace(/\.[^/.]+$/, '');
};

document.getElementById('cmsCreativeUploadBtn')?.addEventListener('click', async () => {
    if (!cmsCreativeArquivo) {
        alert('Selecione um arquivo PSD primeiro!');
        return;
    }

    const status = document.getElementById('cmsCreativeUploadStatus');
    const btn = document.getElementById('cmsCreativeUploadBtn');
    const nome = document.getElementById('cmsCreativeNome').value.trim() || cmsCreativeArquivo.name;
    const descricao = document.getElementById('cmsCreativeDescricao').value.trim();

    if (cmsCreativeArquivo.size > 25 * 1024 * 1024) {
        status.innerHTML = `<div class="cms-status-msg cms-error">❌ Arquivo muito grande (máx: 25 MB)</div>`;
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<svg class="cms-icon cms-spin"><use href="#i-spinner"></use></svg><span>Enviando PSD...</span>';
    status.innerHTML = '<div class="cms-status-msg">⏳ Lendo arquivo PSD...</div>';

    try {
        const base64 = await base64FromFile(cmsCreativeArquivo);

        let thumbBase64 = null;
        if (cmsCreativeThumb) {
            status.innerHTML = '<div class="cms-status-msg">⏳ Processando miniatura...</div>';
            const thumbData = await base64FromFile(cmsCreativeThumb);
            thumbBase64 = thumbData.split(',')[1];
        }

        status.innerHTML = '<div class="cms-status-msg">⏳ Enviando para o Google Drive...</div>';

        const result = await window.apiPost({
            acao: 'creative_upload',
            nomeArquivo: cmsCreativeArquivo.name,
            tipoMime: cmsCreativeArquivo.type || 'image/vnd.adobe.photoshop',
            dadosBase64: base64.split(',')[1],
            nome: nome,
            descricao: descricao,
            thumbBase64: thumbBase64,
            thumbTipoMime: cmsCreativeThumb ? cmsCreativeThumb.type : null
        });

        if (result && result.status === 'ok') {
            status.innerHTML = `<div class="cms-status-msg cms-success">✅ PSD enviado com sucesso!</div>`;
            cmsCreativeArquivo = null;
            cmsCreativeThumb = null;
            cmsCreativeFileInput.value = '';
            document.getElementById('cmsCreativeUploadPreview').style.display = 'none';
            document.getElementById('cmsCreativeNome').value = '';
            document.getElementById('cmsCreativeDescricao').value = '';
            window.cmsCarregarTudo();
        } else {
            status.innerHTML = `<div class="cms-status-msg cms-error">❌ ${result?.mensagem || 'Erro desconhecido'}</div>`;
        }
    } catch (err) {
        status.innerHTML = `<div class="cms-status-msg cms-error">❌ ${err.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<svg class="cms-icon"><use href="#i-upload"></use></svg><span>Enviar PSD para o Drive</span>';
    }
});

// Listagem de PSDs
window.cmsRenderizarCreativeList = function() {
    const container = document.getElementById('cmsCreativeList');
    if (!container) return;

    const criativos = cmsEstado.criativos || [];

    if (!criativos.length) {
        container.innerHTML = '<p class="cms-empty">Nenhum template PSD ainda. Faça upload acima.</p>';
        return;
    }

    container.innerHTML = criativos.map(c => `
        <div class="cms-arquivo-item">
            <div class="cms-arquivo-preview" style="background: linear-gradient(135deg, #1A3A6B, #0A1C3A);">
                ${c.preview 
                    ? `<img src="${c.preview}" class="cms-preview-thumb" alt="">`
                    : `<svg class="cms-icon" style="width:36px;height:36px;color:#D4AF37;"><use href="#i-magic"></use></svg>`
                }
            </div>
            <div class="cms-arquivo-info">
                <h4>${escHTML(c.nome)}</h4>
                <p>${escHTML(c.descricao || '')}</p>
                <div class="cms-arquivo-meta">
                    <span class="cms-tag">PSD</span>
                    ${c.tamanho ? `<span class="cms-tag">${escHTML(c.tamanho)}</span>` : ''}
                </div>
            </div>
            <div class="cms-arquivo-actions">
                <a href="${c.link}" target="_blank" rel="noopener" class="cms-btn-icon" title="Abrir">
                    <svg class="cms-icon"><use href="#i-external"></use></svg>
                </a>
                <button onclick="cmsRemoverCreative(${c.id})" class="cms-btn-icon cms-danger" title="Excluir">
                    <svg class="cms-icon"><use href="#i-trash"></use></svg>
                </button>
            </div>
        </div>
    `).join('');
};

window.cmsRemoverCreative = async function(id) {
    if (!confirm('Remover este template PSD?')) return;
    const r = await window.apiPost({ acao: 'creative_remover', id });
    if (r && r.status === 'ok') window.cmsCarregarTudo();
};

// ⚠️ IMPORTANTE: dentro de cmsCarregarTudo(), adicione:
// cmsEstado.criativos = dados.criativos || [];
// E depois chame:
// window.cmsRenderizarCreativeList();

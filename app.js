/* ============================================================
 * SITE PÚBLICO - Marketing IEAD v34
 * Correções finais do Photopea
 * ============================================================ */

let estadoSite = {
    config: {},
    arquivos: [],
    carrossel: [],
    menus: [],
    categorias: [],
    criativos: [],
    criativosPublicos: [],
    slideAtual: 0,
    carrosselInterval: null,
    rotaAtual: 'inicio',
    categoriaAtiva: 'todas',
    buscaAtiva: '',
    creativeAbaAtiva: 'templates',
    creativeBusca: '',
    creativeArquivoAtual: null
};

// ============================================================
// SPLASH
// ============================================================
function atualizarProgresso(percent) {
    const circle = document.getElementById('splashCircle');
    const txt = document.getElementById('splashPercent');
    if (txt) txt.textContent = Math.round(percent) + '%';
    if (circle) {
        const perimetro = 565.48;
        const offset = perimetro - (perimetro * percent / 100);
        circle.style.strokeDashoffset = offset;
    }
}

function esconderSplash() {
    const splash = document.getElementById('splashScreen');
    const wrapper = document.getElementById('siteWrapper');
    if (splash) {
        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.style.display = 'none';
            if (wrapper) wrapper.classList.add('visible');
        }, 900);
    }
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    atualizarProgresso(5);
    await new Promise(r => setTimeout(r, 150));
    atualizarProgresso(20);

    await carregarDadosSite();
    atualizarProgresso(55);

    aplicarConfiguracoes();
    atualizarProgresso(70);

    renderizarCarrossel();
    renderizarCategorias();
    renderizarArquivos();
    renderizarContato();
    renderizarCreative();
    renderizarCreativeMeus();
    atualizarProgresso(90);

    inicializarBusca();
    inicializarBuscaCreative();
    inicializarUploadCreative();
    inicializarCarrossel();
    inicializarPreview();
    inicializarRotas();
    atualizarProgresso(100);

    await new Promise(r => setTimeout(r, 500));
    esconderSplash();
});

// ============================================================
// ROTAS
// ============================================================
function inicializarRotas() {
    window.addEventListener('hashchange', aplicarRota);
    aplicarRota();
}

function aplicarRota() {
    const hash = window.location.hash.replace('#', '') || 'inicio';
    const rotasValidas = ['inicio', 'downloads', 'creative', 'sobre', 'contato'];
    const rota = rotasValidas.includes(hash) ? hash : 'inicio';
    estadoSite.rotaAtual = rota;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('page-' + rota);
    if (page) page.classList.add('active');

    document.querySelectorAll('.header-nav a').forEach(a => {
        const href = a.getAttribute('href')?.replace('#', '');
        a.classList.toggle('active', href === rota);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// DADOS
// ============================================================
async function carregarDadosSite() {
    const dados = await apiGet('tudo');

    if (dados) {
        estadoSite.config = dados.config || {};
        estadoSite.arquivos = dados.arquivos || [];
        estadoSite.carrossel = dados.carrossel || [];
        estadoSite.menus = dados.menus || [];
        estadoSite.categorias = dados.categorias || [];
        estadoSite.criativos = dados.criativos || [];
    } else {
        estadoSite.config = {
            Titulo_Site: CONFIG.TEXTOS_PADRAO.titulo,
            Subtitulo_Hero: CONFIG.TEXTOS_PADRAO.subtituloHero,
            Descricao_Hero: CONFIG.TEXTOS_PADRAO.descricaoHero,
            Texto_Botao_Hero: CONFIG.TEXTOS_PADRAO.textoBotaoHero,
            Texto_Rodape: CONFIG.TEXTOS_PADRAO.rodape
        };
    }
}

// ============================================================
// CONFIGURAÇÕES
// ============================================================
function aplicarConfiguracoes() {
    const c = estadoSite.config;

    if (c.Titulo_Site) document.title = c.Titulo_Site;

    if (c.Logo_URL) {
        const logoImg = document.getElementById('siteLogo');
        if (logoImg) {
            logoImg.src = c.Logo_URL;
            logoImg.onerror = () => {
                logoImg.src = "https://i.ibb.co/3Y5PMRwz/2600211b-5791-45a6-8ce0-1c8eb30344f6.jpg";
            };
        }
    }

    if (c.Subtitulo_Hero) {
        const sub = document.getElementById('siteSubtitulo');
        if (sub) sub.textContent = c.Subtitulo_Hero.split('.')[0] || 'Cuiabá e Região';
    }

    const heroT = document.getElementById('heroTitulo');
    if (heroT) heroT.textContent = c.Titulo_Site || CONFIG.TEXTOS_PADRAO.titulo;

    const heroD = document.getElementById('heroDescricao');
    if (heroD) heroD.textContent = c.Descricao_Hero || CONFIG.TEXTOS_PADRAO.descricaoHero;

    const heroB = document.getElementById('heroBotao');
    if (heroB) heroB.textContent = c.Texto_Botao_Hero || CONFIG.TEXTOS_PADRAO.textoBotaoHero;

    const rod = document.getElementById('siteRodape');
    if (rod) rod.textContent = c.Texto_Rodape || CONFIG.TEXTOS_PADRAO.rodape;

    const socialDiv = document.getElementById('siteSocial');
    if (socialDiv) {
        let socialHTML = '';
        if (c.Instagram) {
            const insta = c.Instagram.replace('@', '');
            socialHTML += `<a href="https://instagram.com/${insta}" target="_blank" rel="noopener"><i class="fab fa-instagram"></i></a>`;
        }
        if (c.Email_Contato) {
            socialHTML += `<a href="mailto:${c.Email_Contato}"><i class="fas fa-envelope"></i></a>`;
        }
        socialDiv.innerHTML = socialHTML;
    }

    if (c.Mostrar_Carrossel === 'FALSE') {
        const cs = document.getElementById('carouselSection');
        if (cs) cs.style.display = 'none';
    }
    if (c.Mostrar_Busca === 'FALSE') {
        const sw = document.getElementById('searchWrapper');
        if (sw) sw.style.display = 'none';
    }
}

// ============================================================
// CATEGORIAS
// ============================================================
function renderizarCategorias() {
    const container = document.getElementById('categoriasTabs');
    if (!container) return;

    const contagem = {};
    estadoSite.arquivos.forEach(a => {
        const cat = (a.categoria || 'Geral').trim();
        contagem[cat] = (contagem[cat] || 0) + 1;
    });

    const categoriasMap = new Map();
    categoriasMap.set('todas', { nome: 'Todas', icone: 'fa-th-large', total: estadoSite.arquivos.length });

    estadoSite.categorias.forEach(c => {
        const nome = (c.nome || '').trim();
        if (nome && !categoriasMap.has(nome)) {
            categoriasMap.set(nome, { nome: nome, icone: c.icone || 'fa-folder', total: contagem[nome] || 0 });
        }
    });

    Object.keys(contagem).forEach(nome => {
        if (!categoriasMap.has(nome)) {
            categoriasMap.set(nome, { nome: nome, icone: 'fa-folder', total: contagem[nome] });
        }
    });

    container.innerHTML = Array.from(categoriasMap.values()).map(cat => `
        <button class="categoria-tab ${estadoSite.categoriaAtiva === cat.nome ? 'active' : ''}"
            onclick="selecionarCategoria('${cat.nome.replace(/'/g, "&#39;")}')">
            <i class="fas ${cat.icone}"></i>
            <span>${escapeHTML(cat.nome)}</span>
            <span class="contador">${cat.total}</span>
        </button>
    `).join('');
}

function selecionarCategoria(nomeCategoria) {
    estadoSite.categoriaAtiva = nomeCategoria;
    renderizarCategorias();
    renderizarArquivos();
}

// ============================================================
// ARQUIVOS
// ============================================================
function renderizarArquivos() {
    const grid = document.getElementById('downloadsGrid');
    const info = document.getElementById('resultadoInfo');
    if (!grid) return;

    let arquivosFiltrados = estadoSite.arquivos.slice();
    const catAtiva = (estadoSite.categoriaAtiva || 'todas').trim();

    if (catAtiva && catAtiva.toLowerCase() !== 'todas') {
        arquivosFiltrados = arquivosFiltrados.filter(a => (a.categoria || 'Geral').trim() === catAtiva);
    }

    if (estadoSite.buscaAtiva) {
        const t = estadoSite.buscaAtiva.toLowerCase();
        arquivosFiltrados = arquivosFiltrados.filter(a =>
            (a.nome || '').toLowerCase().includes(t) ||
            (a.descricao || '').toLowerCase().includes(t) ||
            (a.tipo || '').toLowerCase().includes(t)
        );
    }

    if (info) {
        if (arquivosFiltrados.length === 0) info.innerHTML = '';
        else {
            const catNome = catAtiva.toLowerCase() === 'todas' ? 'todas as categorias' : `"${catAtiva}"`;
            info.innerHTML = `Mostrando <strong>${arquivosFiltrados.length}</strong> arquivo${arquivosFiltrados.length > 1 ? 's' : ''} em ${catNome}`;
        }
    }

    if (!arquivosFiltrados.length) {
        const msg = catAtiva.toLowerCase() === 'todas' ? 'Nenhum arquivo disponível.' : `Nenhum arquivo na categoria "${catAtiva}".`;
        grid.innerHTML = `<div class="empty-categoria"><i class="fas fa-folder-open"></i><h3>${msg}</h3><p>${catAtiva.toLowerCase() !== 'todas' ? 'Tente outra categoria.' : 'Os materiais serão adicionados em breve.'}</p></div>`;
        return;
    }

    grid.innerHTML = arquivosFiltrados.map(a => {
        const indexOriginal = estadoSite.arquivos.indexOf(a);
        const icone = obterIcone(a.tipo);
        const isNovo = indexOriginal < 3;
        return `
            <div class="card" onclick="abrirPreview(${indexOriginal})">
                <div class="card-thumb">
                    ${gerarThumb(a)}
                    ${isNovo ? '<span class="tag-novo-card"><i class="fas fa-star"></i> <span>Novo</span></span>' : ''}
                </div>
                <div class="card-body">
                    <span class="card-tag"><i class="fas ${icone}"></i> <span>${escapeHTML(a.tipo)}</span></span>
                    <h3>${escapeHTML(a.nome)}</h3>
                    <p>${escapeHTML(a.descricao || 'Clique para visualizar')}</p>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        ${a.categoria ? `<span class="badge-size" style="background:rgba(212,175,55,0.15); color:#0A1C3A;">${escapeHTML(a.categoria)}</span>` : ''}
                        ${a.tamanho ? `<span class="badge-size">${a.tamanho}</span>` : ''}
                    </div>
                </div>
                <button class="btn-download" onclick="event.stopPropagation(); abrirPreview(${indexOriginal})">
                    <i class="fas fa-eye"></i> <span>Visualizar</span>
                </button>
            </div>
        `;
    }).join('');
}

function gerarThumb(arquivo) {
    const ext = (arquivo.tipo || '').toUpperCase();
    const isImg = ['PNG','JPG','JPEG','GIF','WEBP','SVG','BMP'].includes(ext);
    const isVid = ['MP4','MOV','AVI','WEBM','MKV'].includes(ext);
    const isPdf = ext === 'PDF';
    const isPsd = ext === 'PSD';

    if (isImg && arquivo.preview) return `<img src="${arquivo.preview}" alt="${escapeHTML(arquivo.nome)}" loading="lazy">`;
    if (isVid && arquivo.preview) return `<div class="thumb-video"><img src="${arquivo.preview}" alt=""><div class="play-overlay"><i class="fas fa-play"></i></div></div>`;
    if (isPdf) return `<div class="thumb-fallback pdf"><i class="fas fa-file-pdf"></i><span>PDF</span></div>`;
    if (isPsd) return `<div class="thumb-fallback" style="color:#D4AF37;"><i class="fas fa-file-alt"></i><span>PSD</span></div>`;
    return `<div class="thumb-fallback"><i class="fas fa-file"></i></div>`;
}

function obterIcone(tipo) {
    const t = (tipo || '').toLowerCase();
    if (t.includes('pdf')) return 'fa-file-pdf';
    if (t.includes('png') || t.includes('jpg') || t.includes('jpeg') || t.includes('gif') || t.includes('webp')) return 'fa-file-image';
    if (t.includes('ppt')) return 'fa-file-powerpoint';
    if (t.includes('doc')) return 'fa-file-word';
    if (t.includes('xls') || t.includes('csv')) return 'fa-file-excel';
    if (t.includes('psd') || t.includes('ai')) return 'fa-file-alt';
    if (t.includes('zip') || t.includes('rar')) return 'fa-file-archive';
    if (t.includes('mp4') || t.includes('mov')) return 'fa-file-video';
    if (t.includes('mp3') || t.includes('wav')) return 'fa-file-audio';
    return 'fa-file';
}

// ============================================================
// BUSCA
// ============================================================
function inicializarBusca() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    input.addEventListener('input', function () {
        estadoSite.buscaAtiva = this.value.trim();
        renderizarArquivos();
    });
}

// ============================================================
// CARROSSEL
// ============================================================
function renderizarCarrossel() {
    const track = document.getElementById('carouselTrack');
    const dotsContainer = document.getElementById('dotsContainer');
    if (!track) return;

    const slides = [];
    estadoSite.carrossel.forEach(s => {
        slides.push({ tipo: 'aviso', titulo: s.titulo, descricao: s.descricao, badge: s.badge || 'Aviso', link: s.link, textoBotao: s.textoBotao || 'Saber mais', arquivoIndex: null });
    });

    estadoSite.arquivos.slice(0, 5).forEach((arq, index) => {
        slides.push({ tipo: 'arquivo', titulo: arq.nome, descricao: arq.descricao || `Novo material disponível: ${arq.tipo}`, badge: 'Novo', arquivoIndex: index, arquivo: arq });
    });

    if (slides.length === 0) {
        slides.push({ tipo: 'aviso', titulo: 'Bem-vindo ao Portal', descricao: 'Acesse materiais exclusivos, manuais e apresentações.', badge: 'Novo', link: '#downloads', textoBotao: 'Explorar' });
    }

    track.innerHTML = slides.map((s, i) => {
        const isArquivo = s.tipo === 'arquivo';
        const badgeIcon = isArquivo ? 'fa-star' : 'fa-bullhorn';
        const temPreviewImg = isArquivo && s.arquivo.preview && isImagem(s.arquivo.tipo);

        return `
            <div class="carousel-slide ${i === 0 ? 'active' : ''}">
                <div class="slide-content">
                    <span class="slide-badge ${isArquivo ? 'badge-novo' : ''}">
                        <i class="fas ${badgeIcon}"></i><span>${escapeHTML(s.badge)}</span>
                    </span>
                    <h3>${escapeHTML(s.titulo)}</h3>
                    <p>${escapeHTML(s.descricao)}</p>
                    <div class="slide-actions">
                        ${isArquivo
                            ? `<button class="btn-slide btn-slide-primary" onclick="abrirPreview(${s.arquivoIndex})"><i class="fas fa-eye"></i> <span>Ver Arquivo</span></button>`
                            : `<a href="${s.link || '#downloads'}" class="btn-slide btn-slide-primary"><i class="fas fa-arrow-right"></i> <span>${escapeHTML(s.textoBotao)}</span></a>`
                        }
                        <a href="#downloads" class="btn-slide btn-slide-ghost"><i class="fas fa-download"></i> <span>Downloads</span></a>
                    </div>
                </div>
                ${temPreviewImg ? `<div class="slide-thumb"><img src="${s.arquivo.preview}" alt="${escapeHTML(s.arquivo.nome)}" loading="lazy"></div>` : `<div class="slide-thumb slide-thumb-icon"><i class="fas ${obterIcone(s.arquivo?.tipo || 'file')}"></i></div>`}
            </div>
        `;
    }).join('');

    dotsContainer.innerHTML = slides.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" onclick="irParaSlide(${i})"></span>`).join('');
}

function isImagem(tipo) {
    return ['PNG','JPG','JPEG','GIF','WEBP','SVG','BMP'].includes((tipo || '').toUpperCase());
}

function inicializarCarrossel() {
    const prev = document.getElementById('prevBtn');
    const next = document.getElementById('nextBtn');
    if (prev) prev.addEventListener('click', () => { irParaSlide(estadoSite.slideAtual - 1); reiniciarAutoPlay(); });
    if (next) next.addEventListener('click', () => { irParaSlide(estadoSite.slideAtual + 1); reiniciarAutoPlay(); });
    iniciarAutoPlay();
}

function irParaSlide(n) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    if (!slides.length) return;
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    estadoSite.slideAtual = (n + slides.length) % slides.length;
    slides[estadoSite.slideAtual].classList.add('active');
    dots[estadoSite.slideAtual].classList.add('active');
}

function iniciarAutoPlay() {
    clearInterval(estadoSite.carrosselInterval);
    estadoSite.carrosselInterval = setInterval(() => irParaSlide(estadoSite.slideAtual + 1), 7000);
}

function reiniciarAutoPlay() {
    clearInterval(estadoSite.carrosselInterval);
    iniciarAutoPlay();
}

// ============================================================
// CONTATO
// ============================================================
function renderizarContato() {
    const c = estadoSite.config;
    const email = c.Email_Contato || 'marketing@ieadcuiaba.com.br';
    const insta = (c.Instagram || '@ieadcuiaba').replace('@', '');

    const eLink = document.getElementById('contatoEmail');
    const eTxt = document.getElementById('contatoEmailTexto');
    if (eLink) eLink.href = 'mailto:' + email;
    if (eTxt) eTxt.textContent = email;

    const iLink = document.getElementById('contatoInstagram');
    const iTxt = document.getElementById('contatoInstagramTexto');
    if (iLink) iLink.href = 'https://instagram.com/' + insta;
    if (iTxt) iTxt.textContent = '@' + insta;

    const wLink = document.getElementById('contatoWhatsapp');
    if (wLink) wLink.href = 'https://wa.me/5565999999999';
}

// ============================================================
// IEAD CREATIVE - LISTAGEM
// ============================================================
function renderizarCreative() {
    const grid = document.getElementById('creativeGrid');
    if (!grid) return;

    const filtrados = estadoSite.criativos.filter(c => {
        if (!estadoSite.creativeBusca) return true;
        const t = estadoSite.creativeBusca.toLowerCase();
        return (c.nome || '').toLowerCase().includes(t) || (c.descricao || '').toLowerCase().includes(t);
    });

    if (!filtrados.length) {
        grid.innerHTML = `<div class="empty-categoria" style="grid-column:1/-1;"><i class="fas fa-magic"></i><h3>Nenhum template PSD disponível</h3><p>Os templates aparecerão aqui quando forem enviados.</p></div>`;
        return;
    }

    grid.innerHTML = filtrados.map(c => {
        const indexOriginal = estadoSite.criativos.indexOf(c);
        return `
            <div class="creative-card" onclick="creativeAbrirEditor(${indexOriginal})">
                <div class="creative-card-thumb">
                    ${c.preview ? `<img src="${c.preview}" alt="${escapeHTML(c.nome)}" loading="lazy">` : `<i class="fas fa-file-alt psd-icon"></i>`}
                    <span class="creative-card-badge">PSD</span>
                </div>
                <div class="creative-card-body">
                    <h3>${escapeHTML(c.nome)}</h3>
                    <p>${escapeHTML(c.descricao || 'Template editável disponível')}</p>
                    <button class="creative-card-btn"><i class="fas fa-magic"></i> Abrir no Editor</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderizarCreativeMeus() {
    const grid = document.getElementById('creativeMeusGrid');
    if (!grid) return;

    const meus = estadoSite.criativosPublicos || [];

    if (!meus.length) {
        grid.innerHTML = `<p style="color:rgba(255,255,255,0.5); text-align:center; grid-column:1/-1; padding:40px;">Nenhum PSD enviado ainda.</p>`;
        return;
    }

    grid.innerHTML = meus.map(c => {
        return `
            <div class="creative-card">
                <div class="creative-card-thumb">
                    ${c.preview ? `<img src="${c.preview}" alt="${escapeHTML(c.nome)}" loading="lazy">` : `<i class="fas fa-file-alt psd-icon"></i>`}
                    <span class="creative-card-badge" style="background:#28A745;">Enviado</span>
                </div>
                <div class="creative-card-body">
                    <h3>${escapeHTML(c.nome)}</h3>
                    <p>${escapeHTML(c.descricao || 'Seu arquivo enviado')}</p>
                    <button class="creative-card-btn" onclick="creativeAbrirEditorPublico('${c.fileId}')"><i class="fas fa-magic"></i> Abrir no Editor</button>
                </div>
            </div>
        `;
    }).join('');
}

function creativeTrocarAba(aba) {
    estadoSite.creativeAbaAtiva = aba;
    document.querySelectorAll('.creative-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.creative-panel').forEach(p => p.classList.remove('active'));

    if (aba === 'templates') {
        document.querySelector('.creative-tab:nth-child(1)').classList.add('active');
        document.getElementById('creativePanelTemplates').classList.add('active');
    } else {
        document.querySelector('.creative-tab:nth-child(2)').classList.add('active');
        document.getElementById('creativePanelMeus').classList.add('active');
    }
}

function inicializarBuscaCreative() {
    const input = document.getElementById('creativeBusca');
    if (!input) return;
    input.addEventListener('input', function () {
        estadoSite.creativeBusca = this.value.trim();
        renderizarCreative();
    });
}

// ============================================================
// UPLOAD PÚBLICO NA IEAD CREATIVE
// ============================================================
function inicializarUploadCreative() {
    const uploadArea = document.getElementById('creativeUploadArea');
    const inputFile = document.getElementById('creativeUploadInput');
    if (!uploadArea || !inputFile) return;

    uploadArea.addEventListener('click', () => inputFile.click());

    uploadArea.addEventListener('dragover', e => {
        e.preventDefault();
        uploadArea.style.background = '#FFF9E6';
        uploadArea.style.borderColor = '#0A1C3A';
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.background = 'white';
        uploadArea.style.borderColor = '#D4AF37';
    });
    uploadArea.addEventListener('drop', e => {
        e.preventDefault();
        uploadArea.style.background = 'white';
        uploadArea.style.borderColor = '#D4AF37';
        if (e.dataTransfer.files.length) {
            inputFile.files = e.dataTransfer.files;
            processarUploadCreative(e.dataTransfer.files[0]);
        }
    });

    inputFile.addEventListener('change', () => {
        if (inputFile.files.length) {
            processarUploadCreative(inputFile.files[0]);
        }
    });
}

async function processarUploadCreative(file) {
    const progressDiv = document.getElementById('creativeUploadProgress');
    const statusEl = document.getElementById('creativeUploadStatus');
    const barEl = document.getElementById('creativeUploadBar');
    const pctEl = document.getElementById('creativeUploadPercent');

    progressDiv.style.display = 'block';
    statusEl.textContent = '⏳ Lendo arquivo...';
    barEl.style.width = '0%';
    pctEl.textContent = '0%';

    if (!file.name.toLowerCase().endsWith('.psd')) {
        statusEl.textContent = '❌ Por favor, envie apenas arquivos .psd';
        statusEl.style.color = '#FF3B30';
        return;
    }

    const LIMITE_MB = 50;
    const tamanhoMB = file.size / (1024 * 1024);

    if (tamanhoMB > LIMITE_MB) {
        statusEl.innerHTML = `❌ Arquivo muito grande (${tamanhoMB.toFixed(1)} MB).<br>Limite: <strong>${LIMITE_MB} MB</strong>.`;
        statusEl.style.color = '#FF3B30';
        return;
    }

    statusEl.textContent = `⏳ Preparando ${file.name} (${tamanhoMB.toFixed(1)} MB)...`;
    statusEl.style.color = '#0A1C3A';

    try {
        barEl.style.width = '20%';
        pctEl.textContent = '20%';
        statusEl.textContent = '⏳ Convertendo arquivo...';

        const base64 = await window.fileToBase64(file);

        barEl.style.width = '50%';
        pctEl.textContent = '50%';
        statusEl.textContent = '⏳ Enviando PSD para o Google Drive...';

        const result = await window.apiPost({
            acao: 'creative_upload',
            nomeArquivo: file.name,
            tipoMime: file.type || 'image/vnd.adobe.photoshop',
            dadosBase64: base64.split(',')[1],
            nome: file.name.replace(/\.[^/.]+$/, ''),
            descricao: 'Enviado pelo site'
        });

        barEl.style.width = '100%';
        pctEl.textContent = '100%';

        if (result && result.status === 'ok') {
            statusEl.textContent = '✅ PSD enviado com sucesso!';
            statusEl.style.color = '#28A745';

            estadoSite.criativosPublicos.push({
                nome: file.name.replace(/\.[^/.]+$/, ''),
                descricao: 'Enviado pelo site',
                fileId: result.fileId,
                preview: result.preview || '',
                link: result.link || '',
                link_download: result.link || ''
            });

            setTimeout(() => {
                progressDiv.style.display = 'none';
                renderizarCreativeMeus();
                carregarDadosSite().then(() => renderizarCreative());
            }, 1500);
        } else {
            statusEl.textContent = `❌ ${result?.mensagem || 'Erro ao enviar'}`;
            statusEl.style.color = '#FF3B30';
        }
    } catch (err) {
        console.error(err);
        statusEl.textContent = `❌ Erro: ${err.message}`;
        statusEl.style.color = '#FF3B30';
    }
}

// ============================================================
// ⭐ PHOTOPEA - ESTRATÉGIA CORRETA
// ============================================================
// Referência: https://www.photopea.com/api/
//
// O Photopea aceita arquivos via postMessage SOMENTE quando:
//   1. O iframe foi carregado DIRETO de https://www.photopea.com/
//   2. Enviamos o ArrayBuffer como transferable
//   3. Esperamos o Photopea estar pronto (ele emite um evento)
//
// Estratégia usada aqui:
//   1. Carrega o Photopea com um arquivo de config vazio
//   2. Espera 5 segundos (tempo de inicialização)
//   3. Envia o ArrayBuffer do PSD
// ============================================================

function creativeAbrirEditor(index) {
    const arquivo = estadoSite.criativos[index];
    if (!arquivo) {
        alert('Arquivo não encontrado.');
        return;
    }
    abrirEditorComArquivo(arquivo);
}

function creativeAbrirEditorPublico(fileId) {
    const arquivo = estadoSite.criativosPublicos.find(x => x.fileId === fileId);
    if (arquivo) {
        abrirEditorComArquivo(arquivo);
    } else {
        const naLista = estadoSite.criativos.find(x => x.fileId === fileId);
        if (naLista) abrirEditorComArquivo(naLista);
        else alert('Arquivo não encontrado.');
    }
}

async function abrirEditorComArquivo(arquivo) {
    const modal = document.getElementById('editorModal');
    const iframe = document.getElementById('editorIframe');
    const titulo = document.getElementById('editorTitulo');

    titulo.textContent = `Editando: ${arquivo.nome}`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Remove loading antigo se houver
    const oldLoading = document.getElementById('editorLoading');
    if (oldLoading) oldLoading.remove();

    // Cria div de loading
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'editorLoading';
    loadingDiv.style.cssText = `
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(10, 28, 58, 0.95);
        color: #D4AF37;
        padding: 30px 50px;
        border-radius: 16px;
        font-family: Inter, sans-serif;
        font-weight: 700;
        z-index: 10;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        min-width: 280px;
    `;
    loadingDiv.innerHTML = `
        <div style="width:50px;height:50px;border:4px solid rgba(212,175,55,0.2);border-top-color:#D4AF37;border-radius:50%;margin:0 auto 18px;animation:spin 1s linear infinite;"></div>
        <p style="margin-bottom:8px; font-size:1.05rem;">Carregando PSD...</p>
        <p id="editorLoadingStatus" style="font-size:0.85rem;color:rgba(255,255,255,0.7);font-weight:400;">Preparando arquivo</p>
    `;

    const bodyParent = iframe.parentElement;
    bodyParent.style.position = 'relative';
    bodyParent.appendChild(loadingDiv);

    // Adiciona animação de spin se não existir
    if (!document.getElementById('spinAnimation')) {
        const style = document.createElement('style');
        style.id = 'spinAnimation';
        style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }

    const statusEl = () => document.getElementById('editorLoadingStatus');

    const fileId = arquivo.fileId || extrairFileId(arquivo.link);
    if (!fileId) {
        loadingDiv.innerHTML = '<p style="color:#FF6B6B;">❌ fileId não encontrado</p>';
        return;
    }

    statusEl().textContent = 'Baixando arquivo do Google Drive...';

    // ⭐ 1. Baixa o PSD via Apps Script (evita CORS)
    const resp = await window.apiGet('baixar_psd', { fileId: fileId });

    if (!resp || resp.status !== 'ok') {
        loadingDiv.innerHTML = `<p style="color:#FF6B6B;">❌ ${resp?.mensagem || 'Erro ao baixar arquivo'}</p>
            <button onclick="editorFechar()" style="margin-top:15px;padding:10px 20px;background:#D4AF37;color:#0A1C3A;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Fechar</button>`;
        return;
    }

    statusEl().textContent = `Arquivo baixado (${resp.tamanhoMB} MB). Preparando...`;

    // ⭐ 2. Converte Base64 para ArrayBuffer
    const binaryString = atob(resp.base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;

    statusEl().textContent = 'Abrindo editor Photopea...';

    // ⭐ 3. Carrega o Photopea LIMPO (sem arquivo)
    // Estratégia: usa postMessage com o ArrayBuffer após o Photopea estar pronto
    iframe.src = 'https://www.photopea.com/';

    // Flag para não enviar 2x
    let arquivoEnviado = false;

    // Listener de mensagens
    const photopeaHandler = (event) => {
        if (event.source !== iframe.contentWindow) return;

        try {
            // O Photopea pode enviar strings JSON
            const data = event.data;
            console.log('📨 Photopea:', data);

            // Quando o Photopea está pronto, ele envia "done" ou {}
            // Vamos enviar o arquivo após 3 segundos de qualquer forma

        } catch (err) {}
    };

    window.addEventListener('message', photopeaHandler);
    window._photopeaHandler = photopeaHandler;

    // ⭐ 4. Aguarda o Photopea carregar e envia o arquivo
    iframe.onload = () => {
        console.log('✅ Photopea iframe carregado');

        // Aguarda 4 segundos para o Photopea inicializar completamente
        setTimeout(() => {
            if (arquivoEnviado) return;
            arquivoEnviado = true;

            console.log('📤 Enviando PSD para o Photopea...');
            statusEl().textContent = 'Enviando PSD para o editor...';

            try {
                // Envia o ArrayBuffer como transferable
                iframe.contentWindow.postMessage(arrayBuffer, '*', [arrayBuffer]);

                console.log('✅ PSD enviado com sucesso');

                // Remove o loading após 2s
                setTimeout(() => {
                    if (loadingDiv.parentElement) loadingDiv.remove();
                }, 2000);

            } catch (err) {
                console.error('❌ Erro ao enviar para Photopea:', err);
                loadingDiv.innerHTML = `<p style="color:#FF6B6B;">❌ ${err.message}</p>
                    <p style="font-size:0.8rem;color:rgba(255,255,255,0.6);margin-top:10px;">Tente novamente ou use outro navegador.</p>`;
            }
        }, 4000);
    };

    // Fallback: se o iframe.onload não disparar, força o envio após 8s
    setTimeout(() => {
        if (arquivoEnviado) return;
        arquivoEnviado = true;

        console.log('📤 Enviando PSD (fallback)...');
        try {
            iframe.contentWindow.postMessage(arrayBuffer, '*', [arrayBuffer]);
            setTimeout(() => {
                if (loadingDiv.parentElement) loadingDiv.remove();
            }, 2000);
        } catch (err) {
            console.error('❌ Erro no fallback:', err);
        }
    }, 8000);

    // Fallback final: remove o loading após 12s
    setTimeout(() => {
        if (loadingDiv.parentElement) loadingDiv.remove();
    }, 12000);
}

function editorFechar() {
    const modal = document.getElementById('editorModal');
    const iframe = document.getElementById('editorIframe');

    modal.classList.remove('active');
    document.body.style.overflow = '';

    setTimeout(() => {
        iframe.src = 'about:blank';
    }, 300);

    const loading = document.getElementById('editorLoading');
    if (loading) loading.remove();

    if (window._photopeaHandler) {
        window.removeEventListener('message', window._photopeaHandler);
        window._photopeaHandler = null;
    }
}

function editorExportar(formato) {
    const iframe = document.getElementById('editorIframe');
    if (!iframe || !iframe.contentWindow) {
        alert('Editor não está pronto.');
        return;
    }

    let script = '';
    if (formato === 'png') script = `app.activeDocument.saveToOE("png");`;
    else if (formato === 'jpg') script = `app.activeDocument.saveToOE("jpg");`;
    else if (formato === 'pdf') script = `app.activeDocument.saveToOE("pdf");`;

    iframe.contentWindow.postMessage(script, '*');

    const aviso = document.createElement('div');
    aviso.style.cssText = `position:fixed; bottom:20px; right:20px; z-index:999999; background:#D4AF37; color:#0A1C3A; padding:15px 20px; border-radius:12px; font-weight:700; box-shadow:0 8px 25px rgba(0,0,0,0.3); font-family:Inter, sans-serif; font-size:0.9rem;`;
    aviso.textContent = `📥 Exportando ${formato.toUpperCase()}...`;
    document.body.appendChild(aviso);
    setTimeout(() => aviso.remove(), 5000);
}

function editorSalvarNoDrive() {
    const aviso = document.createElement('div');
    aviso.style.cssText = `position:fixed; bottom:20px; right:20px; z-index:999999; background:#D4AF37; color:#0A1C3A; padding:15px 20px; border-radius:12px; font-weight:700; box-shadow:0 8px 25px rgba(0,0,0,0.3); font-family:Inter, sans-serif; font-size:0.9rem; max-width:320px;`;
    aviso.innerHTML = `<strong>💾 Salvar no Drive</strong><br>Use o menu <strong>"File → Save as PSD"</strong> no editor e depois faça upload novamente pelo formulário.`;
    document.body.appendChild(aviso);
    setTimeout(() => aviso.remove(), 8000);
}

// ============================================================
// PREVIEW MODAL (Downloads)
// ============================================================
function inicializarPreview() {
    if (!document.getElementById('previewModal')) {
        const modal = document.createElement('div');
        modal.id = 'previewModal';
        modal.className = 'preview-modal';
        modal.innerHTML = `
            <div class="preview-modal-overlay" onclick="fecharPreview()"></div>
            <div class="preview-modal-content">
                <button class="preview-close" onclick="fecharPreview()"><i class="fas fa-times"></i></button>
                <div class="preview-modal-header">
                    <div class="preview-title-area">
                        <i class="fas fa-file preview-title-icon" id="previewTitleIcon"></i>
                        <div><h3 id="previewTitulo">Nome do arquivo</h3><p id="previewMeta">Tipo • Tamanho</p></div>
                    </div>
                </div>
                <div class="preview-modal-body" id="previewBody"></div>
                <div class="preview-modal-footer">
                    <button onclick="fecharPreview()" class="btn-secondary-preview"><i class="fas fa-arrow-left"></i> <span>Voltar</span></button>
                    <a id="previewDownloadBtn" href="#" download target="_blank" rel="noopener noreferrer" class="btn-download-preview"><i class="fas fa-download"></i> <span>Baixar Arquivo</span></a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { fecharPreview(); editorFechar(); }
    });
}

function abrirPreview(index) {
    const arquivo = estadoSite.arquivos[index];
    if (!arquivo) return;

    const modal = document.getElementById('previewModal');
    const body = document.getElementById('previewBody');
    document.getElementById('previewTitulo').textContent = arquivo.nome;
    document.getElementById('previewMeta').textContent = `${arquivo.tipo}${arquivo.tamanho ? ' • ' + arquivo.tamanho : ''}${arquivo.categoria ? ' • ' + arquivo.categoria : ''}`;
    document.getElementById('previewTitleIcon').className = `fas ${obterIcone(arquivo.tipo)} preview-title-icon`;
    document.getElementById('previewDownloadBtn').href = arquivo.link;

    const ext = (arquivo.tipo || '').toUpperCase();
    const isImg = ['PNG','JPG','JPEG','GIF','WEBP','SVG','BMP'].includes(ext);
    const isVid = ['MP4','MOV','AVI','WEBM','MKV'].includes(ext);
    const isPdf = ext === 'PDF';
    const fileId = extrairFileId(arquivo.link);

    if (isImg) {
        const urlHD = fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600` : arquivo.link;
        body.innerHTML = `<div class="preview-image-wrapper"><img src="${urlHD}" alt="${escapeHTML(arquivo.nome)}"></div>`;
    } else if (isVid) {
        const url = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : arquivo.link;
        body.innerHTML = `<div class="preview-video-wrapper"><iframe src="${url}" allow="autoplay" allowfullscreen frameborder="0"></iframe></div>`;
    } else if (isPdf) {
        const url = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : arquivo.link;
        body.innerHTML = `<div class="preview-pdf-wrapper"><iframe src="${url}" allowfullscreen frameborder="0"></iframe></div>`;
    } else {
        body.innerHTML = `<div class="preview-generic"><div class="preview-generic-icon"><i class="fas ${obterIcone(arquivo.tipo)}"></i></div><h4>${escapeHTML(arquivo.nome)}</h4><p>${escapeHTML(arquivo.descricao || 'Este tipo de arquivo não possui pré-visualização.')}</p><p class="preview-hint">Clique em <strong>Baixar Arquivo</strong> para fazer o download.</p></div>`;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharPreview() {
    const modal = document.getElementById('previewModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
        const body = document.getElementById('previewBody');
        if (body) body.innerHTML = '';
    }, 300);
}

function extrairFileId(url) {
    if (!url) return null;
    const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m1) return m1[1];
    const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m2) return m2[1];
    return null;
}

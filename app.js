/* ============================================================
 * SITE PÚBLICO - Marketing IEAD v48
 * - Dropdown de categorias (substitui as abas antigas)
 * - Photopea abre direto no editor
 * - Mobile-friendly
 * ============================================================ */

let estadoSite = {
    config: {},
    arquivos: [],
    carrossel: [],
    menus: [],
    categorias: [],
    criativos: [],
    slideAtual: 0,
    carrosselInterval: null,
    rotaAtual: 'inicio',
    categoriaAtiva: 'todas',
    buscaAtiva: '',
    creativeAbaAtiva: 'templates',
    creativeBusca: '',
    creativeArquivoAtual: null,
    usuario: null,
    criativoPSD: null,
    criativoCapa: null,
    cadFotoBase64: null,
    cadFotoTipoMime: null
};

// ============================================================
// HELPERS
// ============================================================
function paraString(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor);
}

function somenteDigitos(valor) {
    return paraString(valor).replace(/\D/g, '');
}

function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) || window.innerWidth < 768;
}

// ============================================================
// SPLASH
// ============================================================
let splashFechado = false;

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
    if (splashFechado) return;
    splashFechado = true;

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
    const timeoutSeguranca = setTimeout(() => {
        atualizarProgresso(100);
        esconderSplash();
    }, 8000);

    try {
        atualizarProgresso(10);
        await new Promise(r => setTimeout(r, 100));
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
        atualizarProgresso(85);

        inicializarBusca();
        inicializarBuscaCreative();
        inicializarModalEnvio();
        inicializarAuth();
        inicializarCarrossel();
        inicializarPreview();
        inicializarRotas();
        inicializarResponsividade();

        carregarUsuarioLogado();
        atualizarInterfaceAuth();

        atualizarProgresso(100);
        await new Promise(r => setTimeout(r, 400));
    } catch (err) {
        console.error('❌ Erro na inicialização:', err);
        atualizarProgresso(100);
    } finally {
        clearTimeout(timeoutSeguranca);
        esconderSplash();
    }
});

// ============================================================
// RESPONSIVIDADE
// ============================================================
function inicializarResponsividade() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            irParaSlide(estadoSite.slideAtual);
        }, 250);
    });

    const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', () => setTimeout(setVH, 100));
}

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
    try {
        const dados = await apiGet('tudo');
        if (dados && !dados.status) {
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
    } catch (err) {
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

    if (c.Titulo_Site) document.title = paraString(c.Titulo_Site);

    if (c.Logo_URL) {
        const logoImg = document.getElementById('siteLogo');
        if (logoImg) {
            logoImg.src = paraString(c.Logo_URL);
            logoImg.onerror = () => {
                logoImg.src = "https://i.ibb.co/3Y5PMRwz/2600211b-5791-45a6-8ce0-1c8eb30344f6.jpg";
            };
        }
    }

    if (c.Subtitulo_Hero) {
        const sub = document.getElementById('siteSubtitulo');
        if (sub) sub.textContent = paraString(c.Subtitulo_Hero).split('.')[0] || 'Cuiabá e Região';
    }

    const heroT = document.getElementById('heroTitulo');
    if (heroT) heroT.textContent = paraString(c.Titulo_Site) || CONFIG.TEXTOS_PADRAO.titulo;

    const heroD = document.getElementById('heroDescricao');
    if (heroD) heroD.textContent = paraString(c.Descricao_Hero) || CONFIG.TEXTOS_PADRAO.descricaoHero;

    const heroB = document.getElementById('heroBotao');
    if (heroB) heroB.textContent = paraString(c.Texto_Botao_Hero) || CONFIG.TEXTOS_PADRAO.textoBotaoHero;

    const rod = document.getElementById('siteRodape');
    if (rod) rod.textContent = paraString(c.Texto_Rodape) || CONFIG.TEXTOS_PADRAO.rodape;

    const socialDiv = document.getElementById('siteSocial');
    if (socialDiv) {
        let socialHTML = '';
        if (c.Instagram) {
            const insta = paraString(c.Instagram).replace('@', '');
            socialHTML += `<a href="https://instagram.com/${insta}" target="_blank" rel="noopener"><i class="fab fa-instagram"></i></a>`;
        }
        if (c.Email_Contato) {
            socialHTML += `<a href="mailto:${paraString(c.Email_Contato)}"><i class="fas fa-envelope"></i></a>`;
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
// CATEGORIAS - DROPDOWN
// ============================================================
function renderizarCategorias() {
    const botao = document.getElementById('categoriasToggle');
    const nomeEl = document.getElementById('categoriaSelecionadaNome');
    const countEl = document.getElementById('categoriaSelecionadaCount');
    const listaEl = document.getElementById('categoriasLista');
    if (!botao || !listaEl) return;

    // Conta arquivos por categoria
    const contagem = {};
    estadoSite.arquivos.forEach(a => {
        const cat = paraString(a.categoria || 'Geral').trim();
        contagem[cat] = (contagem[cat] || 0) + 1;
    });

    // Monta o mapa de categorias
    const categoriasMap = new Map();
    categoriasMap.set('todas', {
        nome: 'Todas as categorias',
        icone: 'fa-th-large',
        total: estadoSite.arquivos.length
    });

    estadoSite.categorias.forEach(c => {
        const nome = paraString(c.nome).trim();
        if (nome && !categoriasMap.has(nome)) {
            categoriasMap.set(nome, {
                nome: nome,
                icone: c.icone || 'fa-folder',
                total: contagem[nome] || 0
            });
        }
    });

    Object.keys(contagem).forEach(nome => {
        if (!categoriasMap.has(nome)) {
            categoriasMap.set(nome, {
                nome: nome,
                icone: 'fa-folder',
                total: contagem[nome]
            });
        }
    });

    // Atualiza o texto do botão com a categoria ativa
    const catAtiva = categoriasMap.get(estadoSite.categoriaAtiva) || categoriasMap.get('todas');
    if (nomeEl) nomeEl.textContent = catAtiva.nome;
    if (countEl) countEl.textContent = catAtiva.total;

    // Popula a lista de categorias
    listaEl.innerHTML = Array.from(categoriasMap.values()).map(cat => {
        const isActive =
            estadoSite.categoriaAtiva === cat.nome ||
            (estadoSite.categoriaAtiva === 'todas' && cat.nome === 'Todas as categorias');

        return `
            <button class="categoria-item ${isActive ? 'active' : ''}"
                onclick="selecionarCategoriaDropdown('${cat.nome.replace(/'/g, "&#39;")}')"
                data-nome="${cat.nome.toLowerCase()}">
                <i class="fas ${cat.icone}"></i>
                <span class="categoria-item-nome">${escapeHTML(cat.nome)}</span>
                <span class="categoria-item-count">${cat.total}</span>
            </button>
        `;
    }).join('');
}

function toggleCategoriasMenu() {
    const dropdown = document.getElementById('categoriasDropdown');
    const botao = document.getElementById('categoriasToggle');
    if (!dropdown || !botao) return;

    const aberto = dropdown.classList.contains('open');

    if (aberto) {
        dropdown.classList.remove('open');
        botao.classList.remove('active');
    } else {
        dropdown.classList.add('open');
        botao.classList.add('active');
        setTimeout(() => {
            const filtro = document.getElementById('categoriasFiltro');
            if (filtro) filtro.focus();
        }, 200);
    }
}

function selecionarCategoriaDropdown(nomeCategoria) {
    const nomeReal = nomeCategoria === 'Todas as categorias' ? 'todas' : nomeCategoria;

    estadoSite.categoriaAtiva = nomeReal;
    renderizarCategorias();
    renderizarArquivos();

    // Fecha o dropdown
    const dropdown = document.getElementById('categoriasDropdown');
    const botao = document.getElementById('categoriasToggle');
    if (dropdown) dropdown.classList.remove('open');
    if (botao) botao.classList.remove('active');

    // Limpa o filtro
    const filtro = document.getElementById('categoriasFiltro');
    if (filtro) {
        filtro.value = '';
        filtrarCategoriasDropdown();
    }
}

function filtrarCategoriasDropdown() {
    const filtro = document.getElementById('categoriasFiltro');
    const lista = document.querySelectorAll('.categoria-item');
    if (!filtro) return;

    const termo = filtro.value.toLowerCase().trim();

    lista.forEach(item => {
        const nome = item.dataset.nome || '';
        item.style.display = nome.includes(termo) ? 'flex' : 'none';
    });
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.categorias-wrapper');
    const dropdown = document.getElementById('categoriasDropdown');
    const botao = document.getElementById('categoriasToggle');

    if (wrapper && !wrapper.contains(e.target)) {
        if (dropdown) dropdown.classList.remove('open');
        if (botao) botao.classList.remove('active');
    }
});

// Mantém compatibilidade com função antiga (usada em outros lugares)
function selecionarCategoria(nomeCategoria) {
    selecionarCategoriaDropdown(nomeCategoria);
}

// ============================================================
// ARQUIVOS
// ============================================================
function renderizarArquivos() {
    const grid = document.getElementById('downloadsGrid');
    const info = document.getElementById('resultadoInfo');
    if (!grid) return;

    let arquivosFiltrados = estadoSite.arquivos.slice();
    const catAtiva = paraString(estadoSite.categoriaAtiva || 'todas').trim();

    if (catAtiva && catAtiva.toLowerCase() !== 'todas') {
        arquivosFiltrados = arquivosFiltrados.filter(a =>
            paraString(a.categoria || 'Geral').trim() === catAtiva
        );
    }

    if (estadoSite.buscaAtiva) {
        const t = estadoSite.buscaAtiva.toLowerCase();
        arquivosFiltrados = arquivosFiltrados.filter(a =>
            paraString(a.nome).toLowerCase().includes(t) ||
            paraString(a.descricao).toLowerCase().includes(t) ||
            paraString(a.tipo).toLowerCase().includes(t)
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
        const msg = catAtiva.toLowerCase() === 'todas'
            ? 'Nenhum arquivo disponível.'
            : `Nenhum arquivo na categoria "${catAtiva}".`;

        grid.innerHTML = `
            <div class="empty-categoria">
                <i class="fas fa-folder-open"></i>
                <h3>${msg}</h3>
                <p>${catAtiva.toLowerCase() !== 'todas' ? 'Tente outra categoria.' : 'Os materiais serão adicionados em breve.'}</p>
            </div>
        `;
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
                    <span class="card-tag"><i class="fas ${icone}"></i> <span>${escapeHTML(paraString(a.tipo))}</span></span>
                    <h3>${escapeHTML(paraString(a.nome))}</h3>
                    <p>${escapeHTML(paraString(a.descricao) || 'Clique para visualizar')}</p>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        ${a.categoria ? `<span class="badge-size" style="background:rgba(212,175,55,0.15); color:#0A1C3A;">${escapeHTML(paraString(a.categoria))}</span>` : ''}
                        ${a.tamanho ? `<span class="badge-size">${escapeHTML(paraString(a.tamanho))}</span>` : ''}
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
    const ext = paraString(arquivo.tipo).toUpperCase();
    const isImg = ['PNG','JPG','JPEG','GIF','WEBP','SVG','BMP'].includes(ext);
    const isVid = ['MP4','MOV','AVI','WEBM','MKV'].includes(ext);
    const isPdf = ext === 'PDF';
    const isPsd = ext === 'PSD';

    if (isImg && arquivo.preview) return `<img src="${paraString(arquivo.preview)}" alt="${escapeHTML(paraString(arquivo.nome))}" loading="lazy">`;
    if (isVid && arquivo.preview) return `<div class="thumb-video"><img src="${paraString(arquivo.preview)}" alt=""><div class="play-overlay"><i class="fas fa-play"></i></div></div>`;
    if (isPdf) return `<div class="thumb-fallback pdf"><i class="fas fa-file-pdf"></i><span>PDF</span></div>`;
    if (isPsd) return `<div class="thumb-fallback" style="color:#D4AF37;"><i class="fas fa-file-alt"></i><span>PSD</span></div>`;
    return `<div class="thumb-fallback"><i class="fas fa-file"></i></div>`;
}

function obterIcone(tipo) {
    const t = paraString(tipo).toLowerCase();
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
        slides.push({
            tipo: 'aviso',
            titulo: paraString(s.titulo),
            descricao: paraString(s.descricao),
            badge: paraString(s.badge) || 'Aviso',
            link: paraString(s.link),
            textoBotao: paraString(s.textoBotao) || 'Saber mais',
            arquivoIndex: null
        });
    });

    estadoSite.arquivos.slice(0, 5).forEach((arq, index) => {
        slides.push({
            tipo: 'arquivo',
            titulo: paraString(arq.nome),
            descricao: paraString(arq.descricao) || `Novo material disponível: ${paraString(arq.tipo)}`,
            badge: 'Novo',
            arquivoIndex: index,
            arquivo: arq
        });
    });

    if (slides.length === 0) {
        slides.push({
            tipo: 'aviso',
            titulo: 'Bem-vindo ao Portal',
            descricao: 'Acesse materiais exclusivos.',
            badge: 'Novo',
            link: '#downloads',
            textoBotao: 'Explorar'
        });
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
                ${temPreviewImg ? `<div class="slide-thumb"><img src="${paraString(s.arquivo.preview)}" alt="${escapeHTML(paraString(s.arquivo.nome))}" loading="lazy"></div>` : `<div class="slide-thumb slide-thumb-icon"><i class="fas ${obterIcone(s.arquivo?.tipo || 'file')}"></i></div>`}
            </div>
        `;
    }).join('');

    dotsContainer.innerHTML = slides.map((_, i) =>
        `<span class="dot ${i === 0 ? 'active' : ''}" onclick="irParaSlide(${i})"></span>`
    ).join('');
}

function isImagem(tipo) {
    return ['PNG','JPG','JPEG','GIF','WEBP','SVG','BMP'].includes(paraString(tipo).toUpperCase());
}

function inicializarCarrossel() {
    const prev = document.getElementById('prevBtn');
    const next = document.getElementById('nextBtn');
    if (prev) prev.addEventListener('click', () => { irParaSlide(estadoSite.slideAtual - 1); reiniciarAutoPlay(); });
    if (next) next.addEventListener('click', () => { irParaSlide(estadoSite.slideAtual + 1); reiniciarAutoPlay(); });

    const container = document.querySelector('.carousel-container');
    if (container) {
        let touchStartX = 0;
        let touchEndX = 0;

        container.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        container.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) irParaSlide(estadoSite.slideAtual + 1);
                else irParaSlide(estadoSite.slideAtual - 1);
                reiniciarAutoPlay();
            }
        }
    }

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
    const email = paraString(c.Email_Contato) || 'marketing@ieadcuiaba.com.br';
    const insta = paraString(c.Instagram || '@ieadcuiaba').replace('@', '');

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
        return paraString(c.nome).toLowerCase().includes(t) || paraString(c.descricao).toLowerCase().includes(t);
    });

    if (!filtrados.length) {
        grid.innerHTML = `<div class="empty-categoria" style="grid-column:1/-1;"><i class="fas fa-magic"></i><h3>Nenhum template PSD disponível</h3><p>Os templates aparecerão aqui quando forem enviados.</p></div>`;
        return;
    }

    grid.innerHTML = filtrados.map(c => {
        const indexOriginal = estadoSite.criativos.indexOf(c);
        const nomeAutor = paraString(c.usuarioNome);
        const whatsapp = paraString(c.usuarioWhatsApp);
        const fotoAutor = paraString(c.usuarioFoto) || gerarAvatarInicial(nomeAutor || 'Usuário');
        const whatsappLink = whatsapp ? `https://wa.me/55${somenteDigitos(whatsapp)}` : '';
        const idade = paraString(c.usuarioIdade);
        const congregacao = paraString(c.usuarioCongregacao);
        const cidade = paraString(c.usuarioCidade);

        return `
            <div class="creative-card" onclick="creativeAbrirEditor(${indexOriginal})">
                <div class="creative-card-thumb">
                    ${c.preview ? `<img src="${paraString(c.preview)}" alt="${escapeHTML(paraString(c.nome))}" loading="lazy">` : `<i class="fas fa-file-alt psd-icon"></i>`}
                    <span class="creative-card-badge">PSD</span>
                </div>
                <div class="creative-card-body">
                    <h3>${escapeHTML(paraString(c.nome))}</h3>
                    <p>${escapeHTML(paraString(c.descricao) || 'Template editável disponível')}</p>

                    ${nomeAutor ? `
                        <div class="creative-autor">
                            <img src="${fotoAutor}" class="creative-autor-foto" alt="Autor" onerror="this.src='${gerarAvatarInicial(nomeAutor)}'">
                            <div class="creative-autor-info">
                                <strong>${escapeHTML(nomeAutor)}</strong>
                                <span>${idade ? idade + ' anos • ' : ''}${escapeHTML(congregacao)}${cidade ? ' • ' + escapeHTML(cidade) : ''}</span>
                            </div>
                            ${whatsappLink ? `
                                <a href="${whatsappLink}" target="_blank" class="creative-whatsapp" onclick="event.stopPropagation();">
                                    <i class="fab fa-whatsapp"></i>
                                </a>
                            ` : ''}
                        </div>
                    ` : ''}

                    <button class="creative-card-btn"><i class="fas fa-magic"></i> Abrir no Editor</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderizarCreativeMeus() {
    const grid = document.getElementById('creativeMeusGrid');
    if (!grid) return;

    if (!estadoSite.usuario) {
        grid.innerHTML = '<p style="color:rgba(255,255,255,0.5); text-align:center; grid-column:1/-1; padding:30px;">Faça login para ver seus arquivos.</p>';
        return;
    }

    const meus = estadoSite.criativos.filter(c => paraString(c.usuarioId) === paraString(estadoSite.usuario.id));

    if (!meus.length) {
        grid.innerHTML = `<p style="color:rgba(255,255,255,0.5); text-align:center; grid-column:1/-1; padding:30px;">Você ainda não enviou nenhum PSD.</p>`;
        return;
    }

    grid.innerHTML = meus.map(c => {
        return `
            <div class="creative-card">
                <div class="creative-card-thumb">
                    ${c.preview ? `<img src="${paraString(c.preview)}" alt="${escapeHTML(paraString(c.nome))}" loading="lazy">` : `<i class="fas fa-file-alt psd-icon"></i>`}
                    <span class="creative-card-badge" style="background:#28A745;">Enviado</span>
                </div>
                <div class="creative-card-body">
                    <h3>${escapeHTML(paraString(c.nome))}</h3>
                    <p>${escapeHTML(paraString(c.descricao) || 'Seu arquivo')}</p>
                    <button class="creative-card-btn" onclick="creativeAbrirEditorPublico('${paraString(c.fileId)}')"><i class="fas fa-magic"></i> Abrir no Editor</button>
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
// MODAL DE ENVIO
// ============================================================
function inicializarModalEnvio() {
    const inputPSD = document.getElementById('modalInputPSD');
    const inputCapa = document.getElementById('modalInputCapa');
    const areaPSD = document.getElementById('modalUploadPSD');
    const areaCapa = document.getElementById('modalUploadCapa');

    areaPSD?.addEventListener('click', () => inputPSD.click());
    areaPSD?.addEventListener('dragover', e => { e.preventDefault(); areaPSD.classList.add('dragover'); });
    areaPSD?.addEventListener('dragleave', () => areaPSD.classList.remove('dragover'));
    areaPSD?.addEventListener('drop', e => {
        e.preventDefault();
        areaPSD.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            inputPSD.files = e.dataTransfer.files;
            selecionarPSDModal(e.dataTransfer.files[0]);
        }
    });
    inputPSD?.addEventListener('change', () => {
        if (inputPSD.files.length) selecionarPSDModal(inputPSD.files[0]);
    });

    areaCapa?.addEventListener('click', () => inputCapa.click());
    areaCapa?.addEventListener('dragover', e => { e.preventDefault(); areaCapa.classList.add('dragover'); });
    areaCapa?.addEventListener('dragleave', () => areaCapa.classList.remove('dragover'));
    areaCapa?.addEventListener('drop', e => {
        e.preventDefault();
        areaCapa.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            inputCapa.files = e.dataTransfer.files;
            selecionarCapaModal(e.dataTransfer.files[0]);
        }
    });
    inputCapa?.addEventListener('change', () => {
        if (inputCapa.files.length) selecionarCapaModal(inputCapa.files[0]);
    });
}

function abrirModalEnvio() {
    if (!estadoSite.usuario) { abrirModalAuth(); return; }
    document.getElementById('modalEnvio').classList.add('active');
    document.body.style.overflow = 'hidden';

    estadoSite.criativoPSD = null;
    estadoSite.criativoCapa = null;
    document.getElementById('modalInputPSD').value = '';
    document.getElementById('modalInputCapa').value = '';
    document.getElementById('modalPSDStatus').textContent = '';
    document.getElementById('modalCapaPreview').style.display = 'none';
    document.getElementById('modalUploadCapa').style.display = 'flex';
    document.getElementById('modalTitulo').value = '';
    document.getElementById('modalDescricao').value = '';
    document.getElementById('modalEnvioProgress').style.display = 'none';
    document.getElementById('modalEnvioSubmit').disabled = false;
    document.getElementById('modalEnvioSubmit').innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Enviar PSD';
}

function fecharModalEnvio() {
    document.getElementById('modalEnvio').classList.remove('active');
    document.body.style.overflow = '';
}

function selecionarPSDModal(file) {
    if (!file.name.toLowerCase().endsWith('.psd')) {
        alert('Por favor, envie apenas arquivos .psd');
        return;
    }
    if (file.size > 50 * 1024 * 1024) {
        alert('Arquivo muito grande (máx 50 MB)');
        return;
    }

    estadoSite.criativoPSD = file;

    const statusEl = document.getElementById('modalPSDStatus');
    statusEl.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; color:#28A745; font-weight:700; font-size:0.8rem; margin-top:8px;">
            <i class="fas fa-check-circle"></i>
            ${file.name} (${(file.size/1024/1024).toFixed(2)} MB)
        </div>
    `;

    const tituloInput = document.getElementById('modalTitulo');
    if (tituloInput && !tituloInput.value) {
        tituloInput.value = file.name.replace(/\.[^/.]+$/, '');
    }
}

function selecionarCapaModal(file) {
    if (!file.type.startsWith('image/')) {
        alert('Envie uma imagem PNG ou JPG');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        alert('Capa muito grande (máx 5 MB)');
        return;
    }

    estadoSite.criativoCapa = file;

    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('modalCapaImg').src = e.target.result;
        document.getElementById('modalCapaPreview').style.display = 'block';
        document.getElementById('modalUploadCapa').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function removerCapa() {
    estadoSite.criativoCapa = null;
    document.getElementById('modalInputCapa').value = '';
    document.getElementById('modalCapaPreview').style.display = 'none';
    document.getElementById('modalUploadCapa').style.display = 'flex';
}

async function enviarPSDModal() {
    if (!estadoSite.usuario) { abrirModalAuth(); return; }
    if (!estadoSite.criativoPSD) { alert('Selecione o arquivo PSD!'); return; }
    if (!estadoSite.criativoCapa) { alert('⚠️ A capa do PSD é OBRIGATÓRIA!'); return; }

    const titulo = document.getElementById('modalTitulo').value.trim();
    if (!titulo) { alert('Digite um título para o template'); return; }

    const descricao = document.getElementById('modalDescricao').value.trim();

    const progressDiv = document.getElementById('modalEnvioProgress');
    const statusEl = document.getElementById('modalEnvioStatus');
    const barEl = document.getElementById('modalEnvioBar');
    const pctEl = document.getElementById('modalEnvioPercent');
    const btnSubmit = document.getElementById('modalEnvioSubmit');

    progressDiv.style.display = 'block';
    barEl.style.width = '5%';
    pctEl.textContent = '5%';
    statusEl.textContent = '⏳ Convertendo arquivos...';

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    try {
        const psdBase64 = await window.fileToBase64(estadoSite.criativoPSD);
        barEl.style.width = '30%';
        pctEl.textContent = '30%';
        statusEl.textContent = '⏳ Convertendo capa...';

        const capaBase64 = await window.fileToBase64(estadoSite.criativoCapa);
        barEl.style.width = '50%';
        pctEl.textContent = '50%';
        statusEl.textContent = '⏳ Enviando para o Drive...';

        const result = await window.apiPost({
            acao: 'creative_upload',
            nomeArquivo: estadoSite.criativoPSD.name,
            tipoMime: estadoSite.criativoPSD.type || 'image/vnd.adobe.photoshop',
            dadosBase64: psdBase64.split(',')[1],
            capaBase64: capaBase64.split(',')[1],
            capaTipoMime: estadoSite.criativoCapa.type,
            nome: titulo,
            descricao: descricao,
            usuarioId: estadoSite.usuario.id,
            usuarioNome: estadoSite.usuario.nome,
            usuarioWhatsApp: estadoSite.usuario.whatsapp,
            usuarioCongregacao: estadoSite.usuario.congregacao,
            usuarioIdade: estadoSite.usuario.idade,
            usuarioFoto: estadoSite.usuario.foto || '',
            usuarioCidade: estadoSite.usuario.cidade || ''
        });

        barEl.style.width = '100%';
        pctEl.textContent = '100%';

        if (result && result.status === 'ok') {
            statusEl.innerHTML = '<i class="fas fa-check-circle" style="color:#28A745;"></i> PSD enviado com sucesso!';
            statusEl.style.color = '#28A745';

            setTimeout(async () => {
                fecharModalEnvio();
                await carregarDadosSite();
                renderizarCreative();
                renderizarCreativeMeus();
            }, 1200);
        } else {
            statusEl.textContent = `❌ ${result?.mensagem || 'Erro ao enviar'}`;
            statusEl.style.color = '#FF3B30';
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Enviar PSD';
        }
    } catch (err) {
        console.error(err);
        statusEl.textContent = `❌ Erro: ${err.message}`;
        statusEl.style.color = '#FF3B30';
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Enviar PSD';
    }
}

// ============================================================
// PHOTOPEA - EDITOR
// ============================================================
function creativeAbrirEditor(index) {
    const arquivo = estadoSite.criativos[index];
    if (!arquivo) { alert('Arquivo não encontrado.'); return; }
    abrirEditorComArquivo(arquivo);
}

function creativeAbrirEditorPublico(fileId) {
    const arquivo = estadoSite.criativos.find(x => paraString(x.fileId) === paraString(fileId));
    if (arquivo) abrirEditorComArquivo(arquivo);
    else alert('Arquivo não encontrado.');
}

async function abrirEditorComArquivo(arquivo) {
    const modal = document.getElementById('editorModal');
    const iframe = document.getElementById('editorIframe');
    const titulo = document.getElementById('editorTitulo');

    titulo.textContent = `Editando: ${paraString(arquivo.nome)}`;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const oldLoading = document.getElementById('editorLoading');
    if (oldLoading) oldLoading.remove();

    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'editorLoading';
    loadingDiv.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(10,28,58,0.95); color:#D4AF37; padding:25px 35px; border-radius:16px; font-family:Inter,sans-serif; font-weight:700; z-index:10; text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.6); max-width: 90%; min-width: 220px;`;
    loadingDiv.innerHTML = `
        <div style="width:45px;height:45px;border:4px solid rgba(212,175,55,0.2);border-top-color:#D4AF37;border-radius:50%;margin:0 auto 15px;animation:spin 1s linear infinite;"></div>
        <p style="margin-bottom:6px; font-size:0.95rem;">Carregando PSD...</p>
        <p id="editorLoadingStatus" style="font-size:0.8rem;color:rgba(255,255,255,0.7);font-weight:400;">Preparando arquivo</p>
    `;

    const bodyParent = iframe.parentElement;
    bodyParent.style.position = 'relative';
    bodyParent.appendChild(loadingDiv);

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

    statusEl().textContent = 'Baixando arquivo...';

    const resp = await window.apiGet('baixar_psd', { fileId: fileId });

    if (!resp || resp.status !== 'ok') {
        loadingDiv.innerHTML = `<p style="color:#FF6B6B; font-size:0.85rem;">❌ ${resp?.mensagem || 'Erro ao baixar arquivo'}</p>
            <button onclick="editorFechar()" style="margin-top:12px;padding:10px 18px;background:#D4AF37;color:#0A1C3A;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.85rem;">Fechar</button>`;
        return;
    }

    statusEl().textContent = `Preparando (${resp.tamanhoMB} MB)...`;

    const binaryString = atob(resp.base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;

    statusEl().textContent = 'Abrindo editor...';

    iframe.src = 'https://www.photopea.com/?embedded';

    let arquivoEnviado = false;

    const photopeaHandler = (event) => {
        if (event.source !== iframe.contentWindow) return;
        try { console.log('📨 Photopea:', event.data); } catch (err) {}
    };

    window.addEventListener('message', photopeaHandler);
    window._photopeaHandler = photopeaHandler;

    iframe.onload = () => {
        setTimeout(() => {
            if (arquivoEnviado) return;
            arquivoEnviado = true;

            statusEl().textContent = 'Enviando PSD...';

            try {
                iframe.contentWindow.postMessage(arrayBuffer, '*', [arrayBuffer]);
                setTimeout(() => { if (loadingDiv.parentElement) loadingDiv.remove(); }, 1500);
            } catch (err) {
                loadingDiv.innerHTML = `<p style="color:#FF6B6B;">❌ ${err.message}</p>`;
            }
        }, 800);
    };

    setTimeout(() => {
        if (arquivoEnviado) return;
        arquivoEnviado = true;
        try {
            iframe.contentWindow.postMessage(arrayBuffer, '*', [arrayBuffer]);
            setTimeout(() => { if (loadingDiv.parentElement) loadingDiv.remove(); }, 1500);
        } catch (err) {}
    }, 5000);

    setTimeout(() => { if (loadingDiv.parentElement) loadingDiv.remove(); }, 15000);
}

function editorFechar() {
    const modal = document.getElementById('editorModal');
    const iframe = document.getElementById('editorIframe');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { iframe.src = 'about:blank'; }, 300);
    const loading = document.getElementById('editorLoading');
    if (loading) loading.remove();
    if (window._photopeaHandler) {
        window.removeEventListener('message', window._photopeaHandler);
        window._photopeaHandler = null;
    }
}

function editorToggleMenu() {
    const iframe = document.getElementById('editorIframe');
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage('app.showMenu();', '*');

    const aviso = document.createElement('div');
    aviso.style.cssText = `position:fixed; bottom:20px; right:20px; z-index:999999; background:#D4AF37; color:#0A1C3A; padding:15px 20px; border-radius:12px; font-weight:700; box-shadow:0 8px 25px rgba(0,0,0,0.3); font-family:Inter, sans-serif; font-size:0.85rem; max-width:280px;`;
    aviso.innerHTML = `ℹ️ Use o menu <strong>Arquivo</strong> no topo do Photopea para exportar.`;
    document.body.appendChild(aviso);
    setTimeout(() => aviso.remove(), 4000);
}

// ============================================================
// PREVIEW MODAL
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
        if (e.key === 'Escape') { fecharPreview(); editorFechar(); fecharModalEnvio(); fecharModalAuth(); }
    });
}

function abrirPreview(index) {
    const arquivo = estadoSite.arquivos[index];
    if (!arquivo) return;

    const modal = document.getElementById('previewModal');
    const body = document.getElementById('previewBody');
    document.getElementById('previewTitulo').textContent = paraString(arquivo.nome);
    document.getElementById('previewMeta').textContent = `${paraString(arquivo.tipo)}${arquivo.tamanho ? ' • ' + paraString(arquivo.tamanho) : ''}${arquivo.categoria ? ' • ' + paraString(arquivo.categoria) : ''}`;
    document.getElementById('previewTitleIcon').className = `fas ${obterIcone(arquivo.tipo)} preview-title-icon`;
    document.getElementById('previewDownloadBtn').href = paraString(arquivo.link);

    const ext = paraString(arquivo.tipo).toUpperCase();
    const isImg = ['PNG','JPG','JPEG','GIF','WEBP','SVG','BMP'].includes(ext);
    const isVid = ['MP4','MOV','AVI','WEBM','MKV'].includes(ext);
    const isPdf = ext === 'PDF';
    const fileId = extrairFileId(arquivo.link);

    if (isImg) {
        const urlHD = fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600` : arquivo.link;
        body.innerHTML = `<div class="preview-image-wrapper"><img src="${urlHD}" alt="${escapeHTML(paraString(arquivo.nome))}"></div>`;
    } else if (isVid) {
        const url = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : arquivo.link;
        body.innerHTML = `<div class="preview-video-wrapper"><iframe src="${url}" allow="autoplay" allowfullscreen frameborder="0"></iframe></div>`;
    } else if (isPdf) {
        const url = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : arquivo.link;
        body.innerHTML = `<div class="preview-pdf-wrapper"><iframe src="${url}" allowfullscreen frameborder="0"></iframe></div>`;
    } else {
        body.innerHTML = `<div class="preview-generic"><div class="preview-generic-icon"><i class="fas ${obterIcone(arquivo.tipo)}"></i></div><h4>${escapeHTML(paraString(arquivo.nome))}</h4><p>${escapeHTML(paraString(arquivo.descricao) || 'Sem pré-visualização.')}</p></div>`;
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
    const urlStr = paraString(url);
    const m1 = urlStr.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m1) return m1[1];
    const m2 = urlStr.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m2) return m2[1];
    return null;
}

// ============================================================
// AUTH
// ============================================================
function inicializarAuth() {
    const inputFoto = document.getElementById('cadFotoInput');
    inputFoto?.addEventListener('change', () => {
        if (inputFoto.files.length) {
            const file = inputFoto.files[0];
            if (file.size > 3 * 1024 * 1024) {
                alert('Foto muito grande (máx 3 MB)');
                return;
            }
            estadoSite.cadFotoTipoMime = file.type;

            const reader = new FileReader();
            reader.onload = e => {
                estadoSite.cadFotoBase64 = e.target.result.split(',')[1];
                const preview = document.getElementById('cadFotoPreview');
                preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                preview.style.border = '3px solid #D4AF37';
            };
            reader.readAsDataURL(file);
        }
    });
}

function abrirModalAuth() {
    document.getElementById('modalAuth').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharModalAuth() {
    document.getElementById('modalAuth').classList.remove('active');
    document.body.style.overflow = '';
    const loginErro = document.getElementById('loginErro');
    const cadErro = document.getElementById('cadErro');
    if (loginErro) loginErro.textContent = '';
    if (cadErro) cadErro.textContent = '';
}

function trocarAbaAuth(aba) {
    document.querySelectorAll('.modal-auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.modal-auth-panel').forEach(p => p.classList.remove('active'));

    if (aba === 'login') {
        document.querySelector('.modal-auth-tab:nth-child(1)').classList.add('active');
        document.getElementById('panelLogin').classList.add('active');
    } else {
        document.querySelector('.modal-auth-tab:nth-child(2)').classList.add('active');
        document.getElementById('panelCadastro').classList.add('active');
    }
}

async function fazerLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginSenha').value;
    const erro = document.getElementById('loginErro');

    if (!email || !senha) { erro.textContent = 'Preencha e-mail e senha'; return; }
    erro.textContent = '⏳ Entrando...';

    const result = await window.apiPost({ acao: 'login', email, senha });

    if (result && result.status === 'ok') {
        estadoSite.usuario = result.usuario;
        salvarUsuarioLocal(result.usuario, result.token);
        atualizarInterfaceAuth();
        fecharModalAuth();
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginSenha').value = '';
        renderizarCreativeMeus();
    } else {
        erro.textContent = result?.mensagem || 'Erro ao entrar';
    }
}

async function fazerCadastro() {
    const nome = document.getElementById('cadNome').value.trim();
    const email = document.getElementById('cadEmail').value.trim();
    const whatsapp = document.getElementById('cadWhatsapp').value.trim();
    const congregacao = document.getElementById('cadCongregacao').value.trim();
    const cidade = document.getElementById('cadCidade').value;
    const idade = document.getElementById('cadIdade').value;
    const senha = document.getElementById('cadSenha').value;
    const erro = document.getElementById('cadErro');

    if (!nome || !email || !whatsapp || !congregacao || !cidade || !idade || !senha) {
        erro.textContent = 'Preencha todos os campos obrigatórios'; return;
    }
    if (senha.length < 6) {
        erro.textContent = 'Senha deve ter no mínimo 6 caracteres'; return;
    }

    erro.textContent = '⏳ Criando conta...';

    const result = await window.apiPost({
        acao: 'cadastro',
        nome, email, whatsapp, congregacao, cidade, idade, senha,
        fotoBase64: estadoSite.cadFotoBase64 || null,
        fotoTipoMime: estadoSite.cadFotoTipoMime || null
    });

    if (result && result.status === 'ok') {
        estadoSite.usuario = result.usuario;
        salvarUsuarioLocal(result.usuario, result.token);
        atualizarInterfaceAuth();
        fecharModalAuth();

        ['cadNome', 'cadEmail', 'cadWhatsapp', 'cadCongregacao', 'cadCidade', 'cadIdade', 'cadSenha'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        estadoSite.cadFotoBase64 = null;
        estadoSite.cadFotoTipoMime = null;
        const previewFoto = document.getElementById('cadFotoPreview');
        if (previewFoto) {
            previewFoto.innerHTML = '<i class="fas fa-camera"></i><span>Foto</span>';
            previewFoto.style.border = '3px dashed #D4AF37';
        }
        renderizarCreativeMeus();
    } else {
        erro.textContent = result?.mensagem || 'Erro ao cadastrar';
    }
}

function salvarUsuarioLocal(usuario, token) {
    try {
        localStorage.setItem('iead_usuario', JSON.stringify({ usuario, token, ts: Date.now() }));
    } catch (e) {}
}

function carregarUsuarioLogado() {
    try {
        const dados = localStorage.getItem('iead_usuario');
        if (dados) {
            const parsed = JSON.parse(dados);
            if (parsed.ts && (Date.now() - parsed.ts) < 30 * 24 * 60 * 60 * 1000) {
                estadoSite.usuario = parsed.usuario;
            } else {
                localStorage.removeItem('iead_usuario');
            }
        }
    } catch (e) {}
}

function fazerLogout() {
    if (!confirm('Deseja sair da sua conta?')) return;
    estadoSite.usuario = null;
    localStorage.removeItem('iead_usuario');
    atualizarInterfaceAuth();
    renderizarCreativeMeus();
}

function atualizarInterfaceAuth() {
    const userBtnText = document.getElementById('userBtnText');
    const userBtnFoto = document.getElementById('userBtnFoto');
    const userBtnIcone = document.getElementById('userBtnIcone');
    const creativeBloqueado = document.getElementById('creativeBloqueado');
    const creativeAreaLogado = document.getElementById('creativeAreaLogado');

    if (estadoSite.usuario) {
        const nomeCompleto = paraString(estadoSite.usuario.nome);
        if (userBtnText) userBtnText.textContent = nomeCompleto.split(' ')[0] || 'Usuário';

        const urlFoto = paraString(estadoSite.usuario.foto) || gerarFotoPerfil(estadoSite.usuario.email, nomeCompleto);

        if (userBtnFoto) {
            userBtnFoto.src = urlFoto;
            userBtnFoto.style.display = 'block';
            userBtnFoto.onerror = () => {
                userBtnFoto.src = gerarAvatarInicial(nomeCompleto);
            };
        }
        if (userBtnIcone) userBtnIcone.style.display = 'none';

        if (creativeBloqueado) creativeBloqueado.style.display = 'none';
        if (creativeAreaLogado) creativeAreaLogado.style.display = 'block';

        const foto = document.getElementById('creativeUserFoto');
        const nome = document.getElementById('creativeUserName');
        const info = document.getElementById('creativeUserInfo');

        if (foto) {
            foto.src = urlFoto;
            foto.onerror = () => { foto.src = gerarAvatarInicial(nomeCompleto); };
        }
        if (nome) nome.textContent = nomeCompleto;
        if (info) {
            const partes = [];
            const idade = paraString(estadoSite.usuario.idade);
            const congregacao = paraString(estadoSite.usuario.congregacao);
            const cidade = paraString(estadoSite.usuario.cidade);
            if (idade) partes.push(idade + ' anos');
            if (congregacao) partes.push(congregacao);
            if (cidade) partes.push(cidade);
            info.textContent = partes.join(' • ');
        }
    } else {
        if (userBtnText) userBtnText.textContent = 'Entrar';
        if (userBtnFoto) userBtnFoto.style.display = 'none';
        if (userBtnIcone) userBtnIcone.style.display = 'inline-block';

        if (creativeBloqueado) creativeBloqueado.style.display = 'block';
        if (creativeAreaLogado) creativeAreaLogado.style.display = 'none';
    }
}

function gerarFotoPerfil(email, nome) {
    const emailStr = paraString(email).trim();
    if (emailStr && emailStr.includes('@')) {
        return `https://unavatar.io/${encodeURIComponent(emailStr.toLowerCase())}?fallback=false`;
    }
    return gerarAvatarInicial(nome);
}

function gerarAvatarInicial(nome) {
    const nomeStr = paraString(nome) || 'U';
    const inicial = nomeStr.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(inicial)}&background=D4AF37&color=0A1C3A&size=200&bold=true&length=1`;
}

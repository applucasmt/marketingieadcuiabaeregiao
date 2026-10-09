/* ============================================================
 *  SISTEMA DE MARKETING - IEAD CUIABÁ E REGIÃO
 *  Frontend: GitHub Pages | Backend: Google Apps Script
 *  Versão: 3.0 (Com Upload para Drive)
 * ============================================================ */

const API_URL = "COLE_AQUI_A_URL_DO_SEU_GOOGLE_APPS_SCRIPT";
const SENHA_ADMIN = "IEAD2026";

// ============================================================
// CARROSSEL
// ============================================================
let slideIndex = 0;
let carrosselInterval;

function inicializarCarrossel() {
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.getElementById('dotsContainer');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (!slides.length) return;

    slides.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => { goToSlide(i); reiniciarAutoPlay(); });
        dotsContainer.appendChild(dot);
    });

    prevBtn.addEventListener('click', () => { goToSlide(slideIndex - 1); reiniciarAutoPlay(); });
    nextBtn.addEventListener('click', () => { goToSlide(slideIndex + 1); reiniciarAutoPlay(); });

    iniciarAutoPlay();
}

function goToSlide(n) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    if (!slides.length) return;

    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    slideIndex = (n + slides.length) % slides.length;
    slides[slideIndex].classList.add('active');
    dots[slideIndex].classList.add('active');
}

function iniciarAutoPlay() {
    carrosselInterval = setInterval(() => goToSlide(slideIndex + 1), 6000);
}

function reiniciarAutoPlay() {
    clearInterval(carrosselInterval);
    iniciarAutoPlay();
}

// ============================================================
// LOGIN ADMIN
// ============================================================
function inicializarAdmin() {
    const adminLock = document.getElementById('adminLock');
    const loginModal = document.getElementById('loginModal');
    const closeModal = document.getElementById('closeModal');
    const adminPanel = document.getElementById('adminPanel');
    const loginError = document.getElementById('loginError');
    const passwordInput = document.getElementById('adminPassword');

    adminLock.addEventListener('click', () => {
        if (sessionStorage.getItem('adminLogged') === 'true') {
            adminPanel.style.display = 'flex';
            carregarEstatisticasAdmin();
        } else {
            loginModal.style.display = 'flex';
            passwordInput.focus();
        }
    });

    closeModal.addEventListener('click', fecharModal);

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkPassword();
    });

    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) fecharModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') fecharModal();
    });

    function fecharModal() {
        loginModal.style.display = 'none';
        loginError.textContent = '';
        passwordInput.value = '';
    }
}

function checkPassword() {
    const inputPass = document.getElementById('adminPassword').value;
    const loginError = document.getElementById('loginError');
    const loginModal = document.getElementById('loginModal');
    const adminPanel = document.getElementById('adminPanel');

    if (inputPass === SENHA_ADMIN) {
        sessionStorage.setItem('adminLogged', 'true');
        loginModal.style.display = 'none';
        adminPanel.style.display = 'flex';
        loginError.textContent = '';
        document.getElementById('adminPassword').value = '';
        carregarEstatisticasAdmin();
    } else {
        loginError.textContent = 'Credencial inválida. Tente novamente.';
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('adminLogged');
    document.getElementById('adminPanel').style.display = 'none';
}

// ============================================================
// UPLOAD DE ARQUIVOS PARA O DRIVE
// ============================================================
function inicializarUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadStatus = document.getElementById('uploadStatus');

    if (!uploadArea) return;

    // Clique na área abre o seletor de arquivos
    uploadArea.addEventListener('click', () => fileInput.click());

    // Drag & Drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            mostrarArquivoSelecionado(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            mostrarArquivoSelecionado(fileInput.files[0]);
        }
    });

    uploadBtn.addEventListener('click', fazerUpload);
}

let arquivoAtual = null;

function mostrarArquivoSelecionado(file) {
    arquivoAtual = file;
    const uploadArea = document.getElementById('uploadArea');
    const tamanhoMB = (file.size / (1024 * 1024)).toFixed(2);
    
    uploadArea.innerHTML = `
        <i class="fas fa-file-check" style="font-size: 2.5rem; color: #D4AF37; margin-bottom: 15px;"></i>
        <p style="color: #0A1C3A; font-weight: 600; margin-bottom: 5px;">${file.name}</p>
        <p style="color: #86868B; font-size: 0.9rem;">${tamanhoMB} MB</p>
        <p style="color: #86868B; font-size: 0.8rem; margin-top: 10px;">Clique para trocar o arquivo</p>
    `;
}

async function fazerUpload() {
    if (!arquivoAtual) {
        alert("Selecione um arquivo primeiro!");
        return;
    }

    const uploadStatus = document.getElementById('uploadStatus');
    const uploadBtn = document.getElementById('uploadBtn');
    const nomeAmigavel = document.getElementById('nomeAmigavel').value.trim();
    const descricao = document.getElementById('descricaoUpload').value.trim();
    const categoria = document.getElementById('categoriaUpload').value;

    // Validação de tamanho (25MB)
    const tamanhoMB = arquivoAtual.size / (1024 * 1024);
    if (tamanhoMB > 25) {
        uploadStatus.innerHTML = `<p style="color: #FF3B30;">❌ Arquivo muito grande (${tamanhoMB.toFixed(2)} MB). Máximo: 25 MB.</p>`;
        return;
    }

    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    uploadStatus.innerHTML = '<p style="color: #D4AF37;">⏳ Lendo arquivo...</p>';

    try {
        // Converte para Base64
        const base64 = await fileToBase64(arquivoAtual);
        
        uploadStatus.innerHTML = '<p style="color: #D4AF37;">⏳ Enviando para o Google Drive...</p>';

        const payload = {
            acao: "upload",
            nomeArquivo: arquivoAtual.name,
            tipoMime: arquivoAtual.type || "application/octet-stream",
            dadosBase64: base64.split(',')[1],
            descricao: descricao || "Clique para baixar",
            categoria: categoria || "Geral",
            nomeAmigavel: nomeAmigavel || arquivoAtual.name.replace(/\.[^/.]+$/, "")
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const resultado = await response.json();

        if (resultado.status === "ok") {
            uploadStatus.innerHTML = `
                <p style="color: #28A745; font-weight: 600;">✅ Upload concluído com sucesso!</p>
                <p style="color: #86868B; font-size: 0.9rem;">Salvo em: ${resultado.arquivo.subpasta}</p>
            `;
            
            // Limpa o formulário
            arquivoAtual = null;
            document.getElementById('fileInput').value = '';
            document.getElementById('nomeAmigavel').value = '';
            document.getElementById('descricaoUpload').value = '';
            
            // Restaura a área de upload
            document.getElementById('uploadArea').innerHTML = `
                <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: #D4AF37; margin-bottom: 15px;"></i>
                <p style="color: #0A1C3A; font-weight: 600;">Arraste um arquivo aqui ou clique para selecionar</p>
                <p style="color: #86868B; font-size: 0.9rem;">PDF, PNG, JPG, MP4, PPTX, DOCX (máx: 25 MB)</p>
            `;
            
            // Recarrega a lista de arquivos
            carregarArquivos();
            carregarEstatisticasAdmin();
            
        } else {
            uploadStatus.innerHTML = `<p style="color: #FF3B30;">❌ Erro: ${resultado.mensagem}</p>`;
        }

    } catch (error) {
        uploadStatus.innerHTML = `<p style="color: #FF3B30;">❌ Erro no upload: ${error.message}</p>`;
        console.error(error);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Fazer Upload para o Drive';
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================================
// ESTATÍSTICAS DO PAINEL ADMIN
// ============================================================
async function carregarEstatisticasAdmin() {
    const statsDiv = document.getElementById('adminStats');
    if (!statsDiv || !API_URL || API_URL.includes("COLE_AQUI")) return;

    try {
        const [stats, infoPasta] = await Promise.all([
            fetch(API_URL + "?acao=estatisticas").then(r => r.json()),
            fetch(API_URL + "?acao=info_pasta").then(r => r.json())
        ]);

        statsDiv.innerHTML = `
            <div class="stat-card">
                <i class="fas fa-file"></i>
                <h4>${stats.total_arquivos || 0}</h4>
                <p>Arquivos</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-database"></i>
                <h4>${stats.tamanho_total_mb || 0} MB</h4>
                <p>Total</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-folder"></i>
                <h4>${infoPasta.total_subpastas || 0}</h4>
                <p>Pastas</p>
            </div>
        `;

        // Link para a pasta do Drive
        const linkPasta = document.getElementById('linkPastaDrive');
        if (linkPasta && infoPasta.url) {
            linkPasta.href = infoPasta.url;
            linkPasta.style.display = 'inline-flex';
        }

    } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
    }
}

// ============================================================
// CARREGAMENTO DE ARQUIVOS
// ============================================================
async function carregarArquivos() {
    const grid = document.getElementById('downloadsGrid');

    if (!API_URL || API_URL === "https://script.google.com/macros/s/AKfycbziXZvHTiX2qQI2VQrHf19fUc3ihOnirfOlCMa1_D-O0z4e8BMKArYpaXFX0YIv0ka8XA/exec") {
        renderizarCards(dadosExemplo());
        return;
    }

    try {
        grid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Carregando acervo...</p></div>`;

        const response = await fetch(API_URL + "?acao=listar");
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                    <i class="fas fa-folder-open" style="font-size: 3rem; color: #D4AF37; margin-bottom: 20px;"></i>
                    <h3 style="color: #0A1C3A;">Nenhum arquivo disponível</h3>
                    <p style="color: #86868B;">Os materiais serão adicionados em breve.</p>
                </div>`;
            return;
        }

        renderizarCards(data);

    } catch (error) {
        grid.innerHTML = `
            <div class="error-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #FF3B30; margin-bottom: 20px;"></i>
                <h3>Erro ao carregar</h3>
                <p style="color: #86868B;">Tente novamente mais tarde.</p>
            </div>`;
    }
}

function renderizarCards(arquivos) {
    const grid = document.getElementById('downloadsGrid');
    grid.innerHTML = '';

    arquivos.forEach(arquivo => {
        const icone = obterIcone(arquivo.tipo);
        
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div>
                <i class="fas ${icone} card-icon"></i>
                <h3>${escapeHTML(arquivo.nome)}</h3>
                <p>${escapeHTML(arquivo.descricao || 'Clique para acessar')}</p>
                ${arquivo.tamanho ? `<span class="badge-size">${arquivo.tamanho}</span>` : ''}
            </div>
            <a href="${arquivo.link}" target="_blank" rel="noopener noreferrer" class="btn-download">
                <i class="fas fa-download"></i> Baixar
            </a>
        `;
        grid.appendChild(card);
    });
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
    if (t.includes('mp4') || t.includes('mov') || t.includes('avi')) return 'fa-file-video';
    if (t.includes('mp3') || t.includes('wav')) return 'fa-file-audio';
    return 'fa-file';
}

function escapeHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function dadosExemplo() {
    return [
        { nome: "Manual de Identidade Visual", tipo: "PDF", link: "#", descricao: "Manual completo da marca" },
        { nome: "Logo Oficial", tipo: "PNG", link: "#", descricao: "Logo em alta resolução" },
        { nome: "Apresentação", tipo: "PPTX", link: "#", descricao: "Slides oficiais" }
    ];
}

// ============================================================
// BUSCA
// ============================================================
function inicializarBusca() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        const termo = this.value.toLowerCase().trim();
        const cards = document.querySelectorAll('.card');
        
        cards.forEach(card => {
            const titulo = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
            card.style.display = (titulo.includes(termo) || desc.includes(termo)) ? 'flex' : 'none';
        });
    });
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarCarrossel();
    inicializarAdmin();
    inicializarBusca();
    inicializarUpload();
    carregarArquivos();
});

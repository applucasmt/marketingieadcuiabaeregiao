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
        <div class="

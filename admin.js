const CONFIG = {
    SENHA_ADMIN: 'IEAD2026',
    LIMITE_UPLOAD_MB: 25,
    URL_API: 'https://script.google.com/macros/s/SEU_ID/exec'
    // ... etc
};

async function apiGet(acao) {
    const r = await fetch(`${CONFIG.URL_API}?acao=${acao}`);
    return r.json();
}

async function apiPost(dados) {
    const r = await fetch(CONFIG.URL_API, {
        method: 'POST',
        body: JSON.stringify(dados)
    });
    return r.json();
}

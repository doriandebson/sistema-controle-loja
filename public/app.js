// Primeiro: serve arquivos estáticos (app.js, style.css, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// ... (todas as suas rotas /api/...)

// Por último: rota coringa (fallback para SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
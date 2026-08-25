// --- ROTAS DE MANUTENÇÃO (PUT / DELETE) ---

// Clientes
app.put('/api/clientes/:id', (req, res) => {
    const { nome, cpf_cnpj, telefone, email } = req.body;
    db.run("UPDATE clientes SET nome = ?, cpf_cnpj = ?, telefone = ?, email = ? WHERE id = ?",
        [nome, cpf_cnpj, telefone, email, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

app.delete('/api/clientes/:id', (req, res) => {
    db.run("DELETE FROM clientes WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// Fornecedores
app.put('/api/fornecedores/:id', (req, res) => {
    const { nome_fantasia, cnpj, telefone, email } = req.body;
    db.run("UPDATE fornecedores SET nome_fantasia = ?, cnpj = ?, telefone = ?, email = ? WHERE id = ?",
        [nome_fantasia, cnpj, telefone, email, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

app.delete('/api/fornecedores/:id', (req, res) => {
    db.run("DELETE FROM fornecedores WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// Produtos
app.put('/api/produtos/:id', (req, res) => {
    const { nome, preco_custo, preco_venda, estoque_atual, fornecedor_id } = req.body;
    db.run("UPDATE produtos SET nome = ?, preco_custo = ?, preco_venda = ?, estoque_atual = ?, fornecedor_id = ? WHERE id = ?",
        [nome, preco_custo, preco_venda, estoque_atual, fornecedor_id, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

app.delete('/api/produtos/:id', (req, res) => {
    db.run("DELETE FROM produtos WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});
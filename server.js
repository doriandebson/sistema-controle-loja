const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar banco de dados SQLite
const db = new sqlite3.Database('./loja.db', (err) => {
    if (err) console.error('Erro ao abrir banco de dados:', err.message);
    else console.log('Conectado ao banco de dados SQLite.');
});

// Criar Tabelas
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cpf_cnpj TEXT,
        telefone TEXT,
        email TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS fornecedores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_fantasia TEXT NOT NULL,
        cnpj TEXT,
        ie TEXT,
        telefone TEXT,
        email TEXT,
        contato TEXT,
        observacoes TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT,
        nome TEXT NOT NULL,
        preco_custo REAL DEFAULT 0,
        preco_venda REAL DEFAULT 0,
        estoque INTEGER DEFAULT 0,
        fornecedor_id INTEGER,
        FOREIGN KEY(fornecedor_id) REFERENCES fornecedores(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS contas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT CHECK(tipo IN ('PAGAR', 'RECEBER')) NOT NULL,
        descricao TEXT NOT NULL,
        valor REAL NOT NULL,
        vencimento TEXT NOT NULL,
        status TEXT CHECK(status IN ('PENDENTE', 'PAGO')) DEFAULT 'PENDENTE'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER,
        produto_id INTEGER,
        quantidade INTEGER,
        preco_unitario REAL,
        forma_pagamento TEXT,
        status TEXT,
        data_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(cliente_id) REFERENCES clientes(id),
        FOREIGN KEY(produto_id) REFERENCES produtos(id)
    )`);
});

// --- ROTAS DA API ---

/* --- CLIENTES --- */
app.get('/api/clientes', (req, res) => {
    db.all("SELECT * FROM clientes", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/clientes', (req, res) => {
    const { nome, cpf_cnpj, telefone, email } = req.body;
    db.run("INSERT INTO clientes (nome, cpf_cnpj, telefone, email) VALUES (?, ?, ?, ?)",
        [nome, cpf_cnpj, telefone, email],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/clientes/:id', (req, res) => {
    const { nome, cpf_cnpj, telefone, email } = req.body;
    db.run("UPDATE clientes SET nome = ?, cpf_cnpj = ?, telefone = ?, email = ? WHERE id = ?",
        [nome, cpf_cnpj, telefone, email, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: true });
        }
    );
});

app.delete('/api/clientes/:id', (req, res) => {
    db.run("DELETE FROM clientes WHERE id = ?", req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: true });
    });
});

/* --- FORNECEDORES --- */
app.get('/api/fornecedores', (req, res) => {
    db.all("SELECT * FROM fornecedores", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/fornecedores', (req, res) => {
    const { nome_fantasia, cnpj, ie, telefone, email, contato, observacoes } = req.body;
    db.run("INSERT INTO fornecedores (nome_fantasia, cnpj, ie, telefone, email, contato, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [nome_fantasia, cnpj, ie, telefone, email, contato, observacoes],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/fornecedores/:id', (req, res) => {
    const { nome_fantasia, cnpj, ie, telefone, email, contato, observacoes } = req.body;
    db.run("UPDATE fornecedores SET nome_fantasia = ?, cnpj = ?, ie = ?, telefone = ?, email = ?, contato = ?, observacoes = ? WHERE id = ?",
        [nome_fantasia, cnpj, ie, telefone, email, contato, observacoes, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: true });
        }
    );
});

app.delete('/api/fornecedores/:id', (req, res) => {
    db.run("DELETE FROM fornecedores WHERE id = ?", req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: true });
    });
});

/* --- PRODUTOS --- */
app.get('/api/produtos', (req, res) => {
    db.all("SELECT * FROM produtos", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/produtos', (req, res) => {
    const { codigo, nome, preco_custo, preco_venda, estoque, fornecedor_id } = req.body;
    db.run("INSERT INTO produtos (codigo, nome, preco_custo, preco_venda, estoque, fornecedor_id) VALUES (?, ?, ?, ?, ?, ?)",
        [codigo, nome, preco_custo, preco_venda, estoque, fornecedor_id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/produtos/:id', (req, res) => {
    const { codigo, nome, preco_custo, preco_venda, estoque, fornecedor_id } = req.body;
    db.run("UPDATE produtos SET codigo = ?, nome = ?, preco_custo = ?, preco_venda = ?, estoque = ?, fornecedor_id = ? WHERE id = ?",
        [codigo, nome, preco_custo, preco_venda, estoque, fornecedor_id, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: true });
        }
    );
});

app.patch('/api/produtos/:id/estoque', (req, res) => {
    const { tipo, quantidade } = req.body;
    let query = '';
    
    if (tipo === 'SOMAR') query = 'UPDATE produtos SET estoque = estoque + ? WHERE id = ?';
    else if (tipo === 'SUBTRAIR') query = 'UPDATE produtos SET estoque = estoque - ? WHERE id = ?';
    else if (tipo === 'DEFINIR') query = 'UPDATE produtos SET estoque = ? WHERE id = ?';
    else return res.status(400).json({ error: 'Tipo de ajuste inválido' });

    db.run(query, [quantidade, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updated: true });
    });
});

app.delete('/api/produtos/:id', (req, res) => {
    db.run("DELETE FROM produtos WHERE id = ?", req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: true });
    });
});

/* --- CONTAS --- */
app.get('/api/contas', (req, res) => {
    db.all("SELECT * FROM contas", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/contas', (req, res) => {
    const { tipo, descricao, valor, vencimento, status } = req.body;
    db.run("INSERT INTO contas (tipo, descricao, valor, vencimento, status) VALUES (?, ?, ?, ?, ?)",
        [tipo, descricao, valor, vencimento, status],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

/* --- VENDAS --- */
app.post('/api/vendas', (req, res) => {
    const { cliente_id, produto_id, quantidade, preco_unitario, forma_pagamento, status } = req.body;
    const valor_total = quantidade * preco_unitario;

    db.serialize(() => {
        db.run("INSERT INTO vendas (cliente_id, produto_id, quantidade, preco_unitario, forma_pagamento, status) VALUES (?, ?, ?, ?, ?, ?)",
            [cliente_id, produto_id, quantidade, preco_unitario, forma_pagamento, status],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });

                // Atualizar o estoque do produto vendido
                db.run("UPDATE produtos SET estoque = estoque - ? WHERE id = ?", [quantidade, produto_id]);

                // Registrar o título a receber no financeiro
                const hoje = new Date().toISOString().split('T')[0];
                db.run("INSERT INTO contas (tipo, descricao, valor, vencimento, status) VALUES (?, ?, ?, ?, ?)",
                    ['RECEBER', `Venda #${this.lastID}`, valor_total, hoje, status === 'CONCLUIDO' ? 'PAGO' : 'PENDENTE']);

                res.json({ success: true });
            }
        );
    });
});

// Relatório de Estoque
app.get('/api/relatorios/estoque', (req, res) => {
    db.all("SELECT id, codigo, nome, estoque, preco_venda FROM produtos", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Rota padrão para renderizar a página principal (Single Page Application)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
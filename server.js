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
        cnpj TEXT NOT NULL,
        telefone TEXT,
        email TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        preco_custo REAL NOT NULL,
        preco_venda REAL NOT NULL,
        estoque_atual INTEGER DEFAULT 0,
        fornecedor_id INTEGER,
        FOREIGN KEY(fornecedor_id) REFERENCES fornecedores(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS contas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT CHECK(tipo IN ('PAGAR', 'RECEBER')) NOT NULL,
        descricao TEXT NOT NULL,
        valor REAL NOT NULL,
        data_vencimento TEXT NOT NULL,
        status TEXT CHECK(status IN ('PENDENTE', 'PAGO')) DEFAULT 'PENDENTE'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER,
        data_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
        valor_total REAL NOT NULL,
        FOREIGN KEY(cliente_id) REFERENCES clientes(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS itens_venda (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venda_id INTEGER,
        produto_id INTEGER,
        quantidade INTEGER NOT NULL,
        preco_unitario REAL NOT NULL,
        FOREIGN KEY(venda_id) REFERENCES vendas(id),
        FOREIGN KEY(produto_id) REFERENCES produtos(id)
    )`);
});

// --- ROTAS DA API ---

// Clientes
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

// Fornecedores
app.get('/api/fornecedores', (req, res) => {
    db.all("SELECT * FROM fornecedores", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/fornecedores', (req, res) => {
    const { nome_fantasia, cnpj, telefone, email } = req.body;
    db.run("INSERT INTO fornecedores (nome_fantasia, cnpj, telefone, email) VALUES (?, ?, ?, ?)",
        [nome_fantasia, cnpj, telefone, email],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Produtos
app.post('/api/produtos', (req, res) => {
    const { nome, preco_custo, preco_venda, estoque_atual, fornecedor_id } = req.body;
    db.run("INSERT INTO produtos (nome, preco_custo, preco_venda, estoque_atual, fornecedor_id) VALUES (?, ?, ?, ?, ?)",
        [nome, preco_custo, preco_venda, estoque_atual, fornecedor_id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Contas
app.get('/api/contas', (req, res) => {
    db.all("SELECT * FROM contas", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/contas', (req, res) => {
    const { tipo, descricao, valor, data_vencimento, status } = req.body;
    db.run("INSERT INTO contas (tipo, descricao, valor, data_vencimento, status) VALUES (?, ?, ?, ?, ?)",
        [tipo, descricao, valor, data_vencimento, status],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Vendas
app.post('/api/vendas', (req, res) => {
    const { cliente_id, itens } = req.body;
    let valor_total = itens.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0);

    db.run("INSERT INTO vendas (cliente_id, valor_total) VALUES (?, ?)", [cliente_id, valor_total], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const venda_id = this.lastID;

        itens.forEach(item => {
            db.run("INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)",
                [venda_id, item.produto_id, item.quantidade, item.preco_unitario]);

            db.run("UPDATE produtos SET estoque_atual = estoque_atual - ? WHERE id = ?",
                [item.quantidade, item.produto_id]);
        });

        const hoje = new Date().toISOString().split('T')[0];
        db.run("INSERT INTO contas (tipo, descricao, valor, data_vencimento, status) VALUES (?, ?, ?, ?, ?)",
            ['RECEBER', `Venda #${venda_id}`, valor_total, hoje, 'PENDENTE']);

        res.json({ venda_id, valor_total });
    });
});

// Relatório de Estoque
app.get('/api/relatorios/estoque', (req, res) => {
    db.all("SELECT id, nome, estoque_atual, preco_venda FROM produtos", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Rota padrão para renderizar a página principal
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Porta dinâmica para hospedagem
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
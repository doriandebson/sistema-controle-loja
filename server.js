const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inicialização do Banco de Dados SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error('Erro ao abrir banco:', err.message);
    else console.log('Conectado ao banco SQLite.');
});

// Criar tabelas e aplicar migrações se necessário
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
        codigo_barras TEXT,
        nome TEXT NOT NULL,
        preco_custo REAL DEFAULT 0,
        preco_venda REAL DEFAULT 0,
        estoque INTEGER DEFAULT 0,
        fornecedor_id INTEGER,
        FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
    )`);

    db.run(`ALTER TABLE produtos ADD COLUMN codigo_barras TEXT`, () => {});

    db.run(`CREATE TABLE IF NOT EXISTS contas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT CHECK(tipo IN ('PAGAR', 'RECEBER')),
        descricao TEXT NOT NULL,
        valor REAL DEFAULT 0,
        vencimento TEXT,
        status TEXT CHECK(status IN ('PENDENTE', 'PAGO'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER,
        produto_id INTEGER,
        quantidade INTEGER,
        preco_unitario REAL,
        valor_total REAL,
        forma_pagamento TEXT,
        status TEXT,
        data_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
    )`);
});

/* --- API CLIENTES --- */
app.get('/api/clientes', (req, res) => {
    db.all('SELECT * FROM clientes ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/clientes', (req, res) => {
    const { nome, cpf_cnpj, telefone, email } = req.body;
    db.run('INSERT INTO clientes (nome, cpf_cnpj, telefone, email) VALUES (?, ?, ?, ?)',
        [nome, cpf_cnpj, telefone, email],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/clientes/:id', (req, res) => {
    const { nome, cpf_cnpj, telefone, email } = req.body;
    db.run('UPDATE clientes SET nome = ?, cpf_cnpj = ?, telefone = ?, email = ? WHERE id = ?',
        [nome, cpf_cnpj, telefone, email, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Cliente atualizado' });
        }
    );
});

app.delete('/api/clientes/:id', (req, res) => {
    db.run('DELETE FROM clientes WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Cliente removido' });
    });
});

/* --- API FORNECEDORES --- */
app.get('/api/fornecedores', (req, res) => {
    db.all('SELECT * FROM fornecedores ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/fornecedores', (req, res) => {
    const { nome_fantasia, cnpj, ie, telefone, email, contato, observacoes } = req.body;
    db.run('INSERT INTO fornecedores (nome_fantasia, cnpj, ie, telefone, email, contato, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nome_fantasia, cnpj, ie, telefone, email, contato, observacoes],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/fornecedores/:id', (req, res) => {
    const { nome_fantasia, cnpj, ie, telefone, email, contato, observacoes } = req.body;
    db.run('UPDATE fornecedores SET nome_fantasia = ?, cnpj = ?, ie = ?, telefone = ?, email = ?, contato = ?, observacoes = ? WHERE id = ?',
        [nome_fantasia, cnpj, ie, telefone, email, contato, observacoes, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Fornecedor atualizado' });
        }
    );
});

app.delete('/api/fornecedores/:id', (req, res) => {
    db.run('DELETE FROM fornecedores WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Fornecedor removido' });
    });
});

/* --- API PRODUTOS --- */
app.get('/api/produtos', (req, res) => {
    db.all('SELECT * FROM produtos ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/produtos', (req, res) => {
    const { codigo_barras, nome, preco_custo, preco_venda, estoque, fornecedor_id } = req.body;
    db.run('INSERT INTO produtos (codigo_barras, nome, preco_custo, preco_venda, estoque, fornecedor_id) VALUES (?, ?, ?, ?, ?, ?)',
        [codigo_barras, nome, preco_custo, preco_venda, estoque, fornecedor_id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.patch('/api/produtos/:id/estoque', (req, res) => {
    const { tipo, quantidade } = req.body;
    const { id } = req.params;

    let query = '';
    if (tipo === 'SOMAR') query = 'UPDATE produtos SET estoque = estoque + ? WHERE id = ?';
    else if (tipo === 'SUBTRAIR') query = 'UPDATE produtos SET estoque = estoque - ? WHERE id = ?';
    else query = 'UPDATE produtos SET estoque = ? WHERE id = ?';

    db.run(query, [quantidade, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Estoque atualizado' });
    });
});

/* --- API CONTAS --- */
app.get('/api/contas', (req, res) => {
    db.all('SELECT * FROM contas ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/contas', (req, res) => {
    const { tipo, descricao, valor, vencimento, status } = req.body;
    db.run('INSERT INTO contas (tipo, descricao, valor, vencimento, status) VALUES (?, ?, ?, ?, ?)',
        [tipo, descricao, valor, vencimento, status],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Nova rota para quitar uma conta
app.patch('/api/contas/:id/pagar', (req, res) => {
    const { id } = req.params;
    db.run('UPDATE contas SET status = "PAGO" WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Conta quitada com sucesso!' });
    });
});

/* --- API VENDAS --- */
app.get('/api/vendas', (req, res) => {
    const query = `
        SELECT v.*, c.nome as cliente_nome, p.nome as produto_nome, v.status as status_pagamento 
        FROM vendas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        LEFT JOIN produtos p ON v.produto_id = p.id
        ORDER BY v.id DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/vendas', (req, res) => {
    const cliente_id = req.body.cliente_id;
    const produto_id = req.body.produto_id;
    const quantidade = req.body.quantidade;
    const preco_unitario = req.body.preco_unitario;
    const forma_pagamento = req.body.forma_pagamento;
    const status = req.body.status || req.body.status_pagamento;
    
    const valor_total = quantidade * preco_unitario;

    db.run('INSERT INTO vendas (cliente_id, produto_id, quantidade, preco_unitario, valor_total, forma_pagamento, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [cliente_id, produto_id, quantidade, preco_unitario, valor_total, forma_pagamento, status],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });

            db.run('UPDATE produtos SET estoque = estoque - ? WHERE id = ?', [quantidade, produto_id]);

            if (status === 'PENDENTE') {
                const hoje = new Date().toISOString().split('T')[0];
                db.run('INSERT INTO contas (tipo, descricao, valor, vencimento, status) VALUES (?, ?, ?, ?, ?)',
                    ['RECEBER', `Venda #${this.lastID} - Cliente ID ${cliente_id}`, valor_total, hoje, 'PENDENTE']);
            }

            res.json({ id: this.lastID });
        }
    );
});

/* --- RELATÓRIOS --- */
app.get('/api/relatorios/estoque', (req, res) => {
    db.all('SELECT id, codigo_barras, nome, estoque, preco_venda FROM produtos ORDER BY nome ASC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
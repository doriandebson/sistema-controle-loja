const API_URL = '/api';
let cacheProdutos = [];
let cacheFornecedores = [];
let cacheClientes = [];

// Carregamento inicial ao abrir a página
document.addEventListener('DOMContentLoaded', () => {
    carregarClientes();
    carregarFornecedores();
    carregarProdutos();
    carregarContas();
});

/* --- GERENCIAMENTO DE CLIENTES --- */
async function carregarClientes() {
    try {
        const res = await fetch(`${API_URL}/clientes`);
        cacheClientes = await res.json();
        const tbody = document.querySelector('#tblClientes tbody');
        if (tbody) {
            tbody.innerHTML = '';
            cacheClientes.forEach(c => {
                tbody.innerHTML += `<tr>
                    <td>${c.id}</td>
                    <td>${c.nome}</td>
                    <td>${c.cpf_cnpj || '-'}</td>
                    <td>${c.telefone || '-'}</td>
                    <td>${c.email || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-edit" onclick="editarCliente(${c.id})">Editar</button>
                        <button class="btn btn-sm btn-del" onclick="excluirCliente(${c.id})">Excluir</button>
                    </td>
                </tr>`;
            });
        }
    } catch (err) {
        console.error('Erro ao carregar clientes:', err);
    }
}

async function salvarCliente(e) {
    e.preventDefault();
    const id = document.getElementById('cli_id').value;
    const payload = {
        nome: document.getElementById('cli_nome').value,
        cpf_cnpj: document.getElementById('cli_cpf').value,
        telefone: document.getElementById('cli_telefone').value,
        email: document.getElementById('cli_email').value
    };

    const url = id ? `${API_URL}/clientes/${id}` : `${API_URL}/clientes`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        resetFormCliente();
        carregarClientes();
    } else {
        alert('Erro ao salvar cliente.');
    }
}

function editarCliente(id) {
    const c = cacheClientes.find(item => item.id === id);
    if (!c) return;
    document.getElementById('cli_id').value = c.id;
    document.getElementById('cli_nome').value = c.nome;
    document.getElementById('cli_cpf').value = c.cpf_cnpj || '';
    document.getElementById('cli_telefone').value = c.telefone || '';
    document.getElementById('cli_email').value = c.email || '';
}

function resetFormCliente() {
    const form = document.getElementById('formCliente');
    if (form) form.reset();
    document.getElementById('cli_id').value = '';
}

async function excluirCliente(id) {
    if (!confirm('Deseja realmente excluir este cliente?')) return;
    const res = await fetch(`${API_URL}/clientes/${id}`, { method: 'DELETE' });
    if (res.ok) carregarClientes();
    else alert('Erro ao excluir cliente.');
}

/* --- GERENCIAMENTO DE FORNECEDORES --- */
async function carregarFornecedores() {
    try {
        const res = await fetch(`${API_URL}/fornecedores`);
        cacheFornecedores = await res.json();
    } catch (err) {
        console.error('Erro ao carregar fornecedores:', err);
    }
}

function editarFornecedor(id) {
    const f = cacheFornecedores.find(item => item.id === id);
    if (!f) return;
    document.getElementById('for_id').value = f.id;
    document.getElementById('for_nome').value = f.nome_fantasia;
    
    const doc = f.cnpj || '';
    const isCPF = doc.length <= 14;
    const selectDoc = document.getElementById('for_tipo_doc');
    if (selectDoc) selectDoc.value = isCPF ? 'CPF' : 'CNPJ';
    
    document.getElementById('for_cnpj').value = doc;
    document.getElementById('for_ie').value = f.ie || '';
    document.getElementById('for_telefone').value = f.telefone || '';
    document.getElementById('for_email').value = f.email || '';
    document.getElementById('for_contato').value = f.contato || '';
    document.getElementById('for_obs').value = f.observacoes || '';

    const title = document.getElementById('titleFormFornecedor');
    if (title) title.innerText = 'Editar Fornecedor';
}

function resetFormFornecedor() {
    const form = document.getElementById('formFornecedor');
    if (form) form.reset();
    document.getElementById('for_id').value = '';
}

async function excluirFornecedor(id) {
    if (!confirm('Deseja realmente excluir este fornecedor?')) return;
    const res = await fetch(`${API_URL}/fornecedores/${id}`, { method: 'DELETE' });
    if (res.ok) carregarFornecedores();
    else alert('Erro ao excluir fornecedor.');
}

/* --- GERENCIAMENTO DE PRODUTOS --- */
async function carregarProdutos() {
    try {
        const res = await fetch(`${API_URL}/produtos`);
        cacheProdutos = await res.json();
        renderTabelaProdutos(cacheProdutos);
    } catch (err) {
        console.error('Erro ao carregar produtos:', err);
    }
}

function renderTabelaProdutos(lista) {
    const tbody = document.querySelector('#tblProdutos tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    lista.forEach(p => {
        const fornec = cacheFornecedores.find(f => f.id === p.fornecedor_id);
        tbody.innerHTML += `<tr>
            <td>${p.id}</td>
            <td>${p.codigo || '-'}</td>
            <td>${p.nome}</td>
            <td>R$ ${parseFloat(p.preco_custo || 0).toFixed(2)}</td>
            <td>R$ ${parseFloat(p.preco_venda || 0).toFixed(2)}</td>
            <td><strong>${p.estoque}</strong></td>
            <td>${fornec ? fornec.nome_fantasia : '-'}</td>
            <td>
                <button class="btn btn-sm btn-stock" onclick="abrirModalEstoque(${p.id})">Estoque</button>
                <button class="btn btn-sm btn-edit" onclick="editarProduto(${p.id})">Editar</button>
                <button class="btn btn-sm btn-del" onclick="excluirProduto(${p.id})">Excluir</button>
            </td>
        </tr>`;
    });
}

async function salvarProduto(e) {
    e.preventDefault();
    const id = document.getElementById('prod_id').value;
    const payload = {
        codigo: document.getElementById('prod_codigo').value,
        nome: document.getElementById('prod_nome').value,
        preco_custo: parseFloat(document.getElementById('prod_custo').value),
        preco_venda: parseFloat(document.getElementById('prod_venda').value),
        estoque: parseInt(document.getElementById('prod_estoque').value),
        fornecedor_id: document.getElementById('prod_fornecedor').value || null
    };

    const url = id ? `${API_URL}/produtos/${id}` : `${API_URL}/produtos`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
        resetFormProduto();
        carregarProdutos();
    } else {
        alert('Erro ao salvar produto.');
    }
}

function editarProduto(id) {
    const p = cacheProdutos.find(item => item.id === id);
    if (!p) return;
    document.getElementById('prod_id').value = p.id;
    document.getElementById('prod_codigo').value = p.codigo || '';
    document.getElementById('prod_nome').value = p.nome;
    document.getElementById('prod_custo').value = p.preco_custo;
    document.getElementById('prod_venda').value = p.preco_venda;
    document.getElementById('prod_estoque').value = p.estoque;
    document.getElementById('prod_fornecedor').value = p.fornecedor_id || '';
}

function resetFormProduto() {
    const form = document.getElementById('formProduto');
    if (form) form.reset();
    document.getElementById('prod_id').value = '';
}

async function excluirProduto(id) {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    const res = await fetch(`${API_URL}/produtos/${id}`, { method: 'DELETE' });
    if (res.ok) carregarProdutos();
    else alert('Erro ao excluir produto.');
}

/* --- MODAL ESTOQUE --- */
function abrirModalEstoque(id) {
    const p = cacheProdutos.find(item => item.id === id);
    if (!p) return;
    document.getElementById('modal_prod_id').value = p.id;
    document.getElementById('modalNomeProduto').innerText = `${p.nome} (Atual: ${p.estoque})`;
    document.getElementById('modal_qtd_ajuste').value = 1;
    document.getElementById('modalEstoque').classList.add('active');
}

function fecharModalEstoque() {
    document.getElementById('modalEstoque').classList.remove('active');
}

async function confirmarAjusteEstoque() {
    const id = document.getElementById('modal_prod_id').value;
    const tipo = document.getElementById('modal_tipo_ajuste').value;
    const qtd = parseInt(document.getElementById('modal_qtd_ajuste').value);

    const res = await fetch(`${API_URL}/produtos/${id}/estoque`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, quantidade: qtd })
    });

    if (res.ok) {
        fecharModalEstoque();
        carregarProdutos();
    } else {
        alert('Erro ao atualizar estoque.');
    }
}

/* --- CONTAS PAGAR / RECEBER --- */
async function carregarContas() {
    try {
        const res = await fetch(`${API_URL}/contas`);
        const contas = await res.json();
        const tbody = document.querySelector('#tblContas tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        contas.forEach(c => {
            const badgeClass = c.status === 'PAGO' ? 'badge-pago' : 'badge-pendente';
            tbody.innerHTML += `<tr>
                <td>${c.id}</td>
                <td>${c.tipo}</td>
                <td>${c.descricao}</td>
                <td>R$ ${parseFloat(c.valor).toFixed(2)}</td>
                <td>${c.vencimento}</td>
                <td><span class="badge ${badgeClass}">${c.status}</span></td>
            </tr>`;
        });
    } catch (err) {
        console.error('Erro ao carregar contas:', err);
    }
}
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crud_funcionarios'
};

const db = mysql.createPool(dbConfig);

// ---------- AUTENTICAÇÃO ----------

// POST /api/login
app.post('/api/login', async (req, res) => {
    try {
        const { login, senha } = req.body;

        if (!login || !senha) {
            return res.status(400).json({ success: false, error: 'Informe usuário e senha' });
        }

        const [rows] = await db.execute('SELECT * FROM usuarios WHERE login = ?', [login]);

        // Mesma mensagem para usuário inexistente e senha errada
        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Usuário ou senha inválidos' });
        }

        const senhaConfere = await bcrypt.compare(senha, rows[0].senha);
        if (!senhaConfere) {
            return res.status(401).json({ success: false, error: 'Usuário ou senha inválidos' });
        }

        res.json({ success: true, login: rows[0].login });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cria o usuário inicial (admin / admin123) se a tabela estiver vazia,
// já com a senha criptografada com bcrypt.
async function criarAdminPadrao() {
    try {
        const [rows] = await db.execute('SELECT COUNT(*) AS total FROM usuarios');
        if (rows[0].total === 0) {
            const hash = await bcrypt.hash('admin123', 10);
            await db.execute('INSERT INTO usuarios (login, senha) VALUES (?, ?)', ['admin', hash]);
            console.log('👤 Usuário padrão criado -> login: admin | senha: admin123');
        }
    } catch (error) {
        console.error('Não foi possível verificar a tabela usuarios. Execute o database.sql primeiro.', error.message);
    }
}

// ---------- CRUD FUNCIONÁRIOS ----------

// GET /api/funcionarios
app.get('/api/funcionarios', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM funcionarios ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/funcionarios
app.post('/api/funcionarios', async (req, res) => {
    try {
        const { nome, funcao, salario } = req.body;
        if (!nome || !funcao || !salario) {
            return res.status(400).json({ error: 'Campos obrigatórios' });
        }
        const [result] = await db.execute(
            'INSERT INTO funcionarios (nome, funcao, salario) VALUES (?, ?, ?)',
            [nome, funcao, parseFloat(salario)]
        );
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/funcionarios/:id
app.put('/api/funcionarios/:id', async (req, res) => {
    try {
        const { nome, funcao, salario } = req.body;
        const id = req.params.id;
        await db.execute(
            'UPDATE funcionarios SET nome = ?, funcao = ?, salario = ? WHERE id = ?',
            [nome, funcao, parseFloat(salario), id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/funcionarios/:id
app.delete('/api/funcionarios/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await db.execute('DELETE FROM funcionarios WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log('Endpoints: POST /api/login | /api/funcionarios (GET/POST/PUT/:id/DELETE/:id)');
    criarAdminPadrao();
});

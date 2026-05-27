const express    = require('express');
const { Pool }   = require('pg');
const cors       = require('cors');
const bodyParser = require('body-parser');
const bcrypt     = require('bcrypt');

const app  = express();
const SALT = 10;

app.use(cors());
app.use(bodyParser.json());

/* ══════════════════════════════════════════════════════════════
   CONEXIÓN A POSTGRESQL
══════════════════════════════════════════════════════════════ */
const pool = new Pool({
    connectionString: process.env.DATABASE_URL ||
        'postgresql://michivery_db_user:vDxyITAgjN9udkpBNUmPaaeo7iUrCPBc@dpg-d8b7s43eo5us73amdsog-a.frankfurt-postgres.render.com/michivery_db',
    ssl: { rejectUnauthorized: false }
});

/* ══════════════════════════════════════════════════════════════
   CLIENTES
══════════════════════════════════════════════════════════════ */
app.post('/registrar', async (req, res) => {
    const { nombre, telefono, direccion, correo, contrasena } = req.body;
    if (!nombre || !telefono || !direccion || !correo || !contrasena)
        return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    try {
        const c1 = await pool.query('SELECT id FROM clientes WHERE correo = $1', [correo]);
        if (c1.rows.length > 0) return res.status(400).json({ mensaje: 'Este correo ya está registrado como cliente' });
        const c2 = await pool.query('SELECT id FROM administradores WHERE correo = $1', [correo]);
        if (c2.rows.length > 0) return res.status(400).json({ mensaje: 'Este correo ya está registrado como administrador' });
        const c3 = await pool.query('SELECT id FROM clientes WHERE LOWER(nombre) = LOWER($1)', [nombre]);
        if (c3.rows.length > 0) return res.status(400).json({ mensaje: 'Este nombre ya está registrado' });
        const c4 = await pool.query('SELECT id FROM clientes WHERE telefono = $1', [telefono]);
        if (c4.rows.length > 0) return res.status(400).json({ mensaje: 'Este teléfono ya está registrado' });
        const c5 = await pool.query('SELECT id FROM administradores WHERE telefono = $1', [telefono]);
        if (c5.rows.length > 0) return res.status(400).json({ mensaje: 'Este teléfono ya está registrado como administrador' });
        const hash = await bcrypt.hash(contrasena, SALT);
        await pool.query(
            'INSERT INTO clientes (nombre, telefono, direccion, correo, contrasena) VALUES ($1,$2,$3,$4,$5)',
            [nombre, telefono, direccion, correo, hash]
        );
        res.json({ mensaje: 'Cliente registrado correctamente' });
    } catch (error) {
        console.error('POST /registrar:', error.message);
        res.status(500).json({ mensaje: 'Error al registrar' });
    }
});

app.post('/loginCliente', async (req, res) => {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) return res.status(400).json({ success: false, mensaje: 'Correo y contraseña requeridos' });
    try {
        const r = await pool.query('SELECT * FROM clientes WHERE correo = $1', [correo]);
        if (r.rows.length === 0) return res.json({ success: false, mensaje: 'Correo o contraseña incorrectos' });
        const cliente = r.rows[0];
        const ok = await bcrypt.compare(contrasena, cliente.contrasena);
        if (!ok) return res.json({ success: false, mensaje: 'Correo o contraseña incorrectos' });
        res.json({ success: true, mensaje: 'Login correcto', usuario: { id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono, direccion: cliente.direccion, correo: cliente.correo } });
    } catch (error) {
        console.error('POST /loginCliente:', error.message);
        res.status(500).json({ success: false, mensaje: 'Error del servidor' });
    }
});

// Lista de clientes para el admin
app.get('/clientes', async (req, res) => {
    try {
        const r = await pool.query('SELECT id, nombre, telefono, direccion, correo FROM clientes ORDER BY id DESC');
        res.json({ clientes: r.rows });
    } catch (error) {
        console.error('GET /clientes:', error.message);
        res.status(500).json({ mensaje: 'Error al obtener clientes' });
    }
});

/* ══════════════════════════════════════════════════════════════
   ADMINISTRADORES
══════════════════════════════════════════════════════════════ */
app.post('/registrarAdmin', async (req, res) => {
    const { nombre, telefono, correo, contrasena } = req.body;
    if (!nombre || !telefono || !correo || !contrasena)
        return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    try {
        const c1 = await pool.query('SELECT id FROM administradores WHERE correo = $1', [correo]);
        if (c1.rows.length > 0) return res.status(400).json({ mensaje: 'Este correo ya está registrado como administrador' });
        const c2 = await pool.query('SELECT id FROM clientes WHERE correo = $1', [correo]);
        if (c2.rows.length > 0) return res.status(400).json({ mensaje: 'Este correo ya está registrado como cliente' });
        const c3 = await pool.query('SELECT id FROM administradores WHERE LOWER(nombre) = LOWER($1)', [nombre]);
        if (c3.rows.length > 0) return res.status(400).json({ mensaje: 'Este nombre ya está registrado' });
        const c4 = await pool.query('SELECT id FROM administradores WHERE telefono = $1', [telefono]);
        if (c4.rows.length > 0) return res.status(400).json({ mensaje: 'Este teléfono ya está registrado' });
        const c5 = await pool.query('SELECT id FROM clientes WHERE telefono = $1', [telefono]);
        if (c5.rows.length > 0) return res.status(400).json({ mensaje: 'Este teléfono ya está registrado como cliente' });
        const hash = await bcrypt.hash(contrasena, SALT);
        await pool.query(
            'INSERT INTO administradores (nombre, telefono, correo, contrasena) VALUES ($1,$2,$3,$4)',
            [nombre, telefono, correo, hash]
        );
        res.json({ mensaje: 'Administrador registrado correctamente' });
    } catch (error) {
        console.error('POST /registrarAdmin:', error.message);
        res.status(500).json({ mensaje: 'Error al registrar administrador' });
    }
});

app.post('/loginAdmin', async (req, res) => {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) return res.status(400).json({ success: false, mensaje: 'Correo y contraseña requeridos' });
    try {
        const r = await pool.query('SELECT * FROM administradores WHERE correo = $1', [correo]);
        if (r.rows.length === 0) return res.json({ success: false, mensaje: 'Credenciales incorrectas' });
        const admin = r.rows[0];
        const ok = await bcrypt.compare(contrasena, admin.contrasena);
        if (!ok) return res.json({ success: false, mensaje: 'Credenciales incorrectas' });
        res.json({ success: true, mensaje: 'Login admin correcto', usuario: { id: admin.id, nombre: admin.nombre, telefono: admin.telefono, correo: admin.correo } });
    } catch (error) {
        console.error('POST /loginAdmin:', error.message);
        res.status(500).json({ success: false, mensaje: 'Error del servidor' });
    }
});

/* ══════════════════════════════════════════════════════════════
   PEDIDOS
══════════════════════════════════════════════════════════════ */
app.post('/pedido', async (req, res) => {
    const { cliente_id, cliente_nombre, cliente_correo, items, total } = req.body;
    if (!cliente_id || !items || !total)
        return res.status(400).json({ mensaje: 'Datos del pedido incompletos' });
    try {
        const r = await pool.query(
            "INSERT INTO pedidos (cliente_id, cliente_nombre, cliente_correo, items, total, estado) VALUES ($1,$2,$3,$4,$5,'pendiente') RETURNING id",
            [cliente_id, cliente_nombre, cliente_correo, JSON.stringify(items), total]
        );
        res.json({ mensaje: 'Pedido enviado. En espera de confirmación.', pedido_id: r.rows[0].id });
    } catch (error) {
        console.error('POST /pedido:', error.message);
        res.status(500).json({ mensaje: 'Error al guardar el pedido' });
    }
});

app.get('/pedidos', async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM pedidos ORDER BY fecha DESC');
        res.json({ pedidos: r.rows });
    } catch (error) {
        console.error('GET /pedidos:', error.message);
        res.status(500).json({ mensaje: 'Error al obtener pedidos' });
    }
});

app.put('/pedido/:id', async (req, res) => {
    const { id }     = req.params;
    const { estado } = req.body;
    if (!['confirmado','cancelado','en-transito','entregado'].includes(estado))
        return res.status(400).json({ mensaje: 'Estado no válido' });
    try {
        await pool.query('UPDATE pedidos SET estado = $1 WHERE id = $2', [estado, id]);
        res.json({ mensaje: 'Pedido actualizado a: ' + estado });
    } catch (error) {
        console.error('PUT /pedido:', error.message);
        res.status(500).json({ mensaje: 'Error al actualizar pedido' });
    }
});

/* ══════════════════════════════════════════════════════════════
   TICKETS
══════════════════════════════════════════════════════════════ */

// Cliente abre un ticket
app.post('/ticket', async (req, res) => {
    const { cliente_id, cliente_nombre, cliente_correo, asunto, mensaje } = req.body;
    if (!cliente_id || !asunto || !mensaje)
        return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    try {
        await pool.query(
            "INSERT INTO tickets (cliente_id, cliente_nombre, cliente_correo, asunto, mensaje, estado) VALUES ($1,$2,$3,$4,$5,'abierto')",
            [cliente_id, cliente_nombre, cliente_correo, asunto, mensaje]
        );
        res.json({ mensaje: 'Ticket enviado correctamente' });
    } catch (error) {
        console.error('POST /ticket:', error.message);
        res.status(500).json({ mensaje: 'Error al crear ticket' });
    }
});

// Admin obtiene todos los tickets
app.get('/tickets', async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM tickets ORDER BY fecha DESC');
        res.json({ tickets: r.rows });
    } catch (error) {
        console.error('GET /tickets:', error.message);
        res.status(500).json({ mensaje: 'Error al obtener tickets' });
    }
});

// Admin responde y actualiza estado de ticket
app.put('/ticket/:id', async (req, res) => {
    const { id }                  = req.params;
    const { respuesta, estado }   = req.body;
    if (!respuesta || !estado)
        return res.status(400).json({ mensaje: 'Respuesta y estado requeridos' });
    try {
        await pool.query(
            'UPDATE tickets SET respuesta = $1, estado = $2 WHERE id = $3',
            [respuesta, estado, id]
        );
        res.json({ mensaje: 'Ticket actualizado correctamente' });
    } catch (error) {
        console.error('PUT /ticket:', error.message);
        res.status(500).json({ mensaje: 'Error al actualizar ticket' });
    }
});

/* ══════════════════════════════════════════════════════════════
   PRECIOS
══════════════════════════════════════════════════════════════ */

// Obtener precios desde la BD
app.get('/precios', async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM precios ORDER BY id');
        res.json({ precios: r.rows });
    } catch (error) {
        console.error('GET /precios:', error.message);
        res.status(500).json({ mensaje: 'Error al obtener precios' });
    }
});

// Admin guarda precios en la BD
app.put('/precios', async (req, res) => {
    const { precios } = req.body;
    if (!precios || !Array.isArray(precios))
        return res.status(400).json({ mensaje: 'Datos inválidos' });
    try {
        for (const item of precios) {
            await pool.query('UPDATE precios SET precio = $1 WHERE id = $2', [item.precio, item.id]);
        }
        res.json({ mensaje: 'Precios actualizados correctamente' });
    } catch (error) {
        console.error('PUT /precios:', error.message);
        res.status(500).json({ mensaje: 'Error al guardar precios' });
    }
});

/* ══════════════════════════════════════════════════════════════
   DASHBOARD — datos reales
══════════════════════════════════════════════════════════════ */
app.get('/dashboard', async (req, res) => {
    try {
        const clientes    = await pool.query('SELECT COUNT(*) FROM clientes');
        const pendientes  = await pool.query("SELECT COUNT(*) FROM pedidos WHERE estado = 'pendiente'");
        const activos     = await pool.query("SELECT COUNT(*) FROM pedidos WHERE estado NOT IN ('entregado','cancelado')");
        const pedidos     = await pool.query('SELECT * FROM pedidos ORDER BY fecha DESC LIMIT 5');
        const ticketsAb   = await pool.query("SELECT COUNT(*) FROM tickets WHERE estado = 'abierto'");
        res.json({
            clientes:          parseInt(clientes.rows[0].count),
            pedidosPendientes: parseInt(pendientes.rows[0].count),
            pedidosActivos:    parseInt(activos.rows[0].count),
            ticketsAbiertos:   parseInt(ticketsAb.rows[0].count),
            ultimosPedidos:    pedidos.rows
        });
    } catch (error) {
        console.error('GET /dashboard:', error.message);
        res.status(500).json({ mensaje: 'Error al obtener datos del dashboard' });
    }
});

/* ══════════════════════════════════════════════════════════════
   ARRANCAR SERVIDOR  ← siempre al final
══════════════════════════════════════════════════════════════ */
app.listen(3000, () => {
    console.log('Servidor funcionando en puerto 3000');
});
console.log('Happy developing ✨');

/* ══════════════════════════════════════════════════════════════
   index.js — Conecta el HTML con el servidor
   Sobrescribe las funciones del HTML para usar el backend real
══════════════════════════════════════════════════════════════ */

const BASE = 'https://michivery.onrender.com';

// ── REGISTRO CLIENTE ──────────────────────────────────────────
async function registerCliente() {
    const nombre     = document.getElementById('cliNombre').value.trim();
    const telefono   = document.getElementById('cliTelefono').value.trim();
    const direccion  = document.getElementById('cliDireccion').value.trim();
    const correo     = document.getElementById('newEmailCliente').value.trim();
    const contrasena = document.getElementById('newPassCliente').value;

    if (!nombre || !telefono || !direccion || !correo || !contrasena) {
        showMsg('regCliMsg', 'error', '❌ Todos los campos son obligatorios');
        return;
    }
    if (!validarPass(contrasena)) {
        showMsg('regCliMsg', 'error', '❌ La contraseña no cumple los requisitos');
        return;
    }

    try {
        const respuesta = await fetch(BASE + '/registrar', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ nombre, telefono, direccion, correo, contrasena })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            showMsg('regCliMsg', 'success', '✅ ' + resultado.mensaje);
            ['cliNombre', 'cliTelefono', 'cliDireccion', 'newEmailCliente', 'newPassCliente']
                .forEach(id => document.getElementById(id).value = '');
            setTimeout(() => goTo('login'), 1500);
        } else {
            showMsg('regCliMsg', 'error', '❌ ' + resultado.mensaje);
        }

    } catch (error) {
        console.error('registerCliente:', error);
        showMsg('regCliMsg', 'error', '❌ Error al conectar con el servidor');
    }
}

// ── REGISTRO ADMIN ────────────────────────────────────────────
async function registerAdmin() {
    const nombre     = document.getElementById('adminNombre').value.trim();
    const telefono   = document.getElementById('adminTelefono').value.trim();
    const correo     = document.getElementById('newEmailAdmin').value.trim();
    const contrasena = document.getElementById('newPassAdmin').value;

    if (!nombre || !telefono || !correo || !contrasena) {
        showMsg('regAdminMsg', 'error', '❌ Todos los campos son obligatorios');
        return;
    }
    if (!validarPass(contrasena)) {
        showMsg('regAdminMsg', 'error', '❌ La contraseña no cumple los requisitos');
        return;
    }

    try {
        const respuesta = await fetch(BASE + '/registrarAdmin', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ nombre, telefono, correo, contrasena })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            showMsg('regAdminMsg', 'success', '✅ ' + resultado.mensaje);
            ['adminNombre', 'adminTelefono', 'newEmailAdmin', 'newPassAdmin']
                .forEach(id => document.getElementById(id).value = '');
            setTimeout(() => goTo('login'), 1500);
        } else {
            showMsg('regAdminMsg', 'error', '❌ ' + resultado.mensaje);
        }

    } catch (error) {
        console.error('registerAdmin:', error);
        showMsg('regAdminMsg', 'error', '❌ Error al conectar con el servidor');
    }
}

// ── LOGIN ─────────────────────────────────────────────────────
async function login() {
    const correo     = document.getElementById('loginEmail').value.trim();
    const contrasena = document.getElementById('loginPass').value;

    if (!correo || !contrasena) {
        showMsg('loginMsg', 'error', '❌ Completa todos los campos');
        return;
    }

    const esAdmin = loginRoleSel === 'admin';
    const url     = esAdmin
        ? BASE + '/loginAdmin'
        : BASE + '/loginCliente';

    try {
        const respuesta = await fetch(url, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ correo, contrasena })
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            sessionUser = resultado.usuario || { correo };
            sessionRole = esAdmin ? 'admin' : 'cliente';

            setSidebarForRole(sessionRole, correo);
            setHeaderForRole(sessionRole);

            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPass').value  = '';

            if (esAdmin) {
                registros = loadRegistros();
                goTo('adminDashboard');
            } else {
                cart = [];
                goTo('products');
            }

        } else {
            showMsg('loginMsg', 'error', '❌ ' + (resultado.mensaje || 'Credenciales incorrectas'));
        }

    } catch (error) {
        console.error('login:', error);
        showMsg('loginMsg', 'error', '❌ Error al conectar con el servidor');
    }
}

// ── CONFIRMAR PEDIDO ──────────────────────────────────────────
async function confirmarPedidoServidor() {
    if (cart.length === 0) {
        showMsg('orderMsg', 'warning', '⚠️ Agrega al menos un producto antes de confirmar');
        return;
    }

    const total = cart.reduce((a, c) => a + c.price * c.qty, 0);

    showModal('Confirmar pedido', '¿Deseas enviar tu pedido? Total: $' + total, async () => {
        try {
            const respuesta = await fetch(BASE + '/pedido', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cliente_id:      sessionUser.id,
                    cliente_nombre:  sessionUser.nombre,
                    cliente_correo:  sessionUser.correo,
                    items:           cart,
                    total:           total
                })
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                cart = [];
                updateCartCount();
                goTo('esperando');
            } else {
                showMsg('orderMsg', 'error', '❌ ' + resultado.mensaje);
            }

        } catch (error) {
            console.error('confirmarPedido:', error);
            showMsg('orderMsg', 'error', '❌ Error al conectar con el servidor');
        }
    });
}

// ── DASHBOARD REAL ────────────────────────────────────────────
async function refreshDashboard() {
    try {
        const respuesta = await fetch(BASE + '/dashboard');
        const datos     = await respuesta.json();

        const e1 = document.getElementById('statClientes');
        const e2 = document.getElementById('statPendientes');
        const e3 = document.getElementById('statActivos');
        if (e1) e1.textContent = datos.clientes;
        if (e2) e2.textContent = datos.pedidosPendientes;
        if (e3) e3.textContent = datos.pedidosActivos;

        const tbody = document.getElementById('bodyActividad');
        if (tbody) {
            if (datos.ultimosPedidos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:16px;">Sin actividad reciente</td></tr>';
            } else {
                tbody.innerHTML = datos.ultimosPedidos.map(p => {
                    const fecha = new Date(p.fecha).toLocaleString('es-MX');
                    const badgeClass = {
                        'pendiente':   'pendiente',
                        'confirmado':  'activo',
                        'en-transito': 'en-transito',
                        'entregado':   'entregado',
                        'cancelado':   'cancelado'
                    }[p.estado] || 'pendiente';
                    const badgeText = {
                        'pendiente':   'Pendiente',
                        'confirmado':  'Confirmado',
                        'en-transito': 'En tránsito',
                        'entregado':   'Entregado',
                        'cancelado':   'Cancelado'
                    }[p.estado] || p.estado;
                    return `
                    <tr>
                        <td>Pedido #${p.id}</td>
                        <td>${p.cliente_correo || '—'}</td>
                        <td>${fecha}</td>
                        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                    </tr>`;
                }).join('');
            }
        }

    } catch (error) {
        console.error('refreshDashboard:', error);
    }
}

// ── PEDIDOS DEL ADMIN ─────────────────────────────────────────
async function cargarPedidosAdmin() {
    try {
        const respuesta = await fetch(BASE + '/pedidos');
        const datos     = await respuesta.json();
        const tbody     = document.getElementById('bodyPedidos');
        if (!tbody) return;

        if (datos.pedidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:16px;">No hay pedidos aún</td></tr>';
            return;
        }

        tbody.innerHTML = datos.pedidos.map(p => {
            const items   = JSON.parse(p.items || '[]');
            const resumen = items.map(i => i.name + ' ×' + i.qty).join(', ');
            const fecha   = new Date(p.fecha).toLocaleString('es-MX');
            const badgeClass = {
                'pendiente':   'pendiente',
                'confirmado':  'activo',
                'en-transito': 'en-transito',
                'entregado':   'entregado',
                'cancelado':   'cancelado'
            }[p.estado] || 'pendiente';
            const badgeText = {
                'pendiente':   'Pendiente',
                'confirmado':  'Confirmado',
                'en-transito': 'En tránsito',
                'entregado':   'Entregado',
                'cancelado':   'Cancelado'
            }[p.estado] || p.estado;

            const botones = p.estado === 'pendiente'
                ? `<button class="tbl-btn green"  onclick="actualizarPedido(${p.id},'confirmado')">✅ Confirmar</button>
                   <button class="tbl-btn red"    onclick="actualizarPedido(${p.id},'cancelado')">✖ Cancelar</button>`
                : p.estado === 'confirmado'
                    ? `<button class="tbl-btn purple" onclick="actualizarPedido(${p.id},'en-transito')">🚚 Enviar</button>`
                    : p.estado === 'en-transito'
                        ? `<button class="tbl-btn amber"  onclick="actualizarPedido(${p.id},'entregado')">📦 Entregado</button>`
                        : `<span style="font-size:12px;color:#9ca3af;">Finalizado</span>`;

            return `
            <tr>
                <td><strong>#${p.id}</strong></td>
                <td>${p.cliente_nombre || '—'}<br><span style="font-size:11px;color:#9ca3af;">${p.cliente_correo || ''}</span></td>
                <td style="font-size:12px;">${resumen}</td>
                <td><strong>$${p.total}</strong></td>
                <td>${fecha}</td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                <td style="display:flex;gap:4px;flex-wrap:wrap;">${botones}</td>
            </tr>`;
        }).join('');

    } catch (error) {
        console.error('cargarPedidosAdmin:', error);
    }
}

async function actualizarPedido(id, estado) {
    try {
        await fetch(BASE + '/pedido/' + id, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ estado })
        });
        cargarPedidosAdmin();
        refreshDashboard();
    } catch (error) {
        console.error('actualizarPedido:', error);
    }
}

// ── CUENTAS ADMIN ─────────────────────────────────────────────
async function cargarCuentasAdmin() {
    const tbody = document.getElementById('bodyCuentas');
    try {
        const respuesta = await fetch(BASE + '/clientes');
        const datos     = await respuesta.json();
        if (datos.clientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:20px;">No hay clientes registrados</td></tr>';
            return;
        }
        tbody.innerHTML = datos.clientes.map(c => `
        <tr>
            <td>${c.nombre}</td>
            <td>${c.correo}</td>
            <td>${c.telefono}</td>
            <td>${c.direccion}</td>
        </tr>`).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--red);padding:20px;">Error al cargar clientes</td></tr>';
    }
}

// ── UBICACIONES ───────────────────────────────────────────────
async function cargarUbicaciones() {
    const tbody = document.getElementById('bodyUbicaciones');
    try {
        const respuesta  = await fetch(BASE + '/pedidos');
        const datos      = await respuesta.json();
        const enTransito = datos.pedidos.filter(p => p.estado === 'en-transito' || p.estado === 'confirmado');
        if (enTransito.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:20px;">No hay pedidos en camino</td></tr>';
            return;
        }
        tbody.innerHTML = enTransito.map(p => `
        <tr>
            <td><strong>#${p.id}</strong></td>
            <td>${p.cliente_nombre || '—'}</td>
            <td><strong>$${p.total}</strong></td>
            <td><span class="badge ${p.estado === 'en-transito' ? 'en-transito' : 'activo'}">${p.estado === 'en-transito' ? 'En tránsito' : 'Confirmado'}</span></td>
            <td>
                ${p.estado === 'confirmado'
            ? `<button class="tbl-btn purple" onclick="actualizarPedido(${p.id},'en-transito')">🚚 Enviar</button>`
            : `<button class="tbl-btn amber"  onclick="actualizarPedido(${p.id},'entregado')">📦 Entregado</button>`
        }
            </td>
        </tr>`).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--red);padding:20px;">Error al cargar</td></tr>';
    }
}
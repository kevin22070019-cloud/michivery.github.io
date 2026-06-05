console.log('Happy developing ✨');

const BASE = 'https://michivery.onrender.com';

// Variable para guardar el intervalo de seguimiento
let intervaloSeguimiento = null;
let pedidoActivoId       = null;

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
    const url     = esAdmin ? BASE + '/loginAdmin' : BASE + '/loginCliente';

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
        showMsg('loginMsg', 'error', '❌ Error al conectar con el servidor');
    }
}

// ── RECUPERAR CONTRASEÑA (REAL) ───────────────────────────────
async function recover() {
    const correo = document.getElementById('recoverEmail').value.trim();
    if (!correo) {
        showMsg('recoverMsg', 'warning', '⚠️ Ingresa tu correo electrónico');
        return;
    }

    const btn = document.getElementById('btnRecover');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
        const respuesta = await fetch(BASE + '/recuperar-contrasena', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ correo })
        });
        const resultado = await respuesta.json();

        if (respuesta.ok) {
            showMsg('recoverMsg', 'success', '✅ ' + resultado.mensaje);
            document.getElementById('recoverEmail').value = '';
            setTimeout(() => goTo('login'), 3000);
        } else {
            showMsg('recoverMsg', 'error', '❌ ' + resultado.mensaje);
        }
    } catch (error) {
        showMsg('recoverMsg', 'error', '❌ Error al conectar con el servidor');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar enlace';
    }
}

// ── RESTABLECER CONTRASEÑA (REAL) ─────────────────────────────
async function resetPassword() {
    const token      = document.getElementById('resetToken').value.trim();
    const contrasena = document.getElementById('resetNewPass').value;

    if (!token || !contrasena) {
        showMsg('resetMsg', 'error', '❌ Completa todos los campos');
        return;
    }
    if (!validarPass(contrasena)) {
        showMsg('resetMsg', 'error', '❌ La contraseña no cumple los requisitos de seguridad');
        return;
    }

    try {
        const respuesta = await fetch(BASE + '/restablecer-contrasena', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ token, contrasena })
        });
        const resultado = await respuesta.json();

        if (respuesta.ok) {
            showMsg('resetMsg', 'success', '✅ ' + resultado.mensaje);
            document.getElementById('resetToken').value   = '';
            document.getElementById('resetNewPass').value = '';
            setTimeout(() => goTo('login'), 2000);
        } else {
            showMsg('resetMsg', 'error', '❌ ' + resultado.mensaje);
        }
    } catch (error) {
        showMsg('resetMsg', 'error', '❌ Error al conectar con el servidor');
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
                    cliente_id:     sessionUser.id,
                    cliente_nombre: sessionUser.nombre,
                    cliente_correo: sessionUser.correo,
                    items:          cart,
                    total:          total
                })
            });
            const resultado = await respuesta.json();
            if (respuesta.ok) {
                pedidoActivoId = resultado.pedido_id;
                cart = [];
                updateCartCount();
                goTo('esperando');
                iniciarSeguimiento();
            } else {
                showMsg('orderMsg', 'error', '❌ ' + resultado.mensaje);
            }
        } catch (error) {
            showMsg('orderMsg', 'error', '❌ Error al conectar con el servidor');
        }
    });
}

// ── SEGUIMIENTO AUTOMÁTICO ────────────────────────────────────
function iniciarSeguimiento() {
    if (intervaloSeguimiento) clearInterval(intervaloSeguimiento);
    intervaloSeguimiento = setInterval(verificarEstadoPedido, 5000);
}

function detenerSeguimiento() {
    if (intervaloSeguimiento) {
        clearInterval(intervaloSeguimiento);
        intervaloSeguimiento = null;
    }
}

async function verificarEstadoPedido() {
    if (!sessionUser || !sessionUser.id) return;
    try {
        const respuesta = await fetch(BASE + '/pedido/cliente/' + sessionUser.id);
        const datos     = await respuesta.json();
        if (!datos.pedido) return;

        const estado = datos.pedido.estado;

        if (estado === 'confirmado') {
            detenerSeguimiento();
            mostrarPedidoConfirmado();
        } else if (estado === 'cancelado') {
            detenerSeguimiento();
            mostrarPedidoCancelado();
        } else if (estado === 'en-transito') {
            detenerSeguimiento();
            mostrarPedidoEnviado();
        } else if (estado === 'entregado') {
            detenerSeguimiento();
            mostrarPedidoEntregado();
        }
    } catch (error) {
        console.error('verificarEstadoPedido:', error);
    }
}

// ── PANTALLAS DE ESTADO ───────────────────────────────────────
function mostrarPedidoConfirmado() {
    const pantalla = document.getElementById('esperando');
    pantalla.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:72px; margin-bottom:16px;">✅</div>
            <h2 style="color: var(--green);">¡Pedido confirmado!</h2>
            <div class="msg success show" style="justify-content:center; margin: 16px 0;">
                🎉 El administrador confirmó tu pedido. ¡Ya está en preparación!
            </div>
            <p style="color:gray; font-size:14px;">En breve será enviado a tu dirección.</p>
            <button class="btn" onclick="goTo('products')" style="margin-top:20px;">🏠 Volver al menú</button>
        </div>`;
}

function mostrarPedidoCancelado() {
    const pantalla = document.getElementById('esperando');
    pantalla.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:72px; margin-bottom:16px;">❌</div>
            <h2 style="color: var(--red);">Pedido cancelado</h2>
            <div class="msg error show" style="justify-content:center; margin: 16px 0;">
                Tu pedido fue cancelado por el administrador.
            </div>
            <button class="btn btn-cancel" onclick="goTo('products')" style="margin-top:20px;">🏠 Volver al menú</button>
        </div>`;
}

// ── Pantalla final: "Enviado a domicilio" ─────────────────────
function mostrarPedidoEnviado() {
    const pantalla = document.getElementById('esperando');
    pantalla.innerHTML = `
        <div style="text-align:center; padding: 30px 20px;">
            <div style="font-size:80px; margin-bottom:16px;">🛵</div>
            <h2 style="color: var(--blue); margin-bottom:8px;">¡Pedido enviado a domicilio!</h2>
            <div class="msg info show" style="justify-content:center; margin: 16px 0;">
                🚀 Tu pedido está en camino. ¡Pronto llegará a tu puerta!
            </div>
            <p style="color:gray; font-size:14px; margin-bottom:24px;">
                Tiempo estimado de entrega: <strong>30 – 45 minutos</strong>
            </p>
            <div style="background:var(--green-light); border-radius:12px; padding:16px; margin-bottom:24px; border:1px solid #bbf7d0;">
                <p style="margin:0; font-size:13px; color:var(--green); font-weight:600;">
                    ✅ Tu pedido ha sido entregado al repartidor.<br>
                    No es necesario hacer nada más. ¡Gracias por tu compra en MICHIVERY!
                </p>
            </div>
            <button class="btn" onclick="goTo('products')" style="max-width:300px; margin:auto;">
                🏠 Volver al menú
            </button>
        </div>`;
}

function mostrarPedidoEntregado() {
    const pantalla = document.getElementById('esperando');
    pantalla.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:72px; margin-bottom:16px;">📦</div>
            <h2 style="color: var(--green);">¡Pedido entregado!</h2>
            <div class="msg success show" style="justify-content:center; margin: 16px 0;">
                Tu pedido fue entregado exitosamente. ¡Gracias por tu compra!
            </div>
            <button class="btn" onclick="goTo('products')" style="margin-top:20px;">🏠 Volver al menú</button>
        </div>`;
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
                    const badgeClass = { 'pendiente':'pendiente','confirmado':'activo','en-transito':'en-transito','entregado':'entregado','cancelado':'cancelado' }[p.estado] || 'pendiente';
                    const badgeText  = { 'pendiente':'Pendiente','confirmado':'Confirmado','en-transito':'En tránsito','entregado':'Entregado','cancelado':'Cancelado' }[p.estado] || p.estado;
                    return `<tr>
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
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:16px;">No hay pedidos aún</td></tr>';
            return;
        }
        tbody.innerHTML = datos.pedidos.map(p => {
            const items   = JSON.parse(p.items || '[]');
            const resumen = items.map(i => i.name + ' x' + i.qty).join(', ');
            const fecha   = new Date(p.fecha).toLocaleString('es-MX');
            const badgeClass = { 'pendiente':'pendiente','confirmado':'activo','en-transito':'en-transito','entregado':'entregado','cancelado':'cancelado' }[p.estado] || 'pendiente';
            const badgeText  = { 'pendiente':'Pendiente','confirmado':'Confirmado','en-transito':'En tránsito','entregado':'Entregado','cancelado':'Cancelado' }[p.estado] || p.estado;

            let botones = '';
            if (p.estado === 'pendiente') {
                botones = `
                    <button class="tbl-btn green" onclick="actualizarPedido(${p.id},'confirmado')">✅ Confirmar</button>
                    <button class="tbl-btn red"   onclick="actualizarPedido(${p.id},'cancelado')">✖ Cancelar</button>`;
            } else if (p.estado === 'confirmado') {
                botones = `<button class="tbl-btn purple" onclick="actualizarPedido(${p.id},'en-transito')">🚚 Enviar a domicilio</button>`;
            } else if (p.estado === 'en-transito') {
                botones = `<button class="tbl-btn amber" onclick="actualizarPedido(${p.id},'entregado')">📦 Marcar entregado</button>`;
            } else {
                botones = `<span style="font-size:12px;color:#9ca3af;">Finalizado</span>`;
            }

            return `<tr>
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
        const ubScreen = document.getElementById('adminUbicaciones');
        if (ubScreen && ubScreen.classList.contains('screen-active')) {
            cargarUbicaciones();
        }
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
            <td>${p.estado === 'confirmado'
            ? `<button class="tbl-btn purple" onclick="actualizarPedido(${p.id},'en-transito')">🚚 Enviar a domicilio</button>`
            : `<button class="tbl-btn amber"  onclick="actualizarPedido(${p.id},'entregado')">📦 Marcar entregado</button>`
        }</td>
        </tr>`).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--red);padding:20px;">Error al cargar</td></tr>';
    }
}
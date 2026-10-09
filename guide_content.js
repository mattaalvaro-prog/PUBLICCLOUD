/**
 * PORTAL OPE - Guía Definitiva para Dummies
 * Contenido ultra-detallado con pasos numerados y consejos.
 */

const HELP_CONTENT = [
    {
        id: 'bienvenida',
        title: '1. Empezar Aquí (Login)',
        icon: 'fa-door-open',
        content: `
            <p>¡Hola! Esta es tu guía para dominar el Portal OPE sin complicaciones. Vamos paso a paso.</p>
            <div class="help-image-container">
                <img src="guide_dashboard.png" alt="Pantalla Inicial" class="help-image">
            </div>
            <h4>¿Cómo entro por primera vez?</h4>
            <div class="help-stepper">
                <div class="step-item">
                    <div class="step-num">1</div>
                    <div class="step-txt">Escribe tu <strong>correo electrónico</strong> corporativo.</div>
                </div>
                <div class="step-item">
                    <div class="step-num">2</div>
                    <div class="step-txt">Introduce la <strong>contraseña</strong> que te hemos dado.</div>
                </div>
                <div class="step-item">
                    <div class="step-num">3</div>
                    <div class="step-txt">Pulsa el botón azul <strong>"Acceder"</strong>.</div>
                </div>
            </div>
            <div class="help-alert info">
                <i class="fas fa-lightbulb"></i> <strong>Truco:</strong> Una vez dentro, verás el "Dashboard" (tu casa). Es un resumen de todo lo que pasa en tus proyectos.
            </div>
        `
    },
    {
        id: 'proyectos',
        title: '2. Seleccionar Proyecto',
        icon: 'fa-mouse-pointer',
        content: `
            <p>Antes de hacer nada, el sistema debe saber en qué proyecto quieres trabajar. <strong>¡Este paso es obligatorio!</strong></p>
            <div class="help-image-container">
                <img src="guide_projects.png" alt="Elegir Proyecto" class="help-image">
            </div>
            <h4>¿Cómo elijo mi proyecto?</h4>
            <div class="help-stepper">
                <div class="step-item">
                    <div class="step-num">1</div>
                    <div class="step-txt">Haz clic en <strong>"Selección PRJ"</strong> (está en el menú de la izquierda, bajo "Proyectos").</div>
                </div>
                <div class="step-item">
                    <div class="step-num">2</div>
                    <div class="step-txt">Busca tu proyecto en la lista. Puedes usar el buscador de arriba si hay muchos.</div>
                </div>
                <div class="step-item">
                    <div class="step-num">3</div>
                    <div class="step-txt">Pulsa el botón redondo con un <strong>check (✔)</strong> que hay al final de la fila de tu proyecto.</div>
                </div>
                <div class="step-item">
                    <div class="step-num">4</div>
                    <div class="step-txt">Mira arriba: ahora debería poner el nombre de tu proyecto en la barra azul.</div>
                </div>
            </div>
            <div class="help-alert warning">
                <i class="fas fa-exclamation-circle"></i> <strong>Cuidado:</strong> Si no haces esto, los demás botones no mostrarán ninguna información.
            </div>
        `
    },
    {
        id: 'fases',
        title: '3. Las 6 Fases (El Ciclo)',
        icon: 'fa-route',
        content: `
            <p>Un proyecto es como un viaje con 6 paradas obligatorias. A esto lo llamamos "Ciclo de Vida":</p>
            <div class="help-stepper">
                <div class="step-item">
                    <div class="step-num">1</div>
                    <div class="step-txt"><strong>DESCUBRIR (DES):</strong> El inicio. Aquí guardamos la oferta y el contrato.</div>
                </div>
                <div class="step-item">
                    <div class="step-num">2</div>
                    <div class="step-txt"><strong>PREPARAR (PRE):</strong> Organizamos el equipo y el calendario de reuniones.</div>
                </div>
                <div class="step-item">
                    <div class="step-num">3</div>
                    <div class="step-txt"><strong>EXPLORAR (EXP):</strong> Vemos cómo adaptar SAP a tu negocio.</div>
                </div>
                <div class="step-item">
                    <div class="step-num">4</div>
                    <div class="step-txt"><strong>REALIZAR (REA):</strong> Construimos el sistema y tú haces las pruebas finales.</div>
                </div>
                <div class="step-item">
                    <div class="step-num">5</div>
                    <div class="step-txt"><strong>DESPLEGAR (DEY):</strong> ¡Encendemos el sistema real! Aquí gestionamos los fallos iniciales.</div>
                </div>
                <div class="step-item">
                    <div class="step-num">6</div>
                    <div class="step-txt"><strong>EJECUTAR (EJE):</strong> El día a día. Soporte continuo para tus dudas.</div>
                </div>
            </div>
            <p><strong>¿Cómo ver una fase?</strong> Simplemente haz clic en su nombre en el menú de la izquierda.</p>
        `
    },
    {
        id: 'documentacion',
        title: '4. Documentos (Subir/Bajar)',
        icon: 'fa-file-medical',
        content: `
            <p>Cada fase tiene sus propios documentos (PDFs, Excels, etc.).</p>
            <h4>¿Cómo subo un documento nuevo?</h4>
            <div class="help-stepper">
                <div class="step-item">
                    <div class="step-num">1</div>
                    <div class="step-txt">Entra en la fase que te toque (ej: <strong>PREPARAR</strong>).</div>
                </div>
                <div class="step-item">
                    <div class="step-num">2</div>
                    <div class="step-txt">Busca el botón azul que representa el tipo de documento (ej: "Kick-Off").</div>
                </div>
                <div class="step-item">
                    <div class="step-num">3</div>
                    <div class="step-txt">Verás una zona gris que dice <strong>"Arrastra archivos aquí"</strong>. Suelta tu archivo ahí.</div>
                </div>
                <div class="step-item">
                    <div class="step-num">4</div>
                    <div class="step-txt">Elige la fecha en la que terminaste el trabajo y dale a <strong>"Guardar"</strong>.</div>
                </div>
            </div>
            <p>Para descargar uno, solo tienes que hacer clic en su nombre en la lista de "Histórico".</p>
        `
    },
    {
        id: 'workshops',
        title: '5. Calendario de Reuniones',
        icon: 'fa-calendar-check',
        content: `
            <p>En el portal puedes ver cuándo son las próximas reuniones (Workshops).</p>
            <div class="help-image-container">
                <img src="guide_calendar.png" alt="Calendario" class="help-image">
            </div>
            <h4>¿Cómo leo el calendario?</h4>
            <ul>
                <li>Cada color es un tipo de reunión diferente.</li>
                <li>Si pulsas sobre una reunión, verás quién es el responsable y qué temas se van a tratar.</li>
                <li>Puedes cambiar de mes usando las flechas <strong> < </strong> y <strong> > </strong> de arriba.</li>
            </ul>
        `
    },
    {
        id: 'incidencias',
        title: '6. Reportar un Problema',
        icon: 'fa-life-ring',
        content: `
            <p>Si algo no funciona, debes avisarnos creando una <strong>"Incidencia"</strong>.</p>
            <div class="help-image-container">
                <img src="guide_incidents.png" alt="Formulario Incidencias" class="help-image">
            </div>
            <h4>Pasos para reportar un error:</h4>
            <ol>
                <li>Ve al módulo <strong>"DEY (Desplegar)"</strong> o al de <strong>"Incidencias"</strong>.</li>
                <li>Pulsa en <strong>"Nueva Incidencia"</strong>.</li>
                <li>Escribe un título y explica qué ha pasado.</li>
                <li><strong>¡AYUDA EXTRA!</strong> Si no sabes cómo explicarlo bien, pulsa el botón <strong>"Sugerir con IA"</strong>. Nuestra Inteligencia Artificial escribirá una propuesta por ti.</li>
                <li>Dale a <strong>"Guardar"</strong>.</li>
            </ol>
            <div class="help-alert magic">
                <i class="fas fa-magic"></i> <strong>Recuerda:</strong> Cuanto mejor expliques el problema, más rápido podremos arreglarlo.
            </div>
        `
    }
];

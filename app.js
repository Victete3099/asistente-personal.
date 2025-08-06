const btn = document.querySelector('.talk');
const content = document.querySelector('.content');

// Función para hablar
function speak(text) {
    const text_speak = new SpeechSynthesisUtterance(text);
    text_speak.rate = 1;
    text_speak.volume = 1;
    text_speak.pitch = 1;
    window.speechSynthesis.speak(text_speak);
}

// Función para desear buenos días/tardes/noches
function wishMe() {
    var day = new Date();
    var hour = day.getHours();
    if (hour >= 0 && hour < 12) {
        speak("Buenos días jefe...");
    } else if (hour >= 12 && hour < 17) {
        speak("Buenas tardes señor...");
    } else {
        speak("Buenas noches señor...");
    }
}

// Escucha el evento de carga de la página
window.addEventListener('load', () => {
    speak("Inicializando JARVIS...");
    wishMe();
});

// Toma los comandos de voz
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.onresult = (event) => {
    const currentIndex = event.resultIndex;
    const transcript = event.results[currentIndex][0].transcript;
    content.textContent = transcript;
    takeCommand(transcript.toLowerCase());
};

btn.addEventListener('click', () => {
    content.textContent = "Escuchando...";
    recognition.start();
});

// --- VARIABLES GLOBALES Y FUNCIONES BÁSICAS ---
let chistesUsados = [];
let recordatorios = [];
let esperandoHora = false;
let recordatoriosRecurrentes = {};

// Carga los recordatorios guardados al iniciar
window.addEventListener('load', () => {
    if (localStorage.getItem('misRecordatorios')) {
        recordatorios = JSON.parse(localStorage.getItem('misRecordatorios'));
    }
    // Inicia el chequeo de alarmas
    setInterval(verificarAlarmas, 60000);

    // Inicia el chequeo de recordatorios recurrentes
    if (localStorage.getItem('recordatoriosRecurrentes')) {
        recordatoriosRecurrentes = JSON.parse(localStorage.getItem('recordatoriosRecurrentes'));
        for (const tarea in recordatoriosRecurrentes) {
            iniciarRecordatorioRecurrente(tarea, recordatoriosRecurrentes[tarea].intervalo);
        }
    }
});

// Función para guardar los recordatorios en el almacenamiento local
function guardarRecordatorios() {
    localStorage.setItem('misRecordatorios', JSON.stringify(recordatorios));
}

// Función para guardar los recordatorios recurrentes
function guardarRecordatoriosRecurrentes() {
    localStorage.setItem('recordatoriosRecurrentes', JSON.stringify(recordatoriosRecurrentes));
}

// Función para hablar
function speak(text) {
    const text_speak = new SpeechSynthesisUtterance(text);
    text_speak.rate = 1;
    text_speak.volume = 1;
    text_speak.pitch = 1;
    window.speechSynthesis.speak(text_speak);
}

// Función para verificar si hay alarmas programadas (una sola vez)
function verificarAlarmas() {
    const ahora = new Date();
    const horaActual = ahora.getHours() + ':' + (ahora.getMinutes() < 10 ? '0' : '') + ahora.getMinutes();

    for (let i = 0; i < recordatorios.length; i++) {
        if (recordatorios[i].hora === horaActual) {
            speak(`¡Alarma! Es la hora de ${recordatorios[i].tarea}.`);
            // Se elimina el recordatorio después de activarse
            recordatorios.splice(i, 1);
            guardarRecordatorios();
        }
    }
}

// Función para iniciar un recordatorio recurrente
function iniciarRecordatorioRecurrente(tarea, intervaloEnMinutos) {
    if (recordatoriosRecurrentes[tarea] && recordatoriosRecurrentes[tarea].id) {
        clearInterval(recordatoriosRecurrentes[tarea].id);
    }
    const idIntervalo = setInterval(() => {
        speak(`Recordatorio de ${tarea}: ¡Es hora de ${tarea} de nuevo!`);
    }, intervaloEnMinutos * 60 * 1000);
    recordatoriosRecurrentes[tarea] = { id: idIntervalo, intervalo: intervaloEnMinutos };
    guardarRecordatoriosRecurrentes();
}

// --- PROCESADOR DE COMANDOS ---
function takeCommand(message) {
    // Lógica para capturar la hora cuando esperamos una respuesta
    if (esperandoHora) {
        const regexHora = /(\d{1,2}) (y|con) (\d{1,2})/i;
        const match = message.match(regexHora);
        if (match) {
            const horas = match[1];
            const minutos = match[3];
            const horaProgramada = `${horas}:${minutos < 10 ? '0' : ''}${minutos}`;
            recordatorios.push({ hora: horaProgramada, tarea: 'tomar pastillas' });
            guardarRecordatorios();
            speak(`Alarma programada para las ${horas} y ${minutos}.`);
            esperandoHora = false;
        } else {
            speak("Lo siento, no entendí la hora. Por favor, inténtelo de nuevo.");
            esperandoHora = false;
        }
    }

    // Saludos y conversaciones simples
    else if (message.includes('hey') || message.includes('hola')) {
        speak("Hola, ¿en qué puedo ayudarle?");
    } else if (message.includes('cómo estás') || message.includes('como estas')) {
        speak("Estoy listo para la acción. ¿Qué tal se siente usted hoy?");
    }

    // Comandos de navegación y búsqueda
    else if (message.includes("abre google")) {
        window.open("https://google.com", "_blank");
        speak("Abriendo Google...");
    } else if (message.includes("abre youtube")) {
        window.open("https://youtube.com", "_blank");
        speak("Abriendo YouTube...");
    } else if (message.includes("abre facebook")) {
        window.open("https://facebook.com", "_blank");
        speak("Abriendo Facebook...");
    } else if (message.includes('qué es') || message.includes('quién es') || message.includes('qué son')) {
        window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank");
        const finalText = "Esto es lo que encontré en internet sobre " + message;
        speak(finalText);
    } else if (message.includes('wikipedia')) {
        window.open(`https://es.wikipedia.org/wiki/${message.replace("wikipedia", "").trim()}`, "_blank");
        const finalText = "Esto es lo que encontré en Wikipedia sobre " + message;
        speak(finalText);
    }

    // Comandos de información de tiempo
    else if (message.includes('qué hora es') || message.includes('que hora es')) {
        const time = new Date().toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
        const finalText = "La hora actual es " + time;
        speak(finalText);
    } else if (message.includes('qué día es hoy') || message.includes('que dia es hoy')) {
        const date = new Date().toLocaleString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        const finalText = "Hoy es " + date;
        speak(finalText);
    }

    // Comandos de entretenimiento
    else if (message.includes('cuéntame un chiste') || message.includes('dime un chiste')) {
        const chistes = [
            "¿Qué le dice un semáforo a otro? No me mires que me estoy cambiando.",
            "¿Qué le dice un pato a otro? Estamos empatados.",
            "¿Cuál es el colmo de un electricista? Tener un mal conductor.",
            "¿Por qué los pájaros no usan Facebook? Porque ya tienen Twitter."
        ];

        let chisteDisponible = chistes.filter(chiste => !chistesUsados.includes(chiste));

        if (chisteDisponible.length === 0) {
            chistesUsados = [];
            chisteDisponible = chistes;
        }

        const chisteAleatorio = chisteDisponible[Math.floor(Math.random() * chisteDisponible.length)];
        chistesUsados.push(chisteAleatorio);

        speak(chisteAleatorio);
    }

    // --- LÓGICA DE RECORDATORIOS Y ALARMAS ---
    else if (message.includes('pon una alarma para pastillas') || message.includes('pon un recordatorio para pastillas')) {
        speak("¿A qué hora quieres que te lo recuerde? Por ejemplo, di: 'a las 10 y 30' o 'a las 14 y 00'.");
        esperandoHora = true;
    }
    
    // --- COMANDOS RECURRENTES ---
    else if (message.includes('recuérdame beber agua cada') || message.includes('recuerdame beber agua cada')) {
        const regexMinutos = /(\d+)\s+minutos/;
        const match = message.match(regexMinutos);
        if (match) {
            const minutos = parseInt(match[1]);
            iniciarRecordatorioRecurrente('beber agua', minutos);
            speak(`Claro, le recordaré beber agua cada ${minutos} minutos.`);
        } else {
            speak("Lo siento, no entendí el tiempo. Por favor, diga, por ejemplo: 'recuérdame beber agua cada 30 minutos'.");
        }
    }
    else if (message.includes('recuérdame pasear cada') || message.includes('recuerdame pasear cada')) {
        const regexMinutos = /(\d+)\s+minutos/;
        const match = message.match(regexMinutos);
        if (match) {
            const minutos = parseInt(match[1]);
            iniciarRecordatorioRecurrente('pasear', minutos);
            speak(`Claro, le recordaré pasear cada ${minutos} minutos.`);
        } else {
            speak("Lo siento, no entendí el tiempo. Por favor, diga, por ejemplo: 'recuérdame pasear cada 60 minutos'.");
        }
    }
    else if (message.includes('detén el recordatorio de beber agua') || message.includes('deten el recordatorio de beber agua')) {
        if (recordatoriosRecurrentes['beber agua']) {
            clearInterval(recordatoriosRecurrentes['beber agua'].id);
            delete recordatoriosRecurrentes['beber agua'];
            guardarRecordatoriosRecurrentes();
            speak("He detenido el recordatorio de beber agua.");
        } else {
            speak("No hay ningún recordatorio de beber agua activo.");
        }
    }
    else if (message.includes('detén el recordatorio de pasear') || message.includes('deten el recordatorio de pasear')) {
        if (recordatoriosRecurrentes['pasear']) {
            clearInterval(recordatoriosRecurrentes['pasear'].id);
            delete recordatoriosRecurrentes['pasear'];
            guardarRecordatoriosRecurrentes();
            speak("He detenido el recordatorio de pasear.");
        } else {
            speak("No hay ningún recordatorio de pasear activo.");
        }
    }
    
    // --- NUEVO COMANDO DE GEOLOCALIZACIÓN ---
    else if (message.includes('dónde estoy') || message.includes('mi ubicación')) {
        speak("Buscando tu ubicación. Por favor, acepta los permisos del navegador.");
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
                window.open(mapsUrl, '_blank');
                speak("He abierto un mapa con tu ubicación actual.");
            }, error => {
                speak("Lo siento, no pude obtener tu ubicación.");
                console.error("Error al obtener la ubicación: ", error);
            });
        } else {
            speak("Lo siento, tu navegador no soporta la geolocalización.");
        }
    }
    
    // Comando de calculadora
    else if (message.includes('calculadora')) {
        window.open('Calculator:///');
        const finalText = "Abriendo calculadora";
        speak(finalText);
    }
    
    // Búsqueda por defecto
    else {
        window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank");
        const finalText = "Encontré algo de información sobre " + message + " en Google";
        speak(finalText);
    }
}
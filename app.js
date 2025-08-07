const btn = document.querySelector('.talk');
const content = document.querySelector('.content');

// --- VARIABLES GLOBALES Y FUNCIONES BÁSICAS ---
let chistesUsados = [];
let recordatorios = [];
let esperandoHora = false;
let recordatoriosRecurrentes = {};
const delay = 1000;

function speak(text) {
    const text_speak = new SpeechSynthesisUtterance(text);
    text_speak.rate = 1;
    text_speak.volume = 1;
    text_speak.pitch = 1;
    window.speechSynthesis.speak(text_speak);
}

function wishMe() {
    const day = new Date();
    const hour = day.getHours();
    if (hour >= 0 && hour < 12) {
        speak("Buenos días, jefe...");
    } else if (hour >= 12 && hour < 17) {
        speak("Buenas tardes, señor...");
    } else {
        speak("Buenas noches, señor...");
    }
}

window.addEventListener('load', () => {
    speak("Inicializando JARVIS...");
    wishMe();
    
    if (localStorage.getItem('misRecordatorios')) {
        recordatorios = JSON.parse(localStorage.getItem('misRecordatorios'));
    }
    setInterval(verificarAlarmas, 60000);

    if (localStorage.getItem('recordatoriosRecurrentes')) {
        recordatoriosRecurrentes = JSON.parse(localStorage.getItem('recordatoriosRecurrentes'));
        for (const tarea in recordatoriosRecurrentes) {
            iniciarRecordatorioRecurrente(tarea, recordatoriosRecurrentes[tarea].intervalo);
        }
    }
});

function guardarRecordatorios() {
    localStorage.setItem('misRecordatorios', JSON.stringify(recordatorios));
}

function guardarRecordatoriosRecurrentes() {
    localStorage.setItem('recordatoriosRecurrentes', JSON.stringify(recordatoriosRecurrentes));
}

function verificarAlarmas() {
    const ahora = new Date();
    const horaActual = ahora.getHours() + ':' + (ahora.getMinutes() < 10 ? '0' : '') + ahora.getMinutes();

    for (let i = 0; i < recordatorios.length; i++) {
        if (recordatorios[i].hora === horaActual) {
            speak(`¡Alarma! Es la hora de ${recordatorios[i].tarea}.`);
            recordatorios.splice(i, 1);
            guardarRecordatorios();
        }
    }
}

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

// --- FUNCIÓN PARA HABLAR CON LA IA DE MISTRAL ---
async function askAI(query) {
    speak("Permítame un momento para procesar su petición...");

    // -----------------------------------------------------------------
    //  REEMPLAZA ESTOS VALORES CON LOS QUE OBTUVISTE DE MISTRAL AI
    // -----------------------------------------------------------------
    const API_KEY = 'YOUR API KEY'; 
    const API_ENDPOINT = 'YOUR ENDPOINT'; 
    
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "mistral-tiny", // Puedes cambiar a mistral-small, mistral-medium, etc.
                messages: [{ role: "user", content: query }],
            })
        });

        if (!response.ok) {
            // Muestra un error más detallado en la consola si la conexión falla
            const errorData = await response.json();
            console.error('Error de la API de Mistral:', errorData);
            throw new Error(`Error de la API: ${response.status}`);
        }

        const data = await response.json();
        // El formato de respuesta de Mistral es muy similar a OpenAI
        const aiResponse = data.choices[0].message.content.trim(); 
        
        speak(aiResponse);

    } catch (error) {
        console.error('Error al conectar con la IA:', error);
        speak("Lo siento, no pude conectar con la inteligencia artificial.");
    }
}

// --- PROCESADOR DE COMANDOS HÍBRIDO ---
function takeCommand(message) {
    console.log("Comando detectado: ", message);

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
    // Saludos
    else if (/\b(hey|hola)\b/.test(message)) {
        speak("Hola, ¿en qué puedo ayudarle?");
    } else if (/\b(cómo estás|como estas)\b/.test(message)) {
        speak("Estoy listo para la acción. ¿Qué tal se siente usted hoy?");
    }
    
    // Comandos internos específicos (la parte "vieja" mejorada)
    else if (/\b(qué hora es|que hora es)\b/.test(message) || /\b(hora)\b/.test(message)) {
        speak("Permítame un momento...");
        setTimeout(() => {
            const time = new Date().toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
            const finalText = "La hora actual es " + time;
            speak(finalText);
        }, delay);
    } else if (/\b(qué día es hoy|que dia es hoy)\b/.test(message) || /\b(día|dia)\b/.test(message)) {
        speak("Consultando el calendario...");
        setTimeout(() => {
            const date = new Date().toLocaleString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
            const finalText = "Hoy es " + date;
            speak(finalText);
        }, delay);
    } else if (/\b(chiste|cuéntame un chiste|dime un chiste)\b/.test(message)) {
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
        speak("Aquí va uno...");
        setTimeout(() => {
            speak(chisteAleatorio);
        }, delay);
    } else if (/\b(calculadora|abre calculadora)\b/.test(message)) {
        speak("Abriendo calculadora...");
        setTimeout(() => {
            window.open('Calculator:///');
        }, delay);
    } else if (/\b(dónde estoy|mi ubicación)\b/.test(message)) {
        speak("Buscando tu ubicación. Por favor, acepta los permisos del navegador.");
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const mapsUrl = `http://googleusercontent.com/maps.google.com/6{lat},${lon}`;
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
    
    // Comandos de navegación a páginas web
    else if (/\b(abre google)\b/.test(message)) {
        speak("Abriendo Google...");
        setTimeout(() => {
            window.open("https://google.com", "_blank");
        }, delay);
    } else if (/\b(abre youtube)\b/.test(message)) {
        speak("Abriendo YouTube...");
        setTimeout(() => {
            window.open("https://youtube.com", "_blank");
        }, delay);
    } else if (/\b(abre facebook)\b/.test(message)) {
        speak("Abriendo Facebook...");
        setTimeout(() => {
            window.open("https://facebook.com", "_blank");
        }, delay);
    }
    
    // Comandos de recordatorios
    else if (/\b(pon una alarma para pastillas|pon un recordatorio para pastillas)\b/.test(message)) {
        speak("¿A qué hora quieres que te lo recuerde? Por ejemplo, di: 'a las 10 y 30' o 'a las 14 y 00'.");
        esperandoHora = true;
    } else if (/\b(recuérdame beber agua cada)\b/.test(message)) {
        const regexMinutos = /(\d+)\s+minutos/;
        const match = message.match(regexMinutos);
        if (match) {
            const minutos = parseInt(match[1]);
            iniciarRecordatorioRecurrente('beber agua', minutos);
            speak(`Claro, le recordaré beber agua cada ${minutos} minutos.`);
        } else {
            speak("Lo siento, no entendí el tiempo. Por favor, diga, por ejemplo: 'recuérdame beber agua cada 30 minutos'.");
        }
    } else if (/\b(recuérdame pasear cada)\b/.test(message)) {
        const regexMinutos = /(\d+)\s+minutos/;
        const match = message.match(regexMinutos);
        if (match) {
            const minutos = parseInt(match[1]);
            iniciarRecordatorioRecurrente('pasear', minutos);
            speak(`Claro, le recordaré pasear cada ${minutos} minutos.`);
        } else {
            speak("Lo siento, no entendí el tiempo. Por favor, diga, por ejemplo: 'recuérdame pasear cada 60 minutos'.");
        }
    } else if (/\b(detén el recordatorio de beber agua|deten el recordatorio de beber agua)\b/.test(message)) {
        if (recordatoriosRecurrentes['beber agua']) {
            clearInterval(recordatoriosRecurrentes['beber agua'].id);
            delete recordatoriosRecurrentes['beber agua'];
            guardarRecordatoriosRecurrentes();
            speak("He detenido el recordatorio de beber agua.");
        } else {
            speak("No hay ningún recordatorio de beber agua activo.");
        }
    } else if (/\b(detén el recordatorio de pasear|deten el recordatorio de pasear)\b/.test(message)) {
        if (recordatoriosRecurrentes['pasear']) {
            clearInterval(recordatoriosRecurrentes['pasear'].id);
            delete recordatoriosRecurrentes['pasear'];
            guardarRecordatoriosRecurrentes();
            speak("He detenido el recordatorio de pasear.");
        } else {
            speak("No hay ningún recordatorio de pasear activo.");
        }
    }
    
    // --- LÓGICA DE IA (La parte "nueva") ---
    else {
        askAI(message);
    }
}

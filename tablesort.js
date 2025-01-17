$(function() {
    // Gestionnaire d'événements pour la sélection de la date de début
    $('#new-date-debut').on('change', function() {
        let startDate = $(this).datepicker('getDate');
        if (startDate) {
            let selectedThemeName = $('#new-theme').val();
            let selectedTheme = Object.values(themesData).find(theme => theme.name === selectedThemeName);
            let endDate = new Date(startDate.getTime());
            if (selectedTheme) {
                if (selectedTheme.duration === 2) {
                    endDate.setDate(endDate.getDate() + 1);
                }
                let formattedEndDate = `${endDate.getDate()}/${endDate.getMonth() + 1}/${endDate.getFullYear()}`;
                $('#new-date-fin').val(formattedEndDate);
            }
        }
    });

    // Gestionnaire d'événements pour la sélection du thème
    $('#new-theme').on('change', function() {
        let selectedThemeName = $(this).val();
        let selectedTheme = Object.values(themesData).find(theme => theme.name === selectedThemeName);
        if (selectedTheme) {
            $('#new-finan').val(selectedTheme.type);
            $('#new-date-debut').val('');
            $('#new-date-fin').val('');
        }
    });

    $('#add-event-btn').on('click', function() {
        // Récupérer l'ID de l'événement sélectionné
        let eventId = $(this).data('event-id');
        // Définir l'ID de l'événement dans un champ caché pour le récupérer plus tard
        $('#selected-event-id').val(eventId);
        // Ouvrir la modal d'ajout d'événement
        $('#addEventModal').modal('show');
        // Peupler la liste des thèmes et des formateurs
        populateThemesList();
        populateFormateursList();
    });
    
    

    // Initialiser les datepickers
    $(".datepicker").datepicker({
        dateFormat: "dd/mm/yy"
    });
});

function populateThemesList() {
    let themesList = $('#themes-list');
    themesList.empty();
    for (let theme of Object.values(themesData)) {
        themesList.append(`<option value="${theme.name}">`);
    }
}

function populateFormateursList() {
    let formateursList = $('#formateurs-list');
    formateursList.empty();
    for (let formateur of Object.values(formateursData)) {
        formateursList.append(`<option value="${formateur.nom} ${formateur.prenom}">`);
    }
}

function attachRowClickEvents() {
    $('.add-formateur-btn').off('click').on('click', function() {
        let eventId = $(this).data('event-id');
        if (eventId !== undefined) {
            let event = eventsArray.find(event => event.id == eventId);
            if (event) {
                $('#selected-event-id').val(eventId);
                populateAvailableFormateurs(event);
                $('#addFormateurModal').modal('show');
            } else {
                console.error("Événement non trouvé pour l'ID :", eventId);
            }
        } else {
            console.error("ID de l'événement indéfini :", eventId);
        }
    });

    $('.remove-formateur-btn').off('click').on('click', function() {
        let eventId = $(this).data('event-id');
        if (eventId !== undefined) {
            let eventIndex = eventsArray.findIndex(event => event.id == eventId);
            if (eventIndex !== -1) {
                eventsArray[eventIndex].formateur_id = null;
                buildTable(eventsArray);
            } else {
                console.error("Événement non trouvé pour l'ID :", eventId);
            }
        } else {
            console.error("ID de l'événement indéfini :", eventId);
        }
    });
}

function populateAvailableFormateurs(event) {
    let formateursList = $('#formateurs-list-modal');
    formateursList.empty();
    let eventId = event.id; // Assurez-vous que l'ID de l'événement est correctement récupéré
    let themeId = event.theme_id;
    for (let formateur of Object.values(formateursData)) {
        if (isFormateurAvailable(formateur, event.date_debut, event.date_fin) && isFormateurAssignedToTheme(formateur, themeId)) {
            formateursList.append(`<li class="formateur-item" data-formateur-id="${formateur.id}">${formateur.nom} ${formateur.prenom}</li>`);
        }
    }
    // Ajouter un gestionnaire d'événements pour les clics sur les formateurs de la liste
    $('.formateur-item').off('click').on('click', function() {
        let formateurId = $(this).data('formateur-id');
        if (eventId) { // Vérifiez si l'ID de l'événement est défini
            let eventIndex = eventsArray.findIndex(event => event.id == eventId);
            if (eventIndex !== -1) {
                eventsArray[eventIndex].formateur_id = formateurId;
                buildTable(eventsArray);
                $('#addFormateurModal').modal('hide');
            } else {
                console.error("Événement non trouvé pour l'ID :", eventId);
            }
        } else {
            console.error("ID de l'événement indéfini");
        }
    });
}







function isFormateurAssignedToTheme(formateur, themeId) {
    return formateur.themes.includes(themeId);
}

function isFormateurAvailable(formateur, startDate, endDate) {
    for (let existingEvent of eventsArray) {
        if (existingEvent.formateur_id === formateur.id) {
            let eventStartDate = new Date(existingEvent.date_debut.split('/').reverse().join('-'));
            let eventEndDate = new Date(existingEvent.date_fin.split('/').reverse().join('-'));
            if ((new Date(startDate.split('/').reverse().join('-')) <= eventEndDate && new Date(startDate.split('/').reverse().join('-')) >= eventStartDate) ||
                (new Date(endDate.split('/').reverse().join('-')) <= eventEndDate && new Date(endDate.split('/').reverse().join('-')) >= eventStartDate)) {
                return false;
            }
        }
    }
    return true;
}

let eventsArray = [];
let themesData = {};
let formateursData = {};

function buildTable(data) {
    let table = document.getElementById('myTable');
    table.innerHTML = '';
    for (let i = 0; i < data.length; i++) {
        let event = data[i];
        let theme = themesData[event.theme_id];
        let formateur = formateursData[event.formateur_id];
        let formateurCell = formateur ? `${formateur.nom} ${formateur.prenom} <button class="btn btn-link remove-formateur-btn" data-event-id="${event.id}">❌</button>` : `<button class="btn btn-link add-formateur-btn" data-event-id="${event.id}">Ajouter formateur</button>`;
        let row = `<tr class="event-row" data-event-id="${event.id}">
            <td style="background-color: ${theme.bck_color || '#fff'};">${theme.name}</td>
            <td>${event.date_debut}</td>
            <td>${event.date_fin}</td>
            <td>${event.ville}</td>
            <td>${theme.type}</td>
            <td>${formateurCell}</td>
            <td>${event.num_s}</td>
        </tr>`;
        table.innerHTML += row;
    }
    attachRowClickEvents(); // Attacher les événements après avoir reconstruit le tableau
}

function fetchJsonData() {
    fetch("./db.json")
        .then((res) => {
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
        })
        .then((data) => {
            eventsArray = data.events;
            themesData = Object.fromEntries(data.themes.map(theme => [theme.id, theme]));
            formateursData = Object.fromEntries(data.formateurs.map(formateur => [formateur.id, formateur]));
            buildTable(eventsArray);
        })
        .catch((error) => {
            console.error("Unable to fetch data:", error);
        });
}
function filterByDate(startDate, endDate, data) {
    return data.filter(event => {
        let eventStartDate = new Date(event.date_debut.split('/').reverse().join('-'));
        let eventEndDate = new Date(event.date_fin.split('/').reverse().join('-'));
        return eventStartDate >= startDate && eventEndDate <= endDate;
    });
}


fetchJsonData();

$('#filter-dates-btn').on('click', function() {
    let startDate = $('#date-debut-input').datepicker('getDate');
    let endDate = $('#date-fin-input').datepicker('getDate');
    if (startDate && endDate) {
        let filteredData = filterByDate(startDate, endDate, eventsArray);
        buildTable(filteredData);
    } else {
        alert('Veuillez sélectionner des dates valides.');
    }
});

$('#themes-input').on('input', function() {
    let value = $(this).val();
    let data = searchTheme(value, eventsArray);
    buildTable(data);
});

function searchTheme(value, data) {
    let filteredTheme = [];
    value = value.toLowerCase();
    for (let i = 0; i < data.length; i++) {
        let theme = themesData[data[i].theme_id].name.toLowerCase();
        if (theme.includes(value)) {
            filteredTheme.push(data[i]);
        }
    }
    return filteredTheme;
}

$('#finan-input').on('input', function() {
    let value = $(this).val();
    let data = searchFinan(value, eventsArray);
    buildTable(data);
});

function searchFinan(value, data) {
    let filteredFinan = [];
    value = value.toLowerCase();
    for (let i = 0; i < data.length; i++) {
        let themeType = themesData[data[i].theme_id].type.toLowerCase();
        if (themeType.includes(value)) {
            filteredFinan.push(data[i]);
        }
    }
    return filteredFinan;
}

$('#formateur-input').on('input', function() {
    let value = $(this).val();
    let data = searchForma(value, eventsArray);
    buildTable(data);
});

function searchForma(value, data) {
    let filteredForma = [];
    value = value.toLowerCase();
    for (let i = 0; i < data.length; i++) {
        let formateur = formateursData[data[i].formateur_id];
        let formateurName = formateur ? `${formateur.nom} ${formateur.prenom}`.toLowerCase() : "";
        if (formateurName.includes(value)) {
            filteredForma.push(data[i]);
        }
    }
    return filteredForma;
}

$('#ville-input').on('input', function() {
    let value = $(this).val();
    let data = searchVille(value, eventsArray);
    buildTable(data);
});

function searchVille(value, data) {
    let filteredVille = [];
    value = value.toLowerCase();
    for (let i = 0; i < data.length; i++) {
        let ville = data[i].ville.toLowerCase();
        if (ville.includes(value)) {
            filteredVille.push(data[i]);
        }
    }
    return filteredVille;
}

$('#num-session-input').on('input', function() {
    let value = $(this).val();
    let data = searchNumSession(value, eventsArray);
    buildTable(data);
});

function searchNumSession(value, data) {
    let filteredNumSession = [];
    value = value.toLowerCase();
    for (let i = 0; i < data.length; i++) {
        let numSession = (data[i].num_s || '').toString().toLowerCase();
        if (numSession.includes(value)) {
            filteredNumSession.push(data[i]);
        }
    }
    return filteredNumSession;
}

$('th').on('click', function() {
    let column = $(this).data('colname');
    let order = $(this).data('order');
    let text = $(this).html();
    text = text.substring(0, text.length - 1);
    if (order === 'desc') {
        eventsArray = eventsArray.sort((a, b) => a[column] > b[column] ? 1 : -1);
        $(this).data("order", "asc");
        text += '&#9660';
    } else {
        eventsArray = eventsArray.sort((a, b) => a[column] < b[column] ? 1 : -1);
        $(this).data("order", "desc");
        text += '&#9650';
    }
    $(this).html(text);
    buildTable(eventsArray);
});

function isDuplicateEvent(newEvent, eventsArray) {
    for (let event of eventsArray) {
        if (event.formateur_id === newEvent.formateur_id) {
            let eventStartDate = new Date(event.date_debut.split('/').reverse().join('-'));
            let eventEndDate = new Date(event.date_fin.split('/').reverse().join('-'));
            let newStartDate = new Date(newEvent.date_debut.split('/').reverse().join('-'));
            let newEndDate = new Date(newEvent.date_fin.split('/').reverse().join('-'));
            if ((newStartDate <= eventEndDate && newStartDate >= eventStartDate) || 
                (newEndDate <= eventEndDate && newEndDate >= eventStartDate)) {
                return true;
            }
        }
        if (event.num_s === newEvent.num_s) {
            return true;
        }
    }
    return false;
}

const getLastSessionNumber = (events) => {
    let lastSessionNumber = 0;
    for (let event of events) {
        if (event.num_s > lastSessionNumber) {
            lastSessionNumber = event.num_s;
        }
    }
    return lastSessionNumber;
};

let lastEventId = 0;
const generateNextEventId = () => ++lastEventId;

document.getElementById('add-theme-form').addEventListener('submit', function(event) {
    event.preventDefault();
    let newThemeName = document.getElementById('new-theme').value;
    let newDateDebut = document.getElementById('new-date-debut').value;
    let newDateFin = document.getElementById('new-date-fin').value;
    let newVille = document.getElementById('new-ville').value;
    let newFinan = document.getElementById('new-finan').value;
    let newForma = document.getElementById('new-forma').value;

    let theme = Object.values(themesData).find(theme => theme.name === newThemeName);
    let formateur = Object.values(formateursData).find(formateur => `${formateur.nom} ${formateur.prenom}` === newForma);

    if (!theme || !newDateDebut || !newDateFin || !newVille || !newFinan) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    let lastSessionNumber = getLastSessionNumber(eventsArray);
    const generateNextSessionNumber = () => lastSessionNumber + 1;
    let newNumSession = generateNextSessionNumber();
    let newEventId = generateNextEventId();

    let newEntry = {
        id: newEventId, // Assigner un nouvel ID unique ici
        theme_id: theme.id,
        date_debut: newDateDebut,
        date_fin: newDateFin,
        ville: newVille,
        finan: newFinan,
        formateur_id: formateur ? formateur.id : null, // Vérifie et ajoute l'ID du formateur
        num_s: newNumSession
    };

    if (isDuplicateEvent(newEntry, eventsArray)) {
        alert("Un événement avec le même numéro de session ou un formateur déjà réservé existe.");
        return;
    }

    eventsArray.push(newEntry);
    buildTable(eventsArray);
    document.getElementById('add-theme-form').reset();
    $('#addEventModal').modal('hide');
    alert("Événement ajouté avec succès.");
});

document.getElementById('add-formateur-form').addEventListener('submit', function(event) {
    event.preventDefault();
    let selectedEventId = document.getElementById('selected-event-id').value;
    let selectedFormateurName = document.getElementById('select-formateur').value;
    let formateur = Object.values(formateursData).find(formateur => `${formateur.nom} ${formateur.prenom}` === selectedFormateurName);

    if (!formateur) {
        alert("Veuillez sélectionner un formateur valide.");
        return;
    }

    let eventIndex = eventsArray.findIndex(event => event.id == selectedEventId);
    if (eventIndex !== -1) {
        let selectedEvent = eventsArray[eventIndex];
        if (isFormateurAvailable(formateur, selectedEvent.date_debut, selectedEvent.date_fin) && isFormateurAssignedToTheme(formateur, selectedEvent.theme_id)) {
            eventsArray[eventIndex].formateur_id = formateur.id;
            buildTable(eventsArray);
            $('#addFormateurModal').modal('hide');
        } else {
            alert("Le formateur n'est pas disponible pour les dates sélectionnées ou n'est pas assigné au thème.");
        }
    } else {
        alert("Événement non trouvé.");
    }
});

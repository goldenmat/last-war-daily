let currentServer = 'server1';

const STORAGE_KEY = 'lastWar_servers';

function createEmptyServer() {
    return {
        taskStates: {},

        campaignLevels: {
            tank: 1,
            aircraft: 1,
            missile: 1
        },

        campaignStates: {
            tank: {},
            aircraft: {},
            missile: {}
        },

        campaignExtra: {
            tank: 0,
            aircraft: 0,
            missile: 0
        },

        arenaType: 'storm',
        lastModified: null
    };
}

let serverData = {
    server1: createEmptyServer(),
    server2: createEmptyServer()
};


// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    loadCurrentServer();
    handleGoldenTask();
});


// ============================================================
// SERVER DATA
// ============================================================

function getServerData() {
    return serverData[currentServer];
}


// ============================================================
// LOCAL STORAGE
// ============================================================

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
        try {
            serverData = JSON.parse(saved);
        } catch (error) {
            console.error('Errore nel caricamento dei dati:', error);

            serverData = {
                server1: createEmptyServer(),
                server2: createEmptyServer()
            };
        }
    }

    // Sicurezza nel caso manchino dati
    if (!serverData.server1) {
        serverData.server1 = createEmptyServer();
    }

    if (!serverData.server2) {
        serverData.server2 = createEmptyServer();
    }

    // Compatibilità nel caso in cui venga aggiunta una nuova proprietà
    serverData.server1 = normalizeServerData(serverData.server1);
    serverData.server2 = normalizeServerData(serverData.server2);
}


function normalizeServerData(data) {
    const defaults = createEmptyServer();

    return {
        taskStates: data.taskStates || defaults.taskStates,

        campaignLevels: {
            ...defaults.campaignLevels,
            ...(data.campaignLevels || {})
        },

        campaignStates: {
            ...defaults.campaignStates,
            ...(data.campaignStates || {})
        },

        campaignExtra: {
            ...defaults.campaignExtra,
            ...(data.campaignExtra || {})
        },

        arenaType: data.arenaType || defaults.arenaType,
        lastModified: data.lastModified || null
    };
}


function saveData() {
    const data = getServerData();

    data.lastModified = new Date().toISOString();

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(serverData)
    );

    updateLastModified();
}


// ============================================================
// SERVER SWITCH
// ============================================================

function switchServer(server) {
    currentServer = server;

    document.querySelectorAll('.server-tab').forEach(tab => {
        tab.classList.toggle(
            'active',
            tab.dataset.server === server
        );
    });

    loadCurrentServer();
}


function loadCurrentServer() {
    const data = getServerData();

    // Aggiorna titolo server, se presente
    const serverName = document.getElementById('serverName');

    if (serverName) {
        serverName.textContent =
            currentServer === 'server1'
                ? 'Server 1'
                : 'Server 2';
    }

    // Arena
    document.getElementById('arenaType').value = data.arenaType;

    // Checkbox statici
    document.querySelectorAll('.task').forEach(input => {
        const id = input.getAttribute('data-id');

        input.checked = !!data.taskStates[id];
    });

    renderCampaign();
    renderArena();
    updateLastModified();
}


// ============================================================
// LAST MODIFIED
// ============================================================

function updateLastModified() {
    const data = getServerData();
    const element = document.getElementById('lastModified');

    if (!element) return;

    if (!data.lastModified) {
        element.textContent = '--';
        return;
    }

    element.textContent =
        new Date(data.lastModified).toLocaleString('it-IT');
}


// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {

    // --------------------------------------------------------
    // SERVER TABS
    // --------------------------------------------------------

    document.querySelectorAll('.server-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchServer(tab.dataset.server);
        });
    });


    // --------------------------------------------------------
    // CHECKBOX STATICI
    // --------------------------------------------------------

    document.querySelectorAll('.task').forEach(input => {

        input.addEventListener('change', (e) => {

            const data = getServerData();
            const id = e.target.getAttribute('data-id');

            if (e.target.checked) {
                data.taskStates[id] = true;
            } else {
                delete data.taskStates[id];
            }

            saveData();
        });
    });


    // --------------------------------------------------------
    // RESET
    // --------------------------------------------------------

    document.getElementById('resetBtn').addEventListener('click', () => {

        if (!confirm('Resettare tutti i checkbox del server corrente?')) {
            return;
        }

        const data = getServerData();

        data.taskStates = {};

        data.campaignStates = {
            tank: {},
            aircraft: {},
            missile: {}
        };

        // Reset dei checkbox visibili
        document.querySelectorAll('.task').forEach(input => {
            input.checked = false;
        });

        saveData();
        renderCampaign();
        renderArena();
    });


    // --------------------------------------------------------
    // ARENA TYPE
    // --------------------------------------------------------

    document.getElementById('arenaType').addEventListener('change', (e) => {

        const data = getServerData();

        data.arenaType = e.target.value;

        saveData();
        renderArena();
    });


    // --------------------------------------------------------
    // CAMPAIGN LEVEL +
    // --------------------------------------------------------

    document.querySelectorAll('.btn-level:not(.minus)').forEach(btn => {

        btn.addEventListener('click', (e) => {

            const data = getServerData();
            const team = e.target.getAttribute('data-team');

            data.campaignLevels[team]++;

            if (!data.campaignStates[team]) {
                data.campaignStates[team] = {};
            }

            saveData();
            renderCampaign();
        });
    });


    // --------------------------------------------------------
    // CAMPAIGN LEVEL -
    // --------------------------------------------------------

    document.querySelectorAll('.btn-level.minus').forEach(btn => {

        btn.addEventListener('click', (e) => {

            const data = getServerData();
            const team = e.target.getAttribute('data-team');

            if (data.campaignLevels[team] > 1) {
                data.campaignLevels[team]--;

                saveData();
                renderCampaign();
            }
        });
    });


    // --------------------------------------------------------
    // ADD ROW
    // --------------------------------------------------------

    document.querySelectorAll('.btn-row.add').forEach(btn => {

        btn.addEventListener('click', (e) => {

            const data = getServerData();
            const team = e.target.getAttribute('data-team');

            data.campaignExtra[team] = 1;

            saveData();
            renderCampaign();
        });
    });


    // --------------------------------------------------------
    // REMOVE ROW
    // --------------------------------------------------------

    document.querySelectorAll('.btn-row.remove').forEach(btn => {

        btn.addEventListener('click', (e) => {

            const data = getServerData();
            const team = e.target.getAttribute('data-team');

            data.campaignExtra[team] = 0;

            saveData();
            renderCampaign();
        });
    });
}


// ============================================================
// CAMPAIGN
// ============================================================

function renderCampaign() {

    const data = getServerData();

    ['tank', 'aircraft', 'missile'].forEach(team => {

        const container =
            document.getElementById(`${team}-missions`);

        const levelSpan =
            document.getElementById(`${team}-level`);

        const removeBtn =
            document.querySelector(
                `.btn-row.remove[data-team="${team}"]`
            );

        const addBtn =
            document.querySelector(
                `.btn-row.add[data-team="${team}"]`
            );


        levelSpan.textContent =
            `Level ${data.campaignLevels[team]}`;

        container.innerHTML = '';


        // 1 riga = 20 checkbox
        // 2 righe = 40 checkbox

        const numRows =
            data.campaignExtra[team] === 0
                ? 1
                : 2;


        for (let row = 0; row < numRows; row++) {

            const rowDiv =
                document.createElement('div');

            rowDiv.className =
                'missions-container';


            for (let i = 1; i <= 20; i++) {

                const missionNum =
                    row * 20 + i;

                const input =
                    document.createElement('input');

                input.type = 'checkbox';
                input.className = 'task';

                input.setAttribute(
                    'data-id',
                    `campaign-${team}-${data.campaignLevels[team]}-${missionNum}`
                );


                // Chiave usata per salvare lo stato
                const key =
                    `${data.campaignLevels[team]}-${missionNum}`;


                if (
                    data.campaignStates[team] &&
                    data.campaignStates[team][key]
                ) {
                    input.checked = true;
                }


                // Evento checkbox
                input.addEventListener('change', () => {

                    if (!data.campaignStates[team]) {
                        data.campaignStates[team] = {};
                    }

                    if (input.checked) {
                        data.campaignStates[team][key] = true;
                    } else {
                        delete data.campaignStates[team][key];
                    }

                    saveData();
                });


                rowDiv.appendChild(input);
            }


            container.appendChild(rowDiv);
        }


        // Add Row
        addBtn.style.display =
            data.campaignExtra[team] === 0
                ? 'inline-block'
                : 'none';


        // Remove Row
        removeBtn.style.display =
            data.campaignExtra[team] === 1
                ? 'inline-block'
                : 'none';
    });
}


// ============================================================
// ARENA
// ============================================================

function renderArena() {

    const data = getServerData();

    const container =
        document.getElementById('arenaFights');

    container.innerHTML = '';


    const numFights =
        data.arenaType === 'storm'
            ? 10
            : 30;


    for (let i = 1; i <= numFights; i++) {

        const input =
            document.createElement('input');

        input.type = 'checkbox';
        input.className = 'task';

        input.setAttribute(
            'data-id',
            `arena-fight-${i}`
        );


        // Recupera stato
        if (data.taskStates[`arena-fight-${i}`]) {
            input.checked = true;
        }


        // Evento
        input.addEventListener('change', () => {

            const id =
                input.getAttribute('data-id');

            if (input.checked) {
                data.taskStates[id] = true;
            } else {
                delete data.taskStates[id];
            }

            saveData();
        });


        container.appendChild(input);
    }
}


// ============================================================
// GOLDEN TASK
// ============================================================

function handleGoldenTask() {

    const today =
        new Date().getDay();

    const goldenCheckbox =
        document.querySelector(
            '[data-id="task-golden"]'
        );

    if (!goldenCheckbox) {
        return;
    }


    // Martedì, Mercoledì, Sabato
    if (
        today === 2 ||
        today === 3 ||
        today === 6
    ) {

        goldenCheckbox.parentElement.style.display =
            'inline';

    } else {

        goldenCheckbox.parentElement.style.display =
            'none';

        goldenCheckbox.checked = false;
    }
}
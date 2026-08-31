// ======================================================
// CONFIGURAZIONE SUPABASE
// ======================================================

const SUPABASE_URL =
    "https://gsokxkjrodcuwqxsybje.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_qrnRxLCNWSRVxwsDui7_7Q_iiiJ53aa";

const client =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ======================================================
// ELEMENTI LOGIN
// ======================================================

const loginView =
    document.getElementById("loginView");

const appView =
    document.getElementById("appView");

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");

const userEmail =
    document.getElementById("userEmail");

const logoutBtn =
    document.getElementById("logoutBtn");


// ======================================================
// ELEMENTI DATI
// ======================================================

const dataForm =
    document.getElementById("dataForm");

const dataMessage =
    document.getElementById("dataMessage");

const dataList =
    document.getElementById("dataList");

const refreshBtn =
    document.getElementById("refreshBtn");


// ======================================================
// ELEMENTI MODIFICA
// ======================================================

const editModal =
    document.getElementById("editModal");

const editForm =
    document.getElementById("editForm");

const editNome =
    document.getElementById("editNome");

const editInformazioni =
    document.getElementById("editInformazioni");

const editMessage =
    document.getElementById("editMessage");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const cancelEditBtn =
    document.getElementById("cancelEditBtn");

let editingId = null;


// ======================================================
// ELEMENTI ADMIN
// ======================================================

const adminPanel =
    document.getElementById("adminPanel");

const createUserForm =
    document.getElementById("createUserForm");

const createUserMessage =
    document.getElementById("createUserMessage");

const usersList =
    document.getElementById("usersList");

const refreshUsersBtn =
    document.getElementById("refreshUsersBtn");


// ======================================================
// VARIABILI
// ======================================================

let currentUser = null;
let currentProfile = null;


// ======================================================
// MESSAGGI
// ======================================================

function showMessage(element, text) {

    if (!element) {
        return;
    }

    element.textContent = text;
}


// ======================================================
// CONTROLLO ADMIN
// ======================================================

async function loadCurrentProfile(userId) {

    const {
        data,
        error
    } = await client
        .from("profili")
        .select("id, email, ruolo, attivo")
        .eq("id", userId)
        .maybeSingle();

    if (error) {

        console.error(
            "Errore profilo:",
            error
        );

        return null;
    }

    return data;
}


function isAdmin() {

    return (
        currentProfile &&
        currentProfile.ruolo === "admin" &&
        currentProfile.attivo === true
    );
}


// ======================================================
// CARICA I DATI
// ======================================================

async function loadData() {

    dataList.innerHTML =
        "<p class='loading'>Caricamento...</p>";

    const {
        data,
        error
    } = await client
        .from("dati_personali")
        .select(
            "id, nome, informazioni, user_id"
        )
        .order(
            "id",
            {
                ascending: false
            }
        );

    if (error) {

        dataList.innerHTML = "";

        showMessage(
            dataMessage,
            "Errore nel caricamento: " +
            error.message
        );

        return;
    }


    if (!data || data.length === 0) {

        dataList.innerHTML =
            "<p class='loading'>Nessun dato presente.</p>";

        return;
    }


    dataList.innerHTML = "";


    for (const row of data) {

        const item =
            document.createElement("article");

        item.className =
            "data-item";


        const title =
            document.createElement("h3");

        title.textContent =
            row.nome;


        const information =
            document.createElement("p");

        information.textContent =
            row.informazioni || "";


        const actions =
            document.createElement("div");

        actions.className =
            "actions";


        // ==========================================
        // MODIFICA
        // ==========================================

        const editButton =
            document.createElement("button");

        editButton.type =
            "button";

        editButton.className =
            "edit";

        editButton.textContent =
            "✏️ Modifica";

        editButton.addEventListener(
            "click",
            () => openEditModal(row)
        );


        // ==========================================
        // ELIMINA
        // ==========================================

        const deleteButton =
            document.createElement("button");

        deleteButton.type =
            "button";

        deleteButton.className =
            "delete";

        deleteButton.textContent =
            "🗑️ Elimina";

        deleteButton.addEventListener(
            "click",
            () => deleteData(row.id)
        );


        actions.append(
            editButton,
            deleteButton
        );


        item.append(
            title,
            information,
            actions
        );


        dataList.appendChild(item);
    }
}


// ======================================================
// APRI MODIFICA
// ======================================================

function openEditModal(row) {

    editingId =
        row.id;

    editNome.value =
        row.nome || "";

    editInformazioni.value =
        row.informazioni || "";

    showMessage(
        editMessage,
        ""
    );

    editModal.classList.remove(
        "hidden"
    );

    editNome.focus();
}


// ======================================================
// CHIUDI MODIFICA
// ======================================================

function closeEditModal() {

    editingId =
        null;

    editForm.reset();

    showMessage(
        editMessage,
        ""
    );

    editModal.classList.add(
        "hidden"
    );
}


// ======================================================
// PULSANTI MODIFICA
// ======================================================

closeModalBtn.addEventListener(
    "click",
    closeEditModal
);

cancelEditBtn.addEventListener(
    "click",
    closeEditModal
);


editModal.addEventListener(
    "click",
    event => {

        if (
            event.target === editModal
        ) {

            closeEditModal();

        }

    }
);


// ======================================================
// SALVA MODIFICA
// ======================================================

editForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!editingId) {
            return;
        }


        const nome =
            editNome.value.trim();

        const informazioni =
            editInformazioni.value.trim();


        if (!nome) {

            showMessage(
                editMessage,
                "Il nome è obbligatorio."
            );

            return;
        }


        showMessage(
            editMessage,
            "Salvataggio..."
        );


        const {
            error
        } = await client
            .from("dati_personali")
            .update({
                nome: nome,
                informazioni: informazioni
            })
            .eq(
                "id",
                editingId
            );


        if (error) {

            showMessage(
                editMessage,
                "Errore: " +
                error.message
            );

            return;
        }


        closeEditModal();


        showMessage(
            dataMessage,
            "Modifica salvata! ✅"
        );


        await loadData();

    }
);


// ======================================================
// ELIMINA DATO
// ======================================================

async function deleteData(id) {

    const confirmation =
        confirm(
            "Vuoi eliminare definitivamente questo dato?"
        );


    if (!confirmation) {
        return;
    }


    const {
        error
    } = await client
        .from("dati_personali")
        .delete()
        .eq(
            "id",
            id
        );


    if (error) {

        alert(
            "Errore: " +
            error.message
        );

        return;
    }


    showMessage(
        dataMessage,
        "Dato eliminato! ✅"
    );


    await loadData();
}


// ======================================================
// LOGIN
// ======================================================

loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        showMessage(
            loginMessage,
            "Accesso in corso..."
        );


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
                .value;


        const {
            error
        } = await client.auth.signInWithPassword({

            email: email,

            password: password

        });


        if (error) {

            showMessage(
                loginMessage,
                "Accesso non riuscito: " +
                error.message
            );

            return;
        }


        loginForm.reset();


        showMessage(
            loginMessage,
            ""
        );


        await updateInterface();

    }
);


// ======================================================
// AGGIUNGI DATO
// ======================================================

dataForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        showMessage(
            dataMessage,
            "Salvataggio..."
        );


        const {
            data: {
                user
            }
        } =
            await client.auth.getUser();


        if (!user) {

            showMessage(
                dataMessage,
                "Sessione scaduta. Effettua nuovamente il login."
            );

            return;
        }


        const nome =
            document
                .getElementById("nome")
                .value
                .trim();


        const informazioni =
            document
                .getElementById("informazioni")
                .value
                .trim();


        if (!nome) {

            showMessage(
                dataMessage,
                "Il nome è obbligatorio."
            );

            return;
        }


        const {
            error
        } = await client
            .from("dati_personali")
            .insert({

                nome: nome,

                informazioni: informazioni,

                user_id: user.id

            });


        if (error) {

            showMessage(
                dataMessage,
                "Errore: " +
                error.message
            );

            return;
        }


        dataForm.reset();


        showMessage(
            dataMessage,
            "Dato salvato! ✅"
        );


        await loadData();

    }
);


// ======================================================
// LOGOUT
// ======================================================

logoutBtn.addEventListener(
    "click",
    async () => {

        await client.auth.signOut();

        currentUser = null;
        currentProfile = null;

        await updateInterface();

    }
);


// ======================================================
// AGGIORNA DATI
// ======================================================

refreshBtn.addEventListener(
    "click",
    loadData
);


// ======================================================
// API ADMIN
// ======================================================

async function adminRequest(
    method,
    body = null
) {

    const {
        data: {
            session
        }
    } =
        await client.auth.getSession();


    if (
        !session ||
        !session.access_token
    ) {

        throw new Error(
            "Sessione non valida."
        );
    }


    const options = {

        method: method,

        headers: {

            "Authorization":
                "Bearer " +
                session.access_token,

            "Content-Type":
                "application/json"

        }

    };


    if (body) {

        options.body =
            JSON.stringify(body);

    }


    const response =
        await fetch(
            "/api/admin/users",
            options
        );


    const result =
        await response.json();


    if (!response.ok) {

        throw new Error(
            result.error ||
            "Errore del server."
        );

    }


    return result;
}


// ======================================================
// CARICA UTENTI
// ======================================================

async function loadUsers() {

    if (!isAdmin()) {
        return;
    }


    usersList.innerHTML =
        "<p class='loading'>Caricamento utenti...</p>";


    try {

        const result =
            await adminRequest(
                "GET"
            );


        const users =
            result.users || [];


        if (users.length === 0) {

            usersList.innerHTML =
                "<p>Nessun utente.</p>";

            return;
        }


        usersList.innerHTML = "";


        users.forEach(user => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "admin-user";


            const email =
                document.createElement(
                    "strong"
                );

            email.textContent =
                user.email || "Senza email";


            const status =
                document.createElement(
                    "span"
                );

            status.textContent =
                user.email_confirmed_at
                    ? " 🟢 Attivo"
                    : " 🟡 Email non confermata";


            const userId =
                document.createElement(
                    "small"
                );

            userId.textContent =
                user.id;


            item.append(
                email,
                status,
                userId
            );


            usersList.appendChild(
                item
            );

        });


    } catch (error) {

        usersList.innerHTML = "";

        showMessage(
            createUserMessage,
            "Errore utenti: " +
            error.message
        );

    }
}


// ======================================================
// CREA UTENTE
// ======================================================

createUserForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!isAdmin()) {

            showMessage(
                createUserMessage,
                "Non hai i permessi."
            );

            return;
        }


        const email =
            document
                .getElementById(
                    "newUserEmail"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "newUserPassword"
                )
                .value;


        if (!email || !password) {

            showMessage(
                createUserMessage,
                "Inserisci email e password."
            );

            return;
        }


        showMessage(
            createUserMessage,
            "Creazione account..."
        );


        try {

            await adminRequest(
                "POST",
                {
                    action: "create",
                    email: email,
                    password: password
                }
            );


            createUserForm.reset();


            showMessage(
                createUserMessage,
                "Account creato! ✅"
            );


            await loadUsers();


        } catch (error) {

            showMessage(
                createUserMessage,
                "Errore: " +
                error.message
            );

        }

    }
);


// ======================================================
// AGGIORNA UTENTI
// ======================================================

refreshUsersBtn.addEventListener(
    "click",
    loadUsers
);


// ======================================================
// INTERFACCIA
// ======================================================

async function updateInterface() {

    const {
        data: {
            session
        }
    } =
        await client.auth.getSession();


    if (
        session &&
        session.user
    ) {

        currentUser =
            session.user;


        currentProfile =
            await loadCurrentProfile(
                currentUser.id
            );


        if (
            currentProfile &&
            currentProfile.attivo === false
        ) {

            await client.auth.signOut();

            alert(
                "Il tuo account è stato disattivato."
            );

            return;
        }


        loginView.classList.add(
            "hidden"
        );


        appView.classList.remove(
            "hidden"
        );


        userEmail.textContent =
            currentUser.email || "";


        if (isAdmin()) {

            adminPanel.classList.remove(
                "hidden"
            );

            await loadUsers();

        } else {

            adminPanel.classList.add(
                "hidden"
            );

        }


        await loadData();

    }

    else {

        currentUser = null;
        currentProfile = null;


        appView.classList.add(
            "hidden"
        );


        loginView.classList.remove(
            "hidden"
        );

    }
}


// ======================================================
// CAMBIO SESSIONE
// ======================================================

client.auth.onAuthStateChange(
    () => {

        updateInterface();

    }
);


// ======================================================
// AVVIO
// ======================================================

updateInterface();

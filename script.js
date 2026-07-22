let tournaments = [];

let selectedTournament = null;


// ============================
// LOAD TOURNAMENTS
// ============================

function loadTournaments() {

    const saved =
        localStorage.getItem("osm_tournaments");

    if (saved) {

        tournaments = JSON.parse(saved);

    }

    renderTournaments();

}


// ============================
// SAVE
// ============================

function saveTournaments() {

    localStorage.setItem(
        "osm_tournaments",
        JSON.stringify(tournaments)
    );

}


// ============================
// RENDER
// ============================

function renderTournaments(list = tournaments) {

    const grid =
        document.getElementById("tournamentsGrid");

    const empty =
        document.getElementById("emptyState");

    const count =
        document.getElementById("tournamentCount");


    grid.innerHTML = "";

    count.textContent = list.length;


    if (list.length === 0) {

        empty.style.display = "block";

        return;

    }


    empty.style.display = "none";


    list.forEach(tournament => {

        const card =
            document.createElement("div");

        card.className =
            "tournament-card";


        const reward =
            tournament.reward > 0

                ? `🏆 ${tournament.reward} Coins`

                : "🎁 بدون جائزة";


        card.innerHTML = `

            <div class="card-top">

                <div class="card-title">
                    ${escapeHTML(tournament.name)}
                </div>

                <div class="level-badge">

                    Level
                    ${tournament.minLevel}
                    -
                    ${tournament.maxLevel}

                </div>

            </div>


            <p class="card-description">

                ${escapeHTML(tournament.description)}

            </p>


            <div class="card-info">

                <span>
                    ${reward}
                </span>

                <span>
                    👥 مفتوحة
                </span>

            </div>


            <button
                class="join-button"
                onclick="openJoinModal('${tournament.id}')"
            >

                انضم للبطولة

            </button>

        `;


        grid.appendChild(card);

    });

}


// ============================
// CREATE TOURNAMENT
// ============================

function createTournament(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "tournamentName"
        ).value.trim();


    const description =
        document.getElementById(
            "tournamentDescription"
        ).value.trim();


    const reward =
        Number(
            document.getElementById(
                "rewardCoins"
            ).value
        );


    const minLevel =
        Number(
            document.getElementById(
                "minLevel"
            ).value
        );


    const maxLevel =
        Number(
            document.getElementById(
                "maxLevel"
            ).value
        );


    const groupUrl =
        document.getElementById(
            "groupUrl"
        ).value.trim();


    if (minLevel > maxLevel) {

        alert(
            "أقل Level يجب أن يكون أصغر من أو يساوي أعلى Level"
        );

        return;

    }


    const tournament = {

        id:
            Date.now().toString(),

        name,

        description,

        reward,

        minLevel,

        maxLevel,

        groupUrl,

        createdAt:
            new Date().toISOString()

    };


    tournaments.unshift(
        tournament
    );


    saveTournaments();

    renderTournaments();


    document
        .getElementById(
            "createTournamentForm"
        )
        .reset();


    closeCreateModal();


    showToast(
        "تم إنشاء البطولة بنجاح 🎉"
    );

}


// ============================
// JOIN MODAL
// ============================

function openJoinModal(id) {

    selectedTournament =
        tournaments.find(
            tournament =>
                tournament.id === id
        );


    if (!selectedTournament) {

        return;

    }


    document
        .getElementById(
            "joinTitle"
        )
        .textContent =
            selectedTournament.name;


    document
        .getElementById(
            "joinModal"
        )
        .classList
        .add("active");


    document
        .getElementById(
            "joinForm"
        )
        .style
        .display =
            "block";


    document
        .getElementById(
            "successMessage"
        )
        .style
        .display =
            "none";


    document
        .getElementById(
            "joinError"
        )
        .style
        .display =
            "none";

}


// ============================
// JOIN TOURNAMENT
// ============================

function joinTournament(event) {

    event.preventDefault();


    if (!selectedTournament) {

        return;

    }


    const playerName =
        document
            .getElementById(
                "playerName"
            )
            .value.trim();


    const playerLevel =
        Number(
            document
                .getElementById(
                    "playerLevel"
                )
                .value
        );


    const error =
        document
            .getElementById(
                "joinError"
            );


    if (

        playerLevel <
        selectedTournament.minLevel

        ||

        playerLevel >
        selectedTournament.maxLevel

    ) {

        error.textContent =

            `❌ مستواك غير مناسب.
            البطولة تقبل من Level
            ${selectedTournament.minLevel}
            إلى Level
            ${selectedTournament.maxLevel}.`;


        error.style.display =
            "block";


        return;

    }


    error.style.display =
        "none";


    document
        .getElementById(
            "joinForm"
        )
        .style
        .display =
            "none";


    document
        .getElementById(
            "successMessage"
        )
        .style
        .display =
            "block";


    document
        .getElementById(
            "groupLink"
        )
        .href =
            selectedTournament.groupUrl;


    console.log(
        "Player joined:",
        playerName,
        playerLevel
    );

}


// ============================
// SEARCH
// ============================

function searchTournaments() {

    const query =
        document
            .getElementById(
                "searchInput"
            )
            .value
            .toLowerCase();


    const filtered =
        tournaments.filter(
            tournament =>
                tournament.name
                    .toLowerCase()
                    .includes(query)
        );


    renderTournaments(
        filtered
    );

}


// ============================
// MODALS
// ============================

function openCreateModal() {

    document
        .getElementById(
            "createModal"
        )
        .classList
        .add("active");

}


function closeCreateModal() {

    document
        .getElementById(
            "createModal"
        )
        .classList
        .remove("active");

}


function closeJoinModal() {

    document
        .getElementById(
            "joinModal"
        )
        .classList
        .remove("active");

}


// ============================
// SCROLL
// ============================

function scrollToTournaments() {

    document
        .getElementById(
            "tournaments"
        )
        .scrollIntoView({

            behavior: "smooth"

        });

}


// ============================
// TOAST
// ============================

function showToast(message) {

    const toast =
        document
            .getElementById(
                "toast"
            );


    toast.textContent =
        message;


    toast.classList
        .add("show");


    setTimeout(() => {

        toast.classList
            .remove("show");

    }, 3000);

}


// ============================
// SECURITY
// ============================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;

}


// ============================
// CLOSE MODAL ON OUTSIDE CLICK
// ============================

window.addEventListener(
    "click",
    function(event) {

        if (
            event.target.classList
                .contains(
                    "modal-overlay"
                )
        ) {

            event.target.classList
                .remove(
                    "active"
                );

        }

    }
);


// ============================
// START
// ============================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadTournaments();

    }
);

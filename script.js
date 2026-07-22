// ============================
// SUPABASE
// ============================

const SUPABASE_URL =
    "https://mcvoliwjegewtulkeaey.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_1eQuNUBJ_4Z4sGBAqwTpQA_XfXUrhJE";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ============================
// VARIABLES
// ============================

let tournaments = [];

let selectedTournament = null;


// ============================
// LOAD TOURNAMENTS
// ============================

async function loadTournaments() {

    const { data, error } =
        await supabaseClient
            .from("tournaments")
            .select("*")
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(
            "Error loading tournaments:",
            error
        );

        showToast(
            "حدث خطأ أثناء تحميل البطولات ❌"
        );

        return;

    }


    tournaments =
        data.map(tournament => ({

            id:
                tournament.id,

            name:
                tournament.name,

            description:
                tournament.description || "",

            reward:
                tournament.reward_coins || 0,

            minLevel:
                tournament.min_level,

            maxLevel:
                tournament.max_level,

            groupUrl:
                tournament.group_url,

            createdAt:
                tournament.created_at

        }));


    renderTournaments();

}


// ============================
// RENDER
// ============================

function renderTournaments(
    list = tournaments
) {

    const grid =
        document.getElementById(
            "tournamentsGrid"
        );

    const empty =
        document.getElementById(
            "emptyState"
        );

    const count =
        document.getElementById(
            "tournamentCount"
        );


    grid.innerHTML = "";

    count.textContent =
        list.length;


    if (
        list.length === 0
    ) {

        empty.style.display =
            "block";

        return;

    }


    empty.style.display =
        "none";


    list.forEach(
        tournament => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "tournament-card";


            const reward =
                tournament.reward > 0

                    ? `🏆 ${tournament.reward} Coins`

                    : "🎁 بدون جائزة";


            card.innerHTML = `

                <div class="card-top">

                    <div class="card-title">

                        ${escapeHTML(
                            tournament.name
                        )}

                    </div>


                    <div class="level-badge">

                        Level
                        ${tournament.minLevel}
                        -
                        ${tournament.maxLevel}

                    </div>

                </div>


                <p class="card-description">

                    ${escapeHTML(
                        tournament.description
                    )}

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

                    onclick="openJoinModal(${tournament.id})"

                >

                    انضم للبطولة

                </button>

            `;


            grid.appendChild(
                card
            );

        }
    );

}


// ============================
// CREATE TOURNAMENT
// ============================

async function createTournament(
    event
) {

    event.preventDefault();


    const name =
        document
            .getElementById(
                "tournamentName"
            )
            .value
            .trim();


    const description =
        document
            .getElementById(
                "tournamentDescription"
            )
            .value
            .trim();


    const reward =
        Number(
            document
                .getElementById(
                    "rewardCoins"
                )
                .value
        ) || 0;


    const minLevel =
        Number(
            document
                .getElementById(
                    "minLevel"
                )
                .value
        );


    const maxLevel =
        Number(
            document
                .getElementById(
                    "maxLevel"
                )
                .value
        );


    const groupUrl =
        document
            .getElementById(
                "groupUrl"
            )
            .value
            .trim();


    if (
        minLevel > maxLevel
    ) {

        alert(
            "أقل Level يجب أن يكون أصغر من أو يساوي أعلى Level"
        );

        return;

    }


    if (
        minLevel < 1 ||
        maxLevel > 10
    ) {

        alert(
            "الـ Level يجب أن يكون من 1 إلى 10"
        );

        return;

    }


    const { error } =
        await supabaseClient
            .from("tournaments")
            .insert({

                name:
                    name,

                description:
                    description,

                reward_coins:
                    reward,

                min_level:
                    minLevel,

                max_level:
                    maxLevel,

                group_url:
                    groupUrl

            });


    if (error) {

        console.error(
            error
        );

        alert(
            "حدث خطأ أثناء إنشاء البطولة ❌"
        );

        return;

    }


    document
        .getElementById(
            "createTournamentForm"
        )
        .reset();


    closeCreateModal();


    showToast(
        "تم إنشاء البطولة بنجاح 🎉"
    );


    await loadTournaments();

}


// ============================
// JOIN MODAL
// ============================

function openJoinModal(
    id
) {

    selectedTournament =
        tournaments.find(
            tournament =>
                tournament.id === id
        );


    if (
        !selectedTournament
    ) {

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

async function joinTournament(
    event
) {

    event.preventDefault();


    if (
        !selectedTournament
    ) {

        return;

    }


    const playerName =
        document
            .getElementById(
                "playerName"
            )
            .value
            .trim();


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
        !playerName
    ) {

        error.textContent =
            "اكتب اسمك أولًا.";

        error.style.display =
            "block";

        return;

    }


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


    // ============================
    // SAVE PARTICIPANT
    // ============================

    const { error: insertError } =
        await supabaseClient
            .from("participants")
            .insert({

                tournament_id:
                    selectedTournament.id,

                player_name:
                    playerName,

                player_level:
                    playerLevel

            });


    if (insertError) {

        console.error(
            insertError
        );

        error.textContent =
            "حدث خطأ أثناء التسجيل ❌";

        error.style.display =
            "block";

        return;

    }


    // ============================
    // SUCCESS
    // ============================

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


    document
        .getElementById(
            "joinForm"
        )
        .reset();


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
            .toLowerCase()
            .trim();


    const filtered =
        tournaments.filter(
            tournament =>

                tournament.name
                    .toLowerCase()
                    .includes(
                        query
                    )

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

            behavior:
                "smooth"

        });

}


// ============================
// TOAST
// ============================

function showToast(
    message
) {

    const toast =
        document
            .getElementById(
                "toast"
            );


    toast.textContent =
        message;


    toast.classList
        .add("show");


    setTimeout(
        () => {

            toast.classList
                .remove("show");

        },
        3000
    );

}


// ============================
// SECURITY
// ============================

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}


// ============================
// CLOSE MODAL
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

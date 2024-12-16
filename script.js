let entities = {
    garage: {
        actor: "input_boolean.test",
        closed: "Garaż (ZAMKNIĘTY)",
        open: "Garaż (OTWARTY)"
    },
    gate: {
        actor: "input_boolean.test1",
        closed: "Brama (ZAMKNIĘTA)",
        open: "Brama (OTWARTA)"
    }
};
let host = window.location.host;
let closedString = "on";
let openString = "off";
let entityType = entities.garage.actor.split(".")[0];
let paramString = document.URL.split('?')[1];
let queryString = new URLSearchParams(paramString);
let xhr = new XMLHttpRequest();

if (queryString) {
    for(let pair of queryString.entries()) {
        if (pair[0] == "token") {
            var token = pair[1]
        } else {
            alert("Token nie został znaleziony lub adres URL jest nieprawidłowy");
        };
    };
} else {
    alert("Proszę przekazać token w parametrach adresu URL");
};

function setState(entity, state) {
    document.getElementById(`text-${entity}`).innerHTML = entities[entity][state];
    document.getElementById(`img-${entity}`).src = `${entity}-${state}.svg`;
    if (state == "closed") {
        document.getElementById(`dot-${entity}`).style.setProperty("background-color", "#2ADE33", "important");
        document.getElementById(`toggle-${entity}`).style.setProperty("background-color", "#2ADE33", "important");
        document.getElementById(`btn-${entity}`).innerHTML = "Otwórz"
    } else if (state == "open") {
        document.getElementById(`dot-${entity}`).style.setProperty("background-color", "#AF0900", "important");
        document.getElementById(`toggle-${entity}`).style.setProperty("background-color", "#AF0900", "important");
        document.getElementById(`btn-${entity}`).innerHTML = "Zamknij"
    };
};

function getStates() {
    for (let entity in entities) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", `https://${host}/api/states/${entities[entity].actor}`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status == 200) {
                    let response = JSON.parse(this.response)
                    if (response.state == closedString) {
                        setState(entity, "closed");
                    } else if (response.state == openString) {
                        setState(entity, "open");
                    };
                } else if (xhr.status == 401) {
                    alert("HTTP: Nieprawidłowy token")
                } else if (xhr.status != 200) {
                    alert(`HTTP: Coś poszło nie tak (${xhr.status})`);
                };
            };
        };
        xhr.send();
    };
};

if (token) {
    getStates();

    document.addEventListener('DOMContentLoaded', function() {
        const socket = new WebSocket(`wss://${host}/api/websocket`);
        socket.onmessage = function(event) {
            const wsdata = JSON.parse(event.data);
            switch (wsdata.type) {
                case 'auth_required':
                    socket.send(JSON.stringify({type: "auth", access_token: token}));
                    break;
                case 'auth_invalid':
                    alert("WebSocket: Nieprawidłowy token");
                    break;
                case "auth_ok":
                    socket.send(JSON.stringify({id: 1, type: "subscribe_trigger", trigger: {platform: "state", entity_id: entities.garage.actor, from: openString, to: closedString}}));
                    socket.send(JSON.stringify({id: 2, type: "subscribe_trigger", trigger: {platform: "state", entity_id: entities.garage.actor, from: closedString, to: openString}}));
                    socket.send(JSON.stringify({id: 3, type: "subscribe_trigger", trigger: {platform: "state", entity_id: entities.gate.actor, from: openString, to: closedString}}));
                    socket.send(JSON.stringify({id: 4, type: "subscribe_trigger", trigger: {platform: "state", entity_id: entities.gate.actor, from: closedString, to: openString}}));
                    break;
                case "event":
                    switch (wsdata.id) {
                        case 1:
                            setState("garage", "closed");
                            break;
                        case 2:
                            setState("garage", "open");
                            break;
                        case 3:
                            setState("gate", "closed");
                            break;
                        case 4:
                            setState("gate", "open");
                            break;
                    }
                    break;
            }
        };
    });

    $(document).on("click", "#toggle-garage", function () {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", `https://${host}/api/services/${entityType}/toggle`, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status == 401) {
                    alert("HTTP: Nieprawidłowy token")
                } else if (xhr.status != 200) {
                    alert(`HTTP: Coś poszło nie tak (${xhr.status})`);
                };
            };
        };
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.send(JSON.stringify({entity_id: entities.garage.actor}));
    }).on("click", "#toggle-gate", function () {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", `https://${host}/api/services/${entityType}/toggle`, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status == 401) {
                    alert("HTTP: Nieprawidłowy token")
                } else if (xhr.status != 200) {
                    alert(`HTTP: Coś poszło nie tak (${xhr.status})`);
                };
            };
        };
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.send(JSON.stringify({entity_id: entities.gate.actor}));
    }).on("swipeleft", ".swipe", function (e) {
        $(this).prevAll("span").addClass("show");
        $(this).off("click").blur();
        $(this).css({
            transform: "translateX(-80px)"
        }).one("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd", function () {
            $(this).one("swiperight", function () {
                $(this).prevAll("span").removeClass("show");
                $(this).css({
                    transform: "translateX(0)"
                }).blur();
            });
        });
    });
}

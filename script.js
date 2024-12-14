let host = "example.org"
let entities = {
    garage: {
        actor: "input_boolean.test",
        sensor: "input_boolean.test",
        closed: "Garaż (ZAMKNIĘTY)",
        open: "Garaż (OTWARTY)"
    },
    gate: {
        actor: "input_boolean.test1",
        sensor: "input_boolean.test1",
        closed: "Brama (ZAMKNIĘTA)",
        open: "Brama (OTWARTA)"
    }
};
let paramString = document.URL.split('?')[1];
let queryString = new URLSearchParams(paramString);
let xhr = new XMLHttpRequest();

if (paramString) {
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
};

function getStates() {
    for (let entity in entities) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", `https://${host}/api/states/${entities[entity].sensor}`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status == 200) {
                    let response = JSON.parse(this.response)
                    if (response.state == "on") {
                        setState(entity, "closed");
                    } else if (response.state == "off") {
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
                    socket.send(JSON.stringify({id: 1, type: "subscribe_trigger", trigger: {platform: "state", entity_id: entities.garage.sensor, from: "off", to: "on"}}));
                    socket.send(JSON.stringify({id: 2, type: "subscribe_trigger", trigger: {platform: "state", entity_id: entities.garage.sensor, from: "on", to: "off"}}));
                    socket.send(JSON.stringify({id: 3, type: "subscribe_trigger", trigger: {platform: "state", entity_id: entities.gate.sensor, from: "off", to: "on"}}));
                    socket.send(JSON.stringify({id: 4, type: "subscribe_trigger", trigger: {platform: "state", entity_id: entities.gate.sensor, from: "on", to: "off"}}));
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
        xhr.open("POST", `https://${host}/api/services/input_boolean/toggle`, true);
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
        xhr.open("POST", `https://${host}/api/services/input_boolean/toggle`, true);
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
    }).on("swipeleft", "ul li a", function (e) {
        $(this).prevAll("span").addClass("show");
        $(this).off("click").blur();
        $(this).css({
            transform: "translateX(-70px)"
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

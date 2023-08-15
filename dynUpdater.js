﻿const urlParams = new URLSearchParams(window.location.search);
//SETTINGS
const websocketIP = urlParams.get('url') || "ws://127.0.0.1:8085";
const framerate = 15; //framerate
const splitsMaxAmount = 5; //maximum amount of splits shown on screen

//DO NOT EDIT
const sMC = "█"

var websocket;
var interval;
function reconnect() {
    if (!websocket || websocket.readyState == WebSocket.CLOSED) {
        console.log("Trying to connect to " + websocketIP);
        websocket = new WebSocket(websocketIP);

        websocket.addEventListener("open", (event) => {
            console.log("connected");
            interval = setInterval(socket_RequestUpdate, 1000 / framerate);
            setInterval(document_infoNext, 5000)
        });

        websocket.addEventListener("close", (event) => {
            console.log("disconnected");
            if (interval != null) { clearInterval(interval) };
            document.getElementById("timer").innerText = "Disconn."
        });

        websocket.addEventListener("message", (event) => {
            var message = event.data;
            var messageArray = message.split(sMC);
            // console.log(messageArray);

            if (messageArray.length > 0) {
                switch (messageArray[0]) {
                    case "update":
                        document_UpdateInfo(messageArray[1], messageArray[2]);
                        document_UpdateTimer(messageArray[3], messageArray[4], messageArray[5]);
                        if (infoPanelPointer == -1) { document_infoNext(); }
                        break;
                    case "split":
                        document_AddSplit(messageArray[1], messageArray[2], messageArray[3], messageArray[4])
                        break;
                    case "undo":
                        document_UndoSplit();
                        break;
                    case "reset":
                        document_ResetSplits()
                        break;
                }
            }
        })

    }
}
setInterval(reconnect, 10000);
reconnect();

function socket_RequestUpdate() {
    websocket.send("update");
}

infoStrings = ["PB", "SoB"];
timeStrings = ["n/a", "n/a"];

infoPanelPointer = -1;

function document_UpdateInfo(pb, sob) {
    timeStrings = [pb, sob];
}

function document_infoNext() {
    infoPanelPointer += 1
    if (infoPanelPointer == infoStrings.length) { infoPanelPointer = 0; }
    document.getElementById("info").innerHTML = infoStrings[infoPanelPointer];
    document.getElementById("infotime").innerHTML = timeStrings[infoPanelPointer];
}

function document_UpdateTimer(timer, ms, color) {
    var element = document.getElementById("timer");
    element.innerHTML = timer;
    element.style.color = color;
    var element = document.getElementById("timer-ms");
    element.innerHTML = "." + ms + "  "
    element.style.color = color;
}

splits = [];

// Helper function to create nested div structure
// Many JS frameworks have similar, but keeping no dependencies
function createElem(tag, classes, content = undefined, post_hook = undefined, children = []) {
    const elem = document.createElement(tag);
    for (const c of classes) {
        elem.classList.add(c);
    }
    if (content) elem.innerHTML = content;
    for (const ch of children) {
        elem.appendChild(ch);
    }
    if (post_hook) post_hook(elem);
    return elem;
}

function document_AddSplit(inputname, time, delta, color) {
    if (splits.length >= splitsMaxAmount) {
        var collection = document.getElementsByClassName("split-container")
        const rem = Array.prototype.find.call(collection, (e) => !e.classList.contains("split-del-top"));
        rem.classList.add("split-del-top");
        rem.addEventListener("animationend", () => rem.remove());
        splits.shift();
    }

    var name = inputname.trim();
    const subsplit = name[0] == "-";
    if (subsplit) name = name.substring(1).trim();

    //section name detection
    if (name.includes("{")) {
        document_AddSplit("-" + name.substring(name.indexOf("}") + 1).trim(), time, delta, color);
        name = name.substring(name.indexOf("{") + 1, name.indexOf("}"))
    }

    const newSplit = createElem("div", ["split-container"], undefined, undefined, [
        createElem("div", ["split-name"], name),
        createElem("div", ["split-delta"], delta, (e) => e.style.color = color),
        createElem("div", ["split-time"], time)
    ]);
    //subsplit detection
    if (subsplit) newSplit.classList.add("subsplit");

    document.getElementById("splits-container").appendChild(newSplit);
    splits[splits.length] = [name, time, delta, color];
}

function document_ResetSplits() {
    document.getElementById("splits-container").innerHTML = ""
    splits = []
}

function document_UndoSplit() {
    splits.pop();

    // Find newest split that is not in the process of animating out
    var collection = document.getElementsByClassName("split-container");
    const split = Array.prototype.findLast.call(collection, (e) => !e.classList.contains("split-del"));
    // Add delete anim and delete element on anim end
    split.classList.add("split-del");
    split.addEventListener("animationend", () => split.remove());
}
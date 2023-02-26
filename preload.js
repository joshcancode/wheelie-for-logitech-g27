const { contextBridge, ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();

contextBridge.exposeInMainWorld(
    'wheelInterface', {
        updateCfg: (data) => ipcRenderer.send('update-wheel-cfg', data)
    }
)

const determineWheelRotation = (wheelRange, turnAmount) => {
    return (turnAmount / 100) * wheelRange - (wheelRange * .5); // "transform: rotate()" accepts overflowing degrees so we don't need to clamp
}

const lerp = (start, end, amt) => {
    return (1 - amt) * start + amt * end
}

const updateWheelDisplay = () => {
    const wheelRange = store.get("wheelRange");

    const wheelRotation = determineWheelRotation(wheelRange, window.turnAmount);
    window.wheelPreview.style.transform = "rotate(" + wheelRotation + "deg)";

    const rounded = Number(window.turnAmount).toFixed(2);

    if (rounded > 50) {
        window.wheelTurnBarFill.setAttribute('x1', '150');
        window.wheelTurnBarFill.setAttribute('x2', (rounded / 50) * 150);
    } else {
        window.wheelTurnBarFill.setAttribute('x1', (rounded / 50) * 150);
        window.wheelTurnBarFill.setAttribute('x2', '150');
    }

    window.wheelTurnBarValue.style.transform = "translateX(" + Number(((rounded / 50) * 150) - 150) + "px)";
    window.wheelTurnBarValue.innerHTML = Math.round(wheelRotation) + '°';
}

window.addEventListener('DOMContentLoaded', () => {
    window.wheelPreview = document.getElementById("wheelPreview");
    window.wheelTurnBarFill = document.getElementById("wheelTurnBarFill");
    window.wheelTurnBarValue = document.getElementById("wheelTurnBarValue");

    // Set the settings to their saved values
    const wheelRange = store.get("wheelRange");
    document.getElementById("wheel-range-slider").value = wheelRange;
    document.getElementById("wheel-range-value").innerHTML = wheelRange + '°';

    let settingsForm = document.getElementById("wheel-cfg-form");
    let settingsFormSubmit = document.getElementsByClassName("form-submit-button")[0];

    settingsForm.addEventListener('submit', (event) => {
        settingsFormSubmit.innerText = "";
        console.log(settingsFormSubmit.children[0]);
        settingsFormSubmit.children[0].style.display = "block";
    });

    ipcRenderer.on('wheel-turn', (event, amount) => {
        window.turnAmount = amount;
        updateWheelDisplay();
    });
});
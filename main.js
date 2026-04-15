const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
    // Crear la ventana del navegador de tamaño 800x600 con el título "Genesis 2.0"
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        title: "Genesis 2.0",
    });

    // Cargar el código generado en producción en la ventana generada
    win.loadFile(path.join(__dirname, "dist/fuse/index.html"));
}

// App lifecycle events
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    // Crear una ventana cuando no exista una ya abierta
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

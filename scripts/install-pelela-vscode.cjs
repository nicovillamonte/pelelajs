const fs = require("fs");
const path = require("path");
const os = require("os");

function getExtensionsDir() {
  const home = os.homedir();

  switch (process.platform) {
    case "darwin": // macOS
    case "linux":
      return path.join(home, ".vscode", "extensions");
    case "win32":
      return path.join(home, ".vscode", "extensions");
    default:
      throw new Error(`Plataforma no soportada: ${process.platform}`);
  }
}

function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const src = path.join(repoRoot, "tools", "pelela-vscode");
  const extensionsDir = getExtensionsDir();
  const dest = path.join(extensionsDir, "pelela-vscode");

  if (!fs.existsSync(src)) {
    console.error(`No se encontró la carpeta de la extensión en: ${src}`);
    process.exit(1);
  }

  fs.mkdirSync(extensionsDir, { recursive: true });

  if (fs.existsSync(dest)) {
    console.log(`Eliminando extensión anterior en: ${dest}`);
    fs.rmSync(dest, { recursive: true, force: true });
  }

  console.log(`Copiando extensión PelelaVSCode a: ${dest}`);
  fs.cpSync(src, dest, { recursive: true });

  console.log("✅ Extensión PelelaVSCode instalada. Reiniciá VSCode o recargá la ventana.");
}

main();
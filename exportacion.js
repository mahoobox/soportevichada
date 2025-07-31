import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directorioBase = __dirname;
const archivoSalida = path.join(directorioBase, "exportacion.txt");

const carpetasIgnoradas = [".next", ".vercel", "node_modules"];
const archivosIgnorados = [
  "pnpm-lock.yaml",
  "exportacion.js",
  "exportacion.txt",
];

function recorrerDirectorios(directorio, salida) {
  const archivos = fs.readdirSync(directorio);

  for (const archivo of archivos) {
    if (archivo.startsWith(".")) continue; // Ignorar archivos ocultos

    const rutaCompleta = path.join(directorio, archivo);
    const stat = fs.statSync(rutaCompleta);

    if (stat.isDirectory()) {
      if (carpetasIgnoradas.includes(archivo)) continue;
      recorrerDirectorios(rutaCompleta, salida);
    } else {
      if (archivosIgnorados.includes(archivo)) continue;

      const rutaRelativa = path.relative(directorioBase, rutaCompleta);
      const contenido = fs.readFileSync(rutaCompleta, "utf-8");

      salida.write(`\n--- ${rutaRelativa} ---\n`);
      salida.write(contenido + "\n");
    }
  }
}

const streamSalida = fs.createWriteStream(archivoSalida, { flags: "w" });

recorrerDirectorios(directorioBase, streamSalida);

streamSalida.end(() => {
  console.log(`Archivo generado: ${archivoSalida}`);
});

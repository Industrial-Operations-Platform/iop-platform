# IOP transferido a este PC

Restaurado el 31 de octubre de 2026 desde la captura del 30 de octubre de 2026.

Aplicacion: http://127.0.0.1:8080. Usa tus cuentas y contrasenas anteriores.

La restauracion ha verificado las 62 tablas y sus 155.067 registros contra los hashes del respaldo, incluidos roles, contrasenas PostgreSQL, propietarios, permisos y politicas RLS. Tambien se han verificado los cinco archivos de configuracion y los 75 archivos privados de Locator copiados a volumenes Docker. No habia eventos Audit caducados. Web y API responden HTTP 200.

La instalacion anterior `iop-platform-local` permanece detenida, con sus volumenes y configuracion originales. La copia transferida utiliza el proyecto independiente `iop-transfer-20261030` y la version del codigo incluida en el paquete. La carpeta IOP abierta en el IDE conserva su configuracion anterior.

## Uso desde PowerShell en la carpeta IOP

Abre Docker Desktop y ejecuta:

```powershell
node output/iop-transfer-20261030.cjs start
node output/iop-transfer-20261030.cjs status
node output/iop-transfer-20261030.cjs stop
```

Estos comandos solo operan sobre los tres contenedores de la copia transferida y conservan los datos al detenerlos.

## Ubicaciones y persistencia

- Codigo incluido: Ubuntu, `/home/victortilvesalgado/iop-transfer-20261030/iop-platform`.
- Credenciales/configuracion originales restauradas: `.local-platform/` dentro de ese codigo.
- Informe completo: Ubuntu, `/home/victortilvesalgado/iop-transfer-20261030/restore-review-20261030/restore-verification.json`.
- Base activa: volumen `58b4da3a9a50cb3a20c9284c57c5bb3c8a45d3f28733af3fdf010c7cd0855e05`.
- Configuracion activa: volumen `iop-transfer-20261030_config`, montado en solo lectura.
- Referencias activas: volumen `iop-transfer-20261030_locator-references`, montado en solo lectura.
- Override de restauracion: `.local-platform/compose.restored.yaml` dentro del codigo incluido. Conserva ese archivo junto con los datos privados.
- El contenedor `iop-restore-1f09332b-abb5-41a9-916c-2f4c80411930` permanece detenido como evidencia de la restauracion; comparte el volumen de la base activa y debe seguir detenido.
- El respaldo cifrado y su clave originales permanecen en la carpeta de transferencia de Windows; tambien hay una copia privada en Ubuntu.

La configuracion y las referencias se copiaron y verificaron en volumenes dedicados porque los montajes de carpetas de WSL fallaban. Las futuras modificaciones de esos archivos requieren actualizar tambien el volumen correspondiente. No se han ejecutado migraciones ni semillas sobre la copia restaurada.

Para esta copia utiliza el script anterior; `npm run local:up` de la carpeta IOP corresponde a la instalacion anterior. Conserva los volumenes Docker, el respaldo y su clave. No ejecutes `down -v` ni limpieza de volumenes sobre esta instalacion.

La conservacion de cuentas y contrasenas se comprobo mediante la reconciliacion completa de la base y los archivos; no se ha realizado un inicio de sesion con una contrasena personal.

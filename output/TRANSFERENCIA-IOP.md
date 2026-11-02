# IOP transferido a este PC

Actualizado el 2 de noviembre de 2026.

La base traída de casa ya sustituye a la base de la instalación habitual `iop-platform-local`. La aplicación está disponible en http://127.0.0.1:8080 con las cuentas y contraseñas transferidas.

## Uso habitual

Desde la carpeta IOP, con Docker Desktop abierto:

```powershell
npm run local:up
npm run local:status
npm run local:stop
```

No se han modificado `compose.platform.yaml`, los demás Compose, `.dockerignore`, `package.json` ni los scripts de arranque. Esta operación solo ha cambiado datos, configuración privada y recursos Docker de este PC. La ruta del ejecutable Docker se ha añadido al PATH del usuario de Windows de este PC; si una terminal antigua no lo encuentra, vuelve a abrirla.

## Verificación

Se compararon las 62 tablas y sus 155.069 registros, roles, propietarios, permisos y políticas RLS antes y después de copiar la base. El arranque habitual terminó correctamente y no cambió los datos ni los permisos. Las 78 fechas históricas se verificaron sin importar ninguna de nuevo. Los cinco archivos de configuración y los 75 archivos privados de Locator coinciden con la copia transferida. Web y API responden correctamente y los tres servicios están saludables.

## Persistencia y copias de seguridad

- Base activa: `iop-platform-local_platform-data`.
- Configuración activa: `.local-platform/config/`, con los archivos de credenciales en `.local-platform/`.
- Referencias activas: `iop-platform-local_locator-references`, conservando también los archivos en `.local-platform/locator/`.
- Copia de la base anterior: `iop-platform-local_pre-20261102-normalize-database`.
- Copia de las referencias anteriores: `iop-platform-local_pre-20261102-normalize-locator`.
- Configuración anterior, conciliación completa e informe: `.local-platform/backups/20261102-normalize/`.
- El volumen original de la transferencia se conserva sin contenedores asociados: `58b4da3a9a50cb3a20c9284c57c5bb3c8a45d3f28733af3fdf010c7cd0855e05`.
- El respaldo cifrado y su clave originales se conservan.

Se retiraron los cinco contenedores de transferencia y verificación. Ahora solo existen los tres contenedores de `iop-platform-local`. El antiguo lanzador `output/iop-transfer-20261030.cjs` queda archivado en la carpeta de copias indicada; ya no se utiliza.

No se ha realizado un inicio de sesión con una contraseña personal. La conservación de las cuentas y contraseñas se verificó mediante la comparación completa de los registros de la base.

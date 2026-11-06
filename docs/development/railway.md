# Railway y Docker: publicación y actualizaciones

La instalación local conserva sus contenedores separados. Railway usa **dos
servicios**: `iop` sirve React y la API en el mismo origen; `database` ejecuta
PostgreSQL 17.6 en la red privada. Cada instalación tiene datos y credenciales
independientes. Una actualización de código nunca vuelve a importar los datos.

## Comandos habituales

Ejecutar desde la raíz del repositorio. En PowerShell con scripts deshabilitados,
usar `npm.cmd` en lugar de `npm`.

| Comando | Resultado |
| --- | --- |
| `npm run local:up` | Construye e inicia Docker local; conserva sus datos |
| `npm run local:update` | Reconstruye el código actual y aplica migraciones sin borrar volúmenes |
| `npm run local:sync` | Exige un árbol Git limpio, ejecuta `git pull --ff-only` y actualiza Docker |
| `npm run local:stop` | Detiene Docker sin eliminar datos |
| `npm run local:status` | Consulta los contenedores |
| `npm run railway:deploy` | Valida y publica el commit actual en Railway; verifica la revisión accesible por HTTPS |
| `npm run railway:check` | Comprueba HTTPS, web, autenticación y rechazo de acceso anónimo |

`local:update` construye las imágenes antes de detener la versión anterior. Si la
construcción falla, la aplicación existente sigue funcionando. Un error posterior
de migración requiere revisar el fallo y volver a ejecutar la actualización;
el comando conserva los datos y no intenta deshacer migraciones automáticamente.
Los servicios locales se reinician tras reiniciar Docker, salvo parada explícita.

## Preparación inicial de Railway

Requisitos: cuenta de Railway con Hobby, Node 24.21.0, npm 10.9.2, Git y Docker
Desktop funcionando para exportar la instalación local y ejecutar la validación
completa. `npm ci` instala la CLI oficial **5.71.0** fijada en el lockfile. No es
necesaria una instalación global. Autenticación interactiva:

```sh
npm run railway -- login
```

Crear un proyecto y un entorno `production` con estos recursos. Se puede hacer
desde el panel o la integración de Railway; **no conectar GitHub todavía**.

| Recurso | Configuración inicial |
| --- | --- |
| Servicio `database` | Imagen `postgres:17.6-bookworm`, sin dominio público ni TCP proxy |
| Volumen de `database` | Montado en `/var/lib/postgresql/data`; conservarlo entre despliegues |
| Servicio vacío `iop` | Raíz del repositorio; configuración `.railway/railway.ts` |
| Volumen de `iop` | Nombre **`iop-data`**, montado en **`/data`** |
| Dominio de `iop` | Generar un dominio HTTPS `*.up.railway.app`; no hace falta comprar uno |
| Réplicas | Una en la misma región europea que la base de datos |

No arrancar PostgreSQL con credenciales predeterminadas antes de configurar sus
variables. Si ya se inicializó con otro usuario/base, crear una instalación nueva:
no cambiar las variables sobre un volumen con datos esperando que se reinicialice.
Esta aplicación requiere el propietario `iop_bootstrap`, la base `iop_local` y
roles separados `iop_migrator` e `iop_runtime`.

Copiar los identificadores del proyecto, entorno y servicios. Generar las
variables a partir de las configuraciones locales actuales:

```sh
npm run build
npm run railway:configure -- --project PROJECT_ID --environment ENVIRONMENT_ID --service APP_SERVICE_ID --database-service DATABASE_SERVICE_ID --origin https://TU-APP.up.railway.app
npm run railway:variables
npm run railway -- link --project PROJECT_ID --environment ENVIRONMENT_ID --service APP_SERVICE_ID
npm run railway -- config plan
npm run railway -- config apply --yes
```

Los valores privados se guardan en `.railway/`, excluidos de Git y de los envíos
de código. Solo su configuración IaC y README se versionan. Este formato sustituye
`railway.json`, retirado por Railway el 2026-12-01. Las variables quedan fuera de
la gestión IaC para conservar sus secretos. El generador copia scope, usuarios,
mappings y Handover; sustituye solo
los orígenes locales por el dominio HTTPS. Genera tres contraseñas nuevas para
Railway y conserva esas mismas contraseñas al repetir la configuración. La
referencia `${{database.RAILWAY_PRIVATE_DOMAIN}}` presupone el nombre **database**.
Las variables se transmiten por stdin y no aparecen en argumentos ni en la salida.
El archivo adicional local `workforce-groups.json`, si existe, se conserva en la
copia privada de configuración; no es una entrada del runtime de la API.

Iniciar el servicio `database` después de configurar las variables y esperar a
que PostgreSQL esté listo. Mantener `iop` sin desplegar hasta completar la copia.

## Copiar los datos actuales una sola vez

Con Docker local en ejecución, tomar una instantánea actual; no usar una copia
antigua del repositorio o de `transfer-staging`:

```sh
npm run railway:snapshot
```

Se guarda un `pg_dump` consistente de la base actual, las referencias privadas del
Locator y la configuración en `.railway/initial-snapshot/`. Este directorio contiene
datos sensibles y contraseñas de provisionamiento del destino; mantenerlo privado.
En Windows, proteger el directorio mediante los permisos de la cuenta del usuario;
los modos POSIX `0600` no sustituyen los permisos NTFS.

Registrar la clave SSH mediante una primera conexión interactiva al servicio
`database`, con los identificadores del proyecto y entorno, si Railway la solicita:

```sh
npm run railway -- ssh --project PROJECT_ID --environment ENVIRONMENT_ID --service DATABASE_SERVICE_ID -- true
npm run railway:import-initial
npm run railway:verify-data
```

La importación exige una base **nueva y vacía**, sin roles de aplicación previos,
y rechaza repetir la operación. Crea los roles con contraseñas independientes y
restaura el esquema, datos, propietarios y permisos en una sola transacción. No
borra tablas ni modifica el volumen local. Conserva los usuarios y sus contraseñas;
revoca las sesiones copiadas para exigir un nuevo inicio de sesión. Si falla,
revisar el error antes de reintentar; no quitar la comprobación de destino vacío.

La verificación compara el número de filas de las tablas con la copia inicial,
sin imprimir registros de negocio. Ejecutarla inmediatamente después de importar.

Después del primer despliegue, con `iop` activo, ejecutar `npm run railway:references`.
Comprueba que `/data/locator` está vacío, copia los archivos mediante SCP cifrado
y les aplica permisos privados de Node. Requiere OpenSSH y una clave registrada:
guardar su ruta en `sshIdentity` de `.railway/target.json`, o suministrar
`IOP_RAILWAY_SSH_IDENTITY`. Se niega a sobrescribir referencias previas. Las
actualizaciones normales conservan el volumen y no repiten esta transferencia.

## Primera publicación y publicaciones siguientes

Guardar los cambios revisados en un commit antes de publicar. El comando envía
una lista explícita de fuentes y recursos; nunca envía `.local-platform`,
`.railway`, archivos de credenciales, copias de seguridad ni todo el directorio
de trabajo.

```sh
npm run railway:deploy
```

La primera ejecución usa el destino guardado por `railway:configure`. El comando
exige un árbol Git limpio y ejecuta `npm run test:poc` (incluye PostgreSQL y
navegador con Docker), antes del envío. Se pueden suministrar identificadores
explícitos mediante `RAILWAY_PROJECT_ID`, `RAILWAY_ENVIRONMENT_ID`,
`RAILWAY_SERVICE_ID`, `RAILWAY_DATABASE_SERVICE_ID` e `IOP_PUBLIC_ORIGIN`.

Railway construye la imagen conjunta con el lockfile. El paso previo aplica las
migraciones hacia adelante y verifica el provisionamiento sin abrir otro runtime
de aplicación. Un error impide activar esa publicación. La aplicación usa las
credenciales no propietarias, cookies `Secure`/`HttpOnly`/`SameSite=Strict`, dominio
exacto, comprobaciones de origen y cabecera CSRF. El modo local sigue limitado a
loopback; el selector de demostración no puede activarse en Railway.

El servicio conserva secretos de migración para el paso previo; el lanzador los
retira del entorno del proceso de la API. Esto separa los roles de conexión, pero
no aísla esos secretos de un operador con control sobre el contenedor de Railway.
La red privada Railway se usa entre aplicación y base; no se admite una URL de
base de datos pública ni se deshabilita la validación TLS de un servicio externo.

El volumen de aplicación es obligatorio: Railway detiene la instancia anterior
antes de montarlo en la siguiente. Esto respeta el bloqueo de proceso único de
IOP, con una breve interrupción durante las actualizaciones. No habilitar réplicas.
El lanzador ajusta la propiedad del volumen y ejecuta Node como usuario no root.

El comando comprueba `/health`, la web, el contexto anónimo y que `/users` rechace
el acceso sin sesión. También espera a que `build-revision.json` coincida con el
commit enviado, para no confundir una versión anterior sana con el despliegue
nuevo. `/health` sigue siendo salud del proceso: no sustituye una prueba funcional
autenticada ni una recuperación de copia de seguridad.

Para volver al código de una revisión anterior, usar un checkout limpio de ese
commit y ejecutar el mismo comando de publicación después de verificar su
compatibilidad con el esquema actual. No restaurar la instantánea inicial ni
deshacer migraciones automáticamente: ambas acciones podrían perder cambios de
los evaluadores. Railway conserva las versiones de despliegue para diagnóstico,
pero volver al código anterior tampoco revierte las migraciones de PostgreSQL.

Después de publicar, entrar con las cuentas copiadas y probar, con cada perfil,
una consulta y una operación de escritura permitida. Crear cuentas individuales
para ambos evaluadores desde la administración. Si se eligió una instalación
vacía, emitir el primer acceso únicamente mediante una terminal SSH interactiva:

```sh
npm run railway -- ssh --project PROJECT_ID --environment ENVIRONMENT_ID --service APP_SERVICE_ID -- node scripts/railway/admin.cjs
```

No ejecutar la emisión de contraseñas en el paso de despliegue ni en GitHub Actions.

## Actualización automática desde GitHub

El workflow **Platform validation** valida el código, PostgreSQL, navegador y
construcción de las cuatro imágenes Docker. También inicia la imagen de Railway
con una base sintética y verifica login, HTTPS, cookies y ejecución sin root.
Después puede publicar ese mismo SHA;
el job de publicación nunca recibe código de un pull request. Las publicaciones
de producción se serializan para no solapar migraciones.

Crear el entorno de GitHub `railway-production` con:

| Tipo | Nombre | Valor |
| --- | --- | --- |
| Secret | `RAILWAY_TOKEN` | Token de proyecto, limitado al entorno de Railway elegido |
| Variable | `RAILWAY_PROJECT_ID` | Identificador del proyecto |
| Variable | `RAILWAY_ENVIRONMENT_ID` | Identificador de `production` |
| Variable | `RAILWAY_SERVICE_ID` | Identificador del servicio `iop` |
| Variable | `RAILWAY_DATABASE_SERVICE_ID` | Identificador del servicio `database` |
| Variable | `IOP_PUBLIC_ORIGIN` | Origen HTTPS exacto |

Crear como **variables del repositorio**, para que la condición del job pueda
leerlas antes de entrar al entorno:

| Variable | Valor |
| --- | --- |
| `RAILWAY_DEPLOY_BRANCH` | Rama de publicación; por defecto `main`. Usar `develop` si esa será la rama elegida |
| `RAILWAY_AUTO_DEPLOY` | `true` para publicar automáticamente tras las comprobaciones |

También se puede ejecutar **Run workflow** sobre la rama elegida para validar y
publicar manualmente. Mantener desactivado el autodespliegue directo de GitHub en
Railway: el workflow es quien publica después de validar. Así no hay dos vías
compitiendo ni publicaciones anteriores a los tests. En Windows, cuatro pruebas
de permisos/propiedad POSIX se omiten explícitamente; Linux CI las ejecuta todas,
incluidas las comprobaciones de symlinks que requieren privilegios en Windows.
Una quinta prueba de restauración con permisos POSIX también se ejecuta solo en Linux.

## Coste, copias y fin de la evaluación

Usar Hobby, dos servicios, una región y una réplica. La API limita el heap de Node
a 384 MiB como punto de partida; medir RSS y consumo real después de cargar los
datos. En Railway, fijar inicialmente 0.5 CPU/0.75 GB para `iop` y
0.5 CPU/0.5 GB para PostgreSQL, y revisar memoria tras una importación. Esos límites
limitan recursos, no garantizan por sí solos una factura de US$20.

En el **workspace dedicado a esta evaluación**, configurar alerta US$15 y límite
duro de consumo US$20; el límite detiene los servicios si se alcanza. El límite es
del workspace, no solo de este proyecto. No aplicarlo a un workspace con otros
proyectos sin revisar el efecto. Con el identificador del workspace dedicado:

```sh
npm run railway -- usage limit set --workspace WORKSPACE_ID --target workspace --soft 15 --hard 20
```

El límite se refiere al consumo; revisar impuestos y cualquier cargo adicional
en la pantalla de facturación. No activar Railway Agent para esta automatización.
Activar copias automáticas diarias en ambos volúmenes desde Railway y comprobar
una restauración en un entorno separado. La configuración IaC administra los
límites de recursos y los volúmenes de 5 GB. La ubicación de cada volumen debe
coincidir exactamente con Railway: no aceptar un cambio de ubicación como parte
de una ampliación. Los límites de consumo requieren una suscripción de pago activa.

Al cerrar la evaluación, exportar los datos, conservar la configuración privada y
cancelar los recursos que ya no se necesiten. No borrar volúmenes antes de verificar
la copia. El repositorio no programa un borrado automático del entorno al mes.

## Fuentes y estado de verificación

- [Infraestructura declarativa de Railway](https://docs.railway.com/infrastructure-as-code)
- [Migraciones antes del despliegue](https://docs.railway.com/deployments/pre-deploy-command)
- [Volúmenes y restricciones de despliegue](https://docs.railway.com/volumes/reference)
- [Control del consumo](https://docs.railway.com/pricing/cost-control)

Preparación implementada el 2026-11-06. La disponibilidad pública, importación real,
facturación y recuperación en Railway solo se confirman después de ejecutar los
pasos en la cuenta y observar el resultado. La validación local sin Docker no
sustituye el job Linux, la prueba de importación inicial o un despliegue real.

# Clase 06 · Confirmar no es completar

Objetivo: confirmar una transferencia por la interfaz y comprobar su estado pendiente,
su reserva y los saldos de Ana. Continúa la clase 05. Todo es ficticio: sin dinero real,
mensajes SMS, sesiones personales ni APIs de preparación.

## Preparación

Necesitás Node.js 24+, Git y Chromium. Banco y tests son proyectos distintos.
En el Bank Lab: `npm ci`, `npm run dev`; dejalo encendido en <http://127.0.0.1:4177>.
Clase: <http://127.0.0.1:4177/lecciones/confirmar-transferencia/>.

En tu repo de automatización, desde la rama donde completaste la clase 05:

```sh
git status
git switch -c clase/06-confirmar-transferencia
```

Antes de crear la rama, revisá y guardá cualquier cambio anterior que quieras conservar.
No reinicialices Git ni sobrescribas tu trabajo con el ZIP solución. Extraé el ZIP en
otra carpeta y copiá solamente el nuevo `tests/confirm-transfer.spec.js` de inicio.
Si usás el ZIP completo desde cero:

```sh
npm ci
npx playwright install chromium
npm test
```

Inicio acumulativo: **13 passed / 1 skipped**. Caso principal resuelto: **14 passed**.
Solución con reto: **15 passed**. `skipped` significa sin implementar, no aprobado.

## Recorrido manual

1. Práctica estable nueva, Ana `ana@demo.test` / `Practica2026!` (fixtures públicos).
2. Diaria $2.500, ahorro $600, reserva cero y ninguna transferencia.
3. Transferir: origen `ana-main` (ana.diaria), destino `bruno.diaria`, importe `100`.
4. Revisar: importe $100, comisión $1 y total $101. La cotización dura 90 segundos;
   si se venció durante tu exploración manual, cerrá y cotizá nuevamente.
5. En Confirmar transferencia, código ficticio `246810`, Confirmar y reservar.
6. Una operación Pendiente a bruno.diaria: $100, comisión $1, total $101.
7. No pulses Procesar. Volvé al resumen: diaria $2.399 disponibles, $101 reservados;
   ahorro $600. Total contable $3.100, reservado $101, disponible $2.999.

El contrato dice que pendiente todavía no acredita al receptor. Este caso observa
únicamente Ana: **no asegura haber comprobado la sesión de Bruno**.

## Construí el test

Quitá `.skip`, creá una práctica desde UI e iniciá sesión. Comprobá las precondiciones
y retomá la cotización de clase 05. Escribí las acciones dentro del diálogo correcto.
Después de confirmar, `toBeHidden()` espera el cierre, pero eso no demuestra el éxito.

```js
await expect(page.getByRole('article')).toHaveCount(1);
const operacion = page.getByRole('article', {
  name: /^Transferencia bruno\.diaria /,
});
await expect(operacion.getByRole('heading'))
  .toHaveText('$ 100,00 Pendiente');
```

La expresión regular fija el inicio del nombre e interpreta el punto del alias
literalmente. El identificador dinámico viene después: no lo adivinamos. La cantidad
se comprueba en toda la página de operaciones, que en una práctica nueva debe tener
una sola; el contenido se comprueba dentro de ese artículo.

Volvé a `/`, comprobá la diaria por su región y el ahorro por la suya. El disponible
total usa el contrato existente `getByTestId('available-total')`, no una posición ni
una clase CSS. Verificá también los textos exactos del contable y de la reserva.
El formato visible es ARS: `$ 2.399,00`; el formulario recibe pesos, no centavos.

```sh
npx playwright test confirm-transfer.spec.js --headed
npm run report
```

Usá aserciones con reintento; no `waitForTimeout()`, `.first()` ni clics forzados.
No hagas depender el caso de la práctica de clase 05: cada test arranca independiente.

## Reto: rechazo del código

Nuevo `tests/confirm-transfer-challenge.spec.js`, práctica estable nueva, misma
cotización, pero código `000000`. Debe aparecer una alerta con «incorrecto» dentro
del diálogo, que permanece abierto. Ese código cumple el formato de seis dígitos,
pero no autoriza la operación del laboratorio.

Cerrá el diálogo, navegá al resumen, esperá «Buen día, Ana.» y verificá:

- Cero artículos de transferencia.
- Diaria $2.500 y ahorro $600.
- Reservado total $0 y disponible total $3.100.

Esperar primero el error y después la página cargada evita aprobar una ausencia
de elementos antes de que la aplicación termine de responder. Estas comprobaciones
observan la UI: no son una auditoría de toda la base de datos.

```sh
npx playwright test confirm-transfer-challenge.spec.js --headed
npm test
git status
git add tests
git commit -m "test: comprobar transferencia pendiente y código rechazado"
git push -u origin clase/06-confirmar-transferencia
```

El push es opcional y requiere tu remoto ya configurado. Conservá el intento antes
de comparar con la solución. Todo queda local salvo que vos decidas subir tu repo.

## Si falla

- `ECONNREFUSED`: encendé el banco local en 4177.
- Browser ausente: `npx playwright install chromium`.
- Código vencido/cotización vencida: revisá que no haya pausas fijas entre cotizar y confirmar.
- Cuenta con valores distintos: asegurá práctica nueva por test.
- Hay más de un artículo: no ocultes el fallo eligiendo el primero; revisá aislamiento y envío.
- «Completada» en vez de «Pendiente»: no pulses Procesar en esta clase.

La clase 07 sobre cancelación es una propuesta, todavía no está implementada.
Fuentes: [localizadores](https://playwright.dev/docs/locators),
[aserciones](https://playwright.dev/docs/test-assertions),
[test IDs](https://playwright.dev/docs/locators#locate-by-test-id).

# Setup de la Base de Datos - SUPABASE (Método Sencillo)

Este documento explica cómo cargar tus datos en Supabase de la forma más fácil, sin necesidad de instalar Python ni programar nada.

---

## 1. Crear el Proyecto en Supabase
1. Entra en [Supabase.com](https://supabase.com/).
2. Crea un proyecto nuevo (**"New Project"**).
3. Ponle nombre, contraseña y elige la región (ej. Spain/Germany).

---

## 2. Crear las Tablas (Copiar y Pegar)
1. En el menú de la izquierda de Supabase, entra en el icono **"SQL Editor"**.
2. Haz clic en **"New Query"**.
3. Abre el archivo `c:\Portal OPE\db_setup.sql` en tu ordenador, copia TODO su contenido y pégalo en el editor de Supabase.
4. Pulsa el botón verde **"RUN"**. Esto creará automáticamente todas las tablas vacías.

---

## 3. Preparar tus Datos (Guardar como CSV)
Como Supabase no lee archivos Excel directamente (.xlsx), necesitamos guardarlos como CSV:
1. Abre tu archivo Excel (ej: `ALTIM_UATS...xlsx`).
2. Ve a **Archivo > Guardar como**.
3. En el tipo de archivo, elige **"CSV (delimitado por comas) (*.csv)"**.
4. Haz lo mismo con los archivos de BPML, Questionnaire y Best Practices.

---

## 4. Cargar los Datos (Importar CSV)
Ahora subiremos los archivos a las tablas que creamos en el Paso 2:
1. En Supabase, ve al icono **"Table Editor"** (el que parece una tabla/hoja de cálculo).
2. Selecciona la tabla donde quieres meter los datos (ej: `master_uats`).
3. Haz clic en el botón **"Insert"** y luego en **"Import data from CSV"**.
4. Arrastra tu archivo CSV generado en el paso anterior.
5. Supabase te mostrará las columnas. Asegúrate de que coinciden (ej: ID con ID, Nombre con Nombre) y dale a **"Import"**.

---

## 5. Conectar el Frontend a Supabase
Para que la aplicación web "hable" con tu base de datos y muestre los datos reales:
1. En Supabase, ve a **Settings** (icono de engranaje abajo a la izquierda).
2. Entra en **API**.
3. Copia el valor de **Project URL** y **anon public key**.
4. Abre el archivo `c:\Portal OPE\app.js` en tu ordenador.
5. Al principio del archivo, verás esto:
   ```javascript
   const SUPABASE_URL = ''; 
   const SUPABASE_ANON_KEY = ''; 
   ```
6. Pega tus valores entre las comillas.
7. Guarda el archivo y refresca tu navegador con `index.html`.

¡Ahora los módulos de Maestros y Clientes cargarán los datos directamente desde tu Supabase!

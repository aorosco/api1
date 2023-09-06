// Importa los módulos necesarios
const express = require("express");
const { Pool } = require("pg");

// Crea una instancia de Express y configura el puerto
const app = express();
const port = 4000;

// Configuración de la conexión a la base de datos PostgreSQL
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "api1",
    password: "123",
    port: 5432
});

// Define la clase Model para las operaciones CRUD en la tabla "usuarios"
class Model {
    async getUsuarios() {
        try {
            const { rows } = await pool.query("SELECT * FROM usuarios;");
            return rows;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getUsuario(id) {
        try {
            const { rows } = await pool.query("SELECT * FROM usuarios WHERE id=$1;", [id]);
            return rows[0];
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async createUsuario(usuario) {
        const { cedula_identidad, nombre, primer_apellido, segundo_apellido, fecha_nacimiento } = usuario;
        try {
            const query = "INSERT INTO usuarios (cedula_identidad, nombre, primer_apellido, segundo_apellido, fecha_nacimiento) VALUES ($1, $2, $3, $4, $5) RETURNING *";
            const values = [cedula_identidad, nombre, primer_apellido, segundo_apellido, fecha_nacimiento];
            const { rows } = await pool.query(query, values);
            return rows[0];
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async updateUsuario(id, usuario) {
        const { cedula_identidad, nombre, primer_apellido, segundo_apellido, fecha_nacimiento } = usuario;
        try {
            const query = "UPDATE usuarios SET cedula_identidad = $1, nombre = $2, primer_apellido = $3, segundo_apellido = $4, fecha_nacimiento = $5 WHERE id = $6 RETURNING *";
            const values = [cedula_identidad, nombre, primer_apellido, segundo_apellido, fecha_nacimiento, id];
            const { rows } = await pool.query(query, values);
            return rows[0];
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async deleteUsuario(id) {
        try {
            const query = "DELETE FROM usuarios WHERE id = $1 RETURNING *";
            const values = [id];
            const { rows } = await pool.query(query, values);
            return rows[0];
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getEdadPromedio() {
        try {
            const { rows } = await pool.query("SELECT AVG(EXTRACT(YEAR FROM age(fecha_nacimiento))) AS promedio_edad FROM usuarios;");
            console.log(rows[0]);
            return rows[0];
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

// Define la clase Controller para manejar las rutas y las operaciones CRUD
class Controller {
    constructor(model) {
        this.model = model;
    }

    async getUsuarios(req, res) {
        try {
            const usuarios = await this.model.getUsuarios();
            res.json(usuarios);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener los usuarios' });
        }
    }

    async getUsuario(req, res) {
        const { id } = req.params;
        try {
            const usuario = await this.model.getUsuario(id);
            if (usuario) {
                res.json(usuario);
            } else {
                res.status(404).json({ error: 'Usuario no encontrado' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener el usuario' });
        }
    }

    async createUsuario(req, res) {
        const nuevoUsuario = req.body;
        try {
            const usuarioCreado = await this.model.createUsuario(nuevoUsuario);
            res.status(201).json(usuarioCreado);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al crear el usuario' });
        }
    }

    async updateUsuario(req, res) {
        const { id } = req.params;
        const usuarioActualizado = req.body;
        try {
            const usuario = await this.model.updateUsuario(id, usuarioActualizado);
            if (usuario) {
                res.json(usuario);
            } else {
                res.status(404).json({ error: 'Usuario no encontrado' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar el usuario' });
        }
    }

    async deleteUsuario(req, res) {
        const { id } = req.params;
        try {
            const usuarioEliminado = await this.model.deleteUsuario(id);
            if (usuarioEliminado) {
                res.json(usuarioEliminado);
            } else {
                res.status(404).json({ error: 'Usuario no encontrado' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar el usuario' });
        }
    }

    async getPromedioEdad(req, res) {
        try {
            const promedioEdad = await this.model.getEdadPromedio();
            res.json(promedioEdad);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener el promedio de edad' });
        }
    }

    async getVersion(req, res) {
        try {
            const versionAPI = "1.0"; // Puedes ajustar esto según la versión actual de tu API
            res.json({ version: versionAPI });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener la versión del API' });
        }
    }
}

// Crea una instancia del modelo y del controlador
const model = new Model();
const controller = new Controller(model);


// Configura las rutas y las operaciones CRUD en Express
app.use(express.json()); // Middleware para analizar el cuerpo JSON de las solicitudes
app.get('/usuarios', (req, res) => controller.getUsuarios(req, res));
app.get('/usuarios/:id', (req, res) => controller.getUsuario(req, res));
app.post('/usuarios', (req, res) => controller.createUsuario(req, res));
app.put('/usuarios/:id', (req, res) => controller.updateUsuario(req, res));
app.delete('/usuarios/:id', (req, res) => controller.deleteUsuario(req, res));

// Nuevos endpoints
app.get('/promedio-edad', (req, res) => controller.getPromedioEdad(req, res));
app.get('/estado', (req, res) => controller.getVersion(req, res));

// Inicia el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});

export class AppError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string
    ) {
        super(message);

        this.name = "AppError";

        Object.setPrototypeOf(this, new.target.prototype); // esto ayuda a mantener correctamente la herencia de Error en determinadas configuraciones de compilación de JavaScript.
    }
}
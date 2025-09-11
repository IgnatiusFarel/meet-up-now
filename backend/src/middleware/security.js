import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';

export const setupSecurity = (app) => {
    app.use(helmet()); 
    app.use(cors({
        origin: 'localhost:5173', // process.env.FRONTEND_URL, 
        credentials: true, 
        optionsSuccessStatus: 200
    }));

    app.use(mongoSanitize());

    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
    });
}